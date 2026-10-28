# Implementation Plan: Onboarding Visual Refresh

**Branch**: `issue#22-onboarding-visual-refresh` (Spec Kit feature context; current Git branch: `feat/update-onboarding-flow-and-visuals`) | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/issue#22-onboarding-visual-refresh/spec.md`

## Summary

Reshape the current five-page mobile introduction into the specified entry choice, onboarding pages 2–7, and final account-registration flow, matching the supplied Figma. Keep the existing sign-in and local account-creation paths, move user-name entry into onboarding, and add mascot-name persistence to the existing WatermelonDB user record. Use the available JSON animation assets with `lottie-react-native`, keep onboarding draft values in memory, and preserve the current music lifecycle. The clarified sign-up page has only email and password; existing validation for those fields remains, while password confirmation is removed.

## Technical Context

**Language/Version**: TypeScript 6; React Native 0.87.1; React 19.2.3.

**Primary Dependencies**: React Navigation 7; WatermelonDB 0.28; React Hook Form 7 and Zod 4; existing React Native Sound and Reanimated 4.7; add `lottie-react-native` 7.5.0 for the required Bodymovin JSON playback.

**Storage**: WatermelonDB `users` table, currently schema version 11; add optional `mascot_name` for backward compatibility and advance the schema to version 12. Keep unfinished onboarding values in volatile flow state only.

**Testing**: Jest with `@react-native/jest-preset`, tests centralized under root `__tests__/`; focus on onboarding/navigation, registration validation and persistence, and migration compatibility. Run `npm test`, `npm run lint`, and native build/smoke checks on iOS and Android after adding the native animation dependency.

**Target Platform**: React Native CLI on iOS 15.1+ and Android (project minimum SDK 24); New Architecture enabled.

**Project Type**: Mobile application.

**Performance Goals**: No feature-specific frame-rate target. Verify that looping animations and page transitions do not prevent controls from responding on supported iOS and Android devices. No new network-latency target is introduced.

**Constraints**: WatermelonDB remains the source of truth for persisted user profile data. New styling uses the project design tokens and NativeWind by default, and interactive controls retain accessible labels/states. Preserve current account, sign-in, and music behavior except for the clarified field changes. Use local JSON animations, not `.lottie` containers. The existing `src/assets/animations/` files are present but untracked in this checkout; verify their intended inclusion before implementation changes. User-profile synchronization sends generic user fields, so the backend sync contract must accept `mascot_name`; no backend source is present in this repository.

**Scale/Scope**: One first-run flow for a single user at a time: entry page, six guided pages (2–7), then registration. Add one optional profile field and no new backend endpoint or separate mascot table. Existing sign-in, account storage behavior, and non-onboarding app screens remain outside the change.

## Constitution Check

**Pre-research gate: PASS** — the proposed work fits existing architecture and introduces no constitutional exception.

| Principle | Status | Plan alignment |
|-----------|--------|----------------|
| I. Offline-first data ownership | PASS | Persist the mascot name on the WatermelonDB user record; keep incomplete registration data transient; do not add a competing state store for persisted profile data. |
| II. Explicit layer responsibilities | PASS | Keep presentation in onboarding/register screens, flow selection in navigation, and account persistence in the existing database registration path. |
| III. Type safety and validated boundaries | PASS | Extend typed registration data and Zod validation; trim and validate required names; add no `any` or duplicate cross-layer types. |
| IV. Consistent and accessible UX | PASS | Use shared design tokens/NativeWind, provide accessible control labels/states, and preserve keyboard usability. |
| V. Testable and maintainable changes | PASS | Add focused flow, persistence, and migration tests; run lint and Jest plus native platform smoke checks. |

**Post-design gate: PASS** — the data model uses a nullable migration for existing users, contracts identify the sync boundary, and the quickstart covers functional, persistence, and native playback validation. Backend support for the new profile property is an integration dependency, not a frontend constitution exception.

## Project Structure

### Documentation (this feature)

```text
specs/issue#22-onboarding-visual-refresh/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── onboarding-flow.md
│   └── user-profile-sync.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/
├── types/
│   └── onboarding.ts               # Shared transient registration identity
├── navigation/
│   ├── RootNavigator.tsx           # Own the entry choice and registration handoff
│   └── AuthNavigator.tsx           # Start Login or Register from the selected path
├── screens/
│   ├── Onboarding/
│   │   ├── OnboardingScreen.tsx    # Entry page, pages 2–7, transient name values
│   │   ├── onboardingSchema.ts     # Validate onboarding identity fields
│   │   └── components/
│   │       ├── OnboardingAnimation.tsx
│   │       └── OnboardingProgress.tsx
│   └── Register/
│       ├── RegisterScreen.tsx      # Email/password only; receive onboarding identity
│       └── registerSchema.ts       # Preserve email/password validation
├── database/
│   ├── models/User.ts
│   ├── schema.ts                   # users schema version 12
│   ├── migrations.ts               # Add optional mascot_name column
│   └── localAuth.ts                # Persist mascot name at account creation
└── assets/animations/*.json        # Existing candidate animations; verify before use

__tests__/
├── navigation/RootNavigator.test.tsx
├── screens/Onboarding/OnboardingScreen.test.tsx
├── screens/Onboarding/OnboardingAnimation.test.tsx
├── screens/Onboarding/onboardingSchema.test.ts
├── screens/Register/RegisterScreen.test.tsx
├── screens/Register/registerSchema.test.ts
└── database/
    ├── localAuth.test.ts
    ├── pushChanges.test.ts
    └── migrations.test.ts
```

**Structure Decision**: Keep the feature in the existing single React Native application and extend its current navigation, onboarding, registration, and WatermelonDB layers. Add only onboarding-scoped components for repeated animation/progress presentation. Store user and mascot names in parent-owned in-memory flow state until registration; on successful registration write both through the existing local account operation. Document the user-facing flow and the user-profile sync field as contracts. Place all tests in the existing root `__tests__/` tree. The backend is outside this repository, so its acceptance of the new sync field must be coordinated and verified.

## Complexity Tracking

No Constitution violations or new architectural layers are proposed. The user-table migration is required to persist the newly requested profile value and is backward-compatible for existing accounts.
