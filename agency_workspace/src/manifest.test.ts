import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Extension Manifest & Build', () => {
  it('should have a valid extension manifest in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const manifest = JSON.parse(packageJsonContent);

    expect(manifest.engines).toBeDefined();
    expect(manifest.engines.vscode).toBeDefined();
    expect(manifest.activationEvents).toBeDefined();
    expect(manifest.main).toBeDefined();
    expect(manifest.contributes).toBeDefined();
    expect(manifest.contributes.commands).toBeDefined();
    expect(Array.isArray(manifest.contributes.commands)).toBe(true);
    
    expect(manifest.contributes.configuration).toBeDefined();
    expect(manifest.contributes.configuration.properties).toBeDefined();
    
    const props = manifest.contributes.configuration.properties;
    expect(props['devio.autonomyMode']).toBeDefined();
    expect(props['devio.antigravityLinkPort']).toBeDefined();
    expect(props['devio.freshConversationPerTurn']).toBeDefined();
    expect(props['devio.newChatSelector']).toBeDefined();
    expect(props['devio.responseSelector']).toBeDefined();

    expect(manifest.dependencies).toBeDefined();
    expect(manifest.dependencies['ws']).toBeDefined();
    expect(manifest.dependencies['cheerio']).toBeDefined();
    expect(manifest.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
  });

  it('should build successfully and produce dist/extension.js', () => {
    // Clean up dist directory if it exists
    const distPath = path.resolve(__dirname, '../../dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }

    // Attempt to run the build script
    let buildError: Error | null = null;
    try {
      execSync('npm run build', { cwd: path.resolve(__dirname, '../../'), stdio: 'pipe' });
    } catch (err: any) {
      buildError = err;
    }

    // Assert that build succeeded and file exists
    expect(buildError).toBeNull();
    const outputPath = path.resolve(distPath, 'extension.js');
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
