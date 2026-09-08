#!/usr/bin/env node
// Stop hook: logs the final assistant response to .agent-logs/.
// Fires automatically at the end of every turn (wired in .claude/settings.json).
// Receives transcript_path on stdin; used to recover the model name (and, as
// a fallback, the response text) since this build's Stop payload omits `model`.
const lib = require('./log-lib');

function main() {
  const input = lib.readStdinJson();
  const sessionId = input.session_id || 'unknown-session';
  const projectDir = lib.resolveProjectDir(process.argv);
  const statePath = lib.statePathFor(projectDir, sessionId);

  const state = lib.loadState(statePath);
  if (!state) {
    // No matching UserPromptSubmit entry for this session; nothing to pair.
    return;
  }

  const responseText =
    input.last_assistant_message || lib.lastAssistantText(input.transcript_path) || '';
  const model =
    input.model || lib.resolveModelFromTranscript(input.transcript_path) || state.model || 'unknown-model';
  const nowIso = new Date().toISOString();

  state.model = model;

  lib.appendEntry(state, { type: 'RESPONSE', timestamp: nowIso, model, text: responseText });
  lib.rewriteHeader(state);
  lib.saveState(statePath, state);
}

main();
