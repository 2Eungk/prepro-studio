import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packDir = path.join(rootDir, 'public/storyboard-generic-hq');
const indexPath = path.join(packDir, 'index.json');
const outputPath = path.join(rootDir, 'docs/generic-storyboard-gallery.html');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const entries = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const generatedAt = new Date().toISOString();

const cards = entries
  .map((entry, index) => {
    const number = String(index + 1).padStart(3, '0');
    const thumbPath = `../public/storyboard-generic-hq/${entry.thumbnail}`;
    const originalPath = `../public/storyboard-generic-hq/${entry.file}`;
    const tags = entry.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');

    return `
      <article class="card" data-gender="${escapeHtml(entry.gender)}">
        <a href="${escapeHtml(originalPath)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(thumbPath)}" alt="${escapeHtml(entry.title)}" loading="lazy" />
        </a>
        <div class="meta">
          <div class="row">
            <strong>${number}</strong>
            <em>${escapeHtml(entry.gender)}</em>
          </div>
          <h2>${escapeHtml(entry.title)}</h2>
          <div class="tags">${tags}</div>
        </div>
      </article>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PrePro Studio Generic Storyboard QA Gallery</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #070807;
        --panel: #101311;
        --line: #27302c;
        --muted: #8f9993;
        --text: #f1f5f2;
        --accent: #70d6ca;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 2;
        border-bottom: 1px solid var(--line);
        background: color-mix(in srgb, var(--bg) 92%, transparent);
        backdrop-filter: blur(18px);
        padding: 24px clamp(20px, 4vw, 56px);
      }

      h1 {
        margin: 0;
        font-size: clamp(28px, 4vw, 54px);
        letter-spacing: 0;
      }

      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
        color: var(--muted);
        font-size: 14px;
      }

      .summary span {
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 8px 12px;
        background: #0d100f;
      }

      main {
        padding: 28px clamp(20px, 4vw, 56px) 64px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 18px;
      }

      .card {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }

      .card img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        background: #030403;
        border-bottom: 1px solid var(--line);
      }

      .meta {
        padding: 14px;
      }

      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
        color: var(--accent);
        font-size: 13px;
      }

      .row em {
        color: var(--muted);
        font-style: normal;
        text-transform: uppercase;
      }

      h2 {
        min-height: 48px;
        margin: 0 0 12px;
        font-size: 16px;
        line-height: 1.35;
        letter-spacing: 0;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tags span {
        border: 1px solid #203d39;
        border-radius: 999px;
        padding: 5px 8px;
        color: #b6dcd7;
        background: #0b1917;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Generic Storyboard QA Gallery</h1>
      <div class="summary">
        <span>${entries.length} storyboard references</span>
        <span>Generated ${escapeHtml(generatedAt)}</span>
        <span>Click thumbnails to open originals</span>
      </div>
    </header>
    <main>
      <section class="grid">${cards}
      </section>
    </main>
  </body>
</html>
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);

console.log(`Wrote ${path.relative(rootDir, outputPath)} with ${entries.length} cards.`);
