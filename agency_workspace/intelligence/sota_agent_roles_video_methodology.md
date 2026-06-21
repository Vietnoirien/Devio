# SOTA Agent Roles & Personas (Video Methodology)

## Overview
Based on the referenced video methodology by Matt Pocock and his "skills" repository, the traditional horizontal agent personas (e.g., Architect, Designer, Lead Developer) must be completely redefined. The new paradigm relies on a "primitive-first" methodology that breaks down software engineering into structured phases utilizing highly specific, composable "skills" (like `Grill-me`, `TDD`, `To-PRD`). 

The new agent roles reflect *what* task is being performed in the vertical slice workflow rather than a broad, generic job title.

## Redefined Roles

### 1. The Griller (Clarifier & Stress-Tester)
**Purpose:** Operates the "Grill" session.
**Function:** Before any code is written or plans are finalized, this role interviews the client or orchestrator, asking exactly *one question at a time* to clarify designs, challenge assumptions, stress-test plans, and resolve dependencies. It prevents vague ideas from becoming spaghetti code.

### 2. The Product Manager (PRD Writer)
**Purpose:** Formalizes requirements.
**Function:** Uses the `To-PRD` skill to automate the transition from conversational context and the "Griller's" output into a formal, structured Product Requirements Document (PRD).

### 3. The Slicer (Planner & Issue Creator)
**Purpose:** Creates vertical slices.
**Function:** Uses the `To-issues` skill to parse the PRD and slice the work into independent, vertical tasks ("tracer bullets"). Each slice must be fully scoped and ready for implementation.

### 4. The Implementer (TDD Executor)
**Purpose:** Writes code utilizing Test-Driven Development.
**Function:** Uses the `TDD` skill to implement a single vertical slice. This agent writes tests first, implements the feature, ensures tests pass (Red, Green, Refactor), and produces a demonstrably working fragment of the application.

### 5. The Reviewer (Triage & Handoff)
**Purpose:** Ensures quality and state management.
**Function:** Uses the `Triage` and `Handoff` skills to organize outputs, compact the context of the current session, and smoothly transition the workflow to the next agent or back to the human for review. 

## Architectural Implication
By shifting to these roles, the Devio plugin system will execute tasks sequentially in a structured pipeline: 
`Idea -> Griller -> PRD Writer -> Slicer -> Implementer (TDD) -> Reviewer -> Handoff`. 
Each agent uses a highly focused prompt (the "skill" markdown file) rather than a monolithic, generalized persona.
