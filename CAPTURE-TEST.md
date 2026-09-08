# Capture Test

## Tool and model

- **Tool:** Claude Code (desktop app, Code tab)
- **Model:** Sonnet 5 (`claude-sonnet-5`). One model handles both planning and
  execution — Claude Code does not split planning and execution across two
  different models by default, and none was configured for this session.

## Mechanism

Claude Code hooks, wired in `.claude/settings.json`:

- `UserPromptSubmit` — fires before every prompt is processed, invoking
  `node .claude/hooks/capture-prompt.js`. Appends a `PROMPT` entry.
- `Stop` — fires when Claude finishes responding, invoking
  `node .claude/hooks/capture-response.js`. Appends a `RESPONSE` entry.

Both scripts share `.claude/hooks/log-lib.js` for the log file/header/state
handling. State (which log file and entry number a session is on) is kept
per-session in `.claude/hook-state/<session_id>.json` (gitignored — it's
bookkeeping, not part of the log).

Config files changed: `.claude/settings.json` (hook wiring),
`.claude/hooks/capture-prompt.js`, `.claude/hooks/capture-response.js`,
`.claude/hooks/log-lib.js`, `.gitignore`.

## Log files the canaries landed in

- Session 1 (this session): [.agent-logs/2026-09-08_17-09-17_1102df45.md](.agent-logs/2026-09-08_17-09-17_1102df45.md)
- Session 2 (independent second Claude Code session, same repo): [.agent-logs/2026-09-08_17-15-16_ca1503b8.md](.agent-logs/2026-09-08_17-15-16_ca1503b8.md)

## Canary entries (raw)

### Session 1

```
[LOG_ENTRY type=PROMPT num=1 session=1102df45-1ab7-498f-a486-0922085dba29]
timestamp: 2026-09-08T17:09:17.131Z
model: unknown-model

CAPTURE TEST — 8x assignment, Syed Shahmir Sultan
```

```
[LOG_ENTRY type=RESPONSE num=1 session=1102df45-1ab7-498f-a486-0922085dba29]
timestamp: 2026-09-08T17:10:20.669Z
model: claude-sonnet-5

The `Stop` hook for this turn will fire once I finish responding, which is what I need to see the exact JSON schema this version of Claude Code actually sends. I've added temporary debug logging to capture it — I'll inspect it as soon as you send your next message.

**Status:** canary 1 (this session) landed correctly in [.agent-logs/2026-09-08_17-09-17_1102df45.md](.agent-logs/2026-09-08_17-09-17_1102df45.md), except the `model` field shows `unknown-model` — the docs' claim that `UserPromptSubmit` includes a `model` field doesn't match what this build actually sends. I'll fix that once I see the real payload.

Go ahead and send me anything (even just "ok") so this turn ends and the `Stop` hook fires — then I'll fix the model detection and move on to the second-session test.
```

(`model: unknown-model` on the session-1 canary prompt is genuine — it was
captured *before* the model-resolution bug below was fixed. Left as-is per
the instructions not to edit entries after the fact; `PROMPT num=3` in the
same file, captured after the fix, correctly shows `claude-sonnet-5`.)

### Session 2 (independent session)

```
[LOG_ENTRY type=PROMPT num=1 session=ca1503b8-e188-4ac0-918c-21ce5adef618]
timestamp: 2026-09-08T17:15:16.153Z
model: unknown-model

CAPTURE TEST — 8x assignment, Shahmir Test
```

```
[LOG_ENTRY type=RESPONSE num=1 session=ca1503b8-e188-4ac0-918c-21ce5adef618]
timestamp: 2026-09-08T17:15:20.297Z
model: claude-sonnet-5

This looks like a test/capture message rather than an actual task request — just confirming: is there something specific you'd like me to do with this, or was this a connectivity/setup check?
```

(Session 2's canary was sent after the fix landed in `.claude/hooks/`, but
that session had no prior assistant turn in its own transcript yet at
`UserPromptSubmit` time, so `PROMPT num=1` still legitimately has no model to
resolve — see "Known limitation" below.)

## What I tried first that didn't work

1. **Trusted the hooks docs' JSON schema at face value.** The official docs
   (fetched during setup) show `model` as a field on both `UserPromptSubmit`
   and `Stop` payloads. In this build (`claude-code 2.1.260`), neither event
   actually includes a `model` field — confirmed by temporarily dumping raw
   stdin to a scratch file inside the hooks and inspecting it. Fixed by
   resolving the model from the session transcript instead (the last
   assistant line's `message.model`).

2. **A real bug the live canary test caught:** `capture-prompt.js` originally
   computed `model = input.model || 'unknown-model'` and then unconditionally
   wrote that into the per-session state. Since `input.model` is never
   present, every second-and-later prompt in a session overwrote an
   already-correctly-resolved model with the literal string
   `"unknown-model"`, clobbering good data. Caught by watching
   `.agent-logs/2026-09-08_17-09-17_1102df45.md` after a real second prompt
   in this session and seeing the model regress. Fixed by threading a proper
   fallback chain (event field → transcript lookup → previously-known state)
   through `log-lib.js` and using it in both scripts.

3. **My own diagnostic dry-run gave a false negative.** While testing the fix
   with a synthetic fake transcript, I passed a Git-Bash-style path
   (`/c/8x-task/...`) to a `node -e` one-liner run from the Bash tool. Native
   Windows Node resolved that as `C:\c\8x-task\...` and threw `ENOENT`, so the
   model-resolution test appeared to fail. This was a bug in my test
   harness, not in the hook — re-running the same test with a proper
   `C:/8x-task/...` path resolved the model correctly, and the real hook
   invocations (which receive genuine Windows paths from Claude Code itself)
   had been working correctly the whole time.

## Known limitation

Neither hook event carries a `model` field in this Claude Code build, and a
brand-new session's very first `UserPromptSubmit` fires before any assistant
message exists in the transcript. In that one case (`PROMPT num=1` on a
session's first turn only) the model is genuinely unknown at capture time and
is logged as `unknown-model` rather than guessed. Every subsequent entry in
that session resolves correctly once at least one assistant turn exists.
