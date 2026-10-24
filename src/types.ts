export type ToneId = 'spiritual' | 'novel' | 'self_help' | 'academic' | 'business' | 'aerospace' | 'mathematics';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  walletBalance: number;
  status: 'active' | 'banned';
  createdAt: number;
  lastLoginAt?: number;
}

export interface TranslationJob {
  id: string;
  bookId: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'stopped';
  totalChunks: number;
  completedChunks: number;
  progressPercent: number;
  currentChunkTitle?: string;
  error?: string;
  assignedKeyMasked?: string;
  startedAt: number;
  completedAt?: number;
  updatedAt: number;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'charge' | 'refund' | 'admin_gift';
  description: string;
  gateway?: 'zarinpal' | 'nextpay' | 'idpay' | 'stripe' | 'manual';
  status: 'success' | 'pending' | 'failed';
  trackingCode?: string;
  createdAt: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  provider: ProviderType;
  apiKey: string;
  model: string;
  baseURL?: string;
  isActive: boolean;
  priority: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  rpmCount: number;
  cooldownUntil: number;
  lastLatencyMs?: number;
  assignedUserId?: string;
}

export interface SystemSettings {
  pricing: {
    costPerWord: number;
    specializedMultiplier: number;
    freeWelcomeGift: number;
    minDepositAmount: number;
  };
  gateways: {
    zarinpal: {
      enabled: boolean;
      merchantId: string;
      isSandbox: boolean;
    };
    zibal: {
      enabled: boolean;
      merchantId: string;
      isSandbox: boolean;
    };
    nextpay: {
      enabled: boolean;
      apiKey: string;
    };
    idpay: {
      enabled: boolean;
      apiKey: string;
      isSandbox: boolean;
    };
    stripe: {
      enabled: boolean;
      secretKey: string;
    };
  };
  sms: {
    provider: 'melipayamak' | 'kavenegar' | 'smsir' | 'mock';
    apiKey: string;
    senderNumber: string;
    patternCode: string;
  };
  security: {
    maintenanceMode: boolean;
    maxConcurrentJobs: number;
    sessionExpireHours: number;
    ipBlacklist: string[];
    rateLimitRpm: number;
    captcha?: {
      enabled: boolean;
      provider: 'math' | 'recaptcha' | 'turnstile';
      siteKey: string;
      secretKey: string;
      requiredForLogin: boolean;
      requiredForRegister: boolean;
    };
  };
  coupons?: Array<{
    id: string;
    code: string;
    creditBonus: number;
    discountPercent: number;
    maxUses: number;
    timesUsed: number;
    isActive: boolean;
    createdAt: number;
  }>;
  headerFooter?: HeaderFooterConfig;
  seo?: {
    siteTitle: string;
    metaDescription: string;
    metaKeywords: string;
    logoUrl?: string;
    faviconUrl?: string;
    announcementEnabled: boolean;
    announcementText: string;
  };
  cms: {
    heroTitle: string;
    heroSubtitle: string;
    announcement: string;
    supportPhone: string;
    supportEmail: string;
    features: Array<{ id: string; title: string; description: string; icon: string }>;
    faqs: Array<{ id: string; q: string; a: string }>;
  };
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  htmlContent: string;
  metaDescription?: string;
  isPublished: boolean;
  showInHeader?: boolean;
  showInFooter?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HeaderFooterConfig {
  headerHtml: string;
  footerHtml: string;
  customCss?: string;
  enabled: boolean;
  applyToAllPages: boolean;
  applyToPrint: boolean;
}

export interface MonthlyAnalytics {
  currentMonth: {
    name: string;
    revenue: number;
    booksTranslated: number;
    wordsTranslated: number;
    tokensConsumed: number;
    newUsers: number;
  };
  previousMonth: {
    name: string;
    revenue: number;
    booksTranslated: number;
    wordsTranslated: number;
    tokensConsumed: number;
    newUsers: number;
  };
  growth: {
    revenuePercent: number;
    booksPercent: number;
    wordsPercent: number;
    tokensPercent: number;
    usersPercent: number;
  };
  totals: {
    allTimeRevenue: number;
    allTimeBooks: number;
    allTimeWords: number;
    allTimeTokens: number;
    allTimeUsers: number;
  };
  keyUsageBreakdown: Array<{
    name: string;
    provider: string;
    model: string;
    tokensUsed: number;
    requests: number;
  }>;
}

export interface PricingCalculation {
  words: number;
  baseCost: number;
  totalCost: number;
  discountApplied: number;
  costPerWord: number;
  estimatedChunks: number;
  estimatedMinutes: number;
}


export interface ToneDefinition {
  id: ToneId;
  name: string;
  enLabel: string;
  description: string;
  sampleKeywords: string[];
  systemToneTag: string;
}

export type ProviderType = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'openrouter' | 'glm' | 'minimax' | 'proxy' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  apiKey: string;
  baseURL?: string;
  selectedModel: string;
  availableModels: string[];
  isActive?: boolean;
  lastLatencyMs?: number | null;
  lastTestedAt?: number;
}

export interface APIServerEndpoint {
  id: string;
  name: string;
  providerType: ProviderType;
  baseURL: string;
  apiKey: string;
  model: string;
  isEnabled: boolean;
  priority: number;
  lastLatencyMs?: number | null;
  lastTestedAt?: number;
  status: 'active' | 'cooldown' | 'error';
  errorMessage?: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

export interface ModelOption {
  id: string;
  name: string;
  providerType?: ProviderType;
  recommended?: boolean;
}

export interface GlossaryItem {
  id: string;
  en: string;
  fa: string;
  category?: string;
  note?: string;
}

export interface BookChunk {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  chunkNumber: number;
  englishText: string;
  translatedHtml?: string;
  status: 'idle' | 'queued' | 'translating' | 'completed' | 'error';
  wordCount: number;
  estimatedTokens: number;
  errorMessage?: string;
  keyUsed?: string;
  modelUsed?: string;
  providerUsed?: string;
  serverUsed?: string;
  switchOccurred?: boolean;
  translatedAt?: number;
  hasImages?: boolean;
  imageCount?: number;
}

export type BookThemeId =
  | 'spiritual'          // معنوی و اشراقی (تذهیب اسلیمی زرین و فیروزه‌ای)
  | 'spiritual_ancient'  // معنوی کهن (پاپیروس عتیق و خط کهن)
  | 'spiritual_azure'    // معنوی آرامش و نیایش (لاجوردی و ماندالای آسمانی)
  | 'novel'              // رمان کلاسیک ادبی (عاجی و زرشکی اشرافی)
  | 'luxury_gold'        // سلطنتی طلاکوب و فاخر (سرمه‌ای شب و طلای اعلا)
  | 'academic'           // دانشگاهی و پژوهشی (نیلی مینیمال و دقیق)
  | 'sage_nature'        // روانشناسی و رشد فردی (سبز مریم‌گلی و آرامش‌بخش)
  | 'minimal_clean';     // سفید چاپی خالص و اقتصادی

export type BackgroundPatternId = 'none' | 'arabesque' | 'geometry' | 'parchment';
export type BorderStyleId = 'ornate_spiritual' | 'double_classic' | 'thin_modern' | 'none';

export interface BookDesignConfig {
  themeId: BookThemeId;
  headerText: string;
  footerText: string;
  showHeader: boolean;
  showFooter: boolean;
  websiteUrl?: string; // e.g. "www.yoursite.com"
  brandName?: string;  // e.g. "انتشارات آرمان"
  showPageNumbers: boolean;
  showCoverPage: boolean;
  fontSize: 'small' | 'medium' | 'large';
  lineSpacing: 'compact' | 'normal' | 'relaxed';
  fontFamily: 'Vazirmatn' | 'Vazirmatn Medium' | 'B Nazanin' | 'B Mitra' | 'Tahoma' | 'IRANSans';
  borderStyle: BorderStyleId;
  backgroundPattern: BackgroundPatternId;
  watermarkText?: string;
  pageMargin?: 'compact' | 'normal' | 'generous';
}

export interface BookProject {
  id: string;
  title: string;
  originalTitle: string;
  author: string;
  translator: string;
  tone: ToneId;
  providerId?: string; // ID of configured provider
  model: string; // Model selection
  customToneDescription?: string;
  glossary: GlossaryItem[];
  chunks: BookChunk[];
  createdAt: number;
  updatedAt: number;
  rollingSummary?: string;
  designConfig?: BookDesignConfig;
  sourceFileType?: 'txt' | 'docx' | 'pdf' | 'epub' | 'json';
  totalImagesCount?: number;
  status?: 'draft' | 'translating' | 'completed' | 'error';
  wordCount?: number;
  estimatedCost?: number;
}

export interface ServerKeyStatus {
  masked: string;
  label?: string;
  status: 'active' | 'cooldown';
  secondsLeftInCooldown: number;
  rpmCount: number;
  totalRequests: number;
  errorCount: number;
  lastLatencyMs?: number | null;
}

export interface ServerStatusResponse {
  activeKeys: number;
  totalKeys: number;
  rateLimitDelayMs: number;
  pool: ServerKeyStatus[];
  systemInstructionReady: boolean;
  availableModels?: ModelOption[];
}

export interface TokenCalculationResult {
  words: number;
  characters: number;
  paragraphs: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedChunks: number;
  estimatedSeconds: number;
}
