/**
 * VSCode Webview API global shim.
 *
 * `acquireVsCodeApi` is injected by the IDE into every webview at runtime.
 * This ambient declaration makes it visible to the TypeScript compiler so
 * that App.tsx can reference it without compile errors under strict mode.
 *
 * It must NOT be imported — it is a browser global, not a module export.
 *
 * @see https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
 */
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};
