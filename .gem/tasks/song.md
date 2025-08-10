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
