# Client Intelligence Report — Devio Client

**Prepared by:** agency-researcher (Dowzer)  
**Date:** 2026-06-17  
**Status:** COMPLETE  
**Sources:** Google Antigravity Documentation, Antigravity SDK & Plugins specs

---

## 1. Company Overview

| Field | Value |
|:---|:---|
| Company Name | Devio Client |
| Website | N/A (Internal/Plugin Project) |
| Industry / Sector | Software Development / AI Tooling |
| Country / Region | Not specified |
| Estimated Size | Not specified |
| Years in Operation | Not specified |

The client is developing an integration to natively embed the Devio AI Agency framework within the Antigravity IDE. This allows developers to interact with the Devio personas (CEO, Architect, Developer, QA) through a graphical interface directly in their development environment.

---

## 2. Products & Services

- **Devio Antigravity Plugin:** An extension/plugin providing a UI for project dashboards, message bus viewing, agent chat, and deliverable viewing within Antigravity IDE.

---

## 3. Current Digital Presence

| Dimension | Assessment |
|:---|:---|
| Website Quality | N/A |
| Mobile Friendly | N/A |
| Technology Stack (visible) | Antigravity IDE, MCP, VSIX Extension Architecture |
| Existing Portal / E-commerce | N/A |
| Social Media Activity | N/A |
| Content / SEO Strategy | N/A |

The project is heavily focused on IDE extension development.

---

## 4. Pain Points & Opportunities (Inferred)

> These are inferences from public data — not confirmed by the client.

- **Pain point:** The current Devio framework lacks a visual interface, requiring developers to inspect `jsonl` files and text documents manually.
- **Opportunity:** Antigravity IDE is based on an open-source IDE architecture (similar to VS Code), which means it supports `.vsix` extensions and standard UI Webviews.
- **Opportunity:** Antigravity has a "Plugins" architecture (`plugin.json`, `mcp_config.json`) and an SDK that can be leveraged for direct API communication and lifecycle hooks.

---

## 5. Competitive Context

IDE integrations for AI assistants are common (e.g., GitHub Copilot, Cursor). However, embedding a full multi-persona *agency state machine* (like Devio) natively into the IDE is a novel approach that differentiates the client's offering.

---

## 6. Key Facts for the Proposal

> Bullet points for quick reference by CEO and Architect.

- **Architecture Similarity:** Antigravity IDE supports `.vsix` distribution, meaning standard VS Code Extension API approaches (Webviews, File System Providers) are largely applicable.
- **API Communication:** Communication with Antigravity can be achieved via its internal API, MCP connections, or the Antigravity SDK.
- **Budget & Scope:** The client has an **unlimited budget** but strictly requests an **MVP scope** first.
- **Capabilities:** The plugin must read/write local files (`agency_workspace/`) AND communicate directly with the Antigravity API to trigger agents.

---

## 7. Research Gaps

> Items the Researcher could not verify from public sources. These may need to be addressed during the BRIEF clarification phase.

- Exact version compatibility required for the Antigravity IDE.
- Whether the "API communication" refers to the Antigravity IDE Extension API, the Antigravity Plugins/Hooks framework, or a local REST/GraphQL server running within the IDE.
