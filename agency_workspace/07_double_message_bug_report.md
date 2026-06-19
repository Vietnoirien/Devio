# Bug Report: Double Message Injection

## Root Cause Analysis
The double message observed in the chat is caused by a race condition involving concurrent executions of the `runAgency` command and a brittle text-clearing mechanism in `injectMessage`.

### 1. Concurrency Vulnerability in `extension.ts`
The `runAgency` command handler in `extension.ts` does not use a lock or state flag to prevent multiple instances from running concurrently:
```typescript
case 'runAgency':
  webviewView.webview.postMessage({ type: 'agencyRunning', isRunning: true });
  try {
    let isRunning = true;
    while (isRunning) { ... }
```
If the user clicks "Run Agency" multiple times (or if a double-click occurs), multiple `while (isRunning)` loops spawn. 

### 2. Unsubmitted Prompts During Generation
When two loops run concurrently:
1. Loop A injects Prompt 1 and successfully submits it. The AI begins generating (`isGenerating = true`).
2. Loop B decides to inject Prompt 2. It calls `injectMessage()`.
3. Because the AI is generating, the chat's submit button is hidden/disabled (replaced by the "Stop" button). `injectMessage` falls back to dispatching an `Enter` keydown event, which the chat UI ignores because generation is in progress.
4. Prompt 2 is successfully inserted into the composer but **not submitted**, leaving it stranded in the text box.

### 3. Failure of `selectAll` in `antigravity.ts`
When Loop A finishes its turn and proceeds to the next phase, it calls `injectMessage()` for Prompt 3.
The `injectMessage` script attempts to clear the composer:
```javascript
editor.focus();
document.execCommand?.("selectAll", false, null);
document.execCommand?.("delete", false, null);
```
However, in modern Lexical/React editors, `document.execCommand("selectAll")` frequently fails to select all text (especially across multiple blocks or when window focus is imperfect). 
Because the selection fails, `delete` does nothing, and the subsequent `insertText` command **appends** Prompt 3 to the stranded Prompt 2.

### 4. The Result
The composer now contains `[Prompt 2] + [Prompt 3]`. Once generation finishes, the submit button is available again, and this massive concatenated double-prompt is submitted to the AI in a single message bubble.

## Recommended Fixes
1. **Add an Execution Lock**: Implement an `isAgencyRunning` lock in `extension.ts` to immediately reject overlapping `runAgency` executions.
2. **Robust Composer Clearing**: Update `injectMessage` to clear the Lexical editor natively (e.g., `editor.textContent = ''` or by dispatching `Ctrl+A` / `Cmd+A` keyboard events) rather than relying on `document.execCommand("selectAll")`.
