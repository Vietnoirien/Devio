import React, { useMemo, useState } from 'react';
import { AgencyMessage } from '../workspace-manager';

// --- 2.2 File Type Detection ---
export function getFileType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  if (['js', 'jsx'].includes(ext)) return 'javascript';
  if (['ts', 'tsx'].includes(ext)) return 'typescript';
  if (ext === 'json') return 'json';
  if (ext === 'md') return 'markdown';
  if (ext === 'html') return 'html';
  if (ext === 'css') return 'css';
  return 'text';
}

// --- 2.3 Custom Syntax Highlighting ---
function tokenize(content: string, language: string): React.ReactNode[] {
  if (!content) return [];
  if (language === 'text' || language === 'markdown') return [content];

  const elements: React.ReactNode[] = [];
  let index = 0;

  const pushText = (text: string) => {
    if (text) elements.push(<span key={index++}>{text}</span>);
  };
  const pushToken = (text: string, type: string) => {
    if (text) elements.push(<span key={index++} className={`token ${type}`}>{text}</span>);
  };

  if (language === 'json') {
    const regex = /("(\\[^]|[^\\"])*")\s*:|("(\\[^]|[^\\"])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      pushText(content.slice(lastIndex, match.index));
      if (match[1]) {
        // Key
        const str = match[0];
        const colonIndex = str.lastIndexOf(':');
        pushToken(str.substring(0, colonIndex), 'key');
        pushText(str.substring(colonIndex));
      } else if (match[3]) {
        pushToken(match[0], 'string');
      } else if (match[5]) {
        pushToken(match[0], 'number');
      } else if (match[6]) {
        pushToken(match[0], 'boolean');
      }
      lastIndex = regex.lastIndex;
    }
    pushText(content.slice(lastIndex));
  } else if (language === 'javascript' || language === 'typescript') {
    const regex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(\\[^]|[^\\"])*"|'(\\[^]|[^\\'])*'|`(\\[^]|[^\\`])*`)|(\b(const|let|var|function|return|if|else|for|while|class|import|export|from|interface|type)\b)|(-?\d+(?:\.\d+)?)|(\b(true|false|null|undefined)\b)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      pushText(content.slice(lastIndex, match.index));
      if (match[1]) {
        pushToken(match[0], 'comment');
      } else if (match[2]) {
        pushToken(match[0], 'string');
      } else if (match[6]) {
        pushToken(match[0], 'keyword');
      } else if (match[8]) {
        pushToken(match[0], 'number');
      } else if (match[9]) {
        pushToken(match[0], 'boolean');
      }
      lastIndex = regex.lastIndex;
    }
    pushText(content.slice(lastIndex));
  } else if (language === 'html') {
    const regex = /(<!--[\s\S]*?-->)|(<\/?\w+)|(\s+\w+(?:="[^"]*")?)|(>)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      pushText(content.slice(lastIndex, match.index));
      if (match[1]) {
        pushToken(match[0], 'comment');
      } else if (match[2]) {
        pushToken(match[0], 'tag');
      } else if (match[3]) {
        const attrStr = match[0];
        const eqIdx = attrStr.indexOf('=');
        if (eqIdx !== -1) {
            pushToken(attrStr.substring(0, eqIdx), 'attribute-name');
            pushText('=');
            pushToken(attrStr.substring(eqIdx + 1), 'attribute-value');
        } else {
            pushToken(attrStr, 'attribute-name');
        }
      } else if (match[4]) {
        pushToken(match[0], 'tag');
      }
      lastIndex = regex.lastIndex;
    }
    pushText(content.slice(lastIndex));
  } else if (language === 'css') {
      const regex = /(\/\*[\s\S]*?\*\/)|([^{]+)\s*{|([^:]+):\s*([^;]+);/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        pushText(content.slice(lastIndex, match.index));
        if (match[1]) {
            pushToken(match[0], 'comment');
        } else if (match[2]) {
            pushToken(match[2], 'selector');
            pushText(' {');
        } else if (match[3]) {
            pushToken(match[3], 'property');
            pushText(': ');
            pushToken(match[4], 'value');
            pushText(';');
        }
        lastIndex = regex.lastIndex;
      }
      pushText(content.slice(lastIndex));
  }

  return elements;
}

// --- 2.4 Markdown Rendering ---
function renderMarkdown(content: string): React.ReactNode[] {
    const blocks = content.split(/\n\n+/);
    let keyIdx = 0;
    return blocks.map(block => {
        // Headers
        const headerMatch = block.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            return <Tag key={keyIdx++}>{renderInlineMarkdown(text)}</Tag>;
        }

        // Horizontal Rules
        if (/^(---+|\*\*\*+)$/.test(block.trim())) {
            return <hr key={keyIdx++} />;
        }

        // Code Blocks
        const codeBlockMatch = block.match(/^```(\w+)?\n([\s\S]*?)\n```$/);
        if (codeBlockMatch) {
            const lang = codeBlockMatch[1] || 'text';
            const code = codeBlockMatch[2];
            return (
                <pre key={keyIdx++} className={`language-${lang}`}>
                    <code>{tokenize(code, lang)}</code>
                </pre>
            );
        }

        // Bullet Lists
        if (/^[\*\-]\s+/.test(block)) {
            const items = block.split('\n').filter(line => /^[\*\-]\s+/.test(line));
            return (
                <ul key={keyIdx++}>
                    {items.map((item, i) => (
                        <li key={i}>{renderInlineMarkdown(item.replace(/^[\*\-]\s+/, ''))}</li>
                    ))}
                </ul>
            );
        }

        // Paragraph
        return <p key={keyIdx++}>{renderInlineMarkdown(block)}</p>;
    });
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(<span key={i++}>{text.slice(lastIndex, match.index)}</span>);
        }

        if (match[1]) {
            elements.push(<strong key={i++}>{match[2]}</strong>);
        } else if (match[3]) {
            elements.push(<em key={i++}>{match[4]}</em>);
        } else if (match[5]) {
            elements.push(<code key={i++}>{match[6]}</code>);
        } else if (match[7]) {
            elements.push(<a key={i++} href={match[9]}>{match[8]}</a>);
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        elements.push(<span key={i++}>{text.slice(lastIndex)}</span>);
    }

    return elements;
}

// --- 2.5 Agent Attribution & Edit History ---
interface EditRecord {
    agent: string;
    phase: string;
    timestamp: string;
    content: string;
    msgId: string;
}

export function DocumentRenderer({ 
    file, 
    content, 
    messages 
}: { 
    file: string, 
    content: string, 
    messages: AgencyMessage[] 
}) {
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

    // Build edit history for the current file
    const editHistory = useMemo(() => {
        const history: EditRecord[] = [];
        for (const msg of messages) {
            if (msg.files) {
                for (const f of msg.files) {
                    // check if paths match (simple endswith for safety)
                    if (f.path === file || f.path.endsWith(file)) {
                        history.push({
                            agent: msg.from,
                            phase: msg.phase,
                            timestamp: msg.timestamp,
                            content: f.content,
                            msgId: msg.id
                        });
                    }
                }
            }
        }
        // sort by timestamp ascending
        return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, file]);

    const latestEdit = editHistory.length > 0 ? editHistory[editHistory.length - 1] : null;
    const displayContent = selectedVersion !== null ? editHistory[selectedVersion].content : content;
    const language = getFileType(file);

    return (
        <div className="document-renderer">
            {latestEdit && (
                <div className="attribution-bar glass-panel" style={{ padding: '10px', marginBottom: '15px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                    <strong>Attribution:</strong> Edited by {latestEdit.agent} during {latestEdit.phase}
                </div>
            )}
            
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {language === 'markdown' ? (
                        <div className="markdown-body">
                            {renderMarkdown(displayContent)}
                        </div>
                    ) : (
                        <pre className="document-content">
                            <code>{tokenize(displayContent, language)}</code>
                        </pre>
                    )}
                </div>

                {editHistory.length > 0 && (
                    <div className="edit-history glass-panel" style={{ width: '250px', padding: '15px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                        <h4>Edit History</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {editHistory.map((edit, idx) => (
                                <li key={idx} style={{ marginBottom: '10px', cursor: 'pointer', padding: '5px', background: selectedVersion === idx ? 'var(--accent-primary)' : 'transparent', borderRadius: '4px' }}
                                    onClick={() => setSelectedVersion(idx === editHistory.length - 1 ? null : idx)}>
                                    <div style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{edit.agent}</div>
                                    <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{new Date(edit.timestamp).toLocaleString()}</div>
                                    <div style={{ fontSize: '0.8em' }}>{edit.phase}</div>
                                </li>
                            ))}
                            {selectedVersion !== null && (
                                <li style={{ marginTop: '10px' }}>
                                    <button onClick={() => setSelectedVersion(null)} style={{ padding: '4px 8px', fontSize: '0.8em', cursor: 'pointer' }}>View Latest</button>
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
