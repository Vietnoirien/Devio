import * as vscode from 'vscode';
import { WorkspaceManager } from './workspace-manager';
import { getWebviewContent } from './webview-provider';
import { HealthChecker } from './health-checker';
import { NativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';
import { OrchestrationEngine } from './orchestration-engine';

/**
 * Activates the Devio AI Agency Extension.
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Devio AI Agency Plugin activated');

  const disposable = vscode.commands.registerCommand('devio.start', async () => {
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
    const promptBuilder = new PromptBuilder(workspaceRoot);
    const writer = new WorkspaceWriter(workspaceManager);
    const orchestrationEngine = new OrchestrationEngine(nativeBridge, convMgr, promptBuilder, writer, responseSelector);

    // Create the Webview Panel
    const panel = vscode.window.createWebviewPanel(
      'devioDashboard',
      'Devio AI Agency',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // Restrict file system access to the Webview's dist folder for security
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist-webview')
        ]
      }
    );

    // Render the initial HTML layout
    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

    // Helper to read workspace data and push updates to the Webview
    async function syncWorkspaceData() {
      try {
        const state = await workspaceManager.readState();
        const messages = await workspaceManager.readInbox();
        await panel.webview.postMessage({
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
        await panel.webview.postMessage({
          type: 'health_result',
          result
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(`Devio Health Check Failed: ${err.message}`);
      }
    }

    // Handle messages coming from the Webview (React)
    panel.webview.onDidReceiveMessage(
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
          case 'runAgency':
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

                const fresh = config.get<boolean>('freshConversationPerTurn', true);
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
            }
            break;
          case 'openDocument':
            try {
              const docPath = message.file;
              // use vscode.workspace.fs or fs/promises
              const fs = require('fs/promises');
              const path = require('path');
              let fullPath = path.join(workspaceRoot, docPath);
              let content = '';
              try {
                content = await fs.readFile(fullPath, 'utf8');
              } catch (e) {
                // If direct path fails, search for the file in the workspace
                const files = await vscode.workspace.findFiles(`**/${path.basename(docPath)}`, '**/node_modules/**', 1);
                if (files && files.length > 0) {
                  fullPath = files[0].fsPath;
                  content = await fs.readFile(fullPath, 'utf8');
                } else {
                  throw new Error(`File not found: ${docPath}`);
                }
              }
              await panel.webview.postMessage({
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
              // Import IDEAL_GEMINI_MD dynamically or require it
              // Since it's in health-checker.ts, we can just require it or declare it
              const { IDEAL_GEMINI_MD } = require('./health-checker');
              await fs.writeFile(path.join(workspaceRoot, 'GEMINI.md'), IDEAL_GEMINI_MD, 'utf8');
              vscode.window.showInformationMessage('GEMINI.md applied successfully.');
              await runHealthCheck();
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to apply GEMINI.md: ${err.message}`);
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    // Live actualization of messages via IPC using a file watcher
    const inboxPattern = new vscode.RelativePattern(workspaceRoot, 'agency_workspace/inbox.jsonl');
    const inboxWatcher = vscode.workspace.createFileSystemWatcher(inboxPattern);

    inboxWatcher.onDidChange(async () => {
      await syncWorkspaceData();
    });

    panel.onDidDispose(() => {
      inboxWatcher.dispose();
    });

    context.subscriptions.push(inboxWatcher);
  });

  context.subscriptions.push(disposable);

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
