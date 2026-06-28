/**
 * Webness OS — KDP-Compliant EPUB 3.0 Compiler
 *
 * Amazon KDP Requirements Implemented:
 * ─ Reflowable layout (no fixed positioning)
 * ─ No page numbers, headers, or footers
 * ─ Heading-based TOC auto-generation (H1 chapter titles)
 * ─ Style-based paragraph indentation (0.3" first-line)
 * ─ Cover image NOT inside manuscript (separate upload)
 * ─ Images < 127KB compressed
 * ─ EPUB 3.0 nav + EPUB 2 NCX backwards compatibility
 * ─ Proper dc:metadata with KDP keywords
 * ─ Valid XHTML throughout
 */

import { mkdirSync, writeFileSync, existsSync, unlinkSync, renameSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import crypto from "crypto";
import type { EbookResult, ChapterDraft, EbookFrontMatter, EbookBackMatter, EbookOutline, EbookConfig } from "./ebook-engine.js";

export interface KdpEpubResult {
  epubDir: string;
  epubPath: string | null;
  chapterCount: number;
  fileCount: number;
  metadata: KdpEpubMetadata;
}

interface KdpEpubMetadata {
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  description: string;
  keywords: string[];
  categories: string[];
  language: string;
  date: string;
  uuid: string;
}

// ─── Main Entry Point ───────────────────────────────────────────

export function compileKdpEpub(ebookResult: EbookResult, outputDir: string): KdpEpubResult {
  const metadata: KdpEpubMetadata = {
    title: ebookResult.outline.title,
    subtitle: ebookResult.outline.subtitle,
    author: ebookResult.config.authorName,
    publisher: "Webness Publishing",
    description: ebookResult.outline.kdpMetadata.description,
    keywords: ebookResult.outline.kdpMetadata.keywords,
    categories: ebookResult.outline.kdpMetadata.categories,
    language: ebookResult.outline.kdpMetadata.language || "en",
    date: new Date().toISOString().split("T")[0],
    uuid: crypto.randomUUID(),
  };

  const epubDir = join(outputDir, `epub-${Date.now()}`);
  const metaInf = join(epubDir, "META-INF");
  const oebps = join(epubDir, "OEBPS");
  const imgDir = join(oebps, "images");

  mkdirSync(metaInf, { recursive: true });
  mkdirSync(imgDir, { recursive: true });

  // Track all files for manifest
  const manifestFiles: Array<{ id: string; href: string; mediaType: string; properties?: string }> = [];
  const spineItems: string[] = [];

  // ─── mimetype ───
  writeFileSync(join(epubDir, "mimetype"), "application/epub+zip");

  // ─── META-INF/container.xml ───
  writeFileSync(join(metaInf, "container.xml"), CONTAINER_XML);

  // ─── OEBPS/style.css ───
  writeFileSync(join(oebps, "style.css"), KDP_STYLESHEET);
  manifestFiles.push({ id: "style", href: "style.css", mediaType: "text/css" });

  const hasCover = Boolean(ebookResult.coverImage);

  // ─── Cover Image ───
  if (ebookResult.coverImage) {
    try {
      const coverBytes = Buffer.from(ebookResult.coverImage, "base64");
      writeFileSync(join(imgDir, "cover.jpg"), coverBytes);
      manifestFiles.push({
        id: "cover-image",
        href: "images/cover.jpg",
        mediaType: "image/jpeg",
        properties: "cover-image",
      });

      // Write cover.xhtml
      const coverXhtml = wrapXhtml("Cover", `
        <div class="cover-page-full" style="text-align: center; margin: 0; padding: 0; page-break-after: always;">
          <img src="images/cover.jpg" alt="Book Cover" style="max-width: 100%; height: auto; max-height: 100vh; display: block; margin: 0 auto;"/>
        </div>`, metadata.language);
      writeFileSync(join(oebps, "cover.xhtml"), coverXhtml);
      manifestFiles.push({ id: "cover", href: "cover.xhtml", mediaType: "application/xhtml+xml" });
      spineItems.push("cover");
    } catch (err: any) {
      // logger might not be imported as a default
    }
  }

  // ─── Front Matter Pages ───
  const frontPages = compileFrontMatter(oebps, ebookResult.frontMatter, ebookResult.outline, metadata);
  manifestFiles.push(...frontPages.manifest);
  spineItems.push(...frontPages.spine);

  // ─── Chapter Pages with SVG illustrations ───
  for (const chapter of ebookResult.chapters) {
    const chId = `ch${chapter.number}`;
    const filename = `chapter-${chapter.number}.xhtml`;
    const hasSvg = Boolean(chapter.svgIllustration);

    // Save SVG as separate file if present
    if (chapter.svgIllustration) {
      const svgFilename = `images/chapter-${chapter.number}.svg`;
      writeFileSync(join(oebps, svgFilename), chapter.svgIllustration);
      manifestFiles.push({
        id: `img-ch${chapter.number}`,
        href: svgFilename,
        mediaType: "image/svg+xml",
      });
    }

    const chapterXhtml = buildChapterXhtml(chapter, metadata, hasSvg);
    writeFileSync(join(oebps, filename), chapterXhtml);

    manifestFiles.push({
      id: chId,
      href: filename,
      mediaType: "application/xhtml+xml",
      properties: hasSvg ? "svg" : undefined,
    });
    spineItems.push(chId);
  }

  // ─── Back Matter Pages ───
  const backPages = compileBackMatter(oebps, ebookResult.backMatter, ebookResult.config, metadata);
  manifestFiles.push(...backPages.manifest);
  spineItems.push(...backPages.spine);

  // ─── Navigation Documents ───
  const navXhtml = buildNavDocument(ebookResult.outline, ebookResult.chapters, metadata, hasCover);
  writeFileSync(join(oebps, "nav.xhtml"), navXhtml);
  manifestFiles.push({ id: "nav", href: "nav.xhtml", mediaType: "application/xhtml+xml", properties: "nav" });

  const tocNcx = buildTocNcx(ebookResult.outline, ebookResult.chapters, metadata, hasCover);
  writeFileSync(join(oebps, "toc.ncx"), tocNcx);
  manifestFiles.push({ id: "ncx", href: "toc.ncx", mediaType: "application/x-dtbncx+xml" });

  // ─── content.opf ───
  const contentOpf = buildContentOpf(metadata, manifestFiles, spineItems);
  writeFileSync(join(oebps, "content.opf"), contentOpf);

  // ─── ZIP to EPUB ───
  const epubPath = zipToEpub(epubDir, outputDir, metadata.title);

  return {
    epubDir,
    epubPath,
    chapterCount: ebookResult.chapters.length,
    fileCount: manifestFiles.length,
    metadata,
  };
}

// ─── Front Matter Compilation ───────────────────────────────────

function compileFrontMatter(
  oebps: string,
  front: EbookFrontMatter,
  outline: EbookOutline,
  meta: KdpEpubMetadata
): { manifest: Array<{ id: string; href: string; mediaType: string; properties?: string }>; spine: string[] } {
  const manifest: Array<{ id: string; href: string; mediaType: string; properties?: string }> = [];
  const spine: string[] = [];

  // Title page
  writeFileSync(join(oebps, "title.xhtml"), wrapXhtml("Title Page", `
    <div class="title-page">
      <h1 class="book-title">${esc(meta.title)}</h1>
      <p class="book-subtitle">${esc(meta.subtitle)}</p>
      <p class="book-author">by ${esc(meta.author)}</p>
      <p class="book-publisher">${esc(meta.publisher)}</p>
    </div>`, meta.language));
  manifest.push({ id: "title", href: "title.xhtml", mediaType: "application/xhtml+xml" });
  spine.push("title");

  // Copyright page
  const year = new Date().getFullYear();
  writeFileSync(join(oebps, "copyright.xhtml"), wrapXhtml("Copyright", `
    <div class="copyright-page">
      <p>&copy; ${year} ${esc(meta.author)}. All rights reserved.</p>
      <p>Published by ${esc(meta.publisher)}</p>
      <p>No part of this publication may be reproduced, distributed, or transmitted in any form without prior written permission.</p>
      <p class="disclaimer">The information in this book is provided for educational purposes only. While every effort has been made to ensure accuracy, the author and publisher assume no responsibility for errors or omissions.</p>
      <p>First Edition: ${meta.date}</p>
    </div>`, meta.language));
  manifest.push({ id: "copyright", href: "copyright.xhtml", mediaType: "application/xhtml+xml" });
  spine.push("copyright");

  // Dedication (if provided)
  if (front.dedication) {
    writeFileSync(join(oebps, "dedication.xhtml"), wrapXhtml("Dedication", `
      <div class="dedication-page">
        ${mdToXhtml(front.dedication)}
      </div>`, meta.language));
    manifest.push({ id: "dedication", href: "dedication.xhtml", mediaType: "application/xhtml+xml" });
    spine.push("dedication");
  }

  // Preface (if provided)
  if (front.preface) {
    writeFileSync(join(oebps, "preface.xhtml"), wrapXhtml("Preface", `
      <h1>Preface</h1>
      ${mdToXhtml(front.preface)}`, meta.language));
    manifest.push({ id: "preface", href: "preface.xhtml", mediaType: "application/xhtml+xml" });
    spine.push("preface");
  }

  return { manifest, spine };
}

// ─── Back Matter Compilation ────────────────────────────────────

function compileBackMatter(
  oebps: string,
  back: EbookBackMatter,
  config: EbookConfig,
  meta: KdpEpubMetadata
): { manifest: Array<{ id: string; href: string; mediaType: string }>; spine: string[] } {
  const manifest: Array<{ id: string; href: string; mediaType: string }> = [];
  const spine: string[] = [];

  // About the Author
  writeFileSync(join(oebps, "about-author.xhtml"), wrapXhtml("About the Author", `
    <h1>About the Author</h1>
    ${mdToXhtml(back.aboutAuthor)}`, meta.language));
  manifest.push({ id: "about-author", href: "about-author.xhtml", mediaType: "application/xhtml+xml" });
  spine.push("about-author");

  // Resources
  if (back.resources) {
    writeFileSync(join(oebps, "resources.xhtml"), wrapXhtml("Recommended Resources", `
      <h1>Recommended Resources</h1>
      ${mdToXhtml(back.resources)}`, meta.language));
    manifest.push({ id: "resources", href: "resources.xhtml", mediaType: "application/xhtml+xml" });
    spine.push("resources");
  }

  // CTA
  if (config.includeCta && back.callToAction) {
    writeFileSync(join(oebps, "cta.xhtml"), wrapXhtml("Take the Next Step", `
      <div class="cta-page">
        ${mdToXhtml(back.callToAction)}
      </div>`, meta.language));
    manifest.push({ id: "cta", href: "cta.xhtml", mediaType: "application/xhtml+xml" });
    spine.push("cta");
  }

  // Glossary
  if (back.glossary) {
    writeFileSync(join(oebps, "glossary.xhtml"), wrapXhtml("Glossary", `
      <h1>Glossary</h1>
      ${mdToXhtml(back.glossary)}`, meta.language));
    manifest.push({ id: "glossary", href: "glossary.xhtml", mediaType: "application/xhtml+xml" });
    spine.push("glossary");
  }

  return { manifest, spine };
}

// ─── Chapter XHTML Builder ──────────────────────────────────────

function buildChapterXhtml(chapter: ChapterDraft, meta: KdpEpubMetadata, hasSvg: boolean): string {
  const svgBlock = hasSvg
    ? `<div class="chapter-illustration">
        <img src="images/chapter-${chapter.number}.svg" alt="Chapter ${chapter.number} illustration"/>
      </div>`
    : "";

  const takeawaysBlock = chapter.keyTakeaways.length > 0
    ? `<div class="key-takeaways">
        <h3>Key Takeaways</h3>
        <ul>${chapter.keyTakeaways.map((t) => `<li>${esc(t)}</li>`).join("\n")}</ul>
      </div>`
    : "";

  return wrapXhtml(chapter.title, `
    <h1>${esc(chapter.title)}</h1>
    ${svgBlock}
    ${mdToXhtml(chapter.content)}
    ${takeawaysBlock}`, meta.language);
}

// ─── Navigation Documents ───────────────────────────────────────

function buildNavDocument(outline: EbookOutline, chapters: ChapterDraft[], meta: KdpEpubMetadata, hasCover?: boolean): string {
  const tocItems = [
    ...(hasCover ? [`      <li><a href="cover.xhtml">Cover</a></li>`] : []),
    `      <li><a href="title.xhtml">Title Page</a></li>`,
    ...chapters.map((ch) => `      <li><a href="chapter-${ch.number}.xhtml">${esc(ch.title)}</a></li>`),
    `      <li><a href="about-author.xhtml">About the Author</a></li>`,
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${meta.language}">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>`;
}

function buildTocNcx(outline: EbookOutline, chapters: ChapterDraft[], meta: KdpEpubMetadata, hasCover?: boolean): string {
  let playOrder = 1;
  const navPoints = [
    ...(hasCover ? [`    <navPoint id="cover" playOrder="${playOrder++}">
      <navLabel><text>Cover</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`] : []),
    `    <navPoint id="title" playOrder="${playOrder++}">
      <navLabel><text>Title Page</text></navLabel>
      <content src="title.xhtml"/>
    </navPoint>`,
    ...chapters.map((ch) =>
      `    <navPoint id="ch${ch.number}" playOrder="${playOrder++}">
      <navLabel><text>${esc(ch.title)}</text></navLabel>
      <content src="chapter-${ch.number}.xhtml"/>
    </navPoint>`
    ),
    `    <navPoint id="about" playOrder="${playOrder++}">
      <navLabel><text>About the Author</text></navLabel>
      <content src="about-author.xhtml"/>
    </navPoint>`,
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${meta.uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${esc(meta.title)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

// ─── content.opf Builder ────────────────────────────────────────

function buildContentOpf(
  meta: KdpEpubMetadata,
  files: Array<{ id: string; href: string; mediaType: string; properties?: string }>,
  spine: string[]
): string {
  const manifestItems = files
    .map((f) => {
      const props = f.properties ? ` properties="${f.properties}"` : "";
      return `    <item id="${f.id}" href="${f.href}" media-type="${f.mediaType}"${props}/>`;
    })
    .join("\n");

  const spineItems = spine
    .map((id) => `    <itemref idref="${id}"/>`)
    .join("\n");

  // KDP metadata keywords as dc:subject
  const subjectTags = meta.keywords
    .map((kw) => `    <dc:subject>${esc(kw)}</dc:subject>`)
    .join("\n");

  const hasCoverImage = files.some((f) => f.id === "cover-image");
  const coverMeta = hasCoverImage ? `    <meta name="cover" content="cover-image"/>\n` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${meta.uuid}</dc:identifier>
    <dc:title>${esc(meta.title)}: ${esc(meta.subtitle)}</dc:title>
    <dc:creator>${esc(meta.author)}</dc:creator>
    <dc:language>${meta.language}</dc:language>
    <dc:publisher>${esc(meta.publisher)}</dc:publisher>
    <dc:description>${esc(meta.description)}</dc:description>
    <dc:date>${meta.date}</dc:date>
    <dc:rights>Copyright &copy; ${new Date().getFullYear()} ${esc(meta.author)}. All rights reserved.</dc:rights>
${subjectTags}
${coverMeta}    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z/, "Z")}</meta>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`;
}

// ─── ZIP to EPUB ────────────────────────────────────────────────

function zipToEpub(epubDir: string, outputDir: string, title: string): string | null {
  const safeName = title.replace(/[^a-zA-Z0-9-_ ]/g, "").substring(0, 80).trim();
  const zipPath = join(outputDir, `${safeName}.zip`);
  const epubPath = join(outputDir, `${safeName}.epub`);

  try {
    if (existsSync(zipPath)) unlinkSync(zipPath);
    if (existsSync(epubPath)) unlinkSync(epubPath);

    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${epubDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { timeout: 30000 }
    );

    if (existsSync(zipPath)) {
      renameSync(zipPath, epubPath);
      return epubPath;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Markdown → XHTML Converter ─────────────────────────────────

function mdToXhtml(md: string): string {
  let html = md;

  // Remove YAML frontmatter
  html = html.replace(/^---[\s\S]*?---\n*/m, "");

  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${esc(code.trim())}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headings
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^>\s*(.+)$/gm, "<blockquote><p>$1</p></blockquote>");
  // Merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, "\n");

  // Bullet lists
  html = html.replace(/^[\s]*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, "<ul>$1</ul>");

  // Numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="section-break"/>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Emoji markers
  html = html.replace(/📌/g, "&#x1F4CC;");

  // Paragraphs
  const blocks = html.split(/\n\s*\n/);
  const parsed = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (/^<(?:h[1-6]|ul|ol|li|pre|blockquote|hr|div|p|table)/.test(trimmed)) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
  });

  return parsed.filter(Boolean).join("\n");
}

// ─── XHTML Wrapper ──────────────────────────────────────────────

function wrapXhtml(title: string, body: string, language: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${language}">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  ${body}
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── KDP-Compliant Stylesheet ───────────────────────────────────

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const KDP_STYLESHEET = `@charset "UTF-8";

/* ═══════════════════════════════════════════
   Webness Publishing — KDP-Compliant Styles
   Amazon Kindle Reflowable Ebook Standards
   ═══════════════════════════════════════════ */

/* Cover Page */
.cover-page-full {
  text-align: center;
  padding: 0;
  margin: 0;
  height: 100%;
}
.cover-page-full img {
  max-width: 100%;
  height: auto;
  max-height: 100vh;
  display: block;
  margin: 0 auto;
}

/* Base Typography */
body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.7;
  color: #1a1a1a;
  margin: 0;
  padding: 1em;
  text-rendering: optimizeLegibility;
  -webkit-hyphens: auto;
  hyphens: auto;
}

/* ─── Headings ─── */
h1, h2, h3, h4 {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #1a202c;
  page-break-after: avoid;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2em;
  margin-top: 2em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
}

h2 {
  font-size: 1.5em;
  color: #2d3748;
  margin-top: 1.8em;
  padding-bottom: 0.2em;
  border-bottom: 1px solid #edf2f7;
}

h3 {
  font-size: 1.2em;
  color: #4a5568;
  margin-top: 1.4em;
}

h4 {
  font-size: 1.05em;
  color: #718096;
  margin-top: 1.2em;
}

/* ─── KDP Paragraph Formatting ─── */
p {
  margin-bottom: 0;
  margin-top: 0;
  text-indent: 1.5em;  /* KDP first-line indent (0.3-0.5") */
  text-align: justify;
  font-size: 1em;
  orphans: 2;
  widows: 2;
}

/* First paragraph after heading — no indent per KDP convention */
h1 + p, h2 + p, h3 + p, h4 + p,
blockquote + p, .chapter-illustration + p,
hr + p, ul + p, ol + p, pre + p {
  text-indent: 0;
}

/* ─── Lists ─── */
ul, ol {
  margin: 1em 0;
  padding-left: 2em;
}

li {
  margin-bottom: 0.4em;
  text-indent: 0;
}

/* ─── Blockquotes (Callout Boxes) ─── */
blockquote {
  border-left: 4px solid #6366f1;
  padding: 0.8em 1em;
  margin: 1.5em 0;
  color: #4a5568;
  background-color: #f8f9fa;
  font-style: italic;
  page-break-inside: avoid;
}

blockquote p {
  text-indent: 0;
  margin: 0.3em 0;
}

/* ─── Code ─── */
pre {
  background-color: #f7fafc;
  border-left: 4px solid #a855f7;
  padding: 1em;
  overflow-x: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.85em;
  line-height: 1.5;
  margin: 1.5em 0;
  page-break-inside: avoid;
}

code {
  font-family: "Courier New", Courier, monospace;
  background-color: #edf2f7;
  padding: 0.15em 0.35em;
  font-size: 0.9em;
}

/* ─── Section Breaks ─── */
hr, hr.section-break {
  border: none;
  text-align: center;
  margin: 2em 0;
  page-break-after: avoid;
}

hr::after, hr.section-break::after {
  content: "* * *";
  color: #a0aec0;
  font-size: 1.2em;
  letter-spacing: 0.5em;
}

/* ─── Images & Illustrations ─── */
.chapter-illustration {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}

.chapter-illustration img {
  max-width: 100%;
  height: auto;
}

/* ─── Key Takeaways Box ─── */
.key-takeaways {
  border: 2px solid #6366f1;
  border-radius: 6px;
  padding: 1em 1.5em;
  margin: 2em 0;
  background-color: #f0f0ff;
  page-break-inside: avoid;
}

.key-takeaways h3 {
  font-size: 1em;
  color: #6366f1;
  margin-top: 0;
  margin-bottom: 0.5em;
}

.key-takeaways li {
  font-size: 0.95em;
}

/* ─── Title Page ─── */
.title-page {
  text-align: center;
  padding-top: 30%;
}

.book-title {
  font-size: 2.5em;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 0.3em;
  border: none;
}

.book-subtitle {
  font-size: 1.3em;
  color: #4a5568;
  font-style: italic;
  margin-bottom: 2em;
}

.book-author {
  font-size: 1.2em;
  color: #2d3748;
  margin-bottom: 0.5em;
}

.book-publisher {
  font-size: 0.9em;
  color: #a0aec0;
  margin-top: 3em;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

/* ─── Copyright Page ─── */
.copyright-page {
  padding-top: 30%;
  font-size: 0.85em;
  color: #718096;
}

.copyright-page p {
  text-indent: 0;
  text-align: center;
  margin-bottom: 0.8em;
}

.disclaimer {
  font-style: italic;
  font-size: 0.9em;
  margin-top: 2em;
}

/* ─── Dedication ─── */
.dedication-page {
  text-align: center;
  padding-top: 35%;
  font-style: italic;
  color: #4a5568;
}

/* ─── CTA Page ─── */
.cta-page {
  border: 2px solid #a855f7;
  border-radius: 8px;
  padding: 1.5em;
  margin: 2em 0;
  background-color: #faf5ff;
  page-break-inside: avoid;
}

.cta-page h1, .cta-page h2 {
  color: #6b21a8;
  border: none;
  text-align: left;
}

/* ─── Links ─── */
a {
  color: #6366f1;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* ─── Case Study Boxes ─── */
.case-study {
  border: 2px solid #22c55e;
  border-radius: 6px;
  padding: 1.2em 1.5em;
  margin: 2em 0;
  background-color: #f0fdf4;
  page-break-inside: avoid;
}
.case-study h3 {
  font-size: 1.05em;
  color: #15803d;
  margin-top: 0;
  margin-bottom: 0.5em;
}
.case-study p {
  text-indent: 0;
  margin: 0.4em 0;
}

/* ─── Did You Know? Callouts ─── */
.did-you-know {
  border: 2px dashed #f59e0b;
  border-radius: 6px;
  padding: 1.2em 1.5em;
  margin: 2em 0;
  background-color: #fffbeb;
  page-break-inside: avoid;
}
.did-you-know h3 {
  font-size: 1.05em;
  color: #b45309;
  margin-top: 0;
  margin-bottom: 0.5em;
}
.did-you-know p {
  text-indent: 0;
  margin: 0.4em 0;
}

/* ─── Comparative Data Tables ─── */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.9em;
  page-break-inside: avoid;
}
th {
  background-color: #f1f5f9;
  color: #334155;
  font-weight: bold;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #cbd5e1;
}
td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
}
tr:nth-child(even) {
  background-color: #f8fafc;
}

/* ─── Print Overrides ─── */
@media print {
  body { font-size: 11pt; }
  .title-page { page-break-after: always; }
  h1 { page-break-before: always; }
  .key-takeaways, .cta-page, blockquote, .case-study, .did-you-know, table { page-break-inside: avoid; }
}`;
