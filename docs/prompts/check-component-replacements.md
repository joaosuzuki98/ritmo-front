# Existing Component Replacement Check Prompt

Use the text below as instructions for the agent responsible for checking whether UI elements can be replaced with components that already exist in the project:

```text
Inspect the project's UI for elements that could be replaced with existing components. Identify concrete opportunities to use the current component library while preserving intended appearance, behavior, and accessibility. This is a read-only analysis task: report findings in the conversation without modifying files or implementing replacements.

## Establish the scope

1. Read `AGENTS.md`, `docs/architecture.md`, and `docs/code_conventions.md`. Follow the project's component placement, dependency boundaries, naming, and styling conventions.
2. If the user provides a file, screen, component, or code snippet, focus on those elements and inspect the surrounding context and potential replacement components. If no target is provided, inspect `src/screens/` and `src/components/` for replacement opportunities.
3. If a supplied target cannot be located or is ambiguous, explain the limitation and request the missing context. Do not silently substitute a different target or claim compatibility based on an isolated snippet when essential context is missing.

## Inspect existing components

1. Discover existing shared components and screen-local components eligible for use within the inspected scope. Read their implementations, exported props, styles, usages, and relevant tests rather than relying on their names alone.
2. Identify elements that reproduce responsibilities already handled by those components, such as buttons, text fields, cards, headers, list items, modal layouts, loading indicators, and empty or error states.
3. Verify that each candidate component can be imported at the target location without violating layer boundaries or introducing circular dependencies. Do not recommend importing screen-local components into shared components or unrelated screens.

## Evaluate each replacement

1. Compare the current element with the existing component's actual API and implementation. Check content, layout, theme tokens, supported variants, interaction handlers, loading and disabled states, accessibility, refs, and platform-specific behavior where relevant.
2. Explain how the current element's data, callbacks, children, and styles map to supported component props or composition slots. Identify any required call-site adaptation and ensure it preserves behavior.
3. Classify each candidate as:
   - Direct replacement: the existing component already supports the required appearance and behavior.
   - Replacement with call-site adaptation: the existing API is sufficient, but the caller needs a small, behavior-preserving mapping or composition change.
   - Blocked: the component lacks required capabilities, compatibility cannot be verified, or its use would violate architectural boundaries.
4. Recommend only replacements supported by the existing component API. Do not invent props, propose new components, or present a change to the component itself as an available replacement. If an extension would be necessary, identify the missing capability under blocked candidates.
5. Do not recommend replacement solely because elements look similar. Preserve meaningful differences in semantics, business requirements, accessibility, and interaction. Avoid adapters or style overrides that effectively recreate the original element or bypass the component's intended contract.
6. Prioritize compatible replacements by consistency gains, maintenance benefit, implementation effort, and regression risk. A single occurrence is sufficient when an existing component already fulfills its responsibility.

## Report the findings

1. Respond in the user's language and summarize the inspected scope and whether compatible replacements were found.
2. Present a prioritized table with the current element, its file and line reference, the existing replacement component, the compatibility classification, and a short justification.
3. For each recommended replacement, include:
   - The current element's location and the existing component's implementation and export locations.
   - Evidence that the component supports the required behavior, citing relevant props, implementation details, or existing usages.
   - A concise mapping of current content, data, callbacks, and styles to the existing API.
   - Any call-site adaptation needed, expected benefits, and specific regression risks.
   - Relevant existing tests or focused visual, interaction, and accessibility checks for a future replacement.
4. List significant blocked or unsuitable candidates separately, explaining the missing capability or incompatibility. Distinguish confirmed incompatibilities from cases with insufficient context.
5. Finish with the recommended replacement order and any inspection limitations. If no compatible replacement is found, state that clearly rather than proposing new abstractions to fill the report. Do not claim checks were run unless they actually were.
```
