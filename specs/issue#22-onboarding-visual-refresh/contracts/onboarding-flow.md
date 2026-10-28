# Onboarding UI Contract

## Entry and Navigation

1. A user without a restored session sees onboarding page 1.
2. Page 1 offers **Continue** for a new account and **Sign in** for an existing account.
3. **Sign in** opens the existing Login experience and bypasses the new-user onboarding pages.
4. **Continue** opens pages 2 through 7 in order. After page 7, the user reaches the final registration form.
5. Back navigation within an active onboarding session retains entered name values. Closing the app before account creation discards them; a fresh launch starts at page 1.

## Page Content and Interaction

| Page | Required user-facing content/action |
|------|-------------------------------------|
| 1 | Ritmo introduction with Continue and Sign in choices. |
| 2 | Collect the mascot's name. |
| 3 | Collect the user's name. |
| 4 | Introduce how Ritmo works. |
| 5 | Introduce habits. |
| 6 | Introduce the daily schedule. |
| 7 | Introduce reminders and tasks; continue to registration. |
| Sign-up | Collect email and password only; do not request either name again or show a confirmation-password field. |

Pages 2–7 show the corresponding Figma illustration as a continuously looping animation while visible. Page changes have an animated transition, interactive controls provide visible feedback, and the progress indicator reflects the current page. Background music and its mute/stop behavior remain consistent with the current onboarding experience. Controls expose accessible labels and states and remain usable with the keyboard open.

## Registration Handoff

- The name from page 3 and mascot name from page 2 are carried in memory to the existing registration operation.
- Email and password retain their existing validation; the current password confirmation field and equality check are removed.
- Successful registration creates one user profile containing both names. A registration failure keeps the names available in the active session and uses existing error handling.
- The Login branch does not collect or submit a new mascot name.

## Figma Reference

Habitua version 2 is the visual source of truth for the onboarding and sign-up pages. Verify each provided animation asset against its corresponding page during implementation.
