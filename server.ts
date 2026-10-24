import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Document, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, Packer, BorderStyle, Header, Footer, PageNumber } from 'docx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import JSZip from 'jszip';
import { BOOK_THEMES } from './src/constants/themes.ts';
import { setupSaasRoutes } from './server/saasRoutes.ts';
import { db } from './server/db.ts';

function cleanChapterTitle(title: string): string {
  if (!title) return 'فصل کتاب';
  let cleaned = title
    .replace(/\s*[\(\[\{]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}]/gi, '')
    .replace(/\s*[-–—|:]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+/gi, '')
    .replace(/\s+بخش\s+[0-9۰-۹IVXLCDMivxlcdm]+$/gi, '')
    .replace(/\s*[\(\[\{]\s*(?:Part|Section|Chunk)\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}]/gi, '')
    .replace(/\s*[-–—|:]\s*(?:Part|Section|Chunk)\s*[0-9۰-۹IVXLCDMivxlcdm]+/gi, '')
    .trim();
  return cleaned || 'فصل کتاب';
}

function sanitizeTranslatedHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h[1-3][^>]*>\s*مقدمه و بخش نخست\s*(?:\([^\)]*\))?\s*<\/h[1-3]>/gi, '')
    .replace(/<h[1-3][^>]*>[^<]*[\(\[\{]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}][^<]*<\/h[1-3]>/gi, '')
    .replace(/<p[^>]*>\s*[\(\[\{]?\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}]?\s*<\/p>/gi, '')
    .trim();
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS so client browsers connecting from any IP or origin can access /api/*
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount Commercial SaaS API Routes (Auth, Background Queue, Pricing, Admin, Gateways)
setupSaasRoutes(app);

// --- Key Pool & Rate Limiter Architecture ---
interface KeyStatus {
  key: string;
  masked: string;
  status: 'active' | 'cooldown';
  cooldownUntil: number;
  rpmCount: number;
  totalRequests: number;
  lastUsed: number;
  errorCount: number;
}

// Gather keys from env
const rawKeys: string[] = [];
if (process.env.GEMINI_API_KEY) {
  rawKeys.push(process.env.GEMINI_API_KEY.trim());
}
if (process.env.GEMINI_API_KEY_POOL) {
  const pool = process.env.GEMINI_API_KEY_POOL.split(',').map(k => k.trim()).filter(Boolean);
  pool.forEach(k => {
    if (!rawKeys.includes(k)) rawKeys.push(k);
  });
}

const keyPool: KeyStatus[] = rawKeys.map(k => ({
  key: k,
  masked: k.length > 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : 'Key-***',
  status: 'active',
  cooldownUntil: 0,
  rpmCount: 0,
  totalRequests: 0,
  lastUsed: 0,
  errorCount: 0,
}));

// Fallback if no key found (still create dummy item to prevent crashes, will warn properly)
if (keyPool.length === 0) {
  keyPool.push({
    key: '',
    masked: 'Default-Env-Key',
    status: 'active',
    cooldownUntil: 0,
    rpmCount: 0,
    totalRequests: 0,
    lastUsed: 0,
    errorCount: 0,
  });
}

let currentKeyIndex = 0;
const safeDelayMs = 2800; // 2.8s safe interval between calls to avoid RPM spikes
let lastCallTimestamp = 0;

function getAvailableKey(): KeyStatus | null {
  const now = Date.now();
  // Clean up expired cooldowns
  keyPool.forEach(k => {
    if (k.status === 'cooldown' && now >= k.cooldownUntil) {
      k.status = 'active';
      k.cooldownUntil = 0;
    }
  });

  // Try round-robin from current index
  for (let i = 0; i < keyPool.length; i++) {
    const idx = (currentKeyIndex + i) % keyPool.length;
    const candidate = keyPool[idx];
    if (candidate.status === 'active' && candidate.key) {
      currentKeyIndex = (idx + 1) % keyPool.length;
      return candidate;
    }
  }

  // If all are in cooldown, pick the one with earliest cooldown expiry
  const sorted = [...keyPool].sort((a, b) => a.cooldownUntil - b.cooldownUntil);
  return sorted[0] || null;
}

function markKeyCooldown(keyObj: KeyStatus, seconds = 60) {
  keyObj.status = 'cooldown';
  keyObj.cooldownUntil = Date.now() + seconds * 1000;
  keyObj.errorCount++;
}

// Reset RPM counts every minute
setInterval(() => {
  keyPool.forEach(k => {
    k.rpmCount = 0;
  });
}, 60000);

async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastCallTimestamp;
  if (timeSinceLast < safeDelayMs) {
    const waitTime = safeDelayMs - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastCallTimestamp = Date.now();
}

// System prompt as specified in the brief + strict no-summarization & uncensored literary translation
const SYSTEM_INSTRUCTION_TRANSLATOR = `Role & Objective:
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

// API Routes
app.get('/api/status', (req, res) => {
  const now = Date.now();
  const poolInfo = keyPool.map(k => ({
    masked: k.masked,
    label: (k as any).label || 'کلید پیش‌فرض',
    status: k.status === 'cooldown' && now < k.cooldownUntil ? 'cooldown' : 'active',
    secondsLeftInCooldown: Math.max(0, Math.ceil((k.cooldownUntil - now) / 1000)),
    rpmCount: k.rpmCount,
    totalRequests: k.totalRequests,
    errorCount: k.errorCount,
    lastLatencyMs: (k as any).lastLatencyMs || null,
  }));

  res.json({
    activeKeys: poolInfo.filter(k => k.status === 'active').length,
    totalKeys: poolInfo.length,
    rateLimitDelayMs: safeDelayMs,
    pool: poolInfo,
    systemInstructionReady: true,
    availableModels: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (پیش‌فرض هوشمند و فصیح)', recommended: true },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (فوق سریع و کم‌مصرف)' },
      { id: 'gemini-4-argon', name: 'Gemini 4 Argon (نهایت عمق فلسفی و ادبی)' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (جدیدترین نسخه)' },
    ],
  });
});

// Add Key to In-Memory Pool
app.post('/api/keys/add', async (req, res) => {
  const { key, label } = req.body;
  if (!key || typeof key !== 'string' || key.trim().length < 8) {
    return res.status(400).json({ error: 'کلید وارد شده نامعتبر است (حداقل ۸ کاراکتر).' });
  }
  const cleanKey = key.trim();
  const existing = keyPool.find(k => k.key === cleanKey);
  if (existing) {
    return res.json({ success: true, message: 'این کلید قبلاً در استخر ثبت شده است.', key: { masked: existing.masked } });
  }

  const masked = `${cleanKey.slice(0, 4)}...${cleanKey.slice(-4)}`;
  const newKeyObj: KeyStatus & { label?: string; lastLatencyMs?: number } = {
    key: cleanKey,
    masked,
    label: label || `کلید کمکی ${keyPool.length + 1}`,
    status: 'active',
    cooldownUntil: 0,
    rpmCount: 0,
    totalRequests: 0,
    lastUsed: 0,
    errorCount: 0,
  };
  keyPool.push(newKeyObj);
  return res.json({ success: true, key: { masked, label: newKeyObj.label, status: 'active' } });
});

// Helper to normalize and auto-fix base URLs (prevent 404 HTML error pages)
function normalizeBaseUrl(provider: string, baseURL?: string): string {
  let url = (baseURL || '').trim().replace(/\/+$/, '');
  if (!url) {
    if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
    if (provider === 'deepseek') return 'https://api.deepseek.com/v1';
    if (provider === 'glm') return 'https://open.bigmodel.cn/api/paas/v4';
    if (provider === 'groq') return 'https://api.groq.com/openai/v1';
    return 'https://api.openai.com/v1';
  }

  // Strip trailing /chat/completions or /completions if the user pasted the full endpoint
  if (url.endsWith('/chat/completions')) {
    url = url.slice(0, -'/chat/completions'.length).replace(/\/+$/, '');
  } else if (url.endsWith('/completions')) {
    url = url.slice(0, -'/completions'.length).replace(/\/+$/, '');
  }

  // Auto-correct common missing /v1 suffixes
  if (provider === 'openrouter' || url.includes('openrouter.ai')) {
    if (url === 'https://openrouter.ai' || url === 'http://openrouter.ai') {
      return 'https://openrouter.ai/api/v1';
    }
    if (url.endsWith('/api')) {
      return `${url}/v1`;
    }
  } else if (provider === 'openai' || url.includes('openai.com')) {
    if (url === 'https://api.openai.com' || url === 'http://api.openai.com') {
      return 'https://api.openai.com/v1';
    }
  } else if (provider === 'deepseek' || url.includes('deepseek.com')) {
    if (url === 'https://api.deepseek.com' || url === 'http://api.deepseek.com') {
      return 'https://api.deepseek.com/v1';
    }
  }

  return url;
}

// Helper to safely parse responses and avoid "Unexpected token '<', <!doctype" syntax crashes
async function parseResponseSafely(response: Response): Promise<{ isJson: boolean; data: any; errorMessage?: string }> {
  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readErr: any) {
    return { isJson: false, data: null, errorMessage: `خطا در خواندن پاسخ سرور: ${readErr.message}` };
  }

  const trimmed = rawText.trim();
  try {
    const data = JSON.parse(rawText);
    return { isJson: true, data };
  } catch {
    // If response starts with HTML / doctype, create a human-friendly message
    if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html')) {
      if (response.status === 404) {
        return {
          isJson: false,
          data: null,
          errorMessage: 'خطای ۴۰۴: آدرس سرور (Base URL) نامعتبر است و سرور ارائه‌دهنده صفحه ۴۰۴ وب ارسال کرد. لطفاً آدرس را در بخش ویرایش بررسی نمایید (مثلاً https://openrouter.ai/api/v1).',
        };
      }
      if (response.status === 502 || response.status === 504 || response.status === 520 || response.status === 524) {
        return {
          isJson: false,
          data: null,
          errorMessage: `خطای سرور ارائه‌دهنده (کد ${response.status}): ارتباط با سرور هوش مصنوعی به دلیل اختلال موقت ارائه‌دهنده یا کلودفلر متوقف شد.`,
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          isJson: false,
          data: null,
          errorMessage: `خطای احراز هویت (${response.status}): کلید API نامعتبر است یا توسط ارائه‌دهنده رد شد.`,
        };
      }
      return {
        isJson: false,
        data: null,
        errorMessage: `سرور ارائه‌دهنده به جای داده JSON، یک صفحه وب HTML با کد وضعیت ${response.status} برگرداند. احتمالاً آدرس Base URL یا مدل انتخاب شده اشتباه است.`,
      };
    }

    return {
      isJson: false,
      data: null,
      errorMessage: trimmed.slice(0, 250) || `پاسخ نامعتبر از سرور با کد ${response.status}`,
    };
  }
}

// Test Connection for a specific key / provider (ALWAYS EXECUTED ON THE BACKEND SERVER)
app.post('/api/keys/test', async (req, res) => {
  const { provider, apiKey, baseURL, model, masked } = req.body;

  // If testing a non-Gemini provider (OpenAI, OpenRouter, DeepSeek, GLM, Custom proxy)
  if (provider && provider !== 'gemini') {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'لطفاً کلید API معتبر برای این ارائه‌دهنده را وارد کنید.', testedByServerIp: true });
    }

    const cleanBaseUrl = normalizeBaseUrl(provider, baseURL);
    const targetUrl = `${cleanBaseUrl.replace(/\/+$/, '')}/chat/completions`;
    const testModel = model || (provider === 'openrouter' ? 'deepseek/deepseek-r1' : 'gpt-4o-mini');
    const t0 = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 22000); // 22s timeout

      const response = await fetch(targetUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PersianBookTranslator/1.0',
          ...(provider === 'openrouter' || cleanBaseUrl.includes('openrouter.ai') ? {
            'HTTP-Referer': 'https://openrouter.ai',
            'X-Title': 'Persian Book Translator'
          } : {})
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'Reply with exact single word: PONG_OK' }],
          max_tokens: 10,
        }),
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - t0;
      const parseResult = await parseResponseSafely(response);

      if (!parseResult.isJson) {
        return res.json({
          success: false,
          latencyMs,
          error: parseResult.errorMessage || 'پاسخ دریافتی نامعتبر بود و قالب JSON نداشت.',
          testedByServerIp: true,
        });
      }

      const data = parseResult.data;
      if (!response.ok) {
        return res.json({
          success: false,
          latencyMs,
          error: data?.error?.message || `خطای سرور HTTP ${response.status}: ${response.statusText}`,
          testedByServerIp: true,
        });
      }

      const answer = data.choices?.[0]?.message?.content?.trim() || 'PONG_OK';
      return res.json({
        success: true,
        latencyMs,
        masked: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
        response: answer,
        modelUsed: testModel,
        testedByServerIp: true,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
      return res.json({
        success: false,
        latencyMs,
        error: isTimeout
          ? 'پایان مهلت زمان اتصال (Timeout پس از ۲۲ ثانیه). وضعیت اینترنت یا فیلترینگ سرور را بررسی نمایید.'
          : (err?.message || 'خطا در ارتباط با سرور ارائه‌دهنده از طریق سرور'),
        testedByServerIp: true,
      });
    }
  }

  // Gemini Key Test
  let testKey = (apiKey && typeof apiKey === 'string' && apiKey.length > 8) ? apiKey.trim() : '';
  const matchedPoolKey = masked ? keyPool.find(k => k.masked === masked) : null;

  if (!testKey && matchedPoolKey?.key && matchedPoolKey.key.length > 8) {
    testKey = matchedPoolKey.key;
  }

  if (!testKey && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 8) {
    testKey = process.env.GEMINI_API_KEY.trim();
  }

  // Also check database persistent keys saved by admin
  if (!testKey) {
    const dbGeminiKeys = db.getApiKeys().filter(k => k.isActive && k.provider === 'gemini' && k.apiKey?.trim().length > 8);
    if (dbGeminiKeys.length > 0) {
      testKey = dbGeminiKeys[0].apiKey.trim();
    }
  }

  if (!testKey) {
    return res.json({
      success: false,
      latencyMs: 0,
      error: 'کلید دسترسی Gemini API در سرور یافت نشد. لطفاً در پنل مدیریت یا فایل .env کلید معتبر وارد نمایید.',
      testedByServerIp: true,
    });
  }

  const candidateModels = Array.from(new Set([
    model || 'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash'
  ]));

  const t0 = Date.now();
  let lastGeminiError: any = null;
  let successfulResult: any = null;
  let modelThatWorked = candidateModels[0];

  for (const candModel of candidateModels) {
    try {
      const ai = new GoogleGenAI({
        apiKey: testKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' }, timeout: 12000 },
      });
      const result = await ai.models.generateContent({
        model: candModel,
        contents: 'Ping test for Persian book translation engine. Reply with exact word: PONG_OK',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      successfulResult = result;
      modelThatWorked = candModel;
      break;
    } catch (candErr: any) {
      lastGeminiError = candErr;
      const errMsg = String(candErr?.message || candErr);
      // If 503 high demand or 404 model not found, try next candidate model
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('404') || errMsg.includes('UNAVAILABLE')) {
        continue;
      } else {
        break;
      }
    }
  }

  const latencyMs = Date.now() - t0;
  if (successfulResult) {
    if (matchedPoolKey) {
      (matchedPoolKey as any).lastLatencyMs = latencyMs;
      matchedPoolKey.status = 'active';
      matchedPoolKey.cooldownUntil = 0;
    }
    return res.json({
      success: true,
      latencyMs,
      masked: `${testKey.slice(0, 4)}...${testKey.slice(-4)}`,
      response: successfulResult.text?.trim() || 'PONG_OK',
      modelUsed: modelThatWorked,
      testedByServerIp: true,
    });
  }

  return res.json({
    success: false,
    latencyMs,
    error: lastGeminiError?.message || 'خطا در برقراری ارتباط با مدل هوش مصنوعی از طریق سرور',
    masked: `${testKey.slice(0, 4)}...${testKey.slice(-4)}`,
    testedByServerIp: true,
  });
});

// Remove a custom key
app.delete('/api/keys/:masked', (req, res) => {
  const { masked } = req.params;
  const idx = keyPool.findIndex(k => k.masked === masked);
  if (idx !== -1 && keyPool.length > 1) {
    keyPool.splice(idx, 1);
    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'امکان حذف کلید اصلی سیستم وجود ندارد.' });
});

// Calculate token and quota estimates
app.post('/api/calculate-tokens', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.json({
      words: 0,
      characters: 0,
      paragraphs: 0,
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      totalTokens: 0,
      estimatedChunks: 0,
      estimatedSeconds: 0,
    });
  }

  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  const characters = clean.length;
  const paragraphs = clean.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const estimatedInputTokens = Math.ceil(words * 1.35);
  const estimatedOutputTokens = Math.ceil(words * 1.65);
  const totalTokens = estimatedInputTokens + estimatedOutputTokens;
  const estimatedChunks = Math.max(1, Math.ceil(words / 700));
  const estimatedSeconds = Math.round(estimatedChunks * 4.5);

  return res.json({
    words,
    characters,
    paragraphs,
    estimatedInputTokens,
    estimatedOutputTokens,
    totalTokens,
    estimatedChunks,
    estimatedSeconds,
  });
});

// Helper to restore high-resolution embedded images into translated Persian HTML
function restoreImages(html: string, imageMap: Map<string, string>): string {
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

app.post('/api/translate', async (req, res) => {
  const { chunkId, englishText, tone, glossary, previousSummary, chapterTitle, model, provider, apiKey, baseURL, serverPool } = req.body;

  if (!englishText || typeof englishText !== 'string') {
    return res.status(400).json({ error: 'متن انگلیسی برای ترجمه الزامی است.' });
  }

  // 0. Image preservation: replace heavy base64 images with lightweight tokens for the AI prompt
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
  const targetModel = model || 'gemini-3.8-flash';

  // Format glossary items
  let glossaryText = 'واژه‌نامه عمومی';
  if (Array.isArray(glossary) && glossary.length > 0) {
    glossaryText = glossary
      .map((item: { en: string; fa: string }) => `  * ${item.en} -> ${item.fa}`)
      .join('\n');
  } else if (typeof glossary === 'string' && glossary.trim()) {
    glossaryText = glossary;
  }

  // Build the User Prompt exactly as specified in the brief with zero-summarization guarantee
  const userPrompt = `[CONFIGURATION]
- Book Tone: ${tone || 'معنوی و خودشناسی'}
- Chapter / Section Context: ${cleanChapterTitle(chapterTitle || 'بخش جاری کتاب')}
- Glossary / واژه‌نامه اختصاصی:
${glossaryText}
${previousSummary ? `\n[PREVIOUS SUMMARY / CONTEXT]\n${previousSummary}\n` : ''}
${hasImages ? `\n[IMAGE PRESERVATION INSTRUCTION]\nThis text contains image placeholders like [[IMAGE_PRESERVED_SLOT_0]]. You MUST preserve every placeholder intact at its exact corresponding position between the translated paragraphs in Persian. Do NOT remove or modify image placeholders.\n` : ''}
[CRITICAL INSTRUCTION]
1. Do NOT summarize. Translate every single sentence, dialogue, nuance, and paragraph verbatim into fluent, natural Persian without omission or censorship.
2. Do NOT invent, add, or output artificial chunk numbers, section labels, or headers such as "بخش ۱", "بخش ۲", "(بخش ۱)", "Part 1", etc. Translate only the actual text content.

[INPUT TEXT TO TRANSLATE]
${cleanEnglishText}`;

  // 1. MULTI-SERVER FAILOVER POOL: If user has configured an active pool of servers/endpoints
  if (Array.isArray(serverPool) && serverPool.length > 0) {
    const activeServers = serverPool.filter((s: any) => s.isEnabled !== false);
    const failedServerDetails: string[] = [];

    for (let sIdx = 0; sIdx < activeServers.length; sIdx++) {
      const server = activeServers[sIdx];
      console.log(`[Auto-Switching Engine] Attempting Server ${sIdx + 1}/${activeServers.length}: "${server.name}" (${server.providerType} / ${server.model})...`);

      try {
        await enforceRateLimit();

      if (server.providerType === 'gemini') {
        const rawKeys = (server.apiKey || '').split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean);
        if (rawKeys.length === 0) {
          const avail = keyPool.map(k => k.key).filter(Boolean);
          if (process.env.GEMINI_API_KEY && !avail.includes(process.env.GEMINI_API_KEY.trim())) {
            avail.unshift(process.env.GEMINI_API_KEY.trim());
          }
          const dbGemini = db.getApiKeys().filter(k => k.isActive && k.provider === 'gemini' && k.apiKey?.trim().length > 8);
          dbGemini.forEach(k => {
            if (!avail.includes(k.apiKey.trim())) avail.push(k.apiKey.trim());
          });
          rawKeys.push(...avail);
        }

        if (rawKeys.length === 0) {
          failedServerDetails.push(`سرور «${server.name}»: کلید معتبری برای Gemini تنظیم نشده است.`);
          continue;
        }

        let serverSuccess = false;
        for (let kIdx = 0; kIdx < rawKeys.length; kIdx++) {
          const sKey = rawKeys[kIdx];
          const isSwitch = sIdx > 0 || kIdx > 0;
          try {
            await enforceRateLimit();
            const ai = new GoogleGenAI({
              apiKey: sKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });

            const candidateModels = Array.from(new Set([
              server.model || 'gemini-3.8-flash',
              'gemini-3.8-flash',
              'gemini-3.1-flash-lite',
              'gemini-flash-latest',
            ]));

            let lastCandErr: any = null;
            for (const candModel of candidateModels) {
              try {
                const thinkingLevel =
                  candModel === 'gemini-3.1-flash-lite'
                    ? ThinkingLevel.MINIMAL
                    : ThinkingLevel.LOW;

                const response = await ai.models.generateContent({
                  model: candModel,
                  contents: userPrompt,
                  config: {
                    systemInstruction: SYSTEM_INSTRUCTION_TRANSLATOR,
                    temperature: 0.35,
                    topP: 0.95,
                    thinkingConfig: { thinkingLevel },
                  },
                });

                let cleanHtml = (response.text || '').trim();
                if (cleanHtml.startsWith('```html')) {
                  cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
                } else if (cleanHtml.startsWith('```')) {
                  cleanHtml = cleanHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }

                console.log(`[Auto-Switching Engine] Success via Server "${server.name}" using Key ${sKey.slice(0, 4)}...${sKey.slice(-4)}`);
                return res.json({
                  chunkId,
                  translatedHtml: restoreImages(cleanHtml, imagePlaceholderMap),
                  serverUsed: `${server.name}${isSwitch ? ' (سوئیچ خودکار)' : ''}`,
                  serverId: server.id,
                  model: candModel,
                  provider: 'gemini',
                  keyUsed: `${sKey.slice(0, 4)}...${sKey.slice(-4)}`,
                  switchOccurred: isSwitch,
                  success: true,
                });
              } catch (mErr: any) {
                lastCandErr = mErr;
                const mMsg = String(mErr?.message || mErr);
                if (mMsg.includes('503') || mMsg.includes('high demand') || mMsg.includes('404')) {
                  continue;
                }
                throw mErr;
              }
            }
            if (lastCandErr) throw lastCandErr;
          } catch (keyErr: any) {
            console.warn(`[Auto-Switching Engine] Server "${server.name}" key ${kIdx + 1} failed: ${keyErr.message}. Switching to next key/server...`);
            failedServerDetails.push(`سرور «${server.name}» (کلید ${sKey.slice(0, 4)}...): ${keyErr.message}`);
          }
        }
      } else {
        // OpenAI-Compatible Server (OpenRouter, OpenAI, DeepSeek, GLM, Groq, Custom proxy)
        const rawKeys = (server.apiKey || '').split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean);
        if (rawKeys.length === 0) {
          failedServerDetails.push(`سرور «${server.name}»: کلید API تنظیم نشده است.`);
          continue;
        }

        const cleanBaseUrl = normalizeBaseUrl(server.providerType, server.baseURL);
        const targetUrl = `${cleanBaseUrl.replace(/\/+$/, '')}/chat/completions`;

        for (let kIdx = 0; kIdx < rawKeys.length; kIdx++) {
          const currentApiKey = rawKeys[kIdx];
          const isSwitch = sIdx > 0 || kIdx > 0;
          try {
            await enforceRateLimit();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 35000);

            const response = await fetch(targetUrl, {
              method: 'POST',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PersianBookTranslator/1.0',
                ...(server.providerType === 'openrouter' || cleanBaseUrl.includes('openrouter.ai') ? {
                  'HTTP-Referer': 'https://openrouter.ai',
                  'X-Title': 'Persian Book Translator'
                } : {})
              },
              body: JSON.stringify({
                model: server.model,
                messages: [
                  { role: 'system', content: SYSTEM_INSTRUCTION_TRANSLATOR },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.35,
                top_p: 0.95
              })
            });
            clearTimeout(timeoutId);

            const parseResult = await parseResponseSafely(response);
            if (!parseResult.isJson) {
              throw new Error(parseResult.errorMessage || `خطا در دریافت خروجی از سرور ${server.name}`);
            }

            const data = parseResult.data;
            if (!response.ok) {
              throw new Error(data?.error?.message || `خطای HTTP ${response.status}: ${response.statusText}`);
            }

            let cleanHtml = (data.choices?.[0]?.message?.content || '').trim();
            if (cleanHtml.startsWith('```html')) {
              cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
            } else if (cleanHtml.startsWith('```')) {
              cleanHtml = cleanHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            cleanHtml = sanitizeTranslatedHtml(cleanHtml);

            console.log(`[Auto-Switching Engine] Success via Server "${server.name}" using Key ${currentApiKey.slice(0, 4)}...`);
            return res.json({
              chunkId,
              translatedHtml: restoreImages(cleanHtml, imagePlaceholderMap),
              serverUsed: `${server.name}${isSwitch ? ' (سوئیچ خودکار)' : ''}`,
              serverId: server.id,
              model: server.model,
              provider: server.providerType,
              keyUsed: `${currentApiKey.slice(0, 4)}...${currentApiKey.slice(-4)}`,
              switchOccurred: isSwitch,
              success: true,
            });
          } catch (keyErr: any) {
            const isTimeout = keyErr?.name === 'AbortError' || keyErr?.message?.includes('aborted');
            const reason = isTimeout ? 'پایان مهلت زمانی ۳۵ ثانیه (Timeout)' : (keyErr.message || 'خطای اتصال');
            console.warn(`[Auto-Switching Engine] Server "${server.name}" key ${kIdx + 1} failed: ${reason}. Switching to next key/server...`);
            failedServerDetails.push(`سرور «${server.name}» (کلید ${currentApiKey.slice(0, 4)}...): ${reason}`);
          }
        }
      }
      } catch (err: any) {
        const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
        const reason = isTimeout ? 'پایان مهلت زمانی ۳۵ ثانیه (Timeout)' : (err.message || 'خطای اتصال');
        console.warn(`[Auto-Switching Engine] Server "${server.name}" failed: ${reason}.`);
        failedServerDetails.push(`سرور «${server.name}» (${server.model}): ${reason}`);
        // Continue to next server in activeServers!
      }
    }
    console.warn('[Auto-Switching Engine] Custom servers completed. Failed list:', failedServerDetails);
    
    // If all custom servers failed and no system Gemini key is present, report exact errors immediately
    const hasDefaultGemini = Boolean(process.env.GEMINI_API_KEY) || keyPool.length > 0;
    if (!hasDefaultGemini && failedServerDetails.length > 0) {
      return res.status(502).json({
        success: false,
        error: `اتصال به سرورهای تعریف‌شده ناموفق بود:\n` + failedServerDetails.join('\n') + `\nلطفاً در بخش ویرایش API کلید یا مدل را بررسی فرمایید.`,
      });
    }
  }

  // 2. SINGLE NON-GEMINI PROVIDER FALLBACK
  if (provider && provider !== 'gemini') {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 4) {
      return res.status(400).json({ error: `کلید API برای ارائه‌دهنده ${provider} وارد نشده است.` });
    }

    const cleanBaseUrl = normalizeBaseUrl(provider, baseURL);
    const targetUrl = `${cleanBaseUrl.replace(/\/+$/, '')}/chat/completions`;
    try {
      await enforceRateLimit();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      const response = await fetch(targetUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PersianBookTranslator/1.0',
          ...(provider === 'openrouter' || cleanBaseUrl.includes('openrouter.ai') ? {
            'HTTP-Referer': 'https://openrouter.ai',
            'X-Title': 'Persian Book Translator'
          } : {})
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION_TRANSLATOR },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.35,
          top_p: 0.95
        })
      });
      clearTimeout(timeoutId);

      const parseResult = await parseResponseSafely(response);
      if (!parseResult.isJson) {
        throw new Error(parseResult.errorMessage || `خطا در دریافت پاسخ از ${provider}`);
      }

      const data = parseResult.data;
      if (!response.ok) {
        throw new Error(data?.error?.message || `خطای سرور ${response.status}`);
      }

      let cleanHtml = (data.choices?.[0]?.message?.content || '').trim();
      if (cleanHtml.startsWith('```html')) {
        cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanHtml.startsWith('```')) {
        cleanHtml = cleanHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      cleanHtml = sanitizeTranslatedHtml(cleanHtml);

      return res.json({
        chunkId,
        translatedHtml: restoreImages(cleanHtml, imagePlaceholderMap),
        keyUsed: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
        model: targetModel,
        provider,
        success: true,
      });
    } catch (err: any) {
      console.error(`Provider ${provider} translation error:`, err);
      return res.status(500).json({
        error: `خطا در ترجمه با ${provider}: ${err?.message || 'مشکل در برقراری ارتباط'}`,
      });
    }
  }

  // Fallback model chain in case of temporary 503 high demand on Google servers
  const fallbackChain: Record<string, string[]> = {
    'gemini-3.8-flash': ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
    'gemini-3.1-flash-lite': ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'],
    'gemini-4-argon': ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
    'gemini-flash-latest': ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
  };

  const modelCandidates = fallbackChain[targetModel] || [targetModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  let lastError: any = null;
  let successfulHtml = '';
  let successfulModel = targetModel;
  let keyUsedName = 'Primary-Key';

  modelLoop: for (let mIdx = 0; mIdx < modelCandidates.length; mIdx++) {
    const currentModelCandidate = modelCandidates[mIdx];
    const maxRetriesPerModel = Math.max(2, keyPool.length);

    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      const keyObj = getAvailableKey();
      const apiKey = keyObj?.key || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error: 'کلید دسترسی Gemini API تعریف نشده است. لطفاً متغیر GEMINI_API_KEY را بررسی کنید.',
        });
      }

      try {
        await enforceRateLimit();

        if (keyObj) {
          keyObj.rpmCount++;
          keyObj.totalRequests++;
          keyObj.lastUsed = Date.now();
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Use appropriate thinking level for model
        const thinkingLevel =
          currentModelCandidate === 'gemini-3.1-flash-lite'
            ? ThinkingLevel.MINIMAL
            : ThinkingLevel.LOW;

        const response = await ai.models.generateContent({
          model: currentModelCandidate,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_TRANSLATOR,
            temperature: 0.35,
            topP: 0.95,
            thinkingConfig: { thinkingLevel },
          },
        });

        const translatedHtml = response.text || '';

        // Clean up any markdown code block wrapper if model outputted ```html ... ```
        let cleanHtml = translatedHtml.trim();
        if (cleanHtml.startsWith('```html')) {
          cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
        } else if (cleanHtml.startsWith('```')) {
          cleanHtml = cleanHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        successfulHtml = cleanHtml;
        successfulModel = currentModelCandidate;
        keyUsedName = keyObj ? keyObj.masked : 'Primary-Key';
        break modelLoop;
      } catch (err: any) {
        lastError = err;
        const errorMessage = String(err?.message || err);
        console.warn(`Model ${currentModelCandidate} attempt ${attempt + 1} failed:`, errorMessage.slice(0, 120));

        const isQuotaExceeded =
          errorMessage.includes('429') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          errorMessage.includes('Quota exceeded');

        const isHighDemand =
          errorMessage.includes('503') ||
          errorMessage.includes('high demand') ||
          errorMessage.includes('UNAVAILABLE');

        if (isQuotaExceeded && keyObj) {
          markKeyCooldown(keyObj, 60);
          console.warn(`Key ${keyObj.masked} moved to cooldown for 60s.`);
        }

        // If high demand 503 on this model, switch immediately to next candidate model
        if (isHighDemand && mIdx < modelCandidates.length - 1) {
          console.warn(`503 High Demand detected on ${currentModelCandidate}. Automatically switching to fallback model ${modelCandidates[mIdx + 1]}...`);
          await new Promise(r => setTimeout(r, 1000));
          break; // Exit inner loop and try next model in modelCandidates
        }

        // Small backoff before retrying next key
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  if (successfulHtml) {
    const sanitized = sanitizeTranslatedHtml(successfulHtml);
    return res.json({
      chunkId,
      translatedHtml: restoreImages(sanitized, imagePlaceholderMap),
      keyUsed: keyUsedName,
      model: successfulModel,
      fallbackUsed: successfulModel !== targetModel,
      success: true,
    });
  }

  const errText = String(lastError?.message || lastError);
  let friendlyError = 'مشکل در برقراری ارتباط با مدل هوش مصنوعی';
  if (errText.includes('503') || errText.includes('high demand') || errText.includes('UNAVAILABLE')) {
    friendlyError = 'سرورهای هوش مصنوعی در حال حاضر دچار ترافیک بالای موقت (کد ۵۰۳) هستند. لطفاً لحظاتی دیگر مجدداً تلاش فرمایید یا مدل دیگری را از بالای صفحه انتخاب نمایید.';
  } else if (errText.includes('429') || errText.includes('Quota exceeded')) {
    friendlyError = 'سهمیه مجاز درخواست‌های کلید موقتاً به پایان رسیده است. پس از گذشت یک دقیقه به طور خودکار آزاد می‌شود.';
  }

  return res.status(500).json({
    error: `خطا در ترجمه: ${friendlyError}`,
  });
});

// Quick term extraction for custom glossary builder
app.post('/api/extract-glossary', async (req, res) => {
  const { sampleText, tone } = req.body;
  if (!sampleText || typeof sampleText !== 'string') {
    return res.status(400).json({ error: 'متن نمونه برای استخراج واژگان الزامی است.' });
  }

  const keyObj = getAvailableKey();
  const apiKey = keyObj?.key || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'کلید Gemini API یافت نشد.' });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const prompt = `Analyze this excerpt from an English book (Tone: ${tone || 'Spiritual / Philosophical / Literature'}).
Extract 10 to 15 key technical, philosophical, or recurring thematic terms/idioms that must have precise, uniform Persian translations.
Return ONLY valid JSON array with objects shaped: {"en": "English Term", "fa": "ترجمه دقیق و فصیح فارسی", "note": "توضیح کوتاه کاربرد در متن"}.

Text excerpt:
${sampleText.slice(0, 4000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ glossary: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'خطا در استخراج واژه‌نامه' });
  }
});

// Endpoint for importing DOCX, PDF, and TXT files with full text and image extraction
app.post('/api/import/file', async (req, res) => {
  try {
    const { fileName, fileData, fileType, maxWordsPerChunk = 700 } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'محتوای باینری فایل (base64) ارسال نشده است.' });
    }

    const buffer = Buffer.from(fileData, 'base64');
    const detectedType = fileType || (fileName?.endsWith('.docx') ? 'docx' : fileName?.endsWith('.pdf') ? 'pdf' : fileName?.toLowerCase()?.endsWith('.epub') ? 'epub' : 'txt');

    const cleanBaseName = (fileName || 'کتاب جدید').replace(/\.[^/.]+$/, '');
    let title = cleanBaseName;
    let originalTitle = cleanBaseName;
    let author = 'نامشخص';
    const chunks: any[] = [];
    let totalImagesCount = 0;

    if (detectedType === 'docx') {
      let imageIdx = 0;
      const options = {
        convertImage: mammoth.images.imgElement((image: any) => {
          imageIdx++;
          totalImagesCount++;
          return image.read('base64').then((imageBuffer: string) => {
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
              class: 'book-embedded-image rounded-xl shadow-md my-4 max-w-full mx-auto block border border-slate-300',
              alt: `تصویر شماره ${imageIdx} کتاب`,
            };
          });
        }),
      };

      const result = await mammoth.convertToHtml({ buffer }, options);
      const html = result.value;

      // Extract sections based on h1, h2, or paragraph flow
      const rawBlocks = html.split(/(?=<h[1-3][^>]*>)/gi).filter(b => b.trim().length > 0);
      let globalChunkCounter = 1;

      if (rawBlocks.length === 0) {
        rawBlocks.push(`<p>${html}</p>`);
      }

      rawBlocks.forEach((block, bIdx) => {
        const headingMatch = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(block);
        const chapterTitle = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : `فصل ${bIdx + 1}`;

        // Split paragraphs and inline images
        const paragraphs = block.split(/(?=<p[^>]*>)|(?=<img[^>]*>)/gi).filter(p => p.trim().length > 0);
        let currentChunkHtml: string[] = [];
        let currentWordCount = 0;
        let subChunkNumber = 1;

        const commitSubChunk = () => {
          if (currentChunkHtml.length === 0) return;
          const chunkHtml = currentChunkHtml.join('\n');
          const plainText = chunkHtml.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').trim();
          const words = plainText.split(/\s+/).filter(Boolean).length;
          const hasImages = /<img[^>]*>/i.test(chunkHtml);
          const imageCount = (chunkHtml.match(/<img[^>]*>/gi) || []).length;

          chunks.push({
            id: `chk_${Date.now()}_${globalChunkCounter}`,
            chapterNumber: bIdx + 1,
            chapterTitle,
            chunkNumber: subChunkNumber,
            englishText: chunkHtml,
            wordCount: Math.max(1, words),
            estimatedTokens: Math.ceil(words * 1.35),
            status: 'idle',
            hasImages,
            imageCount,
          });

          globalChunkCounter++;
          subChunkNumber++;
          currentChunkHtml = [];
          currentWordCount = 0;
        };

        paragraphs.forEach(p => {
          const pWords = p.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
          if (currentWordCount + pWords > maxWordsPerChunk && currentWordCount > 200) {
            commitSubChunk();
          }
          currentChunkHtml.push(p);
          currentWordCount += pWords;
        });

        commitSubChunk();
      });

    } else if (detectedType === 'pdf') {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;

      // Extract embedded JPEG & PNG stream images from PDF binary
      const extractedImages: string[] = [];
      let offset = 0;
      while (offset < buffer.length - 8) {
        // Check JPEG
        if (buffer[offset] === 0xFF && buffer[offset + 1] === 0xD8 && buffer[offset + 2] === 0xFF) {
          let end = offset + 2;
          while (end < buffer.length - 1) {
            if (buffer[end] === 0xFF && buffer[end + 1] === 0xD9) {
              const jpegBuf = buffer.subarray(offset, end + 2);
              if (jpegBuf.length > 2500) { // Keep images > 2.5KB
                extractedImages.push(`data:image/jpeg;base64,${jpegBuf.toString('base64')}`);
              }
              offset = end + 2;
              break;
            }
            end++;
          }
          if (end >= buffer.length - 1) offset += 2;
        }
        // Check PNG
        else if (
          buffer[offset] === 0x89 && buffer[offset + 1] === 0x50 && buffer[offset + 2] === 0x4E && buffer[offset + 3] === 0x47 &&
          buffer[offset + 4] === 0x0D && buffer[offset + 5] === 0x0A && buffer[offset + 6] === 0x1A && buffer[offset + 7] === 0x0A
        ) {
          let end = offset + 8;
          while (end < buffer.length - 8) {
            if (buffer[end] === 0x49 && buffer[end + 1] === 0x45 && buffer[end + 2] === 0x4E && buffer[end + 3] === 0x44) {
              const pngBuf = buffer.subarray(offset, end + 8);
              if (pngBuf.length > 2000) {
                extractedImages.push(`data:image/png;base64,${pngBuf.toString('base64')}`);
              }
              offset = end + 8;
              break;
            }
            end++;
          }
          if (end >= buffer.length - 8) offset += 4;
        } else {
          offset++;
        }
      }

      totalImagesCount = extractedImages.length;
      let globalChunkCounter = 1;
      let imgIndex = 0;

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageLines: string[] = [];
        let currentLine = '';
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            if (currentLine.trim()) pageLines.push(currentLine.trim());
            currentLine = item.str;
          } else {
            currentLine += (currentLine ? ' ' : '') + item.str;
          }
          lastY = item.transform[5];
        }
        if (currentLine.trim()) pageLines.push(currentLine.trim());

        const pageText = pageLines.join('\n\n');
        const words = pageText.split(/\s+/).filter(Boolean).length;
        if (words === 0 && extractedImages.length === 0) continue;

        let pageHtml = pageLines.map(l => `<p>${l}</p>`).join('\n');
        let pageImageCount = 0;
        if (imgIndex < extractedImages.length) {
          pageHtml += `\n<div class="book-illustration-wrap my-4 text-center"><img src="${extractedImages[imgIndex]}" class="book-embedded-image rounded-xl shadow-md my-3 max-w-full mx-auto block border border-slate-300" alt="تصویر صفحه ${pageNum} کتاب" /></div>`;
          imgIndex++;
          pageImageCount++;
        }

        chunks.push({
          id: `chk_${Date.now()}_${globalChunkCounter}`,
          chapterNumber: pageNum,
          chapterTitle: `صفحه ${pageNum}`,
          chunkNumber: 1,
          englishText: pageHtml,
          wordCount: Math.max(1, words),
          estimatedTokens: Math.ceil(words * 1.35),
          status: 'idle',
          hasImages: pageImageCount > 0,
          imageCount: pageImageCount,
        });
        globalChunkCounter++;
      }
    } else if (detectedType === 'epub') {
      const zip = await JSZip.loadAsync(buffer);
      const containerXml = await zip.file('META-INF/container.xml')?.async('text');
      if (!containerXml) {
        throw new Error('فایل EPUB فاقد ساختار استاندارد است (container.xml یافت نشد).');
      }

      const opfPathMatch = /full-path=["']([^"']+\.opf)["']/i.exec(containerXml);
      if (!opfPathMatch) {
        throw new Error('مسیر فایل پکیج (.opf) در فایل EPUB یافت نشد.');
      }

      const opfPath = opfPathMatch[1];
      const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';
      const opfContent = await zip.file(opfPath)?.async('text');
      if (!opfContent) {
        throw new Error(`فایل پکیج EPUB در مسیر ${opfPath} یافت نشد.`);
      }

      const tMatch = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(opfContent);
      if (tMatch && tMatch[1].trim()) title = tMatch[1].replace(/<[^>]+>/g, '').trim();

      const aMatch = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(opfContent);
      if (aMatch && aMatch[1].trim()) author = aMatch[1].replace(/<[^>]+>/g, '').trim();

      const manifestMap = new Map<string, { href: string; mediaType: string; zipPath: string }>();
      const itemRegex = /<item\s+[^>]*>/gi;
      let m;
      while ((m = itemRegex.exec(opfContent)) !== null) {
        const itemTag = m[0];
        const idM = /id=["']([^"']+)["']/i.exec(itemTag);
        const hrefM = /href=["']([^"']+)["']/i.exec(itemTag);
        const mediaM = /media-type=["']([^"']+)["']/i.exec(itemTag);
        if (idM && hrefM) {
          const href = decodeURIComponent(hrefM[1]);
          const zipPath = opfDir ? `${opfDir}/${href}`.replace(/\/+/g, '/') : href;
          manifestMap.set(idM[1], {
            href,
            mediaType: mediaM ? mediaM[1].toLowerCase() : '',
            zipPath,
          });
        }
      }

      const imageMap = new Map<string, string>();
      for (const item of manifestMap.values()) {
        if (item.mediaType.startsWith('image/')) {
          const imgFile = zip.file(item.zipPath);
          if (imgFile) {
            try {
              const b64 = await imgFile.async('base64');
              const dataUrl = `data:${item.mediaType};base64,${b64}`;
              imageMap.set(item.zipPath, dataUrl);
              const bName = item.zipPath.split('/').pop() || '';
              if (bName) imageMap.set(bName, dataUrl);
              totalImagesCount++;
            } catch (e) {}
          }
        }
      }

      const spineIds: string[] = [];
      const itemrefRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/gi;
      while ((m = itemrefRegex.exec(opfContent)) !== null) {
        spineIds.push(m[1]);
      }
      if (spineIds.length === 0) {
        manifestMap.forEach((it, k) => {
          if (it.mediaType.includes('xhtml') || it.mediaType.includes('html')) spineIds.push(k);
        });
      }

      let globalChunkCounter = 1;
      let chapterIdx = 1;

      for (const sId of spineIds) {
        const it = manifestMap.get(sId);
        if (!it) continue;
        const cFile = zip.file(it.zipPath);
        if (!cFile) continue;
        const xhtml = await cFile.async('text');

        let cTitle = `فصل ${chapterIdx}`;
        const headM = /<(?:h[1-3]|title)[^>]*>([\s\S]*?)<\/(?:h[1-3]|title)>/i.exec(xhtml);
        if (headM && headM[1].replace(/<[^>]+>/g, '').trim()) {
          cTitle = headM[1].replace(/<[^>]+>/g, '').trim();
        }

        let modHtml = xhtml;
        for (const [p, dUrl] of imageMap.entries()) {
          const fn = p.split('/').pop() || '';
          modHtml = modHtml.replace(
            new RegExp(`src=["'][^"']*${fn}["']`, 'gi'),
            `src="${dUrl}" class="book-embedded-image rounded-xl shadow-md my-4 max-w-full mx-auto block border border-slate-300"`
          );
        }

        const blocks = modHtml.match(/<(?:p|h[1-3]|blockquote|figure)[^>]*>[\s\S]*?<\/(?:p|h[1-3]|blockquote|figure)>/gi) || [modHtml];
        let curChunkHtml: string[] = [];
        let curWordCount = 0;
        let subChunk = 1;

        const commitChunk = () => {
          if (curChunkHtml.length === 0) return;
          const chunkStr = curChunkHtml.join('\n');
          const plain = chunkStr.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').trim();
          const words = plain.split(/\s+/).filter(Boolean).length;
          const hasImg = /<img[^>]*>/i.test(chunkStr);
          const imgCount = (chunkStr.match(/<img[^>]*>/gi) || []).length;

          chunks.push({
            id: `chk_${Date.now()}_${globalChunkCounter}`,
            chapterNumber: chapterIdx,
            chapterTitle: cTitle,
            chunkNumber: subChunk,
            englishText: chunkStr,
            wordCount: Math.max(1, words),
            estimatedTokens: Math.ceil(words * 1.35),
            status: 'idle',
            hasImages: hasImg,
            imageCount: imgCount,
          });
          globalChunkCounter++;
          subChunk++;
          curChunkHtml = [];
          curWordCount = 0;
        };

        for (const b of blocks) {
          const bWords = b.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
          if (curWordCount + bWords > maxWordsPerChunk && curWordCount > 200) {
            commitChunk();
          }
          curChunkHtml.push(b);
          curWordCount += bWords;
        }
        commitChunk();
        chapterIdx++;
      }
    } else {
      // Plain text fallback
      const rawText = buffer.toString('utf-8');
      chunks.push({
        id: `chk_${Date.now()}_1`,
        chapterNumber: 1,
        chapterTitle: 'متن اصلی کتاب',
        chunkNumber: 1,
        englishText: rawText,
        wordCount: rawText.split(/\s+/).filter(Boolean).length,
        estimatedTokens: Math.ceil(rawText.split(/\s+/).filter(Boolean).length * 1.35),
        status: 'idle',
        hasImages: false,
        imageCount: 0,
      });
    }

    return res.json({
      success: true,
      title,
      originalTitle,
      author,
      chunks,
      totalImagesCount,
    });
  } catch (err: any) {
    console.error('File import error:', err);
    return res.status(500).json({ error: `خطا در پردازش فایل: ${err?.message || 'مشکل در خواندن فایل'}` });
  }
});

// Helper to standardize font name and generate proper multi-script font definition for Word
function cleanFontFamily(fontName: string = 'Vazirmatn'): string {
  if (!fontName) return 'Vazirmatn';
  return fontName.replace(/\s+(Medium|Regular|Bold|Light|SemiBold|Black)$/i, '').trim() || 'Vazirmatn';
}

function createFontDef(fontName: string = 'Vazirmatn') {
  const family = cleanFontFamily(fontName);
  return {
    name: family,
    cs: family,       // Complex script for Persian in Word
    ascii: family,
    hAnsi: family,
    eastAsia: family,
  };
}

// Helper to preserve color-coded glossary terms (#9b2c2c) and styling in Word TextRuns
function parseHtmlToTextRuns(html: string, fontName: string = 'Vazirmatn Medium'): TextRun[] {
  const runs: TextRun[] = [];
  const fontDef = createFontDef(fontName);
  const regex = /<span style="[^"]*#9b2c2c[^"]*"[^>]*>([\s\S]*?)<\/span>|<b[^>]*>([\s\S]*?)<\/b>|<strong[^>]*>([\s\S]*?)<\/strong>|<i[^>]*>([\s\S]*?)<\/i>|<em[^>]*>([\s\S]*?)<\/em>|([^<]+)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      // Highlighted glossary term in red bold
      runs.push(
        new TextRun({
          text: match[1].replace(/<[^>]+>/g, ''),
          font: fontDef,
          size: 24,
          bold: true,
          color: '9B2C2C',
          rightToLeft: true,
        })
      );
    } else if (match[2] || match[3]) {
      // Bold text
      runs.push(
        new TextRun({
          text: (match[2] || match[3]).replace(/<[^>]+>/g, ''),
          font: fontDef,
          size: 24,
          bold: true,
          color: '2D3748',
          rightToLeft: true,
        })
      );
    } else if (match[4] || match[5]) {
      // Italic text
      runs.push(
        new TextRun({
          text: (match[4] || match[5]).replace(/<[^>]+>/g, ''),
          font: fontDef,
          size: 24,
          italics: true,
          color: '4A5568',
          rightToLeft: true,
        })
      );
    } else if (match[6] && match[6].length > 0) {
      runs.push(
        new TextRun({
          text: match[6],
          font: fontDef,
          size: 24,
          color: '2D3748',
          rightToLeft: true,
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: html.replace(/<[^>]+>/g, '').trim(),
        font: fontDef,
        size: 24,
        color: '2D3748',
        rightToLeft: true,
      })
    );
  }

  return runs;
}

// Generate DOCX export from translated sections
app.post('/api/export/docx', async (req, res) => {
  try {
    const { title, author, translator, chapters, designConfig } = req.body;
    const fontFamily = designConfig?.fontFamily || 'Vazirmatn Medium';
    const fontDef = createFontDef(fontFamily);

    // Only include header if showHeader is explicitly true AND text is non-empty
    const showHeader = designConfig?.showHeader === true && Boolean(designConfig?.headerText?.trim());
    const headerText = showHeader ? (designConfig?.headerText?.trim() || '') : '';

    // Only include footer if showFooter is true OR showPageNumbers is true
    const showFooter = designConfig?.showFooter === true && Boolean(designConfig?.footerText?.trim());
    const footerText = showFooter ? (designConfig?.footerText?.trim() || '') : '';
    const showPageNumbers = designConfig?.showPageNumbers !== false;

    const docChildren: Paragraph[] = [];

    // Title Page
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
        bidirectional: true,
        children: [
          new TextRun({
            text: title || 'کتاب ترجمه شده',
            font: fontDef,
            size: 48, // 24pt
            bold: true,
            color: '1A365D',
            rightToLeft: true,
          }),
        ],
      })
    );

    if (author) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          bidirectional: true,
          children: [
            new TextRun({
              text: `نویسنده: ${author}`,
              font: fontDef,
              size: 26,
              color: '4A5568',
              rightToLeft: true,
            }),
          ],
        })
      );
    }

    if (translator) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
          bidirectional: true,
          children: [
            new TextRun({
              text: `ترجمه و ویرایش: ${translator}`,
              font: fontDef,
              size: 24,
              italics: true,
              color: '718096',
              rightToLeft: true,
            }),
          ],
        })
      );
    }

    // Page break after title page
    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { before: 400 },
      })
    );

    // Parse chapters HTML into DOCX elements
    if (Array.isArray(chapters)) {
      chapters.forEach((ch: { title?: string; htmlContent?: string }, chIdx: number) => {
        if (chIdx > 0) {
          docChildren.push(new Paragraph({ pageBreakBefore: true }));
        }

        if (ch.title) {
          docChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 400 },
              bidirectional: true,
              children: [
                new TextRun({
                  text: ch.title,
                  font: fontDef,
                  size: 36, // 18pt
                  bold: true,
                  color: '1A365D',
                  rightToLeft: true,
                }),
              ],
            })
          );
        }

        // Parse paragraphs, blockquotes, headings, divs, and embedded images from HTML
        const html = ch.htmlContent || '';
        const blockRegex = /<(h[1-3]|p|blockquote|div|figure)[^>]*>([\s\S]*?)<\/\1>|<img\s+[^>]*src=["'](data:image\/[^"']+)["'][^>]*>/gi;
        let match;
        let foundAny = false;

        while ((match = blockRegex.exec(html)) !== null) {
          foundAny = true;

          // If standalone image was matched
          if (match[3]) {
            const dataUrl = match[3];
            const commaIdx = dataUrl.indexOf(',');
            if (commaIdx !== -1) {
              try {
                const base64Data = dataUrl.slice(commaIdx + 1).replace(/\s+/g, '');
                const imgBuffer = Buffer.from(base64Data, 'base64');
                const isJpg = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg');
                docChildren.push(
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 240, after: 240 },
                    children: [
                      new ImageRun({
                        data: imgBuffer,
                        transformation: {
                          width: 440,
                          height: 280,
                        },
                        type: isJpg ? 'jpg' : 'png',
                      } as any),
                    ],
                  })
                );
              } catch (imgErr) {
                console.warn('Could not add image to docx:', imgErr);
              }
            }
            continue;
          }

          const tag = match[1].toLowerCase();
          const innerHtml = match[2];

          // Check if block contains any embedded images (e.g. inside div, figure, or p)
          const embeddedImgRegex = /<img\s+[^>]*src=["'](data:image\/[^"']+)["'][^>]*>/gi;
          let imgMatch;
          while ((imgMatch = embeddedImgRegex.exec(innerHtml)) !== null) {
            try {
              const dataUrl = imgMatch[1];
              const commaIdx = dataUrl.indexOf(',');
              if (commaIdx !== -1) {
                const base64Data = dataUrl.slice(commaIdx + 1).replace(/\s+/g, '');
                const imgBuffer = Buffer.from(base64Data, 'base64');
                const isJpg = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg');
                docChildren.push(
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 240, after: 240 },
                    children: [
                      new ImageRun({
                        data: imgBuffer,
                        transformation: {
                          width: 440,
                          height: 280,
                        },
                        type: isJpg ? 'jpg' : 'png',
                      } as any),
                    ],
                  })
                );
              }
            } catch (imgErr) {
              console.warn('Could not add embedded image to docx:', imgErr);
            }
          }

          const cleanHtmlNoImg = innerHtml.replace(/<img[^>]*>/gi, '');
          const plainText = cleanHtmlNoImg.replace(/<[^>]+>/g, '').trim();
          if (!plainText) continue;

          if (tag === 'h1') {
            docChildren.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 500, after: 300 },
                bidirectional: true,
                children: [
                  new TextRun({
                    text: plainText,
                    font: fontDef,
                    size: 36,
                    bold: true,
                    color: '1A365D',
                    rightToLeft: true,
                  }),
                ],
              })
            );
          } else if (tag === 'h2') {
            docChildren.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 400, after: 200 },
                bidirectional: true,
                children: [
                  new TextRun({
                    text: plainText,
                    font: fontDef,
                    size: 30,
                    bold: true,
                    color: '2B6CB0',
                    rightToLeft: true,
                  }),
                ],
              })
            );
          } else if (tag === 'h3') {
            docChildren.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 300, after: 150 },
                bidirectional: true,
                children: [
                  new TextRun({
                    text: plainText,
                    font: fontDef,
                    size: 26,
                    bold: true,
                    color: '2C5282',
                    rightToLeft: true,
                  }),
                ],
              })
            );
          } else if (tag === 'blockquote') {
            docChildren.push(
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 240, after: 240 },
                indent: { right: 720 },
                bidirectional: true,
                border: {
                  right: {
                    color: '3182CE',
                    size: 24,
                    style: BorderStyle.SINGLE,
                  },
                },
                children: [
                  new TextRun({
                    text: '« ',
                    font: fontDef,
                    size: 22,
                    color: '3182CE',
                    rightToLeft: true,
                  }),
                  ...parseHtmlToTextRuns(innerHtml, fontFamily),
                  new TextRun({
                    text: ' »',
                    font: fontDef,
                    size: 22,
                    color: '3182CE',
                    rightToLeft: true,
                  }),
                ],
              })
            );
          } else {
            // Standard paragraph with preserved color highlights
            docChildren.push(
              new Paragraph({
                alignment: AlignmentType.BOTH, // Justified
                spacing: { line: 360, before: 100, after: 200 }, // 1.5 - 1.8 line spacing
                bidirectional: true,
                children: parseHtmlToTextRuns(innerHtml, fontFamily),
              })
            );
          }
        }

        // If no HTML tags were matched, output clean text lines
        if (!foundAny) {
          const lines = html.replace(/<[^>]+>/g, '').split('\n').map(l => l.trim()).filter(Boolean);
          lines.forEach(line => {
            docChildren.push(
              new Paragraph({
                alignment: AlignmentType.BOTH,
                spacing: { line: 360, after: 200 },
                bidirectional: true,
                children: [
                  new TextRun({
                    text: line,
                    font: fontDef,
                    size: 24,
                    rightToLeft: true,
                  }),
                ],
              })
            );
          });
        }
      });
    }

    const themeKey = (designConfig?.themeId || 'spiritual') as keyof typeof BOOK_THEMES;
    const theme = BOOK_THEMES[themeKey] || BOOK_THEMES.spiritual;
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: fontDef,
              rightToLeft: true,
              size: 24, // 12pt
              color: '2D3748',
            },
            paragraph: {
              alignment: AlignmentType.BOTH,
              spacing: { line: 360, after: 180 },
            },
          },
        },
      },
      background: {
        color: (theme.pageBgColor || '#fbf6ea').replace('#', ''),
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch / 2.54 cm
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          headers: showHeader && headerText ? {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  bidirectional: true,
                  children: [
                    new TextRun({
                      text: headerText,
                      font: fontDef,
                      size: 18, // 9pt
                      color: '718096',
                      rightToLeft: true,
                    }),
                  ],
                }),
              ],
            }),
          } : undefined,
          footers: (showFooter || showPageNumbers) ? {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  bidirectional: true,
                  children: [
                    ...(footerText ? [
                      new TextRun({
                        text: showPageNumbers ? `${footerText} • صفحه ` : footerText,
                        font: fontDef,
                        size: 18,
                        color: '718096',
                        rightToLeft: true,
                      }),
                    ] : (showPageNumbers ? [
                      new TextRun({
                        text: 'صفحه ',
                        font: fontDef,
                        size: 18,
                        color: '718096',
                        rightToLeft: true,
                      }),
                    ] : [])),
                    ...(showPageNumbers ? [
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        font: fontDef,
                        size: 18,
                        color: '718096',
                        rightToLeft: true,
                      }),
                    ] : []),
                  ],
                }),
              ],
            }),
          } : undefined,
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title || 'book-translated')}.docx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('DOCX Export error:', err);
    res.status(500).json({ error: 'خطا در ایجاد فایل Word' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = Number(PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Book Translator server listening on http://0.0.0.0:${port} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer();
