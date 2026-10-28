# Tasks: Onboarding Visual Refresh

**Input**: Design documents from `specs/issue#22-onboarding-visual-refresh/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Included for persistence, migration, navigation, and user-input behavior required by the project Constitution. Test files live under the root `__tests__/` directory.

**Organization**: Tasks are grouped by the three user stories in `spec.md`. Shared native dependency and typed flow handoff work precede story implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable with other marked tasks in the same phase because they touch different files and have no incomplete-task dependency.
- **[Story]**: User-story label (`US1`, `US2`, or `US3`); Setup and Foundational tasks have no story label.
- Every task includes the exact source, test, or contract file path it changes or validates.

## Phase 1: Setup

**Purpose**: Install the native animation runtime required by the new onboarding screens.

- [ ] T001 Add `lottie-react-native@7.5.0` to `package.json` and `package-lock.json`, then install iOS pods and update `ios/Podfile.lock` with `npm install lottie-react-native@7.5.0` and `bundle exec pod install`.

---

## Phase 2: Foundational

**Purpose**: Establish the typed, transient identity payload and route handoff used by the onboarding, registration, and sign-in stories.

**Checkpoint**: Complete these tasks before starting any user-story implementation.

- [X] T002 Define the shared `OnboardingIdentity` type (`name` and `mascotName`) in `src/types/onboarding.ts` for use across the screen, navigation, and registration layers.
- [X] T003 Add optional initial-auth-route and registration-identity props to `src/navigation/AuthNavigator.tsx`, forward the identity to `src/screens/Register/RegisterScreen.tsx`, and type the onboarding completion/sign-in callbacks in `src/screens/Onboarding/OnboardingScreen.tsx` using `OnboardingIdentity` from `src/types/onboarding.ts`; keep Login as the default auth route.

---

## Phase 3: User Story 1 - Explore Ritmo and enter identity details (Priority: P1) 🎯 MVP

**Goal**: Let a new user continue through pages 2–7, provide both names, and reach the registration handoff with an animated, Figma-aligned introduction.

**Independent Test**: From a fresh unauthenticated launch, choose Continue, verify pages 2–7 appear in order, enter valid names on pages 2 and 3, navigate backward and forward without losing them, and reach the Register handoff. Confirm looping animations, transitions, progress, accessible controls, and existing music behavior.

### Tests for User Story 1

- [X] T004 [P] [US1] Add flow tests in `__tests__/screens/Onboarding/OnboardingScreen.test.tsx` for page order, Continue, required-name feedback, back-navigation retention, progress, transitions, accessible actions, and existing music behavior.
- [X] T005 [P] [US1] Add validation tests in `__tests__/screens/Onboarding/onboardingSchema.test.ts` for trimmed required names and the existing two-character minimum for the user's name.
- [X] T006 [P] [US1] Add animation tests in `__tests__/screens/Onboarding/OnboardingAnimation.test.tsx` confirming the six page assets use automatic looping playback while visible.
- [X] T007 [P] [US1] Extend `__tests__/navigation/RootNavigator.test.tsx` to verify that completing onboarding hands the collected identity to Register and a fresh root mount starts with no unfinished identity.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `src/screens/Onboarding/onboardingSchema.ts`; enforce the data-model constraint verbatim: “A new account requires a nonblank user name and mascot name after trimming. The user's existing two-character minimum remains in force.”
- [X] T009 [P] [US1] Ensure `moon_welcoming.json`, `moon_idle_happy.json`, `moon_rotating.json`, `moon_habits.json`, `moon_schedule.json`, and `moon_reminders_and_todo.json` are included as source assets under `src/assets/animations/` (not merely present as local untracked files), verify they bundle, and map them to pages 2–7 in `src/screens/Onboarding/components/OnboardingAnimation.tsx` using `LottieView` with `autoPlay`, `loop`, and explicit dimensions after checking each against Figma.
- [X] T010 [P] [US1] Create `src/screens/Onboarding/components/OnboardingProgress.tsx` to show the current position across pages 2–7 using the app's design tokens and accessible state.
- [X] T011 [US1] Rework `src/screens/Onboarding/OnboardingScreen.tsx` into a Figma-aligned entry page with Continue and ordered pages 2–7; collect mascot name on page 2 and user name on page 3, retain values during in-session back/forward navigation, validate with `onboardingSchema.ts`, show progress and looping animations, animate page changes, provide visible/accessibly labeled control feedback, and preserve the current music lifecycle.
- [X] T012 [US1] Update `src/navigation/RootNavigator.tsx` to hold `OnboardingIdentity` only in memory, open AuthNavigator in Register mode after page 7, and pass the identity onward without persisting an unfinished draft.

**Checkpoint**: A new user can complete the guided introduction, preserve both names through the active session, and reach the registration form.

---

## Phase 4: User Story 2 - Create an account with a personalized profile (Priority: P1)

**Goal**: Create an account using email and password only, saving the user's name and mascot name to the existing local user profile.

**Independent Test**: Provide a valid `OnboardingIdentity` to Register, create an account with valid email/password, and verify both names are stored in one user record. Verify invalid input does not create a partial account and a version-11 database upgrades without losing existing users.

### Tests for User Story 2

- [X] T013 [P] [US2] Add form tests in `__tests__/screens/Register/RegisterScreen.test.tsx` verifying the page presents email and password only, receives both onboarding names, and retains them after a failed submission.
- [X] T014 [P] [US2] Extend `__tests__/database/localAuth.test.ts` to verify new registration saves both names in one user record and a failed registration does not create a partial account.
- [X] T015 [P] [US2] Extend `__tests__/database/migrations.test.ts` to verify version-11 user rows survive migration to version 12 with no `mascot_name` value.
- [X] T016 [P] [US2] Extend `__tests__/database/pushChanges.test.ts` to verify `mascot_name` is included as profile data while local credential fields remain filtered.
- [X] T017 [P] [US2] Add tests in `__tests__/screens/Register/registerSchema.test.ts` for existing email/password validation and the absence of confirmation-password validation.

### Implementation for User Story 2

- [X] T018 [US2] Add `mascotName?: string` mapped to `mascot_name` in `src/database/models/User.ts` and `src/database/schema.ts`, advance the schema to version 12, and add the version-12 migration in `src/database/migrations.ts`; preserve this data-model constraint verbatim: “Optional string in storage; required and nonblank for new accounts.”
- [X] T019 [US2] Extend `LocalRegistrationData` and `registerLocalUser` in `src/database/localAuth.ts` to write the user's name and mascot name atomically; enforce “A new account requires a nonblank user name and mascot name after trimming.” and preserve the email constraint “Entered at sign-up, validated as an email, normalized and checked for uniqueness by existing account creation.”
- [X] T020 [P] [US2] Update `src/screens/Register/registerSchema.ts` to validate email and password only; preserve “Email validation, normalized-email duplicate checks, and the existing password minimum length remain unchanged.” and the password constraint “Entered at sign-up; existing minimum-eight-character validation remains.” Keep normalized-email uniqueness in `src/database/localAuth.ts`; remove confirmation-password validation as recorded in `spec.md`.
- [X] T021 [US2] Update `src/screens/Register/RegisterScreen.tsx` to match the Figma sign-up design and render only email and password, remove name and confirmation-password inputs, combine its credentials with the `OnboardingIdentity` prop, and retain existing loading/error behavior.
- [X] T022 [US2] Run focused Jest coverage for `__tests__/screens/Register/RegisterScreen.test.tsx`, `__tests__/screens/Register/registerSchema.test.ts`, `__tests__/database/localAuth.test.ts`, `__tests__/database/migrations.test.ts`, and `__tests__/database/pushChanges.test.ts`.

**Checkpoint**: Registration creates one migrated-compatible user record with both names, existing email/password rules, and no confirmation field.

---

## Phase 5: User Story 3 - Sign in to an existing account (Priority: P2)

**Goal**: Let a returning user choose Sign in on the entry page and open the existing Login flow without collecting new-account identity.

**Independent Test**: From a fresh unauthenticated launch, choose Sign in and verify Login opens directly, onboarding name fields are bypassed, and any pending registration identity is cleared.

### Tests for User Story 3

- [X] T023 [P] [US3] Extend `__tests__/navigation/RootNavigator.test.tsx` to verify Sign in enters the existing Login route without passing a registration identity or showing pages 2–7.

### Implementation for User Story 3

- [X] T024 [P] [US3] Add the Figma-aligned Sign in action to the entry page and invoke the sign-in callback in `src/screens/Onboarding/OnboardingScreen.tsx` without collecting registration names.
- [X] T025 [P] [US3] Wire the entry-page sign-in callback in `src/navigation/RootNavigator.tsx` to start AuthNavigator at Login and clear any pending registration identity.

**Checkpoint**: Existing users can choose the Login path directly from page 1, independently of the new-user registration path.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the external profile contract and validate the integrated feature on supported platforms.

- [X] T026 [P] Verify the backend sync service accepts and persists optional `mascot_name`, then record the compatibility evidence or required coordination in `specs/issue#22-onboarding-visual-refresh/contracts/user-profile-sync.md`.
- [ ] T027 [P] Run `npm run lint`, `npm test`, and local iOS/Android checks in `specs/issue#22-onboarding-visual-refresh/quickstart.md`; record native build/device details and execute the 10-run checks for SC-001, SC-002, and SC-003. Do not perform backend sync validation in this task.
- [ ] T028 After T026 and T027, complete a registration-and-sync round trip and verify `mascot_name` reaches and persists in the user profile; record the result in `specs/issue#22-onboarding-visual-refresh/quickstart.md`.
- [X] T029 Compare every onboarding page and the sign-up page against the supplied Figma reference for layout, visual hierarchy, and controls; record page-by-page pass/fail results in `specs/issue#22-onboarding-visual-refresh/quickstart.md`.
- [ ] T030 Conduct the 10-participant usability check from SC-004 and SC-005; record completion and ease-of-understanding counts in `specs/issue#22-onboarding-visual-refresh/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Install Lottie and native dependencies; no story tasks start before this completes.
- **Foundational (Phase 2)**: Depends on Setup; defines the shared identity and handoff contracts and blocks every story.
- **User Story 1 (Phase 3)**: Depends on Foundation; establishes the new-user path and name capture.
- **User Story 2 (Phase 4)**: Depends on Foundation and the identity handoff from US1; its registration persistence can be unit-tested with a supplied identity fixture.
- **User Story 3 (Phase 5)**: Depends on the entry page from US1 and the shared Login route; it does not depend on US2's account persistence work.
- **Polish (Phase 6)**: Depends on all three stories. T026 (backend contract check) and T027 (local/native validation) can run in parallel; T028 follows both. T029 follows T028, and T030 follows T029 because all three record results in `quickstart.md`.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundation and is the MVP increment.
- **US2 (P1)**: Starts after Foundation; end-to-end handoff depends on US1, while registration validation/persistence can be developed and tested independently with an `OnboardingIdentity` fixture.
- **US3 (P2)**: Starts after Foundation and uses the entry screen delivered by US1. It can run in parallel with US2 after US1 because its implementation changes the onboarding/root route, while US2 changes registration/database files.

### Within Each User Story

- Write the included tests first and confirm they fail for the missing behavior before implementing it.
- In US1, onboarding validation, animation rendering, and progress presentation can be developed in parallel after their tests; integrate them in `OnboardingScreen.tsx` afterward.
- In US2, model/migration work and registration-schema work can proceed in parallel after tests; local persistence depends on the model field, and the form depends on both persistence and schema work.
- In US3, implement the Sign in CTA and root route callback in parallel after the route acceptance test because they touch separate files.

### Parallel Opportunities

- **US1**: T004, T005, T006, and T007 can be authored in parallel. Afterward, T008, T009, and T010 can be implemented in parallel before T011 integrates the screen.
- **US2**: T013–T017 can be authored in parallel. Afterward, T018 and T020 can be implemented in parallel; T019 follows T018, and T021 follows T019 and T020.
- **US3**: After T023, T024 and T025 can be implemented in parallel in separate source files.
- **Cross-story**: US2 and US3 can proceed in parallel after US1 is complete.
- **Polish**: T026 and T027 can run in parallel because they validate separate outputs; T028 requires both. T029 and T030 follow sequentially after T028 because they update the same `quickstart.md` file.

## Parallel Examples

### User Story 1

```text
Task T004: Add onboarding screen flow tests in __tests__/screens/Onboarding/OnboardingScreen.test.tsx
Task T005: Add identity validation tests in __tests__/screens/Onboarding/onboardingSchema.test.ts
Task T006: Add Lottie loop tests in __tests__/screens/Onboarding/OnboardingAnimation.test.tsx
Task T007: Add registration handoff tests in __tests__/navigation/RootNavigator.test.tsx
```

### User Story 2

```text
Task T013: Add register form tests in __tests__/screens/Register/RegisterScreen.test.tsx
Task T014: Add local account persistence tests in __tests__/database/localAuth.test.ts
Task T015: Add migration compatibility tests in __tests__/database/migrations.test.ts
Task T016: Add user sync payload tests in __tests__/database/pushChanges.test.ts
Task T017: Add email/password schema tests in __tests__/screens/Register/registerSchema.test.ts
```

### User Story 3

```text
Task T024: Add the Sign in entry action in src/screens/Onboarding/OnboardingScreen.tsx
Task T025: Route Sign in to Login in src/navigation/RootNavigator.tsx
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup and Foundation.
2. Complete US1 and validate the new-user introduction independently through the Register handoff.
3. Complete US2 to persist both names during account creation.
4. Complete US3 to finish the existing-user Sign in path.
5. Complete backend sync and native platform release checks.

### Incremental Delivery

1. Setup + Foundation establish the native animation runtime and typed flow contract.
2. US1 delivers the seven-page guided introduction and identity capture.
3. US2 adds email/password account creation with persisted user and mascot names.
4. US3 completes direct Sign in from the entry page.
5. Polish validates sync compatibility, lint/tests, iOS/Android playback, Figma fidelity, and the user-study outcomes.

## Notes

- `[P]` means different files and no dependency on unfinished tasks in that phase.
- Story labels map to the prioritized stories in `spec.md`.
- Mascot-name sync compatibility is an external release dependency because the backend source is not in this repository.
- Do not persist onboarding drafts: a fresh app launch before successful account creation starts at page 1 with empty name values.
