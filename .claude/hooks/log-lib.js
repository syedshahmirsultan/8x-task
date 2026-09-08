// Shared helpers for the prompt/response capture hooks.
// Kept dependency-free (no npm install step) since hooks must "just work".
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function readStdinJson() {
  const data = fs.readFileSync(0, 'utf8');
  return JSON.parse(data);
}

// Neither UserPromptSubmit nor Stop actually includes a `model` field in this
// build of Claude Code (verified by dumping raw stdin), despite the docs.
// The only place the model name shows up is on assistant lines in the
// transcript (message.model), so we recover it from there.
function resolveModelFromTranscript(transcriptPath) {
  try {
    const stat = fs.statSync(transcriptPath);
    const size = Math.min(stat.size, 300000);
    const fd = fs.openSync(transcriptPath, 'r');
    const buf = Buffer.alloc(size);
    fs.readSync(fd, buf, 0, size, stat.size - size);
    fs.closeSync(fd);
    const lines = buf.toString('utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let obj;
      try {
        obj = JSON.parse(lines[i]);
      } catch (e) {
        continue;
      }
      const msg = obj.message || obj;
      if ((obj.type === 'assistant' || msg.role === 'assistant') && msg.model) {
        return msg.model;
      }
    }
  } catch (e) {
    /* transcript missing/unreadable; caller falls back further */
  }
  return null;
}

function lastAssistantText(transcriptPath) {
  try {
    const stat = fs.statSync(transcriptPath);
    const size = Math.min(stat.size, 300000);
    const fd = fs.openSync(transcriptPath, 'r');
    const buf = Buffer.alloc(size);
    fs.readSync(fd, buf, 0, size, stat.size - size);
    fs.closeSync(fd);
    const lines = buf.toString('utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let obj;
      try {
        obj = JSON.parse(lines[i]);
      } catch (e) {
        continue;
      }
      const msg = obj.message || obj;
      if (obj.type === 'assistant' || msg.role === 'assistant') {
        if (Array.isArray(msg.content)) {
          return msg.content
            .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
            .map((b) => b.text)
            .join('\n');
        }
        if (typeof msg.content === 'string') return msg.content;
      }
    }
  } catch (e) {
    /* ignore */
  }
  return null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function filenameTimestamp(d) {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`
  );
}

function resolveProjectDir(argv) {
  return argv[2] || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

// Worktrees each have their own working directory, so a path relative to
// CLAUDE_PROJECT_DIR lands in a different place per worktree. Git's
// "common dir" is shared by the main checkout and every worktree cloned
// from it, so resolving through that gives one shared log location
// regardless of which worktree a session runs in.
function resolveSharedRoot(projectDir) {
  try {
    const gitCommonDir = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return path.dirname(gitCommonDir);
  } catch (e) {
    return projectDir;
  }
}

function statePathFor(projectDir, sessionId) {
  const stateDir = path.join(projectDir, '.claude', 'hook-state');
  fs.mkdirSync(stateDir, { recursive: true });
  return path.join(stateDir, `${sessionId}.json`);
}

function loadState(statePath) {
  if (!fs.existsSync(statePath)) return null;
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function saveState(statePath, state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function headerBlock(state) {
  const dateOnly = state.firstPromptTime.slice(0, 10);
  const shortId = state.sessionId.slice(0, 8);
  return (
    `---\n` +
    `session_id: ${state.sessionId}\n` +
    `date: ${dateOnly}\n` +
    `author: ${state.author}\n` +
    `model: ${state.model}\n` +
    `tool: claude-code\n` +
    `project: ${state.project}\n` +
    `total_exchanges: ${state.num}\n` +
    `first_prompt_time: ${state.firstPromptTime}\n` +
    `last_prompt_time: ${state.lastPromptTime}\n` +
    `---\n\n` +
    `# Session Log - ${dateOnly}\n\n` +
    `Session: \`${shortId}\` | Project: \`${state.project}\` | Author: \`${state.author}\`\n\n` +
    `---\n`
  );
}

function rewriteHeader(state) {
  const content = fs.readFileSync(state.logFile, 'utf8');
  const marker = '\n[LOG_ENTRY';
  const idx = content.indexOf(marker);
  const body = idx === -1 ? '' : content.slice(idx);
  fs.writeFileSync(state.logFile, headerBlock(state) + body);
}

function writeHeader(state) {
  fs.writeFileSync(state.logFile, headerBlock(state));
}

function appendEntry(state, { type, timestamp, model, text }) {
  const entry =
    `\n[LOG_ENTRY type=${type} num=${state.num} session=${state.sessionId}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${model}\n\n` +
    `${text}\n\n`;
  fs.appendFileSync(state.logFile, entry);
}

module.exports = {
  readStdinJson,
  resolveModelFromTranscript,
  lastAssistantText,
  filenameTimestamp,
  resolveProjectDir,
  resolveSharedRoot,
  statePathFor,
  loadState,
  saveState,
  headerBlock,
  writeHeader,
  rewriteHeader,
  appendEntry,
};
