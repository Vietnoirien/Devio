# Devio Client — HR Agent Trinity Implementation Tasks

**Prepared by:** agency-architect
**Date:** 2026-06-19
**Status:** DRAFT

---

## Task 1: Develop Inbox Analytics Engine
- **Assignee:** agency-developer
- **Action:** Create a Node.js or Python script (e.g., `scripts/analyze_inbox.js`) to parse `agency_workspace/inbox.jsonl`.
- **Requirements:**
  - Read the JSONL file safely.
  - Filter messages by specific types (e.g., `SUBMIT`, `APPROVE`, `REQUEST_CHANGE`).
  - Calculate time deltas between related events to measure review cycle times.
  - Output a condensed, token-efficient summary of the timeline and any protocol violations.
- **Validation:** The script successfully executes and produces a concise summary without throwing memory or parsing errors.

## Task 2: Create `agency-trinity` Persona Skill
- **Assignee:** agency-developer
- **Action:** Create `.agent/skills/agency-trinity/SKILL.md`.
- **Requirements:**
  - Define Trinity's role as the Devio Agency HR and Performance Analyst.
  - Instruct Trinity to consume the output of the Inbox Analytics Engine.
  - Instruct Trinity to evaluate team performance (e.g., Developer efficiency, QA thoroughness, Coordinator compliance).
  - Define the required output artifact: `performance_review.md`.
  - Specify that Trinity must broadcast a summary of actionable insights back to the Coordinator via an `INFO` message.

## Task 3: Update `agency-coordinator` Routing Logic
- **Assignee:** agency-developer
- **Action:** Modify `.agent/skills/agency-coordinator/SKILL.md`.
- **Requirements:**
  - Introduce a new routing rule or phase state (e.g., `PERFORMANCE_REVIEW` or an action during `DONE`) to invoke Trinity.
  - Ensure this invocation does not block the primary development and delivery cycles.
  - Instruct the Coordinator to update `state.json` with Trinity's performance insights when received.
- **Validation:** The Coordinator correctly routes to Trinity at the appropriate time and accurately stores the insights.

## Task 4: Integration Testing & Verification
- **Assignee:** agency-qa
- **Action:** Verify the end-to-end flow.
- **Requirements:**
  - Ensure the Analytics Engine correctly parses the current `inbox.jsonl`.
  - Validate that Trinity's `SKILL.md` produces the required `performance_review.md`.
  - Confirm the Coordinator logic functions as expected without causing deadlocks or protocol violations.
