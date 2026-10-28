# Quickstart: Onboarding Visual Refresh

This guide validates the onboarding flow, profile persistence, migration compatibility, and native animation playback after implementation.

## Prerequisites

- Node.js 22.11 or newer and npm dependencies installed.
- For iOS validation: Xcode and CocoaPods installed.
- For Android validation: Android Studio/SDK and an emulator or device.
- The server-side user sync contract accepts the optional `mascot_name` field before testing a synced profile.

## Install and Build Native Dependencies

```bash
npm install
bundle install
bundle exec pod install
```

Rebuild the native iOS and Android apps after adding the Lottie native module; Metro reload alone does not validate native linking.

## Automated Checks

```bash
npm run lint
npm test
```

Focused regression coverage should include:

- `__tests__/screens/Onboarding/OnboardingScreen.test.tsx`: entry choices, page order, required names, back navigation, cleared values after a fresh process, page progress, animation loop setup, and music behavior.
- `__tests__/screens/Onboarding/onboardingSchema.test.ts`: trimmed required user and mascot names, including the existing two-character user-name minimum.
- `__tests__/screens/Onboarding/OnboardingAnimation.test.tsx`: each page's local JSON source is configured for automatic looping playback.
- `__tests__/navigation/RootNavigator.test.tsx`: direct sign-in path, registration handoff with transient names, and reset on a fresh app launch.
- `__tests__/screens/Register/RegisterScreen.test.tsx`: email/password-only fields, identity handoff, and retained submission errors.
- `__tests__/screens/Register/registerSchema.test.ts`: email/password validation with no password-confirmation field.
- `__tests__/database/localAuth.test.ts`: successful profile creation stores both names and failures do not create partial accounts.
- `__tests__/database/migrations.test.ts`: schema 11 users migrate to schema 12 without losing existing profile data; legacy mascot names remain absent/optional.

## Manual End-to-End Scenarios

1. Launch without a logged-in account. Confirm page 1 offers Continue and Sign in. Choose Continue and verify pages 2–7 appear in order, name collection occurs on pages 2 and 3, and progress updates as pages change.
2. On each page 2–7, verify the Figma-matched JSON animation loops while visible, page transitions animate, controls respond, and music behaves as it did in the existing onboarding.
3. Navigate back and forward during the active flow; verify entered names remain. Close the app before registration, relaunch, and verify onboarding returns to page 1 with blank names.
4. Complete onboarding. Verify the registration form contains only email and password, retains email/password validation and existing error feedback, and has no confirmation-password field. Complete registration and verify the local user profile includes the user's name and mascot name.
5. From a fresh unauthenticated launch, choose Sign in and verify the existing Login flow opens without showing new-user onboarding or collecting a mascot name.
6. Upgrade a database fixture at schema version 11; verify migration to version 12 preserves the existing user and allows its mascot name to be absent.

## Repeated Success-Criteria Runs

1. Run 10 fresh guided new-user sessions and record whether each follows page 1, pages 2–7 in order, and then sign-up (SC-001).
2. Complete 10 successful registrations using distinct valid email addresses; verify every resulting profile retains both names and the form requests only email and password (SC-002).
3. For each page from 2 through 7, perform 10 visible-playback checks and record whether its animation loops without additional input (SC-003).

## Figma Visual Review

Compare onboarding pages 1–7 and the sign-up page with the corresponding Figma frames. Record pass/fail for visual style, layout, content hierarchy, and controls for each page; verify the selected animation asset matches its page.

## Usability Check

Observe 10 first-time participants. Record how many identify the intended entry path and complete it without assistance (SC-004), and how many report that the sequence and next action are easy to understand (SC-005). Both results must meet the 9-of-10 target.

## Device Smoke Tests

```bash
npm run ios
npm run android
```

On at least one supported iOS device/simulator and one Android device/emulator, confirm all six Lottie animations render, loop, and do not block input or page transitions. The backend sync round trip is validated separately after compatibility is confirmed in `contracts/user-profile-sync.md`.

## Figma Source Review (2026-10-20)

Reference project: Habitua version 2.

| Screen | Figma node | Source-level review |
|--------|------------|---------------------|
| Entry (page 1) | `248:136` | PASS — entry copy, primary action, sign-in link, starfield, dark surface, and purple text follow the reference. |
| Mascot name (page 2) | `248:243` | PASS — welcoming animation, prompt, name input, next action, and first progress step are represented. |
| User name (page 3) | `462:665` | PASS — happy-moon animation, prompt, name input, back/next actions, and progress are represented. |
| Introduction (page 4) | `462:926` | PASS — rotating-moon animation and explanatory copy are represented. |
| Habits (page 5) | `462:1620` | PASS — habits animation, explanatory copy, and progress are represented. |
| Schedule (page 6) | `542:3262` | PASS — schedule animation, timeline explanation, and progress are represented. |
| Reminders and tasks (page 7) | `542:3755` | PASS — reminders animation, explanatory copy, final create-account action, and progress are represented. |
| Sign up | `258:201` | PASS — Figma-aligned account heading and email/password-only form; the clarified spec removes password confirmation. |

This review compares the implementation structure and tokens with the Figma node data. Native screenshot/device review remains pending under the platform validation task.

## Validation Record (2026-10-20)

- `npm run lint` — PASS.
- `npm test -- --runInBand` — PASS, 32 suites and 114 tests.
- `npx tsc --noEmit` — PASS.
- `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/opencode/ritmo-onboarding.android.bundle` — PASS; Metro resolved the onboarding JSON assets.
- `./gradlew :app:assembleDebug` — PASS, including Android autolinking and native compilation for `lottie-react-native`.
- `npm run android` — Android build completed, but installation on the connected device was canceled by the device (`INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`); no on-device playback or screenshot review was possible.
- iOS CocoaPods validation — BLOCKED: `bundle` and Ruby are unavailable in this environment, so `bundle exec pod install` could not run.
- The requested 10-run device checks for SC-001–SC-003 and the 10-participant checks for SC-004–SC-005 remain pending.
