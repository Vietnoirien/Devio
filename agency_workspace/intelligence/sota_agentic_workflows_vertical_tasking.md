# SOTA Agentic Workflows & Vertical Tasking

## Overview
State-of-the-Art (SOTA) agentic workflows represent a paradigm shift from traditional horizontal development (where features are built across all layers simultaneously by different teams/agents) to **Vertical Tasking**.

## Vertical Tasking
In an agentic context, a "Vertical Task" is a fully encapsulated unit of work that touches every necessary layer of the application stack (e.g., UI, business logic, data persistence) to deliver a single, testable, and demonstrable feature.

### Key Characteristics
1. **End-to-End Scope:** The task spans from frontend interface down to database schema.
2. **Isolation:** Each task is defined in its own isolated file (`one file per task`), minimizing cognitive load and context window exhaustion for the LLM.
3. **Testability:** A vertical task must be fully verifiable. At the end of the task's execution, the system should be in a functional state with automated tests confirming the feature's correctness.
4. **Iterative Delivery:** Vertical tasking allows agents to iteratively build, test, and validate features one by one, reducing the likelihood of compounding errors.

## Agentic Application
When applied to multi-agent systems, vertical tasking requires orchestrating agents to handle specific slices of the task sequentially or collaboratively. The Lead Developer orchestrates the workflow, while specialized agents execute the vertical slice, ensuring that each step is bounded and verifiable before moving to the next task.
