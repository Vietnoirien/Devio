import * as vscode from 'vscode';
import { WorkspaceManager } from './workspace-manager';
import { getWebviewContent } from './webview-provider';
import { HealthChecker } from './health-checker';
import { NativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';
import { OrchestrationEngine } from './orchestration-engine';

class DevioSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devio-sidebar-view';
  
  constructor(private readonly _extensionUri: vscode.Uri, private readonly _globalStorageUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist-webview')
      ]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);

    // Determine the active workspace directory
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder is currently open in the IDE.');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const workspaceManager = new WorkspaceManager(workspaceRoot);

    const config = vscode.workspace.getConfiguration('devio');
    const port = config.get<number>('antigravityLinkPort', 9222);
    const nativeBridge = new NativeBridge();
    const newChatSelector = config.get<string>('newChatSelector', '[data-tooltip-id="new-conversation-tooltip"]');
    const healthChecker = new HealthChecker(nativeBridge, port, workspaceRoot, newChatSelector, vscode.commands);

    const responseSelector = config.get<string>('responseSelector', '.message, [data-testid*="message" i], article');

    const convMgr = new ConversationManager(nativeBridge, newChatSelector, vscode.commands, responseSelector);
    const promptBuilder = new PromptBuilder(workspaceRoot, this._globalStorageUri);
    const writer = new WorkspaceWriter(workspaceManager);
    const orchestrationEngine = new OrchestrationEngine(nativeBridge, convMgr, promptBuilder, writer, responseSelector);

    async function syncWorkspaceData() {
      try {
        const state = await workspaceManager.readState();
        const messages = await workspaceManager.readInbox();
        await webviewView.webview.postMessage({
          type: 'update',
          state,
          messages
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Devio Workspace Sync Failed: ${err.message}`);
      }
    }

    async function runHealthCheck() {
      try {
        const result = await healthChecker.check();
        await webviewView.webview.postMessage({
          type: 'health_result',
          result
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Devio Health Check Failed: ${err.message}`);
      }
    }

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'ready':
            await runHealthCheck();
            await syncWorkspaceData();
            break;
          case 'refresh':
            await syncWorkspaceData();
            break;
          case 'sendMessage':
            const msg = message.message;
            await workspaceManager.appendInbox(msg);
            await syncWorkspaceData();
            break;
          case 'clearChat':
            try {
              await workspaceManager.clearInbox();
              await syncWorkspaceData();
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to clear chat: ${err.message}`);
            }
            break;
          case 'deleteMessage':
            try {
              const messageId = message.messageId;
              if (messageId) {
                await workspaceManager.deleteMessage(messageId);
                await syncWorkspaceData();
              }
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to delete message: ${err.message}`);
            }
            break;
          case 'runAgency':
            webviewView.webview.postMessage({ type: 'agencyRunning', isRunning: true });
            try {
              let isRunning = true;
              while (isRunning) {
                const state = await workspaceManager.readState();
                
                // Read inbox to see who the last message was addressed to
                const messages = await workspaceManager.readInbox();
                const lastMessage = messages[messages.length - 1];

                // Stop if the last message is addressed to the client
                if (lastMessage && lastMessage.to === 'client') {
                  vscode.window.showInformationMessage('Agency paused: Waiting for client input.');
                  break;
                }

                // If the last message was to another agent, update the owner
                if (lastMessage && lastMessage.to && lastMessage.to !== state.owner) {
                  state.owner = lastMessage.to;
                  if (lastMessage.phase) {
                    state.phase = lastMessage.phase as any;
                  }
                  await workspaceManager.writeState(state);
                }

                const fresh = vscode.workspace.getConfiguration('devio').get<boolean>('freshConversationPerTurn', true);
                await orchestrationEngine.runTurn(state.owner || 'agency-ceo', state.phase || 'DEVELOPMENT', fresh);
                await syncWorkspaceData();

                // Check the newly added message
                const newMessages = await workspaceManager.readInbox();
                const newLastMessage = newMessages[newMessages.length - 1];
                if (newLastMessage && newLastMessage.to === 'client') {
                  vscode.window.showInformationMessage('Agency paused: Waiting for client input.');
                  break;
                }
              }
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to run Agency: ${err.message}`);
            } finally {
              webviewView.webview.postMessage({ type: 'agencyRunning', isRunning: false });
            }
            break;
          case 'openDocument':
            try {
              const docPath = message.file;
              const fs = require('fs/promises');
              const path = require('path');
              let fullPath = path.join(workspaceRoot, docPath);
              let content = '';
              try {
                content = await fs.readFile(fullPath, 'utf8');
              } catch (e) {
                const files = await vscode.workspace.findFiles(`**/${path.basename(docPath)}`, '**/node_modules/**', 1);
                if (files && files.length > 0) {
                  fullPath = files[0].fsPath;
                  content = await fs.readFile(fullPath, 'utf8');
                } else {
                  throw new Error(`File not found: ${docPath}`);
                }
              }
              await webviewView.webview.postMessage({
                type: 'documentContent',
                file: docPath,
                content: content
              });
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to open document: ${err.message}`);
            }
            break;
          case 'fixGeminiMd':
            try {
              const fs = require('fs/promises');
              const path = require('path');
              const { IDEAL_GEMINI_MD } = require('./health-checker');
              await fs.writeFile(path.join(workspaceRoot, 'GEMINI.md'), IDEAL_GEMINI_MD, 'utf8');
              vscode.window.showInformationMessage('GEMINI.md applied successfully.');
              await runHealthCheck();
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to apply GEMINI.md: ${err.message}`);
            }
            break;
          case 'getInsights':
            try {
              const fs = require('fs/promises');
              const path = require('path');
              const insightsPath = path.join(this._globalStorageUri.fsPath, '.agent', 'insights');
              let files: string[] = [];
              try {
                files = await fs.readdir(insightsPath);
              } catch (e) {
                // ignore
              }
              const insights = [];
              for (const file of files) {
                if (file.endsWith('_performance.md')) {
                  const content = await fs.readFile(path.join(insightsPath, file), 'utf8');
                  insights.push({ file, content });
                }
              }
              await webviewView.webview.postMessage({ type: 'insightsData', insights });
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to get insights: ${err.message}`);
            }
            break;
          case 'saveInsight':
            try {
              const fs = require('fs/promises');
              const path = require('path');
              const insightsPath = path.join(this._globalStorageUri.fsPath, '.agent', 'insights');
              await fs.writeFile(path.join(insightsPath, message.file), message.content, 'utf8');
              vscode.window.showInformationMessage(`Insight ${message.file} saved.`);
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to save insight: ${err.message}`);
            }
            break;
        }
      }
    );

    const inboxPattern = new vscode.RelativePattern(workspaceRoot, 'agency_workspace/inbox.jsonl');
    const inboxWatcher = vscode.workspace.createFileSystemWatcher(inboxPattern);

    inboxWatcher.onDidChange(async () => {
      await syncWorkspaceData();
    });

    webviewView.onDidDispose(() => {
      inboxWatcher.dispose();
    });
  }
}

/**
 * Activates the Devio AI Agency Extension.
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Devio AI Agency Plugin activated');

  try {
    await vscode.workspace.fs.createDirectory(context.globalStorageUri);
    const extensionAgentUri = vscode.Uri.joinPath(context.extensionUri, '.agent');
    const globalAgentUri = vscode.Uri.joinPath(context.globalStorageUri, '.agent');
    await vscode.workspace.fs.copy(extensionAgentUri, globalAgentUri, { overwrite: true });

    const insightsUri = vscode.Uri.joinPath(globalAgentUri, 'insights');
    await vscode.workspace.fs.createDirectory(insightsUri);
  } catch (err) {
    console.error('Failed to copy .agent to globalStorageUri', err);
  }

  const provider = new DevioSidebarProvider(context.extensionUri, context.globalStorageUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DevioSidebarProvider.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true
      }
    })
  );

  const startCommandDisposable = vscode.commands.registerCommand('devio.start', () => {
    vscode.commands.executeCommand('devio-sidebar-view.focus');
  });
  context.subscriptions.push(startCommandDisposable);

  const setTokenDisposable = vscode.commands.registerCommand('devio.setAntigravityLinkToken', async () => {
    const token = await vscode.window.showInputBox({
      prompt: 'Enter your Antigravity Link API Token',
      password: true
    });
    if (token) {
      await context.secrets.store('DEVIO_AG_LINK_TOKEN', token);
      vscode.window.showInformationMessage('Antigravity Link Token saved successfully.');
    }
  });
  context.subscriptions.push(setTokenDisposable);
}

export function deactivate() {
  console.log('Devio AI Agency Plugin deactivated');
}
