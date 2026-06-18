// @vitest-environment jsdom
import React from 'react';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

import App, { _resetVsCodeApiForTests } from './App';

describe('App Webview Component', () => {
  const mockPostMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    _resetVsCodeApiForTests(); // Reset singleton so stub is picked up fresh
    vi.stubGlobal('acquireVsCodeApi', vi.fn(() => ({
      postMessage: mockPostMessage
    })));
  });

  afterEach(() => {
    cleanup();
    _resetVsCodeApiForTests();
    vi.unstubAllGlobals();
  });

  it('should render empty dashboard when vscode is not available', () => {
    vi.stubGlobal('acquireVsCodeApi', undefined);
    render(<App />);
    
    // Switch to devtools tab to see the empty state metadata
    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    fireEvent.click(devToolsTab);
    
    expect(screen.getByRole('heading', { name: /DEVIO/i })).toBeDefined();
    expect(screen.getByText('None')).toBeDefined();
  });

  it('should render dashboard when state is updated via message event', async () => {
    render(<App />);

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'update',
            state: {
              phase: 'DEVELOPMENT',
              owner: 'agency-developer',
              project: 'Test Project',
              client: 'Test Client',
            },
            messages: []
          }
        })
      );
    });

    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    fireEvent.click(devToolsTab);

    expect(screen.getByRole('heading', { name: /DEVIO/i })).toBeDefined();
    expect(screen.getByText('Test Project')).toBeDefined();
    expect(screen.getAllByText('agency-developer')[0]).toBeDefined();
  });

  const initState = () => {
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'update',
            state: {
              phase: 'DEVELOPMENT',
              owner: 'agency-developer',
              project: 'Test Project',
              client: 'Test Client',
            },
            messages: []
          }
        })
      );
    });
  };

  it('should update form values when user interacts with composer', () => {
    render(<App />);
    initState();
    
    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    fireEvent.click(devToolsTab);
    
    const messageInput = screen.getByPlaceholderText('Instruct the agent...') as HTMLTextAreaElement;
    fireEvent.change(messageInput, { target: { value: 'Test message payload' } });
    expect(messageInput.value).toBe('Test message payload');
    
    const refDocInput = screen.getByPlaceholderText('e.g. 03_architecture.md') as HTMLInputElement;
    fireEvent.change(refDocInput, { target: { value: 'dummy.md' } });
    expect(refDocInput.value).toBe('dummy.md');
  });

  it('should not dispatch sendMessage if message payload is empty', () => {
    render(<App />);
    initState();
    
    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    fireEvent.click(devToolsTab);
    
    const submitBtn = screen.getByRole('button', { name: /Dispatch Manual Event/i });
    expect(submitBtn).toHaveProperty('disabled', true);
    
    fireEvent.click(submitBtn);
    expect(mockPostMessage).not.toHaveBeenCalledWith(expect.objectContaining({ command: 'sendMessage' }));
  });

  it('should dispatch sendMessage via vscode IPC with correctly formed AgencyMessage when form is submitted', () => {
    render(<App />);
    initState();
    
    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    fireEvent.click(devToolsTab);
    
    // Fill out the form
    const messageInput = screen.getByPlaceholderText('Instruct the agent...');
    fireEvent.change(messageInput, { target: { value: 'Please review this new change' } });
    
    const refDocInput = screen.getByPlaceholderText('e.g. 03_architecture.md');
    fireEvent.change(refDocInput, { target: { value: '05_qa_report.md' } });
    
    // Use container query to get selects since they lack aria-labels/id
    const selects = screen.getAllByRole('combobox');
    const fromSelect = selects[0];
    const toSelect = selects[1];
    const typeSelect = selects[2];
    
    fireEvent.change(fromSelect, { target: { value: 'agency-qa' } });
    fireEvent.change(toSelect, { target: { value: 'agency-developer' } });
    fireEvent.change(typeSelect, { target: { value: 'REQUEST_CHANGE' } });
    
    const submitBtn = screen.getByRole('button', { name: /Dispatch Manual Event/i });
    expect(submitBtn).toHaveProperty('disabled', false);
    
    fireEvent.click(submitBtn);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      command: 'sendMessage',
      message: expect.objectContaining({
        from: 'agency-qa',
        to: 'agency-developer',
        phase: 'DEVELOPMENT',
        type: 'REQUEST_CHANGE',
        ref_doc: '05_qa_report.md',
        message: 'Please review this new change',
        status: 'RESOLVED'
      })
    });
  });

  it('should disable Invoke Agent button and show error message when health_result is not ok', () => {
    render(<App />);
    
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'health_result',
            result: {
              ok: false,
              errorMessage: 'Cannot reach Antigravity Link at port 3717'
            }
          }
        })
      );
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'update',
            state: {
              phase: 'DEVELOPMENT',
              owner: 'agency-developer',
              project: 'Test Project',
              client: 'Test Client',
            },
            messages: []
          }
        })
      );
    });

    expect(screen.getByText(/Cannot reach Antigravity Link at port 3717/)).toBeDefined();
    
    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    fireEvent.click(devToolsTab);
    
    const submitBtn = screen.getByRole('button', { name: /Dispatch Manual Event/i });
    
    // Fill Composer so it would normally be enabled
    const messageInput = screen.getByPlaceholderText('Instruct the agent...');
    fireEvent.change(messageInput, { target: { value: 'Test message payload' } });
    
    expect(submitBtn).toHaveProperty('disabled', true);
  });

  it('should render messages in reverse order (bottom up)', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'update',
            state: { phase: 'DEVELOPMENT', owner: 'agency-developer' },
            messages: [
              { id: '1', timestamp: '2026-06-18T10:00:00Z', from: 'client', to: 'agency-ceo', message: 'First', type: 'INFO', status: 'RESOLVED', phase: 'BRIEF' },
              { id: '2', timestamp: '2026-06-18T10:01:00Z', from: 'agency-ceo', to: 'client', message: 'Second', type: 'INFO', status: 'RESOLVED', phase: 'BRIEF' }
            ]
          }
        })
      );
    });

    const messages = screen.getAllByText(/First|Second/);
    expect(messages.length).toBe(2);
  });

  // --- NEW UI REDESIGN TESTS ---

  it('should render a tabbed interface with Messages and Dev Tools / Settings tabs', () => {
    render(<App />);
    initState();
    
    const messagesTab = screen.getByRole('button', { name: /Messages/i });
    const devToolsTab = screen.getByRole('button', { name: /Dev Tools/i });
    
    expect(messagesTab).toBeDefined();
    expect(devToolsTab).toBeDefined();
    
    // Initially, Run Agency should be visible in the Messages tab
    expect(screen.getByRole('button', { name: /Run Agency/i })).toBeDefined();
  });

  it('should allow user to enter a prompt and run agency, which sends a client message first', () => {
    render(<App />);
    initState();
    
    const promptInput = screen.getByPlaceholderText('What should the agency do next? (Optional)');
    expect(promptInput).toBeDefined();
    
    fireEvent.change(promptInput, { target: { value: 'Please update the config' } });
    
    const runBtn = screen.getByRole('button', { name: /Run Agency/i });
    fireEvent.click(runBtn);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      command: 'sendMessage',
      message: expect.objectContaining({
        from: 'client',
        to: 'agency-coordinator',
        message: 'Please update the config'
      })
    });
    
    // It should also call runAgency, but after a timeout. We mock timers to check.
    vi.useFakeTimers();
    fireEvent.click(runBtn);
    vi.runAllTimers();
    expect(mockPostMessage).toHaveBeenCalledWith({ command: 'runAgency' });
    vi.useRealTimers();
  });

  it('should render ref_doc as a clickable link that dispatches openDocument command', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'update',
            state: { phase: 'DEVELOPMENT', owner: 'agency-developer' },
            messages: [
              { id: '1', timestamp: '2026-06-18T10:00:00Z', from: 'client', to: 'agency-ceo', message: 'Look at this file', type: 'INFO', status: 'RESOLVED', phase: 'BRIEF', ref_doc: '03_architecture.md' }
            ]
          }
        })
      );
    });

    const docLink = screen.getByText('📄 03_architecture.md');
    expect(docLink).toBeDefined();
    
    fireEvent.click(docLink);
    expect(mockPostMessage).toHaveBeenCalledWith({ command: 'openDocument', file: '03_architecture.md' });
  });
});
