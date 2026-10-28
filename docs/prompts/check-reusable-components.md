# Reusable Component Check Prompt

Use the text below as instructions for the agent responsible for identifying repeated UI elements that could become reusable components:

```text
Inspect this project for repeated UI elements that could be consolidated into reusable components. Recommend practical extractions that reduce duplication while preserving visual consistency and intended behavior. This is a read-only analysis task: report findings in the conversation without modifying files or implementing refactors.

## Inspect the project

1. Read `AGENTS.md`, `docs/architecture.md`, and `docs/code_conventions.md` before analyzing the code. Follow the project's layer boundaries, component placement, naming, and styling conventions.
2. Inspect `src/screens/`, `src/components/`, and the relevant shared styles. Look for repeated JSX structures, styling, interaction patterns, and UI states, even when their names differ. Examples include buttons, fields, cards, headers, list items, modals, loading indicators, and empty or error states.
3. Inspect existing reusable components and their usages before proposing new ones. Identify cases where an existing component could replace duplicated markup or support a small, coherent extension.
4. Read each candidate occurrence in context, including its props, handlers, data dependencies, and relevant tests. Base findings on actual code rather than names or matching class strings alone.

## Evaluate reuse opportunities

1. Require at least two concrete occurrences for each duplication finding. Distinguish shared structure and behavior from superficial visual similarity or intentionally different business requirements.
2. Identify the common UI responsibility and the differences that must be preserved, including accessibility, loading and disabled states, validation feedback, and platform-specific behavior where applicable.
3. Prefer reusing an existing component when suitable. Otherwise, propose a focused component with a small, typed props API or composition slots. Avoid speculative abstractions and components with many conditional flags for unrelated use cases.
4. Place application-wide reusable UI in `src/components/` and screen-exclusive components in that screen's `components/` folder. Keep business logic and data access outside shared UI components, passing data and callbacks through props. Do not introduce dependencies from shared components into screens.
5. Distinguish component extraction from style reuse. If only visual tokens or simple layout styles are duplicated, explain whether existing theme tokens or shared style primitives are sufficient instead of proposing a new component.
6. Assign high, medium, or low priority based on the number of occurrences, maintenance benefit, existing inconsistencies, implementation effort, and regression risk. Explain the tradeoff rather than prioritizing repetition count alone.

## Report the findings

1. Respond in the user's language. Start with a brief summary of the inspected scope and the strongest reuse opportunities.
2. Present a table ordered by priority with the repeated element, affected files, recommended action (reuse, extend, or extract), and a short justification.
3. For each recommendation, include:
   - At least two concrete occurrence references with file paths and line numbers.
   - Shared structure and behavior, plus differences that must remain supported.
   - The existing component to reuse or the proposed component name and location.
   - A concise proposed props or composition API, following the project's TypeScript conventions.
   - Expected benefit, estimated effort, and specific regression risks.
   - Relevant existing tests or focused checks needed to validate a future refactor.
4. Mention significant look-alike cases that should remain separate and explain why. Do not invent findings to fill the report; clearly state when no worthwhile extraction is found.
5. Finish with a recommended refactoring order and any inspection limitations. Distinguish confirmed duplication from candidates requiring further investigation, and do not claim exhaustive coverage unless the relevant scope was fully inspected.
```
