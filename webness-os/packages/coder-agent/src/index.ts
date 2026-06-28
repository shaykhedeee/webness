import { WebSocketServer, WebSocket } from 'ws';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const PORT = parseInt(process.env.CODER_AGENT_PORT || '8081', 10);
const wss = new WebSocketServer({ port: PORT });

// Dual Mode configuration
const EXECUTION_MODE = process.env.CODER_EXECUTION_MODE || 'sandbox'; // 'host' or 'sandbox'
const ALLOWED_COMMAND_PREFIXES = ['npm run', 'npm install', 'git status', 'git diff', 'node', 'npm test'];
const WORKSPACE_DIR = path.resolve(process.cwd());

console.log(`Coder Agent Daemon running in [${EXECUTION_MODE.toUpperCase()}] mode on ws://localhost:${PORT}`);

type CommandMessage = {
  id: string;
  type: 'execute' | 'read_file' | 'write_file';
  payload: any;
};

// Security helper: prevent directory traversal outside workspace
function validateSafePath(targetPath: string): string {
  const resolved = path.resolve(WORKSPACE_DIR, targetPath);
  if (!resolved.startsWith(WORKSPACE_DIR)) {
    throw new Error('Security Violation: Attempted file access outside workspace directory boundary.');
  }
  return resolved;
}

// Security helper: restrict command execution in sandbox mode
function validateCommand(command: string) {
  if (EXECUTION_MODE === 'host') return; // Full access under developer-approval host mode

  const isAllowed = ALLOWED_COMMAND_PREFIXES.some(prefix => command.trim().startsWith(prefix));
  if (!isAllowed) {
    throw new Error(`Security Violation: Command "${command}" is blocked in sandbox mode. Allowed commands: ${ALLOWED_COMMAND_PREFIXES.join(', ')}`);
  }
}

wss.on('connection', (ws: WebSocket) => {
  console.log(`Dashboard connected to Coder Agent (Mode: ${EXECUTION_MODE})`);

  ws.on('message', async (data: string) => {
    try {
      const message: CommandMessage = JSON.parse(data);
      console.log(`Received command: ${message.type}`);

      let result;
      switch (message.type) {
        case 'execute':
          result = await handleExecute(message.payload);
          break;
        case 'read_file':
          result = await handleReadFile(message.payload);
          break;
        case 'write_file':
          result = await handleWriteFile(message.payload);
          break;
        default:
          throw new Error('Unknown command type');
      }

      ws.send(JSON.stringify({ id: message.id, status: 'success', data: result }));
    } catch (error: any) {
      console.error('Error processing message:', error);
      let messageId = undefined;
      try {
        const parsed = JSON.parse(data);
        messageId = parsed.id;
      } catch {}
      ws.send(JSON.stringify({ id: messageId, status: 'error', error: error.message }));
    }
  });
});

async function handleExecute(payload: { command: string, cwd?: string }) {
  const { command, cwd = process.cwd() } = payload;
  validateCommand(command);
  
  // Verify execution CWD is within workspace boundaries
  const targetCwd = validateSafePath(cwd);

  console.log(`Executing: ${command} in ${targetCwd}`);
  const { stdout, stderr } = await execAsync(command, { cwd: targetCwd });
  return { stdout, stderr };
}

async function handleReadFile(payload: { filePath: string }) {
  const targetPath = validateSafePath(payload.filePath);
  const content = await fs.readFile(targetPath, 'utf-8');
  return { content };
}

async function handleWriteFile(payload: { filePath: string, content: string }) {
  const targetPath = validateSafePath(payload.filePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, payload.content, 'utf-8');
  return { success: true };
}

