import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Extension Packaging', () => {
  it('should package successfully and produce a .vsix file', () => {
    // Clean up any pre-existing .vsix files to ensure fresh packaging
    const rootDir = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(rootDir);
    files.forEach(file => {
      if (file.endsWith('.vsix')) {
        fs.unlinkSync(path.join(rootDir, file));
      }
    });

    let packageError: Error | null = null;
    try {
      // Execute the npm package script which compiles first and then packages
      execSync('npm run package', { cwd: rootDir, stdio: 'pipe' });
    } catch (err: any) {
      packageError = err;
    }

    // Assert that the packaging command finished without errors
    expect(packageError).toBeNull();

    // Verify a .vsix file is produced
    const updatedFiles = fs.readdirSync(rootDir);
    const vsixFile = updatedFiles.find(file => file.endsWith('.vsix'));
    expect(vsixFile).toBeDefined();

    if (vsixFile) {
      const stats = fs.statSync(path.join(rootDir, vsixFile));
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it('package.json should strictly define devio.agentLLMs configuration constraints as flat keys', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const props = packageJson.contributes.configuration.properties;
    expect(props['devio.agentLLMs.agency-ceo']).toBeDefined();
    expect(props['devio.agentLLMs.agency-architect']).toBeDefined();
    expect(props['devio.agentLLMs.agency-developer']).toBeDefined();
    expect(props['devio.agentLLMs.agency-lead-developer']).toBeDefined();
    expect(props['devio.agentLLMs.agency-qa']).toBeDefined();
    expect(props['devio.agentLLMs.agency-researcher']).toBeDefined();
    expect(props['devio.agentLLMs.agency-secretary']).toBeDefined();
    expect(props['devio.agentLLMs.agency-trinity']).toBeDefined();
    expect(props['devio.agentLLMs.agency-designer']).toBeDefined();
    expect(props['devio.agentLLMs.agency-accountant']).toBeDefined();
    
    expect(props['devio.agentLLMs.agency-ceo'].type).toBe('string');
    expect(props['devio.agentLLMs.agency-ceo'].default).toBe('');
  });
});
