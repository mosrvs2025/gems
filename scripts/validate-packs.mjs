#!/usr/bin/env node
/**
 * Checks every folder in /examples against /templates: all four files present,
 * required structural markers intact, and no template placeholders left behind.
 * This is the same contract the studio's Decode tab enforces in the browser.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = {
  'title.md': ['# Title'],
  'description.md': ['# Description', '## Sonic Architecture', '**Tempo:**', '**Key:**', '**Style:**', '**Arrangement Map:**'],
  'lyrics.md': ['[Intro]', '[Verse 1]', '[Pre-Chorus]', '[Chorus]', '[Verse 2]', '[Bridge]', '[Final Chorus]', '[Outro]'],
  'cover-art.md': ['# Album Cover']
};

const SECTION_RE = /^(intro|outro|hook|refrain|chorus|pre-chorus|post-chorus|final chorus|bridge|drop|break|interlude|verse\s*\d*|instrumental|breakdown|coda|tag)$/i;

const problems = [];

function leftovers(text) {
  const found = new Set();
  for (const tok of text.match(/\[[^\][\n]{1,80}\]/g) || []) {
    if (!SECTION_RE.test(tok.slice(1, -1).trim())) found.add(tok);
  }
  for (const tok of text.match(/\{[^{}\n]{1,80}\}/g) || []) found.add(tok);
  return [...found];
}

const examplesDir = join(ROOT, 'examples');
const slugs = readdirSync(examplesDir).filter((s) => statSync(join(examplesDir, s)).isDirectory());

if (!slugs.length) problems.push('examples/ is empty — the Gem has no house references to imitate.');

for (const slug of slugs) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) problems.push(`${slug}: folder name must be kebab-case`);

  for (const [name, markers] of Object.entries(REQUIRED)) {
    const path = join(examplesDir, slug, name);
    if (!existsSync(path)) { problems.push(`${slug}/${name}: missing`); continue; }

    const body = readFileSync(path, 'utf8');
    const missing = markers.filter((m) => !body.includes(m));
    if (missing.length) problems.push(`${slug}/${name}: missing ${missing.join(', ')}`);

    const left = leftovers(body);
    if (left.length) problems.push(`${slug}/${name}: unfilled placeholders ${left.join(' ')}`);
  }
}

if (problems.length) {
  console.error('✗ example packs have problems:\n' + problems.map((p) => '  · ' + p).join('\n'));
  process.exit(1);
}
console.log(`✓ ${slugs.length} example pack(s) match the templates`);
