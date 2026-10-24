import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowUpRight,
  RefreshCw,
  LogOut,
  Sliders,
  ChevronLeft
} from 'lucide-react';
import { User, BookProject, TranslationJob } from '../types.ts';

interface UserDashboardProps {
  user: User;
  books: BookProject[];
  activeJobs: TranslationJob[];
  onOpenNewBook: () => void;
  onSelectBook: (book: BookProject) => void;
  onOpenWallet: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  onDeleteBook: (bookId: string) => void;
  onStartTranslation: (book: BookProject) => void;
  onExportDocx: (book: BookProject) => void;
  onExportPdf: (book: BookProject) => void;
  onExportEpub: (book: BookProject) => void;
  onRefresh: () => void;
}

export function UserDashboard({
  user,
  books = [],
  activeJobs = [],
  onOpenNewBook,
  onSelectBook,
  onOpenWallet,
  onOpenAdmin,
  onLogout,
  onDeleteBook,
  onStartTranslation,
  onExportDocx,
  onExportPdf,
  onExportEpub,
  onRefresh,
}: UserDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'translating' | 'draft'>('all');

  // Compute stats
  const totalBooks = books.length;
  let totalWordsTranslated = 0;
  let completedBooksCount = 0;

  books.forEach((b) => {
    if (b.chunks) {
      b.chunks.forEach((c) => {
        if (c.status === 'completed') {
          totalWordsTranslated += c.wordCount || 0;
        }
      });
      if (b.chunks.every((c) => c.status === 'completed') && b.chunks.length > 0) {
        completedBooksCount++;
      }
    }
  });

  const filteredBooks = books.filter((b) => {
    const isCompleted = b.chunks?.every((c) => c.status === 'completed') && b.chunks?.length > 0;
    const isTranslating = activeJobs.some((j) => j.bookId === b.id) || b.chunks?.some((c) => c.status === 'queued' || c.status === 'translating');

    if (filter === 'completed') return isCompleted;
    if (filter === 'translating') return isTranslating;
    if (filter === 'draft') return !isCompleted && !isTranslating;
    return true;
  });

  const getToneLabel = (tone?: string) => {
    switch (tone) {
      case 'spiritual': return 'معنوی و خودشناسی';
      case 'novel': return 'رمان و ادبیات';
      case 'self_help': return 'روانشناسی و رشد فردی';
      case 'academic': return 'دانشگاهی و پژوهشی';
      case 'business': return 'اقتصادی و مالی';
      case 'aerospace': return 'علوم هوافضا و فیزیک';
      case 'mathematics': return 'ریاضیات و مهندسی';
      default: return 'ادبی و عمومی';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn'] selection:bg-amber-500/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">میز کاربری کتاب‌ها</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {user.role === 'admin' ? 'مدیر ارشد' : 'کاربر ویژه'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.name} ({user.phone || user.email})</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Quick Pill */}
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-all group"
            >
              <Wallet className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block leading-none">موجودی کیف پول:</span>
                <span className="font-bold text-white text-xs">{user.walletBalance.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">تومان</span></span>
              </div>
              <Plus className="w-3.5 h-3.5 text-amber-400 mr-1" />
            </button>

            {/* Admin Switcher */}
            {user.role === 'admin' && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ورود به پنل مدیریت</span>
              </button>
            )}

            {/* New Book Action */}
            <button
              onClick={onOpenNewBook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت کتاب جدید</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="خروج از حساب"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Active Background Jobs Banner (Cloud Processing Guarantee) */}
        {activeJobs.length > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">ترجمه ابری در پس‌زمینه سرور در حال انجام است</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      پایدار و مستقل از مرورگر
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    می‌توانید با خیال آسوده این پنجره را ببندید یا دستگاه را خاموش کنید؛ ترجمه مستقیماً در پایگاه داده سرور ذخیره می‌شود.
                  </p>
                </div>
              </div>

              <button
                onClick={onRefresh}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                بروزرسانی وضعیت
              </button>
            </div>

            {/* List active jobs progress bars */}
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-800/80">
              {activeJobs.map((job) => {
                const book = books.find((b) => b.id === job.bookId);
                return (
                  <div key={job.id} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-amber-300">
                        کتاب: «{book?.title || 'در حال ترجمه'}»
                        {job.currentChunkTitle && <span className="text-slate-400 font-normal mr-2">({job.currentChunkTitle})</span>}
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{job.progressPercent}% ({job.completedChunks} از {job.totalChunks} بخش)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 rounded-full"
                        style={{ width: `${Math.max(5, job.progressPercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              کتاب‌های من
            </div>
            <div className="text-2xl font-black text-white">{totalBooks}</div>
            <div className="text-[11px] text-slate-500 mt-1">{completedBooksCount} کتاب به پایان رسیده</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              کلمات ترجمه‌شده
            </div>
            <div className="text-2xl font-black text-amber-400">{totalWordsTranslated.toLocaleString('fa-IR')}</div>
            <div className="text-[11px] text-slate-500 mt-1">کلمه با کیفیت ادبی و فصیح</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              پردازش فعال در سرور
            </div>
            <div className="text-2xl font-black text-white">{activeJobs.length}</div>
            <div className="text-[11px] text-emerald-400/90 mt-1">پیوسته در پس‌زمینه ابری</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-400" />
                موجودی کیف پول
              </div>
              <div className="text-2xl font-black text-white">{user.walletBalance.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">تومان</span></div>
            </div>
            <button
              onClick={onOpenWallet}
              className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>شارژ و افزایش اعتبار</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Books Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>کتابخانه و پروژه‌های من</span>
              <span className="text-xs text-slate-400 font-normal">({filteredBooks.length} کتاب)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">مشاهده وضعیت ترجمه، ویرایش متن، یا دانلود با خروجی‌های Word و PDF</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              همه ({books.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'completed' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              پایان‌یافته ({completedBooksCount})
            </button>
            <button
              onClick={() => setFilter('translating')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'translating' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              در حال ترجمه
            </button>
          </div>
        </div>

        {/* Empty State */}
        {books.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">هنوز هیچ کتابی ثبت نکرده‌اید!</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              کتاب انگلیسی خود را در هر فرمتی (PDF، Word، EPUB یا TXT) بارگذاری نمایید. سیستم تعداد کلمات را می‌سنجد و ترجمه را به صورت ابری شروع می‌کند.
            </p>
            <button
              onClick={onOpenNewBook}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>بارگذاری و شروع اولین کتاب</span>
            </button>
          </div>
        ) : (
          /* Books Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const totalChunks = book.chunks?.length || 0;
              const completedChunks = book.chunks?.filter((c) => c.status === 'completed').length || 0;
              const isAllDone = totalChunks > 0 && completedChunks === totalChunks;
              const isTranslating = activeJobs.some((j) => j.bookId === book.id) || book.chunks?.some((c) => c.status === 'translating' || c.status === 'queued');
              const percent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

              return (
                <div
                  key={book.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg"
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-slate-700/80">
                        {getToneLabel(book.tone)}
                      </span>
                      {isAllDone ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          پایان یافته
                        </span>
                      ) : isTranslating ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          در حال ترجمه ({percent}٪)
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          پیش‌نویس
                        </span>
                      )}
                    </div>

                    {/* Book Titles */}
                    <h3 className="font-bold text-base text-white line-clamp-1 mb-1 group-hover:text-amber-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-3 font-serif" dir="ltr">
                      {book.originalTitle || book.title}
                    </p>

                    {/* Book Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                      <div>
                        <span className="text-slate-500 block">نویسنده:</span>
                        <span className="text-slate-300 font-medium truncate block">{book.author || 'نامشخص'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">تعداد کلمات:</span>
                        <span className="text-amber-400 font-bold block">
                          {(book.chunks?.reduce((acc, c) => acc + (c.wordCount || 0), 0) || 0).toLocaleString('fa-IR')} کلمه
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">تعداد بخش‌ها:</span>
                        <span className="text-slate-300 font-medium block">{completedChunks} از {totalChunks} فصل</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">تصاویر کتاب:</span>
                        <span className="text-slate-300 font-medium block">{book.totalImagesCount || 0} تصویر</span>
                      </div>
                    </div>

                    {/* Mini Progress */}
                    {totalChunks > 0 && (
                      <div className="mb-4">
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isAllDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>مشاهده و ویرایش کتاب</span>
                      </button>

                      <button
                        onClick={() => onDeleteBook(book.id)}
                        title="حذف کتاب"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Exports Row */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => onExportDocx(book)}
                        className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 flex items-center justify-center gap-1 transition-colors"
                        title="دانلود خروجی Word استاندارد"
                      >
                        <Download className="w-3 h-3 text-blue-400" />
                        <span>Word</span>
                      </button>
                      <button
                        onClick={() => onExportPdf(book)}
                        className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 flex items-center justify-center gap-1 transition-colors"
                        title="دانلود خروجی PDF صفحه‌آرایی شده"
                      >
                        <Download className="w-3 h-3 text-rose-400" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => onExportEpub(book)}
                        className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 flex items-center justify-center gap-1 transition-colors"
                        title="دانلود فایل EPUB برای کتاب‌خوان‌ها"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>EPUB</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
