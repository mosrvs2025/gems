# Task: Generate Song Pack
When the user asks for a song:
1) Ask NO clarifying questions unless key/tempo are ambiguous. If ambiguous, choose and proceed.
2) Produce FOUR outputs that match `/templates` exactly.
3) Reflect any user constraints (genre, mood, topic, languages).
4) If asked to iterate, only rewrite the file(s) specified.

## Output Format (exact)
<<<FILE:title.md>>>
{title.md content}
<<<END FILE>>>

<<<FILE:description.md>>>
{description.md content}
<<<END FILE>>>

<<<FILE:lyrics.md>>>
{lyrics.md content}
<<<END FILE>>>

<<<FILE:cover-art.md>>>
{cover-art.md content}
<<<END FILE>>>

## Cover image
After writing `cover-art.md`, immediately generate the album cover with your image tool — square, 1024×1024 — and display it inline. If image generation is unavailable in the current interface, return the prompt labeled **[IMAGE_PENDING]** so it can be generated elsewhere.

## Iteration requests
If the request names specific files ("rewrite ONLY lyrics.md", "swap the key to B minor"):
- Return only those files, in the same fenced format.
- Keep every other decision frozen. A key change updates `description.md` and any lyric line whose vowels no longer sit well — nothing else.
- Do not include a diff, a summary of what changed, or the untouched files.
