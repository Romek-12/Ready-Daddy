# Spec: Gamifikacja i Odznaki (Krok 3)

**Data:** 2026-04-13  
**Status:** Zatwierdzona do implementacji

---

## Cel

Motywowanie ojców do aktywnego korzystania z aplikacji poprzez system odznak przyznawanych za realne działania powiązane z istniejącymi funkcjami (listy, dziennik, tygodnie ciąży, powiadomienia).

---

## Architektura

### Storage

- **Supabase `user_badges`** — źródło prawdy (trwałość między reinstalacjami, synchronizacja między urządzeniami)
- **AsyncStorage** — cache offline (klucz `@ready_daddy/badges_cache`), ten sam wzorzec co AuthContext
- Przy braku połączenia: cache jest wystarczający do wyświetlania; `awardBadge()` próbuje Supabase, przy błędzie loguje przez `logError()` i zachowuje tylko cache

### SQL (do wykonania w Supabase przed implementacją)

```sql
CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own badges" ON user_badges
  FOR ALL USING (auth.uid() = user_id);
```

---

## Struktura plików

```
mobile/src/
  types/
    badges.types.ts
  data/
    badges-definitions.ts
  services/
    gamification/
      BadgeService.ts
      BadgeChecker.ts
  hooks/
    useBadges.ts
  components/
    gamification/
      BadgeCard.tsx
      BadgeUnlockModal.tsx
      BadgesWidget.tsx
  screens/
    BadgesScreen.tsx
```

---

## Typy (`badges.types.ts`)

```typescript
export type BadgeCategory = 'pregnancy' | 'tasks' | 'journal' | 'engagement';

export type BadgeTrigger =
  | 'week_reached'
  | 'checklist_completed'
  | 'journal_entry_added'
  | 'journal_entries_count'
  | 'photo_added'
  | 'notifications_enabled';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;        // emoji
  category: BadgeCategory;
  triggerEvent: BadgeTrigger;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;    // ISO datetime
}
```

---

## Definicje odznak (`badges-definitions.ts`) — 10 odznak

| ID | Tytuł | Trigger | Warunek |
|----|-------|---------|---------|
| `first_trimester` | Pierwszy Trymestr 🌱 | `week_reached` | tydzień ≥ 14 (po końcu T1) |
| `second_trimester` | Drugi Trymestr 👶 | `week_reached` | tydzień ≥ 28 |
| `third_trimester` | Trzeci Trymestr 🌟 | `week_reached` | tydzień ≥ 29 (wg TRIMESTER_BOUNDARIES: second=27, więc T3 = 28+) |
| `packed_bag` | Spakowany Tata 🧳 | `checklist_completed` | checklistId = `'hospital_bag'` |
| `layette_ready` | Gotowa Wyprawka 👶 | `checklist_completed` | checklistId = `'layette'` |
| `post_birth_done` | Mistrz Formalności 📋 | `checklist_completed` | checklistId = `'post_birth'` |
| `first_note` | Kronikarz 📓 | `journal_entry_added` | pierwsza notatka (totalEntries === 1) |
| `first_usg` | Pierwsze USG 🔬 | `photo_added` | pierwsze zdjęcie w dzienniku |
| `active_dad` | Aktywny Tata ⭐ | `journal_entries_count` | totalEntries ≥ 10 |
| `notifications_on` | Czujny Tata 🔔 | `notifications_enabled` | włączenie powiadomień |

**Uwaga dot. tygodni trymestrów:** `TRIMESTER_BOUNDARIES` w `constants.ts` definiuje `second: 27`. Odznaka "Trzeci Trymestr" przyznawana przy tygodniu 28+ (nie 29 jak w planie Notion — 28 to pierwszy tydzień T3 wg logiki aplikacji).

---

## BadgeService (`services/gamification/BadgeService.ts`)

Funkcje publiczne:
- `getEarnedBadges(userId: string): Promise<EarnedBadge[]>` — cache-first, Supabase w tle
- `awardBadge(userId: string, badgeId: string): Promise<boolean>` — zapisuje do Supabase + cache; zwraca `true` jeśli nowo zdobyta
- `isBadgeEarned(userId: string, badgeId: string): Promise<boolean>`
- `syncFromSupabase(userId: string): Promise<EarnedBadge[]>` — wymuszony refresh

Wzorzec cache: identyczny z AuthContext — AsyncStorage odpowiada natychmiast, Supabase aktualizuje w tle.

---

## BadgeChecker (`services/gamification/BadgeChecker.ts`)

Funkcje wywoływane z odpowiednich miejsc w UI:

```typescript
checkWeekBadges(userId: string, currentWeek: number): Promise<string[]>
checkChecklistBadge(userId: string, checklistId: string): Promise<string | null>
checkJournalBadges(userId: string, totalEntries: number, hasPhoto: boolean): Promise<string[]>
checkNotificationsBadge(userId: string): Promise<string | null>
```

Każda zwraca ID nowo zdobytych odznak (lub null/[]) — do przekazania do `BadgeContext` (kolejka modalu).

---

## useBadges hook (`hooks/useBadges.ts`)

```typescript
interface UseBadgesReturn {
  earned: EarnedBadge[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  totalCount: number;
  earnedCount: number;
}
```

Pobiera odznaki przy mount, udostępnia refresh.

---

## BadgeContext (globalny)

Nowy Context (`context/BadgeContext.tsx`) zarządzający kolejką modalu unlock:

```typescript
interface BadgeContextType {
  queueBadgeUnlock: (badgeId: string) => void;
  // wewnętrznie: queue: string[], przetwarza jeden po drugim
}
```

Dodany do drzewa providerów w `App.tsx` (lub `AppNavigator.tsx`). `BadgeUnlockModal` renderowany wewnątrz `BadgeContext.Provider`.

---

## Komponenty

### BadgeCard (`components/gamification/BadgeCard.tsx`)
- Props: `definition: BadgeDefinition`, `earned: EarnedBadge | undefined`
- Zdobyta: pełna ikona emoji (duża), tytuł, data zdobycia
- Niezdobyta: wyszarzona, opis "co zrobić"
- `createStyles(theme)` + `useMemo`

### BadgeUnlockModal (`components/gamification/BadgeUnlockModal.tsx`)
- Widoczny gdy `visible: boolean`
- Animacja: `react-native-reanimated` — `withSpring` (scale 0→1) + `withTiming` (opacity 0→1)
- Zawartość: duże emoji, "Nowa odznaka! [tytuł]", opis, przycisk "Super!"
- Po kliknięciu: `onDismiss()` → BadgeContext przetwarza kolejną odznakę

### BadgesWidget (`components/gamification/BadgesWidget.tsx`)
- Pokazuje: ostatnio zdobyta odznaka (emoji + tytuł) + licznik X/Y
- Przycisk "Zobacz wszystkie" → `navigation.navigate('Badges')`
- Jeśli brak odznak: motywujący komunikat "Zdobądź pierwszą odznakę!"
- Miejsce: HomeScreen, poniżej karty tygodnia, powyżej siatki modułów

### BadgesScreen (`screens/BadgesScreen.tsx`)
- Header: "Twoje Odznaki" + licznik (np. 4/10)
- Progress bar: `earned / total`
- Podział na kategorie: Ciąża | Zadania | Dziennik | Zaangażowanie
- Grid 3 kolumny z `BadgeCard`
- `createStyles(theme)` + `useMemo`

---

## Nawigacja

Zmiany w `types/navigation.ts`:
```typescript
// HomeStackParamList — dodać:
Badges: undefined;
```

Zmiany w `AppNavigator.tsx`:
```tsx
<HomeStack.Screen name="Badges" component={BadgesScreen} />
```

---

## Punkty integracji z istniejącym kodem

| Plik | Zmiana |
|------|--------|
| `screens/journal/AddEntryScreen.tsx` | Po `add()` → `checkJournalBadges(user.id, entries.length + 1, photos.length > 0)` |
| `screens/NotificationSettingsScreen.tsx` | Po `enable()` success → `checkNotificationsBadge(user.id)` |
| `screens/HomeScreen.tsx` | `useEffect` na `data?.currentWeek` → `checkWeekBadges(user.id, currentWeek)` |
| `screens/BirthPrepScreen.tsx` | Po ukończeniu listy szpitalnej → `checkChecklistBadge(user.id, 'hospital_bag')` |
| `screens/PostBirthScreen.tsx` | Po ukończeniu formalności → `checkChecklistBadge(user.id, 'post_birth')` |
| `screens/PlanningScreen.tsx` | Po ukończeniu wyprawki → `checkChecklistBadge(user.id, 'layette')` |
| `screens/HomeScreen.tsx` | Dodać `<BadgesWidget>` między kartą tygodnia a siatką modułów |
| `context/` | Nowy `BadgeContext.tsx` |
| `navigation/AppNavigator.tsx` | Dodać `BadgeContext.Provider`, screen `Badges` w HomeStack |

---

## Konwencje

- Zero `as any`
- `createStyles(theme: Theme)` z `useMemo` w każdym komponencie
- `catch (err: unknown)` z `instanceof Error` guard
- Puste catch zastąpione `logError(context, err)` z `src/utils/logError.ts`
- Magic numbers → stałe w `constants.ts` (np. `BADGE_ACTIVE_DAD_ENTRIES = 10`)
- Supabase primary, AsyncStorage cache offline

---

## Kolejność implementacji

1. SQL w Supabase (tabela `user_badges`)
2. `badges.types.ts`
3. `badges-definitions.ts`
4. `BadgeService.ts`
5. `BadgeChecker.ts`
6. `useBadges.ts`
7. `BadgeContext.tsx`
8. `BadgeCard.tsx`
9. `BadgeUnlockModal.tsx`
10. `BadgesScreen.tsx`
11. `BadgesWidget.tsx`
12. Nawigacja (typy + AppNavigator)
13. Integracje: AddEntryScreen, NotificationSettingsScreen, HomeScreen (week check + widget)
14. Integracje: BirthPrepScreen, PostBirthScreen, PlanningScreen (checklist badges)
