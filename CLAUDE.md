# Ready Daddy (Hej Papa)

Educational mobile app for expectant fathers. Polish language.

## Architecture

- **Mobile app:** React Native 0.81 + Expo 54, TypeScript 5.8
- **Auth & DB:** Supabase (PostgreSQL + Auth)
- **State:** React Context (auth, theme) + TanStack React Query (data)
- **Navigation:** React Navigation 7.x (bottom tabs + native stack)
- **Forms:** React Hook Form + Zod
- **Content:** Bundled as JSON files in `mobile/src/data/` (no backend API calls)

The mobile app lives in `mobile/` with its own git repo (for EAS builds). The root repo contains shared assets and scripts.

## Dev Commands

```bash
cd mobile
npm install              # Install dependencies
npx expo start           # Start Expo dev server
npx tsc --noEmit         # Type check
npm test                 # Run tests
```

## Key Conventions

- **Styling:** `StyleSheet.create` with `createStyles(theme: Theme)` pattern, memoized via `useMemo`
- **Theme:** Light/dark mode via `ThemeContext`. Use `theme.colors.*`, `theme.spacing.*`, `theme.fontSize.*`, `theme.fontWeight.*`
- **Constants:** Magic numbers go in `mobile/src/constants.ts`
- **Error handling:** Always log errors from AsyncStorage (no silent `.catch(() => {})`)
- **Types:** No `as any` — use proper types. `catch (err: unknown)` with `instanceof Error` guard.
- **Data:** Static content in `mobile/src/data/*.json`. User data in Supabase profiles table.

## Project Structure

```
mobile/src/
├── components/     # Reusable UI (ErrorBoundary, Button, Icon, etc.)
├── screens/        # Navigation screens
├── context/        # AuthContext, ThemeContext
├── hooks/          # useAppData, usePersistedChecklist, useSizeMode
├── services/       # api.ts (bundled JSON + Supabase)
├── data/           # Bundled JSON content files
├── lib/            # Supabase client, validation schemas
├── theme/          # Design tokens (colors, spacing, typography)
├── types/          # Navigation types
├── constants.ts    # App-wide constants
└── config/         # Environment config
```
