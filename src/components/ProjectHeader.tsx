import {
  Book,
  Sparkles,
  BookMarked,
  CheckCircle,
  Clock,
  Settings,
  Languages,
  PenLine,
  Calculator,
  ShieldCheck,
  Palette
} from 'lucide-react';
import { BookProject, ToneId } from '../types.ts';
import { TONE_DEFINITIONS } from '../constants/tones.ts';

interface ProjectHeaderProps {
  project: BookProject;
  onUpdateProject: (updates: Partial<BookProject>) => void;
  onOpenGlossaryModal: () => void;
  onOpenTokenModal: () => void;
  onOpenExportModal?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onUpdateProject,
  onOpenGlossaryModal,
  onOpenTokenModal,
  onOpenExportModal,
}) => {
  const currentTone = TONE_DEFINITIONS.find(t => t.id === project?.tone) || TONE_DEFINITIONS[0];

  const chunks = project?.chunks || [];
  const glossary = project?.glossary || [];

  const totalWords = chunks.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  const completedChunks = chunks.filter(c => c.translatedHtml && c.translatedHtml.trim().length > 0);
  const completedWords = completedChunks.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  const progressPercent = totalWords > 0 ? Math.round((completedWords / totalWords) * 100) : 0;

  return (
    <div className="no-print bg-slate-800/80 border-b border-slate-700/80 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Book Information */}
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              کتاب در حال ترجمه
            </span>
            <input
              type="text"
              value={project.title}
              onChange={e => onUpdateProject({ title: e.target.value })}
              className="font-bold text-lg sm:text-xl text-white bg-transparent hover:bg-slate-700/50 focus:bg-slate-700/70 px-2 py-0.5 rounded-lg border border-transparent focus:border-blue-500 transition outline-none w-auto max-w-md"
              placeholder="عنوان فارسی کتاب"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>نام اصلی:</span>
              <input
                type="text"
                value={project.originalTitle}
                onChange={e => onUpdateProject({ originalTitle: e.target.value })}
                className="text-slate-200 bg-transparent hover:bg-slate-700/50 focus:bg-slate-700 px-1.5 py-0.5 rounded border border-transparent focus:border-slate-600 outline-none"
                placeholder="English Title"
              />
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>نویسنده:</span>
              <input
                type="text"
                value={project.author}
                onChange={e => onUpdateProject({ author: e.target.value })}
                className="text-slate-200 bg-transparent hover:bg-slate-700/50 focus:bg-slate-700 px-1.5 py-0.5 rounded border border-transparent focus:border-slate-600 outline-none"
                placeholder="Author Name"
              />
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>مترجم:</span>
              <input
                type="text"
                value={project.translator}
                onChange={e => onUpdateProject({ translator: e.target.value })}
                className="text-slate-200 bg-transparent hover:bg-slate-700/50 focus:bg-slate-700 px-1.5 py-0.5 rounded border border-transparent focus:border-slate-600 outline-none"
                placeholder="نام مترجم / تیم ویراستاری"
              />
            </div>
          </div>
        </div>

        {/* Tone & Calculators */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400 hidden sm:inline">لحن:</span>
            <select
              value={project.tone}
              onChange={e => onUpdateProject({ tone: e.target.value as ToneId })}
              className="bg-slate-800 text-xs text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {TONE_DEFINITIONS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Glossary Manager Trigger */}
          <button
            onClick={onOpenGlossaryModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-indigo-500/50 transition group"
          >
            <BookMarked className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition" />
            <span>واژه‌نامه</span>
            <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {glossary.length}
            </span>
          </button>

          {/* Book Design & Export Studio Trigger */}
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition shadow-sm"
              title="تنظیم هدر، فوتر، آدرس سایت، تم معنوی و خروجی PDF / Word"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>دیزاین و خروجی کتاب</span>
            </button>
          )}
        </div>

      </div>

      {/* Progress & Policies Bar */}
      <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>پیشرفت:</span>
            <strong className="text-white font-mono">{completedChunks.length}</strong>
            <span>از</span>
            <strong className="text-white font-mono">{chunks.length} بخش</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>کلمات:</span>
            <strong className="text-white font-mono">{completedWords.toLocaleString('fa-IR')}</strong>
            <span>از</span>
            <strong className="text-white font-mono">{totalWords.toLocaleString('fa-IR')}</strong>
          </div>
          <div className="hidden md:flex items-center gap-1 text-emerald-400/90 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>بدون خلاصه‌سازی • بدون سانسور متن کتاب</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
          <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400 min-w-[3rem] text-left">
            {progressPercent}٪
          </span>
        </div>

      </div>
    </div>
  );
};
