/* ── Gem Studio ─────────────────────────────────────────────────────────────
   Vanilla, no build step, no modules — so docs/index.html opens by double-click
   as happily as it does from GitHub Pages. */
(function () {
'use strict';

const D = window.GEM_DATA;
const LIB = window.GEM_LIBRARY;
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

let state = structuredClone(D.DEFAULT_STATE);

/* ── Small utilities ─────────────────────────────────────────────────────── */

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1900);
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    /* clipboard API needs a secure context; file:// and http:// fall back. */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast((label || 'Copied') + ' → clipboard');
}

/* Hosts that sandbox the page block <a download> outright and mediate saves
   through a capability instead. Resolve it once; null means we're somewhere
   ordinary and the anchor works. */
let downloadsApi;
async function resolveDownloads() {
  if (downloadsApi !== undefined) return downloadsApi;
  try {
    downloadsApi = window.claude && typeof window.claude.use === 'function'
      ? await window.claude.use('downloads')
      : null;
  } catch (e) {
    downloadsApi = null;
  }
  return downloadsApi;
}

/** Resolves true if the file was saved, false if it wasn't. Never throws. */
async function download(filename, text) {
  const api = await resolveDownloads();

  if (api) {
    try {
      await api.save({ filename, data: text });
      return true;
    } catch (err) {
      /* Declining is a normal answer, not a failure worth announcing. */
      if (!err || err.code !== 'declined') toast('Could not save ' + filename);
      return false;
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const slugify = (s) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 48);
const tempoZone = (bpm) => (D.TEMPO_ZONES.find((z) => bpm <= z.max) || {}).label || '';

/* ── Prompt builder — the actual product ─────────────────────────────────── */

/** Named palettes resolve to their colors; anything else is already a color list. */
function paletteColors(name) {
  const known = D.PALETTES.find((p) => p.name === name);
  if (known) return known.colors;
  return String(name || '').split(/\s*,\s*/).filter(Boolean);
}

function buildPrompt(s) {
  const lines = [];
  const wanted = D.FILES.filter((f) => s.files.includes(f.id));
  const iterating = wanted.length > 0 && wanted.length < D.FILES.length;
  const lang = D.LANGUAGE_MODES.find((l) => l.id === s.language) || D.LANGUAGE_MODES[0];
  const arrangement = D.ARRANGEMENTS.find((a) => a.name === s.arrangement) || D.ARRANGEMENTS[0];
  const palette = paletteColors(s.palette);

  if (iterating) {
    lines.push('ITERATE on the song pack already in this conversation.');
    lines.push('Rewrite ONLY: ' + wanted.map((f) => f.id).join(', ') + '. Leave every other file exactly as it stands and do not restate it.');
    if (s.iterateNote) lines.push('What to change: ' + s.iterateNote);
  } else {
    lines.push('Write a complete song pack.');
  }
  lines.push('');

  lines.push('CONCEPT');
  lines.push(s.concept.trim() || '(your choice — pick something specific and human, not abstract)');
  lines.push('');

  lines.push('SONIC ARCHITECTURE');
  if (s.genres.length)      lines.push('- Genre: ' + s.genres.join(' + '));
  if (s.moods.length)       lines.push('- Mood: ' + s.moods.join(', '));
  lines.push('- Tempo: ' + s.bpm + ' BPM (' + tempoZone(s.bpm) + ')');
  lines.push('- Key: ' + s.key);
  lines.push('- Time signature: ' + s.timeSignature);
  if (s.instruments.length) lines.push('- Core instruments: ' + s.instruments.join(', '));
  lines.push('- Lead vocal plan: ' + s.vocalPlan);
  lines.push('- Arrangement map: ' + arrangement.map);
  lines.push('- Language: ' + lang.label + ' — ' + lang.note);
  lines.push('');

  if (s.files.includes('cover-art.md')) {
    lines.push('COVER ART');
    lines.push('- Style: ' + s.artStyle);
    lines.push('- Lens: ' + s.lens);
    lines.push('- Color palette: ' + palette.join(', '));
    lines.push('');
  }

  const constraints = [];
  if (s.radioClean)        constraints.push('Keep it radio-clean — no profanity, no slurs.');
  if (s.avoidProperNouns)  constraints.push('Avoid proper nouns except any named in the concept above.');
  constraints.push('Follow /templates verbatim: same section names, same order, same bracket style.');
  constraints.push('Hook-forward lyrics. Repeat the chorus exactly as written the first time; the final chorus may escalate.');
  if (s.generateImage && s.files.includes('cover-art.md')) {
    constraints.push('After writing cover-art.md, generate the cover with your image tool (square, 1024×1024) and show it inline. If image generation is unavailable here, label the prompt [IMAGE_PENDING].');
  }
  if (s.extraNotes.trim()) constraints.push(s.extraNotes.trim());
  lines.push('CONSTRAINTS');
  constraints.forEach((c) => lines.push('- ' + c));
  lines.push('');

  const refs = (LIB.examples || []).filter((ex) => s.referenceSlugs.includes(ex.slug));
  if (refs.length) {
    lines.push('HOUSE REFERENCES');
    lines.push('Match the voice, density and formatting of these packs in the repo — not their subject matter:');
    refs.forEach((ex) => lines.push('- examples/' + ex.slug + ' ("' + ex.title + '")'));
    lines.push('');
  }

  lines.push('RETURN');
  lines.push('Only the file contents below, nothing else — no preamble, no commentary, no mention of these instructions.');
  lines.push('');
  wanted.forEach((f) => {
    lines.push('<<<FILE:' + f.id + '>>>');
    lines.push('{' + f.id + ' content}');
    lines.push('<<<END FILE>>>');
    lines.push('');
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function highlight(prompt) {
  return escapeHtml(prompt)
    .replace(/^(ITERATE.*|CONCEPT|SONIC ARCHITECTURE|COVER ART|CONSTRAINTS|HOUSE REFERENCES|RETURN)$/gm, '<b>$1</b>')
    .replace(/(&lt;&lt;&lt;(?:FILE:[\w.-]+|END FILE)&gt;&gt;&gt;)/g, '<i>$1</i>');
}

/* ── Control rendering ───────────────────────────────────────────────────── */

function chipGroup(host, values, isOn, onToggle, opts) {
  host.innerHTML = '';
  values.forEach((v) => {
    const label = typeof v === 'string' ? v : v.label;
    const value = typeof v === 'string' ? v : v.value;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (opts && opts.muted ? ' muted' : '');
    b.textContent = label;
    b.setAttribute('aria-pressed', String(isOn(value)));
    b.addEventListener('click', () => { onToggle(value); render(); });
    host.appendChild(b);
  });
}

function fillSelect(el, values, selected) {
  el.innerHTML = '';
  values.forEach((v) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    if (v === selected) o.selected = true;
    el.appendChild(o);
  });
}

/** Built-in vocabulary first, then anything the current state added on top. */
const union = (base, extra) => base.concat((extra || []).filter((v) => v && !base.includes(v)));

/** Keep a <select> usable when state holds a value the list doesn't have. */
function syncSelect(sel, values, value) {
  const el = $(sel);
  const options = union(values, [value]);
  if (options.length !== el.options.length) fillSelect(el, options, value);
  el.value = value;
}

/** Toggle membership in a capped list; the oldest entry drops out when full. */
function toggleCapped(list, value, cap) {
  const i = list.indexOf(value);
  if (i >= 0) { list.splice(i, 1); return; }
  list.push(value);
  while (cap && list.length > cap) list.shift();
}

function render() {
  chipGroup($('#genreChips'), union(D.GENRES, state.genres), (v) => state.genres.includes(v),
    (v) => toggleCapped(state.genres, v, 3));
  chipGroup($('#moodChips'), union(D.MOODS, state.moods), (v) => state.moods.includes(v),
    (v) => toggleCapped(state.moods, v, 3));
  chipGroup($('#instrumentChips'), union(D.INSTRUMENTS, state.instruments), (v) => state.instruments.includes(v),
    (v) => toggleCapped(state.instruments, v, 7), { muted: true });

  $('#instrCount').textContent = state.instruments.length + '/7';

  chipGroup($('#fileChips'), D.FILES.map((f) => ({ value: f.id, label: f.icon + '  ' + f.label })),
    (v) => state.files.includes(v),
    (v) => {
      const i = state.files.indexOf(v);
      if (i >= 0) { if (state.files.length > 1) state.files.splice(i, 1); }
      else state.files.push(v);
      state.files.sort((a, b) => D.FILES.findIndex((f) => f.id === a) - D.FILES.findIndex((f) => f.id === b));
    });

  chipGroup($('#flagChips'), [
    { value: 'radioClean',       label: 'Radio-clean' },
    { value: 'avoidProperNouns', label: 'No proper nouns' },
    { value: 'generateImage',    label: 'Generate the cover image' }
  ], (v) => state[v], (v) => { state[v] = !state[v]; }, { muted: true });

  const refs = LIB.examples.map((ex) => ({ value: ex.slug, label: ex.title }));
  chipGroup($('#referenceChips'), refs.length ? refs : [{ value: '', label: 'no example packs yet' }],
    (v) => state.referenceSlugs.includes(v),
    (v) => { if (v) toggleCapped(state.referenceSlugs, v); }, { muted: true });

  $('#bpm').value = state.bpm;
  $('#bpmOut').textContent = state.bpm;
  $('#tempoZone').textContent = tempoZone(state.bpm);
  $('#concept').value = state.concept;
  $('#extraNotes').value = state.extraNotes;
  syncSelect('#key', D.KEYS, state.key);
  syncSelect('#timeSignature', D.TIME_SIGNATURES, state.timeSignature);
  syncSelect('#arrangement', D.ARRANGEMENTS.map((a) => a.name), state.arrangement);
  syncSelect('#vocalPlan', D.VOCAL_PLANS, state.vocalPlan);
  syncSelect('#artStyle', D.ART_STYLES, state.artStyle);
  syncSelect('#lens', D.LENSES, state.lens);
  syncSelect('#palette', D.PALETTES.map((p) => p.name), state.palette);
  $('#language').value = state.language;

  const arr = D.ARRANGEMENTS.find((a) => a.name === state.arrangement);
  $('#arrangementMap').textContent = arr ? arr.map : '';

  $('#paletteSwatch').innerHTML = paletteColors(state.palette)
    .map((c) => '<span class="tag">' + escapeHtml(c) + '</span>').join('');

  const prompt = buildPrompt(state);
  $('#promptOut').innerHTML = highlight(prompt);
  $('#mWords').textContent = prompt.trim().split(/\s+/).length;
  $('#mChars').textContent = prompt.length;
  $('#mFiles').textContent = state.files.length;

  persist();
}

/* ── Persistence + share links ───────────────────────────────────────────── */

const LS_STATE = 'gem-studio:state';
const LS_PRESETS = 'gem-studio:presets';
const LS_THEME = 'gem-studio:theme';

function persist() {
  try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

function loadPresets() {
  try { return JSON.parse(localStorage.getItem(LS_PRESETS) || '[]'); } catch (e) { return []; }
}
function savePresets(list) {
  try { localStorage.setItem(LS_PRESETS, JSON.stringify(list)); } catch (e) { toast('Could not save — storage blocked'); }
}

function encodeState(s) {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeState(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function applyPatch(patch) {
  state = Object.assign(structuredClone(D.DEFAULT_STATE), structuredClone(patch));
  render();
}

function renderPresets() {
  const host = $('#presetList');
  const presets = loadPresets();
  if (!presets.length) {
    host.innerHTML = '<div class="empty"><strong>No saved setups</strong>Save a configuration you like and it comes back next visit.</div>';
    return;
  }
  host.innerHTML = '';
  presets.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'btn-row';
    row.style.marginBottom = '8px';
    const load = document.createElement('button');
    load.className = 'btn small';
    load.style.flex = '1';
    load.style.justifyContent = 'flex-start';
    load.textContent = p.name;
    load.addEventListener('click', () => { applyPatch(p.state); toast('Loaded "' + p.name + '"'); });
    const del = document.createElement('button');
    del.className = 'btn small ghost';
    del.textContent = '✕';
    del.title = 'Delete';
    del.addEventListener('click', () => {
      const list = loadPresets();
      list.splice(i, 1);
      savePresets(list);
      renderPresets();
    });
    row.append(load, del);
    host.appendChild(row);
  });
}

/* ── Decode: parse the Gem's reply and check it against the templates ────── */

/* Section headers that legitimately survive into finished lyrics. Anything else
   still wearing brackets is an unfilled template placeholder. */
const SECTION_RE = /^(intro|outro|hook|refrain|chorus|pre-chorus|post-chorus|final chorus|bridge|drop|break|interlude|verse\s*\d*|verse\s*\d*\s*\([^)]*\)|instrumental|breakdown|coda|tag)$/i;

function parseReply(raw) {
  const files = {};
  const fence = /<<<FILE:\s*([\w.-]+)\s*>>>\s*([\s\S]*?)\s*<<<END\s*FILE>>>/gi;
  let m;
  while ((m = fence.exec(raw))) files[m[1].toLowerCase()] = m[2].trim();

  if (Object.keys(files).length) return { files, lenient: false };

  /* Fallback: the Gem dropped the fences but kept the structure. Split on the
     document headings we know each file starts with. */
  const marks = [
    ['title.md', /^#\s*Title\b/m],
    ['description.md', /^#\s*Description\b/m],
    ['lyrics.md', /^\[Intro\]/m],
    ['cover-art.md', /^#\s*Album Cover\b/mi]
  ];
  const hits = marks
    .map(([name, re]) => { const i = raw.search(re); return { name, i }; })
    .filter((h) => h.i >= 0)
    .sort((a, b) => a.i - b.i);

  hits.forEach((h, idx) => {
    const end = idx + 1 < hits.length ? hits[idx + 1].i : raw.length;
    files[h.name] = raw.slice(h.i, end).replace(/```+\w*\s*$/, '').trim();
  });

  return { files, lenient: hits.length > 0 };
}

function leftoverPlaceholders(text) {
  const found = new Set();
  (text.match(/\[[^\][\n]{1,80}\]/g) || []).forEach((tok) => {
    if (!SECTION_RE.test(tok.slice(1, -1).trim())) found.add(tok);
  });
  (text.match(/\{[^{}\n]{1,80}\}/g) || []).forEach((tok) => found.add(tok));
  return Array.from(found);
}

function chorusBlocks(lyrics) {
  const blocks = [];
  const lines = lyrics.split('\n');
  let capturing = false;
  let buf = [];
  lines.forEach((line) => {
    const isHeader = /^\[[^\]]+\]\s*$/.test(line.trim());
    if (isHeader) {
      if (capturing) { blocks.push(buf.join('\n').trim()); buf = []; }
      capturing = /^\[chorus\]\s*$/i.test(line.trim());
      return;
    }
    if (capturing) buf.push(line);
  });
  if (capturing) blocks.push(buf.join('\n').trim());
  return blocks.filter(Boolean);
}

function checkReply(raw) {
  const { files, lenient } = parseReply(raw);
  const checks = [];
  const present = Object.keys(files);

  if (!present.length) return { files, checks: [], lenient };

  if (lenient) {
    checks.push({ level: 'warn', text: 'No <<<FILE:…>>> fences found',
      note: 'Recovered the files by their headings instead. Remind the Gem to use the exact output format.' });
  }

  D.FILES.forEach((spec) => {
    const body = files[spec.id];
    if (!body) {
      checks.push({ level: 'bad', text: spec.id + ' missing', note: 'Not present in the reply.' });
      return;
    }
    const missing = spec.required.filter((needle) => !body.includes(needle));
    if (missing.length) {
      checks.push({ level: 'bad', text: spec.id + ' — structure drifted',
        note: 'Missing: ' + missing.join(', ') });
    } else {
      checks.push({ level: 'ok', text: spec.id + ' matches the template',
        note: body.split('\n').length + ' lines, ' + body.length + ' chars' });
    }

    const left = leftoverPlaceholders(body);
    if (left.length) {
      checks.push({ level: 'bad', text: spec.id + ' — unfilled placeholders',
        note: left.slice(0, 5).join('  ') + (left.length > 5 ? ' …' : '') });
    }
  });

  /* House rule: the first two choruses repeat verbatim. */
  if (files['lyrics.md']) {
    const blocks = chorusBlocks(files['lyrics.md']);
    if (blocks.length >= 2 && blocks[0] !== blocks[1]) {
      checks.push({ level: 'warn', text: 'Choruses are not identical',
        note: 'House rule is to repeat the chorus as written; only the final chorus may escalate.' });
    } else if (blocks.length >= 2) {
      checks.push({ level: 'ok', text: 'Chorus repeats verbatim', note: blocks.length + ' chorus blocks' });
    }
  }

  /* Did it actually honor the tempo and key you asked for? */
  if (files['description.md']) {
    const spec = {};
    files['description.md'].split('\n').forEach((line) => {
      const m = line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)$/);
      if (m) spec[m[1].toLowerCase()] = m[2].trim();
    });
    const bpm = (spec.tempo || '').match(/\d+/);
    if (bpm && Number(bpm[0]) !== state.bpm) {
      checks.push({ level: 'warn', text: 'Tempo differs from your prompt',
        note: 'You asked for ' + state.bpm + ' BPM, the reply says ' + spec.tempo + '.' });
    }
    if (spec.key && spec.key.toLowerCase() !== state.key.toLowerCase()) {
      checks.push({ level: 'warn', text: 'Key differs from your prompt',
        note: 'You asked for ' + state.key + ', the reply says ' + spec.key + '.' });
    }
  }

  return { files, checks, lenient };
}

let decoded = { files: {}, checks: [] };

function renderDecode() {
  const raw = $('#decodeIn').value;
  const host = $('#decodeReport');
  const exportCard = $('#decodeExportCard');

  if (!raw.trim()) {
    decoded = { files: {}, checks: [] };
    host.innerHTML = '<div class="empty"><strong>Nothing pasted yet</strong>Parsed files and template checks appear here.</div>';
    $('#decodeScore').textContent = '—';
    exportCard.hidden = true;
    return;
  }

  decoded = checkReply(raw);
  const { files, checks } = decoded;

  if (!Object.keys(files).length) {
    host.innerHTML = '<div class="empty"><strong>Couldn\'t find any files</strong>' +
      'Expected <code>&lt;&lt;&lt;FILE:title.md&gt;&gt;&gt;</code> fences, or at least the template headings.</div>';
    $('#decodeScore').textContent = '0 files';
    exportCard.hidden = true;
    return;
  }

  const bad = checks.filter((c) => c.level === 'bad').length;
  const warn = checks.filter((c) => c.level === 'warn').length;
  $('#decodeScore').textContent = bad ? bad + ' to fix' : warn ? warn + ' to review' : 'clean';
  $('#decodeScore').style.color = bad ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--ok)';

  const glyph = { ok: '✓', bad: '!', warn: '~' };
  host.innerHTML = '<ul class="checklist">' + checks.map((c) =>
    '<li><span class="dot ' + c.level + '">' + glyph[c.level] + '</span><span>' +
    escapeHtml(c.text) + '<small>' + escapeHtml(c.note || '') + '</small></span></li>'
  ).join('') + '</ul>';

  exportCard.hidden = false;
  const n = D.FILES.filter((spec) => files[spec.id]).length;
  $('#downloadPackBtn').textContent = 'Download ' + n + ' file' + (n === 1 ? '' : 's');
  if (!$('#slugIn').value && files['title.md']) {
    const titleLine = files['title.md'].split('\n').find((l) => l.trim() && !l.startsWith('#'));
    if (titleLine) $('#slugIn').value = slugify(titleLine);
  }
}

function packShellCommand() {
  const slug = slugify($('#slugIn').value || 'untitled') || 'untitled';
  const parts = ['mkdir -p examples/' + slug];
  D.FILES.forEach((spec) => {
    const body = decoded.files[spec.id];
    if (!body) return;
    parts.push("cat > examples/" + slug + "/" + spec.id + " <<'GEMEOF'\n" + body + "\nGEMEOF");
  });
  return parts.join('\n') + '\n';
}

/* ── Remix: an example pack's Sonic Architecture, back into the composer ─── */

const splitList = (v) => String(v || '').split(/\s*(?:,|\+|\/)\s*/).map((x) => x.trim()).filter(Boolean);

/** Case-insensitive lookup against a known vocabulary, falling back to the raw value. */
function normalize(value, vocabulary) {
  const hit = vocabulary.find((v) => v.toLowerCase() === String(value).toLowerCase());
  return hit || value;
}

function coverArtHints(coverArt) {
  const text = String(coverArt || '');
  const grab = (re) => { const m = text.match(re); return m ? m[1].trim().replace(/[;.]$/, '') : null; };
  return {
    artStyle: grab(/style:\s*([^;\n]+)/i),
    /* Cover prompts write either "lens: 50mm, shallow DOF" or "50mm lens, shallow depth". */
    lens: (grab(/lens:\s*([^;\n]+)/i) || grab(/(\d{2,3}mm[^;\n]*)/i) || '').replace(/\s*\blens\b\s*/i, ' ').replace(/\s+([,;])/g, '$1').trim() || null,
    palette: grab(/color palette:\s*([^;\n]+)/i)
  };
}

function remixFromExample(ex) {
  const spec = ex.spec || {};
  const next = structuredClone(state);

  const bpm = String(spec.Tempo || '').match(/\d+/);
  if (bpm) next.bpm = Math.min(180, Math.max(50, Number(bpm[0])));
  if (spec.Key) next.key = normalize(spec.Key, D.KEYS);
  if (spec['Time Signature']) next.timeSignature = normalize(spec['Time Signature'], D.TIME_SIGNATURES);
  if (spec.Style) next.genres = splitList(spec.Style).slice(0, 3).map((g) => normalize(g, D.GENRES));
  if (spec['Core Instruments']) next.instruments = splitList(spec['Core Instruments']).slice(0, 7).map((i) => normalize(i, D.INSTRUMENTS));
  if (spec['Lead Vocal Plan']) next.vocalPlan = normalize(spec['Lead Vocal Plan'], D.VOCAL_PLANS);

  if (spec['Arrangement Map']) {
    const map = spec['Arrangement Map'];
    const known = D.ARRANGEMENTS.find((a) => a.map === map);
    if (known) {
      next.arrangement = known.name;
    } else {
      /* Register the pack's own map so the select and the prompt both keep it. */
      const name = 'From ' + ex.slug;
      if (!D.ARRANGEMENTS.some((a) => a.name === name)) D.ARRANGEMENTS.push({ name, map });
      next.arrangement = name;
    }
  }

  const art = coverArtHints(ex.files && ex.files['cover-art.md']);
  if (art.artStyle) next.artStyle = normalize(art.artStyle, D.ART_STYLES);
  if (art.lens) next.lens = normalize(art.lens, D.LENSES);
  if (art.palette) {
    const colors = splitList(art.palette);
    const known = D.PALETTES.find((pl) => pl.colors.join(',').toLowerCase() === colors.join(',').toLowerCase());
    next.palette = known ? known.name : colors.join(', ');
  }

  /* Keep the concept — you're borrowing the sound, not the subject. */
  if (!next.referenceSlugs.includes(ex.slug)) next.referenceSlugs.push(ex.slug);

  state = next;
  render();
  showTab('compose');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Remixing the sound of "' + ex.title + '" — now write your own concept');
}

/* ── Library ─────────────────────────────────────────────────────────────── */

let viewer = { title: 'Viewer', files: {}, active: null, remix: null };

function showInViewer(title, files, active, remixSource) {
  viewer = {
    title, files,
    active: active || Object.keys(files)[0],
    remix: remixSource !== undefined ? remixSource : viewer.remix
  };
  $('#viewerTitle').textContent = title;
  $('#remixBtn').hidden = !viewer.remix;
  const tabs = $('#viewerTabs');
  tabs.innerHTML = '';
  Object.keys(files).forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = name;
    b.setAttribute('aria-pressed', String(name === viewer.active));
    b.addEventListener('click', () => showInViewer(title, files, name, viewer.remix));
    tabs.appendChild(b);
  });
  $('#viewerBody').textContent = files[viewer.active] || '';
}

function renderLibrary() {
  const exGrid = $('#exampleGrid');
  exGrid.innerHTML = '';
  if (!LIB.examples.length) {
    exGrid.innerHTML = '<div class="empty"><strong>No example packs yet</strong>Save your first good result from the Decode tab.</div>';
  }
  LIB.examples.forEach((ex) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pack-card';
    card.innerHTML =
      '<h3>' + escapeHtml(ex.title) + '</h3>' +
      '<p>' + escapeHtml(ex.blurb) + '</p>' +
      '<div class="tags">' +
        (ex.spec.Key ? '<span class="tag key">' + escapeHtml(ex.spec.Key) + '</span>' : '') +
        (ex.spec.Tempo ? '<span class="tag bpm">' + escapeHtml(ex.spec.Tempo) + '</span>' : '') +
        (ex.spec.Style ? '<span class="tag">' + escapeHtml(ex.spec.Style) + '</span>' : '') +
      '</div>';
    card.addEventListener('click', () => showInViewer('examples/' + ex.slug, ex.files, null, ex));
    exGrid.appendChild(card);
  });

  const tGrid = $('#templateGrid');
  tGrid.innerHTML = '';
  D.FILES.forEach((spec) => {
    const body = LIB.templates[spec.id] || '';
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pack-card';
    card.innerHTML =
      '<h3>' + spec.icon + '&nbsp; ' + escapeHtml(spec.id) + '</h3>' +
      '<p>' + escapeHtml(body.split('\n').slice(0, 3).join(' ').slice(0, 130)) + '</p>' +
      '<div class="tags"><span class="tag">' + spec.required.length + ' required markers</span></div>';
    card.addEventListener('click', () => {
      const one = {};
      one[spec.id] = body;
      showInViewer('templates/' + spec.id, one, null, null);
    });
    tGrid.appendChild(card);
  });
}

/* ── Recipes ─────────────────────────────────────────────────────────────── */

function renderRecipes() {
  const host = $('#recipeGrid');
  host.innerHTML = '';
  D.RECIPES.forEach((r) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pack-card';
    card.innerHTML =
      '<h3>' + escapeHtml(r.name) + '</h3>' +
      '<p>' + escapeHtml(r.blurb) + '</p>' +
      '<div class="tags">' +
        '<span class="tag key">' + escapeHtml(r.patch.key) + '</span>' +
        '<span class="tag bpm">' + r.patch.bpm + ' BPM</span>' +
        '<span class="tag">' + escapeHtml(r.patch.genres[0]) + '</span>' +
      '</div>';
    card.addEventListener('click', () => { applyPatch(r.patch); toast('Loaded "' + r.name + '"'); });
    host.appendChild(card);
  });
}

/* ── Tabs + theme ────────────────────────────────────────────────────────── */

function showTab(name) {
  $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('.panel').forEach((p) => {
    if (p.id === 'panel-' + name) p.setAttribute('data-active', '');
    else p.removeAttribute('data-active');
  });
  /* The share param has already been consumed into state by now, so drop it. */
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(LS_THEME, theme); } catch (e) { /* ignore */ }
}

/* ── Tap tempo ───────────────────────────────────────────────────────────── */

let taps = [];
function tap() {
  const now = performance.now();
  if (taps.length && now - taps[taps.length - 1] > 2500) taps = [];
  taps.push(now);
  if (taps.length > 6) taps.shift();
  flashPulse();
  if (taps.length < 2) { toast('Keep tapping…'); return; }
  const gaps = taps.slice(1).map((t, i) => t - taps[i]);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const bpm = Math.round(60000 / avg);
  state.bpm = Math.min(180, Math.max(50, bpm));
  render();
}

function flashPulse() {
  const p = $('#pulse');
  p.classList.add('on');
  setTimeout(() => p.classList.remove('on'), 110);
}

/* ── Wiring ──────────────────────────────────────────────────────────────── */

function init() {
  /* Only stamp the root when the viewer picked a theme; otherwise leave it to
     prefers-color-scheme, or to a stamp the host set for us. */
  try {
    const saved = localStorage.getItem(LS_THEME);
    if (saved) applyTheme(saved);
  } catch (e) { /* storage blocked — the media query still applies */ }

  fillSelect($('#key'), D.KEYS, state.key);
  fillSelect($('#timeSignature'), D.TIME_SIGNATURES, state.timeSignature);
  fillSelect($('#arrangement'), D.ARRANGEMENTS.map((a) => a.name), state.arrangement);
  fillSelect($('#vocalPlan'), D.VOCAL_PLANS, state.vocalPlan);
  fillSelect($('#artStyle'), D.ART_STYLES, state.artStyle);
  fillSelect($('#lens'), D.LENSES, state.lens);
  fillSelect($('#palette'), D.PALETTES.map((p) => p.name), state.palette);

  const langSel = $('#language');
  langSel.innerHTML = '';
  D.LANGUAGE_MODES.forEach((l) => {
    const o = document.createElement('option');
    o.value = l.id;
    o.textContent = l.label;
    langSel.appendChild(o);
  });

  /* Restore: share link wins over localStorage. */
  const shared = (location.hash.match(/[?&]s=([^&]+)/) || [])[1];
  if (shared) {
    try { state = Object.assign(structuredClone(D.DEFAULT_STATE), decodeState(shared)); toast('Loaded from share link'); }
    catch (e) { /* malformed link — fall through to defaults */ }
  } else {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_STATE) || 'null');
      if (saved) state = Object.assign(structuredClone(D.DEFAULT_STATE), saved);
    } catch (e) { /* ignore */ }
  }

  const bind = (sel, key, transform) => {
    $(sel).addEventListener('input', (e) => {
      state[key] = transform ? transform(e.target.value) : e.target.value;
      render();
    });
  };
  bind('#concept', 'concept');
  bind('#extraNotes', 'extraNotes');
  bind('#bpm', 'bpm', Number);
  ['key', 'timeSignature', 'arrangement', 'vocalPlan', 'language', 'artStyle', 'lens', 'palette']
    .forEach((k) => bind('#' + k, k));

  $('#tapBtn').addEventListener('click', tap);
  $('#diceBtn').addEventListener('click', () => {
    state.concept = pick(D.CONCEPT_SEEDS);
    render();
  });
  $('#resetBtn').addEventListener('click', () => { applyPatch(D.DEFAULT_STATE); toast('Reset'); });

  $('#copyPromptBtn').addEventListener('click', () => copy(buildPrompt(state), 'Prompt'));
  $('#downloadPromptBtn').addEventListener('click', () => {
    download((slugify(state.concept) || 'gem-prompt') + '.md', buildPrompt(state));
  });
  $('#shareBtn').addEventListener('click', () => {
    const url = location.href.split('#')[0] + '#compose?s=' + encodeState(state);
    copy(url, 'Share link');
  });
  $('#toDecodeBtn').addEventListener('click', () => { showTab('decode'); $('#decodeIn').focus(); });

  $('#savePresetBtn').addEventListener('click', () => {
    const name = prompt('Name this setup:', state.concept.slice(0, 40) || 'Untitled');
    if (!name) return;
    const list = loadPresets();
    list.unshift({ name, state: structuredClone(state) });
    savePresets(list.slice(0, 20));
    renderPresets();
    toast('Saved "' + name + '"');
  });

  $('#decodeIn').addEventListener('input', renderDecode);
  $('#clearDecodeBtn').addEventListener('click', () => {
    $('#decodeIn').value = '';
    $('#slugIn').value = '';
    renderDecode();
  });
  $('#downloadPackBtn').addEventListener('click', async () => {
    const slug = slugify($('#slugIn').value || 'untitled') || 'untitled';
    const files = D.FILES.filter((spec) => decoded.files[spec.id]);
    if (!files.length) { toast('Nothing to download'); return; }

    if (await resolveDownloads()) {
      /* Mediated saves prompt one at a time, so go sequentially and stop as
         soon as the viewer declines rather than stacking more prompts. */
      for (const spec of files) {
        const ok = await download(slug + '--' + spec.id, decoded.files[spec.id] + '\n');
        if (!ok) return;
      }
      return;
    }

    /* Browsers throttle back-to-back downloads; space them out. */
    files.forEach((spec, i) => {
      setTimeout(() => download(slug + '--' + spec.id, decoded.files[spec.id] + '\n'), i * 220);
    });
    toast('Downloading ' + files.length + ' file(s)');
  });
  $('#copyShellBtn').addEventListener('click', () => copy(packShellCommand(), 'Shell command'));

  $('#copyInstructionsBtn').addEventListener('click', () => copy(LIB.gem.role + '\n\n' + LIB.gem.rules + '\n\n' + LIB.gem.task, 'Gem instructions'));
  $('#remixBtn').addEventListener('click', () => { if (viewer.remix) remixFromExample(viewer.remix); });
  $('#copyViewerBtn').addEventListener('click', () => copy(viewer.files[viewer.active] || '', viewer.active || 'File'));

  $('#instructionsOut').textContent = LIB.gem.role + '\n\n' + LIB.gem.rules + '\n\n' + LIB.gem.task;

  $$('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); showTab(a.dataset.goto); }));

  /* Keyboard: T taps tempo, C copies the prompt, 1–4 switch tabs. */
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const tabs = ['compose', 'decode', 'library', 'setup'];
    if (e.key >= '1' && e.key <= '4') { showTab(tabs[Number(e.key) - 1]); return; }
    if (e.key.toLowerCase() === 't') { tap(); return; }
    if (e.key.toLowerCase() === 'c') { copy(buildPrompt(state), 'Prompt'); }
  });

  $('#themeToggle').addEventListener('click', () => {
    const stamped = document.documentElement.getAttribute('data-theme');
    const current = stamped || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  renderRecipes();
  renderLibrary();
  renderPresets();
  render();

  const initialTab = (location.hash.replace('#', '').split('?')[0]) || 'compose';
  showTab(['compose', 'decode', 'library', 'setup'].includes(initialTab) ? initialTab : 'compose');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
