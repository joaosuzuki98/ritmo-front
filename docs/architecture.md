# Ritmo App Frontend Architecture

## Overview

React Native app (CLI, no Expo) organized by layer type. Server state, local persistence, and global UI state are kept in separate, well-defined layers to avoid overlap and keep components dumb.

## Directory structure

```
src/
├── assets/
│   ├── images/
│   └── fonts/
│
├── styles/
│   ├── theme.ts
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── globalStyles.ts
│
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.styles.ts
│       └── index.ts
│
├── screens/
│   ├── Home/
│   │   ├── HomeScreen.tsx
│   │   ├── useHomeViewModel.ts
│   │   └── components/
│   ├── Profile/
│   └── Login/
│
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── RootNavigator.tsx
│   └── types.ts
│
├── services/
│   ├── api.ts
│   └── endpoints/
│       ├── user.ts
│       └── auth.ts
│
├── queries/
│   ├── useUserQuery.ts
│   └── useLoginMutation.ts
│
├── store/
│   ├── useAuthStore.ts
│   └── useAppStore.ts
│
├── database/
│   ├── index.ts
│   ├── schema.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Post.ts
│   └── migrations.ts
│
├── notifications/
│   ├── oneSignal.ts
│   ├── handlers/
│   │   ├── onNotificationReceived.ts
│   │   └── onNotificationOpened.ts
│   └── types.ts
│
├── forms/
│   └── schemas/
│       ├── loginSchema.ts
│       └── profileSchema.ts
│
├── hooks/
├── utils/
├── constants/
├── types/
└── App.tsx
```

## Layer conventions

### `styles/`
Global design tokens and shared style primitives — the single source of truth for anything visual that should stay consistent across the app.

- **`theme.ts`** — combines colors, typography, and spacing into one exported `theme` object (and a `Theme` type). This is what components and screens import when they need a token; they never hardcode a hex value or a pixel size directly.
- **`colors.ts`** — the color palette (brand colors, semantic colors like `success`/`error`/`warning`, neutrals). If the app supports light/dark mode, this file exports both palettes and `theme.ts` resolves the active one.
- **`typography.ts`** — font families, sizes, weights, and line heights, usually as named presets (`heading1`, `body`, `caption`) rather than raw values.
- **`spacing.ts`** — the spacing/sizing scale (e.g. a 4pt or 8pt grid) used for margins, padding, and gaps, so layout stays consistent instead of ad hoc.
- **`globalStyles.ts`** — a small set of reusable `StyleSheet.create()` snippets for patterns that repeat across many components (e.g. `flexCenter`, `shadowCard`, `screenContainer`). This is not a place for screen-specific or component-specific styles — those stay next to their component (`Button.styles.ts`) or screen, as already established.

This folder is intentionally separate from `constants/`: `constants/` holds arbitrary fixed values used across layers (strings, config flags, magic numbers), while `styles/` is specifically the app's design system — the tokens that give visual consistency and make theming (e.g. light/dark mode) a one-file change instead of a search-and-replace across components.

### `components/`
Pure, reusable UI components with no business logic or data access. They don't know where their data comes from — everything arrives via props. They consume tokens from `styles/theme.ts` for colors, spacing, and typography, but any component-specific layout still lives in that component's own `.styles.ts` file.

### `screens/`
One folder per screen. Each may contain:
- The screen component (`XScreen.tsx`)
- A view-model hook (`useXViewModel.ts`), when the logic is complex enough to separate from rendering
- A `components/` subfolder for components used exclusively by that screen

### `navigation/`
Stack/tab configuration and route typing (`ParamList`). Single source of truth for the app's navigation flow.

### `services/`
Raw HTTP access layer, via Axios. Holds the configured instance (baseURL, interceptors, headers) and endpoints organized by domain. Knows nothing about caching, state, or UI — it only makes requests and returns data.

### `queries/`
TanStack Query hooks (`useQuery`, `useMutation`) wrapping calls from `services/`. Responsible for caching, invalidation, and loading/error states. This is the layer screens actually consume for server data.

### `store/`
Zustand global state, reserved for UI/session state (authenticated user, theme, app flags). Doesn't duplicate data already owned by TanStack Query (server) or WatermelonDB (local persistence).

### `database/`
WatermelonDB setup: schema, models, and migrations. Kept isolated since it tends to grow independently from the rest of the app.

### `notifications/`
OneSignal SDK integration on top of FCM (Android) / APNs (iOS). See the dedicated section below.

### `forms/schemas/`
Zod validation schemas. Screen-specific schemas can live inside the `screens/` folder itself; schemas reused across multiple forms are centralized here. React Hook Form's `useForm` hooks usually live in the screen itself or in a custom hook (`useLoginForm.ts`), with no dedicated folder.

### `hooks/`
Generic hooks not tied to a specific screen or domain (e.g. `useDebounce`, `useKeyboard`).

### `utils/`, `constants/`, `types/`
Helper functions, fixed values (colors, sizes, strings), and global types shared across layers.

## Offline-first strategy (WatermelonDB)

### Why

Ritmo is built offline-first for the data that matters most to the user experience: the app must stay fully usable without connectivity, and the network should never block a screen from rendering or a write from succeeding.

To make that guarantee hold, **WatermelonDB is the single source of truth for the UI** on any entity it owns. Screens never wait on a network request to read or write that data — they read from and write to the local database, which is always available and fast (SQLite-backed). The backend becomes an eventually-consistent mirror of the local state, not a dependency of the render path.

This has a direct consequence for the other data layers:
- `services/` + `queries/` (Axios + TanStack Query) are reserved for data that is **not** persisted locally — things that don't need offline support (e.g. a one-off remote lookup, a non-critical screen that's fine being online-only).
- Any entity that lives in WatermelonDB is **never** fetched or mutated through TanStack Query. The only bridge between that entity and the backend is the sync engine below. Mixing the two paths for the same entity is what causes stale caches, double sources of truth, and hard-to-debug conflicts — so it's a hard rule, not a style preference.

### How

Sync is implemented with WatermelonDB's built-in `synchronize()` protocol (`src/database/sync/synchronize.ts`), which runs a two-phase exchange with the backend:

1. **Pull** (`pullChanges.ts`)
   - The client sends `lastPulledAt`, the timestamp of the last successful sync (`null` on first run).
   - The backend returns every `created` / `updated` / `deleted` record, per table, since that timestamp, plus a new server timestamp.
   - WatermelonDB applies these changes locally and stores the new timestamp as the next `lastPulledAt`.

2. **Push** (`pushChanges.ts`)
   - WatermelonDB tracks local mutations automatically via each record's `_status` (`created` / `updated` / `deleted`) and `_changed` fields — these are internal to the library and must never be set by hand.
   - The client sends only these pending local changes to the backend.
   - The backend applies them and acknowledges; on success, WatermelonDB clears the local `_status` flags.

**Conflict resolution:** last-write-wins based on each record's `updated_at`, which is what WatermelonDB's sync adapter uses by default. This is a rule to apply consistently, not decide per entity: if a specific table later needs a smarter merge (e.g. two fields edited independently offline), that's an explicit exception implemented in that table's push handler on the backend — not a case-by-case decision made client-side.

**When sync runs:**
- On app foreground (`AppState` listener).
- On network reconnect (`NetInfo` listener going from offline → online).
- On explicit user action (pull-to-refresh).
- Optionally, on a background interval while the app is active, for long-lived sessions.

Every trigger calls the same `synchronize()` entry point — there's no separate "manual sync" code path, which keeps the conflict-resolution rule uniform regardless of what triggered the sync.

## Push Notifications (OneSignal + FCM)

The backend triggers notifications via **OneSignal**, which in turn uses **FCM** as the provider on Android (and APNs on iOS). The app never talks directly to FCM — all the integration goes through the OneSignal SDK, isolated in `notifications/`.

- **`notifications/oneSignal.ts`**
  SDK initialization (`OneSignal.initialize(appId)`), setup of permission listeners, and linking the `externalId` to the logged-in user, called right after a successful login.

- **`notifications/handlers/onNotificationReceived.ts`**
  Handles notifications received while the app is in the foreground/background. If the payload references an entity that lives in WatermelonDB, the handler does not write the data locally from the payload — it simply triggers `synchronize()` (the same single entry point used by the offline-first strategy) to fetch the real data from the backend. If it references data that isn't persisted locally, it invalidates the corresponding TanStack Query query.

- **`notifications/handlers/onNotificationOpened.ts`**
  Handles the notification tap. Since this handler runs outside the React tree, navigation uses a global `navigationRef` (exported from `navigation/`) to redirect to the correct screen based on the custom `data` sent in the payload.

- **`notifications/types.ts`**
  Typing for the expected custom payloads (e.g. `{ type: 'new_message', conversationId: string }`), used both by the handlers and by whoever triggers test notifications.

- **Permission and token**
  Permission state (`hasPermission`) and OneSignal's `externalId`/`subscriptionId` live in `useAuthStore` (Zustand), alongside the rest of the session state — they are not duplicated in WatermelonDB or TanStack Query.

- **Initialization**
  `OneSignal.initialize()` is called once in `App.tsx`, before any navigation mounts, to ensure notifications that cold-start the app already have the SDK ready for the handlers.