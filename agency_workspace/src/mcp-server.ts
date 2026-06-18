import * as fs from 'fs/promises';
import * as path from 'path';

export class McpServer {
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
  }

  async handleMessage(line: string): Promise<string | null> {
    if (!line.trim()) return null;
    try {
      const req = JSON.parse(line);
      if (req.method === 'initialize') {
        return JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'devio-agency', version: '0.1.0' }
          }
        });
      } else if (req.method === 'tools/list') {
        return JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: {
            tools: [
              {
                name: 'get_agency_state',
                description: 'Returns the current agency state',
                inputSchema: { type: 'object', properties: {} }
              },
              {
                name: 'read_inbox',
                description: 'Retrieves the latest messages from inbox.jsonl',
                inputSchema: { type: 'object', properties: {} }
              }
            ]
          }
        });
      } else if (req.method === 'tools/call') {
        const tool = req.params?.name;
        if (tool === 'get_agency_state') {
          const statePath = path.join(this.workspaceRoot, 'agency_workspace', 'state.json');
          const state = await fs.readFile(statePath, 'utf8').catch(() => '{}');
          return JSON.stringify({
            jsonrpc: '2.0',
            id: req.id,
            result: { content: [{ type: 'text', text: state }] }
          });
        } else if (tool === 'read_inbox') {
          const inboxPath = path.join(this.workspaceRoot, 'agency_workspace', 'inbox.jsonl');
          const inbox = await fs.readFile(inboxPath, 'utf8').catch(() => '');
          return JSON.stringify({
            jsonrpc: '2.0',
            id: req.id,
            result: { content: [{ type: 'text', text: inbox }] }
          });
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}

// Standalone execution wrapper
if (require.main === module) {
  const readline = require('readline');
  const server = new McpServer();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  rl.on('line', async (line: string) => {
    const response = await server.handleMessage(line);
    if (response) {
      console.log(response);
    }
  });
}
