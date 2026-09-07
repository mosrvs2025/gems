# Gem Song Starter

A prompt system for a Google **Gem** that writes song packs — plus **Gem Studio**, a
browser tool for composing the prompts, checking what comes back, and growing the
repo's house style over time.

**→ [Open Gem Studio](https://mosrvs2025.github.io/gems/)** · or run it locally with `npm run dev`

---

## What's here

| | |
|---|---|
| **`docs/`** | Gem Studio — compose prompts, decode replies, browse the library. No build step, no dependencies. |
| **`.gem/`** | The instructions you paste into your Gem: role, global rules, and the song task. |
| **`templates/`** | The contract. Four files every reply must match, structurally, every time. |
| **`examples/`** | House references. Finished packs the Gem imitates. More of these = better output. |
| **`GEM_INSTRUCTIONS.md`** | The `.gem/` files concatenated, ready to paste. Generated — don't edit it directly. |

## The loop

```
Compose a prompt  →  send to your Gem  →  paste the reply into Decode
        ↑                                            │
        └──────── save the good ones to examples/ ───┘
```

The Gem has no memory of what "good" looks like beyond what you show it. Every pack
you commit into `examples/` tightens the house style, so round five is meaningfully
better than round one. That flywheel is the whole point of the repo.

## Quick start

1. **Set up the Gem.** In Gemini, create a new Gem and paste
   [`GEM_INSTRUCTIONS.md`](GEM_INSTRUCTIONS.md) into its Instructions box. Attach
   `templates/` and a couple of `examples/` packs as knowledge files.
2. **Compose.** Open [Gem Studio](https://mosrvs2025.github.io/gems/), pick a recipe or
   dial in your own genre / key / tempo / language / cover-art direction, and hit **Copy**.
3. **Send it.** Paste into the Gem. It returns four files in a fenced format.
4. **Decode.** Paste the reply into the Decode tab. It splits the files, checks them
   against `/templates`, flags unfilled placeholders and drifted structure, and warns
   if the tempo or key doesn't match what you asked for.
5. **Keep the good ones.** Decode hands you a shell command that writes the pack into
   `examples/<slug>/`. Commit it. The next song gets better.

## Gem Studio

**Compose** — six starting recipes; genre, mood and instrument chips; a BPM slider with
tap tempo (or press <kbd>T</kbd> in time); key, time signature and arrangement map;
bilingual EN/ES control; cover-art style, lens and palette. The prompt rebuilds live as
you touch anything, with a word and character count.

**Iteration mode** — deselect files under *Output & constraints* and the prompt flips to
"rewrite ONLY these, hold everything else fixed." That's how you fix a weak bridge
without losing a hook you liked.

**Decode** — parses `<<<FILE:…>>>` blocks (and falls back to heading detection when the
Gem forgets the fences), then runs the same checks CI runs: required markers present,
no leftover `[placeholders]`, choruses identical, tempo and key honored.

**Library** — every template and example rendered in place. **Remix →** on any example
pulls its Sonic Architecture straight back into the composer and adds it as a house
reference, so you can borrow a sound without borrowing the subject.

Everything persists to `localStorage`; **Copy share link** encodes the whole setup into
a URL. Keyboard: <kbd>1</kbd>–<kbd>4</kbd> switch tabs, <kbd>T</kbd> taps tempo,
<kbd>C</kbd> copies the prompt.

## Deploying

`.github/workflows/pages.yml` publishes `docs/` on every push to `main`. It needs
Pages switched on once, by hand:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

That one-time step can't be automated — creating a Pages site requires
`administration: write`, which the workflow's `GITHUB_TOKEN` is never granted. Once
it's on, re-run the *Deploy Gem Studio* workflow (Actions → Deploy Gem Studio → Run
workflow) and the site goes live at the link above.

## Local development

```bash
npm run dev      # build the library, serve docs/ at http://localhost:4173
npm run build    # regenerate docs/assets/library.js + GEM_INSTRUCTIONS.md
npm run check    # what CI runs: generated files current, examples match templates
```

`docs/` is plain HTML, CSS and classic scripts, so `docs/index.html` also works by
double-clicking it. There is nothing to install — Node is only used for the two
generator scripts.

## Editing the system

- **Templates are the contract.** Changing a section name in `templates/` changes what
  every future reply must look like — and invalidates the validator's expectations in
  `scripts/validate-packs.mjs` and `docs/assets/data.js`. Small changes here are big
  consistency gains; churn here is expensive.
- **Instructions live in `.gem/`.** `GEM_INSTRUCTIONS.md` and `docs/assets/library.js`
  are generated from them. Edit the source, then run `npm run build` and commit both.
- **The studio's vocabulary** — genres, moods, instruments, palettes, recipes — is all in
  `docs/assets/data.js`. Add to the arrays; nothing else needs to change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the pack format.
