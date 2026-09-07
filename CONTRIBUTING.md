# Contributing

## Example packs

Every folder in `examples/` is a house reference the Gem learns from, so it has to be
clean. `npm run check` enforces all of this in CI.

- Folder name: kebab-case, derived from the title (`city-of-echoes`).
- Exactly four files, named exactly: `title.md`, `description.md`, `lyrics.md`, `cover-art.md`.
- Section headers and their order must match `/templates` verbatim.
- No template placeholders left behind — no `[line]`, no `[BPM]`, no `{TITLE}`.
  The only brackets that survive are real `[Section]` headers in `lyrics.md`.
- `description.md` must carry a complete **Sonic Architecture** block with real values.

The fastest way to add one: paste the Gem's reply into the Decode tab of
[Gem Studio](https://mosrvs2025.github.io/gems/), fix whatever it flags, then use the
shell command it generates.

## Changing the prompt system

- Instructions are edited in `.gem/`, never in the generated `GEM_INSTRUCTIONS.md`.
  Run `npm run build` afterwards and commit the regenerated files — CI fails if they drift.
- Changing `/templates` is a breaking change to the contract. If you do it, update the
  required markers in both `scripts/validate-packs.mjs` and `docs/assets/data.js`, and
  bring the existing example packs along.

## Pull requests

- Brief summary and why.
- No large binary assets — cover art lives as a prompt in `cover-art.md`, not as a file.
- Run `npm run check` before pushing.
