import { APIServerEndpoint, ProviderType, GlossaryItem } from '../types.ts';
import { cleanChapterTitle, sanitizeTranslatedHtml } from './exporter.ts';

export type ConnectionMode = 'auto' | 'direct' | 'server';

export const STORAGE_CONNECTION_MODE = 'persian_book_translator_connection_mode_v1';
export const STORAGE_CUSTOM_BACKEND_URL = 'persian_book_translator_custom_backend_url_v1';
export const STORAGE_CLIENT_KEYS = 'persian_book_translator_client_keys_v1';

export function getClientGeminiKeys(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_CLIENT_KEYS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter((k: any) => typeof k === 'string' && k.trim().length > 8);
    }
  } catch (e) {}
  return [];
}

export function addClientGeminiKey(key: string): void {
  try {
    const keys = getClientGeminiKeys();
    const clean = key.trim();
    if (clean && !keys.includes(clean)) {
      keys.push(clean);
      localStorage.setItem(STORAGE_CLIENT_KEYS, JSON.stringify(keys));
    }
  } catch (e) {}
}

export function removeClientGeminiKey(masked: string): void {
  try {
    const keys = getClientGeminiKeys();
    const filtered = keys.filter(k => `${k.slice(0, 4)}...${k.slice(-4)}` !== masked);
    localStorage.setItem(STORAGE_CLIENT_KEYS, JSON.stringify(filtered));
  } catch (e) {}
}

export function getConnectionMode(): ConnectionMode {
  try {
    const saved = localStorage.getItem(STORAGE_CONNECTION_MODE);
    if (saved === 'direct' || saved === 'server' || saved === 'auto') return saved;
  } catch (e) {
    // localStorage unavailable
  }
  return 'auto';
}

export function setConnectionMode(mode: ConnectionMode): void {
  try {
    localStorage.setItem(STORAGE_CONNECTION_MODE, mode);
  } catch (e) {
    console.warn('Could not save connection mode');
  }
}

export function getCustomBackendUrl(): string {
  try {
    return (localStorage.getItem(STORAGE_CUSTOM_BACKEND_URL) || '').trim().replace(/\/+$/, '');
  } catch (e) {
    return '';
  }
}

export function setCustomBackendUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_CUSTOM_BACKEND_URL, url.trim().replace(/\/+$/, ''));
  } catch (e) {
    console.warn('Could not save custom backend URL');
  }
}

export function resolveApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const customUrl = getCustomBackendUrl();
  if (customUrl) {
    return `${customUrl}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

export function normalizeBaseUrl(provider: ProviderType, baseURL?: string): string {
  let url = (baseURL || '').trim().replace(/\/+$/, '');
  if (!url) {
    if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
    if (provider === 'deepseek') return 'https://api.deepseek.com/v1';
    if (provider === 'glm') return 'https://open.bigmodel.cn/api/paas/v4';
    if (provider === 'openai') return 'https://api.openai.com/v1';
    if (provider === 'custom') return 'https://api.groq.com/openai/v1';
    return '';
  }

  if (url.endsWith('/chat/completions')) {
    url = url.slice(0, -'/chat/completions'.length).replace(/\/+$/, '');
  } else if (url.endsWith('/completions')) {
    url = url.slice(0, -'/completions'.length).replace(/\/+$/, '');
  }

  if (provider === 'openrouter' || url.includes('openrouter.ai')) {
    if (url === 'https://openrouter.ai' || url === 'http://openrouter.ai') return 'https://openrouter.ai/api/v1';
    if (url.endsWith('/api')) return `${url}/v1`;
  } else if (provider === 'openai' || url.includes('openai.com')) {
    if (url === 'https://api.openai.com' || url === 'http://api.openai.com') return 'https://api.openai.com/v1';
  } else if (provider === 'deepseek' || url.includes('deepseek.com')) {
    if (url === 'https://api.deepseek.com' || url === 'http://api.deepseek.com') return 'https://api.deepseek.com/v1';
  }

  return url;
}

export const SYSTEM_INSTRUCTION_TRANSLATOR = `Role & Objective:
You are an elite, professional book translator and document formatter specializing in translating long-form English books into fluent, natural, and publication-ready Persian (Farsi).

Context & Input Processing:
- You will receive sections/chapters of a book along with project-specific metadata (Tone, Custom Glossary, Formatting Rules).
- If context caching is active, utilize previously cached terminology and narrative flow to maintain 100% voice and naming consistency.

Translation Principles:
1. Fluency & Natural Phrasing: Do not produce robotic or literal word-for-word translations. Rephrase idioms and sentences naturally into fluent, idiomatic, publication-grade Persian while strictly preserving the author's original meaning, subtlety, and intent.
2. Tone Adaptation: Adopt the exact specified tone for the book:
   - Spiritual / Philosophical: Reverent, deep, meditative, poetic yet crystal clear (e.g., using terms like «آگاهی»، «حضور»، «مشاهده‌گر»).
   - Novel / Narrative: Engaging, fluid, descriptive, preserving literary rhythm and dialogue dynamics.
   - Self-Help / Psychology: Clear, empowering, instructional, and modern Persian.
   - Academic / Technical: Precise, formal, and structured.
3. Custom Glossary Priority: Strictly prioritize the provided custom glossary mapping over default translations. Never translate proprietary terms inconsistently.
4. Strict No-Summarization Guarantee: Under NO circumstances are you allowed to summarize, condense, abbreviate, skip, or omit any paragraph, sentence, metaphor, example, or dialogue. Every single paragraph and thought must be translated in full completeness.
5. Faithful & Uncensored Translation: This is an official literary and scholarly book translation. Translate all text faithfully, directly, and without censorship, puritanical sanitization, moralizing, or softening. Preserve the author's original voice, register, realism, and vocabulary completely.
6. Strict Chunk Cleanliness & Continuity (Zero Artificial Headers): Under NO circumstances are you allowed to output artificial chunk markers, part numbers, or invented headings such as «مقدمه و بخش نخست (بخش ۱)»، «بخش ۱»، «بخش ۲»، «(بخش ۱)»، "Part 1", "[Part 1]", etc., into the translation. Do NOT invent or inject a chapter heading unless the original English input text explicitly starts with an author's original title/heading. The chunks must flow together as seamless, continuous prose without artificial breaks.

Formatting & Structural Rules (HTML / Rich Styling):
To allow seamless export to DOCX and PDF with color-coded typography:
- Enclose the output in clean, semantic HTML format:
  - Book / Chapter Titles: <h1 style="color: #1a365d; font-size: 24pt; margin-bottom: 20px; text-align: center;">...</h1>
  - Major Subheadings: <h2 style="color: #2b6cb0; font-size: 18pt; margin-top: 25px; margin-bottom: 12px;">...</h2>
  - Minor Sections: <h3 style="color: #2c5282; font-size: 14pt; margin-top: 15px; margin-bottom: 8px;">...</h3>
  - Body Paragraphs: <p style="line-height: 1.9; font-size: 12pt; text-align: justify; margin-bottom: 14px;">...</p>
  - Quotes / Callouts: <blockquote style="border-right: 4px solid #3182ce; padding: 10px 18px; margin: 15px 0; background: #f7fafc; color: #4a5568; font-style: italic;">...</blockquote>
  - Key Terms / Glossary Highlights: <span style="color: #9b2c2c; font-weight: bold;">...</span>

Output Expectation:
Return ONLY the formatted, translated Persian text inside the specified HTML structure. Do not include conversational filler, introductory remarks, or concluding notes.`;

// Test a server connection: Try backend proxy first, then direct browser fetch as fallback
export async function testServerConnection(
  server: { providerType: ProviderType; apiKey: string; baseURL: string; model: string },
  forcedMode?: ConnectionMode
): Promise<{ success: boolean; latencyMs: number; error?: string; isDirectClient?: boolean; response?: string }> {
  const mode = forcedMode || getConnectionMode();
  const t0 = Date.now();

  // If mode is 'server' or 'auto', try backend proxy first
  if (mode !== 'direct') {
    try {
      const targetUrl = resolveApiUrl('/api/keys/test');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          provider: server.providerType,
          apiKey: server.apiKey,
          baseURL: server.baseURL,
          model: server.model,
        }),
      });
      clearTimeout(timeoutId);

      const rawText = await res.text();
      const trimmed = rawText.trim();
      const isHtml = trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html');

      if (!isHtml) {
        try {
          const data = JSON.parse(rawText);
          if (res.ok && data?.success) {
            return {
              success: true,
              latencyMs: data.latencyMs || (Date.now() - t0),
              isDirectClient: false,
              response: data.response || 'PONG_OK',
            };
          }
          if (mode === 'server') {
            return {
              success: false,
              latencyMs: Date.now() - t0,
              error: data?.error || `خطای سرور HTTP ${res.status}`,
              isDirectClient: false,
            };
          }
        } catch {
          // Parse error, proceed to direct fallback if auto
        }
      }
    } catch (backendErr: any) {
      if (mode === 'server') {
        return {
          success: false,
          latencyMs: Date.now() - t0,
          error: backendErr?.message || 'عدم دسترسی به سرور بک‌اند',
          isDirectClient: false,
        };
      }
    }
  }

  // DIRECT BROWSER CONNECTION (Fallback when running in static build / IIS without reverse proxy)
  return testDirectFromBrowser(server);
}

// Test directly from user's browser
export async function testDirectFromBrowser(server: {
  providerType: ProviderType;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<{ success: boolean; latencyMs: number; error?: string; isDirectClient: boolean; response?: string }> {
  const t0 = Date.now();

  if (server.providerType === 'gemini') {
    const key = server.apiKey?.trim();
    if (!key || key.length < 8) {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        error: 'برای اتصال مستقیم به گوگل جمینای در محیط بیلد، وارد کردن کلید Gemini API اختصاصی الزامی است.',
        isDirectClient: true,
      };
    }

    const testModel = server.model || 'gemini-2.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${encodeURIComponent(key)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping test. Reply with exact word: PONG_OK' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          latencyMs: Date.now() - t0,
          error: data?.error?.message || `خطای جمینای HTTP ${res.status}`,
          isDirectClient: true,
        };
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'PONG_OK';
      return {
        success: true,
        latencyMs: Date.now() - t0,
        response: text,
        isDirectClient: true,
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        error: err?.message || 'خطا در اتصال مستقیم به گوگل جمینای از مرورگر (وضعیت اینترنت یا VPN را بررسی فرمایید)',
        isDirectClient: true,
      };
    }
  }

  // Non-Gemini OpenAI-compatible providers
  const key = server.apiKey?.trim();
  if (!key || key.length < 4) {
    return {
      success: false,
      latencyMs: Date.now() - t0,
      error: 'کلید API برای این سرور وارد نشده است.',
      isDirectClient: true,
    };
  }

  const cleanBase = normalizeBaseUrl(server.providerType, server.baseURL);
  const targetUrl = `${cleanBase.replace(/\/+$/, '')}/chat/completions`;
  const testModel = server.model || (server.providerType === 'openrouter' ? 'deepseek/deepseek-r1' : 'gpt-4o-mini');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 22000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    };

    if (server.providerType === 'openrouter' || cleanBase.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.origin || 'https://openrouter.ai';
      headers['X-Title'] = 'Persian Book Translator';
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'Reply with exact word: PONG_OK' }],
        max_tokens: 10,
      }),
    });
    clearTimeout(timeoutId);

    const raw = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        error: `پاسخ وب HTML از آدرس دریافت شد (کد ${res.status}). لطفاً آدرس Base URL را بررسی نمایید.`,
        isDirectClient: true,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        error: data?.error?.message || `خطای سرور ارائه‌دهنده HTTP ${res.status}: ${res.statusText}`,
        isDirectClient: true,
      };
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || 'PONG_OK';
    return {
      success: true,
      latencyMs: Date.now() - t0,
      response: text,
      isDirectClient: true,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - t0,
      error: err?.message || 'خطا در ارتباط با سرور ارائه‌دهنده از طریق مرورگر (CORS یا اینترنت)',
      isDirectClient: true,
    };
  }
}

// Restore high-resolution embedded images into translated Persian HTML
export function restoreImages(html: string, imageMap: Map<string, string>): string {
  if (imageMap.size === 0) return html;
  let restored = html;
  for (const [token, fullTag] of imageMap.entries()) {
    if (restored.includes(token)) {
      restored = restored.replaceAll(token, `<div class="book-illustration-wrap my-4 text-center">${fullTag}</div>`);
    } else {
      restored += `\n<div class="book-illustration-wrap my-4 text-center">${fullTag}</div>\n`;
    }
  }
  return restored;
}

// Execute translation directly from client when backend /api/translate is offline or in static build
export async function translateDirectFromClient({
  englishText,
  chapterTitle,
  tone,
  glossary,
  serverPool,
}: {
  englishText: string;
  chapterTitle?: string;
  tone?: string;
  glossary?: GlossaryItem[];
  serverPool: APIServerEndpoint[];
}): Promise<{ translatedHtml: string; serverUsed: string; modelUsed: string; switchOccurred: boolean }> {
  // Extract images
  const imagePlaceholderMap = new Map<string, string>();
  let cleanEnglishText = englishText;
  const imgRegex = /<img\s+[^>]*src=["'](data:[^"']+)["'][^>]*>/gi;
  let imgIndex = 0;
  cleanEnglishText = englishText.replace(imgRegex, (fullImgTag) => {
    const placeholderToken = `[[IMAGE_PRESERVED_SLOT_${imgIndex}]]`;
    imagePlaceholderMap.set(placeholderToken, fullImgTag);
    imgIndex++;
    return `\n${placeholderToken}\n`;
  });

  const hasImages = imagePlaceholderMap.size > 0;

  let glossaryText = 'واژه‌نامه عمومی';
  if (Array.isArray(glossary) && glossary.length > 0) {
    glossaryText = glossary.map(g => `  * ${g.en} -> ${g.fa}`).join('\n');
  }

  const userPrompt = `[CONFIGURATION]
- Book Tone: ${tone || 'معنوی و خودشناسی'}
- Chapter / Section Context: ${cleanChapterTitle(chapterTitle || 'بخش جاری کتاب')}
- Glossary / واژه‌نامه اختصاصی:
${glossaryText}
${hasImages ? `\n[IMAGE PRESERVATION INSTRUCTION]\nThis text contains image placeholders like [[IMAGE_PRESERVED_SLOT_0]]. You MUST preserve every placeholder intact at its exact corresponding position between the translated paragraphs in Persian. Do NOT remove or modify image placeholders.\n` : ''}
[CRITICAL INSTRUCTION]
1. Do NOT summarize. Translate every single sentence, dialogue, nuance, and paragraph verbatim into fluent, natural Persian without omission or censorship.
2. Do NOT invent, add, or output artificial chunk numbers, section labels, or headers such as "بخش ۱", "بخش ۲", "(بخش ۱)", "Part 1", etc. Translate only the actual text content.

[INPUT TEXT TO TRANSLATE]
${cleanEnglishText}`;

  const activeServers = serverPool.filter(s => s.isEnabled);
  if (activeServers.length === 0) {
    throw new Error('هیچ سرور فعالی در استخر سرورها انتخاب نشده است. لطفاً از بخش «ویرایش سرورها» حداقل یک سرور را فعال کنید.');
  }

  const errors: string[] = [];

  for (let sIdx = 0; sIdx < activeServers.length; sIdx++) {
    const server = activeServers[sIdx];
    
    // Extract candidate keys for this server (comma or newline separated)
    const serverRawKeys = (server.apiKey || '').split(/[,\n]/).map(k => k.trim()).filter(Boolean);
    
    // If Gemini and no keys entered in this server, also check global client keys from localStorage
    if (server.providerType === 'gemini' && serverRawKeys.length === 0) {
      const globalKeys = getClientGeminiKeys();
      serverRawKeys.push(...globalKeys);
    }

    if (serverRawKeys.length === 0 && server.providerType !== 'gemini') {
      errors.push(`سرور «${server.name}»: کلید API وارد نشده است`);
      continue;
    }

    // Try keys sequentially for this server (or empty string fallback)
    const candidateKeys = serverRawKeys.length > 0 ? serverRawKeys : [''];

    for (let kIdx = 0; kIdx < candidateKeys.length; kIdx++) {
      const currentKey = candidateKeys[kIdx];
      const isSwitch = sIdx > 0 || kIdx > 0;

      try {
        if (server.providerType === 'gemini') {
          if (!currentKey) {
            throw new Error('کلید API برای سرور جمینای وارد نشده است.');
          }

          // Candidate models with fast fallback if 503 high demand
          const candidateModels = Array.from(new Set([
            server.model || 'gemini-2.5-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
          ]));

          let lastModelErr: any = null;
          for (const candModel of candidateModels) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${candModel}:generateContent?key=${encodeURIComponent(currentKey)}`;
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 40000);

              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_TRANSLATOR }] },
                  contents: [{ parts: [{ text: userPrompt }] }],
                  generationConfig: {
                    temperature: 0.35,
                    topP: 0.95,
                  },
                }),
              });
              clearTimeout(timeoutId);

              const data = await res.json();
              if (!res.ok) {
                const errMsg = data?.error?.message || `خطای HTTP ${res.status}`;
                if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('404')) {
                  lastModelErr = new Error(errMsg);
                  continue;
                }
                throw new Error(errMsg);
              }

              let rawHtml = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
              if (rawHtml.startsWith('```html')) {
                rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
              } else if (rawHtml.startsWith('```')) {
                rawHtml = rawHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
              }

              const masked = `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}`;
              console.log(`[Auto-Switching Direct Client] Success via "${server.name}" using Key ${masked}`);

              return {
                translatedHtml: restoreImages(sanitizeTranslatedHtml(rawHtml), imagePlaceholderMap),
                serverUsed: `${server.name}${isSwitch ? ' (سوئیچ خودکار)' : ''}`,
                modelUsed: candModel,
                switchOccurred: isSwitch,
              };
            } catch (mErr: any) {
              lastModelErr = mErr;
              if (mErr.message?.includes('503') || mErr.message?.includes('high demand')) {
                continue;
              }
              throw mErr;
            }
          }
          if (lastModelErr) throw lastModelErr;
        } else {
          // OpenAI-compatible (OpenRouter, DeepSeek, OpenAI, GLM, Groq)
          const cleanBase = normalizeBaseUrl(server.providerType, server.baseURL);
          const targetUrl = `${cleanBase.replace(/\/+$/, '')}/chat/completions`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`,
          };

          if (server.providerType === 'openrouter' || cleanBase.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = window.location.origin || 'https://openrouter.ai';
            headers['X-Title'] = 'Persian Book Translator';
          }

          const res = await fetch(targetUrl, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify({
              model: server.model,
              messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION_TRANSLATOR },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.35,
              top_p: 0.95,
            }),
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error?.message || `خطای HTTP ${res.status}: ${res.statusText}`);
          }

          let rawHtml = data?.choices?.[0]?.message?.content?.trim() || '';
          if (rawHtml.startsWith('```html')) {
            rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
          } else if (rawHtml.startsWith('```')) {
            rawHtml = rawHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const masked = `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}`;
          console.log(`[Auto-Switching Direct Client] Success via "${server.name}" using Key ${masked}`);

          return {
            translatedHtml: restoreImages(sanitizeTranslatedHtml(rawHtml), imagePlaceholderMap),
            serverUsed: `${server.name}${isSwitch ? ' (سوئیچ خودکار)' : ''}`,
            modelUsed: server.model,
            switchOccurred: isSwitch,
          };
        }
      } catch (keyErr: any) {
        const masked = currentKey ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}` : 'پیش‌فرض';
        const reason = keyErr?.message || 'خطا در اتصال';
        console.warn(`[Auto-Switching Direct Client] Key ${masked} on "${server.name}" failed: ${reason}. Switching automatically to next key/server...`);
        errors.push(`سرور «${server.name}» (کلید ${masked}): ${reason}`);
        // Continues to next key (kIdx + 1) or next server (sIdx + 1)!
      }
    }
  }

  throw new Error(`سوئیچ میان تمامی کلیدها و سرورهای فعال انجام شد اما هیچ‌یک پاسخ ندادند:\n${errors.join('\n')}\nلطفاً در بخش ویرایش API کلیدها یا مدل‌ها را بررسی فرمایید.`);
}
