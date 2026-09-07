#!/usr/bin/env node
/**
 * Inlines docs/ into one self-contained HTML file.
 *
 *   npm run bundle              -> dist/gem-studio.html
 *       Fully standalone, zero network requests. Open it by double-clicking,
 *       email it, or drop it on any host that serves a single file.
 *
 *   npm run bundle -- --artifact -> dist/gem-studio.artifact.html
 *       Same page without the <!doctype>/<html>/<head>/<body> shell, for hosts
 *       that supply their own. Keeps the Google Fonts link, since those hosts
 *       generally allow it and the typography is better for it.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const ARTIFACT = process.argv.includes('--artifact');

let html = read('docs', 'index.html');

/* Swap each external reference for its contents. Scripts stay in source order —
   data.js and library.js must still evaluate before app.js. */
html = html.replace(
  /^[ \t]*<link rel="stylesheet" href="assets\/styles\.css">[ \t]*\n/m,
  () => '<style>\n' + read('docs', 'assets', 'styles.css') + '\n</style>\n'
);

for (const name of ['data.js', 'library.js', 'app.js']) {
  const tag = new RegExp('^[ \\t]*<script src="assets/' + name.replace('.', '\\.') + '"></script>[ \\t]*\\n', 'm');
  if (!tag.test(html)) throw new Error(`could not find the <script> tag for ${name}`);
  /* A literal </script> inside JS would close the tag early; none today, but
     be explicit rather than silently producing a broken file. */
  const src = read('docs', 'assets', name);
  if (/<\/script/i.test(src)) throw new Error(`${name} contains a literal </script>`);
  html = html.replace(tag, () => '<script>\n' + src + '\n</script>\n');
}

if (ARTIFACT) {
  /* Strip the document shell the host supplies, keeping everything inside it.
     <title> and <style> live in the head and have to survive the trim. */
  const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  const keep = head
    .split('\n')
    .filter((line) => !/<meta|<link rel="icon"/.test(line))
    .join('\n')
    .trim();
  html = keep + '\n\n' + body.trim() + '\n';

  if (/<\/?(?:html|head|body)[\s>]/i.test(html)) throw new Error('document shell survived the trim');
  if (!/<title>/.test(html)) throw new Error('the <title> was trimmed away');
} else {
  /* Fonts are the only network request left; the stylesheet declares full
     fallback stacks, so dropping them makes the file work with no network. */
  html = html
    .replace(/^[ \t]*<link rel="preconnect"[^>]*>[ \t]*\n/gm, '')
    .replace(/^[ \t]*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>[ \t]*\n/gm, '');
}

if (/(?:href|src)="assets\//.test(html)) throw new Error('an assets/ reference survived bundling');

const out = ARTIFACT ? 'gem-studio.artifact.html' : 'gem-studio.html';
mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist', out), html);
console.log(
  `✓ dist/${out} — ${(html.length / 1024).toFixed(0)} KB` +
  (ARTIFACT ? ', no document shell' : ', no external requests')
);
