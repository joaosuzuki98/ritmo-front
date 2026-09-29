<!--
Sync Impact Report
- Version change: template → 1.0.0
- Modified principles: none; initial constitution established
- Added sections: Additional Constraints; Development Workflow
- Removed sections: none
- Follow-up TODOs: none
-->

# Ritmo App Frontend Constitution

## Core Principles

### I. Offline-First Data Ownership (NON-NEGOTIABLE)
WatermelonDB MUST be the single source of truth for every entity persisted locally.
Screens MUST read from and write to the local database without waiting for network
availability. Entities owned by WatermelonDB MUST NOT be fetched or mutated through
TanStack Query. Synchronization MUST use the single `synchronize()` entry point and
MUST be triggered by foreground, reconnect, pull-to-refresh, or an approved active
session interval. This prevents duplicate sources of truth and keeps the app usable
offline.

### II. Explicit Layer Responsibilities
Each feature MUST use the layer that owns its responsibility: `services/` for raw
Axios requests, `queries/` for TanStack Query server state, `store/` for session and
UI state, `database/` for WatermelonDB persistence, `components/` for reusable
presentational UI, and `screens/` for screen composition and screen-specific logic.
Screens MUST NOT access raw services directly, and shared components MUST NOT depend
on screens. New abstractions require a concrete reuse or isolation benefit.

### III. Type Safety and Validated Boundaries
TypeScript code MUST NOT use `any`. API responses, notification payloads, persisted
external data, and user input MUST have explicit types or be represented as
`unknown` and validated before use. Zod schemas MUST validate form and untrusted
boundary data. A type MUST have one authoritative definition and MUST NOT be
duplicated across layers. This makes failures explicit and keeps contracts safe as
the application evolves.

### IV. Consistent and Accessible User Experience
Visual decisions MUST use the design tokens exposed through `styles/theme.ts`,
including colors, typography, spacing, and sizing. NativeWind MUST be the default
styling approach; `StyleSheet.create` is reserved for dynamic or computed styles.
Screens and components MUST represent loading, error, empty, offline, and success
states when applicable, and interactive controls MUST expose accessible labels and
states. This preserves a coherent experience across devices and network conditions.

### V. Testable, Simple, and Maintainable Changes
New business rules, synchronization behavior, persistence behavior, navigation
contracts, external data contracts, and non-trivial utilities MUST have appropriate
tests. A change MUST pass `npm run lint` and `npm test` before review. Code MUST
prefer the smallest correct solution, avoid speculative abstractions, and use
comments only to explain non-obvious decisions. This keeps delivery reliable while
limiting unnecessary complexity.

## Additional Constraints

- The project MUST use the documented React Native CLI stack and its established
  libraries unless an architectural change is explicitly approved.
- File names, exports, hooks, components, screens, stores, queries, schemas, models,
  and imports MUST follow `docs/code_conventions.md`.
- Shared visual tokens MUST NOT be replaced with hardcoded colors, typography, or
  spacing values without a documented exception.
- Secrets and credentials MUST NOT be committed to source control; configuration
  MUST use the project's environment and native configuration mechanisms.
- Local database mutations MUST use WatermelonDB APIs and MUST NOT manually set its
  internal `_status` or `_changed` fields.
- Notification handlers MUST remain isolated in `notifications/`; handlers for
  locally persisted entities MUST trigger synchronization rather than write payload
  data directly, and notification navigation MUST use the global navigation ref.

## Development Workflow

- Every implementation plan MUST identify the affected architecture layers and the
  source of truth for each piece of state.
- Every pull request MUST verify compliance with this Constitution, the architecture
  document, and the code conventions document.
- Changes affecting WatermelonDB schema or migrations MUST include migration review
  and tests for existing data compatibility.
- Changes affecting synchronization, API contracts, notification payloads, or
  navigation routes MUST include focused tests for success and failure paths.
- Before merge, the author MUST run `npm run lint` and `npm test`, and MUST document
  any unavailable platform-specific validation such as iOS-only checks.
- A failing quality gate MUST be fixed or explicitly accepted by the project owner;
  it MUST NOT be bypassed silently.

## Governance

This Constitution is authoritative for frontend implementation decisions and
supersedes conflicting informal practices. `docs/architecture.md` and
`docs/code_conventions.md` provide its operational detail and MUST remain aligned
with it.

Amendments MUST describe the motivation, affected principles, migration impact, and
required documentation or test changes. Amendments MUST update the version and
dates below. Versioning follows Semantic Versioning: MAJOR for incompatible rule
changes or removals, MINOR for new principles or materially expanded requirements,
and PATCH for clarifications and non-semantic corrections.

Code review MUST check Constitution compliance, and any justified exception MUST be
documented in the change description with a removal or review plan when applicable.

**Version**: 1.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22
