import React, { useState, useEffect, useRef } from 'react';
import { formatPhaseName, isPhaseBlocked, getLatestMessages, createAgencyMessage } from './dashboard-logic';
import { AgencyState, AgencyMessage } from '../workspace-manager';
import './App.css';

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
    }
  }
  return _vscode;
}

export function _resetVsCodeApiForTests() {
  _vscode = null;
  _vsCodeAcquired = false;
}

function App() {
  const vscode = getVsCodeApi();

  const [state, setState] = useState<AgencyState | null>(null);
  const [messages, setMessages] = useState<AgencyMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [geminiMdValid, setGeminiMdValid] = useState<boolean>(true);
  const [isAgencyRunning, setIsAgencyRunning] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'devtools' | 'document' | 'settings' | 'company_insights' | 'insights_manager'>('chat');
  const [insights, setInsights] = useState<{file: string, content: string}[]>([]);
  const [agencyPrompt, setAgencyPrompt] = useState('');
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<string | null>(null);

  const [composerFrom, setComposerFrom] = useState('client');
  const [composerTo, setComposerTo] = useState('agency-ceo');
  const [composerType, setComposerType] = useState<"SUBMIT" | "REQUEST_CHANGE" | "REVISION" | "APPROVE" | "ESCALATE" | "INFO">('INFO');
  const [composerRefDoc, setComposerRefDoc] = useState('');
  const [composerStatus, setComposerStatus] = useState<"OPEN" | "RESOLVED">('RESOLVED');
  const [composerMessage, setComposerMessage] = useState('');
  const [visibleCount, setVisibleCount] = useState<number>(50);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);
  const prevActiveTab = useRef(activeTab);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && visibleCount < messages.length) {
      // Store current scroll height
      const scrollHeight = e.currentTarget.scrollHeight;
      setVisibleCount(prev => Math.min(prev + 50, messages.length));
      
      // We need to restore scroll position after render
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - scrollHeight;
        }
      }, 0);
    }
  };

  const visibleMessages = messages.slice(Math.max(messages.length - visibleCount, 0));

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
        setGeminiMdValid(message.result.checks?.geminiMdValid ?? true);
      } else if (message.type === 'documentContent') {
        setDocumentContent(message.content);
        setDocumentFile(message.file);
        setActiveTab('document');
      } else if (message.type === 'agencyRunning') {
        setIsAgencyRunning(message.isRunning);
      } else if (message.type === 'insightsData') {
        setInsights(message.insights || []);
      }
    };

    window.addEventListener('message', handleMessage);

    if (vscode) {
      vscode.postMessage({ command: 'ready' });
      vscode.postMessage({ command: 'getInsights' });
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      if (prevMessagesLength.current === 0 || prevActiveTab.current !== 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      } else if (messages.length > prevMessagesLength.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevMessagesLength.current = messages.length;
    prevActiveTab.current = activeTab;
  }, [messages, activeTab]);

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

  const handleRunAgency = () => {
    if (agencyPrompt.trim()) {
      const newMsg = createAgencyMessage(
        'client',
        'agency-ceo',
        state?.phase || 'DEVELOPMENT',
        'INFO',
        '',
        agencyPrompt,
        'RESOLVED'
      );
      if (vscode) {
        vscode.postMessage({ command: 'sendMessage', message: newMsg });
      }
      setAgencyPrompt('');
    }
    
    if (vscode) {
      setTimeout(() => {
        vscode.postMessage({ command: 'runAgency' });
      }, 100);
    }
  };

  const openDocument = (docPath: string) => {
    if (vscode) {
      vscode.postMessage({ command: 'openDocument', file: docPath });
    }
  };

  const handleFixGeminiMd = () => {
    if (vscode) {
      vscode.postMessage({ command: 'fixGeminiMd' });
    }
  };

  const handleSaveInsight = (file: string, content: string) => {
    if (vscode) {
      vscode.postMessage({ command: 'saveInsight', file, content });
    } else {
      setInsights(insights.map(i => i.file === file ? { ...i, content } : i));
    }
  };

  if (loading && !state) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2 className="loading-text">Initializing Devio...</h2>
      </div>
    );
  }

  const activePhase = state?.phase || 'BRIEF';
  const blocked = isPhaseBlocked(messages, activePhase);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <div className="brand">
            <div className="logo-glow"></div>
            <h1>DEVIO</h1>
            <span className="badge">AI Agency</span>
          </div>
          <div className="status-badge-container">
            <div className={`status-indicator ${blocked ? 'status-blocked' : 'status-active'}`}>
              <span className="dot"></span>
              {blocked ? 'BLOCKED' : 'ACTIVE'}
            </div>
            <div className="phase-badge">{formatPhaseName(activePhase)}</div>
          </div>
        </div>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Messages
          </button>
          <button 
            className={`tab-btn ${activeTab === 'document' ? 'active' : ''}`}
            onClick={() => setActiveTab('document')}
          >
            Document
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'company_insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('company_insights')}
          >
            Company Insights
          </button>
          <button 
            className={`tab-btn ${activeTab === 'insights_manager' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights_manager')}
          >
            Insights Manager
          </button>
          <button 
            className={`tab-btn ${activeTab === 'devtools' ? 'active' : ''}`}
            onClick={() => setActiveTab('devtools')}
          >
            Dev Tools
          </button>
        </div>
      </header>

      {healthError && (
        <div className="health-error-banner">
          ⚠️ {healthError}
        </div>
      )}

      {!geminiMdValid && (
        <div className="health-error-banner warning">
          ⚠️ GEMINI.md persona override is missing or incorrect. Devio requires a strict persona configuration to function properly.
          <button className="btn-fix-gemini" onClick={handleFixGeminiMd} style={{ marginLeft: '10px', padding: '4px 8px', borderRadius: '4px', background: 'var(--accent-primary)', border: 'none', color: 'white', cursor: 'pointer' }}>Apply Fix</button>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'chat' && (
          <div className="chat-layout">
            <div className="messages-container" ref={messagesContainerRef} onScroll={handleScroll}>
              {visibleMessages.length === 0 ? (
                <div className="empty-state">No messages in the bus yet.</div>
              ) : (
                [...visibleMessages].map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.from === 'client' ? 'outgoing' : 'incoming'} type-${msg.type.toLowerCase()}`}>
                    <div className="msg-header">
                      <span className="msg-from">{msg.from}</span>
                      <span className="msg-arrow">→</span>
                      <span className="msg-to">{msg.to}</span>
                      <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      <button 
                        className="btn-delete-msg" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); vscode ? vscode.postMessage({ command: 'deleteMessage', messageId: msg.id }) : null; }}
                        title="Delete Message"
                      >×</button>
                    </div>
                    
                    <div className="msg-body">
                      {(msg.message || '').split(/(@[\w\-\.\/]+)/g).map((part, i) => {
                        if (part.startsWith('@')) {
                          const docPath = part.substring(1);
                          return (
                            <span 
                              key={i} 
                              className="msg-doc-link clickable" 
                              onClick={() => openDocument(docPath)}
                              style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                              title={`Open ${docPath}`}
                            >
                              {part}
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                    
                    <div className="msg-footer">
                      <span className="msg-type">{msg.type}</span>
                      {msg.ref_doc && (
                        <span 
                          className="msg-doc clickable" 
                          onClick={() => openDocument(msg.ref_doc!)}
                          title="Open Document"
                        >
                          📄 {msg.ref_doc}
                        </span>
                      )}
                      <span className={`msg-status ${(msg.status || 'OPEN').toLowerCase()}`}>
                        {(msg.status || 'OPEN') === 'OPEN' ? '⚠️ OPEN' : '✓ RESOLVED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area glass-panel">
              <textarea 
                className="agency-prompt-input" 
                placeholder="What should the agency do next? (Optional)" 
                value={agencyPrompt}
                onChange={e => setAgencyPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRunAgency();
                  }
                }}
                rows={3}
              />
              <button className="btn-run-agency" onClick={handleRunAgency} disabled={isAgencyRunning} aria-label="Run Agency" title="Run Agency">
                {isAgencyRunning ? (
                  <div className="loader-small"></div>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <span className="glow-effect"></span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'devtools' && (
          <div className="devtools-layout">
            <section className="glass-panel dev-tools">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Agent Command (Manual Message Bus Override)</h3>
                <button className="btn-clear-chat" onClick={() => {
                  if (vscode) vscode.postMessage({ command: 'clearChat' });
                  else setMessages([]);
                }} style={{ padding: '6px 12px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px' }}>
                  Clear Chat
                </button>
              </div>
              <form className="composer-form" onSubmit={handleSendMessage}>
                <div className="form-group">
                  <label>From</label>
                  <select value={composerFrom} onChange={e => setComposerFrom(e.target.value)}>
                    <option value="client">client</option>
                    <option value="agency-ceo">agency-ceo</option>
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
                    <option value="agency-ceo">agency-ceo</option>
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
                  Dispatch Manual Event
                </button>
              </form>
            </section>
            
            <section className="glass-panel project-panel">
              <h3>Project Context & Information</h3>
              <div className="meta-item">
                <span className="label">Project</span>
                <span className="value">{state?.project || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Client</span>
                <span className="value">{state?.client || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Owner Phase</span>
                <span className="value">{state?.owner || 'None'}</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'document' && (
          <div className="document-layout">
            {documentFile ? (
              <div className="glass-panel document-panel">
                <h3>Viewing: {documentFile}</h3>
                <pre className="document-content">{documentContent}</pre>
              </div>
            ) : (
              <div className="empty-state">No document selected. Click a document tag in the chat to view it here.</div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-layout glass-panel">
            <h3>Agency Settings</h3>
            <div className="form-group">
              <label>Autonomy Mode</label>
              <select disabled>
                <option>Fully Autonomous</option>
                <option>Step-by-step</option>
              </select>
            </div>
            <div className="form-group">
              <label>Antigravity Link Port</label>
              <input type="text" value="9222" disabled />
            </div>
            <p className="help-text">Settings are managed via VS Code's settings.json (search for 'devio').</p>
          </div>
        )}

        {activeTab === 'company_insights' && (
          <div className="insights-layout glass-panel">
            <h3>Company Insights</h3>
            {insights.length === 0 ? (
              <p>No insights generated yet. The Trinity agent will generate them automatically.</p>
            ) : (
              <div className="insights-grid">
                {insights.filter(i => i.file === 'agency_performance.md').length === 0 && (
                  <p>Company insights (agency_performance.md) not found.</p>
                )}
                {insights.filter(i => i.file === 'agency_performance.md').map((insight, idx) => (
                  <div key={idx} className="insight-card">
                    <h4>{insight.file}</h4>
                    <pre className="document-content">{insight.content}</pre>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-refresh" onClick={() => vscode?.postMessage({ command: 'getInsights' })}>Refresh Insights</button>
          </div>
        )}

        {activeTab === 'insights_manager' && (
          <div className="insights-layout glass-panel">
            <h3>Insights Manager</h3>
            {insights.length === 0 ? (
              <p>No insights generated yet.</p>
            ) : (
              <div className="insights-list">
                {insights.map((insight, idx) => (
                  <div key={idx} className="insight-editor">
                    <h4>{insight.file}</h4>
                    <textarea 
                      value={insight.content} 
                      onChange={(e) => setInsights(insights.map(i => i.file === insight.file ? { ...i, content: e.target.value } : i))}
                      rows={10}
                      style={{ width: '100%', fontFamily: 'monospace', marginBottom: '10px' }}
                    />
                    <button onClick={() => handleSaveInsight(insight.file, insight.content)} style={{ padding: '6px 12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Save {insight.file}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-refresh" onClick={() => vscode?.postMessage({ command: 'getInsights' })} style={{ marginTop: '20px' }}>Refresh</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
