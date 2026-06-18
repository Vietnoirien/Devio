import { describe, it, expect, vi } from 'vitest';
import { McpServerWrapper } from './mcp-server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
    class MockServer {
        setRequestHandler = vi.fn();
        connect = vi.fn();
    }
    return {
        Server: MockServer
    };
});

describe('McpServerWrapper', () => {
  it('should initialize server with tools', () => {
    const wrapper = new McpServerWrapper();
    expect(wrapper.server).toBeDefined();
  });
});
