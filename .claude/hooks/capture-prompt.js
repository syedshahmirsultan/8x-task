#!/usr/bin/env node
// UserPromptSubmit hook: logs the verbatim prompt to .agent-logs/.
// Fires automatically on every prompt submission (wired in .claude/settings.json).
const fs = require('fs');
const path = require('path');
const lib = require('./log-lib');

function main() {
  const input = lib.readStdinJson();
  const sessionId = input.session_id || 'unknown-session';
  // This build sends the prompt text as `prompt`, not `user_prompt` (verified
  // from raw stdin); keep both in case that changes across versions.
  const prompt = input.user_prompt !== undefined ? input.user_prompt : (input.prompt || '');
  const projectDir = lib.resolveProjectDir(process.argv);
  const sharedRoot = lib.resolveSharedRoot(projectDir);

  const logsDir = path.join(sharedRoot, '.agent-logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const statePath = lib.statePathFor(sharedRoot, sessionId);
  const now = new Date();
  const nowIso = now.toISOString();

  // Neither event carries a `model` field in this build. The transcript only
  // gains an assistant line (with its model) after the first response, so
  // entry 1's prompt may legitimately have no model info yet.
  const transcriptModel = lib.resolveModelFromTranscript(input.transcript_path);

  let state = lib.loadState(statePath);
  if (!state) {
    const shortId = sessionId.slice(0, 8);
    const fileName = `${lib.filenameTimestamp(now)}_${shortId}.md`;
    state = {
      sessionId,
      logFile: path.join(logsDir, fileName),
      num: 0,
      firstPromptTime: nowIso,
      lastPromptTime: nowIso,
      model: input.model || transcriptModel || 'unknown-model',
      project: path.basename(projectDir),
      author: process.env.AGENT_LOG_AUTHOR || 'syedshahmirsultan',
    };
    lib.writeHeader(state);
  }

  const model = input.model || transcriptModel || state.model || 'unknown-model';

  state.num += 1;
  state.lastPromptTime = nowIso;
  state.model = model;

  lib.appendEntry(state, { type: 'PROMPT', timestamp: nowIso, model, text: prompt });
  lib.rewriteHeader(state);
  lib.saveState(statePath, state);
}

main();
