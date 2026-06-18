import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRegisterCommand = vi.fn();
const mockCreateWebviewPanel = vi.fn();

vi.mock('vscode', () => {
  return {
    commands: {
      registerCommand: (id: string, callback: Function) => {
        mockRegisterCommand(id, callback);
        return { dispose: vi.fn() };
      }
    },
    window: {
      createWebviewPanel: (viewType: string, title: string, showOptions: any, options: any) => {
        return mockCreateWebviewPanel(viewType, title, showOptions, options);
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
      })
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
    mockCreateWebviewPanel.mockReset();
    mockRunTurn.mockReset();
  });

  it('should register devio.start command on activation', () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    activate(mockContext);

    expect(mockRegisterCommand).toHaveBeenCalledWith('devio.start', expect.any(Function));
  });

  it('should create Webview panel when devio.start is executed', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    activate(mockContext);

    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    // Mock Webview Panel
    const mockPostMessage = vi.fn();
    const mockOnDidReceiveMessage = vi.fn();
    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: mockPostMessage
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    // Execute the command callback
    await commandCallback();

    expect(mockCreateWebviewPanel).toHaveBeenCalledWith(
      'devioDashboard',
      'Devio AI Agency',
      1,
      expect.objectContaining({
        enableScripts: true
      })
    );
    expect(mockPanel.webview.html).toBe('<html>mock html</html>');
  });

  it('should sync workspace data to Webview when ready message is received', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    activate(mockContext);
    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    const mockPostMessage = vi.fn().mockResolvedValue(true);
    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: mockPostMessage
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    await commandCallback();

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
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    activate(mockContext);
    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: vi.fn()
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    await commandCallback();

    if (messageListener) {
      // Simulate the orchestration engine running a turn and then producing a message to the client
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
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    activate(mockContext);
    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: vi.fn()
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    // Provide the appendInbox mock
    const { WorkspaceManager } = await import('./workspace-manager');
    const mockAppendInbox = vi.fn().mockResolvedValue(undefined);
    (WorkspaceManager as any).prototype.appendInbox = mockAppendInbox;

    await commandCallback();

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
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    activate(mockContext);
    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: mockOnDidReceiveMessage,
        postMessage: vi.fn()
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    // Provide the clearInbox mock
    const { WorkspaceManager } = await import('./workspace-manager');
    const mockClearInbox = vi.fn().mockResolvedValue(undefined);
    (WorkspaceManager as any).prototype.clearInbox = mockClearInbox;

    await commandCallback();

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
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    const vscodeMock = await import('vscode');
    (vscodeMock.workspace.getConfiguration as any) = vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(9222)
    });

    activate(mockContext);
    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    const mockPostMessage = vi.fn().mockResolvedValue(true);
    let messageListener: Function | null = null;
    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: (listener: Function) => {
          messageListener = listener;
          return { dispose: () => {} };
        },
        postMessage: mockPostMessage
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    await commandCallback();

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

    activate(mockContext);
    const commandCallback = mockRegisterCommand.mock.calls[0][1];

    const mockPostMessage = vi.fn().mockResolvedValue(true);
    const mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: mockPostMessage
      },
      onDidDispose: vi.fn()
    };
    mockCreateWebviewPanel.mockReturnValue(mockPanel);

    await commandCallback();

    expect(vscodeMock.workspace.createFileSystemWatcher).toHaveBeenCalled();
    expect(mockWatcher.onDidChange).toHaveBeenCalled();
    
    // Simulate a file change
    const onDidChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
    await onDidChangeCallback();
    
    // Should post an update
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'update'
      })
    );
  });
});

