import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  FileText,
  FileCode,
  Printer,
  Server,
  Layers,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Palette
} from 'lucide-react';
import { BookProject, ServerStatusResponse } from '../types.ts';
import { downloadDocx, downloadWordHtml, downloadStyledHtml, downloadPlainText, exportProjectJson } from '../utils/exporter.ts';
import { SAMPLE_BOOKS, SampleBook } from '../utils/sampleBooks.ts';

interface NavbarProps {
  currentProject: BookProject;
  serverStatus: ServerStatusResponse | null;
  onOpenServerModal: () => void;
  onOpenNewBookModal: () => void;
  onOpenGlossaryModal: () => void;
  onLoadSampleBook: (sample: SampleBook) => void;
  onPrintPdf: () => void;
  onOpenLibraryModal: () => void;
  booksCount: number;
  onOpenProvidersModal: () => void;
  activeProviderName: string;
  onOpenDesignModal: () => void;
  onBackToDashboard?: () => void;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  serverStatus,
  onOpenServerModal,
  onOpenNewBookModal,
  onOpenGlossaryModal,
  onLoadSampleBook,
  onPrintPdf,
  onOpenLibraryModal,
  booksCount,
  onOpenProvidersModal,
  activeProviderName,
  onOpenDesignModal,
  onBackToDashboard,
  isAdmin = false,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const chunks = currentProject?.chunks || [];
  const completedChunks = chunks.filter(c => c.translatedHtml).length;
  const totalChunks = chunks.length;

  const handleDocxExport = async () => {
    setIsExportingDocx(true);
    await downloadDocx(currentProject);
    setIsExportingDocx(false);
    setShowExportMenu(false);
  };

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center gap-1 text-xs font-semibold transition shadow-sm"
              title="بازگشت به میز کاربری"
            >
              <span>← پیشخوان</span>
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-white">
                ویراستار و مترجم کتاب
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                پردازش ابری
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ویرایش ساختاریافته، واژه‌نامه یکپارچه و خروجی Word و PDF
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Books Shelf / Library Button */}
          <button
            onClick={onOpenLibraryModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="مشاهده تمام کتاب‌های آپلود شده"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">قفسه کتاب‌ها</span>
            <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {booksCount}
            </span>
          </button>

          {/* AI Providers Manager Button - Visible ONLY for Admin */}
          {isAdmin && (
            <button
              onClick={onOpenProvidersModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="تنظیمات ارائه‌دهندگان: OpenRouter, OpenAI, GLM, Gemini, واسط"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">ارائه‌دهنده:</span>
              <span className="text-emerald-400 font-bold max-w-[90px] truncate">
                {activeProviderName}
              </span>
            </button>
          )}

          {/* Sample Books Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">نمونه‌ها</span>
            </button>

            {showSamplesMenu && (
              <div
                className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 text-right"
                onMouseLeave={() => setShowSamplesMenu(false)}
              >
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-700">
                  انتخاب نمونه برای تست سریع:
                </div>
                {SAMPLE_BOOKS.map(book => (
                  <button
                    key={book.id}
                    onClick={() => {
                      onLoadSampleBook(book);
                      setShowSamplesMenu(false);
                    }}
                    className="w-full text-right px-4 py-2.5 text-xs hover:bg-slate-700 text-slate-200 flex flex-col gap-0.5 transition"
                  >
                    <span className="font-medium text-white">{book.title}</span>
                    <span className="text-[11px] text-slate-400">{book.author} • {book.originalTitle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Book Button */}
          <button
            onClick={onOpenNewBookModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">آپلود کتاب</span>
          </button>

          {/* Book Design & PDF Studio Button */}
          <button
            onClick={onOpenDesignModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/40 transition shadow-sm"
            title="تنظیم هدر، فوتر، تم پس‌زمینه و خروجی شیک PDF و Word"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">دیزاین و چاپ PDF</span>
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={completedChunks === 0}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                completedChunks > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی و دانلود ({completedChunks}/{totalChunks})</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 text-right"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-700">
                  فرمت‌های استاندارد خروجی:
                </div>

                {/* Design Studio Trigger */}
                <button
                  onClick={() => {
                    onOpenDesignModal();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 border-b border-slate-700 transition"
                >
                  <Palette className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">استودیوی دیزاین و چاپ کتاب</div>
                    <div className="text-[10px] text-amber-300/80">تنظیم هدر، آدرس سایت، تم و فونت</div>
                  </div>
                </button>

                {/* Word DOCX */}
                <button
                  onClick={handleDocxExport}
                  disabled={isExportingDocx}
                  className="w-full text-right px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-white">فایل Word (.docx)</div>
                      <div className="text-[10px] text-slate-400">صفحه‌بندی شده، فونت وزیرمتن و RTL</div>
                    </div>
                  </div>
                  {isExportingDocx && <span className="text-[10px] text-blue-400">در حال ساخت...</span>}
                </button>

                {/* Word DOC (Legacy HTML) */}
                <button
                  onClick={() => {
                    downloadWordHtml(currentProject);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">سند مایکروسافت ورد (.doc)</div>
                    <div className="text-[10px] text-slate-400">سازگار با تمام نسخه‌های Word</div>
                  </div>
                </button>

                {/* PDF Print */}
                <button
                  onClick={() => {
                    if (onOpenDesignModal) {
                      onOpenDesignModal();
                    } else {
                      onPrintPdf();
                    }
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">خروجی PDF آماده چاپ (با دیزاین)</div>
                    <div className="text-[10px] text-slate-400">تنظیم هدر، فوتر، نام سایت و چاپ مستقیم</div>
                  </div>
                </button>

                {/* HTML */}
                <button
                  onClick={() => {
                    downloadStyledHtml(currentProject);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition"
                >
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">فایل وب استایل‌دار (.html)</div>
                    <div className="text-[10px] text-slate-400">شامل ساختار کامل رنگی و واژه‌نامه</div>
                  </div>
                </button>

                {/* TXT */}
                <button
                  onClick={() => {
                    downloadPlainText(currentProject);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-semibold text-white">متن خام فارسی (.txt)</div>
                    <div className="text-[10px] text-slate-400">بدون تگ‌های HTML</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-700"></div>

                {/* Backup JSON */}
                <button
                  onClick={() => {
                    exportProjectJson(currentProject);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-xs hover:bg-slate-700 text-slate-300 flex items-center gap-2 transition"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>پشتیبان‌گیری کامل پروژه (JSON)</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
