import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CloudLightning,
  CheckCircle2,
  Calculator,
  DownloadCloud,
  Layers,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  PhoneCall,
  Mail,
  UserCheck,
  Cpu,
  LogIn,
  Menu,
  X
} from 'lucide-react';
import { SystemSettings, HeaderFooterConfig } from '../types.ts';

interface LandingPageProps {
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  cmsConfig?: SystemSettings['cms'];
  seoConfig?: SystemSettings['seo'];
  costPerWord?: number;
  headerFooter?: HeaderFooterConfig;
  customPages?: Array<{ id: string; title: string; slug: string; metaDescription?: string; showInHeader?: boolean; showInFooter?: boolean }>;
  onOpenCustomPage?: (slug: string) => void;
}

export function LandingPage({
  onOpenAuth,
  cmsConfig,
  seoConfig,
  costPerWord = 45,
  headerFooter,
  customPages = [],
  onOpenCustomPage,
}: LandingPageProps) {
  // Interactive Calculator State
  const [calcWords, setCalcWords] = useState<number>(15000);
  const [calcTone, setCalcTone] = useState<'standard' | 'specialized'>('standard');
  const [openFaq, setOpenFaq] = useState<string | null>('faq1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Rate is strictly derived from the admin's configured costPerWord
  const unitPrice = costPerWord;
  const multiplier = calcTone === 'specialized' ? 1.2 : 1.0;
  const effectiveUnitPrice = Math.round(unitPrice * multiplier);
  const totalPrice = Math.round(calcWords * effectiveUnitPrice);
  const estimatedChunks = Math.max(1, Math.ceil(calcWords / 700));
  const estimatedMinutes = Math.max(1, Math.ceil((estimatedChunks * 4.5) / 60));

  const features = cmsConfig?.features || [
    {
      id: 'f1',
      title: 'پردازش ابری در پس‌زمینه سرور',
      description: 'کتاب حجیم خود را بارگذاری کنید و مرورگر را ببندید! سرور ترجمه را به صورت پیوسته انجام داده و ذخیره می‌کند.',
      icon: 'CloudLightning',
    },
    {
      id: 'f2',
      title: 'محاسبه دقیق کلمات و قیمت‌گذاری شفاف',
      description: 'شمارش آنی تمام کلمات کتاب و تعیین هزینه دقیق پیش از شروع؛ کسر اتوماتیک از کیف پول بدون هزینه پنهان.',
      icon: 'Calculator',
    },
    {
      id: 'f3',
      title: 'لحن‌های تخصصی و واژه‌نامه یکپارچه',
      description: 'پشتیبانی از لحن‌های معنوی، رمان، روانشناسی، اقتصادی، هوافضا و ریاضیات با ترجمه یکپارچه اصطلاحات اختصاصی.',
      icon: 'BookOpen',
    },
    {
      id: 'f4',
      title: 'خروجی استاندارد Word، PDF و EPUB',
      description: 'خروجی بی‌نقص سازگار با استانداردهای نشر، حفظ صددرصدی تصاویر، تذهیب‌های سنتی و صفحه‌بندی کتاب.',
      icon: 'DownloadCloud',
    },
  ];

  const faqs = cmsConfig?.faqs || [
    {
      id: 'faq1',
      q: 'آیا برای ترجمه یک کتاب ۵۰۰ صفحه‌ای باید مرورگر را باز نگه دارم؟',
      a: 'خیر! فرآیند ترجمه کاملاً به صورت ابری در سرور پردازش می‌شود. شما می‌توانید سفارش را ثبت کنید، دستگاه خود را خاموش کرده و هر زمان بازگشتید، پیشرفت زنده یا فایل نهایی را دریافت نمایید.',
    },
    {
      id: 'faq2',
      q: 'هزینه ترجمه چگونه محاسبه می‌شود؟',
      a: 'به محض بارگذاری فایل کتاب (PDF، EPUB، Word یا TXT)، کلمات کتاب در کسری از ثانیه شمرده شده و قیمت با نرخ مصوب کلمه‌ای نمایش داده می‌شود.',
    },
    {
      id: 'faq3',
      q: 'آیا تصاویر درون کتاب حفظ می‌شوند؟',
      a: 'بله، الگوریتم پردازش اختصاصی تمام تصاویر، جدول‌ها و ساختار پاراگراف‌ها را بدون افت کیفیت استخراج کرده و در ترجمه فارسی سر جای خود قرار می‌دهد.',
    },
  ];

  // Intercept links to custom pages
  const handlePageLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('a');
    if (target && target.getAttribute('href')) {
      const href = target.getAttribute('href')!;
      if (href.startsWith('/page/')) {
        e.preventDefault();
        const slug = href.replace('/page/', '');
        if (onOpenCustomPage) {
          onOpenCustomPage(slug);
        } else {
          window.location.href = href;
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn'] selection:bg-amber-500/30">
      {/* Custom CSS from Header/Footer Designer */}
      {headerFooter?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: headerFooter.customCss }} />
      )}

      {/* Top Custom HTML Header if enabled in Admin Panel */}
      {headerFooter?.enabled && headerFooter.headerHtml && (
        <div
          dangerouslySetInnerHTML={{ __html: headerFooter.headerHtml }}
          onClick={handlePageLinkClick}
        />
      )}

      {/* Top Announcement Bar */}
      {/* Top Announcement Bar (Configurable in Admin SEO/Settings) */}
      {(seoConfig?.announcementEnabled !== false && (seoConfig?.announcementText || cmsConfig?.announcement)) && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs md:text-sm font-semibold text-center shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>{seoConfig?.announcementText || cmsConfig?.announcement}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {seoConfig?.logoUrl ? (
              <img
                src={seoConfig.logoUrl}
                alt="Logo"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl object-contain border border-amber-500/20 shadow-md shadow-amber-500/20 bg-slate-900 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent truncate block max-w-[170px] xs:max-w-xs sm:max-w-none">
                {seoConfig?.siteTitle || 'مترجم و ویراستار هوشمند کتاب'}
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">سامانه تجاری ترجمه کتاب و متون تخصصی با هوش مصنوعی</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs xl:text-sm text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">امکانات پلتفرم</a>
            <a href="#calculator" className="hover:text-amber-400 transition-colors">ماشین‌حساب هزینه</a>
            <a href="#tones" className="hover:text-amber-400 transition-colors">لحن‌ها و ژانرها</a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">سوالات متداول</a>

            {/* Only custom pages specifically enabled for Header */}
            {customPages.filter((page) => page.showInHeader).map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => onOpenCustomPage ? onOpenCustomPage(page.slug) : window.location.assign(`/page/${page.slug}`)}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {page.title}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 transition-all shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ورود به سامانه / ثبت‌نام</span>
              <span className="sm:hidden">ورود / ثبت‌نام</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="منوی موبایل"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3 text-xs sm:text-sm animate-in slide-in-from-top-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              امکانات پلتفرم
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              ماشین‌حساب هزینه و زمان
            </a>
            <a
              href="#tones"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              لحن‌ها و ژانرهای تخصصی
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              سوالات متداول
            </a>
            {customPages.filter((page) => page.showInHeader).map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenCustomPage) onOpenCustomPage(page.slug);
                  else window.location.assign(`/page/${page.slug}`);
                }}
                className="block w-full text-right py-2 px-3 rounded-lg hover:bg-slate-800 text-amber-400 font-medium"
              >
                {page.title}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs md:text-sm font-medium mb-6">
            <Cpu className="w-4 h-4" />
            <span>نسل جدید موتور ترجمه ابری با پردازش موازی و صف هوشمند</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl mx-auto mb-6">
            {cmsConfig?.heroTitle || 'ترجمه حرفه‌ای و روان کتاب‌های انگلیسی به فارسی با هوش مصنوعی'}
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            {cmsConfig?.heroSubtitle || 'دیگر نیازی به باز نگه داشتن مرورگر برای کتاب‌های چندصد صفحه‌ای نیست! فایل PDF، EPUB، یا Word خود را بارگذاری کنید، سبک نگارش را برگزینید و کتاب ترجمه‌شده و صفحه‌آرایی شده خود را تحویل بگیرید.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>شروع ترجمه کتاب</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <a
              href="#calculator"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>محاسبه هزینه ترجمه</span>
            </a>
          </div>

          {/* Social Proof / Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-slate-800/60 max-w-4xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">+۲۵۰,۰۰۰</div>
              <div className="text-xs text-slate-400 mt-1">کلمه ترجمه شده موفق</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">۱۰۰٪ ابری</div>
              <div className="text-xs text-slate-400 mt-1">بدون نیاز به باز ماندن تب مرورگر</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">۴ فرمت کامل</div>
              <div className="text-xs text-slate-400 mt-1">Word، PDF، EPUB و TXT</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">۹۹.۹٪</div>
              <div className="text-xs text-slate-400 mt-1">پایداری با استخر کلیدهای موازی</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Price & Time Calculator */}
      <section id="calculator" className="py-20 bg-slate-900/60 border-b border-slate-800 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">شفافیت مالی و قیمت‌گذاری</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">ماشین‌حساب هوشمند هزینه و زمان ترجمه</h2>
            <p className="text-sm text-slate-400 mt-2">تعداد کلمات یا حجم کتاب خود را مشخص کنید تا برآورد دقیق هزینه و زمان را مشاهده کنید.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  تعداد کلمات کتاب: <span className="text-amber-400 font-bold text-lg">{calcWords.toLocaleString('fa-IR')}</span> کلمه
                </label>
                <input
                  type="range"
                  min="1000"
                  max="120000"
                  step="1000"
                  value={calcWords}
                  onChange={(e) => setCalcWords(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-4"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono mb-6">
                  <span>۱,۰۰۰ کلمه (مقاله)</span>
                  <span>۲۵,۰۰۰ کلمه (کتاب کوتاه)</span>
                  <span>۱۲۰,۰۰۰ کلمه (کتاب قطور)</span>
                </div>

                <label className="block text-sm font-semibold text-slate-300 mb-2">نوع و سبک تخصصی کتاب:</label>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setCalcTone('standard')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border text-right transition-all ${
                      calcTone === 'standard'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>عمومی و خودشناسی</div>
                    <div className="text-[10px] text-slate-400 font-normal">معنوی، روانشناسی، رمان</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTone('specialized')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border text-right transition-all ${
                      calcTone === 'specialized'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>تخصصی و دانشگاهی</div>
                    <div className="text-[10px] text-slate-400 font-normal">اقتصادی، هوافضا، ریاضیات</div>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تخفیف ۲۵,۰۰۰ تومانی شارژ اولیه به ازای ثبت‌نام اعمال خواهد شد.</span>
                </div>
              </div>

              {/* Result Card */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="text-xs text-slate-400">برآورد کل هزینه ترجمه</div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-1">
                    {totalPrice.toLocaleString('fa-IR')} <span className="text-sm font-normal text-slate-300">تومان</span>
                  </div>
                  <div className="text-xs text-amber-400/90 mt-1 font-medium">
                    نرخ محاسبه: {costPerWord.toLocaleString('fa-IR')} تومان به ازای هر کلمه (نرخ مصوب سیستم)
                  </div>
                </div>

                <div className="my-6 space-y-3 pt-6 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      مدت زمان پردازش ابری:
                    </span>
                    <span className="font-semibold text-white">حدود {estimatedMinutes} دقیقه</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      تعداد فصل‌ها / سرفصل‌ها:
                    </span>
                    <span className="font-semibold text-white">{estimatedChunks} بخش پیوسته</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CloudLightning className="w-3.5 h-3.5 text-emerald-400" />
                      وضعیت اجرای پس‌زمینه:
                    </span>
                    <span className="font-semibold text-emerald-400">خودکار روی سرور</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>ورود و ثبت سفارش این کتاب</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">برتری‌های فنی و استانداردهای ترجمه</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">چرا مترجم هوشمند برای کتاب‌های جدی مناسب است؟</h2>
            <p className="text-sm text-slate-400 mt-3">بر خلاف ابزارهای عادی ترجمه که متن‌ها را خلاصه می‌کنند یا عناوین ساختگی تولید می‌کنند، این سامانه با ضمانت ۱۰۰٪ کامل ترجمه می‌کند.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    {f.icon === 'CloudLightning' ? <CloudLightning className="w-6 h-6" /> :
                     f.icon === 'Calculator' ? <Calculator className="w-6 h-6" /> :
                     f.icon === 'DownloadCloud' ? <DownloadCloud className="w-6 h-6" /> :
                     <BookOpen className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tones Showcase */}
      <section id="tones" className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">تخصصی‌سازی عمیق</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">لحن‌ها و ژانرهای پشتیبانی‌شده</h2>
            <p className="text-sm text-slate-400 mt-2">هر سبک کتابی نیازمند دایره واژگان و آهنگ کلامی متمایز است.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-amber-400 font-bold text-base mb-2">۱. معنوی، فلسفی و خودشناسی</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                لحنی باوقار، متأملانه و شاعرانه در عین وضوح با کاربرد واژگان اصیل «آگاهی»، «حضور»، «مشاهده‌گر»، و «پیکر درون».
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">اکهارت تله</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">آلن واتس</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">کریشنا مورتی</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-amber-400 font-bold text-base mb-2">۲. علوم هوافضا و ریاضیات</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                لحنی دقیق و فرمال با حفظ نشانه‌گذاری‌های علمی، معادلات، قضایا، مکانیک مداری و اصطلاحات اخترفیزیک.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">مکانیک مداری</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">فضای هیلبرت</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">اخترفیزیک</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-amber-400 font-bold text-base mb-2">۳. اقتصادی، مالی و روانشناسی</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                لحنی قاطع، معاصر و تحلیلی متناسب با نیاز مدیران، پژوهشگران بازار سرمایه، کارآفرینان و دانشجویان.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">سیاست‌های پولی</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">تاب‌آوری روانی</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">چرخه عادات</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">پاسخ به ابهامات متداول</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-2">سوالات متداول کاربران</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 text-right font-semibold text-sm sm:text-base text-slate-200 flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">همین حالا اولین کتاب خود را ترجمه کنید</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-xl mx-auto">
            با عضویت در سامانه، ۲۵,۰۰۰ تومان شارژ هدیه برای آزمایش کیفیت ترجمه دریافت خواهید کرد.
          </p>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-300 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <span>ورود و ثبت‌نام سریع</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Custom Designed Footer (HTML) from Admin Panel */}
      {headerFooter?.enabled && headerFooter.footerHtml && (
        <div
          dangerouslySetInnerHTML={{ __html: headerFooter.footerHtml }}
          onClick={handlePageLinkClick}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {seoConfig?.logoUrl ? (
              <img
                src={seoConfig.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain border border-amber-500/20 bg-slate-900"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-300">{seoConfig?.siteTitle || 'مترجم و ویراستار هوشمند کتاب'}</p>
              <p className="text-[11px] text-slate-500">پلتفرم تجاری ترجمه کتاب و نشریات تخصصی</p>
            </div>
          </div>

          {/* Custom Pages specifically enabled for Footer */}
          {customPages.filter((p) => p.showInFooter).length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {customPages.filter((p) => p.showInFooter).map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => onOpenCustomPage ? onOpenCustomPage(page.slug) : window.location.assign(`/page/${page.slug}`)}
                  className="text-slate-400 hover:text-amber-400 transition"
                >
                  {page.title}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            {cmsConfig?.supportPhone && (
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                پشتیبانی: {cmsConfig.supportPhone}
              </span>
            )}
            {cmsConfig?.supportEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                {cmsConfig.supportEmail}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              اتصال امن SSL و درگاه‌های معتبر بانکی
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
