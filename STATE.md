# Ready Daddy — Stan aplikacji

> Aktualizacja: 2026-05-11. Centralna notatka stanu projektu dla Obsidian. Linki do speców, planów i kluczowych plików kodu.

## Overview

**Ready Daddy / Hej Papa** — polska aplikacja edukacyjna dla przyszłych ojców. Tydzień-po-tygodniu od poczęcia, przez poród, po pierwszy rok dziecka. RN 0.83.6 + Expo 55, TypeScript strict, Supabase auth, bundled JSON content (offline-friendly).

- Repo struktura: zobacz [[README]]
- Konwencje kodu: zobacz [[CLAUDE]]
- Spec UI Neon Glass: zobacz [[Ready_Daddy_Neon_Glass_UI_Opis]]

## Ekrany (na 2026-05-11)

### Auth
- `LoginScreen` · `RegisterScreen` · `ForgotPasswordScreen` · `ResetPasswordScreen`
- Social login: Google + Facebook ([plan](docs/superpowers/plans/2026-04-18-google-facebook-auth.md))

### Onboarding & Home
- `OnboardingScreen` — wstęp dla nowych
- `ProfileSetupScreen` — wymagane przy pierwszym logowaniu
- `HomeScreen` — siatka modułów (kolejność konfigurowalna w `ModuleOrderScreen`)
- `ModuleOrderScreen` — drag & drop modułów (react-native-reorderable-list)

### Rozwój dziecka
- `WeekDetailScreen` — szczegóły tygodnia (zakładki Dziecko / Mama / Ty)
- `FetusVisualizer` (component) — pulsująca sylwetka + neonowy glow (concentric circles)

### Główne moduły
- `ActionCardsScreen` — "Co robić teraz?"
- `CheckupsScreen` + `AddVisitScreen` — kalendarz wizyt
- `PlanningScreen` — checklisty (Przed porodem, Finanse, ...)
- `BirthPrepScreen` — przygotowanie do porodu (torba, ...)
- `PregnancySafetyScreen` — "Co jeść / unikać"
- `DadModuleScreen` + Dad{Noworodek, Polog, Relacja}Screen
- `FourthTrimesterScreen` — 4. trymestr
- `PostBirthScreen` — co teraz (timeline 5 kroków)
- `first-year/` — Pierwszy Rok (siatka miesięcy + szczegóły)
- `NameDrawScreen` — wybór imienia (losowanie z pul mama/tata)
- `BadgesScreen` — gamifikacja
- `journal/` — dziennik z widokiem listy i kalendarza

### Settings
- `SettingsScreen` · `NotificationSettingsScreen`

## Stan wdrożenia Neon Glass UI

Pełen plan w [[Ready_Daddy_Neon_Glass_UI_Opis]]. Komponenty design-system gotowe w `mobile/src/components/ui/`:

- `AuroraBackground` — gradient + bloby, opcjonalnie BlurView overlay
- `GlassCard` — z fallbackiem do fake-glass przez `useGlassFeatureFlag`
- `GlassInput`, `GlowPill`, `GradientButton`, `GradientText`, `GradientProgressBar`, `Kicker`, `NeonCheckbox`, `ProgressRing`, `RingLoader`, `FetusSilhouette`

Wszystkie ikony przez Material Symbols Rounded (variable font, kodepoints w `components/Icon.tsx`).

## Plany w toku (`docs/superpowers/plans/`)

| Data | Plan | Spec |
|---|---|---|
| 2026-04-13 | [Gamification badges](docs/superpowers/plans/2026-04-13-gamification-badges.md) | [spec](docs/superpowers/specs/2026-04-13-gamification-badges-design.md) |
| 2026-04-17 | [Add-visit calendar](docs/superpowers/plans/2026-04-17-add-visit-calendar.md) | [spec](docs/superpowers/specs/2026-04-17-add-visit-calendar-design.md) |
| 2026-04-17 | [Date/time pickers](docs/superpowers/plans/2026-04-17-date-time-pickers.md) | [spec](docs/superpowers/specs/2026-04-17-date-time-pickers-design.md) |
| 2026-04-17 | — | [Material Symbols icons spec](docs/superpowers/specs/2026-04-17-material-symbols-icons-design.md) |
| 2026-04-18 | [Google + Facebook auth](docs/superpowers/plans/2026-04-18-google-facebook-auth.md) | — |
| 2026-04-19 | [Name draw](docs/superpowers/plans/2026-04-19-name-draw.md) | [spec](docs/superpowers/specs/2026-04-19-name-draw-design.md) |
| 2026-04-23 | [UI handoff implementation](docs/superpowers/plans/2026-04-23-ui-handoff-implementation.md) | — |
| 2026-05-07 | [Checkup calendar flow](docs/superpowers/plans/2026-05-07-checkup-calendar-flow.md) | [spec](docs/superpowers/specs/2026-05-07-checkup-calendar-flow-design.md) |
| 2026-05-07 | [Journal calendar view](docs/superpowers/plans/2026-05-07-journal-calendar-view.md) | [spec](docs/superpowers/specs/2026-05-07-journal-calendar-view-design.md) |
| 2026-05-08 | [RingLoader replaces BlobLoader](docs/superpowers/plans/2026-05-08-ringloader-replace-blobloader.md) | [spec](docs/superpowers/specs/2026-05-08-ringloader-replace-blobloader-design.md) |

## Otwarte problemy / TODO

- **Persistencja kolejności modułów** — drag & drop w `ModuleOrderScreen` zapisuje do AsyncStorage, ale `HomeScreen` nie odświeża się po powrocie. Potrzebny `useFocusEffect` w `useModuleOrder.ts` albo lift state do Context.
- **App icon** — user prosił o ustawienie podanego pliku jako ikony aplikacji; ścieżka pliku jeszcze nie potwierdzona.

## Dane i serwisy

- `services/api.ts` — kanoniczna warstwa danych (bundled JSON + Supabase)
- `services/notifications/` — `NotificationService`, `Scheduler`, `Permissions`
- `services/gamification/` — logika odznak
- `services/calendar/` — integracja z `expo-calendar`
- `services/journal/` — dziennik
- `services/socialAuth.ts` — Google + Facebook

### Bundled content (`src/data/`)
- `weeks.json` — 42 tygodnie ciąży (waga/długość zweryfikowane z CSV klinicznym)
- `dad-module.json` · `action-cards.json` · `checkups.json` · `checkup-visits.json`
- `bag-checklist.json` · `birth-preparation.json` · `fourth-trimester.json`
- `shopping-items.json` · `badges-definitions.ts`
- `fetusImages.ts` · `fetusSvgs.ts` · `notification-templates.ts`
- `first-year-content.ts` · `first-year-vaccines.ts`

## Hooks (`src/hooks/`)

- `useAppData` — globalne dane aplikacji
- `useBadges` — stan odznak
- `useGlassFeatureFlag` + `loadGlassUI` w `App.tsx`
- `useJournal` · `useModuleOrder` · `useNameDrawStorage` · `useNotifications`
- `usePersistedChecklist` — AsyncStorage-backed lista
- `useSizeMode` — responsive helper

## Build & CI

- CI: `.github/workflows/ci.yml` (tsc + jest, push/PR do `main`)
- APK: `mobile/.github/workflows/` (push/PR do `master` w nested repo)
- Lokalnie: `npm run build:apk` w `mobile/`
