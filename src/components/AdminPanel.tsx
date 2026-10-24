import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Cpu,
  Layers,
  Settings,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  FileText,
  BookOpen,
  Send,
  Lock,
  Server,
  Zap,
  Check,
  X,
  ExternalLink,
  Download,
  Tag,
  Database,
  BarChart3,
  Code,
  Palette,
  Eye,
  Globe,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BookCheck,
  Printer,
  FileCode,
  UserPlus,
  Wallet,
  RotateCw,
  Save,
  Info,
  Edit3
} from 'lucide-react';
import {
  User,
  BookProject,
  SystemSettings,
  TransactionRecord,
  TranslationJob,
  CustomPage,
  HeaderFooterConfig,
  MonthlyAnalytics
} from '../types.ts';

interface AdminPanelProps {
  currentUser: User;
  onBackToUserPanel: () => void;
  onLogout: () => void;
}

export type AdminTab =
  | 'overview'
  | 'monthly_analytics'
  | 'completed_books'
  | 'all_books'
  | 'users'
  | 'api_pool'
  | 'finance'
  | 'page_builder'
  | 'header_footer'
  | 'cms'
  | 'seo'
  | 'security';

export const PROVIDER_PRESET_MODELS: Record<string, string[]> = {
  gemini: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  glm: ['glm-4-plus', 'glm-4-0520', 'glm-4-air', 'glm-4-airx', 'glm-4-flash', 'glm-zero-preview'],
  minimax: ['MiniMax-Text-01', 'abab6.5s-chat', 'abab6.5t-chat', 'abab5.5-chat'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'gpt-4-turbo'],
  claude: ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-7-sonnet', 'anthropic/claude-3-5-haiku'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: ['google/gemini-2.5-flash', 'deepseek/deepseek-r1', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct'],
  proxy: ['gpt-4o', 'deepseek-chat', 'claude-3-5-sonnet', 'gemini-2.5-flash'],
  custom: ['custom-model'],
};

export const PROVIDER_DEFAULT_BASE_URL: Record<string, string> = {
  gemini: '',
  glm: 'https://open.bigmodel.cn/api/paas/v4',
  minimax: 'https://api.minimax.chat/v1',
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com',
  openrouter: 'https://openrouter.ai/api/v1',
  proxy: 'https://api.oneapi.ir/v1',
  custom: '',
};

export function AdminSectionGuide({
  title,
  badge = 'راهنمای این بخش',
  badgeColor = 'amber',
  description,
  bullets,
  tip,
}: {
  title: string;
  badge?: string;
  badgeColor?: 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | string;
  description: string;
  bullets: Array<{ title: string; text: string }>;
  tip?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'blue':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'amber':
      default:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full ${getBadgeStyle()}`}>
                  {badge}
                </span>
              )}
            </h3>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-700/80 transition"
        >
          <span>{isOpen ? 'بستن راهنما ▲' : 'مشاهده راهنما ▼'}</span>
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {description}
      </p>

      {isOpen && (
        <div className="space-y-2.5 pt-2.5 border-t border-slate-800/80 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {bullets.map((b, idx) => (
              <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/90 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-amber-300 font-bold block mb-1">{b.title}</strong>
                  <span className="text-slate-300 leading-relaxed text-[11px]">{b.text}</span>
                </div>
              </div>
            ))}
          </div>
          {tip && (
            <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPanel({ currentUser, onBackToUserPanel, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Overview Data
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Monthly Analytics Data
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // All Books Oversight Data
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [bookSearch, setBookSearch] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Dedicated Completed Books State
  const [completedBookSearch, setCompletedBookSearch] = useState('');
  const [readingBookModal, setReadingBookModal] = useState<any | null>(null);
  const [readingFontSize, setReadingFontSize] = useState<number>(16);
  const [loadingFullBook, setLoadingFullBook] = useState(false);

  // Custom Page Builder Data
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({
    id: '',
    title: '',
    slug: '',
    htmlContent: '',
    metaDescription: '',
    isPublished: true,
    showInHeader: false,
    showInFooter: false,
  });
  const [previewModalHtml, setPreviewModalHtml] = useState<string | null>(null);
  const [pageSaveSuccess, setPageSaveSuccess] = useState(false);

  // Header & Footer HTML Designer Data
  const [headerFooterConfig, setHeaderFooterConfig] = useState<HeaderFooterConfig>({
    headerHtml: '',
    footerHtml: '',
    customCss: '',
    enabled: true,
    applyToAllPages: true,
    applyToPrint: false,
  });
  const [hfActiveSubTab, setHfActiveSubTab] = useState<'header' | 'footer' | 'css'>('header');
  const [hfSaveSuccess, setHfSaveSuccess] = useState(false);

  // Users Data & Create User Modal
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserBooks, setSelectedUserBooks] = useState<{ user: any; books: any[] } | null>(null);
  const [adjustWalletModal, setAdjustWalletModal] = useState<{ user: any; amount: number; description: string } | null>(null);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'user',
    walletBalance: 50000,
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Edit User State
  const [editUserModal, setEditUserModal] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'banned';
    password?: string;
  } | null>(null);
  const [editUserLoading, setEditUserLoading] = useState(false);

  // API Pool Data
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.8-flash',
    baseURL: '',
    priority: 1,
    isCustomModel: false,
  });
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  // Edit Key Modal State (کاربر خواست هر کلید را بشود ویرایش کرد)
  const [editKeyModal, setEditKeyModal] = useState<any | null>(null);
  const [editKeyForm, setEditKeyForm] = useState({
    id: '',
    name: '',
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.8-flash',
    baseURL: '',
    priority: 1,
    isActive: true,
    isCustomModel: false,
  });

  // Batch Key Testing & Queue Stats
  const [testingAllKeys, setTestingAllKeys] = useState(false);
  const [batchTestResults, setBatchTestResults] = useState<any[] | null>(null);
  const [queueStats, setQueueStats] = useState<any>(null);

  // System Settings (Finance, CMS, Security, SMS, SEO)
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [seoSaveSuccess, setSeoSaveSuccess] = useState(false);

  // All Transactions
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Test SMS phone
  const [testSmsPhone, setTestSmsPhone] = useState('09121234567');
  const [smsResult, setSmsResult] = useState<string | null>(null);

  // Coupons
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponCredit, setNewCouponCredit] = useState(50000);
  const [newCouponDiscount, setNewCouponDiscount] = useState(0);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(100);

  const token = localStorage.getItem('auth_token') || '';

  useEffect(() => {
    fetchOverview();
    fetchMonthlyAnalytics();
    fetchUsers();
    fetchAllBooks();
    fetchApiKeys();
    fetchSettings();
    fetchTransactions();
    fetchCoupons();
    fetchCustomPages();
    fetchHeaderFooter();
    fetchQueueStats();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (e) {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCouponCode.trim(),
          creditBonus: Number(newCouponCredit) || 0,
          discountPercent: Number(newCouponDiscount) || 0,
          maxUses: Number(newCouponMaxUses) || 100,
        }),
      });
      if (res.ok) {
        setNewCouponCode('');
        fetchCoupons();
        alert('کد تخفیف با موفقیت ایجاد شد.');
      }
    } catch (e) {}
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('آیا از حذف این کد تخفیف مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCoupons();
    } catch (e) {}
  };

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e) {
      console.warn('Could not fetch admin overview');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {}
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/admin/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {}
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {}
  };

  // Inspect User Books
  const handleInspectUserBooks = async (user: any) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/books`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUserBooks({ user, books: data.books || [] });
      }
    } catch (e) {}
  };

  // Adjust User Wallet
  const handleSaveWalletAdjustment = async () => {
    if (!adjustWalletModal) return;
    try {
      const res = await fetch(`/api/admin/users/${adjustWalletModal.user.id}/adjust-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: adjustWalletModal.amount,
          description: adjustWalletModal.description,
        }),
      });
      if (res.ok) {
        setAdjustWalletModal(null);
        fetchUsers();
        fetchTransactions();
      }
    } catch (e) {}
  };

  // Admin Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserForm.phone || !createUserForm.password) {
      setCreateUserError('شماره موبایل و رمز عبور الزامی است.');
      return;
    }
    setCreateUserLoading(true);
    setCreateUserError(null);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateUserError(data.error || 'خطا در ثبت کاربر جدید');
      } else {
        setCreateUserModal(false);
        setCreateUserForm({
          name: '',
          phone: '',
          email: '',
          password: '',
          role: 'user',
          walletBalance: 50000,
        });
        fetchUsers();
        fetchOverview();
        alert('کاربر جدید با موفقیت ایجاد شد.');
      }
    } catch (e: any) {
      setCreateUserError(e.message || 'خطا در برقراری ارتباط');
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Admin Save Edit User (Profile, role, status, password)
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    setEditUserLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editUserModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editUserModal.name,
          phone: editUserModal.phone,
          email: editUserModal.email,
          role: editUserModal.role,
          status: editUserModal.status,
          password: editUserModal.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در ویرایش اطلاعات کاربر');
      } else {
        setEditUserModal(null);
        fetchUsers();
        alert('اطلاعات کاربر با موفقیت به‌روزرسانی شد.');
      }
    } catch (e: any) {
      alert(e.message || 'خطا در ارتباط با سرور');
    } finally {
      setEditUserLoading(false);
    }
  };

  // Toggle User Role or Status
  const handleUpdateUserStatus = async (userId: string, role: string, status: string) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role, status }),
      });
      fetchUsers();
    } catch (e) {}
  };

  // Book Export & Reader Helpers for Completed Books
  const fetchBookDetailsIfNeeded = async (book: any) => {
    if (book.chunks && book.chunks.length > 0) return book;
    try {
      const res = await fetch(`/api/admin/books/${book.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.book || book;
      }
    } catch (e) {}
    return book;
  };

  const handleOpenReader = async (book: any) => {
    setLoadingFullBook(true);
    try {
      const fullBook = await fetchBookDetailsIfNeeded(book);
      setReadingBookModal(fullBook);
    } finally {
      setLoadingFullBook(false);
    }
  };

  const handleDownloadWordDoc = async (book: any) => {
    const fullBook = await fetchBookDetailsIfNeeded(book);
    const title = fullBook.title || 'کتاب ترجمه شده';
    let chaptersHtml = '';
    if (fullBook.chunks && fullBook.chunks.length > 0) {
      chaptersHtml = fullBook.chunks.map((ch: any, idx: number) => `
        <div style="page-break-before: always; margin-top: 32px; padding-top: 20px;">
          <h2 style="color: #1e3a8a; font-size: 18pt; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">بخش ${idx + 1}: ${ch.title || `فصل ${idx + 1}`}</h2>
          <div style="font-size: 13pt; line-height: 2.2; text-align: justify; margin-top: 16px;">
            ${ch.translatedHtml || ch.translatedText?.replace(/\n/g, '<br/>') || '<p>متن ترجمه شده‌ای ثبت نشده است.</p>'}
          </div>
        </div>
      `).join('');
    } else {
      chaptersHtml = `<p>متن ترجمه شده‌ای برای این کتاب ثبت نشده است.</p>`;
    }

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 2.5cm; }
          body { font-family: 'B Nazanin', 'Vazirmatn', 'Tahoma', Arial, sans-serif; direction: rtl; text-align: right; line-height: 2.2; font-size: 13pt; color: #111; }
          h1 { color: #0f172a; font-size: 24pt; text-align: center; margin-bottom: 8px; }
          .meta { text-align: center; color: #64748b; font-size: 11pt; margin-bottom: 30px; }
        </style>
      </head>
      <body dir="rtl">
        <h1>${title}</h1>
        <div class="meta">
          ${fullBook.originalTitle ? `<p>عنوان زبان اصلی: ${fullBook.originalTitle}</p>` : ''}
          ${fullBook.author ? `<p>نویسنده: ${fullBook.author}</p>` : ''}
          <p>خروجی رسمی مترجم هوش مصنوعی | تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
        </div>
        <hr/>
        ${chaptersHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_ترجمه_فارسی.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtmlBook = async (book: any) => {
    const fullBook = await fetchBookDetailsIfNeeded(book);
    const title = fullBook.title || 'کتاب ترجمه شده';
    let chaptersHtml = '';
    if (fullBook.chunks && fullBook.chunks.length > 0) {
      chaptersHtml = fullBook.chunks.map((ch: any, idx: number) => `
        <article style="margin-bottom: 40px; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h2 style="color: #b45309; font-size: 20px; font-weight: 800; border-bottom: 2px solid #fef3c7; padding-bottom: 12px; margin-bottom: 20px;">بخش ${idx + 1}: ${ch.title || `فصل ${idx + 1}`}</h2>
          <div style="font-size: 16px; line-height: 2.3; text-align: justify; color: #1e293b;">
            ${ch.translatedHtml || ch.translatedText?.replace(/\n/g, '<br/>') || ''}
          </div>
        </article>
      `).join('');
    }
    const fullHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | نسخه دیجیتال کتابخوان</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; line-height: 2; }
    .container { max-width: 820px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    h1 { color: #0f172a; font-size: 26px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      <p style="color: #64748b; font-size: 14px;">${fullBook.originalTitle ? `عنوان اصلی: ${fullBook.originalTitle} | ` : ''}نویسنده: ${fullBook.author || 'نامشخص'}</p>
    </header>
    ${chaptersHtml}
  </div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_کتابخوان_آفلاین.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxtBook = async (book: any) => {
    const fullBook = await fetchBookDetailsIfNeeded(book);
    const title = fullBook.title || 'کتاب ترجمه شده';
    let txt = `${title}\n${fullBook.originalTitle ? `عنوان زبان اصلی: ${fullBook.originalTitle}\n` : ''}${fullBook.author ? `نویسنده: ${fullBook.author}\n` : ''}\n=========================================\n\n`;
    if (fullBook.chunks && fullBook.chunks.length > 0) {
      fullBook.chunks.forEach((ch: any, idx: number) => {
        txt += `--- بخش ${idx + 1}: ${ch.title || `فصل ${idx + 1}`} ---\n\n`;
        const cleanText = (ch.translatedHtml || ch.translatedText || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]+>/g, '');
        txt += cleanText.trim() + '\n\n\n';
      });
    }
    const blob = new Blob(['\ufeff', txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintBookPdf = async (book: any) => {
    const fullBook = await fetchBookDetailsIfNeeded(book);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = fullBook.title || 'کتاب ترجمه شده';
    let chaptersHtml = '';
    if (fullBook.chunks && fullBook.chunks.length > 0) {
      chaptersHtml = fullBook.chunks.map((ch: any, idx: number) => `
        <div class="chapter">
          <h2>${ch.title ? ch.title : `فصل ${idx + 1}`}</h2>
          <div class="chapter-content">
            ${ch.translatedHtml || ch.translatedText?.replace(/\n/g, '<br/>') || ''}
          </div>
        </div>
      `).join('');
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #faf8f5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Vazirmatn', Tahoma, 'B Nazanin', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            color: #1e293b;
          }
          .page-wrapper {
            padding: 24mm 20mm 20mm 20mm;
            min-height: 100vh;
          }
          h1 { text-align: center; font-size: 24px; margin-bottom: 8px; color: #0f172a; font-weight: 800; }
          .meta { text-align: center; color: #64748b; margin-bottom: 24px; font-size: 13px; }
          .chapter { page-break-before: always; margin-top: 24px; }
          .chapter:first-of-type { page-break-before: avoid; }
          h2 { font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; color: #b45309; }
          .chapter-content { text-align: justify; line-height: 2.2; font-size: 14px; }
          @media print {
            body { background-color: #faf8f5 !important; }
          }
        </style>
      </head>
      <body>
        <div class="page-wrapper">
          <h1>${title}</h1>
          <div class="meta">
            ${fullBook.originalTitle ? `<span>عنوان زبان اصلی: ${fullBook.originalTitle} | </span>` : ''}
            ${fullBook.author ? `<span>نویسنده: ${fullBook.author}</span>` : ''}
          </div>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-bottom: 24px;"/>
          ${chaptersHtml}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add API Key
  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newKeyForm,
          model: newKeyForm.model.trim() || PROVIDER_PRESET_MODELS[newKeyForm.provider]?.[0] || 'gemini-3.8-flash'
        }),
      });
      if (res.ok) {
        setNewKeyModal(false);
        setNewKeyForm({
          name: '',
          provider: 'gemini',
          apiKey: '',
          model: 'gemini-3.8-flash',
          baseURL: '',
          priority: 1,
          isCustomModel: false,
        });
        fetchApiKeys();
      }
    } catch (e) {}
  };

  // Delete API Key
  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('آیا از حذف این کلید API اطمینان دارید؟')) return;
    try {
      await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchApiKeys();
    } catch (e) {}
  };

  // Open Edit API Key Modal
  const handleOpenEditKey = (k: any) => {
    const isCustom = !(PROVIDER_PRESET_MODELS[k.provider] || []).includes(k.model);
    setEditKeyForm({
      id: k.id,
      name: k.name || '',
      provider: k.provider || 'gemini',
      apiKey: k.apiKey || '',
      model: k.model || 'gemini-3.8-flash',
      baseURL: k.baseURL || '',
      priority: k.priority || 1,
      isActive: k.isActive !== false,
      isCustomModel: isCustom,
    });
    setEditKeyModal(k);
  };

  // Save Edited API Key to Server (PUT /api/admin/api-keys/:id)
  const handleSaveEditedApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKeyForm.name || !editKeyForm.apiKey) {
      alert('نام و متن کلید API الزامی هستند.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/api-keys/${editKeyForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editKeyForm,
          model: editKeyForm.model.trim() || 'gemini-3.8-flash',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditKeyModal(null);
        fetchApiKeys();
        alert('کلید با موفقیت در سرور ویرایش و ذخیره شد.');
      } else {
        alert(data.error || 'خطا در ویرایش کلید');
      }
    } catch (e: any) {
      alert(`خطا: ${e.message}`);
    }
  };

  // 1-Click Toggle Key Active Status
  const handleToggleKeyActive = async (keyItem: any) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${keyItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !keyItem.isActive }),
      });
      if (res.ok) fetchApiKeys();
    } catch (e) {}
  };

  // Benchmark & Ping All Keys Concurrently
  const handleTestAllKeys = async () => {
    setTestingAllKeys(true);
    try {
      const res = await fetch('/api/admin/api-keys/test-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setBatchTestResults(data.results || []);
        fetchApiKeys();
      } else {
        alert(data.error || 'خطا در ارزیابی همزمان کلیدها');
      }
    } catch (e: any) {
      alert(`خطا: ${e.message}`);
    } finally {
      setTestingAllKeys(false);
    }
  };

  // Fetch Live Queue Stats from Server
  const fetchQueueStats = async () => {
    try {
      const res = await fetch('/api/admin/queue/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueueStats(data.stats);
      }
    } catch (e) {}
  };

  // Quick 1-Click Wallet Gift for Users
  const handleQuickGift = async (userId: string, amount: number, desc: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/adjust-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, description: desc }),
      });
      if (res.ok) {
        fetchUsers();
        alert(`مبلغ ${amount.toLocaleString('fa-IR')} تومان با موفقیت به کیف پول کاربر اضافه شد.`);
      }
    } catch (e) {}
  };

  // Test API Key Ping
  const handleTestApiKey = async (keyItem: any) => {
    setTestingKeyId(keyItem.id);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: keyItem.provider,
          apiKey: keyItem.apiKey,
          baseURL: keyItem.baseURL,
          model: keyItem.model,
        }),
      });
      const data = await res.json();
      alert(data.success ? `اتصال موفقیت‌آمیز بود! زمان پاسخ: ${data.latencyMs} میلی‌ثانیه` : `خطا در اتصال: ${data.error}`);
    } catch (e: any) {
      alert(`خطا: ${e.message}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSettingsSuccess(true);
        setTimeout(() => setSaveSettingsSuccess(false), 3000);
      }
    } catch (e) {}
  };

  // Test SMS
  const handleTestSms = async () => {
    try {
      const res = await fetch('/api/admin/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: testSmsPhone }),
      });
      const data = await res.json();
      setSmsResult(data.message || 'ارسال شد.');
    } catch (e: any) {
      setSmsResult(e.message || 'خطا در تست پیامک');
    }
  };

  // Fetch Monthly Analytics
  const fetchMonthlyAnalytics = async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch('/api/admin/analytics/monthly', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyAnalytics(data);
      }
    } catch (e) {
      console.warn('Could not fetch monthly analytics');
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Fetch All Books
  const fetchAllBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await fetch('/api/admin/all-books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllBooks(data.books || []);
      }
    } catch (e) {
      console.warn('Could not fetch all books');
    } finally {
      setLoadingBooks(false);
    }
  };

  // Delete Book by Admin
  const handleDeleteBookAdmin = async (bookId: string) => {
    if (!confirm('آیا از حذف این کتاب و تمام بخش‌ها و ترجمه‌های آن از سیستم اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) return;
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAllBooks();
        fetchOverview();
      }
    } catch (e) {}
  };

  // Fetch Custom Pages
  const fetchCustomPages = async () => {
    setLoadingPages(true);
    try {
      const res = await fetch('/api/custom-pages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomPages(data.pages || []);
        if (data.pages && data.pages.length > 0 && !selectedPageId) {
          handleSelectPageForEdit(data.pages[0]);
        }
      }
    } catch (e) {
      console.warn('Could not fetch custom pages');
    } finally {
      setLoadingPages(false);
    }
  };

  const handleSaveSeoSettings = async () => {
    if (!settings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSeoSaveSuccess(true);
        setTimeout(() => setSeoSaveSuccess(false), 3000);
      }
    } catch (e) {}
  };

  const handleSelectPageForEdit = (page: CustomPage) => {
    setSelectedPageId(page.id);
    setPageForm({
      id: page.id,
      title: page.title,
      slug: page.slug,
      htmlContent: page.htmlContent,
      metaDescription: page.metaDescription || '',
      isPublished: page.isPublished,
      showInHeader: page.showInHeader ?? false,
      showInFooter: page.showInFooter ?? false,
    });
  };

  const handleCreateNewPage = () => {
    setSelectedPageId(null);
    setPageForm({
      id: '',
      title: 'برگه جدید بدون عنوان',
      slug: `new-page-${Date.now().toString().slice(-4)}`,
      htmlContent: `<div style="max-width: 850px; margin: 0 auto; padding: 40px 20px; font-family: 'Vazirmatn', sans-serif; color: #f8fafc; line-height: 2;">
  <h1 style="color: #f59e0b; font-size: 26px; font-weight: 800; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 20px;">عنوان برگه اختصاصی شما</h1>
  <p style="font-size: 15px; color: #cbd5e1;">متن، تصاویر، جدول‌ها یا کدهای HTML دلخواه خود را در این بخش قرار دهید.</p>
</div>`,
      metaDescription: 'توضیحات برگه جدید برای موتورهای جستجو',
      isPublished: true,
      showInHeader: false,
      showInFooter: false,
    });
  };

  const handleSaveCustomPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.title.trim() || !pageForm.slug.trim()) {
      alert('لطفاً عنوان و آدرس یکتای برگه (Slug) را وارد نمایید.');
      return;
    }
    try {
      const res = await fetch('/api/admin/custom-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pageForm),
      });
      if (res.ok) {
        setPageSaveSuccess(true);
        setTimeout(() => setPageSaveSuccess(false), 3000);
        fetchCustomPages();
      }
    } catch (e) {
      alert('خطا در ذخیره برگه');
    }
  };

  const handleDeleteCustomPage = async (id: string) => {
    if (!confirm('آیا از حذف این برگه اختصاصی اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/custom-pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCustomPages();
        if (selectedPageId === id) {
          handleCreateNewPage();
        }
      }
    } catch (e) {}
  };

  // Fetch Header & Footer HTML Config
  const fetchHeaderFooter = async () => {
    try {
      const res = await fetch('/api/admin/header-footer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.headerFooter) {
          setHeaderFooterConfig(data.headerFooter);
        }
      }
    } catch (e) {
      console.warn('Could not fetch header-footer config');
    }
  };

  const handleSaveHeaderFooter = async () => {
    try {
      const res = await fetch('/api/admin/header-footer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(headerFooterConfig),
      });
      if (res.ok) {
        setHfSaveSuccess(true);
        setTimeout(() => setHfSaveSuccess(false), 3000);
      }
    } catch (e) {
      alert('خطا در ذخیره هدر و فوتر');
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = userSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s)
    );
  });

  const filteredBooks = allBooks.filter((b) => {
    const s = bookSearch.toLowerCase();
    return (
      b.title?.toLowerCase().includes(s) ||
      b.originalTitle?.toLowerCase().includes(s) ||
      b.author?.toLowerCase().includes(s) ||
      b.user?.name?.toLowerCase().includes(s) ||
      b.user?.email?.toLowerCase().includes(s)
    );
  });

  const completedBooksList = allBooks.filter((b) => {
    const isDone = b.status === 'completed' || (b.completedChunks && b.completedChunks > 0);
    if (!isDone) return false;
    if (!completedBookSearch) return true;
    const s = completedBookSearch.toLowerCase();
    return (
      b.title?.toLowerCase().includes(s) ||
      b.originalTitle?.toLowerCase().includes(s) ||
      b.author?.toLowerCase().includes(s) ||
      b.user?.name?.toLowerCase().includes(s) ||
      b.user?.phone?.toLowerCase().includes(s)
    );
  });

  const completedBooksCount = allBooks.filter((b) => b.status === 'completed' || (b.completedChunks && b.completedChunks > 0)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn'] selection:bg-amber-500/30">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">پنل مدیریت ارشد سامانه</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">نظارت بر کاربران، استخر موازی هوش مصنوعی، درآمدها و امنیت</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToUserPanel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>بازگشت به میز کاربری</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-semibold scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border shrink-0 min-w-[130px] sm:min-w-0 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="truncate">پیشخوان زنده</span>
            </button>

            <button
              onClick={() => { setActiveTab('monthly_analytics'); fetchMonthlyAnalytics(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'monthly_analytics'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">آمار و مقایسه ماهانه</span>
              <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">جدید</span>
            </button>

            <button
              onClick={() => { setActiveTab('completed_books'); fetchAllBooks(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'completed_books'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">کتاب‌های ترجمه‌شده</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                {completedBooksCount}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('all_books'); fetchAllBooks(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'all_books'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
              <span className="truncate">کل کتاب‌ها ({allBooks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="truncate">کاربران ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('api_pool')}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'api_pool'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0 text-purple-400" />
              <span className="truncate">استخر کلیدها ({apiKeys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'finance'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="truncate">امور مالی و درگاه‌ها</span>
            </button>

            <button
              onClick={() => { setActiveTab('page_builder'); fetchCustomPages(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'page_builder'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">صفحه‌ساز HTML</span>
              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold">{customPages.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('header_footer'); fetchHeaderFooter(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'header_footer'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0 text-pink-400" />
              <span className="truncate">هدر و فوتر HTML</span>
            </button>

            <button
              onClick={() => setActiveTab('cms')}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'cms'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0 text-orange-400" />
              <span className="truncate">محتوای لندینگ</span>
            </button>

            <button
              onClick={() => { setActiveTab('seo'); fetchSettings(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'seo'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0 text-teal-400" />
              <span className="truncate">سئو و برندینگ</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${
                activeTab === 'security'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">امنیت و پیامک</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <AdminSectionGuide
              title="داشبورد جامع، درآمد، ترافیک و صف پردازش ابری"
              badge="نمای کلی سیستم"
              badgeColor="emerald"
              description="این بخش خلاصه زنده‌ای از درآمد تجمیعی، تعداد کاربران، کل کلمات ترجمه شده و وضعیت پردازش‌های جاری سرور را نمایش می‌دهد."
              bullets={[
                {
                  title: 'پردازش مستقل ابری',
                  text: 'کارهای ترجمه در صف پس‌زمینه سرور اجرا می‌شوند. هیچ کاربری نیازی به باز نگه داشتن تب مرورگر یا تهیه API Key ندارد.'
                },
                {
                  title: 'محاسبه شفاف درآمد',
                  text: 'درآمد کل بر اساس شارژهای موفق کیف پول از طریق درگاه‌های پرداخت متصل (زرین‌پال، نکست‌پی و ...) محاسبه می‌گردد.'
                },
                {
                  title: 'تحلیل ماهیانه توکن و کلمات',
                  text: 'نمودار تفکیکی مصرف مدل‌های مختلف و درآمد هر ماه میلادی/شمسی در پایین همین صفحه در دسترس است.'
                },
                {
                  title: 'بروزرسانی لحظه‌ای',
                  text: 'با کلیک روی دکمه بروزرسانی، آخرین تغییرات پایگاه داده سرور بدون نیاز به رفرش کل مرورگر لود می‌شود.'
                }
              ]}
              tip="راهنمایی سریع: اگر پردازش‌های زیادی در صف مانده‌اند، به تب «استخر کلیدهای هوش مصنوعی» بروید و کلیدهای پرسرعت فعال بیشتری اضافه کنید."
            />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">داشبورد جامع سامانه</h2>
                <p className="text-xs text-slate-400">آمار لحظه‌ای فروش، مصرف توکن‌ها و پردازش‌های فعال ابری</p>
              </div>
              <button
                onClick={fetchOverview}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بروزرسانی داده‌ها</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  کل کاربران عضو
                </div>
                <div className="text-3xl font-black text-white">{overview?.totalUsers || users.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">با دسترسی مجزا و کیف پول مستقل</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  کل کلمات ترجمه شده
                </div>
                <div className="text-3xl font-black text-amber-400">
                  {(overview?.totalWords || 0).toLocaleString('fa-IR')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">در قالب {overview?.totalBooks || 0} پروژه کتاب</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  مجموع درآمد کل پلتفرم
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  {(overview?.totalRevenue || 0).toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">تومان</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">از درگاه‌های زرین‌پال، نکست‌پی و مستقیم</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-purple-400" />
                  استخر کلیدهای فعال
                </div>
                <div className="text-3xl font-black text-white">
                  {overview?.apiKeysActive || apiKeys.length} <span className="text-xs text-slate-500">از {overview?.apiKeysCount || apiKeys.length} کلید</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">توزیع خودکار بین کاربران همزمان</div>
              </div>
            </div>

            {/* Active Queue Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">پردازش‌های فعال در صف سرور</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono">
                  {overview?.activeJobsCount || 0} پردازش همزمان
                </span>
              </div>

              {overview?.activeJobs?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  در حال حاضر صفی در انتظار نیست؛ سرور در حالت آماده‌باش کامل قرار دارد.
                </div>
              ) : (
                <div className="space-y-3">
                  {overview?.activeJobs?.map((job: any) => (
                    <div key={job.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">شناسه کتاب: {job.bookId}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">کاربر: {job.userId} • بخش جاری: {job.currentChunkTitle || 'فصل کتاب'}</div>
                      </div>
                      <div className="text-left font-mono text-xs">
                        <span className="text-amber-400 font-bold">{job.progressPercent}%</span>
                        <span className="text-slate-500 block text-[10px]">کلید: {job.assignedKeyMasked || 'خودکار'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1.5: MONTHLY COMPARATIVE ANALYTICS */}
        {/* ========================================================= */}
        {activeTab === 'monthly_analytics' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">تحلیل جامع و آمار مقایسه‌ای مالی و عملکرد</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ماه جاری در مقایسه با ماه قبل
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  بررسی رشد درآمد، تعداد کتاب‌های سفارش‌داده شده، کلمات پردازش شده و توکن‌های مصرفی هوش مصنوعی
                </p>
              </div>

              <button
                onClick={fetchMonthlyAnalytics}
                disabled={loadingMonthly}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMonthly ? 'animate-spin text-amber-400' : ''}`} />
                <span>بروزرسانی شاخص‌ها</span>
              </button>
            </div>

            {/* Top 5 Comparative KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Revenue */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>درآمد واریزی‌ها</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {monthlyAnalytics?.currentMonth.revenue.toLocaleString('fa-IR')}
                  <span className="text-xs text-slate-400 font-normal mr-1">تومان</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">ماه قبل: {monthlyAnalytics?.previousMonth.revenue.toLocaleString('fa-IR')}</span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      (monthlyAnalytics?.growth.revenuePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(monthlyAnalytics?.growth.revenuePercent || 0) >= 0 ? '+' : ''}
                    {monthlyAnalytics?.growth.revenuePercent}%
                    {(monthlyAnalytics?.growth.revenuePercent || 0) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Card 2: Books */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>کتاب‌های ترجمه‌شده</span>
                  <BookOpen className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {monthlyAnalytics?.currentMonth.booksTranslated.toLocaleString('fa-IR')}
                  <span className="text-xs text-slate-400 font-normal mr-1">جلد</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">ماه قبل: {monthlyAnalytics?.previousMonth.booksTranslated} جلد</span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      (monthlyAnalytics?.growth.booksPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(monthlyAnalytics?.growth.booksPercent || 0) >= 0 ? '+' : ''}
                    {monthlyAnalytics?.growth.booksPercent}%
                    {(monthlyAnalytics?.growth.booksPercent || 0) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Card 3: Words */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>کلمات پردازش‌شده</span>
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {monthlyAnalytics?.currentMonth.wordsTranslated.toLocaleString('fa-IR')}
                  <span className="text-xs text-slate-400 font-normal mr-1">کلمه</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">ماه قبل: {monthlyAnalytics?.previousMonth.wordsTranslated.toLocaleString('fa-IR')}</span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      (monthlyAnalytics?.growth.wordsPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(monthlyAnalytics?.growth.wordsPercent || 0) >= 0 ? '+' : ''}
                    {monthlyAnalytics?.growth.wordsPercent}%
                    {(monthlyAnalytics?.growth.wordsPercent || 0) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Card 4: Tokens */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>توکن‌های مصرفی AI</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {monthlyAnalytics?.currentMonth.tokensConsumed.toLocaleString('fa-IR')}
                  <span className="text-xs text-slate-400 font-normal mr-1">توکن</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">ماه قبل: {monthlyAnalytics?.previousMonth.tokensConsumed.toLocaleString('fa-IR')}</span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      (monthlyAnalytics?.growth.tokensPercent || 0) >= 0 ? 'text-purple-400' : 'text-slate-400'
                    }`}
                  >
                    {(monthlyAnalytics?.growth.tokensPercent || 0) >= 0 ? '+' : ''}
                    {monthlyAnalytics?.growth.tokensPercent}%
                  </span>
                </div>
              </div>

              {/* Card 5: New Users */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>کاربران جدید</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  {monthlyAnalytics?.currentMonth.newUsers.toLocaleString('fa-IR')}
                  <span className="text-xs text-slate-400 font-normal mr-1">عضو</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">ماه قبل: {monthlyAnalytics?.previousMonth.newUsers} عضو</span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      (monthlyAnalytics?.growth.usersPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(monthlyAnalytics?.growth.usersPercent || 0) >= 0 ? '+' : ''}
                    {monthlyAnalytics?.growth.usersPercent}%
                    {(monthlyAnalytics?.growth.usersPercent || 0) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <span>جدول مقایسه پارامترهای کلیدی (ماه جاری در برابر ماه گذشته)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">شاخص عملکردی</th>
                      <th className="py-3 px-4">ماه جاری (۳۰ روز اخیر)</th>
                      <th className="py-3 px-4">ماه قبل (۳۰ تا ۶۰ روز قبل)</th>
                      <th className="py-3 px-4">میزان تغییر</th>
                      <th className="py-3 px-4">وضعیت رشد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-sans font-bold text-slate-200">درآمد حاصل از شارژ و پرداخت‌ها</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        {monthlyAnalytics?.currentMonth.revenue.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {monthlyAnalytics?.previousMonth.revenue.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        +{monthlyAnalytics?.growth.revenuePercent}%
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">رشد مثبت و سودآور</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-sans font-bold text-slate-200">تعداد کتاب‌های سفارش‌داده شده</td>
                      <td className="py-3 px-4 text-amber-400 font-bold">
                        {monthlyAnalytics?.currentMonth.booksTranslated} کتاب
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {monthlyAnalytics?.previousMonth.booksTranslated} کتاب
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-400">
                        +{monthlyAnalytics?.growth.booksPercent}%
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">استقبال صعودی</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-sans font-bold text-slate-200">حجم کلمات ترجمه شده</td>
                      <td className="py-3 px-4 text-blue-400 font-bold">
                        {monthlyAnalytics?.currentMonth.wordsTranslated.toLocaleString('fa-IR')} کلمه
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {monthlyAnalytics?.previousMonth.wordsTranslated.toLocaleString('fa-IR')} کلمه
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-400">
                        +{monthlyAnalytics?.growth.wordsPercent}%
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">پردازش مستمر سرور</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-sans font-bold text-slate-200">مصرف توکن‌های هوش مصنوعی</td>
                      <td className="py-3 px-4 text-purple-400 font-bold">
                        {monthlyAnalytics?.currentMonth.tokensConsumed.toLocaleString('fa-IR')} توکن
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {monthlyAnalytics?.previousMonth.tokensConsumed.toLocaleString('fa-IR')} توکن
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-400">
                        +{monthlyAnalytics?.growth.tokensPercent}%
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">توزیع پایدار در صف</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-sans font-bold text-slate-200">تعداد کاربران ثبت‌نامی جدید</td>
                      <td className="py-3 px-4 text-cyan-400 font-bold">
                        {monthlyAnalytics?.currentMonth.newUsers} کاربر
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {monthlyAnalytics?.previousMonth.newUsers} کاربر
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        +{monthlyAnalytics?.growth.usersPercent}%
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px]">افزایش جامعه کاربری</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Keys Usage Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <span>تفکیک مصرف توکن‌ها و درخواست‌ها به ازای هر کلید و مدل هوش مصنوعی</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">نام سرور / کلید</th>
                      <th className="py-3 px-4">سرویس‌دهنده</th>
                      <th className="py-3 px-4">مدل فعال</th>
                      <th className="py-3 px-4">تعداد درخواست‌ها</th>
                      <th className="py-3 px-4">مجموع توکن مصرفی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {(monthlyAnalytics?.keyUsageBreakdown || []).map((k, idx) => (
                      <tr key={idx} className="hover:bg-slate-850">
                        <td className="py-3 px-4 font-sans font-bold text-slate-200">{k.name}</td>
                        <td className="py-3 px-4 font-sans text-amber-400 uppercase text-[11px] font-bold">{k.provider}</td>
                        <td className="py-3 px-4 text-slate-300">{k.model}</td>
                        <td className="py-3 px-4 text-slate-300">{k.requests.toLocaleString('fa-IR')}</td>
                        <td className="py-3 px-4 text-purple-400 font-bold">{k.tokensUsed.toLocaleString('fa-IR')} توکن</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform All-Time Cumulative Summary */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/20 flex flex-wrap items-center justify-between gap-6">
              <div>
                <h4 className="text-sm font-bold text-amber-400">آمار تجمیعی کل تاریخچه فعالیت سامانه</h4>
                <p className="text-xs text-slate-400 mt-1">از ابتدای راه‌اندازی تا این لحظه</p>
              </div>

              <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">کل درآمد تاریخچه:</span>
                  <span className="font-bold text-emerald-400 text-base">{monthlyAnalytics?.totals.allTimeRevenue.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">کل کتاب‌های ثبت شده:</span>
                  <span className="font-bold text-white text-base">{monthlyAnalytics?.totals.allTimeBooks} پروژه</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">کل کلمات تاریخچه:</span>
                  <span className="font-bold text-amber-400 text-base">{monthlyAnalytics?.totals.allTimeWords.toLocaleString('fa-IR')} کلمه</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">کل توکن‌های مصرفی:</span>
                  <span className="font-bold text-purple-400 text-base">{monthlyAnalytics?.totals.allTimeTokens.toLocaleString('fa-IR')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: COMPLETED BOOKS (MULTI-FORMAT DOWNLOAD & READER) */}
        {/* ========================================================= */}
        {activeTab === 'completed_books' && (
          <div className="space-y-6 animate-in fade-in">
            <AdminSectionGuide
              title="آرشیو کتاب‌های تکمیل‌شده کاربران و خروجی چندگانه"
              badge="کتابخانه خروجی"
              badgeColor="emerald"
              description="در این بخش کلیه کتاب‌هایی که فرآیند ترجمه آنها با موفقیت به پایان رسیده است نگهداری می‌شوند. مدیر سامانه می‌تواند کتاب‌ها را مستقیماً در مرورگر مطالعه کرده یا با انواع فرمت‌های چاپی و دیجیتال دانلود نماید."
              bullets={[
                {
                  title: 'مطالعه مستقیم در مرورگر',
                  text: 'با زدن دکمه «مطالعه مستقیم»، متن کامل و فصول کتاب با قابلیت تنظیم اندازه فونت باز می‌شود.'
                },
                {
                  title: 'خروجی Word و HTML کتابخوان',
                  text: 'امکان دانلود فایل DOCX استاندارد با استایل‌بندی راست‌به‌چپ یا پکیج وب HTML سبک برای مطالعه آفلاین.'
                },
                {
                  title: 'چاپ مستقیم و PDF',
                  text: 'تولید نسخه بهینه‌سازی‌شده برای پرینتر با صفحه‌بندی منظم فصول کتاب بدون نیاز به نرم‌افزار جانبی.'
                },
                {
                  title: 'جستجو در آرشیو',
                  text: 'یافتن سریع کتاب‌ها بر اساس نام فارسی، نام زبان اصلی، نویسنده یا نام کاربر سفارش‌دهنده.'
                }
              ]}
              tip="نکته: خروجی‌های تولید شده کاملاً مستقل هستند و کاربران نیز در پنل کاربری خود امکان دریافت همین فایل‌ها را دارند."
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookCheck className="w-6 h-6 text-emerald-400" />
                  <span>آرشیو کتاب‌های ترجمه‌شده کاربران (دانلود و مطالعه مستقیم)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  مشاهده و دانلود کامل کتاب‌های ترجمه‌شده با فرمت‌های Word، PDF، کتابخوان وب (HTML/EPUB) و فایل متنی TXT
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    placeholder="جستجو در نام کتاب، نویسنده یا کاربر..."
                    value={completedBookSearch}
                    onChange={(e) => setCompletedBookSearch(e.target.value)}
                    className="w-full px-4 py-2 pr-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <button
                  onClick={fetchAllBooks}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  بروزرسانی
                </button>
              </div>
            </div>

            {/* Quick summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">کتاب‌های ترجمه‌شده آماده:</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {completedBooksCount.toLocaleString('fa-IR')} <span className="text-xs text-slate-400 font-normal">عنوان</span>
                  </div>
                </div>
                <BookCheck className="w-8 h-8 text-emerald-500/30" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">فرمت‌های دانلود فعال:</span>
                  <div className="text-xs font-bold text-amber-300 mt-1">Word (.doc), PDF, HTML/EPUB, TXT</div>
                </div>
                <Download className="w-8 h-8 text-amber-500/30" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">قابلیت مطالعه درون پنل:</span>
                  <div className="text-xs font-bold text-cyan-300 mt-1">کتابخوان تعاملی با تغییر اندازه قلم</div>
                </div>
                <Eye className="w-8 h-8 text-cyan-500/30" />
              </div>
            </div>

            {/* Completed Books Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">عنوان کتاب</th>
                      <th className="py-3.5 px-4">سفارش‌دهنده</th>
                      <th className="py-3.5 px-4">تعداد کلمات</th>
                      <th className="py-3.5 px-4">پیشرفت بخش‌ها</th>
                      <th className="py-3.5 px-4">وضعیت</th>
                      <th className="py-3.5 px-4 text-center">دانلود در فرمت‌های مختلف و مطالعه</th>
                      <th className="py-3.5 px-4 text-left">مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {completedBooksList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          {loadingBooks ? 'در حال بارگذاری لیست کتاب‌ها...' : 'هیچ کتاب ترجمه‌شده‌ای یافت نشد.'}
                        </td>
                      </tr>
                    ) : (
                      completedBooksList.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm">{b.title}</div>
                            {b.originalTitle && (
                              <div className="text-[11px] text-slate-400 font-serif" dir="ltr">{b.originalTitle}</div>
                            )}
                            {b.author && (
                              <div className="text-[10px] text-amber-400/80 mt-0.5">نویسنده: {b.author}</div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-slate-200 font-medium">{b.user?.name || 'کاربر عمومی'}</div>
                            <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                              {b.user?.phone || b.user?.email || b.userId}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-amber-400">
                            {(b.wordCount || 0).toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400 font-normal">کلمه</span>
                          </td>
                          <td className="py-4 px-4 font-mono">
                            <span className="text-emerald-400 font-bold">{b.completedChunks || 0}</span>
                            <span className="text-slate-500"> / {b.chunksCount || 0} بخش</span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                b.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {b.status === 'completed' ? 'تکمیل شده' : 'ترجمه جزیی / در جریان'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {/* Word Download */}
                              <button
                                onClick={() => handleDownloadWordDoc(b)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                                title="دانلود فایل ورد (.doc)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Word</span>
                              </button>

                              {/* PDF Print */}
                              <button
                                onClick={() => handlePrintBookPdf(b)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                                title="چاپ و دانلود مستقیم PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>

                              {/* HTML / EPUB */}
                              <button
                                onClick={() => handleDownloadHtmlBook(b)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                                title="دانلود کتاب دیجیتال HTML/EPUB"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                                <span>HTML</span>
                              </button>

                              {/* TXT Download */}
                              <button
                                onClick={() => handleDownloadTxtBook(b)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                                title="دانلود متن خالص TXT"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>TXT</span>
                              </button>

                              {/* Online Reader */}
                              <button
                                onClick={() => handleOpenReader(b)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                                title="مطالعه آنلاین در پنل"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>مطالعه</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-left">
                            <button
                              onClick={() => handleDeleteBookAdmin(b.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="حذف کتاب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Online Book Reader Modal */}
            {readingBookModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-amber-400" />
                        <h3 className="font-bold text-base text-white">{readingBookModal.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {readingBookModal.author ? `نویسنده: ${readingBookModal.author} | ` : ''}
                        {readingBookModal.chunks?.length || 0} بخش و فصل ثبت‌شده
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Font size adjustment */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 text-[10px]">اندازه قلم:</span>
                        <button
                          onClick={() => setReadingFontSize(Math.max(12, readingFontSize - 2))}
                          className="px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-amber-400 w-5 text-center">{readingFontSize}</span>
                        <button
                          onClick={() => setReadingFontSize(Math.min(26, readingFontSize + 2))}
                          className="px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleDownloadWordDoc(readingBookModal)}
                        className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs"
                        title="دانلود فایل ورد"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handlePrintBookPdf(readingBookModal)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs"
                        title="چاپ یا ذخیره PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setReadingBookModal(null)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reading Body */}
                  <div
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-950/70 rounded-2xl border border-slate-800/80 my-4 select-text"
                    style={{ fontSize: `${readingFontSize}px`, lineHeight: 2.2 }}
                  >
                    {(!readingBookModal.chunks || readingBookModal.chunks.length === 0) ? (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        هنوز محتوای ترجمه‌شده‌ای برای این کتاب ثبت نشده است.
                      </div>
                    ) : (
                      readingBookModal.chunks.map((ch: any, idx: number) => (
                        <div key={ch.id || idx} className="border-b border-slate-800/80 pb-8 last:border-0">
                          <h4 className="text-amber-400 font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-mono">
                              {idx + 1}
                            </span>
                            <span>{ch.title || `بخش ${idx + 1}`}</span>
                          </h4>

                          <div
                            className="text-slate-200 text-justify leading-loose"
                            dangerouslySetInnerHTML={{
                              __html: ch.translatedHtml || (ch.translatedText ? ch.translatedText.replace(/\n/g, '<br/>') : '<p class="text-slate-500 italic">ترجمه نشده</p>')
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1.7: ALL BOOKS OVERSIGHT */}
        {/* ========================================================= */}
        {activeTab === 'all_books' && (
          <div className="space-y-6 animate-in fade-in">
            <AdminSectionGuide
              title="نظارت سراسری، بازرسی محتوا و پروژه‌های کتاب"
              badge="نظارت بر محتوا"
              badgeColor="amber"
              description="این بخش دید جامعی از کلیه کتاب‌های ثبت شده در کل پلتفرم ارائه می‌دهد؛ چه در حال ترجمه باشند، چه در مرحله پیش‌نویس یا تکمیل شده."
              bullets={[
                {
                  title: 'محاسبه هزینه و کلمات',
                  text: 'مشاهده تعداد دقیق کلمات هر کتاب و مبلغ محاسبه شده که از کاربر دریافت شده است.'
                },
                {
                  title: 'نظارت بر روند پیشرفت',
                  text: 'مشاهده تعداد بخش‌ها (چانک‌ها) ی تکمیل شده در برابر کل بخش‌های کتاب به همراه درصد پیشرفت زنده.'
                },
                {
                  title: 'مدیریت و حذف پروژه‌های غیرمجاز',
                  text: 'در صورت آپلود محتوای نامناسب، مدیر ارشد می‌تواند پروژه را به همراه تمام چانک‌های آن از دیتابیس حذف نماید.'
                },
                {
                  title: 'ارتباط مستقیم با کاربر',
                  text: 'شماره تلفن و ایمیل سفارش‌دهنده هر کتاب در دسترس است تا در صورت لزوم بتوانید با او تماس بگیرید.'
                }
              ]}
              tip="راهنمایی: کتاب‌هایی که وضعیت آنها «در حال ترجمه» است هم‌اکنون در صف سرور به ترتیب اولویت و بدون نیاز به حضور کاربر در حال پردازش هستند."
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">نظارت، بازرسی و مدیریت کلیه کتاب‌های سامانه</h2>
                <p className="text-xs text-slate-400">
                  مشاهده تمام کتاب‌های ایجاد شده توسط کاربران، تعداد کلمات، وضعیت ترجمه و امکان حذف کتاب‌های غیرمجاز
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    placeholder="جستجو در عنوان کتاب، نویسنده یا کاربر..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full px-4 py-2 pr-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <button
                  onClick={fetchAllBooks}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  بروزرسانی
                </button>
              </div>
            </div>

            {/* Books Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">عنوان کتاب</th>
                      <th className="py-3.5 px-4">کاربر سفارش‌دهنده</th>
                      <th className="py-3.5 px-4">تعداد کلمات</th>
                      <th className="py-3.5 px-4">هزینه محاسبه‌شده</th>
                      <th className="py-3.5 px-4">فصل‌ها / بخش‌ها</th>
                      <th className="py-3.5 px-4">وضعیت</th>
                      <th className="py-3.5 px-4 text-center">عملیات مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredBooks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          کتابی با این مشخصات یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredBooks.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{b.title}</div>
                            <div className="text-[11px] text-slate-400">{b.originalTitle || '—'}</div>
                            {b.author && <div className="text-[10px] text-slate-500 mt-0.5">نویسنده: {b.author}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200 font-medium">{b.user?.name || 'کاربر عمومی'}</div>
                            <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{b.user?.phone || b.user?.email || b.userId}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {(b.wordCount || 0).toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400 font-normal">کلمه</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {(b.estimatedCost || 0).toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-white font-bold">{b.completedChunks || 0}</span>
                            <span className="text-slate-500"> از {b.chunksCount || 0} بخش</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                b.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : b.status === 'translating'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {b.status === 'completed' ? 'تکمیل شده' : b.status === 'translating' ? 'در حال ترجمه' : 'پیش‌نویس'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteBookAdmin(b.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 mx-auto transition"
                              title="حذف کامل کتاب از سیستم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف کتاب</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: USER MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <AdminSectionGuide
              title="مدیریت جامع کاربران، نقش‌ها و کنترل اعتبار کیف پول"
              badge="کاربران و مشتریان"
              badgeColor="blue"
              description="در این بخش لیست کامل حساب‌های کاربری، شماره‌های تماس، اعتبار باقی‌مانده و کتاب‌های هر کاربر ثبت است. شما می‌توانید به هر کاربر شارژ هدیه اهدا کنید، دسترسی او را مسدود یا به مدیر ارشد ارتقا دهید."
              bullets={[
                {
                  title: 'شارژ مستقیم و هدیه سریع',
                  text: 'با دکمه‌های هدیه (+۵۰ و +۱۰۰ هزار تومان) می‌توانید فوراً بدون فرم‌های طولانی به کیف پول کاربر اعتبار اضافه کنید.'
                },
                {
                  title: 'بازرسی کتاب‌های اختصاصی کاربر',
                  text: 'با کلیک روی دکمه «مشاهده کتاب‌ها»، تمام پروژه‌ها، وضعیت ترجمه و کلمات ترجمه شده توسط آن کاربر به نمایش درمی‌آید.'
                },
                {
                  title: 'تغییر نقش و مسدودسازی آنی',
                  text: 'امکان ارتقای کاربر به مدیر سیستم یا مسدود کردن کاربران متخلف با یک کلیک و ثبت در دیتابیس سرور.'
                },
                {
                  title: 'جستجوی پیشرفته',
                  text: 'امکان فیلتر سریع بر اساس نام کاربر، شماره موبایل ثبت شده یا آدرس ایمیل.'
                }
              ]}
              tip="راهنمایی: موجودی کیف پول کاربر برای کسر هزینه ترجمه هر چانک استفاده می‌شود؛ هر زمان موجودی کاربر صفر شود، سیستم به او هشدار افزایش اعتبار می‌دهد."
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">مدیریت تمام کاربران سامانه</h2>
                <p className="text-xs text-slate-400">مشاهده مشخصات، شارژ کیف پول، نقش و کتاب‌های هر کاربر</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCreateUserModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>افزودن کاربر جدید</span>
                </button>
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    placeholder="جستجو با نام، شماره یا ایمیل..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-4 py-2 pr-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">کاربر</th>
                      <th className="py-3.5 px-4">اطلاعات تماس</th>
                      <th className="py-3.5 px-4">نقش</th>
                      <th className="py-3.5 px-4">مانده کیف پول</th>
                      <th className="py-3.5 px-4">کل مصرف‌شده</th>
                      <th className="py-3.5 px-4">کتاب‌ها و کلمات</th>
                      <th className="py-3.5 px-4">وضعیت</th>
                      <th className="py-3.5 px-4 text-left">عملیات و مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div>{u.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(-6)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-mono" dir="ltr">{u.phone}</div>
                          <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role === 'admin' ? 'مدیر ارشد' : 'کاربر عادی'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                          <span className="bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            {(u.walletBalance || 0).toLocaleString('fa-IR')} <span className="text-[10px] text-emerald-300 font-normal">تومان</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-purple-400 font-mono">
                          <span className="bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                            {(u.totalSpent || 0).toLocaleString('fa-IR')} <span className="text-[10px] text-purple-300 font-normal">تومان</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleInspectUserBooks(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/20 text-[11px] flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>{u.booksCount || 0} کتاب ({(u.translatedWords || 0).toLocaleString('fa-IR')} کلمه)</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {u.status === 'active' ? 'فعال' : 'مسدود'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end flex-wrap gap-1.5">
                            {/* Edit User Button */}
                            <button
                              onClick={() => setEditUserModal({
                                id: u.id,
                                name: u.name,
                                phone: u.phone,
                                email: u.email || '',
                                role: u.role,
                                status: u.status,
                                password: '',
                              })}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                              title="ویرایش مشخصات نام، شماره، نقش، رمز عبور"
                            >
                              <Edit3 className="w-3 h-3 text-indigo-400" />
                              <span>ویرایش</span>
                            </button>

                            {/* Wallet Adjust Button */}
                            <button
                              onClick={() => setAdjustWalletModal({ user: u, amount: 50000, description: 'شارژ کیف پول توسط مدیر' })}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                              title="افزایش یا کسر موجودی کیف پول"
                            >
                              <Wallet className="w-3 h-3 text-emerald-400" />
                              <span>کیف پول (+/-)</span>
                            </button>

                            <button
                              onClick={() => handleUpdateUserStatus(u.id, u.role === 'admin' ? 'user' : 'admin', u.status)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                              title="تغییر نقش کاربری"
                            >
                              {u.role === 'admin' ? 'کاربر عادی' : 'مدیر'}
                            </button>

                            <button
                              onClick={() => handleUpdateUserStatus(u.id, u.role, u.status === 'active' ? 'banned' : 'active')}
                              className={`px-2 py-1 rounded-lg text-[10px] ${
                                u.status === 'active'
                                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {u.status === 'active' ? 'مسدودسازی' : 'فعال‌سازی'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Edit User Profile */}
            {editUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold text-base text-white">ویرایش مشخصات کاربر: {editUserModal.name}</h3>
                    </div>
                    <button
                      onClick={() => setEditUserModal(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditUser} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">نام و نام خانوادگی:</label>
                        <input
                          type="text"
                          value={editUserModal.name}
                          onChange={(e) => setEditUserModal({ ...editUserModal, name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">شماره تلفن همراه:</label>
                        <input
                          type="tel"
                          dir="ltr"
                          value={editUserModal.phone}
                          onChange={(e) => setEditUserModal({ ...editUserModal, phone: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">آدرس ایمیل:</label>
                        <input
                          type="email"
                          dir="ltr"
                          value={editUserModal.email}
                          onChange={(e) => setEditUserModal({ ...editUserModal, email: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">نقش کاربری:</label>
                        <select
                          value={editUserModal.role}
                          onChange={(e) => setEditUserModal({ ...editUserModal, role: e.target.value as any })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="user">کاربر عادی سامانه</option>
                          <option value="admin">مدیر ارشد (دسترسی کامل)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">وضعیت حساب:</label>
                        <select
                          value={editUserModal.status}
                          onChange={(e) => setEditUserModal({ ...editUserModal, status: e.target.value as any })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="active">فعال (مجاز به استفاده)</option>
                          <option value="banned">مسدود (غیرفعال)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">تغییر رمز عبور (اختیاری):</label>
                        <input
                          type="password"
                          dir="ltr"
                          placeholder="در صورت خالی بودن تغییر نمی‌کند"
                          value={editUserModal.password || ''}
                          onChange={(e) => setEditUserModal({ ...editUserModal, password: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="submit"
                        disabled={editUserLoading}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        {editUserLoading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>ذخیره تغییرات مشخصات کاربر</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUserModal(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Inspect Specific User Books */}
            {selectedUserBooks && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <div>
                      <h3 className="font-bold text-base text-white">
                        کتاب‌های کاربر: {selectedUserBooks.user.name} ({selectedUserBooks.user.phone})
                      </h3>
                      <p className="text-xs text-slate-400">دسترسی و بازرسی کامل مدیر به کتاب‌های ایجاد شده توسط این کاربر</p>
                    </div>
                    <button
                      onClick={() => setSelectedUserBooks(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {selectedUserBooks.books.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-500">
                        این کاربر تا کنون کتابی ایجاد نکرده است.
                      </div>
                    ) : (
                      selectedUserBooks.books.map((b) => (
                        <div key={b.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-sm text-amber-300">{b.title}</h4>
                              <p className="text-xs text-slate-400 font-serif" dir="ltr">{b.originalTitle}</p>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              وضعیت: {b.status === 'completed' ? 'تکمیل شده' : b.status === 'translating' ? 'در حال ترجمه' : 'پیش‌نویس'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 mb-2">
                            <div>کلمات: <b className="text-white">{(b.wordCount || 0).toLocaleString('fa-IR')}</b></div>
                            <div>تعداد بخش‌ها: <b className="text-white">{b.chunks?.length || 0} فصل</b></div>
                            <div>لحن: <b className="text-amber-400">{b.tone}</b></div>
                          </div>

                          <div className="text-[11px] text-slate-500 line-clamp-2">
                            نمونه متن ترجمه شده: {b.chunks?.[0]?.translatedHtml?.replace(/<[^>]+>/g, ' ').slice(0, 160) || 'هنوز ترجمه نشده'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Adjust User Wallet */}
            {adjustWalletModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-base text-white">مدیریت کیف پول: {adjustWalletModal.user.name}</h3>
                    </div>
                    <button
                      onClick={() => setAdjustWalletModal(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 mb-4 flex items-center justify-between text-xs">
                    <span className="text-slate-400">موجودی فعلی کاربر:</span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">
                      {(adjustWalletModal.user.walletBalance || 0).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Quick Preset Adjust Buttons */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">انتخاب سریع مبلغ:</span>
                      <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setAdjustWalletModal({ ...adjustWalletModal, amount: 50000, description: 'شارژ تشویقی ۵۰ هزار تومان' })}
                          className="py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold"
                        >
                          +۵۰,۰۰۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustWalletModal({ ...adjustWalletModal, amount: 100000, description: 'شارژ تشویقی ۱۰۰ هزار تومان' })}
                          className="py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold"
                        >
                          +۱۰۰,۰۰۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustWalletModal({ ...adjustWalletModal, amount: 200000, description: 'شارژ تشویقی ۲۰۰ هزار تومان' })}
                          className="py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold"
                        >
                          +۲۰۰,۰۰۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustWalletModal({ ...adjustWalletModal, amount: -20000, description: 'کسر ۲۰ هزار تومان توسط مدیر' })}
                          className="py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold"
                        >
                          -۲۰,۰۰۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustWalletModal({ ...adjustWalletModal, amount: -50000, description: 'کسر ۵۰ هزار تومان توسط مدیر' })}
                          className="py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold"
                        >
                          -۵۰,۰۰۰
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustWalletModal({ ...adjustWalletModal, amount: -100000, description: 'کسر ۱۰۰ هزار تومان توسط مدیر' })}
                          className="py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold"
                        >
                          -۱۰۰,۰۰۰
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        مبلغ دلخواه تغییر (تومان - عدد مثبت برای اضافه کردن، منفی برای کسر):
                      </label>
                      <input
                        type="number"
                        step="5000"
                        value={adjustWalletModal.amount}
                        onChange={(e) => setAdjustWalletModal({ ...adjustWalletModal, amount: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Projected Balance Preview */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-400">موجودی جدید پس از اعمال:</span>
                      <span className={`font-bold font-mono text-sm ${
                        (adjustWalletModal.user.walletBalance + adjustWalletModal.amount) >= 0
                          ? 'text-white'
                          : 'text-rose-400'
                      }`}>
                        {Math.max(0, adjustWalletModal.user.walletBalance + adjustWalletModal.amount).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        علت و توضیحات تغییر موجودی:
                      </label>
                      <input
                        type="text"
                        value={adjustWalletModal.description}
                        onChange={(e) => setAdjustWalletModal({ ...adjustWalletModal, description: e.target.value })}
                        placeholder="مثلاً: هدیه شارژ تشویقی یا کسر بابت خدمات"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveWalletAdjustment}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-bold text-xs shadow-md transition"
                      >
                        {adjustWalletModal.amount >= 0 ? `شارژ +${adjustWalletModal.amount.toLocaleString('fa-IR')} تومان` : `کسر ${Math.abs(adjustWalletModal.amount).toLocaleString('fa-IR')} تومان`}
                      </button>
                      <button
                        onClick={() => setAdjustWalletModal(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Create New User by Admin */}
            {createUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-base text-white">افزودن کاربر جدید توسط مدیر</h3>
                    </div>
                    <button
                      onClick={() => setCreateUserModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {createUserError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{createUserError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نام و نام خانوادگی:</label>
                      <input
                        type="text"
                        placeholder="مثال: علی احمدی"
                        value={createUserForm.name}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">شماره تلفن همراه (الزامی):</label>
                      <input
                        type="tel"
                        dir="ltr"
                        placeholder="09123456789"
                        value={createUserForm.phone}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">ایمیل (اختیاری):</label>
                      <input
                        type="email"
                        dir="ltr"
                        placeholder="user@example.com"
                        value={createUserForm.email}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">کلمه عبور (الزامی):</label>
                      <input
                        type="password"
                        dir="ltr"
                        placeholder="حداقل ۶ نویسه"
                        value={createUserForm.password}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">نقش کاربری:</label>
                        <select
                          value={createUserForm.role}
                          onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value as 'user' | 'admin' })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="user">کاربر عادی</option>
                          <option value="admin">مدیر ارشد</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">شارژ اولیه کیف پول:</label>
                        <input
                          type="number"
                          step="10000"
                          value={createUserForm.walletBalance}
                          onChange={(e) => setCreateUserForm({ ...createUserForm, walletBalance: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="submit"
                        disabled={createUserLoading}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition"
                      >
                        {createUserLoading ? 'در حال ثبت...' : 'ثبت و ایجاد کاربر'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateUserModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: API POOL & PARALLEL QUEUE */}
        {/* ========================================================= */}
        {activeTab === 'api_pool' && (
          <div className="space-y-6">
            <AdminSectionGuide
              title="استخر مرکزی کلیدهای هوش مصنوعی و صف پس‌زمینه سرور (مستقل از مرورگر)"
              badge="پردازش ۱۰۰٪ سمت سرور بدون نیاز به کاربر"
              badgeColor="amber"
              description="کلیه کلیدها و مدل‌های هوش مصنوعی مستقیماً روی سرور سیستم ذخیره و مدیریت می‌شوند. کاربران برای ترجمه نیازی به تهیه کلید، وارد کردن API Key یا باز نگه‌داشتن مرورگر خود ندارند. با شروع ترجمه، صف سرور به صورت خودکار کار را به پایان می‌رساند."
              bullets={[
                {
                  title: 'امکان ویرایش کامل هر کلید',
                  text: 'شما می‌توانید در هر زمان نام، توکن API، مدل انتخابی، آدرس پایه (Base URL پروکسی) یا اولویت هر کلید را در سرور ویرایش کنید.'
                },
                {
                  title: 'ذخیره امن روی سرور و استقلال کاربر',
                  text: 'کاربران بدون نیاز به وارد کردن هیچ کلیدی کتاب خود را بارگذاری می‌کنند و سرور کار ترجمه را مستقل پیش می‌برد.'
                },
                {
                  title: 'تحمل خطا و سوئیچ خودکار (Failover)',
                  text: 'اگر کلیدی با محدودیت نرخ (۴۲۹) یا خطای شبکه مواجه شود، درخواست بدون وقفه به کلید فعال بعدی منتقل می‌گردد.'
                },
                {
                  title: 'تست پینگ همزمان کلیدها',
                  text: 'با یک کلیک سرعت تاخیر پاسخگویی (Latency) و سلامت تمامی کلیدهای موجود در استخر به صورت موازی ارزیابی می‌شود.'
                }
              ]}
              tip="نکته مهم: برای سرعت و اطمینان حداکثری، همواره ۲ الی ۳ کلید از مدل‌های پرسرعت مانند Gemini 3.8 Flash یا MiniMax/GLM را در استخر فعال نگه دارید."
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-amber-400" />
                  <span>مدیریت استخر کلیدهای هوش مصنوعی و صف هوشمند</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  توزیع هوشمند درخواست‌ها بین کلیدهای فعال سرور و پردازش پس‌زمینه بدون وابستگی به کاربر
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestAllKeys}
                  disabled={testingAllKeys}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  title="ارزیابی سلامت و تاخیر تمامی کلیدها به طور همزمان"
                >
                  {testingAllKeys ? <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> : <Zap className="w-4 h-4 text-purple-400" />}
                  <span>{testingAllKeys ? 'در حال بررسی...' : 'تست پینگ همزمان تمام کلیدها'}</span>
                </button>
                <button
                  onClick={() => { fetchApiKeys(); fetchQueueStats(); }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  بروزرسانی وضعیت
                </button>
                <button
                  onClick={() => setNewKeyModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  افزودن کلید جدید به استخر
                </button>
              </div>
            </div>

            {/* Live Queue Monitor Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-bold text-white">موتور پردازش پس‌زمینه سرور (Autonomous Server Queue)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    فعال و آنلاین
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>وضعیت اجرا:</span>
                  <strong className="text-slate-200">مستقل بر روی سرور (بدون نیاز به باز ماندن مرورگر کاربر)</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/70">
                  <div className="text-slate-400 text-[11px] mb-1">پردازش‌های در حال انجام:</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {queueStats ? queueStats.activeJobs : (overview?.activeJobsCount || 0)}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/70">
                  <div className="text-slate-400 text-[11px] mb-1">کتاب‌های در صف انتظار:</div>
                  <div className="text-lg font-black text-blue-400 font-mono">
                    {queueStats ? queueStats.queuedJobs : 0}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/70">
                  <div className="text-slate-400 text-[11px] mb-1">کلیدهای آماده در استخر:</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {apiKeys.filter((k) => k.isActive).length} <span className="text-[10px] text-slate-500 font-normal">از {apiKeys.length}</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/70">
                  <div className="text-slate-400 text-[11px] mb-1">نرخ بررسی خودکار صف:</div>
                  <div className="text-lg font-black text-purple-400 font-mono">
                    هر ۳.۵ ثانیه
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Test Results Banner */}
            {batchTestResults && batchTestResults.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    نتیجه تست همزمان پینگ کلیدها:
                  </span>
                  <button
                    onClick={() => setBatchTestResults(null)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    بستن گزارش
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                  {batchTestResults.map((r, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        r.status === 'ok'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold block truncate">{r.name}</span>
                        <span className="text-[10px] opacity-75">{r.provider} / {r.model}</span>
                      </div>
                      <div className="text-left font-mono font-bold shrink-0 mr-2">
                        {r.status === 'ok' ? `${r.latencyMs} ms` : 'خطا'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features callout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  تفکیک کلید به ازای هر کاربر فعال
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  هنگامی که چند کاربر همزمان ترجمه می‌کنند، سیستم به هر کاربر یک کلید مجزا از استخر اختصاص می‌دهد تا سهمیه هیچ کاربری مسدود نشود.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  سوئیچ خودکار در خطای ۴۲۹ و ۵۰۳
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  در صورت اتمام سهمیه یا شلوغی سرور ارائه‌دهنده، پردازش کتاب بدون وقفه به کلید فعال بعدی منتقل می‌شود.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  صف هوشمند FIFO
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  کتاب‌های ارسالی کاربران بر اساس زمان ثبت در صف سرور قرار گرفته و به ترتیب اولویت و کلمات پردازش می‌شوند.
                </p>
              </div>
            </div>

            {/* API Keys Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">عنوان کلید / سرور</th>
                      <th className="py-3.5 px-4">ارائه‌دهنده و مدل</th>
                      <th className="py-3.5 px-4">کلید ماسک شده</th>
                      <th className="py-3.5 px-4">وضعیت</th>
                      <th className="py-3.5 px-4">تعداد درخواست‌ها</th>
                      <th className="py-3.5 px-4">توکن‌های مصرفی</th>
                      <th className="py-3.5 px-4">تاخیر پاسخ</th>
                      <th className="py-3.5 px-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {apiKeys.map((k) => {
                      const isCooldown = k.cooldownUntil > Date.now();
                      const secondsLeft = Math.max(0, Math.ceil((k.cooldownUntil - Date.now()) / 1000));
                      const masked = k.apiKey ? `${k.apiKey.slice(0, 4)}...${k.apiKey.slice(-4)}` : 'کلید سرور';

                      return (
                        <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div>{k.name}</div>
                            {k.assignedUserId && (
                              <span className="text-[10px] text-amber-400 font-mono">کاربر اختصاصی: {k.assignedUserId}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">
                              {k.provider} / {k.model}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400" dir="ltr">
                            {masked}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {isCooldown ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                                  توقف موقت ({secondsLeft} ثانیه)
                                </span>
                              ) : k.isActive ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                  فعال و آماده
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px]">
                                  غیرفعال
                                </span>
                              )}
                              <button
                                onClick={() => handleToggleKeyActive(k)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                                  k.isActive
                                    ? 'border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-400'
                                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                                title="تغییر وضعیت فعال / غیرفعال کلید"
                              >
                                {k.isActive ? 'خاموش' : 'روشن'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-white font-bold">{k.successfulRequests || 0}</span> موفق / <span className="text-rose-400">{k.failedRequests || 0}</span> خطا
                          </td>
                          <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">
                            {(k.totalTokensUsed || 0).toLocaleString('fa-IR')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {k.lastLatencyMs ? `${k.lastLatencyMs} ms` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditKey(k)}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1 transition"
                                title="ویرایش کامل کلید، مدل، توکن یا آدرس پایه در سرور"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>ویرایش</span>
                              </button>
                              <button
                                onClick={() => handleTestApiKey(k)}
                                disabled={testingKeyId === k.id}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                              >
                                {testingKeyId === k.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-400" />}
                                <span>تست اتصال</span>
                              </button>
                              <button
                                onClick={() => handleDeleteApiKey(k.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                title="حذف کلید"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Key Modal */}
            {newKeyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <h3 className="font-bold text-base text-white mb-4">افزودن کلید یا سرور هوش مصنوعی جدید</h3>

                  <form onSubmit={handleAddApiKey} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نام یا برچسب کلید:</label>
                      <input
                        type="text"
                        placeholder="مثلاً: کلید کمکی ۲ جمینای"
                        value={newKeyForm.name}
                        onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">ارائه‌دهنده هوش مصنوعی (Provider):</label>
                      <select
                        value={newKeyForm.provider}
                        onChange={(e) => {
                          const p = e.target.value;
                          const defaultModels = PROVIDER_PRESET_MODELS[p] || [];
                          const defaultBaseUrl = PROVIDER_DEFAULT_BASE_URL[p] || '';
                          setNewKeyForm({
                            ...newKeyForm,
                            provider: p,
                            model: defaultModels[0] || '',
                            baseURL: defaultBaseUrl,
                            isCustomModel: false,
                          });
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                      >
                        <option value="gemini">Google Gemini (پیش‌فرض فصیح و استاندارد)</option>
                        <option value="glm">GLM - Zhipu AI (GLM-4 / GLM-Zero چینی)</option>
                        <option value="minimax">MiniMax (MiniMax-Text-01 / Abab چینی)</option>
                        <option value="openai">OpenAI (GPT-4o / GPT-4o-mini / o1)</option>
                        <option value="claude">Anthropic Claude (Sonnet 3.5 / 3.7)</option>
                        <option value="deepseek">DeepSeek Direct API</option>
                        <option value="openrouter">OpenRouter (دسترسی تجمیعی به همه مدل‌ها)</option>
                        <option value="proxy">سرویس واسطه / OneAPI / NewAPI / پروکسی اختصاصی</option>
                        <option value="custom">ارائه‌دهنده سفارشی (Custom API / Self-hosted)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">کلید API (API Key یا توکن دسترسی):</label>
                      <input
                        type="password"
                        dir="ltr"
                        placeholder="AIzaSy... یا sk-..."
                        value={newKeyForm.apiKey}
                        onChange={(e) => setNewKeyForm({ ...newKeyForm, apiKey: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">مدل هوش مصنوعی (Model):</label>
                        <button
                          type="button"
                          onClick={() => setNewKeyForm({ ...newKeyForm, isCustomModel: !newKeyForm.isCustomModel })}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          {newKeyForm.isCustomModel ? 'انتخاب از مدل‌های پیش‌فرض' : 'ورود دستی نام مدل (سفارشی)'}
                        </button>
                      </div>

                      {!newKeyForm.isCustomModel ? (
                        <select
                          value={newKeyForm.model}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setNewKeyForm({ ...newKeyForm, isCustomModel: true, model: '' });
                            } else {
                              setNewKeyForm({ ...newKeyForm, model: e.target.value });
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                        >
                          {(PROVIDER_PRESET_MODELS[newKeyForm.provider] || []).map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          <option value="__custom__">+ ورود دستی نام مدل دیگر...</option>
                        </select>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="مثلاً: glm-4-air یا deepseek-ai/DeepSeek-V3 یا gpt-4o"
                            value={newKeyForm.model}
                            onChange={(e) => setNewKeyForm({ ...newKeyForm, model: e.target.value })}
                            required
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                          />
                          <p className="text-[10px] text-slate-400">نام دقیق مدل را وارد نمایید تا به موتور ارائه‌دهنده پاس داده شود.</p>
                        </div>
                      )}
                    </div>

                    {newKeyForm.provider !== 'gemini' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          آدرس پایه سرور یا واسطه (Base URL):
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          placeholder={
                            newKeyForm.provider === 'glm'
                              ? 'https://open.bigmodel.cn/api/paas/v4'
                              : newKeyForm.provider === 'minimax'
                              ? 'https://api.minimax.chat/v1'
                              : newKeyForm.provider === 'proxy'
                              ? 'https://api.oneapi.ir/v1'
                              : 'https://api.openai.com/v1'
                          }
                          value={newKeyForm.baseURL}
                          onChange={(e) => setNewKeyForm({ ...newKeyForm, baseURL: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          می‌توانید از سرورهای اختصاصی واسطه مانند OneAPI، NewAPI یا پروکسی‌های معکوس ایران/خارج استفاده کنید.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                      >
                        ثبت کلید در استخر
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewKeyModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Key Modal */}
            {editKeyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-amber-400" />
                        <span>ویرایش کلید API در سرور</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        شناسه کلید: <span className="font-mono text-amber-300">{editKeyModal.id}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditKeyModal(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditedApiKey} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نام یا عنوان نمایشی کلید:</label>
                      <input
                        type="text"
                        value={editKeyForm.name}
                        onChange={(e) => setEditKeyForm({ ...editKeyForm, name: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">ارائه‌دهنده (Provider):</label>
                      <select
                        value={editKeyForm.provider}
                        onChange={(e) => {
                          const p = e.target.value;
                          const defaultModels = PROVIDER_PRESET_MODELS[p] || [];
                          const defaultBaseUrl = PROVIDER_DEFAULT_BASE_URL[p] || '';
                          setEditKeyForm({
                            ...editKeyForm,
                            provider: p,
                            model: defaultModels[0] || '',
                            baseURL: defaultBaseUrl,
                            isCustomModel: false,
                          });
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                      >
                        <option value="gemini">Google Gemini (پیش‌فرض فصیح و استاندارد)</option>
                        <option value="glm">GLM - Zhipu AI (GLM-4 / GLM-Zero چینی)</option>
                        <option value="minimax">MiniMax (MiniMax-Text-01 / Abab چینی)</option>
                        <option value="openai">OpenAI (GPT-4o / GPT-4o-mini / o1)</option>
                        <option value="claude">Anthropic Claude (Sonnet 3.5 / 3.7)</option>
                        <option value="deepseek">DeepSeek Direct API</option>
                        <option value="openrouter">OpenRouter (دسترسی تجمیعی به همه مدل‌ها)</option>
                        <option value="proxy">سرویس واسطه / OneAPI / NewAPI / پروکسی اختصاصی</option>
                        <option value="custom">ارائه‌دهنده سفارشی (Custom API / Self-hosted)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        متن کلید API (API Key Token):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editKeyForm.apiKey}
                        onChange={(e) => setEditKeyForm({ ...editKeyForm, apiKey: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        کلید مستقیماً در پایگاه داده سرور ذخیره می‌شود و برای کاربران مخفی است.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">مدل هوش مصنوعی (Model):</label>
                        <button
                          type="button"
                          onClick={() => setEditKeyForm({ ...editKeyForm, isCustomModel: !editKeyForm.isCustomModel })}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          {editKeyForm.isCustomModel ? 'انتخاب از مدل‌های پیش‌فرض' : 'ورود دستی نام مدل (سفارشی)'}
                        </button>
                      </div>

                      {!editKeyForm.isCustomModel ? (
                        <select
                          value={editKeyForm.model}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setEditKeyForm({ ...editKeyForm, isCustomModel: true, model: '' });
                            } else {
                              setEditKeyForm({ ...editKeyForm, model: e.target.value });
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                        >
                          {(PROVIDER_PRESET_MODELS[editKeyForm.provider] || []).map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          <option value="__custom__">+ ورود دستی نام مدل دیگر...</option>
                        </select>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            dir="ltr"
                            value={editKeyForm.model}
                            onChange={(e) => setEditKeyForm({ ...editKeyForm, model: e.target.value })}
                            required
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                          />
                        </div>
                      )}
                    </div>

                    {editKeyForm.provider !== 'gemini' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          آدرس پایه سرور یا پروکسی (Base URL):
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={editKeyForm.baseURL}
                          onChange={(e) => setEditKeyForm({ ...editKeyForm, baseURL: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">اولویت انتخاب (Priority):</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editKeyForm.priority}
                          onChange={(e) => setEditKeyForm({ ...editKeyForm, priority: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={editKeyForm.isActive}
                            onChange={(e) => setEditKeyForm({ ...editKeyForm, isActive: e.target.checked })}
                            className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700"
                          />
                          <span className="text-white font-semibold">کلید در صف فعال باشد</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                      >
                        ذخیره تغییرات در سرور
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditKeyModal(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FINANCE & GATEWAYS */}
        {/* ========================================================= */}
        {activeTab === 'finance' && settings && (
          <div className="space-y-8">
            <AdminSectionGuide
              title="امور مالی، درگاه‌های پرداخت اینترنتی و تعرفه کلمه‌ای"
              badge="مالی و درگاه‌ها"
              badgeColor="emerald"
              description="در این بخش نرخ ترجمه بر مبنای کلمات، ضریب متون تخصصی، کد تخفیف‌ها و اتصال به درگاه‌های پرداخت شتابی (زرین‌پال، نکست‌پی، آیدی‌پی، پی‌پینگ یا شبیه‌ساز تست) تنظیم می‌شود."
              bullets={[
                {
                  title: 'نرخ پایه به ازای هر کلمه',
                  text: 'مبلغی که به ازای ترجمه هر کلمه کتاب از کیف پول کاربر کسر می‌شود (مثلاً ۴۵ تومان برای هر کلمه).'
                },
                {
                  title: 'ضریب متون فوق‌تخصصی',
                  text: 'ضریب افزایش قیمت برای کتاب‌های علمی، پزشکی، فلسفی یا دانشگاهی سنگین (مثلاً ۱.۳ برابر).'
                },
                {
                  title: 'اتصال آسان درگاه‌های بانکی',
                  text: 'تنها با وارد کردن مرچنت‌کد (Merchant ID) یا API Key زرین‌پال و نکست‌پی، درگاه پرداخت شاپرک فعال خواهد شد.'
                },
                {
                  title: 'کوپن و کدهای تخفیف',
                  text: 'در انتهای همین بخش می‌توانید کدهای تخفیف درصدی یا مبلغی برای جذب کاربران جدید ایجاد کنید.'
                }
              ]}
              tip="نکته توسعه‌دهندگان: برای تست کامل فرآیند خرید بدون پرداخت وجه واقعی، درگاه پرداخت را روی حالت Sandbox یا شبیه‌ساز قرار دهید."
            />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">درگاه‌های پرداخت، نرخ‌گذاری و امور مالی</h2>
                <p className="text-xs text-slate-400">پیکربندی زرین‌پال، نکست‌پی، آیدی‌پی، استرایپ و تعرفه کلمه‌ای</p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {saveSettingsSuccess ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                <span>{saveSettingsSuccess ? 'ذخیره شد!' : 'ذخیره تنظیمات مالی'}</span>
              </button>
            </div>

            {/* Pricing Config Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="font-bold text-base text-amber-400 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>تعرفه و قیمت‌گذاری کلمات کتاب</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    نرخ پایه به ازای هر کلمه (تومان):
                  </label>
                  <input
                    type="number"
                    value={settings.pricing.costPerWord}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, costPerWord: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">مثلاً ۴۵ تومان به ازای هر کلمه</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ضریب کتاب‌های تخصصی (هوافضا/ریاضی):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={settings.pricing.specializedMultiplier}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, specializedMultiplier: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">مثلاً ۱.۲ برابر برای متون دانشگاهی</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    هدیه شارژ اولیه ثبت نام (تومان):
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={settings.pricing.freeWelcomeGift}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, freeWelcomeGift: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">اعتبار رایگان برای آزمایش کیفیت</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    حداقل مبلغ شارژ کیف پول (تومان):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={settings.pricing.minDepositAmount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, minDepositAmount: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">کف مبلغ واریزی کاربران</p>
                </div>
              </div>
            </div>

            {/* Payment Gateways Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zarinpal */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-sm text-white">درگاه زرین‌پال (ZarinPal)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.gateways.zarinpal.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            zarinpal: { ...settings.gateways.zarinpal, enabled: e.target.checked },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">مرچنت کد (Merchant ID):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.gateways.zarinpal.merchantId}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            zarinpal: { ...settings.gateways.zarinpal, merchantId: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="zp_sandbox"
                      checked={settings.gateways.zarinpal.isSandbox}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            zarinpal: { ...settings.gateways.zarinpal, isSandbox: e.target.checked },
                          },
                        })
                      }
                      className="rounded accent-amber-500"
                    />
                    <label htmlFor="zp_sandbox" className="text-xs text-slate-300">
                      حالت آزمایشی (Sandbox) فعال باشد
                    </label>
                  </div>
                </div>
              </div>

              {/* Zibal */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-sm text-white">درگاه زیبال (Zibal)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.gateways.zibal?.enabled ?? false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            zibal: {
                              enabled: e.target.checked,
                              merchantId: settings.gateways.zibal?.merchantId || 'zibal',
                              isSandbox: settings.gateways.zibal?.isSandbox ?? true,
                            },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">مرچنت کد زیبال (Merchant ID):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.gateways.zibal?.merchantId || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            zibal: {
                              enabled: settings.gateways.zibal?.enabled ?? false,
                              merchantId: e.target.value,
                              isSandbox: settings.gateways.zibal?.isSandbox ?? true,
                            },
                          },
                        })
                      }
                      placeholder="zibal (یا مرچنت اختصاصی)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="zibal_sandbox"
                      checked={settings.gateways.zibal?.isSandbox ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            zibal: {
                              enabled: settings.gateways.zibal?.enabled ?? false,
                              merchantId: settings.gateways.zibal?.merchantId || 'zibal',
                              isSandbox: e.target.checked,
                            },
                          },
                        })
                      }
                      className="rounded accent-amber-500"
                    />
                    <label htmlFor="zibal_sandbox" className="text-xs text-slate-300">
                      حالت آزمایشی زیبال (Sandbox) فعال باشد
                    </label>
                  </div>
                </div>
              </div>

              {/* NextPay */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <h4 className="font-bold text-sm text-white">درگاه نکست‌پی (NextPay)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.gateways.nextpay.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            nextpay: { ...settings.gateways.nextpay, enabled: e.target.checked },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">کلید دسترسی (API Key):</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={settings.gateways.nextpay.apiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            nextpay: { ...settings.gateways.nextpay, apiKey: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* IDPay */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">درگاه آیدی‌پی (IDPay)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.gateways.idpay.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            idpay: { ...settings.gateways.idpay, enabled: e.target.checked },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">کلید API آیدی‌پی:</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={settings.gateways.idpay.apiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            idpay: { ...settings.gateways.idpay, apiKey: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stripe */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-bold text-sm text-white">درگاه بین‌المللی استرایپ (Stripe)</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.gateways.stripe.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            stripe: { ...settings.gateways.stripe, enabled: e.target.checked },
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">کلید محرمانه (Secret Key):</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={settings.gateways.stripe.secretKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gateways: {
                            ...settings.gateways,
                            stripe: { ...settings.gateways.stripe, secretKey: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="font-bold text-base text-white mb-4">کل تراکنش‌های مالی اخیر سامانه</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{tx.description}</span>
                      <span className="text-[10px] text-slate-500 block">کاربر: {tx.userId} • کد: {tx.trackingCode || tx.id}</span>
                    </div>
                    <div className="text-left font-mono font-bold">
                      <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4.5: HTML PAGE BUILDER WITH CUSTOM URLS */}
        {/* ========================================================= */}
        {activeTab === 'page_builder' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">صفحه‌ساز اختصاصی با کدهای HTML و URL اختصاصی</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {customPages.length} برگه اختصاصی
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ایجاد نامحدود صفحات دلخواه با تزریق مستقیم HTML، CSS و جاوااسکریپت روی آدرس‌های اختصاصی مانند <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded font-mono">/page/about-us</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNewPage}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>ایجاد برگه جدید</span>
                </button>
                <button
                  type="button"
                  onClick={fetchCustomPages}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>بروزرسانی</span>
                </button>
              </div>
            </div>

            {/* Split Screen: Pages List & Page Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Pages List (4 cols) */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300">لیست صفحات طراحی‌شده</span>
                  <span className="text-[11px] text-slate-500">برای ویرایش کلیک کنید</span>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {customPages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => handleSelectPageForEdit(page)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                        selectedPageId === page.id
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/5'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm truncate">{page.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            page.isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {page.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-mono mt-1" dir="ltr">
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">/page/{page.slug}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                        <span>بروزرسانی: {new Date(page.updatedAt).toLocaleDateString('fa-IR')}</span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setPreviewModalHtml(page.htmlContent)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                            title="پیش‌نمایش برگه"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomPage(page.id)}
                            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="حذف برگه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: HTML Editor Form (8 cols) */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <form onSubmit={handleSaveCustomPage} className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {pageForm.id ? 'ویرایش مشخصات و کدهای برگه' : 'ایجاد برگه اختصاصی جدید'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        کدهای HTML شما مستقیماً رندر می‌شوند؛ می‌توانید از قالب‌های آماده استفاده کنید
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalHtml(pageForm.htmlContent)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>پیش‌نمایش HTML</span>
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        {pageSaveSuccess ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                        <span>{pageSaveSuccess ? 'ذخیره شد!' : 'ذخیره و انتشار برگه'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان برگه (Page Title):</label>
                      <input
                        type="text"
                        placeholder="مثال: درباره سامانه ما"
                        value={pageForm.title}
                        onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        آدرس URL یکتا (Slug):
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="about-us"
                          value={pageForm.slug}
                          onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                          className="w-full px-3.5 py-2.5 pr-14 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs focus:border-amber-500 focus:outline-none text-left"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-slate-500 text-xs font-mono pointer-events-none">/page/</span>
                      </div>
                    </div>
                  </div>

                  {/* URL Live Link Banner */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-400">آدرس دسترسی عمومی این برگه:</span>
                      <span className="font-mono text-white font-bold bg-slate-900 px-2 py-0.5 rounded" dir="ltr">
                        /page/{pageForm.slug || 'slug'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={pageForm.isPublished}
                          onChange={(e) => setPageForm({ ...pageForm, isPublished: e.target.checked })}
                          className="rounded accent-amber-500"
                        />
                        <span className="text-slate-300">انتشار عمومی</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={pageForm.showInHeader}
                          onChange={(e) => setPageForm({ ...pageForm, showInHeader: e.target.checked })}
                          className="rounded accent-amber-500"
                        />
                        <span className="text-amber-300">نمایش در هدر بالای سایت</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={pageForm.showInFooter}
                          onChange={(e) => setPageForm({ ...pageForm, showInFooter: e.target.checked })}
                          className="rounded accent-amber-500"
                        />
                        <span className="text-cyan-300">نمایش در فوتر سایت</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات سئو و متا (Meta Description):</label>
                    <input
                      type="text"
                      placeholder="توضیح کوتاه ۱ یا ۲ خطی برای نمایش در گوگل و کارت‌های اشتراک‌گذاری"
                      value={pageForm.metaDescription}
                      onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* HTML Preset Templates Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                      <span>درج قالب‌های آماده با یک کلیک:</span>
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        طراحی واکنش‌گرا و سازگار با فونت Vazirmatn
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPageForm({
                            ...pageForm,
                            title: 'صفحه اصلی و لندینگ پیج سایت',
                            slug: 'home',
                            showInHeader: true,
                            showInFooter: true,
                            htmlContent: `<div style="max-width: 1000px; margin: 0 auto; padding: 50px 20px; font-family: 'Vazirmatn', sans-serif; text-align: center; color: #f8fafc;">
  <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(2, 6, 23, 0.6)); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 28px; padding: 48px 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
    <div style="display: inline-block; background: #f59e0b; color: #020617; font-weight: 900; font-size: 13px; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px;">
      نسخه سازمانی ترجمه هوشمند کتاب
    </div>
    <h1 style="font-size: 36px; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.4;">
      ترجمه و ویراستاری تخصصی کتاب با قدرتمندترین هوش مصنوعی جهان
    </h1>
    <p style="font-size: 17px; color: #94a3b8; max-width: 720px; margin: 0 auto 32px; line-height: 1.9;">
      بارگذاری آسان PDF، EPUB و Word، شمارش آنی کلمات و پردازش پیوسته ابری در پس‌زمینه بدون نیاز به باز ماندن مرورگر.
    </p>
    <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
      <a href="/?page=login" style="background: #f59e0b; color: #020617; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 16px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
        ورود به سامانه و ثبت سفارش
      </a>
      <a href="/page/pricing" style="background: #1e293b; color: #f8fafc; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 16px; text-decoration: none; border: 1px solid #334155;">
        مشاهده تعرفه کلمه‌ای
      </a>
    </div>
  </div>
</div>`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition"
                      >
                        قالب صفحه اصلی (Home / Landing)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPageForm({
                            ...pageForm,
                            title: 'ورود و احراز هویت اختصاصی',
                            slug: 'login',
                            showInHeader: true,
                            showInFooter: false,
                            htmlContent: `<div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: 'Vazirmatn', sans-serif; text-align: center; color: #f8fafc;">
  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 24px; padding: 36px 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
    <h1 style="color: #f59e0b; font-size: 24px; font-weight: 800; margin-bottom: 12px;">ورود به سامانه ترجمه کتاب</h1>
    <p style="font-size: 14px; color: #94a3b8; margin-bottom: 28px;">جهت ورود سریع به پنل کاربری و مشاهده کتاب‌های ترجمه‌شده کلیک نمایید:</p>
    <a href="/?page=login" style="display: block; background: #f59e0b; color: #020617; font-weight: 800; font-size: 15px; padding: 14px; border-radius: 14px; text-decoration: none;">
      انتقال به فرم ورود امن با پیامک و کلمه عبور
    </a>
  </div>
</div>`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        قالب صفحه ورود (Login)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPageForm({
                            ...pageForm,
                            title: 'قوانین، مقررات و حریم خصوصی',
                            slug: 'terms',
                            showInHeader: false,
                            showInFooter: true,
                            htmlContent: `<div style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: 'Vazirmatn', sans-serif; line-height: 2; color: #f8fafc;">
  <h1 style="color: #f59e0b; font-size: 26px; font-weight: 800; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 24px;">قوانین و شرایط استفاده از خدمات</h1>
  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
    <h3 style="color: #38bdf8; font-size: 16px; margin-top: 0;">۱. تعهدات و شفافیت مالی</h3>
    <p style="font-size: 14px; color: #cbd5e1; text-align: justify;">محاسبه هزینه ترجمه منحصراً بر مبنای شمارش دقیق کلمات کتاب و نرخ مصوب سامانه انجام می‌پذیرد. در صورت لغو سفارش در حین ترجمه، مبالغ مربوط به بخش‌های پردازش‌نشده به کیف پول کاربر عودت داده می‌شود.</p>
  </div>
  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px;">
    <h3 style="color: #38bdf8; font-size: 16px; margin-top: 0;">۲. محرمانگی و مالکیت متون</h3>
    <p style="font-size: 14px; color: #cbd5e1; text-align: justify;">تمامی فایل‌های بارگذاری‌شده و ترجمه‌های حاصل متعلق به کاربر بوده و در سرورهای امن به صورت ایزوله نگهداری می‌شوند.</p>
  </div>
</div>`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        قالب قوانین و حریم خصوصی
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPageForm({
                            ...pageForm,
                            title: 'درباره سامانه ما',
                            slug: 'about-us',
                            showInHeader: true,
                            showInFooter: true,
                            htmlContent: `<div style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: 'Vazirmatn', sans-serif; line-height: 2; color: #f8fafc;">
  <h1 style="color: #f59e0b; font-size: 28px; font-weight: 800; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 24px;">درباره سامانه ما</h1>
  <p style="font-size: 16px; margin-bottom: 20px; text-align: justify; color: #cbd5e1;">سامانه هوشمند ترجمه کتاب پیشرفته‌ترین پلتفرم برای تبدیل دقیق و تخصصی متون قطور با حفظ ساختار است.</p>
  <div style="background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; margin-bottom: 24px;">
    <h3 style="color: #38bdf8; font-size: 18px; margin-top: 0;">مزایای متمایز</h3>
    <ul style="padding-right: 20px; color: #e2e8f0; font-size: 14px;">
      <li>پردازش ابری بدون نیاز به باز بودن مرورگر</li>
      <li>شمارش دقیق کلمات با تعرفه منصفانه</li>
      <li>خروجی استاندارد Word و PDF</li>
    </ul>
  </div>
</div>`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        قالب معرفی و درباره ما
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPageForm({
                            ...pageForm,
                            title: 'جدول تعرفه‌ها و بسته‌ها',
                            slug: 'pricing',
                            showInHeader: true,
                            showInFooter: true,
                            htmlContent: `<div style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: 'Vazirmatn', sans-serif; line-height: 2; color: #f8fafc;">
  <h1 style="color: #f59e0b; font-size: 28px; font-weight: 800; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 24px;">جدول تعرفه‌ها و بسته‌های شارژ</h1>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; text-align: center;">
      <h3 style="color: #ffffff; margin-top: 0;">طرح عمومی</h3>
      <div style="font-size: 28px; font-weight: bold; color: #f59e0b; margin: 16px 0;">۴۵ تومان <span style="font-size: 13px; color: #94a3b8;">/ کلمه</span></div>
      <p style="color: #94a3b8; font-size: 13px;">مناسب برای رمان‌ها و کتب عمومی</p>
    </div>
    <div style="background: #0f172a; border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; text-align: center;">
      <h3 style="color: #ffffff; margin-top: 0;">طرح فوق‌تخصصی</h3>
      <div style="font-size: 28px; font-weight: bold; color: #10b981; margin: 16px 0;">۵۴ تومان <span style="font-size: 13px; color: #94a3b8;">/ کلمه</span></div>
      <p style="color: #94a3b8; font-size: 13px;">مناسب کتب پزشکی، هوافضا و ریاضیات</p>
    </div>
  </div>
</div>`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        قالب جدول تعرفه‌ها
                      </button>
                    </div>
                  </div>

                  {/* HTML Code Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      کدهای HTML برگه (HTML Code):
                    </label>
                    <textarea
                      rows={14}
                      dir="ltr"
                      value={pageForm.htmlContent}
                      onChange={(e) => setPageForm({ ...pageForm, htmlContent: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                      placeholder="<div><h1>عنوان برگه</h1><p>متن شما...</p></div>"
                      required
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Modal: Live HTML Preview */}
            {previewModalHtml && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-base text-white">پیش‌نمایش زنده صفحه HTML</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewModalHtml(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-6">
                    <div
                      dangerouslySetInnerHTML={{ __html: previewModalHtml }}
                      className="prose prose-invert max-w-none font-['Vazirmatn']"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4.7: HEADER & FOOTER HTML DESIGNER */}
        {/* ========================================================= */}
        {activeTab === 'header_footer' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">طراحی هدر و فوتر اختصاصی به صورت کدهای HTML</h2>
                <p className="text-xs text-slate-400 mt-1">
                  شخصی‌سازی هدر و فوتر سراسری با تگ‌های HTML، CSS و المان‌های دلخواه برای نمایش در سایت و صفحات
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveHeaderFooter}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                {hfSaveSuccess ? <Check className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
                <span>{hfSaveSuccess ? 'تنظیمات ذخیره شد!' : 'ذخیره طراحی هدر و فوتر'}</span>
              </button>
            </div>

            {/* Global Options Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headerFooterConfig.enabled}
                    onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, enabled: e.target.checked })}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span className="font-bold text-white">فعال‌سازی نمایش هدر و فوتر سفارشی در سامانه</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headerFooterConfig.applyToAllPages}
                    onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, applyToAllPages: e.target.checked })}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span className="text-slate-300">اعمال بر روی صفحات اختصاصی صفحه‌ساز (/page/...)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headerFooterConfig.applyToPrint}
                    onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, applyToPrint: e.target.checked })}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span className="text-slate-300">اعمال در نسخه چاپی و خروجی PDF</span>
                </label>
              </div>

              <div className="text-[11px] text-slate-400">
                وضعیت: {headerFooterConfig.enabled ? <span className="text-emerald-400 font-bold">● فعال</span> : <span className="text-slate-500">○ غیرفعال</span>}
              </div>
            </div>

            {/* Sub-tabs for Header / Footer / CSS / Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setHfActiveSubTab('header')}
                  className={`px-4 py-2 rounded-xl transition ${
                    hfActiveSubTab === 'header'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  کد HTML هدر (Header)
                </button>
                <button
                  type="button"
                  onClick={() => setHfActiveSubTab('footer')}
                  className={`px-4 py-2 rounded-xl transition ${
                    hfActiveSubTab === 'footer'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  کد HTML فوتر (Footer)
                </button>
                <button
                  type="button"
                  onClick={() => setHfActiveSubTab('css')}
                  className={`px-4 py-2 rounded-xl transition ${
                    hfActiveSubTab === 'css'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  استایل‌های سفارشی (Custom CSS)
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* SUBTAB 1: HEADER HTML */}
                {hfActiveSubTab === 'header' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>کد HTML سربرگ بالای سایت را وارد کنید:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setHeaderFooterConfig({
                              ...headerFooterConfig,
                              headerHtml: `<header style="background: linear-gradient(135deg, #090d16 0%, #151d2f 100%); border-bottom: 1px solid #334155; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; color: #f8fafc; font-family: 'Vazirmatn', sans-serif;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-weight: 900; font-size: 13px; padding: 6px 12px; border-radius: 10px; box-shadow: 0 2px 8px rgba(245,158,11,0.3);">
      ترجمه هوشمند
    </div>
    <span style="font-weight: 800; font-size: 15px; color: #ffffff;">سامانه ابری و چندموتوره ترجمه کتاب</span>
  </div>
  <nav style="display: flex; align-items: center; gap: 20px; font-size: 13px;">
    <a href="/page/guide" style="color: #cbd5e1; text-decoration: none; font-weight: 500;">راهنما و شرایط</a>
    <a href="/page/about-us" style="color: #cbd5e1; text-decoration: none; font-weight: 500;">درباره سامانه</a>
    <span style="color: #10b981; font-size: 12px; display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
      سرورهای ترجمه فعال
    </span>
  </nav>
</header>`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px]"
                        >
                          قالب آماده سازمانی
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setHeaderFooterConfig({
                              ...headerFooterConfig,
                              headerHtml: `<div style="background: #020617; border-bottom: 2px solid #f59e0b; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; color: #f8fafc; font-family: 'Vazirmatn', sans-serif; font-size: 12px;">
  <span>📞 پشتیبانی ویژه: ۰۲۱-۸۸۸۸۹۹۹۹ | ساعت پاسخگویی: ۲۴/۷</span>
  <span style="color: #f59e0b; font-weight: bold;">🎉 ۲۵,۰۰۰ تومان هدیه ثبت‌نام اولیه</span>
</div>`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px]"
                        >
                          قالب نوار اعلان طلایی
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      dir="ltr"
                      value={headerFooterConfig.headerHtml}
                      onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, headerHtml: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* SUBTAB 2: FOOTER HTML */}
                {hfActiveSubTab === 'footer' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>کد HTML پابرگ انتهای سایت را وارد کنید:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setHeaderFooterConfig({
                              ...headerFooterConfig,
                              footerHtml: `<footer style="background: #020617; border-top: 1px solid #1e293b; padding: 28px 24px; color: #94a3b8; font-family: 'Vazirmatn', sans-serif;">
  <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
    <div>
      <div style="color: #ffffff; font-weight: 800; font-size: 14px; margin-bottom: 6px;">سامانه تجاری ترجمه کتاب و مقالات علمی</div>
      <p style="margin: 0; font-size: 12px; color: #64748b;">طراحی و پیاده‌سازی شده با معماری توزیع موازی پردازش ابری هوش مصنوعی</p>
    </div>
    <div style="display: flex; gap: 24px; font-size: 13px;">
      <a href="/page/about-us" style="color: #f59e0b; text-decoration: none;">درباره ما</a>
      <a href="/page/pricing" style="color: #f59e0b; text-decoration: none;">تعرفه‌ها و قوانین</a>
      <a href="/page/guide" style="color: #f59e0b; text-decoration: none;">راهنمای خروجی Word و PDF</a>
    </div>
  </div>
</footer>`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px]"
                        >
                          قالب چندستونه مدرن
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      dir="ltr"
                      value={headerFooterConfig.footerHtml}
                      onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, footerHtml: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* SUBTAB 3: CUSTOM CSS */}
                {hfActiveSubTab === 'css' && (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-400 block">استایل‌های دلخواه CSS برای اعمال روی هدر و فوتر:</span>
                    <textarea
                      rows={8}
                      dir="ltr"
                      value={headerFooterConfig.customCss || ''}
                      onChange={(e) => setHeaderFooterConfig({ ...headerFooterConfig, customCss: e.target.value })}
                      placeholder="header a:hover { color: #f59e0b; }"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Live Preview Panel */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      پیش‌نمایش زنده در همین لحظه:
                    </span>
                    <span className="text-[11px] text-slate-500">هدر و فوتر به شکل زیر در سایت دیده می‌شوند</span>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                    {/* Rendered Header */}
                    {headerFooterConfig.headerHtml && (
                      <div dangerouslySetInnerHTML={{ __html: headerFooterConfig.headerHtml }} />
                    )}

                    {/* Middle Sample Page Mock */}
                    <div className="p-8 text-center text-xs text-slate-600 bg-slate-900/50">
                      محتوای صفحات سایت در این بخش قرار می‌گیرد...
                    </div>

                    {/* Rendered Footer */}
                    {headerFooterConfig.footerHtml && (
                      <div dangerouslySetInnerHTML={{ __html: headerFooterConfig.footerHtml }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CMS & PAGE BUILDER */}
        {/* ========================================================= */}
        {activeTab === 'cms' && settings && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">صفحه‌ساز و مدیریت محتوای لندینگ (CMS)</h2>
                <p className="text-xs text-slate-400">ویرایش متن‌های صفحه اصلی، بنر اطلاع‌رسانی و پرسش‌های متداول</p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {saveSettingsSuccess ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                <span>{saveSettingsSuccess ? 'ذخیره شد!' : 'ذخیره تغییرات محتوا'}</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان هدر لندینگ (Hero Title):</label>
                <input
                  type="text"
                  value={settings.cms.heroTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cms: { ...settings.cms, heroTitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">زیرعنوان توضیحی (Hero Subtitle):</label>
                <textarea
                  rows={2}
                  value={settings.cms.heroSubtitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cms: { ...settings.cms, heroSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">متن نوار پیام سراسری (Announcement Banner):</label>
                <input
                  type="text"
                  value={settings.cms.announcement}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cms: { ...settings.cms, announcement: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">شماره پشتیبانی:</label>
                  <input
                    type="text"
                    value={settings.cms.supportPhone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cms: { ...settings.cms, supportPhone: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ایمیل پشتیبانی:</label>
                  <input
                    type="email"
                    value={settings.cms.supportEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cms: { ...settings.cms, supportEmail: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SEO & BRANDING SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'seo' && settings && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe className="w-6 h-6 text-teal-400" />
                  <span>تنظیمات سئو (SEO)، برندینگ و متاتگ‌های سایت</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  شخصی‌سازی عنوان صفحه، متاتگ‌های گوگل، لوگوی اختصاصی، فاوآیکون و کنترل نوار اعلان بالای سایت
                </p>
              </div>

              <button
                onClick={handleSaveSeoSettings}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {seoSaveSuccess ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                <span>{seoSaveSuccess ? 'تنظیمات سئو ذخیره شد!' : 'ذخیره تنظیمات سئو و برندینگ'}</span>
              </button>
            </div>

            {/* Section 1: Site Title & SEO Meta Tags */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <h3 className="font-bold text-base text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Search className="w-5 h-5 text-teal-400" />
                <span>عناوین و متاتگ‌های موتورهای جستجو (Google & Social Cards)</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    نام و عنوان اصلی سایت (Site Title):
                  </label>
                  <input
                    type="text"
                    value={settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: {
                          siteTitle: e.target.value,
                          metaDescription: settings.seo?.metaDescription ?? '',
                          metaKeywords: settings.seo?.metaKeywords ?? '',
                          logoUrl: settings.seo?.logoUrl ?? '',
                          faviconUrl: settings.seo?.faviconUrl ?? '',
                          announcementEnabled: settings.seo?.announcementEnabled ?? true,
                          announcementText: settings.seo?.announcementText ?? '',
                        },
                      })
                    }
                    placeholder="مترجم آنلاین کتاب با هوش مصنوعی | ترجمه سریع رمان و کتاب تخصصی"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">این عنوان در تب مرورگر و نتایج اولیه گوگل نمایش داده می‌شود.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    توضیحات متا برای موتورهای جستجو (Meta Description):
                  </label>
                  <textarea
                    rows={3}
                    value={settings.seo?.metaDescription ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: {
                          siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                          metaDescription: e.target.value,
                          metaKeywords: settings.seo?.metaKeywords ?? '',
                          logoUrl: settings.seo?.logoUrl ?? '',
                          faviconUrl: settings.seo?.faviconUrl ?? '',
                          announcementEnabled: settings.seo?.announcementEnabled ?? true,
                          announcementText: settings.seo?.announcementText ?? '',
                        },
                      })
                    }
                    placeholder="سامانه هوشمند ترجمه کامل کتاب‌های PDF و متنی با هوش مصنوعی، حفظ لحن ادبی و علمی، واژه‌نامه اختصاصی و خروجی Word و کتابخوان."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">توضیحات خلاصه (بین ۱۲۰ تا ۱۶۰ کاراکتر پیشنهاد می‌شود) که در زیر لینک سایت در گوگل ظاهر می‌گردد.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    کلمات کلیدی سئو (Meta Keywords - با کاما جدا کنید):
                  </label>
                  <input
                    type="text"
                    value={settings.seo?.metaKeywords ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: {
                          siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                          metaDescription: settings.seo?.metaDescription ?? '',
                          metaKeywords: e.target.value,
                          logoUrl: settings.seo?.logoUrl ?? '',
                          faviconUrl: settings.seo?.faviconUrl ?? '',
                          announcementEnabled: settings.seo?.announcementEnabled ?? true,
                          announcementText: settings.seo?.announcementText ?? '',
                        },
                      })
                    }
                    placeholder="ترجمه کتاب, ترجمه هوش مصنوعی, مترجم کتاب انگلیسی به فارسی, ترجمه رمان, هوش مصنوعی جمینای"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Logo and Favicon */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <h3 className="font-bold text-base text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Palette className="w-5 h-5 text-amber-400" />
                <span>لوگوی سایت و فاوآیکون (Logo & Favicon)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      آدرس اینترنتی لوگوی سایت (Logo URL):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.seo?.logoUrl ?? ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          seo: {
                            siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                            metaDescription: settings.seo?.metaDescription ?? '',
                            metaKeywords: settings.seo?.metaKeywords ?? '',
                            logoUrl: e.target.value,
                            faviconUrl: settings.seo?.faviconUrl ?? '',
                            announcementEnabled: settings.seo?.announcementEnabled ?? true,
                            announcementText: settings.seo?.announcementText ?? '',
                          },
                        })
                      }
                      placeholder="https://example.com/logo.png یا /logo.svg"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">در صورت خالی بودن، آیکون و نشان پیش‌فرض کتاب نمایش داده می‌شود.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      آدرس فاوآیکون مرورگر (Favicon URL):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.seo?.faviconUrl ?? ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          seo: {
                            siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                            metaDescription: settings.seo?.metaDescription ?? '',
                            metaKeywords: settings.seo?.metaKeywords ?? '',
                            logoUrl: settings.seo?.logoUrl ?? '',
                            faviconUrl: e.target.value,
                            announcementEnabled: settings.seo?.announcementEnabled ?? true,
                            announcementText: settings.seo?.announcementText ?? '',
                          },
                        })
                      }
                      placeholder="https://example.com/favicon.ico"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none text-left"
                    />
                  </div>
                </div>

                {/* Logo Live Preview */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400 mb-3">پیش‌نمایش زنده لوگوی سایت:</span>
                  {settings.seo?.logoUrl ? (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 max-w-xs">
                      <img
                        src={settings.seo.logoUrl}
                        alt="Logo Preview"
                        className="max-h-16 w-auto object-contain mx-auto"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">لوگوی پیش‌فرض (نماد هوشمند کتاب)</span>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 mt-2">
                    {settings.seo?.logoUrl ? 'تصویر با موفقیت فراخوانی شد' : 'هیچ لوگوی اختصاصی ست نشده است'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Announcement Bar Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">نوار اعلان بالای سایت (Top Announcement Bar)</h3>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={settings.seo?.announcementEnabled ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: {
                          siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                          metaDescription: settings.seo?.metaDescription ?? '',
                          metaKeywords: settings.seo?.metaKeywords ?? '',
                          logoUrl: settings.seo?.logoUrl ?? '',
                          faviconUrl: settings.seo?.faviconUrl ?? '',
                          announcementEnabled: e.target.checked,
                          announcementText: settings.seo?.announcementText ?? '',
                        },
                      })
                    }
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span className="text-amber-400 font-bold">فعال‌سازی نوار اعلان در بالای تمام صفحات</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">متن اعلان بالای سایت:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.seo?.announcementText ?? settings.cms.announcement ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: {
                          siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                          metaDescription: settings.seo?.metaDescription ?? '',
                          metaKeywords: settings.seo?.metaKeywords ?? '',
                          logoUrl: settings.seo?.logoUrl ?? '',
                          faviconUrl: settings.seo?.faviconUrl ?? '',
                          announcementEnabled: settings.seo?.announcementEnabled ?? true,
                          announcementText: e.target.value,
                        },
                      })
                    }
                    placeholder="مثال: 🎉 تخفیف ۵۰ درصدی نوروزی بر روی تمام سفارش‌های ترجمه کتاب با کد NOROOZ"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        seo: {
                          siteTitle: settings.seo?.siteTitle ?? 'مترجم آنلاین کتاب با هوش مصنوعی',
                          metaDescription: settings.seo?.metaDescription ?? '',
                          metaKeywords: settings.seo?.metaKeywords ?? '',
                          logoUrl: settings.seo?.logoUrl ?? '',
                          faviconUrl: settings.seo?.faviconUrl ?? '',
                          announcementEnabled: false,
                          announcementText: '',
                        },
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                    title="پاک کردن و غیرفعال‌سازی نوار اعلان"
                  >
                    پاک کردن اعلان
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  اگر اعلان را غیرفعال کنید یا متن آن را پاک کنید، نوار بالایی از روی سایت برداشته می‌شود.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SECURITY & SMS CONFIG */}
        {/* ========================================================= */}
        {activeTab === 'security' && settings && (
          <div className="space-y-8">
            <AdminSectionGuide
              title="امنیت سرور، احراز هویت پیامکی، سشن‌ها و پشتیبان‌گیری"
              badge="امنیت و زیرساخت"
              badgeColor="rose"
              description="در این بخش کنترل پنل پیامک OTP (ملی‌پیامک، کاوه‌نگار، SMS.ir)، محافظت در برابر حملات بروت‌فورس، حالت تعمیر و نگهداری سایت و دریافت فایل پشتیبان دیتابیس JSON قرار دارد."
              bullets={[
                {
                  title: 'پنل ارسال پیامک OTP',
                  text: 'تنظیم کلید API و خط ارسال پیامک برای ورود و ثبت‌نام سریع کاربران با کد تایید یکبار مصرف.'
                },
                {
                  title: 'حالت تعمیر و نگهداری (Maintenance)',
                  text: 'در زمان ارتقای سرور یا به‌روزرسانی‌های اساسی، سایت را برای کاربران عادی موقتاً مسدود کنید در حالی که مدیران دسترسی دارند.'
                },
                {
                  title: 'پشتیبان‌گیری کامل پایگاه داده',
                  text: 'در پایین این بخش می‌توانید با یک کلیک فایل کامل پایگاه داده (database.json) را به همراه کلیه پروژه‌ها و تراکنش‌ها دانلود نمایید.'
                },
                {
                  title: 'تست پیامک زنده',
                  text: 'امکان تست ارسال آنی پیامک تستی به شماره موبایل دلخواه برای اطمینان از سلامت پنل پیامکی.'
                }
              ]}
              tip="نکته امنیتی: در محیط عملیاتی، کلیدهای دسترسی پیامک و درگاه را به هیچ عنوان در اختیار افراد نامعتبر قرار ندهید."
            />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">تنظیمات امنیتی، سشن‌ها و پنل پیامکی</h2>
                <p className="text-xs text-slate-400">تنظیمات ملی‌پیامک، کاوه‌نگار، SMS.ir و محدودیت‌های نرخ درخواست</p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {saveSettingsSuccess ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                <span>{saveSettingsSuccess ? 'ذخیره شد!' : 'ذخیره تنظیمات امنیتی'}</span>
              </button>
            </div>

            {/* SMS Provider Config */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  <span>پیکربندی پنل پیامکی (SMS OTP Gateway - ملی‌پیامک و وب‌سرویس‌ها)</span>
                </h3>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 w-fit">
                  {settings.sms.provider === 'melipayamak' ? 'سامانه ملی‌پیامک (فعال)' : 'درگاه پیامک فعال'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">سامانه ارائه‌دهنده پیامک:</label>
                  <select
                    value={settings.sms.provider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sms: { ...settings.sms, provider: e.target.value as any },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="melipayamak">سامانه ملی پیامک (MeliPayamak)</option>
                    <option value="kavenegar">کاوه‌نگار (Kavenegar)</option>
                    <option value="smsir">SMS.ir (سامانه پیام کوتاه)</option>
                    <option value="mock">شبیه‌ساز تستی (توسعه محلی و رایگان)</option>
                  </select>
                </div>

                {settings.sms.provider === 'melipayamak' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">روش احراز هویت در ملی‌پیامک:</label>
                    <select
                      value={settings.sms.authMethod || 'credentials'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, authMethod: e.target.value as any },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="credentials">نام کاربری و کلمه عبور پنل (وب‌سرویس REST/SOAP)</option>
                      <option value="pattern">ارسال خدماتی با شناسه قالب (BodyId / عبور از بلک‌لیست)</option>
                      <option value="apikey">کلید توکن کنسول (API Token)</option>
                    </select>
                  </div>
                )}

                {settings.sms.provider === 'melipayamak' && settings.sms.authMethod !== 'apikey' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام کاربری ملی‌پیامک (Username):</label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. 09121234567 یا نام کاربری"
                      value={settings.sms.username || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, username: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {settings.sms.provider === 'melipayamak' && settings.sms.authMethod !== 'apikey' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">کلمه عبور پنل ملی‌پیامک (Password):</label>
                    <input
                      type="password"
                      dir="ltr"
                      placeholder="••••••••"
                      value={settings.sms.password || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, password: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {settings.sms.provider === 'melipayamak' && settings.sms.authMethod === 'pattern' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد متن یا شناسه الگو (BodyId / Pattern):</label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. 123456 (کد متن تایید شده در وب‌سرویس خدماتی)"
                      value={settings.sms.bodyId || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, bodyId: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {(settings.sms.provider !== 'melipayamak' || settings.sms.authMethod === 'apikey') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">کلید API یا توکن امنیتی:</label>
                    <input
                      type="password"
                      dir="ltr"
                      placeholder="API Key / Token"
                      value={settings.sms.apiKey || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, apiKey: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                {settings.sms.authMethod !== 'pattern' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره خط اختصاصی یا فرستنده:</label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. 50004000... یا 1000..."
                      value={settings.sms.senderNumber || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sms: { ...settings.sms, senderNumber: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {settings.sms.provider === 'melipayamak' && (
                <div className="mb-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>راهنمای اتصال به ملی‌پیامک:</span>
                  </div>
                  {settings.sms.authMethod === 'credentials' && (
                    <p>در روش نام کاربری و پسورد، پیامک‌ها از طریق شماره خط اختصاصی شما ارسال می‌شوند. برای شماره‌هایی که دریافت پیامک‌های تبلیغاتی را بسته‌اند، پیامک ارسال نمی‌شود مگر خط شما خدماتی شده باشد.</p>
                  )}
                  {settings.sms.authMethod === 'pattern' && (
                    <p className="text-emerald-400">در روش خدماتی (BodyId)، پیامک احراز هویت با سرعت بالا و حتی به شماره‌های مسدود تبلیغاتی ارسال خواهد شد. کافیست کد متن ثبت‌شده در کنسول ملی‌پیامک را در فیلد شناسه الگو وارد فرمایید.</p>
                  )}
                  {settings.sms.authMethod === 'apikey' && (
                    <p>در روش توکن، درخواست‌های ارسال مستقیماً با هدر دسترسی به وب‌سرویس RESTful ملی‌پیامک احراز هویت می‌شوند.</p>
                  )}
                </div>
              )}

              {/* SMS Test tool */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="09121234567 (شماره گیرنده تست)"
                  value={testSmsPhone}
                  onChange={(e) => setTestSmsPhone(e.target.value)}
                  className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestSms}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>ارسال پیامک آزمایشی به شماره فوق</span>
                </button>
                {smsResult && (
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${smsResult.includes('موفقیت') || smsResult.includes('تست') ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {smsResult}
                  </span>
                )}
              </div>
            </div>

            {/* Security Config */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>تنظیمات امنیت، سشن و محدودیت بارگذاری</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    حداکثر کتاب‌های همزمان در صف (Concurrency):
                  </label>
                  <input
                    type="number"
                    value={settings.security.maxConcurrentJobs}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, maxConcurrentJobs: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مدت اعتبار نشست لاگین (ساعت):
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionExpireHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, sessionExpireHours: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    محدودیت درخواست کاربر (در دقیقه):
                  </label>
                  <input
                    type="number"
                    value={settings.security.rateLimitRpm}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, rateLimitRpm: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <input
                  type="checkbox"
                  id="maint_mode"
                  checked={settings.security.maintenanceMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, maintenanceMode: e.target.checked },
                    })
                  }
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <label htmlFor="maint_mode" className="text-xs text-slate-300 cursor-pointer">
                  فعال‌سازی حالت تعمیرات (Maintenance Mode) - ورود کاربران عادی موقتاً مسدود می‌شود.
                </label>
              </div>
            </div>

            {/* Captcha Configuration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">تنظیمات کپچا و ضد ربات (Bot Protection & Captcha)</h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.captcha?.enabled || false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          captcha: {
                            ...(settings.security.captcha || {
                              provider: 'math',
                              siteKey: '',
                              secretKey: '',
                              requiredForLogin: false,
                              requiredForRegister: true,
                            }),
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span className="text-xs text-amber-300 font-bold">فعال‌سازی سیستم کپچا</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع ارائه‌دهنده کپچا:</label>
                  <select
                    value={settings.security.captcha?.provider || 'math'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          captcha: {
                            ...(settings.security.captcha || {
                              enabled: false,
                              siteKey: '',
                              secretKey: '',
                              requiredForLogin: false,
                              requiredForRegister: true,
                            }),
                            provider: e.target.value as any,
                          },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="math">کپچای ریاضی هوشمند سرور (سریع و بدون نیاز به کلید)</option>
                    <option value="recaptcha">گوگل ری‌کپچا (Google reCAPTCHA v2 / v3)</option>
                    <option value="turnstile">کلادفلر ترنستایل (Cloudflare Turnstile)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">کلید عمومی سایت (Site Key):</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="site_key_..."
                    value={settings.security.captcha?.siteKey || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          captcha: {
                            ...(settings.security.captcha || {
                              enabled: false,
                              provider: 'math',
                              secretKey: '',
                              requiredForLogin: false,
                              requiredForRegister: true,
                            }),
                            siteKey: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">کلید محرمانه سرور (Secret Key):</label>
                  <input
                    type="password"
                    dir="ltr"
                    placeholder="secret_key_..."
                    value={settings.security.captcha?.secretKey || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          captcha: {
                            ...(settings.security.captcha || {
                              enabled: false,
                              provider: 'math',
                              siteKey: '',
                              requiredForLogin: false,
                              requiredForRegister: true,
                            }),
                            secretKey: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.captcha?.requiredForRegister ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          captcha: {
                            ...(settings.security.captcha || {
                              enabled: false,
                              provider: 'math',
                              siteKey: '',
                              secretKey: '',
                              requiredForLogin: false,
                            }),
                            requiredForRegister: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded accent-amber-500 w-3.5 h-3.5"
                  />
                  <span>الزام حل کپچا هنگام ثبت‌نام و دریافت کد پیامکی</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.captcha?.requiredForLogin || false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          captcha: {
                            ...(settings.security.captcha || {
                              enabled: false,
                              provider: 'math',
                              siteKey: '',
                              secretKey: '',
                              requiredForRegister: true,
                            }),
                            requiredForLogin: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded accent-amber-500 w-3.5 h-3.5"
                  />
                  <span>الزام حل کپچا در ورود با رمز عبور</span>
                </label>
              </div>
            </div>

            {/* Coupons & Promo Codes Manager */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">مدیریت کدهای تخفیف و شارژ هدیه کیف پول</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{coupons.length} کد فعال</span>
              </div>

              {/* Create new coupon form */}
              <form onSubmit={handleCreateCoupon} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">کد تخفیف (لاتین):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NOROOZ1405"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">مبلغ شارژ هدیه (تومان):</label>
                  <input
                    type="number"
                    value={newCouponCredit}
                    onChange={(e) => setNewCouponCredit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">حداکثر دفعات استفاده:</label>
                  <input
                    type="number"
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت کد تخفیف جدید</span>
                </button>
              </form>

              {/* Coupons list */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">کد</th>
                      <th className="pb-2">نوع جایزه</th>
                      <th className="pb-2">مصرف شده</th>
                      <th className="pb-2">سقف مجاز</th>
                      <th className="pb-2 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500">کد تخفیفی تعریف نشده است.</td>
                      </tr>
                    ) : (
                      coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-850">
                          <td className="py-2.5 font-mono text-amber-300 font-bold">{c.code}</td>
                          <td className="py-2.5 text-emerald-400">
                            {c.creditBonus > 0 ? `${c.creditBonus.toLocaleString('fa-IR')} تومان هدیه` : `${c.discountPercent}% تخفیف`}
                          </td>
                          <td className="py-2.5 font-mono text-slate-300">{c.timesUsed}</td>
                          <td className="py-2.5 font-mono text-slate-400">{c.maxUses}</td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Database Backup & Maintenance Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-white mb-1">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span>پشتیبان‌گیری کامل از پایگاه داده (JSON Backup)</span>
                </div>
                <p className="text-xs text-slate-400">
                  دانلود فایل پشتیبان حاوی تمام کاربران، پروژه‌های کتاب، ترجمه‌ها، سوابق مالی و لاگ‌ها برای ذخیره‌سازی آفلاین.
                </p>
              </div>

              <a
                href="/api/admin/backup"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>دانلود پشتیبان کامل پایگاه داده</span>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
