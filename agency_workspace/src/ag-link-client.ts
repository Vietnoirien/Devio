import { Agent } from 'undici';

export interface SnapshotResponse {
  html: string;
  controlsHtml: string;
  isGenerating: boolean;
  controlsMeta: {
    isGenerating: boolean;
    model: { text: string; selector: string };
  };
}

const dispatcher = new Agent({ connect: { rejectUnauthorized: false } });

export class AgLinkClient {
  constructor(
    private baseUrl: string,
    private token: string
  ) {}

  private async fetchWrapper(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
    
    return fetch(url, { ...options, headers, dispatcher } as any);
  }

  async ping(): Promise<{ ok: boolean; version?: string; status?: number }> {
    try {
      const res = await this.fetchWrapper('/snapshot', { method: 'GET' });
      if (!res.ok) return { ok: false, status: res.status };
      const data = await res.json();
      return { ok: true, version: data.version };
    } catch (err: any) {
      if (err.message?.includes('401')) {
        return { ok: false, status: 401 };
      }
      return { ok: false };
    }
  }

  async send(message: string): Promise<{ success: boolean; method: string }> {
    const res = await this.fetchWrapper('/send', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error(`AgLink HTTP error: ${res.status}`);
    return await res.json();
  }

  async snapshot(): Promise<SnapshotResponse> {
    const res = await this.fetchWrapper('/snapshot', { method: 'GET' });
    if (!res.ok) throw new Error(`AgLink HTTP error: ${res.status}`);
    return await res.json();
  }

  async click(opts: { text?: string; selector?: string }): Promise<{ success: boolean }> {
    const res = await this.fetchWrapper('/click', {
      method: 'POST',
      body: JSON.stringify(opts)
    });
    if (!res.ok) throw new Error(`AgLink HTTP error: ${res.status}`);
    return await res.json();
  }

  async waitForCompletion(opts: { pollIntervalMs: number; timeoutMs: number }): Promise<SnapshotResponse> {
    const deadline = Date.now() + opts.timeoutMs;
    
    while (Date.now() < deadline) {
      const snap = await this.snapshot();
      if (!snap.isGenerating) {
        return snap;
      }
      await new Promise(resolve => setTimeout(resolve, opts.pollIntervalMs));
    }
    
    throw new Error(`TimeoutError: waiting for completion exceeded ${opts.timeoutMs}ms`);
  }

  async extractResponse(snapshot: SnapshotResponse): Promise<string> {
    throw new Error('Not implemented');
  }
}
