import { describe, it, expect } from 'vitest';
import { McpServer } from './mcp-server';

describe('McpServer', () => {
  it('should respond to initialize request', async () => {
    const server = new McpServer();
    const req = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {}
    };
    
    const responseStr = await server.handleMessage(JSON.stringify(req));
    expect(responseStr).not.toBeNull();
    
    const response = JSON.parse(responseStr!);
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);
    expect(response.result.protocolVersion).toBe('2024-11-05');
    expect(response.result.serverInfo.name).toBe('devio-agency');
  });

  it('should list tools', async () => {
    const server = new McpServer();
    const req = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    
    const responseStr = await server.handleMessage(JSON.stringify(req));
    const response = JSON.parse(responseStr!);
    expect(response.result.tools.length).toBe(2);
    expect(response.result.tools[0].name).toBe('get_agency_state');
  });
});
