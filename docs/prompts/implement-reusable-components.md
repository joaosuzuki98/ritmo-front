# Reusable Component Implementation Prompt

Use the text below as instructions for the agent responsible for implementing the recommendations from `docs/prompts/check-reusable-components.md`:

```text
Implement the reusable component recommendations produced by `docs/prompts/check-reusable-components.md`. Reduce confirmed UI duplication through the proposed reuse, extension, or extraction while preserving intended appearance, behavior, and accessibility.

## Establish the scope

1. Read `AGENTS.md`, `docs/architecture.md`, and `docs/code_conventions.md` before making changes.
2. Use the analysis report supplied by the user or the most recent report from `check-reusable-components.md` in the conversation. If the user selects specific recommendations, implement only those; otherwise, implement all actionable recommendations in the report, following its priority and dependency order.
3. If no report is available or the intended report cannot be identified, ask the user to provide it or run the analysis prompt first. Do not invent findings or expand this task into an unrelated project-wide refactor.
4. Inspect `git status` and relevant diffs. Preserve pre-existing user work; do not discard, overwrite, stage, or commit it. Do not create commits or push unless explicitly requested.

## Revalidate the recommendations

1. Read the current implementations, affected call sites, existing reusable components, styles, and relevant tests. Treat report line numbers as navigation hints and verify the actual code before editing.
2. Confirm that each proposed extraction still has at least two relevant occurrences and a coherent shared UI responsibility. If an existing component now covers the requirement, reuse it instead of introducing a duplicate.
3. Identify supported variations, accessibility requirements, interaction handlers, loading and disabled states, and platform-specific behavior. Resolve implementation details from the code and conventions; ask only when an unresolved product decision would change intended behavior.
4. Skip recommendations that are already implemented, no longer justified, incompatible with the architecture, or still lack essential context. Record the reason and continue with independent actionable items.

## Implement the refactor

1. Apply the smallest cohesive change for each recommendation. Reuse or extend an existing component when the report calls for it; otherwise, extract the common UI into a focused component with a small, typed props or composition API.
2. Place shared UI in `src/components/<Name>/` with named exports and an `index.ts` barrel. Keep screen-exclusive components inside that screen's `components/` folder. Follow the repository's NativeWind and theme conventions, using separate styles only where appropriate.
3. Keep business logic, navigation decisions, and data access in their existing responsible layers. Pass data and callbacks through props, and avoid dependencies from shared components into screens or circular imports.
4. Preserve existing consumers when extending a component. Add only the capabilities needed by the selected recommendations; avoid speculative variants, unrelated API redesigns, or conditional flags for unrelated responsibilities.
5. Migrate all applicable occurrences identified in the selected recommendations. Preserve content, layout, event semantics, refs, accessibility, and meaningful differences between callers. Do not leave an extracted component unused or migrate only one occurrence without explaining the blocker for the others.
6. When a recommendation concerns only tokens or shared styles, apply the appropriate existing style primitives rather than forcing a component extraction.
7. Remove imports, markup, styles, and helpers made obsolete by the refactor only after verifying that they have no remaining consumers. Keep unrelated cleanup outside the change.

## Verify and report

1. Review the diff for scope, component boundaries, migrated occurrences, and unintended visual or behavioral changes.
2. Run `npm run lint`, the relevant existing tests, and the project's available TypeScript check. Inspect the repository configuration to choose the correct commands. Fix issues introduced by the refactor and distinguish pre-existing failures from new ones.
3. Add or update focused tests only when needed to cover meaningful behavior or a regression risk introduced by the extraction or extension. Keep tests under the root `__tests__/` directory, following repository conventions; avoid tests that merely mirror markup.
4. Perform the relevant visual, interaction, and accessibility checks when the runtime is available. Clearly identify any checks that could not be performed; do not claim visual parity or passing checks without verification.
5. Respond in the user's language. Summarize the components reused, extended, or created, their file paths, and the migrated call sites. Map each selected recommendation to completed, already satisfied, or skipped with its reason, and report checks run, outcomes, and remaining blockers.
```
