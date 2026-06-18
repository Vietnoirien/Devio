import * as vscode from 'vscode';
import { WorkspaceManager } from './workspace-manager';
import { getWebviewContent } from './webview-provider';
import { AntigravityBridge } from './antigravity-bridge';
import { HealthChecker } from './health-checker';
import { AgLinkClient } from './ag-link-client';

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
    const port = config.get<number>('antigravityLinkPort', 3717);
    const token = await context.secrets.get('DEVIO_AG_LINK_TOKEN') || '';
    const agClient = new AgLinkClient(`https://localhost:${port}`, token);
    const healthChecker = new HealthChecker(agClient, port);

    // Create the Webview Panel
    const panel = vscode.window.createWebviewPanel(
      'devioDashboard',
      'Devio AI Agency',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
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
            try {
              const antigravity = new AntigravityBridge(context);
              await antigravity.invokeAgent({
                agent: msg.to,
                action: 'process_message',
                workspace_path: workspaceRoot,
                context: { current_phase: msg.phase }
              });
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to invoke Antigravity Agent: ${err.message}`);
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );
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
