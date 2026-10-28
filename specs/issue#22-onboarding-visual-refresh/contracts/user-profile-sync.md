# User Profile Sync Contract

## Scope

The feature extends the existing `users` table/profile sync record; it introduces no new endpoint or separate mascot entity.

## Field Addition

| Field | Local shape | Create/update behavior | Compatibility |
|-------|-------------|-----------------------|---------------|
| `mascot_name` | Optional string on a user record; required and nonblank for new onboarding registrations | Saved in the same local account write as the user's name and credentials. Included in generic profile changes sent through the existing user sync path. | Existing user rows and pull responses may omit it. The remote service must accept and persist the optional field before a client release sends it. |

## Existing Contract Preserved

- The existing user sync mechanism and account creation path remain in use.
- Local-only credential and login-state fields continue to be removed by current push sanitization; `mascot_name` is profile data and is not removed.
- No new identity lookup, uniqueness rule, endpoint, authentication flow, or server request is introduced by the frontend plan.
- A failed registration must not create a partial user record. A completed registration must include both the user's name and mascot name in the user profile data.

## External Dependency

The backend implementation is outside this repository. Before shipping, verify that its user sync schema accepts and persists `mascot_name`, and that older user records without the field remain valid.

## Compatibility Coordination Record (2026-10-20)

- **Status**: Backend acceptance and persistence are not verified from this frontend repository; no backend source or sync service configuration is available here.
- **Required coordination**: The backend owner must confirm that the existing user-profile sync endpoint accepts optional `mascot_name`, stores it, and accepts older records that omit it before a client release sends the field.
- **Frontend behavior**: The client includes `mascot_name` in generic user profile changes and continues filtering local password and session fields.
