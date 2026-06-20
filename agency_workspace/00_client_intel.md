# Client Intelligence Report — Devio

**Prepared by:** agency-researcher (Sam)  
**Date:** 2026-06-20  
**Status:** COMPLETE  
**Sources:** Internal Project Brief (01_brief.md), devio-antigravity-plugin codebase (extension.ts, package.json, App.tsx)

---

## 1. Company Overview

| Field | Value |
|:---|:---|
| Company Name | Devio |
| Website | Internal Repository |
| Industry / Sector | AI Multi-Agent Orchestration & Developer Tools |
| Country / Region | France / Europe |
| Estimated Size | <10 employees (Internal team) |
| Years in Operation | <1 year |

Devio is an autonomous software engineering agency operating as a state-machine-driven, multi-agent platform integrated within the Google Antigravity development environment. The framework organizes specialized AI personas (CEO, Lead Developer, Researcher, Architect, Developer, QA, HR/Trinity, Secretary/Nyobe) that collaborate via a shared message bus (`inbox.jsonl`) and coordinate on a local blackboard. Devio enforces strict quality gates, including automated testing and Test-Driven Development (TDD) loops.

---

## 2. Products & Services

- **Devio AI Agency Framework**: State-machine-driven multi-agent orchestration engine utilizing native CDP debugger connections and MCP servers for secure tool-based interactions.
- **Devio Antigravity IDE Plugin**: A VS Code-compatible IDE extension featuring an interactive React-based glassmorphism webview sidebar for real-time monitoring and event-driven orchestration.

---

## 3. Current Digital Presence

| Dimension | Assessment |
|:---|:---|
| Website Quality | Excellent |
| Mobile Friendly | No |
| Technology Stack (visible) | VS Code Extension API, TypeScript, React, Vite, vitest, CDP, MCP SDK, JSONRepair |
| Existing Portal / E-commerce | No |
| Social Media Activity | None found |
| Content / SEO Strategy | None |

Devio is built specifically as a desktop-based developer plugin running inside the Google Antigravity IDE, so it does not maintain public web storefronts or e-commerce portals. The user interface leverages modern glassmorphic designs, native messaging widgets, and dynamic settings.

---

## 4. Pain Points & Opportunities (Inferred)

> These are inferences from public data — not confirmed by the client.

- **Absence of Dedicated Designer Role**: The agency currently relies on developers to write CSS and structure layouts without dedicated UI/UX oversight, leading to basic UI design. Integrating a designer agent ("Tank") would raise the aesthetic quality to premium standards.
- **Lack of Professional Financial Quote Modeling**: Project pricing in previous versions was flat or arbitrary. Adding an accountant agent ("Councillor Hamann") allows calculating realistic project quotes based on regional freelance daily rates.
- **Simple Document Viewer Limitations**: The current document viewer requires explicit model requests and does not render file types dynamically with syntax coloring, agent-specific edit attribution, or markdown formatting.

---

## 5. Competitive Context

Devio operates in the highly competitive space of AI coding tools alongside GitHub Copilot, Cursor, Windsurf, and Devin. Unlike simple chat assistants, Devio's primary competitive advantage is its multi-agent critique loops, state-machine flow, and strict TDD enforcement.

---

## 6. Key Facts for the Proposal

- **Agent Integration**: Integrating a Designer ("Tank") and an Accountant ("Councillor Hamann") requires creating skill folders `.agent/skills/agency-designer` and `.agent/skills/agency-accountant`.
- **UI & Settings Configuration**: The new agents will automatically register in the dynamic Settings view when added to the `.agent/skills/` directory. Dropdowns in `App.tsx` and configuration fields in `package.json` must be updated to fully support manual interaction.
- **Quote Calculation Rules**: Councillor Hamann will calculate quotes using the daily rate of 2 senior AI-powered French developers. Based on 2026 market intelligence, a senior AI developer in France commands a TJM (Tarif Journalier Moyen) of **750 € HT**. Thus, the daily team rate is **1,500 € HT**.
- **Quote Formula**: `Quote (in EUR HT) = Duration (working days) * 1,500 € HT`.
- **Autonomous File Tracking & Retrieval**: To automatically capture edited files, the Devio extension host will record a pre-turn timestamp before initiating the agent's prompt injection. Upon turn completion, the extension host will scan the workspace recursively (excluding `.git`, `node_modules`, `dist`, `dist-webview`, and `.agent`), extract all files modified or created since the turn started, and append their paths and content to a new `files` array field in the `AgencyMessage` object before it is appended to `inbox.jsonl`.

---

## 7. Autonomous File Presentation & Highlighting

### 7.1 File Type Detection
- **Mechanism**: The webview will extract the file extension from the file path.
- **Language Mapping**: Map extensions to language classes for CSS styling:
  - `.js`, `.jsx` &rarr; `javascript`
  - `.ts`, `.tsx` &rarr; `typescript`
  - `.json` &rarr; `json`
  - `.md` &rarr; `markdown`
  - `.html` &rarr; `html`
  - `.css` &rarr; `css`
  - Others &rarr; `text`

### 7.2 Custom Syntax Highlighting
- **Constraint**: VS Code Content Security Policy (CSP) restricts external script sources, meaning CDN-loaded highlighters are blocked.
- **Solution**: Implement a lightweight, single-pass Regex-based tokenizer directly in React (`App.tsx` or a dedicated component) to parse and wrap tokens in styled `<span>` tags. This avoids heavy external dependency bundling (like Monaco or Shiki) and ensures fast, native rendering:
  - **JSON**: Identifies keys, strings, booleans, and numbers.
  - **JS/TS**: Identifies comments, strings, keywords (e.g., `const`, `function`, `class`), booleans, and numbers.
  - **HTML**: Identifies comments, tag names, attribute names, and values.
  - **CSS Styling**: Apply theme-compliant styling matching the IDE's colors using CSS variables (e.g. `.token.keyword`, `.token.string`).

### 7.3 Markdown Rendering
- **Parser**: Implement a regex-based inline and block markdown parser.
- **Features Supported**:
  - Block tags: Headers (`#` to `<h6>`), bullet lists (`-`/`*`), horizontal rules (`---`/`===`), and preformatted code blocks (` ``` `).
  - Inline formatting: Bold (`**bold**`), italic (`*italic*`), inline code (`` `code` ``), and links (`[text](url)`).

### 7.4 Agent Attribution & Edit History
- **Data Flow**: The React webview receives messages from `inbox.jsonl`. Since each message contains the `from` field (author agent) and the `phase` field, the webview will build a file-to-agent attribution database.
- **Visual Attribution**:
  - **Edits Attribution Bar**: The document viewer will render a glassmorphism attribution header displaying: `"Edited by [Agent Name] during [Phase Name]"`.
  - **Edit History Log**: A list of all historical edits for the current file, showing which agent made the change, a timestamp, and a quick-link button to view that specific version.

---

## 8. Agent Job Details and Operational Workflows

### 8.1 Designer Agent ("Tank")
- **Job Details**:
  - Responsible for UI/UX visual style, layouts, and aesthetic presentation.
  - Reviews and refines React component structures, styling choices, typography (e.g. Outfit, Inter), gradients, and animations.
  - Ensures compliance with premium design tokens (CSS variables, dark-mode styling, glassmorphism elements, custom scrollbars) and prevents default browser behaviors or basic layout structures.
- **Operational Workflow & Active Phases**:
  - **PROPOSAL Phase**: Analyzes proposed UI features, scopes design complexity, and outlines visual design elements to be included.
  - **ARCHITECTURE Phase**: Defines CSS structure, typography, global design tokens, custom syntax highlighting coloring rules, and React component hierarchies.
  - **DEVELOPMENT Phase**: Implements CSS styles, creates/refines front-end layouts, and reviews developers' frontend code for aesthetic quality before code is passed to QA.

### 8.2 Accountant Agent ("Councillor Hamann")
- **Job Details**:
  - Responsible for project financial modeling, budget planning, and invoice quote calculations.
  - Manages pricing formulas using regional freelance and resource intelligence (e.g., senior AI-powered developer rates).
  - Validates quote correctness and verifies cost allocations across project phases.
- **Operational Workflow & Active Phases**:
  - **PROPOSAL Phase**: Automatically triggered to calculate and verify the total quote based on the project's estimated duration and daily team rate formula (`Quote = Duration * 1,500 € HT`).
  - **ARCHITECTURE Phase**: Reviews the financial impact if there are changes to the roadmap, task list, or resource scheduling, updating the proposal's estimates accordingly before submission to the client.

---

## 9. Team Integration and SKILL.md Modifications

To fully integrate the Designer ("Tank") and Accountant ("Councillor Hamann") into the Devio multi-agent team, the following specific modifications must be made to the existing agents' `SKILL.md` files:

### 9.1 CEO Agent (`agency-ceo/SKILL.md`)
- **Orchestration Expansion**: Add `agency-designer` and `agency-accountant` to the list of redirectable skills.
- **BRIEF Phase**: Instruct the CEO to delegate to the Accountant (`agency-accountant`) for project budget modeling or quote parameters if they are unclear, and to the Designer (`agency-designer`) for design and styling constraints.
- **PROPOSAL Phase**: 
  - Mandate that the CEO must collaborate with the Accountant to calculate the project quote using the daily rate formula (`Quote = Duration * 1,500 € HT`) and verify pricing.
  - Mandate that the CEO must consult the Designer to validate premium aesthetic elements, layout structure, and typography choices (e.g. Inter/Outfit fonts, glassmorphism components) in the draft proposal.
- **DELIVERY Phase**: Include the Accountant's final financial report and the Designer's UI/UX review in the final `06_delivery_summary.md` submitted to the client.

### 9.2 Lead Developer Agent (`agency-lead-developer/SKILL.md`)
- **PROPOSAL Phase**: Direct the Lead Developer to coordinate with the Accountant and Designer to validate the proposal's financial and design feasibility before issuing approval.
- **ARCHITECTURE Phase**: 
  - Ensure the Lead Developer mandates collaboration between the Architect (`agency-architect`) and the Designer (`agency-designer`) to specify CSS design tokens, syntax highlighting tokens, and visual assets.
  - Ensure the Lead Developer delegates quote adjustments resulting from roadmap modifications to the Accountant (`agency-accountant`).
- **DEVELOPMENT Phase**: Require the Lead Developer to ensure all frontend layouts and design elements are reviewed and signed off by the Designer (`agency-designer`) for visual excellence and premium design compliance before code is submitted to QA.

### 9.3 Architect Agent (`agency-architect/SKILL.md`)
- **PROPOSAL Phase**: Instruct the Architect to collaborate with the Designer to review the technical feasibility of the proposed UI/UX components.
- **ARCHITECTURE Phase**: 
  - Mandate that the Architect collaborates with the Designer to define design tokens, custom tokenizer styles, layout components, and typography.
  - Require the Architect to consult the Accountant to assess structural and scheduling changes' budget/quote impact and update the proposal estimates.

### 9.4 Developer Agent (`agency-developer/SKILL.md`)
- **DEVELOPMENT Phase**: 
  - Direct the Developer to work closely with the Designer during the TDD loop for frontend features.
  - Require the Developer to implement components exactly as specified by the Designer's layouts and styling guidelines, ensuring premium design standards are fully met.

### 9.5 QA Agent (`agency-qa/SKILL.md`)
- **ARCHITECTURE Phase**: Mandate that QA checks design tokens and component plans with the Designer for design system compliance and accessibility.
- **REVIEW Phase**: 
  - Instruct QA to perform visual quality audits on implemented UI components in collaboration with the Designer to prevent standard browser look/feel regressions.
  - Instruct QA to audit the final invoice formatting and quote figures with the Accountant.

### 9.6 Secretary Agent (`agency-secretary/SKILL.md`)
- **Archival Protocol**: Update Nyobe's archival list to retrieve, classify, and archive design mockups from `agency-designer` and financial sheets/quotes from `agency-accountant` in the `archive/v0.11.0/` folder.

### 9.7 Trinity Agent (`agency-trinity/SKILL.md`)
- **Performance Auditing**: Extend the HR audit logs to monitor the productivity, response timelines, and protocol compliance of `agency-designer` and `agency-accountant`, saving reports to `globalStorageUri/.agent/insights/agency-designer_performance.md` and `globalStorageUri/.agent/insights/agency-accountant_performance.md`.


