import { vi, describe, it, expect } from 'vitest';

// Mock the vscode module for Node/Vitest runtime
vi.mock('vscode', () => {
  return {
    Uri: {
      joinPath: (baseUri: any, ...pathSegments: string[]) => {
        return {
          path: `${baseUri.path}/${pathSegments.join('/')}`
        };
      }
    }
  };
});

import { getWebviewContent } from './webview-provider';

describe('WebviewProvider', () => {
  it('should generate valid webview HTML containing root and script tag', () => {
    // Mock vscode.Webview asWebviewUri method
    const mockWebview = {
      asWebviewUri: (uri: any) => {
        return {
          toString: () => `https://file-system.vscode-resource.vscode-cdn.net${uri.path}`
        };
      },
      cspSource: 'vscode-resource:'
    } as any;

    const mockExtensionUri = {
      path: '/mock-extension-path'
    } as any;

    const html = getWebviewContent(mockWebview, mockExtensionUri);

    // Assert it contains React root container
    expect(html).toContain('<div id="root"></div>');

    // Assert the script tag does NOT use type="module".
    // Vite builds an IIFE bundle, not an ES module. Loading an IIFE
    // with type="module" causes a silent failure in VSCode webviews — blank screen.
    // The script should load as a classic script (no type attribute) with only a nonce.
    expect(html).not.toContain('<script type="module"');
    expect(html).toContain('<script nonce=');
    expect(html).toContain('dist-webview');

    // Assert it contains a Content Security Policy (CSP) tag for security
    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain("default-src 'none'");
  });
});
