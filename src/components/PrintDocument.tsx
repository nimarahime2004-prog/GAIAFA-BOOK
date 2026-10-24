import { BookProject } from '../types.ts';
import { BOOK_THEMES, DEFAULT_DESIGN_CONFIG } from '../constants/themes.ts';
import { groupChunksIntoChapters } from '../utils/exporter.ts';

interface PrintDocumentProps {
  project: BookProject;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({ project }) => {
  const design = project.designConfig || DEFAULT_DESIGN_CONFIG;
  const theme = BOOK_THEMES[design.themeId] || BOOK_THEMES.spiritual;

  const fontSizeClass =
    design.fontSize === 'small'
      ? 'text-[11pt]'
      : design.fontSize === 'large'
      ? 'text-[14pt]'
      : 'text-[12pt]';

  const lineSpacingStyle =
    design.lineSpacing === 'compact'
      ? '1.65'
      : design.lineSpacing === 'relaxed'
      ? '2.25'
      : '1.95';

  const fontFamily = design.fontFamily || 'Vazirmatn Medium';

  const showRunningHeader = design.showHeader && Boolean(design.headerText?.trim());
  const showRunningFooter = design.showFooter && (Boolean(design.footerText?.trim()) || design.showPageNumbers);

  const marginPadding =
    design.pageMargin === 'compact'
      ? 'px-8 sm:px-10'
      : design.pageMargin === 'generous'
      ? 'px-14 sm:px-20'
      : 'px-10 sm:px-14';

  return (
    <div
      className="print-only hidden min-h-screen text-right relative"
      style={{
        backgroundColor: theme.pageBgColor,
        color: theme.textColor,
        fontFamily: `'${fontFamily}', 'Vazirmatn', 'B Nazanin', 'Tahoma', sans-serif`,
        direction: 'rtl',
      }}
    >
      {/* Optional Watermark Text across printed pages */}
      {design.watermarkText?.trim() && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center select-none z-0 overflow-hidden opacity-[0.06]">
          <div
            className="transform -rotate-45 text-5xl sm:text-7xl font-bold tracking-widest whitespace-nowrap"
            style={{ color: theme.headingColor }}
          >
            {design.watermarkText}
          </div>
        </div>
      )}

      {/* Subtle Spiritual / Arabesque Motif Background for Print */}
      {design.backgroundPattern === 'arabesque' && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-0 flex items-center justify-center">
          <svg width="600" height="600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
            <circle cx="50" cy="50" r="45" />
            <circle cx="50" cy="50" r="35" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="25" />
            <polygon points="50,5 63,38 95,50 63,62 50,95 37,62 5,50 37,38" />
            <polygon points="50,15 60,40 85,50 60,60 50,85 40,60 15,50 40,40" strokeDasharray="1 1" />
          </svg>
        </div>
      )}

      {design.backgroundPattern === 'geometry' && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-0 flex items-center justify-center">
          <svg width="600" height="600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
            <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" />
            <rect x="15" y="15" width="70" height="70" />
            <circle cx="50" cy="50" r="35" />
            <circle cx="50" cy="50" r="20" strokeDasharray="1 1" />
          </svg>
        </div>
      )}

      {/* Running Header & Footer are managed via CSS print table structure so they never overlap content */}
      <table className="w-full border-collapse print-doc-table">
        {showRunningHeader && (
          <thead className="print-table-header">
            <tr>
              <th className="font-normal text-right p-0 border-b" style={{ borderColor: theme.borderColor }}>
                <div
                  className="h-12 px-8 flex items-center justify-between text-[9pt]"
                  style={{
                    backgroundColor: theme.pageBgColor,
                    color: theme.textColor,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{design.headerText || project.title}</span>
                    {design.websiteUrl && (
                      <span className="opacity-70 text-[8pt] font-mono" dir="ltr">
                        • {design.websiteUrl}
                      </span>
                    )}
                  </div>
                  <span className="text-[8.5pt] opacity-75 font-medium">
                    {project.title}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
        )}

        {showRunningFooter && (
          <tfoot className="print-table-footer">
            <tr>
              <td className="p-0 border-t" style={{ borderColor: theme.borderColor }}>
                <div
                  className="h-12 px-8 flex items-center justify-between text-[9pt]"
                  style={{
                    backgroundColor: theme.pageBgColor,
                    color: theme.textColor,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{design.footerText || 'سامانه هوشمند ترجمه و چاپ کتاب'}</span>
                    {design.brandName && (
                      <span className="opacity-70 font-semibold">• {design.brandName}</span>
                    )}
                  </div>
                  {design.showPageNumbers && (
                    <span className="font-bold font-mono text-[8.5pt]">
                      صفحه چاپی
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tfoot>
        )}

        <tbody className="print-table-body">
          <tr>
            <td className={`p-0 ${marginPadding} py-6`}>
              {/* Cover Page */}
        {design.showCoverPage && (
          <div className="book-chapter-break min-h-[85vh] flex flex-col items-center justify-center text-center py-20 my-auto">
            {/* Top Ornamental Frame */}
            <div
              className="text-3xl font-serif mb-6 opacity-85"
              style={{ color: theme.accentColor }}
            >
              {theme.dividerSymbol}
            </div>

            {/* Book Title with Theme Heading Color */}
            <h1
              className="text-4xl font-extrabold mb-4 tracking-tight leading-snug max-w-2xl"
              style={{ color: theme.headingColor }}
            >
              {project.title || project.originalTitle}
            </h1>

            {project.originalTitle && (
              <h2 className="text-xl font-normal opacity-75 mb-6 font-serif" dir="ltr">
                {project.originalTitle}
              </h2>
            )}

            {/* Decorative Divider */}
            <div
              className="w-36 h-1.5 rounded-full my-6 opacity-80"
              style={{ backgroundColor: theme.accentColor }}
            />

            <div className="space-y-2.5 text-base font-medium opacity-90 my-8">
              {project.author && (
                <p>
                  نویسنده: <strong style={{ color: theme.headingColor }}>{project.author}</strong>
                </p>
              )}
              {project.translator && (
                <p>
                  ترجمه و ویرایش: <strong>{project.translator}</strong>
                </p>
              )}
              {design.brandName && (
                <p className="text-sm font-semibold opacity-80 pt-1">
                  انتشارات / ناشر: {design.brandName}
                </p>
              )}
              {design.websiteUrl && (
                <p className="text-sm opacity-80 font-mono tracking-wider pt-1" dir="ltr">
                  {design.websiteUrl}
                </p>
              )}
            </div>

            {/* Bottom Theme Tagline & Font Info */}
            <div
              className="mt-auto pt-8 border-t w-full max-w-sm text-xs opacity-70 flex items-center justify-between"
              style={{ borderColor: theme.borderColor }}
            >
              <span>طرح دیزاین: {theme.name}</span>
              <span>قلم: {fontFamily}</span>
            </div>
          </div>
        )}

        {/* Chapters Content */}
        <div className="space-y-12">
          {groupChunksIntoChapters(project.chunks).map((chapter, idx, allChapters) => (
            <div
              key={chapter.chapterKey}
              className={`book-chapter-break pt-6 ${
                design.borderStyle === 'ornate_spiritual'
                  ? 'p-6 rounded-2xl border-2 border-double my-6'
                  : design.borderStyle === 'double_classic'
                  ? 'p-6 rounded-xl border-4 border-double my-6'
                  : design.borderStyle === 'thin_modern'
                  ? 'p-6 rounded-xl border my-6'
                  : ''
              }`}
              style={{
                lineHeight: lineSpacingStyle,
                borderColor: theme.borderColor,
              }}
            >
              {/* Chapter Header (Rendered ONCE per chapter) */}
              <div className="text-center mb-8 space-y-2">
                <h2
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: theme.headingColor }}
                >
                  {chapter.title}
                </h2>
                <div
                  className="text-sm font-serif opacity-80"
                  style={{ color: theme.accentColor }}
                >
                  {theme.dividerSymbol}
                </div>
              </div>

              {/* Continuous Chapter Body with Preserved Colors & Highlights */}
              <div
                className={`book-render-content ${fontSizeClass} text-justify`}
                style={{
                  lineHeight: lineSpacingStyle,
                }}
                dangerouslySetInnerHTML={{ __html: chapter.htmlContent }}
              />

              {/* Section Separator */}
              {idx < allChapters.length - 1 && (
                <div
                  className="text-center my-10 text-sm opacity-60"
                  style={{ color: theme.accentColor }}
                >
                  {theme.dividerSymbol}
                </div>
              )}
            </div>
          ))}
        </div>
      </td>
    </tr>
  </tbody>
</table>
    </div>
  );
};
