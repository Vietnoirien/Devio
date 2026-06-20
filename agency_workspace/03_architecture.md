# v0.11.0 Architecture Specification

## Task 1: Phase 1 — Expansion of Agent Orchestration and Team Integration

### 1.1 Designer Agent ("Tank") Job Details and Integration
- **Directory & File:** Create `.agent/skills/agency-designer/SKILL.md`.
- **Job Details:** Responsible for UI/UX visual style, layouts, and aesthetic presentation. Reviews and refines React component structures, styling, typography (Outfit, Inter), gradients, and animations. Ensures compliance with premium design tokens (CSS variables, dark-mode, glassmorphism) and prevents basic browser styling.
- **Activation Workflows:** Active in PROPOSAL (analyzes UI features, outlines visual elements), ARCHITECTURE (defines CSS structure, typography, tokens, components), and DEVELOPMENT (implements styles, creates layouts, reviews frontend code before QA).
- **Settings & UI Integration:** Ensure the agent correctly registers in the dynamic Settings view. Update dropdowns in `App.tsx` and configuration fields in `package.json` to fully support manual interaction for the `agency-designer`.

### 1.2 Accountant Agent ("Councillor Hamann") Job Details and Integration
- **Directory & File:** Create `.agent/skills/agency-accountant/SKILL.md`.
- **Job Details:** Responsible for project financial modeling, budget planning, and quote calculations using regional freelance intelligence. Validates quote correctness and verifies cost allocations across project phases.
- **Activation Workflows:** Active in PROPOSAL (automatically triggered to calculate quote) and ARCHITECTURE (reviews budget impacts of changes to roadmap/tasks and updates estimates).
- **Settings & UI Integration:** Ensure the agent correctly registers in the dynamic Settings view. Update dropdowns in `App.tsx` and configuration fields in `package.json` to fully support manual interaction for the `agency-accountant`.
- **Quote Calculation Rules:** Implement logic such that the Accountant uses the formula: `Quote (in EUR HT) = Duration (working days) * 1,500 € HT` (based on a daily team rate of 1,500 € HT for 2 senior AI-powered French developers).

### 1.3 Team SKILL.md Integrations
- **CEO (`agency-ceo/SKILL.md`):** Update orchestration to redirect to `agency-designer` and `agency-accountant`. In BRIEF/PROPOSAL, collaborate with Accountant on quotes (1,500 € HT/day) and Designer on UI/UX scope. In DELIVERY, include their reports in summary.
- **Lead Developer (`agency-lead-developer/SKILL.md`):** Coordinate financial/design validation in PROPOSAL. Ensure Architect/Designer collaborate in ARCHITECTURE, and Accountant adjusts quotes. In DEVELOPMENT, ensure Designer reviews before QA.
- **Architect (`agency-architect/SKILL.md`):** Collaborate with Designer on design tokens, custom tokenizer styles, and component feasibility. Consult Accountant for budget impacts of structural changes.
- **Developer (`agency-developer/SKILL.md`):** Work closely with Designer during TDD loops for frontend features. Implement components exactly to Designer specifications.
- **QA (`agency-qa/SKILL.md`):** Check design tokens/plans with Designer in ARCHITECTURE. Audit UI quality with Designer and invoice formatting with Accountant in REVIEW.
- **Secretary (`agency-secretary/SKILL.md`):** Archive mockups from Designer and financial sheets/quotes from Accountant.
- **Trinity (`agency-trinity/SKILL.md`):** Extend HR audit logs to monitor productivity and protocol compliance of `agency-designer` and `agency-accountant`.

## Task 2: Phase 2 — Autonomous File Retrieval and File Type Presentation

### 2.1 Autonomous File Tracking & Retrieval
- **Mechanism:** The Devio extension host will record a pre-turn timestamp before initiating the agent's prompt injection. Upon turn completion, it will recursively scan the workspace.
- **Exclusions:** Exclude `.git`, `node_modules`, `dist`, `dist-webview`, and `.agent`.
- **Data Integration:** Extract paths and contents of modified/created files and append them to a new `files` array field in the `AgencyMessage` object before appending to `inbox.jsonl`.

### 2.2 File Type Detection
- **Mechanism:** Extract file extension from the path.
- **Language Mapping:** 
  - `.js`, `.jsx` -> `javascript`
  - `.ts`, `.tsx` -> `typescript`
  - `.json` -> `json`
  - `.md` -> `markdown`
  - `.html` -> `html`
  - `.css` -> `css`
  - Others -> `text`

### 2.3 Custom Syntax Highlighting
- **Constraint:** VS Code CSP restricts external scripts, prohibiting CDN-loaded highlighters (e.g., Monaco, Shiki).
- **Implementation:** Create a lightweight, single-pass Regex-based tokenizer directly in React (`App.tsx` or a dedicated component).
  - **JSON:** Parse keys, strings, booleans, and numbers.
  - **JS/TS:** Parse comments, strings, keywords, booleans, and numbers.
  - **HTML:** Parse comments, tags, attributes, and values.
- **Styling:** Apply theme-compliant CSS variables (e.g., `.token.keyword`) to wrapped `<span>` tags.

### 2.4 Markdown Rendering
- **Parser:** Implement a custom regex-based inline and block markdown parser.
- **Features:** Block tags (Headers, bullet lists, horizontal rules, preformatted code blocks) and Inline formatting (bold, italic, inline code, links).

### 2.5 Agent Attribution & Edit History
- **Data Model:** The React webview will build a file-to-agent attribution database from the `from` and `phase` fields in incoming `inbox.jsonl` messages.
- **UI Components:**
  - **Attribution Bar:** A glassmorphism header reading: `"Edited by [Agent Name] during [Phase Name]"`.
  - **Edit History Log:** A list of historical edits for the current file with timestamps and a quick-link button to view specific versions.

---
