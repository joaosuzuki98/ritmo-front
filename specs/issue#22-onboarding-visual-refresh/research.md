# Research: Onboarding Visual Refresh

**Date**: 2026-10-20
**Feature**: [Onboarding Visual Refresh](spec.md)

## Decisions

### Keep the existing app flow and move identity through it in memory

- **Decision**: Extend the existing `OnboardingScreen` and root/auth navigation handoff. Keep the user's name and mascot name in transient flow state until the existing registration path creates the account. A process restart before registration returns to page 1 with no draft values.
- **Rationale**: `RootNavigator` currently shows onboarding until its in-memory completion flag changes, and `AuthNavigator` already owns Login/Register/Forgot Password selection. The clarification in the spec requires incomplete names to be cleared after app closure, so no draft persistence is needed. This also keeps persisted profile data in WatermelonDB rather than adding another source of truth.
- **Alternatives considered**: Persist a registration draft in a global store or local database; rejected because the user explicitly chose to clear unsubmitted values after restart. Add a new onboarding persistence service; rejected as unnecessary.
- **Evidence**: `src/navigation/RootNavigator.tsx`; `src/navigation/AuthNavigator.tsx`; `src/screens/Onboarding/OnboardingScreen.tsx`.

### Use Lottie React Native for the required JSON animations

- **Decision**: Add `lottie-react-native` 7.5.0 and use bundled Bodymovin JSON files with `autoPlay` and `loop` enabled on the active page. Use existing Reanimated for page transitions, not as a Lottie renderer. Give each animation view explicit dimensions.
- **Rationale**: The project uses React Native 0.87.1 and React 19.2.3, which satisfy the package's declared React Native `>=0.84` and React `>=19.2` peer ranges. The package requires the New Architecture; Android has it enabled, and the iOS deployment target is 15.1, matching the package podspec. React Native Reanimated can animate a Lottie view's progress but does not decode/render Lottie files.
- **Asset choice**: Prefer the existing JSON files under `src/assets/animations/`. Their names suggest page matches (`moon_welcoming`, `moon_idle_happy`, `moon_rotating`, `moon_habits`, `moon_schedule`, `moon_reminders_and_todo`); verify each against the Figma screen before wiring it. Keep inactive-page animation views unmounted or paused so only the visible page consumes playback work.
- **Alternatives considered**: Reanimated-only animation; rejected because it cannot play the supplied Lottie compositions. `.lottie` containers; rejected because they require Metro asset-extension configuration and introduce avoidable asset-loading caveats. Replace the supplied animations with static images; rejected because issue #22 explicitly requires looping Lottie animations.
- **Compatibility caveat**: Package peer ranges cover this project's versions, but the exact RN 0.87.1 + Lottie 7.5.0 native pair still requires an iOS and Android build/device smoke test.

### Extend the existing WatermelonDB user profile

- **Decision**: Add `mascot_name` as an optional string column on `users`, update the `User` model, and advance the local schema from version 11 to 12 with an additive migration. Require a nonblank mascot name for new registrations, while allowing older user rows to have no value.
- **Rationale**: A mascot belongs to one user profile, and the app already creates the account as one WatermelonDB user row. A separate mascot table or preference store would split ownership without a reuse benefit. `pushChanges` filters local credentials but passes other user profile fields through the existing sync change set, so the new field naturally belongs to that profile contract.
- **Alternatives considered**: Create a separate mascot table; rejected for a single one-to-one name. Persist only in React state; rejected because the spec requires persistence after account creation. Make the new column required for every row; rejected because existing accounts need a backwards-compatible migration.
- **Integration dependency**: No backend repository or schema is included here. Confirm that the existing user sync endpoint accepts and persists `mascot_name` before shipping a client that sends it.
- **Evidence**: `src/database/models/User.ts`; `src/database/schema.ts`; `src/database/migrations.ts`; `src/database/localAuth.ts`; `src/database/sync/pushChanges.ts`.

### Keep sign-up to email and password

- **Decision**: The final form has only email and password. Preserve the current email validation and minimum eight-character password validation; remove the current confirmation-password field and its equality check.
- **Rationale**: The spec says the final page asks for email and password only. The existing `RegisterScreen` currently also collects the user's name and a separate confirmation field, while `registerSchema` validates a matching confirmation. The user clarified that the confirmation field should be removed, eliminating the conflict while preserving validation for the remaining fields.
- **Evidence**: Clarification recorded in `spec.md`; `src/screens/Register/RegisterScreen.tsx`; `src/screens/Register/registerSchema.ts`.

### Preserve existing background music behavior

- **Decision**: Keep the existing `react-native-sound` track, loop, mute state, and stop/release behavior when the onboarding screen unmounts. Keep the onboarding screen mounted while pages 1–7 change, then use the current auth handoff lifecycle for sign-in or registration.
- **Rationale**: The current music belongs to the onboarding screen and stops/releases when that screen unmounts. Reworking audio ownership is outside the feature requirement.
- **Evidence**: `src/screens/Onboarding/OnboardingScreen.tsx`.

## Sources

- [Lottie React Native README and installation](https://github.com/lottie-react-native/lottie-react-native)
- [Lottie React Native API](https://github.com/lottie-react-native/lottie-react-native/blob/master/docs/api.md)
- [Lottie React Native 7.5.0 package metadata](https://raw.githubusercontent.com/lottie-react-native/lottie-react-native/v7.5.0/packages/core/package.json)
- [Lottie React Native 7.5.0 iOS podspec](https://raw.githubusercontent.com/lottie-react-native/lottie-react-native/v7.5.0/packages/core/lottie-react-native.podspec)
- [Lottie React Native 7.5.0 Android Gradle configuration](https://raw.githubusercontent.com/lottie-react-native/lottie-react-native/v7.5.0/packages/core/android/build.gradle)
- [React Native 0.82 New-Architecture-only announcement](https://reactnative.dev/blog/2025/10/08/react-native-0.82)
- [Reanimated compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility)
- [Reanimated `useAnimatedProps`](https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps/)
- [Lottie supported-features matrix](https://github.com/airbnb/lottie/blob/master/supported-features.md)
