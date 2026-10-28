# Existing Component Replacement Implementation Prompt

Use the text below as instructions for the agent responsible for implementing the recommendations from `docs/prompts/check-component-replacements.md`:

```text
Implement the compatible replacements identified by `docs/prompts/check-component-replacements.md`. Replace the reported UI elements with components that already exist in the project, using their current APIs while preserving intended appearance, behavior, and accessibility.

## Establish the scope

1. Read `AGENTS.md`, `docs/architecture.md`, and `docs/code_conventions.md` before making changes.
2. Use the analysis report supplied by the user or the most recent report from `check-component-replacements.md` in the conversation. If the user selects specific recommendations, implement only those; otherwise, implement all recommendations classified as direct replacements or replacements with call-site adaptation, following the report's priority order.
3. If no report is available or the intended report cannot be identified, ask the user to provide it or run the analysis prompt first. Do not infer a replacement list from component names alone.
4. Treat candidates classified as blocked or unsuitable as outside the implementation scope. If the user selects one, explain its reported limitation and request the missing context when relevant rather than silently changing the replacement component's contract.
5. Inspect `git status` and relevant diffs. Preserve pre-existing user work; do not discard, overwrite, stage, or commit it. Do not create commits or push unless explicitly requested.

## Revalidate compatibility

1. Read each target element in its current context and inspect the proposed component's implementation, exported props, styles, existing usages, and relevant tests. Confirm that the report still reflects the current code.
2. Verify that the existing API supports the required content, layout, interactions, loading and disabled states, validation feedback, accessibility, refs, and platform-specific behavior where applicable.
3. Confirm the component can be imported at the target location without violating architecture boundaries or introducing circular dependencies. Do not move or promote screen-local components as part of a replacement-only task.
4. If a recommendation is already implemented, record it as satisfied. If it now requires unsupported props, changes to the shared component, or unresolved behavioral decisions, record the blocker and continue with independent compatible replacements.

## Apply the replacements

1. Replace the identified markup or local component usage with the proposed existing component, importing it through the repository's established export pattern.
2. Map content, data, callbacks, children, styles, and supported variants to the component's actual API. For replacements requiring adaptation, keep changes small and local to the caller, preserving event arguments, state ownership, and existing behavior.
3. Preserve accessibility semantics, focus and ref behavior, touch targets, loading and disabled behavior, and platform-specific handling where applicable. Use supported composition and styling options without bypassing the component's contract.
4. Use existing components as implemented. Do not introduce new reusable components, add props or variants to the replacement component, change its default behavior, or use unsafe type assertions to force compatibility. If any of these becomes necessary, mark that replacement as blocked and explain why.
5. Remove imports, local wrappers, styles, and helpers made unused by the replacement only after checking all remaining consumers. Delete a superseded local component only when its selected usages have been migrated and no other usages remain.
6. Complete all compatible replacements in the selected scope without making unrelated refactors or adding adapters that effectively recreate the original element.

## Verify and report

1. Review the diff to confirm that the selected elements now use the intended existing components, obsolete code was safely removed, and shared component implementations and public APIs were preserved.
2. Run `npm run lint`, the relevant existing tests, and the project's available TypeScript check. Inspect the repository configuration to choose the correct commands. Fix issues introduced by the replacements and distinguish pre-existing failures from new ones.
3. Add or update focused tests only when the call-site adaptation introduces a meaningful regression risk, such as callback mapping or disabled-state behavior. Keep tests under the root `__tests__/` directory and avoid tests that merely assert the chosen component's presence.
4. Perform relevant visual, interaction, and accessibility checks when the runtime is available. Report unavailable checks explicitly instead of claiming verified parity.
5. Respond in the user's language. List each replaced element, the component now used, affected file paths, and any call-site adaptations. Map each selected recommendation to completed, already satisfied, or blocked with its reason, and report checks run, outcomes, and remaining limitations.
```
