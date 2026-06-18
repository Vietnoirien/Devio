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
        get: vi.fn().mockReturnValue(3717)
      })
    }
  };
});

// Mock the WorkspaceManager and webview-provider
vi.mock('./workspace-manager', () => {
  return {
    WorkspaceManager: class {
      readState = vi.fn().mockResolvedValue({ phase: 'DEVELOPMENT', project: 'Devio Test' });
      readInbox = vi.fn().mockResolvedValue([{ id: 'msg-001', message: 'Hello' }]);
    }
  };
});

vi.mock('./webview-provider', () => {
  return {
    getWebviewContent: vi.fn().mockReturnValue('<html>mock html</html>')
  };
});

const mockInvokeAgent = vi.fn().mockResolvedValue({});
vi.mock('./antigravity-bridge', () => {
  return {
    AntigravityBridge: class {
      invokeAgent = mockInvokeAgent;
    }
  };
});

vi.mock('./health-checker', () => {
  return {
    HealthChecker: class {
      check = vi.fn().mockResolvedValue({ ok: true, checks: {} });
    }
  };
});

import { activate } from './extension';

describe('Extension Activation', () => {
  beforeEach(() => {
    mockRegisterCommand.mockReset();
    mockCreateWebviewPanel.mockReset();
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
      }
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

  it('should handle sendMessage command and invoke agent', async () => {
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
      }
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
      expect(mockInvokeAgent).toHaveBeenCalledWith({
        agent: 'agency-developer',
        action: 'process_message',
        workspace_path: '/mock-workspace-root',
        context: { current_phase: 'DEVELOPMENT' }
      });
    }
  });

  it('should register devio.setAntigravityLinkToken command on activation', () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' }
    } as any;

    activate(mockContext);

    expect(mockRegisterCommand).toHaveBeenCalledWith('devio.setAntigravityLinkToken', expect.any(Function));
  });

  it('should prompt user and store token in SecretStorage when devio.setAntigravityLinkToken is executed', async () => {
    const mockStore = vi.fn().mockResolvedValue(undefined);
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      secrets: { store: mockStore }
    } as any;

    const vscodeMock = await import('vscode');
    (vscodeMock.window.showInputBox as any).mockResolvedValue('user-input-token');

    activate(mockContext);

    const tokenCommandCall = mockRegisterCommand.mock.calls.find(call => call[0] === 'devio.setAntigravityLinkToken');
    expect(tokenCommandCall).toBeDefined();

    await tokenCommandCall[1]();

    expect(vscodeMock.window.showInputBox).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.any(String),
      password: true
    }));
    expect(mockStore).toHaveBeenCalledWith('DEVIO_AG_LINK_TOKEN', 'user-input-token');
    expect(vscodeMock.window.showInformationMessage).toHaveBeenCalledWith(expect.stringContaining('successfully'));
  });

  it('should run HealthChecker and post health_result to Webview when ready message is received', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    const vscodeMock = await import('vscode');
    (vscodeMock.workspace.getConfiguration as any) = vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(3717)
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
      }
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
});
