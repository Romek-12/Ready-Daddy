# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Ready Daddy (Hej Papa)

Educational mobile app for expectant fathers, in Polish. React Native 0.81 + Expo 54, TypeScript 5.8 (strict).

## Repo Layout

- `mobile/` — the React Native/Expo app. **Has its own nested `.git/`** so EAS can build from it as a standalone repo. Day-to-day code work happens here.
- `scripts/` — one-off utilities: `generate-weekly-fetus-svgs.py`, legacy `export-to-json.js`, `SUPABASE_SETUP.sql` (schema reference, not run automatically).
- `docs/superpowers/plans/` — implementation plans for in-flight features.
- Root `package.json` is essentially empty — don't run npm commands at the root.

## Dev Commands (run from `mobile/`)

```bash
npm install
npm start              # = npx expo start (dev server)
npm run android        # Expo Go on Android
npm run ios            # iOS simulator
npm run web            # web preview
npm run typecheck      # tsc --noEmit
npm test               # jest (preset: jest-expo)
npx jest path/to/file.test.ts        # single test file
npx jest -t "test name pattern"      # by name
npm run build:apk      # eas build -p android --profile preview
npm run build:web      # expo export
```

CI (`.github/workflows/ci.yml`) runs `npx tsc --noEmit` and `npm test` from `mobile/` on push/PR to `main`. Two APK build workflows live under `mobile/.github/workflows/` (they trigger on `master` in the nested repo, not the parent).

Required env vars in `mobile/.env.local` (template at `mobile/.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Architecture

**Data flow.** Static educational content (weeks, checkups, dad-module, shopping, etc.) is bundled as JSON in `mobile/src/data/` — no network calls for content, the app is offline-capable for reading. User data (auth, profiles, journal, badges) is in **Supabase** (PostgreSQL + Auth). Both are accessed through `mobile/src/services/api.ts`, which is the canonical data boundary — components shouldn't import the Supabase client directly except for auth flows.

**Provider tree** (see `mobile/App.tsx`): `QueryClientProvider` → `ThemeProvider` → `AuthProvider` → `AppNavigator`. TanStack React Query owns server-state cache; `AuthContext` and `ThemeContext` own app-wide UI state. There is no Redux/Zustand — when you need shared state, prefer a context or a Query hook.

**Navigation** (`mobile/src/navigation/AppNavigator.tsx`). React Navigation 7.x: bottom tabs + native stack. Auth state in `AuthContext` switches between auth and main stacks. Add new screens to `mobile/src/screens/` and wire them in `AppNavigator.tsx`; keep navigation param types in `mobile/src/types/`.

**Services layer** (`mobile/src/services/`):
- `api.ts` — bundled-JSON readers + Supabase queries
- `notifications/` — local notifications (NotificationService, Scheduler, Permissions)
- `gamification/` — badge logic
- `calendar/`, `journal/` — feature services

**Static content files** in `mobile/src/data/` are the single source of truth for educational copy. Editing copy = editing JSON, not code. Content was originally in SQLite and exported via `scripts/export-to-json.js` (legacy; don't reach for it unless asked).

## Conventions

- **Styling:** `StyleSheet.create` returned from a `createStyles(theme: Theme)` factory, memoized with `useMemo(() => createStyles(theme), [theme])` inside the component. Don't inline `StyleSheet.create` calls in render.
- **Theme:** Light/dark via `ThemeContext`. Always read `theme.colors.*`, `theme.spacing.*`, `theme.fontSize.*`, `theme.fontWeight.*` — no hardcoded colors or pixel values in components.
- **Magic numbers:** Put them in `mobile/src/constants.ts` (e.g., `MAX_PREGNANCY_WEEK`, `CONCEPTION_OFFSET_WEEKS`).
- **Errors:** No silent `.catch(() => {})` — route through `mobile/src/utils/logError.ts`. AsyncStorage failures must be logged.
- **TypeScript:** strict mode is on. No `as any`. In catch blocks: `catch (err: unknown)` then narrow with `instanceof Error`.
- **Forms:** React Hook Form + Zod resolvers. Schemas live in `mobile/src/lib/validation.ts`.
- **Tests:** Jest + `@testing-library/react-native`. Tests in `mobile/src/__tests__/` or co-located `*.test.ts(x)`. The `.worktrees/` directory is excluded from test discovery — don't run tests inside worktrees expecting them to be picked up by the parent config.

## Mobile Sub-Repo Gotchas

- `mobile/.git/` is a separate repository. `git status` from the root will not show changes inside `mobile/`. When committing mobile changes, `cd mobile` first.
- `mobile/.worktrees/` and root `.worktrees/` are both gitignored — used for isolated feature branches.
