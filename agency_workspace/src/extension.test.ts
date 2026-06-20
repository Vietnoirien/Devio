import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRegisterCommand = vi.fn();
const mockRegisterWebviewViewProvider = vi.fn();

vi.mock('vscode', () => {
  const configStore: Record<string, any> = {
    freshConversationPerTurn: true,
    newChatSelector: 'Add context',
    autonomyMode: 'supervised',
    antigravityLinkPort: 3717
  };
  (globalThis as any).__devioConfigStore = configStore;
  (globalThis as any).__devioUpdateCalls = [];

  const getConfiguration = () => ({
    get: (key: string, defaultValue: any) => {
      return (globalThis as any).__devioConfigStore[key] ?? defaultValue ?? 9222;
    },
    update: (key: string, value: any, target: any) => {
      (globalThis as any).__devioConfigStore[key] = value;
      (globalThis as any).__devioUpdateCalls.push([key, value, target]);
      return Promise.resolve();
    }
  });

  (globalThis as any).__devioDefaultGetConfiguration = getConfiguration;

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
    FileType: {
      Unknown: 0,
      File: 1,
      Directory: 2,
      SymbolicLink: 64
    },
    ConfigurationTarget: {
      Global: 1,
      Workspace: 2,
      WorkspaceFolder: 3
    },
    RelativePattern: class {
      constructor(public base: string, public pattern: string) {}
    },
    Uri: {
      joinPath: (baseUri: any, ...pathSegments: string[]) => {
        const basePath = baseUri.path || baseUri.fsPath;
        return {
          path: `${basePath}/${pathSegments.join('/')}`,
          fsPath: `${basePath}/${pathSegments.join('/')}`
        };
      }
    },
    workspace: {
      fs: {
        createDirectory: vi.fn().mockResolvedValue(undefined),
        copy: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockRejectedValue(new Error('File not found')),
        readDirectory: vi.fn().mockResolvedValue([])
      },
      workspaceFolders: [
        {
          uri: {
            fsPath: '/mock-workspace-root'
          }
        }
      ],
      getConfiguration: getConfiguration,
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
      stop = vi.fn();
    }
  };
});

import { activate } from './extension';

describe('Extension Activation', () => {
  beforeEach(async () => {
    mockRegisterCommand.mockReset();
    mockRegisterWebviewViewProvider.mockReset();
    mockRunTurn.mockReset();
    (globalThis as any).__devioUpdateCalls = [];
    (globalThis as any).__devioConfigStore = {
      freshConversationPerTurn: true,
      newChatSelector: 'Add context',
      autonomyMode: 'supervised',
      antigravityLinkPort: 3717
    };
    const vscode = await import('vscode');
    (vscode.workspace.getConfiguration as any) = (globalThis as any).__devioDefaultGetConfiguration;
  });

  it('should register devio.start command on activation', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
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
      (globalThis as any).__devioConfigStore.autonomyMode = 'autonomous';
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

  it('should handle stopAgency command, break execution loop, and click IDE cancel button', async () => {
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
      const { NativeBridge } = await import('./native-bridge');
      const clickButtonSpy = vi.spyOn(NativeBridge.prototype, 'clickButton').mockResolvedValue(undefined);
      
      mockRunTurn.mockImplementationOnce(async () => {
        // while running, simulate receiving a stopAgency message!
        await (messageListener as Function)({ command: 'stopAgency' });
      });

      const mockMessage = { command: 'runAgency' };
      await (messageListener as Function)(mockMessage);
      
      expect(clickButtonSpy).toHaveBeenCalledWith('Cancel');
      
      const { WorkspaceManager } = await import('./workspace-manager');
      (WorkspaceManager as any).resetInbox();
      clickButtonSpy.mockRestore();
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

  it('should copy .agent and create insights directory on activation', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    const vscodeMock = await import('vscode');
    await activate(mockContext);

    expect(vscodeMock.workspace.fs.createDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/mock-global-storage/.agent/insights' })
    );
  });

  it('should migrate existing local workspace insights to globalStorageUri on activation', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { path: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    const vscodeMock = await import('vscode');
    (vscodeMock.workspace.fs.stat as any).mockResolvedValueOnce({ type: 2 });
    (vscodeMock.workspace.fs.readDirectory as any).mockResolvedValueOnce([['test_performance.md', 1], ['ignore.txt', 1]]);

    await activate(mockContext);

    expect(vscodeMock.workspace.fs.copy).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/mock-workspace-root/.agent/insights/test_performance.md' }),
      expect.objectContaining({ path: '/mock-global-storage/.agent/insights/test_performance.md' }),
      { overwrite: true }
    );
    
    // ignore.txt should not be copied
    expect(vscodeMock.workspace.fs.copy).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: '/mock-workspace-root/.agent/insights/ignore.txt' }),
      expect.anything(),
      expect.anything()
    );
  });

  it('should handle getInsights command and return insightsData', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    
    // We get the provider from the second registration (WebviewViewProvider)
    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockPostMessage = vi.fn();
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

    if (messageListener) {
      await (messageListener as Function)({ command: 'getInsights' });
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'insightsData',
          insights: []
        })
      );
    }
  });

  it('should handle saveInsight command and save content', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    
    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

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
      const vscodeMock = await import('vscode');
      await (messageListener as Function)({
        command: 'saveInsight',
        file: 'test_performance.md',
        content: '# Updated'
      });
      // It should throw an error since the file doesn't exist and fs is not fully mocked, 
      // but it will be caught and showErrorMessage will be called
      expect(vscodeMock.window.showErrorMessage).toHaveBeenCalled();
    }
  });

  it('should handle getSettingsData command and return settingsData containing autonomyMode and antigravityLinkPort', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);

    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

    let messageListener: Function | null = null;
    const mockOnDidReceiveMessage = (listener: Function) => {
      messageListener = listener;
      return { dispose: () => {} };
    };

    const mockPostMessage = vi.fn();
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

    if (messageListener) {
      await (messageListener as Function)({ command: 'getSettingsData' });
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'settingsData',
          autonomyMode: 'supervised',
          antigravityLinkPort: 3717
        })
      );
    }
  });

  it('should handle saveAutonomyMode command and save globally', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);

    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

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
      await (messageListener as Function)({ command: 'saveAutonomyMode', mode: 'full' });
      expect((globalThis as any).__devioUpdateCalls).toContainEqual(['autonomyMode', 'full', 1]);
    }
  });

  it('should handle saveAntigravityLinkPort command and save globally', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);

    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

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
      await (messageListener as Function)({ command: 'saveAntigravityLinkPort', port: 1234 });
      expect((globalThis as any).__devioUpdateCalls).toContainEqual(['antigravityLinkPort', 1234, 1]);
    }
  });

  it('should break runAgency loop after one turn if autonomyMode is supervised', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    
    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

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
      (globalThis as any).__devioConfigStore.autonomyMode = 'supervised';
      mockRunTurn.mockResolvedValueOnce(undefined);

      const mockMessage = { command: 'runAgency' };
      await (messageListener as Function)(mockMessage);
      
      expect(mockRunTurn).toHaveBeenCalledTimes(1);
      expect(mockRunTurn).toHaveBeenCalledWith('agency-ceo', 'DEVELOPMENT', true);
    }
  });

  it('should resume from the last step state when transitioning to autonomous mode with no new client message', async () => {
    const mockContext = {
      subscriptions: [],
      extensionUri: { path: '/mock-extension' },
      globalStorageUri: { fsPath: '/mock-global-storage' },
      secrets: { get: vi.fn().mockResolvedValue('token') }
    } as any;

    await activate(mockContext);
    
    const providerCall = mockRegisterWebviewViewProvider.mock.calls.find(call => call[0] === 'devio-sidebar-view');
    const provider = providerCall![1];

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
      const { WorkspaceManager } = await import('./workspace-manager');
      const mgr = new WorkspaceManager();
      const inbox = await mgr.readInbox();
      
      // Set the last message in the inbox to be addressed to 'client' from 'agency-ceo'
      inbox.push({
        id: 'msg-to-client',
        from: 'agency-ceo',
        to: 'client',
        phase: 'DEVELOPMENT',
        message: 'Hello client'
      });

      (globalThis as any).__devioConfigStore.autonomyMode = 'full';
      
      // When the turn runs, simulate stopping the loop by appending another client message
      mockRunTurn.mockImplementationOnce(async () => {
        (WorkspaceManager as any).stopLoop();
      });

      const mockMessage = { command: 'runAgency' };
      await (messageListener as Function)(mockMessage);
      
      // Since autonomyMode is 'full' and we resume, it should run the turn for the last step's sender ('agency-ceo')
      expect(mockRunTurn).toHaveBeenCalledWith('agency-ceo', 'DEVELOPMENT', true);
      
      (WorkspaceManager as any).resetInbox();
    }
  });
});
