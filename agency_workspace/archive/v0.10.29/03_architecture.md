# Tier 1 Architectural Roadmap: Execution Order & Stability Resolution

## 1. Executive Summary
The current orchestration workflow contains a severe execution order flaw: the system attempts to switch the LLM model *before* opening a fresh conversation, and then injects the prompt before the IDE has fully registered the model change. This results in prompts being submitted with the incorrect default model. This Tier 1 roadmap rigorously scaffolds the exact execution sequence required to guarantee deterministic, stable orchestration.

## 2. Core Execution Flaw Analysis
**Current Incoherent Order:**
1. `switchModel(targetModel)`
2. `openFreshChat()` (Resets the chat context and potentially the model!)
3. `injectMessage(prompt)` (Executes immediately, often before model switch is finalized)

**Corrected Deterministic Order:**
1. `openFreshChat()` (Create the new chat context first)
2. Await UI Readiness (Ensure the new chat is active)
3. `switchModel(targetModel)` (Set the model within the correct chat context)
4. Await Model Registration (Ensure the DOM and state reflect the new model)
5. `injectMessage(prompt)` (Safely submit the prompt)

## 3. Cohesive Tier 1 Implementation Roadmap

**Task 1: Reorder Orchestration Engine Execution Pipeline**
- **Component**: `agency_workspace/src/orchestration-engine.ts`
- **Objective**: Correct the logical sequence of operations in `runTurn` to ensure model switching occurs *after* fresh chat initialization and *before* message injection.
- **Implementation Steps**:
  1. Relocate the `openFreshChat()` block to execute *before* the `switchModel()` block.
  2. Await UI Readiness: Await the completion of `convMgr.openFreshChat()` since it deterministically polls the DOM.
  3. Execute `switchModel(targetModel)`.
  4. Await Model Registration: Implement a polling loop that continuously calls `bridge.captureSnapshot()` and resolves only when `snapshot.controlsMeta.model.text` exactly matches the `targetModel`.
  5. Execute `injectMessage(prompt)`.
- **Validation**: Integration tests must assert that `convMgr.openFreshChat` is called strictly before `bridge.switchModel`.

**Task 2: Implement Deterministic Model Registration Polling Loop & TDD Integration Tests**
- **Component**: `agency_workspace/src/orchestration-engine.ts` and `agency_workspace/src/orchestration-engine.test.ts`
- **Objective**: Implement the actual asynchronous polling mechanism that guarantees the LLM switch is fully registered in the IDE DOM before proceeding, and create the tests to prove this sequence.
- **Implementation Steps**:
  1. **Polling Logic**: In `orchestration-engine.ts`, after calling `switchModel()`, implement an asynchronous `while` loop (or recursive timeout function).
  2. Inside the loop, call `await bridge.captureSnapshot()`.
  3. Evaluate `snapshot.controlsMeta.model.text`. If it equals `targetModel`, exit the loop and proceed to `injectMessage()`.
  4. Include a reasonable delay (e.g., `await new Promise(r => setTimeout(r, 100))`) inside the loop to avoid blocking the event loop.
  5. Add a safety timeout (e.g., 10 seconds) to throw an error if the model fails to switch, preventing infinite loops.
  6. **TDD Integration Tests**: In `orchestration-engine.test.ts`, create a mock for `bridge.captureSnapshot()` that simulates a delayed model update (e.g., returning the old model for the first 2 calls, and the new model on the 3rd).
  7. Assert that `injectMessage` is ONLY called after `captureSnapshot` returns the updated model.
- **Validation**: The test suite must pass with 100% coverage, specifically demonstrating that message injection is blocked until the mocked snapshot reflects the correct model.

**Task 3: Implement Error Handling and Graceful Abort for Polling Timeout**
- **Component**: `agency_workspace/src/orchestration-engine.ts` and `agency_workspace/src/orchestration-engine.test.ts`
- **Objective**: Implement robust error handling for the model registration polling loop to ensure the agency run gracefully aborts if the model fails to switch within the timeout period, preventing any message injection under the incorrect model.
- **Implementation Steps**:
  1. Evaluate the timeout condition inside the polling loop from Task 2.
  2. If the safety timeout (e.g., 10 seconds) is reached without successful registration, throw a custom `ModelSwitchTimeoutError`.
  3. Catch this error within the main `runTurn` orchestration loop.
  4. On catch, immediately invoke the `stop()` method to gracefully abort the entire agency run.
  5. Post an updated state to the webview UI (e.g., `isRunning: false`) and log an explicit error notifying the user that the run aborted due to model switch failure.
  6. **CRITICAL**: Ensure the execution path strictly bypasses `injectMessage(prompt)` when this timeout occurs.
  7. **TDD Integration Tests**: Add a test case simulating a continuous failure to switch the model (mocking `captureSnapshot` to always return the old model). Assert that `ModelSwitchTimeoutError` is thrown, `stop()` is called, and `injectMessage` is never executed.
- **Validation**: The test suite must pass with 100% coverage, demonstrating that a timeout strictly aborts the run and prevents message injection.

*(Subsequent tasks will be drafted sequentially upon validation of Task 3, following our strict task-by-task protocol)*
