import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCw,
  Copy,
  Check,
  Edit3,
  Eye,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Search,
  ExternalLink,
  Split,
  Maximize2,
  Server,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { BookChunk, BookProject, APIServerEndpoint } from '../types.ts';
import { cleanChapterTitle, groupChunksIntoChapters } from '../utils/exporter.ts';

import { Trash2 } from 'lucide-react';

interface TranslationWorkspaceProps {
  currentChunk: BookChunk | null;
  project: BookProject;
  onUpdateChunkHtml: (chunkId: string, newHtml: string) => void;
  onUpdateChunkEnglish?: (chunkId: string, newEnglish: string) => void;
  onUpdateChunkTitle?: (chunkId: string, newTitle: string) => void;
  onDeleteChunk?: (chunkId: string) => void;
  onTranslateCurrentChunk: () => void;
  onStartBatchTranslate: () => void;
  onStopBatchTranslate: () => void;
  isBatchTranslating: boolean;
  batchProgress: { current: number; total: number; secondsToNextCall: number };
  onStartCloudTranslation?: () => void;
  onStopCloudTranslation?: () => void;
  isCloudTranslating?: boolean;
  onSelectPrevChunk: () => void;
  onSelectNextChunk: () => void;
  hasPrevChunk: boolean;
  hasNextChunk: boolean;
  onUpdateModel?: (model: string) => void;
  serverPool?: APIServerEndpoint[];
  onOpenServerPoolModal?: () => void;
  isAdmin?: boolean;
}

export const TranslationWorkspace: React.FC<TranslationWorkspaceProps> = ({
  currentChunk,
  project,
  onUpdateChunkHtml,
  onUpdateChunkEnglish,
  onUpdateChunkTitle,
  onDeleteChunk,
  onTranslateCurrentChunk,
  onStartBatchTranslate,
  onStopBatchTranslate,
  isBatchTranslating,
  batchProgress,
  onStartCloudTranslation,
  onStopCloudTranslation,
  isCloudTranslating,
  onSelectPrevChunk,
  onSelectNextChunk,
  hasPrevChunk,
  hasNextChunk,
  onUpdateModel,
  serverPool,
  onOpenServerPoolModal,
  isAdmin = false,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedFa, setCopiedFa] = useState(false);
  const [fullBookMode, setFullBookMode] = useState(false);

  if (!currentChunk && !fullBookMode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-300">بخشی برای نمایش انتخاب نشده است</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          از فهرست کناری یک بخش را انتخاب کنید یا از دکمه «کتاب‌های نمونه» در بالا برای شروع استفاده نمایید.
        </p>
      </div>
    );
  }

  const handleCopyEnglish = () => {
    if (currentChunk) {
      navigator.clipboard.writeText(currentChunk.englishText);
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    }
  };

  const handleCopyPersian = () => {
    if (currentChunk?.translatedHtml) {
      navigator.clipboard.writeText(currentChunk.translatedHtml);
      setCopiedFa(true);
      setTimeout(() => setCopiedFa(false), 2000);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-8rem)] overflow-hidden bg-slate-950">
      
      {/* Workspace Top Toolbar */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        
        {/* Left Side: Navigation & Full Book toggle */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setFullBookMode(!fullBookMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              fullBookMode
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{fullBookMode ? 'بازگشت به نمای بخش‌ها' : 'نمای یکپارچه تمام کتاب'}</span>
          </button>

          {!fullBookMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={onSelectPrevChunk}
                disabled={!hasPrevChunk}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition"
                title="بخش قبلی"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 px-2 font-mono">
                {currentChunk ? `بخش ${currentChunk.chunkNumber} • ${cleanChapterTitle(currentChunk.chapterTitle)}` : ''}
              </span>
              <button
                onClick={onSelectNextChunk}
                disabled={!hasNextChunk}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition"
                title="بخش بعدی"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Right Side: Translation Actions & Rate Limiter Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Delete Current Page Button */}
          {!fullBookMode && currentChunk && onDeleteChunk && (
            <button
              onClick={() => {
                if (confirm(`آیا از حذف صفحه ${currentChunk.chunkNumber} (${cleanChapterTitle(currentChunk.chapterTitle)}) اطمینان دارید؟`)) {
                  onDeleteChunk(currentChunk.id);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
              title="حذف آنلاین این صفحه از کتاب"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Active Failover Server Pool Button & API Edit Shortcut - Visible ONLY for Admin */}
          {isAdmin && onOpenServerPoolModal && (
            <button
              onClick={onOpenServerPoolModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition shadow-sm"
              title="مشاهده، تست و ویرایش تنظیمات و کلیدهای API سرورها"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">سوئیچ خودکار:</span>
              <span className="text-emerald-400 font-bold font-mono text-[11px]">
                {serverPool?.filter(s => s.isEnabled).length || 1} سرور
              </span>
              <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mr-0.5 font-bold">
                ویرایش API
              </span>
            </button>
          )}

          {/* Cloud Server Background Translation: Start or Stop (with fair refund) */}
          {isCloudTranslating ? (
            <button
              onClick={onStopCloudTranslation}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5 shadow-md shadow-red-600/20"
              title="توقف ترجمه در سرور و بازگرداندن هزینه صفحات باقی‌مانده به کیف پول"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>توقف ترجمه (با بازگشت هزینه)</span>
            </button>
          ) : (
            onStartCloudTranslation && (
              <button
                onClick={onStartCloudTranslation}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                title="شروع ترجمه ابری در سرور بدون نیاز به باز بودن مرورگر"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>شروع ترجمه ابری در سرور</span>
              </button>
            )
          )}

          {/* Batch Auto-Translate Controls (In-browser option) */}
          {isBatchTranslating ? (
            <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-500/40 px-3 py-1 rounded-lg">
              <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <div className="text-xs text-blue-200">
                <span>ترجمه متوالی: </span>
                <strong className="font-mono text-white">{batchProgress.current}</strong> از <strong className="font-mono text-white">{batchProgress.total}</strong>
                {batchProgress.secondsToNextCall > 0 && (
                  <span className="text-[11px] text-amber-300 mr-2 font-mono">
                    (مکث ایمن: {batchProgress.secondsToNextCall}s)
                  </span>
                )}
              </div>
              <button
                onClick={onStopBatchTranslate}
                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition flex items-center gap-1 mr-2"
              >
                <Pause className="w-3 h-3" />
                <span>توقف</span>
              </button>
            </div>
          ) : (
            !isCloudTranslating && (
              <button
                onClick={onStartBatchTranslate}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm"
                title="ترجمه خودکار در مرورگر"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">ترجمه در مرورگر</span>
              </button>
            )
          )}

          {/* Single Chunk Translate */}
          {!fullBookMode && currentChunk && (
            <button
              onClick={onTranslateCurrentChunk}
              disabled={currentChunk.status === 'translating' || isBatchTranslating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              {currentChunk.status === 'translating' ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>درحال ترجمه...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentChunk.translatedHtml ? 'ترجمه مجدد این صفحه' : 'ترجمه این صفحه'}</span>
                </>
              )}
            </button>
          )}

          {/* View Mode Toggle: Preview vs Edit */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">پیش‌نمایش کتاب</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span className="hidden sm:inline">ویرایش HTML</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Dual View Container */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* If in Full Book Mode, show full rendered Persian text */}
        {fullBookMode ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/60">
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-14 rounded-2xl shadow-2xl border border-slate-200">
              
              {/* Book Title Header */}
              <div className="text-center pb-8 mb-8 border-b border-slate-200">
                <h1 className="text-3xl font-extrabold text-[#1a365d] mb-3">
                  {project.title || project.originalTitle}
                </h1>
                <p className="text-sm text-slate-600 font-medium">نویسنده: {project.author || 'نامشخص'}</p>
                <p className="text-xs text-slate-500 italic mt-1">ترجمه: {project.translator || 'سامانه هوشمند ترجمه کتاب'}</p>
              </div>

              {/* Book Chapters Loop */}
              <div className="space-y-12">
                {groupChunksIntoChapters(project?.chunks || []).map((ch) => (
                  <div key={ch.chapterKey} className="book-chapter-block border-b border-slate-100 pb-10 last:border-b-0">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-[#1a365d] mb-2">{ch.title}</h2>
                      <div className="text-amber-600 opacity-60 text-sm">❦ ✤ ❦</div>
                    </div>

                    <div
                      className="book-render-content text-justify leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: ch.htmlContent }}
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* Left Column: English Original */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-l border-slate-800 flex flex-col bg-slate-900/40">
              
              {/* Sub-header */}
              <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">متن اصلی انگلیسی (Source)</span>
                  <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    {currentChunk?.wordCount} کلمه
                  </span>
                  {currentChunk?.hasImages && (
                    <span className="flex items-center gap-1 font-mono text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <ImageIcon className="w-3 h-3 text-amber-400" />
                      <span>{currentChunk.imageCount || 1} تصویر استخراج‌شده</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCopyEnglish}
                  className="flex items-center gap-1 hover:text-white transition"
                  title="کپی متن انگلیسی"
                >
                  {copiedEn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEn ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>

              {/* English Text & Embedded Images Content */}
              <div
                dir="ltr"
                className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-slate-300 font-serif select-text selection:bg-blue-600 selection:text-white"
              >
                {currentChunk?.englishText ? (
                  currentChunk.englishText.includes('<') ? (
                    <div
                      className="english-book-view space-y-4"
                      dangerouslySetInnerHTML={{ __html: currentChunk.englishText }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {currentChunk.englishText}
                    </div>
                  )
                ) : (
                  <div className="text-slate-500 italic">متنی برای این بخش وجود ندارد.</div>
                )}
              </div>

            </div>

            {/* Right Column: Persian Formatted Translation */}
            <div className="w-full md:w-1/2 flex flex-col bg-slate-900/70">
              
              {/* Sub-header */}
              <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-400">ترجمه فارسی و صفحه‌بندی چاپی (Target)</span>
                  {isAdmin ? (
                    currentChunk?.serverUsed ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${
                        currentChunk.switchOccurred
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}>
                        <Zap className="w-2.5 h-2.5" />
                        <span>توسط {currentChunk.serverUsed}</span>
                        {currentChunk.switchOccurred && (
                          <span className="text-[9px] text-amber-400 font-bold">(سوئیچ خودکار)</span>
                        )}
                      </span>
                    ) : currentChunk?.keyUsed ? (
                      <span className="text-[10px] text-slate-500 font-mono">
                        (توسط {currentChunk.keyUsed})
                      </span>
                    ) : null
                  ) : (
                    currentChunk?.translatedHtml ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        تکمیل شده • آماده چاپ
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        در انتظار ترجمه
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyPersian}
                    disabled={!currentChunk?.translatedHtml}
                    className="flex items-center gap-1 hover:text-white transition disabled:opacity-40"
                    title="کپی کد HTML یا متن"
                  >
                    {copiedFa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFa ? 'کپی شد' : 'کپی'}</span>
                  </button>
                </div>
              </div>

              {/* Translation Display Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
                
                {currentChunk?.status === 'translating' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
                    <h4 className="text-sm font-bold text-slate-200">درحال ترجمه هوشمند این بخش...</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      مدل جمینای در حال اعمال لحن «{project.tone}»، تطبیق واژه‌نامه تخصصی و ساختاردهی HTML است.
                    </p>
                  </div>
                ) : currentChunk?.status === 'error' ? (
                  <div className="max-w-md mx-auto p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3.5 my-auto">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-red-300">خطا در فرآیند ترجمه این بخش</div>
                      <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                        {currentChunk.errorMessage || 'مشکل در برقراری ارتباط با مدل هوش مصنوعی'}
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 text-right">
                      {currentChunk.errorMessage?.includes('HTML') || currentChunk.errorMessage?.includes('200') || currentChunk.errorMessage?.includes('۴۰۴') ? (
                        <>
                          <strong className="text-amber-300 block">راهنمای اتصال در سرور لینوکس (Ubuntu Nginx):</strong>
                          <p className="text-slate-400 leading-relaxed">
                            وب‌سرور Nginx به دلیل عدم تنظیم <span className="font-mono text-indigo-300">proxy_pass /api/</span>، صفحه اصلی فرانت را تحویل داده است. برای رفع فوری، دکمه «ویرایش سرورها» در زیر را بزنید و حالت اتصال را روی <strong>«مستقیم مرورگر»</strong> قرار دهید تا بدون نیاز به Nginx ترجمه انجام شود.
                          </p>
                        </>
                      ) : (
                        <>
                          <strong className="text-amber-300 block">راهنمای سوئیچ خودکار و رفع خطای ۵۰۳:</strong>
                          <p className="text-slate-400 leading-relaxed">
                            در صورت ترافیک موقت یا اتمام سهمیه یک کلید، سیستم به طور خودکار به کلید و سرور بعدی در استخر سوئیچ می‌کند. با دکمه زیر می‌توانید مجدداً تلاش نمایید.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                      <button
                        onClick={onTranslateCurrentChunk}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>تلاش مجدد</span>
                      </button>

                      {onOpenServerPoolModal && (
                        <button
                          onClick={onOpenServerPoolModal}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                        >
                          <Server className="w-3.5 h-3.5 text-amber-400" />
                          <span>ویرایش سرورها و کلیدهای API</span>
                        </button>
                      )}

                      {onUpdateModel && (
                        <button
                          onClick={() => {
                            const nextModel = project.model === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
                            onUpdateModel(nextModel);
                            setTimeout(() => onTranslateCurrentChunk(), 300);
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            تلاش با مدل {project.model === 'gemini-3.1-flash-lite' ? 'Gemini 3.8 Flash' : 'Gemini 3.1 Flash-Lite'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : currentChunk?.translatedHtml ? (
                  viewMode === 'preview' ? (
                    /* High-fidelity Book Page Card */
                    <div className="max-w-2xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 book-page">
                      <div
                        className="book-render-content"
                        dangerouslySetInnerHTML={{ __html: currentChunk.translatedHtml }}
                      />
                    </div>
                  ) : (
                    /* Direct HTML Editor */
                    <div className="h-full flex flex-col">
                      <div className="text-[11px] text-slate-400 mb-2">
                        کد HTML ترجمه شده (می‌توانید کلمات را ویرایش کنید):
                      </div>
                      <textarea
                        value={currentChunk.translatedHtml}
                        onChange={e => onUpdateChunkHtml(currentChunk.id, e.target.value)}
                        className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                        dir="ltr"
                      />
                    </div>
                  )
                ) : (
                  /* Empty state for this chunk */
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                    <h4 className="text-sm font-bold text-slate-300">این بخش هنوز ترجمه نشده است</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                      روی دکمه «ترجمه این بخش» در بالا کلیک کنید تا هوش مصنوعی متن را با فرمت کتابی آماده کند.
                    </p>
                    <button
                      onClick={onTranslateCurrentChunk}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>شروع ترجمه این بخش</span>
                    </button>
                  </div>
                )}

              </div>

            </div>
          </>
        )}

      </div>

    </main>
  );
};
