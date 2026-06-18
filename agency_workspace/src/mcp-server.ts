import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class McpServerWrapper {
  public server: Server;
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
    this.server = new Server({
      name: 'devio-agency',
      version: '0.1.0'
    }, {
      capabilities: { tools: {} }
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
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
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      if (request.params.name === 'get_agency_state') {
        const statePath = path.join(this.workspaceRoot, 'agency_workspace', 'state.json');
        const state = await fs.readFile(statePath, 'utf8').catch(() => '{}');
        return { content: [{ type: 'text', text: state }] };
      }
      if (request.params.name === 'read_inbox') {
        const inboxPath = path.join(this.workspaceRoot, 'agency_workspace', 'inbox.jsonl');
        const inbox = await fs.readFile(inboxPath, 'utf8').catch(() => '');
        return { content: [{ type: 'text', text: inbox }] };
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

if (require.main === module) {
  const wrapper = new McpServerWrapper();
  wrapper.run().catch(console.error);
}
