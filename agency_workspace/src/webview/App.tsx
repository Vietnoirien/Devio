import React, { useState, useEffect, useRef } from 'react';
import { formatPhaseName, isPhaseBlocked, getLatestMessages, createAgencyMessage } from './dashboard-logic';
import { AgencyState, AgencyMessage } from '../workspace-manager';
import './App.css';

// acquireVsCodeApi() must be called ONCE per webview lifetime.
// We use a lazy getter so that test stubs set before first render are respected,
// and so that the function is never called twice (which throws in VSCode).
let _vscode: ReturnType<typeof acquireVsCodeApi> | null = null;
let _vsCodeAcquired = false;

function getVsCodeApi() {
  if (!_vsCodeAcquired) {
    _vsCodeAcquired = true;
    try {
      if (typeof acquireVsCodeApi !== 'undefined') {
        _vscode = acquireVsCodeApi();
      }
    } catch {
      // Already acquired — should not happen but guard against it
    }
  }
  return _vscode;
}

/** Exported for test isolation only — resets the singleton between test cases. */
export function _resetVsCodeApiForTests() {
  _vscode = null;
  _vsCodeAcquired = false;
}

function App() {
  // Call the lazy getter — safe to call multiple times, acquireVsCodeApi() only runs once
  const vscode = getVsCodeApi();

  const [state, setState] = useState<AgencyState | null>(null);
  const [messages, setMessages] = useState<AgencyMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Composer State
  const [composerFrom, setComposerFrom] = useState('client');
  const [composerTo, setComposerTo] = useState('agency-ceo');
  const [composerType, setComposerType] = useState<"SUBMIT" | "REQUEST_CHANGE" | "REVISION" | "APPROVE" | "ESCALATE" | "INFO">('INFO');
  const [composerRefDoc, setComposerRefDoc] = useState('');
  const [composerStatus, setComposerStatus] = useState<"OPEN" | "RESOLVED">('RESOLVED');
  const [composerMessage, setComposerMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'update') {
        setState(message.state);
        setMessages(message.messages);
        setLoading(false);
      } else if (message.type === 'health_result') {
        if (!message.result.ok) {
          setHealthError(message.result.errorMessage);
        } else {
          setHealthError(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    if (vscode) {
      vscode.postMessage({ command: 'ready' });
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRefresh = () => {
    setLoading(true);
    if (vscode) {
      vscode.postMessage({ command: 'refresh' });
    } else {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerMessage.trim()) return;

    const newMsg = createAgencyMessage(
      composerFrom,
      composerTo,
      state?.phase || 'DEVELOPMENT',
      composerType,
      composerRefDoc,
      composerMessage,
      composerStatus
    );

    if (vscode) {
      vscode.postMessage({ command: 'sendMessage', message: newMsg });
    } else {
      setMessages([...messages, newMsg]);
    }
    
    setComposerMessage('');
  };

  if (loading && !state) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2>Initializing Devio...</h2>
      </div>
    );
  }

  const activePhase = state?.phase || 'BRIEF';
  const blocked = isPhaseBlocked(messages, activePhase);

  return (
    <div className="app-container">
      {/* Sidebar for Context & Controls */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-glow"></div>
          <h1>DEVIO AI</h1>
          <span className="badge">Orchestrator</span>
        </div>

        <section className="glass-panel status-panel">
          <h3>Current Status</h3>
          <div className={`status-indicator ${blocked ? 'status-blocked' : 'status-active'}`}>
            <span className="dot"></span>
            {blocked ? 'BLOCKED' : 'ACTIVE'}
          </div>
          <div className="meta-item">
            <span className="label">Phase</span>
            <span className="value highlight">{formatPhaseName(activePhase)}</span>
          </div>
          <div className="meta-item">
            <span className="label">Owner</span>
            <span className="value">{state?.owner || 'None'}</span>
          </div>
        </section>

        <section className="glass-panel project-panel">
          <h3>Project Context</h3>
          <div className="meta-item">
            <span className="label">Project</span>
            <span className="value">{state?.project || 'N/A'}</span>
          </div>
          <div className="meta-item">
            <span className="label">Client</span>
            <span className="value">{state?.client || 'N/A'}</span>
          </div>
          <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Syncing...' : 'Force Sync'}
          </button>
        </section>

        <section className="glass-panel dev-tools">
          <h3>Agent Command</h3>
          {healthError && (
            <div className="health-error-banner" style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', border: '1px solid rgba(255,50,50,0.3)' }}>
              ⚠️ {healthError}
            </div>
          )}
          <form className="composer-form" onSubmit={handleSendMessage}>
            <div className="form-group">
              <label>From</label>
              <select value={composerFrom} onChange={e => setComposerFrom(e.target.value)}>
                <option value="client">client</option>
                <option value="agency-coordinator">agency-coordinator</option>
                <option value="agency-ceo">agency-ceo</option>
                <option value="agency-architect">agency-architect</option>
                <option value="agency-developer">agency-developer</option>
                <option value="agency-qa">agency-qa</option>
                <option value="agency-researcher">agency-researcher</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>To Agent</label>
              <select value={composerTo} onChange={e => setComposerTo(e.target.value)}>
                <option value="agency-ceo">agency-ceo</option>
                <option value="agency-architect">agency-architect</option>
                <option value="agency-developer">agency-developer</option>
                <option value="agency-qa">agency-qa</option>
                <option value="agency-coordinator">agency-coordinator</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Action Type</label>
                <select value={composerType} onChange={e => setComposerType(e.target.value as any)}>
                  <option value="INFO">INFO</option>
                  <option value="REQUEST_CHANGE">REQUEST_CHANGE</option>
                  <option value="SUBMIT">SUBMIT</option>
                  <option value="APPROVE">APPROVE</option>
                  <option value="ESCALATE">ESCALATE</option>
                  <option value="REVISION">REVISION</option>
                </select>
              </div>
              <div className="form-group half">
                <label>Status</label>
                <select value={composerStatus} onChange={e => setComposerStatus(e.target.value as any)}>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="OPEN">OPEN (Blocker)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Ref Doc (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 03_architecture.md" 
                value={composerRefDoc} 
                onChange={e => setComposerRefDoc(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Message payload</label>
              <textarea 
                placeholder="Instruct the agent..." 
                value={composerMessage}
                onChange={e => setComposerMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <button type="submit" className="btn-send" disabled={!composerMessage.trim() || !!healthError}>
              Invoke Agent
            </button>
          </form>
        </section>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <header className="chat-header">
          <h2>Message Bus Stream</h2>
          <div className="msg-count">{messages.length} Events</div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">No messages in the bus yet.</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.from === 'client' ? 'outgoing' : 'incoming'} type-${msg.type.toLowerCase()}`}>
                <div className="msg-header">
                  <span className="msg-from">{msg.from}</span>
                  <span className="msg-arrow">→</span>
                  <span className="msg-to">{msg.to}</span>
                  <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className="msg-body">{msg.message}</div>
                
                <div className="msg-footer">
                  <span className="msg-type">{msg.type}</span>
                  <span className="msg-phase">Phase: {formatPhaseName(msg.phase)}</span>
                  {msg.ref_doc && <span className="msg-doc">📄 {msg.ref_doc}</span>}
                  <span className={`msg-status ${msg.status.toLowerCase()}`}>
                    {msg.status === 'OPEN' ? '⚠️ OPEN' : '✓ RESOLVED'}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}

export default App;
