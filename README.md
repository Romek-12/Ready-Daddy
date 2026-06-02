# HEJ PAPA — Ready Daddy

Educational mobile app for expectant fathers, partners, and co-parents. Polish-language. Week-by-week pregnancy guide plus postpartum support through the first year.

**Status:** in development · **Version:** 1.0.0 · **Slug:** `ready-daddy` · **Bundle:** `com.readydaddy.mobile`

---

## Features

### Pregnancy tracking
- Week-by-week fetal development (weeks 1–42), with bundled illustrations and real measurements (length/weight from clinical CSV)
- Trimester-aware UI: I/II/III trimesters drive colors and module visibility
- Partner / father / baby tabs per week
- "What's happening now" — week-targeted action cards

### Dad-focused content
- Dad Module: emotions, internal conflicts, warning signs, relationship guidance, professional resources
- Postpartum (4th trimester) and First Year (months 1–12) modules
- Birth-prep module + hospital bag checklist
- "Co czujesz?" emotional check-in

### Planning & tracking
- Cost calculator + shopping checklist (categories: dziecko, mama, tata)
- Checkup calendar (visits + reminders, expo-calendar integration)
- Pregnancy safety guide ("Co jeść / unikać")
- Journal (entries with optional photos, calendar view)
- Name draw (Wybór imienia — random pick from mama/tata pools, save as baby name)
- Reorderable home tiles (`ModuleOrderScreen`)
- Gamification: badges + level progression

### Auth & profile
- Supabase email/password + Google sign-in + Facebook sign-in
- Profile setup flow on first launch

---

## Tech Stack

| Layer | Library / Version |
|---|---|
| Runtime | React Native **0.83.6** + Expo **55** |
| Language | TypeScript **5.x** (strict) |
| Navigation | `@react-navigation/native` 7.x + native-stack + bottom-tabs |
| Server state | `@tanstack/react-query` 5.x |
| Auth & DB | Supabase (`@supabase/supabase-js` 2.x) |
| Forms | `react-hook-form` + Zod resolvers |
| Animation | `react-native-reanimated` 4.x + `react-native-gesture-handler` |
| Drag & drop | `react-native-reorderable-list` 0.18 |
| Effects | `expo-blur` (glass surfaces, behind feature flag) + `expo-linear-gradient` |
| Icons | Material Symbols Rounded (variable font, bundled TTF) |
| Fonts | ClimateCrisis (display), Space Grotesk (UI), JetBrains Mono (numeric) |
| Notifications | `expo-notifications` (local) |
| Storage | `@react-native-async-storage/async-storage` |
| Testing | Jest (`jest-expo`) + `@testing-library/react-native` |

Auth providers: Google (`@react-native-google-signin/google-signin`), Facebook (`react-native-fbsdk-next`).

---

## Project Structure

```
/
├── mobile/                     # React Native/Expo app (nested .git for EAS)
│   ├── App.tsx                 # entry: providers + AppNavigator
│   ├── app.json                # Expo config
│   ├── src/
│   │   ├── components/         # reusable components (+ ui/ for design-system primitives)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── screens/            # one file per route
│   │   ├── navigation/         # AppNavigator (auth ⇄ main stack switch)
│   │   ├── services/           # api.ts + notifications/, gamification/, calendar/, journal/
│   │   ├── hooks/              # useModuleOrder, useNameDrawStorage, useBadges, useGlassFeatureFlag, ...
│   │   ├── data/               # bundled JSON content (weeks, dad-module, checkups, ...)
│   │   ├── theme/              # design tokens (dark + light)
│   │   ├── lib/                # Supabase client + Zod validation schemas
│   │   └── types/              # shared TypeScript types
│   └── assets/                 # fonts, fetus PNGs, app icons
├── scripts/                    # generate-weekly-fetus-svgs.py, SUPABASE_SETUP.sql, ...
└── docs/superpowers/
    ├── specs/                  # design specs (one per feature)
    └── plans/                  # implementation plans (one per feature)
```

The root `package.json` is essentially empty. All work happens in `mobile/`.

---

## Architecture Highlights

- **Static content is bundled.** Educational copy lives in `mobile/src/data/*.json` — no network call needed to read content. App works offline for reading. `services/api.ts` is the canonical data boundary.
- **Server state in Supabase.** Auth, profiles, journal, badges. Accessed via `api.ts`, cached by React Query.
- **Provider tree:** `QueryClientProvider → ThemeProvider → AuthProvider → AppNavigator`. No Redux/Zustand.
- **Theme:** light/dark via `ThemeContext`. All components read `theme.colors.*`, `theme.spacing.*`, etc. — no hardcoded values.
- **Glass UI feature flag** (`useGlassFeatureFlag`): `BlurView`-based surfaces can fall back to fake-glass (rgba + gradient border) per-build or per-user.

---

## Quick Start

```bash
cd mobile
npm install
npm start             # dev server (npx expo start)
npm run android       # Expo Go on Android
npm run ios           # iOS simulator
npm run web           # web preview
npm run typecheck     # tsc --noEmit
npm test              # jest
npm run build:apk     # eas build -p android --profile preview
```

### Environment

Create `mobile/.env.local` from `mobile/.env.example`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### CI

`.github/workflows/ci.yml` runs `npx tsc --noEmit` and `npm test` on push/PR to `main`. APK build workflows live in `mobile/.github/workflows/` and trigger on `master` of the nested repo.

---

## Mobile sub-repo gotchas

- `mobile/.git/` is a separate repository (so EAS can build from it standalone). `git status` from the root will not show changes inside `mobile/` — `cd mobile` before committing mobile work.
- `mobile/.worktrees/` and root `.worktrees/` are both gitignored.
- Jest config excludes `.worktrees/` from test discovery.

---

## License

Educational use — contact for licensing.
