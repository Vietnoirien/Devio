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
    expect(screen.getByRole('heading', { name: /DEVIO AI/i })).toBeDefined();
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

    expect(screen.getByRole('heading', { name: /DEVIO AI/i })).toBeDefined();
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
    
    const submitBtn = screen.getByRole('button', { name: /Invoke Agent/i });
    expect(submitBtn).toHaveProperty('disabled', true);
    
    fireEvent.click(submitBtn);
    expect(mockPostMessage).not.toHaveBeenCalledWith(expect.objectContaining({ command: 'sendMessage' }));
  });

  it('should dispatch sendMessage via vscode IPC with correctly formed AgencyMessage when form is submitted', () => {
    render(<App />);
    initState();
    
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
    
    const submitBtn = screen.getByRole('button', { name: /Invoke Agent/i });
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
    const submitBtn = screen.getByRole('button', { name: /Invoke Agent/i });
    
    // Fill Composer so it would normally be enabled
    const messageInput = screen.getByPlaceholderText('Instruct the agent...');
    fireEvent.change(messageInput, { target: { value: 'Test message payload' } });
    
    expect(submitBtn).toHaveProperty('disabled', true);
  });
});
