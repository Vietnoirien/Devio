# Project Brief - Devio v0.11.0 Update

## Business Goal
The client requires a major update (v0.11.0) to the Devio Agency, split into two main phases:

### Phase 1: Expansion of Agent Orchestration
1. **Designer Agent ("Tank")**:
   - Integrate a new UI/UX Designer agent named "Tank" into the orchestration workflow.
   - Tank must actively participate in the Proposal, Architecture, and Development phases to improve UI/UX design.
2. **Accountant Agent ("Councillor Hamann")**:
   - Integrate a new Accountant agent named "Councillor Hamann" who collaborates with the CEO and Lead Developer to provide realistic project quotes.
   - Quotes must be calculated based on the equivalent cost of 2 senior AI-powered European French developers.

### Phase 2: Fully Autonomous File Viewer
1. **Autonomous File Retrieval**:
   - Transition from the simple document viewer to a fully autonomous file viewer in the webview.
   - Automatically retrieve and attach files edited during a conversation directly to the messages returned from the models, without requiring explicit requests from the model.
2. **Rich File Presentation**:
   - Automatically determine file types to format them with syntax highlighting (code coloring) and support a rich markdown viewer.
   - Display clear attribution showing which file was edited by which agent.

## Constraints
- **Devio Internal Work**: There are no time limits or budgets, and the formal budget/timeline check and clarification step is skipped.

## Success Criteria
- The Designer agent "Tank" is fully integrated and participates in Proposal, Architecture, and Development phases.
- The Accountant agent "Councillor Hamann" is fully integrated and assists in drafting quotes based on 2 senior AI-powered devs.
- Files edited during the conversation are automatically detected, retrieved, and appended to the agent's messages.
- The file viewer UI displays retrieved files with syntax highlighting, markdown rendering, and agent attribution.
