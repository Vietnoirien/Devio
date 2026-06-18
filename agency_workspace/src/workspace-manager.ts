import * as fs from 'fs/promises';
import * as path from 'path';

export interface AgencyState {
  phase: "BRIEF" | "RESEARCH" | "PROPOSAL" | "ARCHITECTURE" | "DEVELOPMENT" | "REVIEW" | "DELIVERY" | "DONE";
  owner: string;
  project: string;
  client: string;
  started_at: string;
  updated_at: string;
  blocked_by: string[];
}

export interface AgencyMessage {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  phase: string;
  type: "SUBMIT" | "REQUEST_CHANGE" | "REVISION" | "APPROVE" | "ESCALATE" | "INFO";
  ref_doc: string | null;
  message: string;
  in_reply_to: string | null;
  status: "OPEN" | "RESOLVED";
}

export class WorkspaceManager {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  private getStatePath(): string {
    return path.join(this.workspacePath, 'agency_workspace', 'state.json');
  }

  private getInboxPath(): string {
    return path.join(this.workspacePath, 'agency_workspace', 'inbox.jsonl');
  }

  private getLockPath(): string {
    return path.join(this.workspacePath, 'agency_workspace', 'workspace.lock');
  }

  private async acquireLock(): Promise<void> {
    const lockPath = this.getLockPath();
    const maxRetries = 50;
    const retryDelay = 10;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.mkdir(lockPath);
        return;
      } catch (err: any) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    throw new Error('Failed to acquire lock: Timeout waiting for workspace.lock');
  }

  private async releaseLock(): Promise<void> {
    const lockPath = this.getLockPath();
    try {
      await fs.rmdir(lockPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to release lock', err);
      }
    }
  }

  /**
   * Reads and parses state.json from the workspace.
   */
  async readState(): Promise<AgencyState> {
    await this.acquireLock();
    try {
      const data = await fs.readFile(this.getStatePath(), 'utf8');
      return JSON.parse(data);
    } catch (err: any) {
      throw new Error(`Failed to read state.json at ${this.getStatePath()}: ${err.message}`);
    } finally {
      await this.releaseLock();
    }
  }

  /**
   * Writes the updated state.json back to the workspace.
   */
  async writeState(state: AgencyState): Promise<void> {
    await this.acquireLock();
    try {
      const data = JSON.stringify(state, null, 2);
      await fs.writeFile(this.getStatePath(), data, 'utf8');
    } catch (err: any) {
      throw new Error(`Failed to write state.json at ${this.getStatePath()}: ${err.message}`);
    } finally {
      await this.releaseLock();
    }
  }

  /**
   * Reads, parses, and returns all messages from inbox.jsonl.
   */
  async readInbox(): Promise<AgencyMessage[]> {
    await this.acquireLock();
    try {
      const inboxPath = this.getInboxPath();
      if (!(await this.fileExists(inboxPath))) {
        return [];
      }
      const data = await fs.readFile(inboxPath, 'utf8');
      return data
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line));
    } catch (err: any) {
      throw new Error(`Failed to read inbox.jsonl at ${this.getInboxPath()}: ${err.message}`);
    } finally {
      await this.releaseLock();
    }
  }

  /**
   * Appends a new message to the end of inbox.jsonl.
   */
  async appendInbox(message: AgencyMessage): Promise<void> {
    await this.acquireLock();
    try {
      const line = JSON.stringify(message) + '\n';
      await fs.appendFile(this.getInboxPath(), line, 'utf8');
    } catch (err: any) {
      throw new Error(`Failed to append to inbox.jsonl at ${this.getInboxPath()}: ${err.message}`);
    } finally {
      await this.releaseLock();
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
