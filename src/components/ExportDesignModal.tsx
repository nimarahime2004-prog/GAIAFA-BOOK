import React, { useState } from 'react';
import {
  X,
  Palette,
  Printer,
  FileText,
  Download,
  Check,
  Sparkles,
  Type,
  Layout,
  Globe,
  Eye,
  CheckCircle2,
  BookOpen,
  Sliders,
  Copy,
  Save,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Feather
} from 'lucide-react';
import { BookProject, BookDesignConfig, BookThemeId, BorderStyleId, BackgroundPatternId } from '../types.ts';
import { BOOK_THEMES, BORDER_STYLES, BACKGROUND_PATTERNS, DEFAULT_DESIGN_CONFIG } from '../constants/themes.ts';
import { downloadDocx, downloadWordHtml, downloadStyledHtml, downloadPlainText } from '../utils/exporter.ts';

interface ExportDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: BookProject;
  onUpdateDesign: (config: BookDesignConfig) => void;
  onPrintPdf: () => void;
}

const STORAGE_GLOBAL_DESIGN = 'persian_book_translator_global_design_v1';

export const ExportDesignModal: React.FC<ExportDesignModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateDesign,
  onPrintPdf,
}) => {
  // Load saved global default if project does not have one
  const getInitialConfig = (): BookDesignConfig => {
    if (project.designConfig) return project.designConfig;
    try {
      const saved = localStorage.getItem(STORAGE_GLOBAL_DESIGN);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_DESIGN_CONFIG, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_DESIGN_CONFIG;
  };

  const initialConfig = getInitialConfig();

  const [themeId, setThemeId] = useState<BookThemeId>(initialConfig.themeId || 'spiritual');
  const [headerText, setHeaderText] = useState(initialConfig.headerText || '');
  const [footerText, setFooterText] = useState(initialConfig.footerText || '');
  const [showHeader, setShowHeader] = useState(initialConfig.showHeader ?? false);
  const [showFooter, setShowFooter] = useState(initialConfig.showFooter ?? false);
  const [websiteUrl, setWebsiteUrl] = useState(initialConfig.websiteUrl || '');
  const [brandName, setBrandName] = useState(initialConfig.brandName || '');
  const [showPageNumbers, setShowPageNumbers] = useState(initialConfig.showPageNumbers ?? true);
  const [showCoverPage, setShowCoverPage] = useState(initialConfig.showCoverPage ?? true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(initialConfig.fontSize || 'medium');
  const [lineSpacing, setLineSpacing] = useState<'compact' | 'normal' | 'relaxed'>(initialConfig.lineSpacing || 'normal');
  const [fontFamily, setFontFamily] = useState<BookDesignConfig['fontFamily']>(
    (initialConfig.fontFamily as any) || 'Vazirmatn'
  );
  const [borderStyle, setBorderStyle] = useState<BorderStyleId>(initialConfig.borderStyle || 'ornate_spiritual');
  const [backgroundPattern, setBackgroundPattern] = useState<BackgroundPatternId>(initialConfig.backgroundPattern || 'none');
  const [watermarkText, setWatermarkText] = useState(initialConfig.watermarkText || '');
  const [pageMargin, setPageMargin] = useState<'compact' | 'normal' | 'generous'>(initialConfig.pageMargin || 'normal');

  const [activeTab, setActiveTab] = useState<'themes' | 'headers' | 'typography'>('themes');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

  if (!isOpen) return null;

  const activeTheme = BOOK_THEMES[themeId] || BOOK_THEMES.spiritual;

  const currentConfig: BookDesignConfig = {
    themeId,
    headerText,
    footerText,
    showHeader,
    showFooter,
    websiteUrl,
    brandName,
    showPageNumbers,
    showCoverPage,
    fontSize,
    lineSpacing,
    fontFamily,
    borderStyle,
    backgroundPattern,
    watermarkText,
    pageMargin,
  };

  const handleApplyConfig = () => {
    onUpdateDesign(currentConfig);
    return currentConfig;
  };

  const handleSaveAsDefault = () => {
    try {
      localStorage.setItem(STORAGE_GLOBAL_DESIGN, JSON.stringify(currentConfig));
      setSavedBanner('این تنظیمات هدر، فوتر و تم به عنوان پیش‌فرض تمام کتاب‌های شما ذخیره شد.');
      setTimeout(() => setSavedBanner(null), 3500);
    } catch (e) {
      console.warn('Could not save to localStorage');
    }
  };

  const handlePrint = () => {
    handleApplyConfig();
    onClose();
    setTimeout(() => {
      onPrintPdf();
    }, 250);
  };

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    const cfg = handleApplyConfig();
    const updatedProject = { ...project, designConfig: cfg };
    await downloadDocx(updatedProject);
    setIsExportingDocx(false);
    setSavedBanner(`فایل رسمی Word (.docx) با قلم ${fontFamily} و تنظیمات اختصاصی ایجاد و دانلود شد.`);
    setTimeout(() => setSavedBanner(null), 3500);
  };

  const handleDownloadHtml = () => {
    const cfg = handleApplyConfig();
    const updatedProject = { ...project, designConfig: cfg };
    downloadWordHtml(updatedProject);
    setSavedBanner('فایل متنی وب قابل ویرایش در Word دانلود شد.');
    setTimeout(() => setSavedBanner(null), 3000);
  };

  const handleCopyFullBook = () => {
    const fullText = project.chunks
      .filter(c => c.translatedHtml)
      .map(c => `### ${c.chapterTitle} (بخش ${c.chunkNumber})\n\n${c.translatedHtml?.replace(/<[^>]+>/g, '').trim()}`)
      .join('\n\n=========================================\n\n');

    if (!fullText) {
      setSavedBanner('هیچ متنی برای کپی وجود ندارد.');
      setTimeout(() => setSavedBanner(null), 2500);
      return;
    }

    navigator.clipboard.writeText(fullText);
    setSavedBanner('متن کامل تمام بخش‌های ترجمه شده کتاب در کلیپ‌بورد کپی شد.');
    setTimeout(() => setSavedBanner(null), 3500);
  };

  // Quick Preset Helper for Header
  const applyHeaderPreset = (type: 'title_only' | 'site_url' | 'title_site' | 'clear') => {
    setShowHeader(type !== 'clear');
    if (type === 'title_only') {
      setHeaderText(project.title || project.originalTitle || 'کتاب ترجمه شده');
    } else if (type === 'site_url') {
      setHeaderText(websiteUrl || 'www.mywebsite.com');
    } else if (type === 'title_site') {
      setHeaderText(`${project.title || 'عنوان کتاب'} • ${websiteUrl || 'www.mywebsite.com'}`);
    } else if (type === 'clear') {
      setHeaderText('');
      setShowHeader(false);
    }
  };

  // Quick Preset Helper for Footer
  const applyFooterPreset = (type: 'copyright' | 'site_rights' | 'translator' | 'clear') => {
    setShowFooter(type !== 'clear');
    if (type === 'copyright') {
      setFooterText('کلیه حقوق محفوظ است');
    } else if (type === 'site_rights') {
      setFooterText(`ترجمه اختصاصی • ${websiteUrl || brandName || 'نسخه چاپی'}`);
    } else if (type === 'translator') {
      setFooterText(`مترجم: ${project.translator || 'سامانه هوشمند ترجمه'}`);
    } else if (type === 'clear') {
      setFooterText('');
      setShowFooter(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreenPreview ? 'w-[98vw] h-[96vh]' : 'w-full max-w-6xl max-h-[92vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold">
              <Palette className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">استودیوی دیزاین و خروجی کتاب (PDF / Word)</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  فونت: {fontFamily}
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {activeTheme.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تنظیم دقیق هدر، فوتر، نام و آدرس سایت شما، طرح‌های پس‌زمینه معنوی، کادربندی چاپی و خروجی رسمی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreenPreview(!isFullScreenPreview)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isFullScreenPreview ? 'نمای عادی' : 'نمای تمام‌صفحه'}
            >
              {isFullScreenPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'themes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>طرح و پس‌زمینه کتاب (Themes)</span>
            </button>

            <button
              onClick={() => setActiveTab('headers')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'headers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>هدر، فوتر و آدرس سایت شما</span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'typography'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>فونت Vazirmatn، حاشیه و واترمارک</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAsDefault}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
              title="ذخیره تنظیمات فعلی برای تمام کتاب‌ها"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>ذخیره به عنوان پیش‌فرض تمام کتاب‌ها</span>
            </button>
          </div>
        </div>

        {/* Content Body: Left Controls + Right Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Controls Column (6 or 7 cols) */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4">
            {/* TAB 1: Themes & Spiritual Backgrounds */}
            {activeTab === 'themes' && (
              <div className="space-y-4">
                {/* Spiritual Themes Section */}
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>طرح‌های ویژه برای کتاب‌های معنوی، عرفانی و خودشناسی:</span>
                    </span>
                    <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      تذهیب اسلیمی و پاپیروس عتیق
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['spiritual', 'spiritual_ancient', 'spiritual_azure'] as BookThemeId[]).map(id => {
                      const t = BOOK_THEMES[id];
                      const isSelected = t.id === themeId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setThemeId(t.id)}
                          className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                              : 'bg-slate-850 hover:bg-slate-800 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-amber-400/60 inline-block shrink-0 shadow-sm"
                                style={{ backgroundColor: t.pageBgColor }}
                              />
                              <span className="truncate">{t.name.split(' (')[0]}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <p className="text-[10px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Other Themes Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>سایر تم‌ها و پس‌زمینه‌های کتاب:</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['novel', 'luxury_gold', 'academic', 'sage_nature', 'minimal_clean'] as BookThemeId[]).map(id => {
                      const t = BOOK_THEMES[id];
                      const isSelected = t.id === themeId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setThemeId(t.id)}
                          className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                              : 'bg-slate-850 hover:bg-slate-800 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block shrink-0"
                                style={{ backgroundColor: t.pageBgColor }}
                              />
                              <span>{t.name}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Border Style Selection */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-amber-400" />
                    <span>کادر و قاب دور صفحه (Border Style):</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BORDER_STYLES.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBorderStyle(b.id)}
                        className={`p-2.5 rounded-xl border text-right transition text-xs ${
                          borderStyle === b.id
                            ? 'bg-slate-800 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/30'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>{b.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-teal-400" />
                    <span>نقش زمینه صفحات (Watermark & Pattern):</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BACKGROUND_PATTERNS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setBackgroundPattern(p.id)}
                        className={`p-2.5 rounded-xl border text-right transition text-xs ${
                          backgroundPattern === p.id
                            ? 'bg-slate-800 border-teal-500 text-teal-300 font-bold ring-1 ring-teal-500/30'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>{p.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Custom Header, Footer & Website URL */}
            {activeTab === 'headers' && (
              <div className="space-y-4">
                {/* Website & Brand Info Input */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>اطلاعات برند، آدرس سایت یا انتشارات شما:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">در هدر، فوتر و صفحه اول درج می‌شود</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">آدرس وب‌سایت شما:</label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="مثال: www.mywebsite.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">نام سایت یا انتشارات:</label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={e => setBrandName(e.target.value)}
                        placeholder="مثال: انتشارات نوین اندیشه"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Running Header Settings */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={showHeader}
                        onChange={e => setShowHeader(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>درج هدر در بالای تمام صفحات کتاب (Running Header)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {showHeader ? 'فعال' : 'غیرفعال (بدون متن در بالای صفحه)'}
                    </span>
                  </div>

                  {showHeader ? (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-300 font-semibold">متن هدر بالا:</label>
                          <span className="text-[10px] text-slate-500">دقیقاً این متن بالای صفحات چاپ می‌شود</span>
                        </div>
                        <input
                          type="text"
                          value={headerText}
                          onChange={e => setHeaderText(e.target.value)}
                          placeholder="مثال: انتشارات نوین • www.mywebsite.com"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400">پیش‌تنظیم‌های سریع:</span>
                        <button
                          type="button"
                          onClick={() => applyHeaderPreset('site_url')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                        >
                          آدرس سایتم
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHeaderPreset('title_site')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                        >
                          عنوان کتاب + سایتم
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHeaderPreset('title_only')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                        >
                          فقط عنوان کتاب
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHeaderPreset('clear')}
                          className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] border border-red-500/30 transition"
                        >
                          پاک کردن هدر
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px] p-2 bg-slate-900 rounded-xl">
                      هدر بالای صفحه غیرفعال است. هیچ متن، نام یا لینکی در بالای صفحات چاپ نخواهد شد.
                    </div>
                  )}
                </div>

                {/* Running Footer Settings */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-750 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={showFooter}
                        onChange={e => setShowFooter(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>درج فوتر در پایین صفحات کتاب (Running Footer)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {showFooter ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>

                  {showFooter ? (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-300 font-semibold">متن فوتر پایین:</label>
                          <span className="text-[10px] text-slate-500">حقوق ترجمه، یادداشت یا کانال ارتباطی</span>
                        </div>
                        <input
                          type="text"
                          value={footerText}
                          onChange={e => setFooterText(e.target.value)}
                          placeholder="مثال: کلیه حقوق ترجمه محفوظ است • www.mywebsite.com"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400">پیش‌تنظیم‌های سریع:</span>
                        <button
                          type="button"
                          onClick={() => applyFooterPreset('site_rights')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                        >
                          ترجمه اختصاصی سایتم
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFooterPreset('copyright')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                        >
                          حقوق محفوظ است
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFooterPreset('translator')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                        >
                          نام مترجم
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFooterPreset('clear')}
                          className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] border border-red-500/30 transition"
                        >
                          خالی
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px] p-2 bg-slate-900 rounded-xl">
                      متن فوتر اختصاصی غیرفعال است (فقط شماره صفحه در صورت فعال بودن درج می‌شود).
                    </div>
                  )}

                  {/* General Checkboxes */}
                  <div className="pt-2 flex flex-wrap items-center gap-5 border-t border-slate-750">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={showPageNumbers}
                        onChange={e => setShowPageNumbers(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>شماره‌گذاری خودکار صفحات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={showCoverPage}
                        onChange={e => setShowCoverPage(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>صفحه عنوان و جلد در ابتدای کتاب</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Typography, Margins & Watermark */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                {/* Font & Spacing */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3 text-xs">
                  <h3 className="font-bold text-white flex items-center gap-1.5 border-b border-slate-750 pb-2">
                    <Type className="w-3.5 h-3.5 text-purple-400" />
                    <span>قلم و فواصل چاپی:</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">فونت برای ورد و چاپ:</label>
                      <select
                        value={fontFamily}
                        onChange={e => setFontFamily(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 font-medium"
                      >
                        <option value="Vazirmatn">Vazirmatn (پیش‌فرض مدرن و فصیح)</option>
                        <option value="Tahoma">Tahoma (موجود در ۱۰۰٪ سیستم‌ها - بدون نیاز به نصب)</option>
                        <option value="B Nazanin">B Nazanin (کتابی سنتی ناشران)</option>
                        <option value="B Mitra">B Mitra (مناسب رمان و ادبیات)</option>
                        <option value="IRANSans">IRANSans (ایران‌سنس)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">اندازه قلم متن:</label>
                      <select
                        value={fontSize}
                        onChange={e => setFontSize(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 font-medium"
                      >
                        <option value="small">ریز (11pt - کتاب جیبی)</option>
                        <option value="medium">متوسط (12pt - استاندارد رقعی)</option>
                        <option value="large">درشت (14pt - خوانش راحت)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">فاصله خطوط:</label>
                      <select
                        value={lineSpacing}
                        onChange={e => setLineSpacing(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 font-medium"
                      >
                        <option value="compact">فشرده (1.65)</option>
                        <option value="normal">استاندارد کتابی (1.95)</option>
                        <option value="relaxed">روان و باز (2.25)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Word Font Explanation & Download Section */}
                <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-amber-400 font-bold">
                      <Type className="w-4 h-4 text-amber-400" />
                      <span>راهنمای مهم نمایش فونت‌ها در نرم‌افزار Microsoft Word:</span>
                    </span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      پشتیبانی کامل از فونت‌های فارسی
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    برخلاف مرورگر وب که فونت را به شکل اینترنتی دانلود و نمایش می‌دهد، نرم‌افزار <strong>Word</strong> فونت‌ها را از بین <strong>فونت‌های نصب‌شده روی ویندوز یا سیستم‌عامل شما</strong> فراخوانی می‌کند:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-750">
                      <span className="font-bold text-amber-300 block mb-1">روش اول: بدون نیاز به نصب هیچ فایلی</span>
                      <span className="text-slate-400 leading-relaxed">
                        فونت را روی <strong className="text-white">Tahoma</strong> بگذارید. تاهوما در ۱۰۰٪ نسخه‌های ویندوز و آفیس به شکل پیش‌فرض وجود دارد و فوراً با حروف‌چینی درست و منظم باز می‌شود.
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-750">
                      <span className="font-bold text-amber-300 block mb-1">روش دوم: بالاترین کیفیت چاپی (وزیرمتن)</span>
                      <span className="text-slate-400 leading-relaxed">
                        پکیج فونت وزیرمتن را از دکمه زیر دریافت کنید؛ سپس فایل‌های TTF را باز کرده و دکمه <strong className="text-white">Install</strong> را بزنید (۲ ثانیه). از آن پس، تمام اسناد کتاب با شکوه وزیرمتن در ورد باز می‌شوند.
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <a
                      href="/fonts/Vazirmatn-Fonts.zip"
                      download="Vazirmatn-Fonts.zip"
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition flex items-center gap-1.5 text-xs shadow-md shadow-amber-500/20"
                      title="دانلود پکیج کامل فونت‌های وزن‌های مختلف وزیرمتن به صورت زیپ"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-950" />
                      <span>دانلود پکیج فونت‌های وزیرمتن برای ویندوز (ZIP)</span>
                    </a>
                    <a
                      href="/fonts/Vazirmatn-Regular.ttf"
                      download="Vazirmatn-Regular.ttf"
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold transition flex items-center gap-1.5 text-xs"
                      title="دانلود مستقیم فونت عادی وزیرمتن (فایل تک TTF)"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>دانلود مستقیم فونت وزیرمتن (فایل TTF)</span>
                    </a>
                  </div>
                </div>

                {/* Margins */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2.5 text-xs">
                  <label className="block font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>فاصله حاشیه صفحه از لبه کاغذ (Margins):</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'compact', name: 'فشرده و اقتصادی', desc: 'حداکثر متن در هر صفحه' },
                      { id: 'normal', name: 'استاندارد کتابی (پیشنهادی)', desc: 'تعادل بین زیبایی و مصرف کاغذ' },
                      { id: 'generous', name: 'لوکس و عریض', desc: 'حاشیه باز برای کتب نفیس' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPageMargin(m.id as any)}
                        className={`p-2.5 rounded-xl border text-right transition ${
                          pageMargin === m.id
                            ? 'bg-slate-800 border-blue-500 text-blue-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Watermark Text */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>متن واترمارک اختصاصی در پس‌زمینه صفحات (اختیاری):</span>
                    </label>
                    <span className="text-[10px] text-slate-400">به صورت محو و زاویه‌دار در پس‌زمینه</span>
                  </div>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="مثال: ترجمه اختصاصی www.mywebsite.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Notification Banner */}
            {savedBanner && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{savedBanner}</span>
              </div>
            )}
          </div>

          {/* Live Page Mockup Column (6 or 5 cols) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>پیش‌نمایش زنده صفحه چاپ کتاب:</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {activeTheme.name.split(' (')[0]} • {activeTheme.dividerSymbol}
              </span>
            </div>

            {/* Simulated Printed Page */}
            <div
              className={`flex-1 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between transition-all duration-300 select-none overflow-hidden min-h-[420px] relative ${
                borderStyle === 'ornate_spiritual'
                  ? 'border-4 border-double'
                  : borderStyle === 'double_classic'
                  ? 'border-4 border-double'
                  : borderStyle === 'thin_modern'
                  ? 'border'
                  : ''
              }`}
              style={{
                backgroundColor: activeTheme.pageBgColor,
                color: activeTheme.textColor,
                borderColor: activeTheme.borderColor,
                fontFamily: `'${fontFamily}', 'Vazirmatn', sans-serif`,
              }}
            >
              {/* Optional Subtle Watermark in Preview */}
              {watermarkText.trim() && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] overflow-hidden select-none">
                  <div
                    className="transform -rotate-45 text-2xl font-bold tracking-widest text-center whitespace-nowrap"
                    style={{ color: activeTheme.headingColor }}
                  >
                    {watermarkText}
                  </div>
                </div>
              )}

              {/* Running Header */}
              {showHeader && headerText ? (
                <div
                  className="border-b pb-2 flex items-center justify-between text-[10px] opacity-80"
                  style={{ borderColor: activeTheme.borderColor }}
                >
                  <span className="font-medium truncate max-w-[200px]">{headerText}</span>
                  <span className="font-serif italic text-[9px] truncate max-w-[110px]" dir="ltr">
                    {project.originalTitle || 'Chapter 1'}
                  </span>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400/50 pb-1 italic border-b border-dashed border-slate-300/40">
                  (بدون هدر در بالای صفحه)
                </div>
              )}

              {/* Sample Content */}
              <div className="my-auto py-3 space-y-3 text-right">
                {/* Chapter Title & Divider */}
                <div className="text-center space-y-1">
                  <h3
                    className="font-extrabold text-sm sm:text-base tracking-tight"
                    style={{ color: activeTheme.headingColor }}
                  >
                    فصل اول: دروازه ورود به اکنون
                  </h3>
                  <div
                    className="text-xs font-serif opacity-85"
                    style={{ color: activeTheme.accentColor }}
                  >
                    {activeTheme.dividerSymbol}
                  </div>
                </div>

                {/* Sample Paragraph with Highlight */}
                <p
                  className="text-justify leading-relaxed text-[11px] sm:text-xs"
                  style={{
                    lineHeight: lineSpacing === 'compact' ? 1.65 : lineSpacing === 'relaxed' ? 2.25 : 1.95,
                    fontSize: fontSize === 'small' ? '10px' : fontSize === 'large' ? '13px' : '11.5px',
                  }}
                >
                  بزرگ‌ترین مانع در مسیر درک حقیقت، هم‌هویت‌شدن با{' '}
                  <span style={{ color: '#9b2c2c', fontWeight: 'bold' }}>ذهن شرطی‌شده</span> است. هنگامی که انسان اسیر
                  جریان بی‌پایان افکار می‌گردد، ارتباط بنیادین خود را با ساحت آرامش درونی از دست می‌دهد.
                </p>

                {/* Sample Quote */}
                <div
                  className="p-2.5 rounded-lg border-r-4 text-[10.5px] italic opacity-95 my-1"
                  style={{
                    borderRightColor: activeTheme.accentColor,
                    backgroundColor: `${activeTheme.borderColor}20`,
                  }}
                >
                  «سکوت، زبانی است که کائنات به واسطه آن ژرف‌ترین حقایق را آشکار می‌سازد.»
                </div>
              </div>

              {/* Running Footer */}
              {showFooter && footerText ? (
                <div
                  className="border-t pt-2 flex items-center justify-between text-[10px] opacity-80"
                  style={{ borderColor: activeTheme.borderColor }}
                >
                  <span className="truncate max-w-[200px]">{footerText}</span>
                  {showPageNumbers && <span className="font-bold font-mono">صفحه ۲۴</span>}
                </div>
              ) : showPageNumbers ? (
                <div
                  className="border-t pt-1 flex items-center justify-end text-[10px] opacity-80"
                  style={{ borderColor: activeTheme.borderColor }}
                >
                  <span className="font-bold font-mono">صفحه ۲۴</span>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400/50 pt-1 italic border-t border-dashed border-slate-300/40">
                  (بدون فوتر در پایین صفحه)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>قالب: {activeTheme.name}</span>
              <span>کادر: {BORDER_STYLES.find(b => b.id === borderStyle)?.name}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFullBook}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
              title="کپی کردن متن کامل تمام بخش‌ها"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>کپی متن کتاب</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Word .doc with full design */}
            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              title="خروجی Word با پشتیبانی کامل از رنگ پس‌زمینه، کادرها و تصاویر (فرمت استاندارد .doc)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>فایل Word با طراحی کامل (.doc)</span>
            </button>

            {/* Word DOCX Button with Vazirmatn Medium */}
            <button
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
              title="دانلود فایل رسمی DOCX با هدر و فوتر و فونت وزیرمتن"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingDocx ? 'درحال ساخت سند ورد...' : 'دانلود فایل Word (.docx)'}</span>
            </button>

            {/* Print & Save PDF Button */}
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-amber-500/20 font-bold"
              title="چاپ مستقیم یا ذخیره به صورت PDF با تنظیمات دلخواه"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>چاپ و ذخیره فایل PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
