import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceManager } from './workspace-manager';

describe('WorkspaceManager', () => {
  const tempDir = path.resolve(__dirname, '../../temp-test-workspace');

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    const agencyWorkspaceDir = path.join(tempDir, 'agency_workspace');
    fs.mkdirSync(agencyWorkspaceDir, { recursive: true });

    // Seed state.json
    fs.writeFileSync(
      path.join(agencyWorkspaceDir, 'state.json'),
      JSON.stringify({
        phase: 'DEVELOPMENT',
        owner: 'agency-developer',
        project: 'Test Project',
        client: 'Test Client',
        started_at: '2026-06-17T18:50:00Z',
        updated_at: '2026-06-17T19:16:00Z',
        blocked_by: []
      }, null, 2)
    );

    // Seed inbox.jsonl
    fs.writeFileSync(
      path.join(agencyWorkspaceDir, 'inbox.jsonl'),
      JSON.stringify({
        id: 'msg-001',
        timestamp: '2026-06-17T18:50:00Z',
        from: 'agency-ceo',
        to: 'agency-architect',
        phase: 'BRIEF',
        type: 'INFO',
        ref_doc: null,
        message: 'Hello World',
        in_reply_to: null,
        status: 'RESOLVED'
      }) + '\n'
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should read state.json correctly', async () => {
    const manager = new WorkspaceManager(tempDir);
    const state = await manager.readState();
    expect(state.phase).toBe('DEVELOPMENT');
    expect(state.project).toBe('Test Project');
  });

  it('should write state.json correctly', async () => {
    const manager = new WorkspaceManager(tempDir);
    const state = await manager.readState();
    state.phase = 'REVIEW';
    state.owner = 'agency-qa';
    await manager.writeState(state);

    const updatedState = await manager.readState();
    expect(updatedState.phase).toBe('REVIEW');
    expect(updatedState.owner).toBe('agency-qa');
  });

  it('should read inbox.jsonl messages correctly', async () => {
    const manager = new WorkspaceManager(tempDir);
    const messages = await manager.readInbox();
    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe('msg-001');
    expect(messages[0].message).toBe('Hello World');
  });

  it('should append to inbox.jsonl correctly', async () => {
    const manager = new WorkspaceManager(tempDir);
    const newMessage = {
      id: 'msg-002',
      timestamp: new Date().toISOString(),
      from: 'agency-developer',
      to: 'agency-qa',
      phase: 'DEVELOPMENT',
      type: 'SUBMIT' as const,
      ref_doc: '04_dev_log.md',
      message: 'Submitting development work.',
      in_reply_to: null,
      status: 'OPEN' as const
    };

    await manager.appendInbox(newMessage);
    const messages = await manager.readInbox();
    expect(messages.length).toBe(2);
    expect(messages[1].id).toBe('msg-002');
    expect(messages[1].message).toBe('Submitting development work.');
  });

  it('should timeout when lock file is already present', async () => {
    const manager = new WorkspaceManager(tempDir);
    const lockPath = path.join(tempDir, 'agency_workspace', 'workspace.lock');
    fs.mkdirSync(lockPath); // hold lock

    let error: any = null;
    try {
      await manager.readState();
    } catch(e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toContain('Failed to acquire lock');

    fs.rmdirSync(lockPath);
  });
});
