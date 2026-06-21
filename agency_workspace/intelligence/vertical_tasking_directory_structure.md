# Vertical Tasking Directory Structure

## Overview
Based on State-of-the-Art (SOTA) methodologies, including the primitive-first approach and Vertical Slice Architecture (VSA), traditional layer-based directory structures (e.g., separating Controllers, Services, and Repositories) are considered anti-patterns. 

Instead, "Vertical Tasking" necessitates organizing code by **feature or business capability**. Each task or "vertical slice" is fully encapsulated within a single directory, containing everything required for that feature to function end-to-end.

## Core Principles
1. **Feature Isolation:** A vertical task should reside in its own folder. Modifying a feature means touching only one folder.
2. **Minimal Coupling:** Tasks should not directly depend on each other's internal logic. Cross-slice communication should rely on events, messaging, or explicit interfaces.
3. **No Premature Abstraction:** Shared components or services should only be extracted to a `Shared` folder when there is strict duplication across multiple vertical slices.
4. **Axis of Change:** The folder structure aligns with business requirements. If a requirement changes, the impact is isolated to that specific task's directory.

## Recommended Structure
```text
src/
└── Tasks/                  # Or Features/
    ├── Task_01_Auth/
    │   ├── LoginCommand.ts
    │   ├── LoginHandler.ts
    │   ├── LoginValidator.ts
    │   └── LoginEndpoint.ts
    ├── Task_02_Dashboard/
    │   ├── GetDashboardQuery.ts
    │   ├── GetDashboardHandler.ts
    │   └── ...
    └── Shared/             # Highly restricted global logic
        ├── Infrastructure/
        └── Core/
```

## Integration with Devio Methodology
In the context of the Devio agency and the "Slicer" role:
- When a task is scoped, it represents a new directory under `Tasks/`.
- The `Implementer (TDD)` will only write and run tests scoped within that specific directory.
- This ensures maximum testability, zero side effects on other components, and significantly reduced cognitive load/context size for the LLM agents executing the task.
