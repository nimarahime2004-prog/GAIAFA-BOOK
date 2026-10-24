import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  ImageRun,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { BookProject, BookChunk } from '../types.ts';
import { BOOK_THEMES } from '../constants/themes.ts';
import { resolveApiUrl } from './aiClient.ts';

/**
 * Clean chapter titles by removing artificial chunk suffixes like:
 * "(بخش 1)", "(بخش ۱)", "- بخش 1", "بخش 1", "[Part 1]", "(Part 1)", etc.
 */
export function cleanChapterTitle(title: string): string {
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

/**
 * Removes any artificial chunk headers injected by AI models into HTML
 */
export function sanitizeTranslatedHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h[1-3][^>]*>\s*مقدمه و بخش نخست\s*(?:\([^\)]*\))?\s*<\/h[1-3]>/gi, '')
    .replace(/<h[1-3][^>]*>[^<]*[\(\[\{]\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}][^<]*<\/h[1-3]>/gi, '')
    .replace(/<p[^>]*>\s*[\(\[\{]?\s*بخش\s*[0-9۰-۹IVXLCDMivxlcdm]+\s*[\)\]\}]?\s*<\/p>/gi, '')
    .trim();
}

/**
 * Converts formatted book HTML to clean plain text for easy manual editing.
 * Strips HTML markup while preserving paragraph breaks, headings, and quotes.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  let clean = html;

  // Preserve image slots
  clean = clean.replace(/<div[^>]*class="[^"]*book-illustration-wrap[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '\n[[تصویر کتاب]]\n');
  clean = clean.replace(/<img[^>]*>/gi, '\n[[تصویر کتاب]]\n');

  // Replace block closures with double newlines
  clean = clean.replace(/<\/(p|h1|h2|h3|h4|blockquote|div)>/gi, '\n\n');
  clean = clean.replace(/<br\s*[\/]?>/gi, '\n');

  // Strip all other HTML tags
  clean = clean.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwnj;/g, '\u200c')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize excessive newlines (maximum 2 consecutive newlines)
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  return clean;
}

/**
 * Converts manually edited plain text back into standard publication-grade book HTML.
 * Formats paragraphs, detects headings, blockquotes, and restores preserved images.
 */
export function plainTextToHtml(plainText: string, originalHtml?: string): string {
  if (!plainText || !plainText.trim()) return '';

  // Extract any original high-res image blocks from originalHtml to prevent losing images
  const originalImages: string[] = [];
  if (originalHtml) {
    const imgMatches = originalHtml.match(/<div[^>]*class="[^"]*book-illustration-wrap[^"]*"[^>]*>[\s\S]*?<\/div>|<img[^>]*src=["']data:[^"']+["'][^>]*>/gi);
    if (imgMatches) {
      originalImages.push(...imgMatches);
    }
  }

  const blocks = plainText
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  let imageIndex = 0;
  const htmlParts: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Check if block represents an image slot
    if (block.includes('[[تصویر کتاب]]') || block.includes('[[IMAGE_PRESERVED_SLOT_')) {
      if (imageIndex < originalImages.length) {
        htmlParts.push(originalImages[imageIndex]);
        imageIndex++;
      }
      continue;
    }

    // Markdown-style Heading 1 or first block if it's very short and looks like a chapter header
    if (block.startsWith('# ')) {
      const headingText = block.replace(/^#\s*/, '').trim();
      htmlParts.push(`<h1 style="color: #1a365d; font-size: 24pt; margin-bottom: 20px; text-align: center;">${headingText}</h1>`);
    } else if (block.startsWith('## ')) {
      const headingText = block.replace(/^##\s*/, '').trim();
      htmlParts.push(`<h2 style="color: #2b6cb0; font-size: 18pt; margin-top: 25px; margin-bottom: 12px;">${headingText}</h2>`);
    } else if (block.startsWith('### ')) {
      const headingText = block.replace(/^###\s*/, '').trim();
      htmlParts.push(`<h3 style="color: #2c5282; font-size: 14pt; margin-top: 15px; margin-bottom: 8px;">${headingText}</h3>`);
    } else if (block.startsWith('> ') || block.startsWith('«')) {
      const quoteText = block.replace(/^>\s*/, '').trim();
      htmlParts.push(`<blockquote style="border-right: 4px solid #3182ce; padding: 10px 18px; margin: 15px 0; background: #f7fafc; color: #4a5568; font-style: italic;">${quoteText}</blockquote>`);
    } else {
      // Standard publication body paragraph
      // Replace single line breaks with <br/> inside paragraphs
      const pContent = block.replace(/\n/g, '<br/>');
      htmlParts.push(`<p style="line-height: 1.9; font-size: 12pt; text-align: justify; margin-bottom: 14px;">${pContent}</p>`);
    }
  }

  // If there are remaining images not consumed, append them cleanly
  while (imageIndex < originalImages.length) {
    htmlParts.push(originalImages[imageIndex]);
    imageIndex++;
  }

  return htmlParts.join('\n');
}

export interface GroupedChapter {
  chapterKey: string;
  title: string;
  htmlContent: string;
}

/**
 * Groups consecutive chunks belonging to the same chapter into one continuous chapter flow.
 * Ensures the chapter title is displayed only ONCE and sub-chunks flow seamlessly without repeating headers or mid-chapter page breaks.
 */
export function groupChunksIntoChapters(chunks: BookChunk[]): GroupedChapter[] {
  const validChunks = (chunks || []).filter(c => c && c.translatedHtml && c.translatedHtml.trim().length > 0);
  if (validChunks.length === 0) return [];

  const chapters: GroupedChapter[] = [];
  let currentChapter: GroupedChapter | null = null;

  for (const chunk of validChunks) {
    const rawTitle = chunk.chapterTitle || 'فصل کتاب';
    const cleanedTitle = cleanChapterTitle(rawTitle);
    const sanitizedChunkHtml = sanitizeTranslatedHtml(chunk.translatedHtml || '');
    if (!sanitizedChunkHtml) continue;

    const chapterKey = chunk.chapterNumber ? `ch_${chunk.chapterNumber}` : cleanedTitle;

    if (!currentChapter || currentChapter.chapterKey !== chapterKey) {
      currentChapter = {
        chapterKey,
        title: cleanedTitle,
        htmlContent: sanitizedChunkHtml,
      };
      chapters.push(currentChapter);
    } else {
      currentChapter.htmlContent += `\n${sanitizedChunkHtml}`;
    }
  }

  return chapters;
}

/**
 * Standardize font names for Microsoft Word.
 * Removes suffixes like "Medium", "Bold" so Word matches the exact Windows font family registry name.
 */
export function cleanFontFamily(fontName: string = 'Vazirmatn'): string {
  if (!fontName) return 'Vazirmatn';
  const cleaned = fontName.replace(/\s+(Medium|Regular|Bold|Light|SemiBold|Black)$/i, '').trim();
  return cleaned || 'Vazirmatn';
}

/**
 * Generates Word multi-script font definition with Complex Script (cs) support.
 * For Persian & Arabic, Word relies strictly on w:cs font mapping.
 */
export function createFontDef(fontName: string = 'Vazirmatn') {
  const family = cleanFontFamily(fontName);
  return {
    name: family,
    cs: family,       // Complex Script for Persian characters
    ascii: family,    // Latin text, numbers, punctuation
    hAnsi: family,
    eastAsia: family,
  };
}

/**
 * Convert base64 data URL to Uint8Array for docx ImageRun in browser.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parse HTML content into styled TextRun objects preserving color highlights and weights.
 */
export function parseHtmlToTextRuns(html: string, fontName: string = 'Vazirmatn'): TextRun[] {
  const runs: TextRun[] = [];
  const fontDef = createFontDef(fontName);

  const regex = /<span style="[^"]*#9b2c2c[^"]*"[^>]*>([\s\S]*?)<\/span>|<b[^>]*>([\s\S]*?)<\/b>|<strong[^>]*>([\s\S]*?)<\/strong>|<i[^>]*>([\s\S]*?)<\/i>|<em[^>]*>([\s\S]*?)<\/em>|([^<]+)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      // Highlighted glossary term (Bold Crimson)
      runs.push(
        new TextRun({
          text: match[1].replace(/<[^>]+>/g, ''),
          font: fontDef,
          size: 24, // 12pt
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

/**
 * Builds a complete Word (.docx) document object with Persian typography and RTL formatting.
 */
export function buildClientDocxDocument(project: BookProject): Document {
  const design = project.designConfig || {
    themeId: 'spiritual',
    headerText: '',
    footerText: '',
    showHeader: false,
    showFooter: false,
    showPageNumbers: true,
    fontFamily: 'Vazirmatn',
  };

  const fontFamily = cleanFontFamily(design.fontFamily || 'Vazirmatn');
  const fontDef = createFontDef(fontFamily);

  const showHeader = design.showHeader === true && Boolean(design.headerText?.trim());
  const headerText = showHeader ? (design.headerText?.trim() || '') : '';

  const showFooter = design.showFooter === true && Boolean(design.footerText?.trim());
  const footerText = showFooter ? (design.footerText?.trim() || '') : '';
  const showPageNumbers = design.showPageNumbers !== false;

  const docChildren: Paragraph[] = [];

  // Title Page
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 },
      bidirectional: true,
      children: [
        new TextRun({
          text: project.title || project.originalTitle || 'کتاب ترجمه شده',
          font: fontDef,
          size: 48, // 24pt
          bold: true,
          color: '1A365D',
          rightToLeft: true,
        }),
      ],
    })
  );

  if (project.author) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        bidirectional: true,
        children: [
          new TextRun({
            text: `نویسنده: ${project.author}`,
            font: fontDef,
            size: 26, // 13pt
            color: '4A5568',
            rightToLeft: true,
          }),
        ],
      })
    );
  }

  if (project.translator) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 1200 },
        bidirectional: true,
        children: [
          new TextRun({
            text: `ترجمه و ویرایش: ${project.translator}`,
            font: fontDef,
            size: 24, // 12pt
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

  // Chapters & paragraphs grouped seamlessly by genuine chapter
  const groupedChapters = groupChunksIntoChapters(project.chunks);

  groupedChapters.forEach((ch, chIdx) => {
    if (chIdx > 0) {
      docChildren.push(new Paragraph({ pageBreakBefore: true }));
    }

    // Chapter Header (Rendered ONCE per chapter)
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

    const html = ch.htmlContent || '';
    const blockRegex = /<(h[1-3]|p|blockquote|div|figure)[^>]*>([\s\S]*?)<\/\1>|<img\s+[^>]*src=["'](data:image\/[^"']+)["'][^>]*>/gi;
    let match;
    let foundAny = false;

    while ((match = blockRegex.exec(html)) !== null) {
      foundAny = true;

      // Standalone Image
      if (match[3]) {
        const dataUrl = match[3];
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx !== -1) {
          try {
            const base64Data = dataUrl.slice(commaIdx + 1).replace(/\s+/g, '');
            const imgBuffer = base64ToUint8Array(base64Data);
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

      // Embedded image within block
      const embeddedImgRegex = /<img\s+[^>]*src=["'](data:image\/[^"']+)["'][^>]*>/gi;
      let imgMatch;
      while ((imgMatch = embeddedImgRegex.exec(innerHtml)) !== null) {
        try {
          const dataUrl = imgMatch[1];
          const commaIdx = dataUrl.indexOf(',');
          if (commaIdx !== -1) {
            const base64Data = dataUrl.slice(commaIdx + 1).replace(/\s+/g, '');
            const imgBuffer = base64ToUint8Array(base64Data);
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
        // Standard Persian Paragraph
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.BOTH, // Justified
            spacing: { line: 360, before: 100, after: 200 },
            bidirectional: true,
            children: parseHtmlToTextRuns(innerHtml, fontFamily),
          })
        );
      }
    }

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

  const themeKey = (design.themeId || 'spiritual') as keyof typeof BOOK_THEMES;
  const theme = BOOK_THEMES[themeKey] || BOOK_THEMES.spiritual;

  return new Document({
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
              top: 1440,
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
}

/**
 * Downloads high-fidelity Persian DOCX file.
 * Prioritizes direct in-browser creation for speed and offline/static server resilience,
 * falling back to backend /api/export/docx and Word-HTML if necessary.
 */
export async function downloadDocx(project: BookProject): Promise<boolean> {
  const chapters = project.chunks
    .filter(c => c.translatedHtml && c.translatedHtml.trim().length > 0);

  if (chapters.length === 0) {
    alert('هیچ بخشی هنوز ترجمه نشده است.');
    return false;
  }

  try {
    // 1. Direct browser compilation via docx library
    const doc = buildClientDocxDocument(project);
    const blob = await Packer.toBlob(doc);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || project.originalTitle || 'book-translated'}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (clientErr: any) {
    console.warn('Direct client DOCX build error, trying backend endpoint...', clientErr);

    // 2. Server proxy fallback
    try {
      const groupedChapters = groupChunksIntoChapters(project.chunks);
      const res = await fetch(resolveApiUrl('/api/export/docx'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title || project.originalTitle || 'کتاب ترجمه شده',
          author: project.author,
          translator: project.translator || 'سامانه هوشمند ترجمه کتاب',
          chapters: groupedChapters.map(ch => ({
            title: ch.title,
            htmlContent: ch.htmlContent,
          })),
          designConfig: project.designConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(`خطای سرور: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('سرور صفحه وب HTML بازگرداند.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || project.originalTitle || 'book-translated'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (serverErr: any) {
      console.error('Docx download error, falling back to Word-HTML format:', serverErr);
      downloadWordHtml(project);
      return true;
    }
  }
}

/**
 * Downloads Word-compatible HTML format (.doc) with extensive Microsoft Word bidi styling.
 */
export function downloadWordHtml(project: BookProject) {
  const design = project.designConfig || {
    themeId: 'spiritual',
    headerText: '',
    footerText: '',
    showHeader: false,
    showFooter: false,
    showPageNumbers: true,
    fontFamily: 'Vazirmatn',
  };

  const fontFamily = cleanFontFamily(design.fontFamily || 'Vazirmatn');
  const theme = BOOK_THEMES[design.themeId] || BOOK_THEMES.spiritual;
  const bgColor = theme.pageBgColor || '#fbf6ea';
  const headingColor = theme.headingColor || '#1a365d';
  const accentColor = theme.accentColor || '#b45309';

  const groupedChapters = groupChunksIntoChapters(project.chunks);

  const chaptersHtml = groupedChapters
    .map((ch, idx) => `
      <div style="${idx > 0 ? 'page-break-before: always; ' : ''}margin-top: 30px;">
        ${design.showHeader && design.headerText ? `
        <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 24px; font-size: 9pt; color: #718096; display: flex; justify-content: space-between;">
          <span>${design.headerText}</span>
          <span dir="ltr">${project.originalTitle || ''}</span>
        </div>` : ''}
        <h2 style="color: ${headingColor}; font-size: 18pt; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-family: '${fontFamily}', 'Vazirmatn', 'B Nazanin', 'Tahoma', sans-serif; mso-bidi-font-family: '${fontFamily}';">${ch.title}</h2>
        <div style="text-align: center; font-size: 11pt; color: ${accentColor}; margin: 8px 0 16px 0;">${theme.dividerSymbol || '❦ ✤ ❦'}</div>
        <div style="margin-top: 20px;">${ch.htmlContent}</div>
        ${design.showFooter && design.footerText ? `
        <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 35px; font-size: 9pt; color: #718096; text-align: center;">
          ${design.footerText}
        </div>` : ''}
      </div>
    `)
    .join('\n');

  const fullWordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${project.title}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap');
      body {
        font-family: '${fontFamily}', 'Vazirmatn', 'B Nazanin', 'B Mitra', 'IRANSans', 'Tahoma', 'Arial', sans-serif;
        mso-ascii-font-family: '${fontFamily}';
        mso-hansi-font-family: '${fontFamily}';
        mso-bidi-font-family: '${fontFamily}';
        direction: rtl;
        text-align: right;
        margin: 40px;
        background-color: ${bgColor};
        color: #2d3748;
      }
      p, div, span, h1, h2, h3, blockquote {
        font-family: '${fontFamily}', 'Vazirmatn', 'B Nazanin', 'B Mitra', 'Tahoma', sans-serif;
        mso-bidi-font-family: '${fontFamily}';
        mso-ascii-font-family: '${fontFamily}';
      }
      h1 { color: ${headingColor}; font-size: 24pt; margin-bottom: 20px; text-align: center; }
      h2 { color: #2b6cb0; font-size: 18pt; margin-top: 25px; margin-bottom: 12px; }
      h3 { color: #2c5282; font-size: 14pt; margin-top: 15px; margin-bottom: 8px; }
      p { line-height: 1.9; font-size: 12pt; text-align: justify; margin-bottom: 14px; }
      blockquote { border-right: 4px solid #3182ce; padding: 10px 18px; margin: 15px 0; background: #f7fafc; color: #4a5568; font-style: italic; }
      span.highlight { color: #9b2c2c; font-weight: bold; }
      img, .book-embedded-image { max-width: 85%; height: auto; display: block; margin: 18px auto; border-radius: 8px; }
      .book-illustration-wrap { text-align: center; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div style="text-align: center; margin-top: 80px; margin-bottom: 100px;">
      <h1>${project.title || project.originalTitle}</h1>
      <p style="font-size: 14pt; color: #4a5568;">نویسنده: ${project.author || 'نامشخص'}</p>
      <p style="font-size: 12pt; color: #718096; font-style: italic;">مترجم: ${project.translator || 'سامانه هوشمند ترجمه کتاب'}</p>
      ${design.showHeader && design.headerText ? `<p style="font-size: 11pt; color: #a0aec0; margin-top: 15px;">${design.headerText}</p>` : ''}
    </div>
    ${chaptersHtml}
  </body>
  </html>`;

  const blob = new Blob(['\ufeff', fullWordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || project.originalTitle || 'book-translated'}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadStyledHtml(project: BookProject) {
  const groupedChapters = groupChunksIntoChapters(project.chunks);
  const content = groupedChapters
    .map(ch => `
      <section class="chapter-section" style="margin-bottom: 50px; border-bottom: 1px solid #e2e8f0; padding-bottom: 30px;">
        <h2 class="chapter-title" style="color: #1a365d; font-size: 20pt; text-align: center; margin-bottom: 25px;">${ch.title}</h2>
        ${ch.htmlContent}
      </section>
    `)
    .join('\n');

  const htmlDoc = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${project.title || project.originalTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Vazirmatn', sans-serif;
      direction: rtl;
      text-align: right;
      background: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 40px 20px;
    }
    .book-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 60px 50px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .book-header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 40px;
      margin-bottom: 50px;
    }
    h1 { color: #1a365d; font-size: 26pt; margin-bottom: 15px; }
    h2 { color: #2b6cb0; font-size: 18pt; margin-top: 25px; margin-bottom: 12px; }
    h3 { color: #2c5282; font-size: 14pt; margin-top: 15px; margin-bottom: 8px; }
    p { line-height: 1.95; font-size: 12.5pt; text-align: justify; margin-bottom: 16px; color: #334155; }
    blockquote { border-right: 4px solid #3182ce; padding: 12px 20px; margin: 18px 0; background: #f0f7ff; color: #1e293b; font-style: italic; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="book-container">
    <div class="book-header">
      <h1>${project.title || project.originalTitle}</h1>
      <p style="font-size: 16px; color: #64748b; margin: 8px 0;">نویسنده: ${project.author || 'نامشخص'}</p>
      <p style="font-size: 14px; color: #94a3b8; font-style: italic; margin: 5px 0;">مترجم: ${project.translator || 'سامانه هوشمند ترجمه کتاب'}</p>
    </div>
    <div class="book-content">
      ${content}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || project.originalTitle || 'book-translated'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPlainText(project: BookProject) {
  let plain = `# ${project.title || project.originalTitle}\n`;
  if (project.author) plain += `نویسنده: ${project.author}\n`;
  if (project.translator) plain += `مترجم: ${project.translator}\n`;
  plain += `\n=========================================\n\n`;

  const groupedChapters = groupChunksIntoChapters(project.chunks);
  groupedChapters.forEach(ch => {
    plain += `## ${ch.title}\n\n`;
    const textOnly = (ch.htmlContent || '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/blockquote>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    plain += `${textOnly}\n\n-----------------------------------------\n\n`;
  });

  const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || project.originalTitle || 'book-translated'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProjectJson(project: BookProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || project.originalTitle || 'project'}-backup.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
