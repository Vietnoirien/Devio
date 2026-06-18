import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRegisterCommand = vi.fn();
const mockRegisterWebviewViewProvider = vi.fn();

vi.mock('vscode', () => {
  return {
    commands: {
      registerCommand: (id: string, callback: Function) => {
        mockRegisterCommand(id, callback);
        return { dispose: vi.fn() };
      },
      executeCommand: vi.fn()
    },
    window: {
      registerWebviewViewProvider: (viewId: string, provider: any) => {
        mockRegisterWebviewViewProvider(viewId, provider);
        return { dispose: vi.fn() };
      },
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showInputBox: vi.fn()
    },
    ViewColumn: {
      One: 1
    },
    RelativePattern: class {
      constructor(public base: string, public pattern: string) {}
    },
    Uri: {
      joinPath: (baseUri: any, ...pathSegments: string[]) => {
        return {
          path: `${baseUri.path}/${pathSegments.join('/')}`
        };
      }
    },
    workspace: {
      fs: {
        createDirectory: vi.fn().mockResolvedValue(undefined),
        copy: vi.fn().mockResolvedValue(undefined)
      },
      workspaceFolders: [
        {
          uri: {
            fsPath: '/mock-workspace-root'
          }
        }
      ],
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn((key: string, defaultValue: any) => {
          if (key === 'freshConversationPerTurn') return true;
          if (key === 'newChatSelector') return 'Add context';
          return 9222;
        })
      }),
      createFileSystemWatcher: vi.fn().mockReturnValue({
        onDidChange: vi.fn(),
        onDidCreate: vi.fn(),
        onDidDelete: vi.fn(),
        dispose: vi.fn()
      }),
      findFiles: vi.fn().mockResolvedValue([])
    }
  };
});

// Mock the WorkspaceManager and webview-provider
vi.mock('./workspace-manager', () => {
  let inboxState = [{ id: 'msg-001', message: 'Hello', to: 'agency-ceo', phase: 'DEVELOPMENT' }];
  return {
    WorkspaceManager: class {
      readState = vi.fn().mockResolvedValue({ owner: 'agency-ceo', phase: 'DEVELOPMENT', project: 'Devio Test' });
      readInbox = vi.fn().mockImplementation(() => Promise.resolve(inboxState));
      writeState = vi.fn().mockResolvedValue(undefined);
      // Let the tests push a client message to stop the loop
      static stopLoop() {
        inboxState.push({ id: 'msg-stop', message: 'Done', to: 'client', phase: 'DONE' });
      }
      static resetInbox() {
        inboxState = [{ id: 'msg-001', message: 'Hello', to: 'agency-ceo', phase: 'DEVELOPMENT' }];
      }
    }
  };
});

vi.mock('./webview-provider', () => {
  return {
    getWebviewContent: vi.fn().mockReturnValue('<html>mock html</html>')
  };
});

vi.mock('./health-checker', () => {
  return {
    HealthChecker: class {
      check = vi.fn().mockResolvedValue({ ok: true, checks: {} });
    }
  };
});

const mockRunTurn = vi.fn().mockResolvedValue(undefined);
vi.mock('./orchestration-engine', () => {
  return {
    OrchestrationEngine: class {
      runTurn = mockRunTurn;
    }
  };
});

import { activate } from './extension';

describe('Extension Activation', () => {
  beforeEach(() => {
    mockRegisterCommand.mockReset();
    mockRegisterWebviewViewProvider.mockReset();
    mockRunTurn.mockReset();
  });

  it('should register devio.start command on activation', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);

    expect(mockRegisterCommand).toHaveBeenCalledWith('devio.start', expect.any(Function));
  });

  it('should register devio-sidebar-view provider on activation', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);

    expect(mockRegisterWebviewViewProvider).toHaveBeenCalledWith('devio-sidebar-view', expect.any(Object));
  });

  it('should sync workspace data to Webview when ready message is received', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    const provider = mockRegisterWebviewViewProvider.mock.calls[0][1];

    const mockPostMessage = vi.fn().mockResolvedValue(true);
    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockWebviewView = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: mockPostMessage,
        options: {}
      },
      onDidDispose: vi.fn()
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    expect(messageListener).toBeDefined();
    
    if (messageListener) {
      await (messageListener as Function)({ command: 'ready' });
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update',
          state: expect.objectContaining({ phase: 'DEVELOPMENT' }),
          messages: expect.arrayContaining([expect.objectContaining({ id: 'msg-001' })])
        })
      );
    }
  });

  it('should handle runAgency command and invoke OrchestrationEngine', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    const provider = mockRegisterWebviewViewProvider.mock.calls[0][1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockWebviewView = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: vi.fn(),
        options: {}
      },
      onDidDispose: vi.fn()
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    if (messageListener) {
      mockRunTurn.mockImplementationOnce(async () => {
        const { WorkspaceManager } = await import('./workspace-manager');
        (WorkspaceManager as any).stopLoop();
      });

      const mockMessage = {
        command: 'runAgency'
      };
      await (messageListener as Function)(mockMessage);
      
      expect(mockRunTurn).toHaveBeenCalledWith('agency-ceo', 'DEVELOPMENT', true);
      
      const { WorkspaceManager } = await import('./workspace-manager');
      (WorkspaceManager as any).resetInbox();
    }
  });

  it('should handle sendMessage command and append to inbox', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    const provider = mockRegisterWebviewViewProvider.mock.calls[0][1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockWebviewView = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: vi.fn(),
        options: {}
      },
      onDidDispose: vi.fn()
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    const { WorkspaceManager } = await import('./workspace-manager');
    const mockAppendInbox = vi.fn().mockResolvedValue(undefined);
    (WorkspaceManager as any).prototype.appendInbox = mockAppendInbox;

    if (messageListener) {
      const mockMessage = {
        command: 'sendMessage',
        message: {
          id: 'msg-003',
          to: 'agency-developer',
          message: 'Test message',
          phase: 'DEVELOPMENT'
        }
      };
      await (messageListener as Function)(mockMessage);
      
      expect(mockAppendInbox).toHaveBeenCalledWith(mockMessage.message);
    }
  });

  it('should handle clearChat command and clear inbox', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    const provider = mockRegisterWebviewViewProvider.mock.calls[0][1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockWebviewView = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: vi.fn(),
        options: {}
      },
      onDidDispose: vi.fn()
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    const { WorkspaceManager } = await import('./workspace-manager');
    const mockClearInbox = vi.fn().mockResolvedValue(undefined);
    (WorkspaceManager as any).prototype.clearInbox = mockClearInbox;

    if (messageListener) {
      const mockMessage = { command: 'clearChat' };
      await (messageListener as Function)(mockMessage);
      
      expect(mockClearInbox).toHaveBeenCalled();
    }
  });

  it('should run HealthChecker and post health_result to Webview when ready message is received', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    const vscodeMock = await import('vscode');
    (vscodeMock.workspace.getConfiguration as any) = vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(9222)
    });

    await activate(mockContext);
    const provider = mockRegisterWebviewViewProvider.mock.calls[0][1];

    const mockPostMessage = vi.fn().mockResolvedValue(true);
    let messageListener: Function | null = null;
    
    const mockWebviewView = {
      webview: {
        html: '',
        onDidReceiveMessage: (listener: Function) => {
          messageListener = listener;
          return { dispose: () => {} };
        },
        postMessage: mockPostMessage,
        options: {}
      },
      onDidDispose: vi.fn()
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    if (messageListener) {
      await (messageListener as Function)({ command: 'ready' });
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'health_result',
          result: expect.objectContaining({ ok: true })
        })
      );
    }
  });

  it('should set up a file system watcher for live actualization', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    const vscodeMock = await import('vscode');
    const mockWatcher = {
      onDidChange: vi.fn(),
      onDidCreate: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn()
    };
    (vscodeMock.workspace.createFileSystemWatcher as any).mockReturnValue(mockWatcher);

    await activate(mockContext);
    const provider = mockRegisterWebviewViewProvider.mock.calls[0][1];

    const mockPostMessage = vi.fn().mockResolvedValue(true);
    const mockWebviewView = {
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: mockPostMessage,
        options: {}
      },
      onDidDispose: vi.fn()
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    expect(vscodeMock.workspace.createFileSystemWatcher).toHaveBeenCalled();
    expect(mockWatcher.onDidChange).toHaveBeenCalled();
    
    const onDidChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
    await onDidChangeCallback();
    
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'update'
      })
    );
  });
});
