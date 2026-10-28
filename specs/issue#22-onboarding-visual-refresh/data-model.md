# Data Model: Onboarding Visual Refresh

## User Account

The existing WatermelonDB `users` record remains the persisted source of truth for a Ritmo account. The feature adds a mascot name to that record; it does not create a separate mascot table.

| Field | Type / requirement | Lifecycle and validation |
|-------|--------------------|--------------------------|
| `id` | Existing record identifier | Assigned by the existing local account path. |
| `name` | String; required for new accounts | Collected on onboarding page 3, trimmed, and validated using the existing minimum-two-character rule. |
| `email` | String; required | Entered at sign-up, validated as an email, normalized and checked for uniqueness by existing account creation. |
| `password` | Existing credential input | Entered at sign-up; existing minimum-eight-character validation remains. It is not duplicated as a new profile attribute by this feature. |
| `mascot_name` | Optional string in storage; required and nonblank for new accounts | Collected on onboarding page 2, trimmed, and persisted on successful account creation. Optional storage supports existing accounts that predate the field. |
| `created_at`, `updated_at` | Existing timestamps | Continue to be assigned by the existing account-creation and update paths. |

**Relationship**: Each user account has one mascot name. The name is a profile attribute, not an independently managed entity.

**Migration**: The current local schema is version 11. Version 12 adds an optional string column named `mascot_name` to `users`. Existing rows remain valid with no mascot name; new registrations must supply a nonblank value. No existing account data is rewritten.

**Synchronization**: `mascot_name` is a profile field and is included in the existing user sync change set. Local credential fields remain excluded by the existing push sanitization. The remote sync service must accept and store the new optional profile property; backend compatibility must be confirmed because its source/schema is not in this repository.

## Registration Draft (Transient)

Before successful account creation, the flow holds `name` and `mascotName` only in in-memory screen/navigation state. This state is not written to WatermelonDB or a separate persistent store.

| State | Behavior |
|-------|----------|
| Collecting | Page 2 captures mascot name; page 3 captures user name. Values remain available while the user moves forward/back within the active flow. |
| Registration in progress | The existing registration operation receives both names with email and password. No confirmation-password value is collected. |
| Registration succeeds | One user record is created with both profile names and the existing account fields. |
| Registration fails | The user remains in the active flow; names remain available for correction/retry, and existing error handling is shown. |
| App closes before success | Transient state is discarded. On the next launch, onboarding begins at page 1 with blank name inputs. |

## Validation and Identity Rules

- A new account requires a nonblank user name and mascot name after trimming. The user's existing two-character minimum remains in force.
- Email validation, normalized-email duplicate checks, and the existing password minimum length remain unchanged.
- The user enters the password once; the confirmation field and password-match check are removed as clarified in the specification.
- Existing account rows may have no `mascot_name`. The value is required only when creating a new account through the updated onboarding flow.
