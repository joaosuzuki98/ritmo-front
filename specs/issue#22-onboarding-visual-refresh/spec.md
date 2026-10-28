# Feature Specification: Onboarding Visual Refresh

**Feature Branch**: `[feat/update-onboarding-flow-and-visuals]`

**Created**: 2026-10-20

**Status**: Draft

**Input**: GitHub issue #22 — Update onboarding visuals

## Clarifications

### Session 2026-10-20

- Q: If a user closes the app before creating an account, what should happen to their onboarding progress and entered names? → A: Restart at page 1 and clear entered names.
- Q: Should the revised sign-up page remove the current “Confirm password” field, leaving only Email and Password, or keep that field? → A: Remove the confirmation field and retain validation for email and password.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore Ritmo and enter identity details (Priority: P1)

As a new user, I want a clear, engaging introduction to Ritmo so that I understand its main features and can personalize the experience before creating an account.

**Why this priority**: The guided introduction is the central first-time experience and collects the two names needed to personalize a new account.

**Independent Test**: Start from the onboarding entry page, choose to continue, and verify the expected sequence, name-entry steps, motion, and final handoff to sign-up.

**Acceptance Scenarios**:

1. **Given** a user without an account is on the onboarding entry page, **When** they choose Continue, **Then** they see onboarding pages 2 through 7 in order before reaching sign-up.
2. **Given** a new user is moving through onboarding, **When** they reach page 2 and then page 3, **Then** page 2 asks for the mascot's name and page 3 asks for the user's name.
3. **Given** an onboarding page from 2 through 7 is visible, **When** the user remains on that page, **Then** its accompanying animation repeats without additional input, and changing pages uses an animated transition.
4. **Given** the user is on any onboarding page, **When** they interact with a control, **Then** the control responds with clear visual feedback.
5. **Given** an onboarding or sign-up page is displayed, **When** its updated presentation is reviewed against the supplied Figma reference, **Then** its visual style, layout, content hierarchy, and controls correspond to that page in the reference.
6. **Given** the user advances through onboarding pages 2 through 7, **When** each page appears, **Then** the progress indicator reflects the user's current position.
7. **Given** background music is active during onboarding, **When** the user advances between onboarding pages and sign-up, **Then** music follows the same behavior as in the existing onboarding.
8. **Given** a user closes the app before creating an account, **When** they open it again, **Then** onboarding starts at page 1 and previously entered names are cleared.

---

### User Story 2 - Create an account with a personalized profile (Priority: P1)

As a new user who has completed the introduction, I want to create an account using my email and password while keeping the names I provided so that my Ritmo experience is personalized from the beginning.

**Why this priority**: Completing registration makes the onboarding useful and ensures both identity details reach the existing account data flow.

**Independent Test**: Complete onboarding, submit valid email and password details on the final sign-up page, and verify that the resulting account retains the user's name and mascot's name.

**Acceptance Scenarios**:

1. **Given** a user has completed onboarding, **When** the final sign-up page appears, **Then** it asks for email and password only, has no confirmation-password field, and does not ask for the user's name again.
2. **Given** the user has entered both names during onboarding, **When** account creation succeeds, **Then** the user's name follows the existing user-data flow and the mascot's name is saved with the new account.
3. **Given** the user submits invalid or incomplete sign-up details, **When** account creation is rejected, **Then** existing sign-up validation and error behavior remain available and the onboarding names are not lost.

---

### User Story 3 - Sign in to an existing account (Priority: P2)

As a returning user, I want to choose sign-in directly from the onboarding entry page so that I can access my account without completing new-user onboarding.

**Why this priority**: Returning users need a direct path to the existing sign-in experience while the first screen is refreshed.

**Independent Test**: From the onboarding entry page, choose Sign in and verify that the existing sign-in flow is reached without entering the new-account onboarding sequence.

**Acceptance Scenarios**:

1. **Given** a user with an existing account is on the onboarding entry page, **When** they choose Sign in, **Then** the existing sign-in experience opens.
2. **Given** the user chooses Sign in, **When** the sign-in experience opens, **Then** they are not required to enter a mascot name or complete the new-user onboarding pages.

### Edge Cases

- If either required name is empty or contains only spaces, the user cannot advance past that name-entry step and receives a clear prompt to enter a name.
- If the user navigates back to a name-entry page during the active onboarding session, previously entered values remain available until changed.
- If the user closes the app before creating an account, onboarding restarts at page 1 and unsaved name values are cleared.
- If a user selects Sign in from the entry page, they bypass all new-account onboarding steps.
- Background music continues to follow its existing behavior as users move between onboarding pages and sign-up.
- When the keyboard is open for a name or sign-up field, the active field and the action to continue remain usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The onboarding pages and final sign-up page MUST use the visual style, layouts, content hierarchy, and controls shown in the supplied Figma reference.
- **FR-002**: The entry page MUST offer separate choices to continue as a new user or sign in to an existing account.
- **FR-003**: Choosing to continue MUST present onboarding pages 2 through 7 in order, followed by the sign-up page.
- **FR-004**: Onboarding page 2 MUST collect the mascot's name, and page 3 MUST collect the user's name; both values MUST remain available through sign-up during the active onboarding session.
- **FR-005**: The final sign-up page MUST ask only for email and password, with no password-confirmation field; existing email and password validation and account-creation behavior MUST remain.
- **FR-006**: After successful account creation, the user's name MUST continue through the existing user-data flow and the mascot's name MUST be persisted with the new account.
- **FR-007**: Each onboarding page from 2 through 7 MUST display an animation that repeats for as long as that page is visible.
- **FR-008**: Moving between onboarding pages MUST include an animated transition, and interactive controls MUST provide visible feedback when used.
- **FR-009**: Onboarding pages 2 through 7 MUST indicate the user's current position in the sequence.
- **FR-010**: Background music MUST retain its current onboarding behavior.
- **FR-011**: The existing sign-in flow MUST remain available from the onboarding entry page without requiring new-user onboarding.
- **FR-012**: If the app is closed before account creation succeeds, the next launch MUST start onboarding at page 1 and clear any names entered during the unfinished session.

### Key Entities *(include if feature involves data)*

- **User account**: The account being created, with the user's name collected during onboarding and email and password entered at sign-up.
- **Mascot identity**: The name a user chooses for their mascot, associated with that user's account and retained after registration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 10 consecutive guided new-user acceptance runs, users see the entry page, pages 2 through 7 in order, and then the sign-up page.
- **SC-002**: Across 10 successful registration runs, all 10 resulting accounts retain both the submitted user name and mascot name, and the final page requests only email and password.
- **SC-003**: Across 10 checks of each page from 2 through 7, the corresponding animation repeats continuously while its page is visible without requiring another user action.
- **SC-004**: At least 9 out of 10 usability-test participants can identify the sign-in and new-account choices and complete their intended path without assistance.
- **SC-005**: At least 9 out of 10 usability-test participants report that the updated pages make the onboarding sequence and its next action easy to understand.

## Assumptions

- The entry page is onboarding page 1; a new user proceeds through pages 2 through 7 before reaching sign-up.
- Both the user's name and the mascot's name are required inputs for a new account.
- Existing email/password validation, sign-in behavior, user-data flow, and background-music behavior remain in place; this change moves the point where the user's name is collected and adds persistence for the mascot's name.
- The supplied Figma project, Habitua version 2, is the visual reference for the onboarding and sign-up experience.
- The scope is limited to onboarding and its final sign-up handoff; other app functionality is unchanged.
