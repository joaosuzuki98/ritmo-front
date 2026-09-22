# Ritmo App Frontend Code Conventions

## 1. File naming

Base rule: the file name tells the type of what it contains.

| Type | Pattern | Example | Notes |
|---|---|---|---|
| Screen | `PascalCase` + `Screen.tsx` suffix inside its own folder | `screens/Home/HomeScreen.tsx` | Folder = screen name without suffix: `Home/`, `Profile/`, `Login/` |
| Screen view-model | `use` + `PascalCase` + `ViewModel.ts` | `screens/Home/useHomeViewModel.ts` | Only when the screen logic is complex enough to leave the `.tsx` |
| Shared component | `PascalCase/` folder + `PascalCase.tsx` file | `components/Button/Button.tsx` | Comes with `index.ts` (barrel) and optional `Button.styles.ts` |
| Screen-specific component | Inside `screens/X/components/` | `screens/Home/components/HomeHeader.tsx` | Does not go into `components/` |
| Navigator | `PascalCase` + `Navigator.tsx` suffix | `navigation/AppNavigator.tsx`, `AuthNavigator.tsx`, `RootNavigator.tsx` | Route types in `navigation/types.ts` |
| Store (Zustand) | `use` + `PascalCase` + `Store.ts` (camelCase) | `store/useAuthStore.ts`, `store/useAppStore.ts` | One file per domain |
| Query / Mutation | `use` + `PascalCase` + `Query.ts` / `Mutation.ts` | `queries/useUserQuery.ts`, `queries/useLoginMutation.ts` | Always wrapping `services/`, never with inline `fetch` |
| Service / API | `camelCase.ts`, instance in `api.ts` | `services/api.ts`, `services/endpoints/user.ts`, `services/endpoints/auth.ts` | Group endpoints by domain in `endpoints/` |
| Generic hook | `use` + `PascalCase.ts` (camelCase) | `hooks/useDebounce.ts`, `hooks/useKeyboard.ts` | Nothing screen- or domain-specific — that belongs in `screens/` or `queries/` |
| Util | `camelCase.ts`, name = main function | `utils/formatDate.ts`, `utils/currency.ts` | One responsibility per file; pure functions |
| Constant | `camelCase.ts`, name = domain, plural | `constants/colors.ts`, `constants/sizes.ts` | Fixed values, no logic |
| Global type | `camelCase.ts` or `types.ts` | `types/user.ts`, `navigation/types.ts` | Types used in 2+ layers; single-use types stay in their own file |
| Schema (Zod) | `camelCase` + `Schema.ts` suffix | `forms/schemas/loginSchema.ts`, `forms/schemas/profileSchema.ts` | Reusable schemas here; screen-specific ones may live in the screen folder |
| Form hook | `use` + `PascalCase` + `Form.ts` | `screens/Login/useLoginForm.ts` | `useForm` + `zodResolver`, no dedicated folder |
| Model (WatermelonDB) | `PascalCase.ts` (= table name) | `database/models/User.ts`, `database/models/Post.ts` | Schema in `database/schema.ts`, migrations in `database/migrations.ts` |
| Notification | `camelCase.ts`, handlers in `handlers/` with `on` prefix | `notifications/oneSignal.ts`, `notifications/handlers/onNotificationReceived.ts` | Typed payloads in `notifications/types.ts` |
| Barrel | `index.ts` | `components/Button/index.ts` | Only re-exports (`export * from './Button'`) — no logic |
| Asset | `kebab-case` | `assets/images/logo-dark.png`, `assets/fonts/inter-bold.ttf` | Images in `images/`, fonts in `fonts/` |
| Test | Same name + `.test.ts(x)` next to the file | `utils/formatDate.test.ts` | Config: Jest + `@react-native/jest-preset` |

### Casing rules

- **PascalCase:** components, screens, navigators, models (`Button.tsx`, `HomeScreen.tsx`, `User.ts`).
- **camelCase:** everything else that is a variable/function/hook (`useAuthStore.ts`, `api.ts`, `formatDate.ts`, `loginSchema.ts`).
- **kebab-case:** assets only (`logo-dark.png`).
- Never use `snake_case` in `.ts/.tsx` files.
- Add a type suffix whenever there is ambiguity risk: `Screen`, `Navigator`, `Store`, `Query`, `Mutation`, `Schema`, `ViewModel`. E.g.: `HomeScreen.tsx` (not `Home.tsx`), `useAuthStore.ts` (not `auth.ts`).

## 2. Code naming

- **Components:** `PascalCase`, same as the file name. E.g.: `HomeScreen`, `Button`, `HomeHeader`.
- **Hooks:** always `use` + `PascalCase`. E.g.: `useAuthStore`, `useUserQuery`, `useHomeViewModel`, `useDebounce`.
- **Types/interfaces:** `PascalCase`. Component props are called `<Name>Props`. E.g.: `ButtonProps`, `HomeScreenProps`. Navigation param lists: `<Name>ParamList` (e.g.: `RootParamList`).
- **Zod schemas:** `camelCase` + `Schema`. E.g.: `loginSchema`. Infer the type with `z.infer<typeof loginSchema>` → `LoginFormData`.
- **Variables/functions:** `camelCase`, verbs for functions/handlers. E.g.: `formatDate`, `isLoading`, `handleSubmit`, `onNotificationReceived`.
- **Constants:** `camelCase` for config values (`apiUrl`); `UPPER_SNAKE_CASE` only for truly immutable global constants (`MAX_RETRY_COUNT`).
- **Booleans:** `is/has/should` prefix. E.g.: `isDarkMode`, `hasPermission`, `shouldSync`.
- **Event handlers:** `handle` + event inside the component (`handlePress`, `handleSubmit`), `on` + event on the prop (`onPress`, `onNotificationOpened`).

## 3. Arrow functions (required standard)

Use **arrow function with `const`** as the standard form for components, hooks, utils, callbacks, and handlers. Follows the project Prettier config (`arrowParens: avoid` → `x => ...`, not `(x) => ...`).

```tsx
// ✅ Component
type ButtonProps = { title: string; onPress: () => void };

export const Button = ({ title, onPress }: ButtonProps) => {
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
};

// ✅ Hook
export const useDebounce = (value: string, delay: number) => {
  // ...
};

// ✅ Util
export const formatDate = (date: Date): string => {
  // ...
};

// ✅ Inline handler
<Pressable onPress={() => handlePress(item.id)} />
```

Rules:

1. `const X = () => {}` by default. `function X() {}` only in exceptions (e.g.: template `App.tsx`, or when hoisting is required — and it must be justified).
2. Always type props and return values when not obvious. Destructure props in the signature.
3. Early return for loading/error instead of nested ternaries:
   ```tsx
   // ✅
   if (isLoading) return <Loading />;
   if (error) return <ErrorState error={error} />;
   return <Content data={data} />;
   ```
4. Extract handler into a named `const` if it has more than 1 line or is reused; inline only for simple pass-through (`() => onSelect(id)`).

## 4. Components and screens

1. One component per file. A screen-specific component lives in `screens/X/components/`, never in `components/`.
2. Props typed as `<Name>Props`, exported when reused:
   ```tsx
   export type ButtonProps = { title: string; onPress: () => void };
   export const Button = ({ title, onPress }: ButtonProps) => { ... };
   ```
3. Complex screen logic goes into `useXViewModel.ts`; `XScreen.tsx` stays render + composition only.
4. Style with **NativeWind (`className`)** by default. `StyleSheet.create` only when dynamic/computed styles are needed that Tailwind does not cover.
5. `index.ts` barrel per shared component:
   ```ts
   export * from './Button';
   export type { ButtonProps } from './Button';
   ```
6. Never import from `screens/` into `components/` — the dependency is always `screens → components`, never the reverse.

## 5. TypeScript

1. Prefer `type` for props, payloads, and unions; `interface` only for extensible contracts (models, lib props). Do not mix both in the same domain without reason.
2. Never `any`. External data (API, notification payload, storage) gets an explicit type or `unknown` + Zod validation.
3. Export types alongside the module that defines them (`ButtonProps` in `Button.tsx`, payloads in `notifications/types.ts`, routes in `navigation/types.ts`).
4. Do not re-declare the same type in two layers — import from the single source (`types/`, model, or domain `types.ts`).

## 6. State, data, and forms

1. **Server without local persistence → `services/` + `queries/`** (Axios + TanStack Query). Screens consume the `queries/` hook, never `services/` directly.
2. **Offline-first data → `database/`** (WatermelonDB). Never go through TanStack Query. Sync only via `synchronize()` (`database/sync/`), triggered by foreground, reconnect, pull-to-refresh, or interval — no alternative path.
3. **Session/UI → `store/`** (Zustand, `useXStore.ts`). Only session and UI state (authenticated user, theme, flags, notification `hasPermission`). Nothing already owned by the server or the database.
4. **Forms → React Hook Form + Zod.** Schema in `forms/schemas/XSchema.ts` (or in the screen folder when single-use), `useXForm.ts` hook with `zodResolver`. No manual inline validation.
5. **Notifications → `notifications/`.** Handlers outside the React tree: foreground only triggers `synchronize()` or invalidates a query; open navigates via the global `navigationRef`. See `@docs/architecture.md`.

## 7. Imports, exports, and file structure

1. Import order: (1) React/RN, (2) external libs, (3) internal imports with `@/` or relative, (4) types, (5) styles. No circular imports between layers.
2. **Named exports** (`export const Button`) as standard in `components/`, `hooks/`, `utils/`, `queries/`, `store/`. `export default` only where tooling requires it (e.g.: root `App.tsx`).
3. `.tsx` file structure: imports → types/props → component/hook → styles → export. No stray executable logic at module top level (only constants and config).
4. `index.ts` only re-exports. Do not put logic, components, or styles in it.
