import { db, TranslationJob, BookRecord, ApiKeyConfig } from './db.ts';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// System prompt as specified in the brief + strict no-summarization & continuity
const SYSTEM_INSTRUCTION_TRANSLATOR = `Role & Objective:
You are an elite, professional book translator and document formatter specializing in translating long-form English books into fluent, natural, and publication-ready Persian (Farsi).

Context & Input Processing:
- You will receive sections/chapters of a book along with project-specific metadata (Tone, Custom Glossary, Formatting Rules).

Translation Principles:
1. Fluency & Natural Phrasing: Do not produce robotic or literal word-for-word translations. Rephrase idioms and sentences naturally into fluent, idiomatic, publication-grade Persian while strictly preserving the author's original meaning, subtlety, and intent.
2. Tone Adaptation: Adopt the exact specified tone for the book:
   - Spiritual / Philosophical: Reverent, deep, meditative, poetic yet crystal clear (e.g. «آگاهی»، «حضور»، «مشاهده‌گر»).
   - Novel / Narrative: Engaging, fluid, descriptive, preserving literary rhythm and dialogue dynamics.
   - Self-Help / Psychology: Clear, empowering, instructional, and modern Persian.
   - Academic / Technical / Mathematics / Aerospace: Precise, formal, and rigorously structured.
   - Economics / Business: Analytical, professional, and standard terminology.
3. Custom Glossary Priority: Strictly prioritize the provided custom glossary mapping over default translations.
4. Strict No-Summarization Guarantee: Under NO circumstances are you allowed to summarize, condense, abbreviate, skip, or omit any paragraph, sentence, metaphor, example, or dialogue. Every single paragraph and thought must be translated in full completeness.
5. Faithful & Direct Translation: Translate all text faithfully, directly, and without censorship, puritanical sanitization, moralizing, or softening.
6. Strict Chunk Cleanliness & Continuity (Zero Artificial Headers): Under NO circumstances are you allowed to output artificial chunk markers or part numbers such as «مقدمه و بخش نخست (بخش ۱)»، «بخش ۱»، «بخش ۲»، «(بخش ۱)», etc.

Formatting & Structural Rules (HTML / Rich Styling):
- Enclose the output in clean, semantic HTML format:
  - Major Titles: <h1 style="color: #1a365d; font-size: 24pt; margin-bottom: 20px; text-align: center;">...</h1>
  - Major Subheadings: <h2 style="color: #2b6cb0; font-size: 18pt; margin-top: 25px; margin-bottom: 12px;">...</h2>
  - Minor Sections: <h3 style="color: #2c5282; font-size: 14pt; margin-top: 15px; margin-bottom: 8px;">...</h3>
  - Body Paragraphs: <p style="line-height: 1.9; font-size: 12pt; text-align: justify; margin-bottom: 14px;">...</p>
  - Quotes / Callouts: <blockquote style="border-right: 4px solid #3182ce; padding: 10px 18px; margin: 15px 0; background: #f7fafc; color: #4a5568; font-style: italic;">...</blockquote>
  - Key Terms / Glossary Highlights: <span style="color: #9b2c2c; font-weight: bold;">...</span>

Output Expectation:
Return ONLY the formatted, translated Persian text inside the specified HTML structure. Do not include conversational filler, introductory remarks, or concluding notes.`;

function cleanChapterTitle(title: string): string {
  if (!title) return 'فصل کتاب';
  return title
    .replace(/\s*[\(\[\{]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}]/gi, '')
    .replace(/\s*[-–—|:]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+/gi, '')
    .replace(/\s+بخش\s+[0-9۰-۹IVXLCDMivxlcdm]+$/gi, '')
    .trim() || 'فصل کتاب';
}

function sanitizeTranslatedHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h[1-3][^>]*>\s*مقدمه و بخش نخست\s*(?:\([^\)]*\))?\s*<\/h[1-3]>/gi, '')
    .replace(/<h[1-3][^>]*>[^<]*[\(\[\{]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}][^<]*<\/h[1-3]>/gi, '')
    .replace(/<p[^>]*>\s*[\(\[\{]?\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}]?\s*<\/p>/gi, '')
    .trim();
}

// User-to-Key sticky map to ensure different users get assigned different keys
const userKeyAssignments = new Map<string, string>();
let roundRobinKeyIndex = 0;

export class QueueManager {
  private isProcessing = false;
  private activeJobIds = new Set<string>();

  constructor() {
    this.startWorker();
  }

  public startWorker() {
    setInterval(() => {
      this.tick().catch(err => console.error('[QueueWorker] Tick error:', err));
    }, 3500);
  }

  public getStats() {
    const allJobs = db.getActiveJobs();
    return {
      activeProcessingCount: this.activeJobIds.size,
      queuedJobsCount: allJobs.filter(j => j.status === 'queued').length,
      processingJobsCount: allJobs.filter(j => j.status === 'processing').length,
      totalActiveJobs: allJobs.length,
      isWorkerRunning: true,
      lastTickAt: Date.now(),
    };
  }

  // Get or assign an API key specifically for a user
  private getKeyForUser(userId: string): ApiKeyConfig | null {
    const allKeys = db.getApiKeys().filter(k => k.isActive);
    if (allKeys.length === 0) {
      // Fallback to process.env.GEMINI_API_KEY
      if (process.env.GEMINI_API_KEY) {
        return {
          id: 'env_fallback_key',
          name: 'Environment Gemini Key',
          provider: 'gemini',
          apiKey: process.env.GEMINI_API_KEY.trim(),
          model: 'gemini-3.8-flash',
          isActive: true,
          priority: 1,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokensUsed: 0,
          rpmCount: 0,
          cooldownUntil: 0,
        };
      }
      return null;
    }

    const now = Date.now();
    // Filter keys that are NOT currently in cooldown
    const availableKeys = allKeys.filter(k => k.cooldownUntil <= now);
    const candidateKeys = availableKeys.length > 0 ? availableKeys : allKeys;

    // Check if user already has an active key assigned that is not in cooldown
    const assignedKeyId = userKeyAssignments.get(userId);
    if (assignedKeyId) {
      const assigned = candidateKeys.find(k => k.id === assignedKeyId);
      if (assigned && assigned.cooldownUntil <= now) {
        return assigned;
      }
    }

    // Pick next key using round-robin to evenly distribute concurrent users across available keys
    roundRobinKeyIndex = (roundRobinKeyIndex + 1) % candidateKeys.length;
    const selected = candidateKeys[roundRobinKeyIndex];
    userKeyAssignments.set(userId, selected.id);
    return selected;
  }

  // Auto-switch to next key when an error or quota is encountered
  private switchUserToNextKey(userId: string, currentKeyId: string): ApiKeyConfig | null {
    const allKeys = db.getApiKeys().filter(k => k.isActive && k.id !== currentKeyId);
    const now = Date.now();
    const available = allKeys.filter(k => k.cooldownUntil <= now);
    const pool = available.length > 0 ? available : allKeys;

    if (pool.length > 0) {
      const nextKey = pool[0];
      userKeyAssignments.set(userId, nextKey.id);
      console.log(`[QueueWorker] Switched user ${userId} to next API key: ${nextKey.name}`);
      return nextKey;
    }

    return null;
  }

  private async tick() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const maxConcurrent = db.getSettings().security.maxConcurrentJobs || 4;
      const queuedJobs = db.getActiveJobs();

      for (const job of queuedJobs) {
        if (this.activeJobIds.size >= maxConcurrent) break;
        if (this.activeJobIds.has(job.id)) continue;

        // Launch background processing for this job
        this.activeJobIds.add(job.id);
        this.processJob(job).finally(() => {
          this.activeJobIds.delete(job.id);
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: TranslationJob) {
    const book = db.getBookById(job.bookId);
    if (!book) {
      job.status = 'failed';
      job.error = 'کتاب مرتبط با این پردازش در پایگاه داده یافت نشد.';
      db.saveJob(job);
      return;
    }

    job.status = 'processing';
    book.status = 'translating';
    db.saveJob(job);
    db.saveBook(book);

    console.log(`[QueueWorker] Processing Book "${book.title}" (Job: ${job.id}) for User: ${job.userId}`);

    // Process chunks one by one
    for (let cIdx = 0; cIdx < book.chunks.length; cIdx++) {
      // Check if job was stopped or cancelled by user
      const freshJob = db.getJobById(job.id);
      if (!freshJob || freshJob.status === 'stopped') {
        console.log(`[QueueWorker] Job ${job.id} was stopped. Halting worker.`);
        return;
      }

      const chunk = book.chunks[cIdx];

      // Skip already completed chunks
      if (chunk.status === 'completed' && chunk.translatedHtml) {
        continue;
      }

      job.currentChunkTitle = chunk.chapterTitle || `فصل ${chunk.chapterNumber}`;
      job.progressPercent = Math.round((cIdx / book.chunks.length) * 100);
      db.saveJob(job);

      let translatedHtml = '';
      let chunkError = '';
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && !translatedHtml) {
        attempts++;
        let keyConfig = this.getKeyForUser(job.userId);
        if (!keyConfig) {
          chunkError = 'هیچ کلید فعالی برای اتصال به هوش مصنوعی یافت نشد.';
          break;
        }

        job.assignedKeyMasked = keyConfig.name;
        db.saveJob(job);

        try {
          const t0 = Date.now();
          translatedHtml = await this.translateChunkWithAi(chunk.englishText, book, keyConfig);
          const latency = Date.now() - t0;

          // Record key stats
          keyConfig.totalRequests++;
          keyConfig.successfulRequests++;
          keyConfig.lastLatencyMs = latency;
          keyConfig.totalTokensUsed += (chunk.estimatedTokens || 100) * 2;
          db.saveApiKey(keyConfig);

          chunk.status = 'completed';
          chunk.translatedHtml = translatedHtml;
          chunk.keyUsed = keyConfig.name;
          chunk.modelUsed = keyConfig.model || 'gemini-3.8-flash';
          chunk.translatedAt = Date.now();
          chunk.errorMessage = undefined;

          job.completedChunks = book.chunks.filter(c => c.status === 'completed').length;
          job.progressPercent = Math.round((job.completedChunks / book.chunks.length) * 100);
          db.saveJob(job);
          db.saveBook(book);

          // Small interval between chunks to respect API limits
          await new Promise(r => setTimeout(r, 2200));
        } catch (err: any) {
          const errMsg = String(err?.message || err);
          console.warn(`[QueueWorker] Chunk translation attempt ${attempts} failed: ${errMsg}`);
          chunkError = errMsg;

          if (keyConfig) {
            keyConfig.failedRequests++;
            // If quota limit or high demand, mark cooldown and switch key immediately
            if (errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('503') || errMsg.includes('UNAVAILABLE')) {
              keyConfig.cooldownUntil = Date.now() + 60000;
              db.saveApiKey(keyConfig);
              this.switchUserToNextKey(job.userId, keyConfig.id);
            }
          }

          await new Promise(r => setTimeout(r, 3000));
        }
      }

      if (!translatedHtml) {
        chunk.status = 'error';
        chunk.errorMessage = chunkError;
        db.saveBook(book);
        job.error = `خطا در ترجمه بخش: ${chunkError}`;
        db.saveJob(job);
      }
    }

    // Check final status
    const allCompleted = book.chunks.every(c => c.status === 'completed');
    if (allCompleted) {
      job.status = 'completed';
      job.progressPercent = 100;
      job.completedAt = Date.now();
      book.status = 'completed';
      console.log(`[QueueWorker] Book "${book.title}" successfully completed!`);
    } else {
      const anyDone = book.chunks.some(c => c.status === 'completed');
      job.status = anyDone ? 'completed' : 'failed';
      book.status = anyDone ? 'completed' : 'error';
    }

    db.saveJob(job);
    db.saveBook(book);
  }

  private async translateChunkWithAi(englishText: string, book: BookRecord, keyConfig: ApiKeyConfig): Promise<string> {
    const tone = book.tone || 'معنوی و خودشناسی';
    let glossaryText = 'واژه‌نامه تخصصی کتاب';
    if (Array.isArray(book.glossary) && book.glossary.length > 0) {
      glossaryText = book.glossary.map(g => `  * ${g.en} -> ${g.fa}`).join('\n');
    }

    // Preserve images
    const imageMap = new Map<string, string>();
    let cleanEnglish = englishText;
    const imgRegex = /<img\s+[^>]*src=["'](data:[^"']+)["'][^>]*>/gi;
    let imgIdx = 0;
    cleanEnglish = englishText.replace(imgRegex, (tag) => {
      const token = `[[IMAGE_SLOT_${imgIdx}]]`;
      imageMap.set(token, tag);
      imgIdx++;
      return `\n${token}\n`;
    });

    const userPrompt = `[CONFIGURATION]
- Book Tone: ${tone}
- Chapter Context: ${cleanChapterTitle(book.title)}
- Glossary:
${glossaryText}
[CRITICAL INSTRUCTION]
1. Translate every paragraph and dialogue in full without omission or summary.
2. Do NOT invent or output artificial chunk numbers or section labels such as "بخش ۱", "بخش ۲", "(بخش ۱)", "Part 1", etc.

[INPUT TEXT TO TRANSLATE]
${cleanEnglish}`;

    let resultHtml = '';

    if (keyConfig.provider === 'gemini') {
      const ai = new GoogleGenAI({
        apiKey: keyConfig.apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' }, timeout: 45000 },
      });

      const candModels = Array.from(new Set([
        keyConfig.model || 'gemini-3.8-flash',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ]));

      let lastErr: any = null;
      for (const m of candModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: userPrompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION_TRANSLATOR,
              temperature: 0.35,
              topP: 0.95,
              thinkingConfig: { thinkingLevel: m.includes('lite') ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW },
            },
          });
          resultHtml = response.text || '';
          break;
        } catch (mErr: any) {
          lastErr = mErr;
          const msg = String(mErr?.message || mErr);
          if (msg.includes('503') || msg.includes('404') || msg.includes('UNAVAILABLE')) {
            continue;
          }
          throw mErr;
        }
      }

      if (!resultHtml && lastErr) throw lastErr;
    } else {
      // OpenAI / GLM (Zhipu AI) / MiniMax / OpenRouter / DeepSeek / Intermediary Proxy (OneAPI)
      let defaultBaseURL = 'https://openrouter.ai/api/v1';
      if (keyConfig.provider === 'glm') defaultBaseURL = 'https://open.bigmodel.cn/api/paas/v4';
      else if (keyConfig.provider === 'minimax') defaultBaseURL = 'https://api.minimax.chat/v1';
      else if (keyConfig.provider === 'openai') defaultBaseURL = 'https://api.openai.com/v1';
      else if (keyConfig.provider === 'deepseek') defaultBaseURL = 'https://api.deepseek.com';
      else if (keyConfig.provider === 'proxy') defaultBaseURL = 'https://api.oneapi.ir/v1';

      const baseURL = (keyConfig.baseURL && keyConfig.baseURL.trim()) || defaultBaseURL;
      const targetUrl = `${baseURL.replace(/\/+$/, '')}/chat/completions`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyConfig.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: keyConfig.model || 'deepseek/deepseek-r1',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION_TRANSLATOR },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.35,
          top_p: 0.95,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      resultHtml = data.choices?.[0]?.message?.content || '';
    }

    // Clean markdown codeblocks
    let clean = resultHtml.trim();
    if (clean.startsWith('```html')) {
      clean = clean.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    clean = sanitizeTranslatedHtml(clean);

    // Restore images
    if (imageMap.size > 0) {
      for (const [token, fullTag] of imageMap.entries()) {
        if (clean.includes(token)) {
          clean = clean.replaceAll(token, `<div class="book-illustration-wrap my-4 text-center">${fullTag}</div>`);
        } else {
          clean += `\n<div class="book-illustration-wrap my-4 text-center">${fullTag}</div>\n`;
        }
      }
    }

    return clean;
  }
}

export const queueManager = new QueueManager();
