# Gamifikacja i Odznaki — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać system 10 odznak przyznawanych za realne działania (tygodnie ciąży, ukończone listy, dziennik, powiadomienia), z galeria odznak, animowanym popupem unlock i mini-widgetem na HomeScreen.

**Architecture:** Supabase `user_badges` jako primary storage (trwałość między reinstalacjami), AsyncStorage jako cache offline — identyczny wzorzec co AuthContext. Globalny `BadgeContext` zarządza kolejką modalu unlock. `BadgeChecker` wywoływany z istniejących ekranów po akcjach użytkownika.

**Tech Stack:** React Native, Supabase, AsyncStorage, react-native-reanimated (już w Expo), React Navigation (HomeStack)

---

## Mapa plików

### Nowe pliki
- `mobile/src/types/badges.types.ts` — typy BadgeDefinition, EarnedBadge, BadgeTrigger
- `mobile/src/data/badges-definitions.ts` — 10 definicji odznak
- `mobile/src/services/gamification/BadgeService.ts` — Supabase + AsyncStorage cache
- `mobile/src/services/gamification/BadgeChecker.ts` — logika warunków
- `mobile/src/hooks/useBadges.ts` — hook do komponentów
- `mobile/src/context/BadgeContext.tsx` — globalny Context, kolejka modalu
- `mobile/src/components/gamification/BadgeCard.tsx` — karta odznaki
- `mobile/src/components/gamification/BadgeUnlockModal.tsx` — animowany popup
- `mobile/src/components/gamification/BadgesWidget.tsx` — mini-widget na HomeScreen
- `mobile/src/screens/BadgesScreen.tsx` — galeria odznak

### Modyfikowane pliki
- `mobile/src/types/navigation.ts` — dodać `Badges: undefined` do HomeStackParamList
- `mobile/src/navigation/AppNavigator.tsx` — dodać BadgeContext.Provider + screen Badges
- `mobile/src/screens/HomeScreen.tsx` — dodać BadgesWidget + checkWeekBadges
- `mobile/src/screens/journal/AddEntryScreen.tsx` — checkJournalBadges po zapisie
- `mobile/src/screens/NotificationSettingsScreen.tsx` — checkNotificationsBadge po enable
- `mobile/src/screens/BirthPrepScreen.tsx` — checkChecklistBadge gdy totalChecked === totalItems
- `mobile/src/screens/PostBirthScreen.tsx` — checkChecklistBadge gdy totalChecked === totalItems
- `mobile/src/components/ShoppingList.tsx` — checkChecklistBadge gdy totalChecked === totalItems
- `mobile/src/constants.ts` — dodać BADGE_ACTIVE_DAD_ENTRIES, BADGE_T1_WEEK, BADGE_T2_WEEK, BADGE_T3_WEEK

---

## Task 1: SQL w Supabase + typy TypeScript

**Files:**
- Create: `mobile/src/types/badges.types.ts`
- Modify: `mobile/src/constants.ts`

- [ ] **Step 1: Wykonaj SQL w Supabase Dashboard**

Przejdź do Supabase Dashboard → SQL Editor i uruchom:

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

- [ ] **Step 2: Dodaj stałe do `mobile/src/constants.ts`**

```typescript
/** Badge thresholds */
export const BADGE_T1_WEEK = 14;   // tydzień po końcu T1 (T1 = 1-13)
export const BADGE_T2_WEEK = 28;   // początek T2→T3 (T2 kończy się w 27)
export const BADGE_T3_WEEK = 29;   // głębiej w T3
export const BADGE_ACTIVE_DAD_ENTRIES = 10;  // wpisy dziennika dla odznaki
```

- [ ] **Step 3: Stwórz `mobile/src/types/badges.types.ts`**

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
  icon: string;
  category: BadgeCategory;
  triggerEvent: BadgeTrigger;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO datetime
}
```

- [ ] **Step 4: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 5: Commit**

```bash
cd mobile && git add src/types/badges.types.ts src/constants.ts
git commit -m "feat: add badge types and constants"
```

---

## Task 2: Definicje odznak

**Files:**
- Create: `mobile/src/data/badges-definitions.ts`

- [ ] **Step 1: Stwórz `mobile/src/data/badges-definitions.ts`**

```typescript
import type { BadgeDefinition } from '../types/badges.types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // — Ciąża —
  {
    id: 'first_trimester',
    title: 'Pierwszy Trymestr',
    description: 'Dotrwaliście do końca 13. tygodnia',
    icon: '🌱',
    category: 'pregnancy',
    triggerEvent: 'week_reached',
  },
  {
    id: 'second_trimester',
    title: 'Drugi Trymestr',
    description: 'Weszliście w 28. tydzień ciąży',
    icon: '👶',
    category: 'pregnancy',
    triggerEvent: 'week_reached',
  },
  {
    id: 'third_trimester',
    title: 'Trzeci Trymestr',
    description: 'Ostatnia prosta — 29. tydzień!',
    icon: '🌟',
    category: 'pregnancy',
    triggerEvent: 'week_reached',
  },
  // — Zadania —
  {
    id: 'packed_bag',
    title: 'Spakowany Tata',
    description: 'Ukończona lista na porodówkę',
    icon: '🧳',
    category: 'tasks',
    triggerEvent: 'checklist_completed',
  },
  {
    id: 'layette_ready',
    title: 'Gotowa Wyprawka',
    description: 'Ukończona lista zakupów wyprawki',
    icon: '🛒',
    category: 'tasks',
    triggerEvent: 'checklist_completed',
  },
  {
    id: 'post_birth_done',
    title: 'Mistrz Formalności',
    description: 'Załatwione wszystkie formalności po porodzie',
    icon: '📋',
    category: 'tasks',
    triggerEvent: 'checklist_completed',
  },
  // — Dziennik —
  {
    id: 'first_note',
    title: 'Kronikarz',
    description: 'Pierwsza notatka w dzienniku',
    icon: '📓',
    category: 'journal',
    triggerEvent: 'journal_entry_added',
  },
  {
    id: 'first_usg',
    title: 'Pierwsze USG',
    description: 'Dodano pierwsze zdjęcie z badania',
    icon: '🔬',
    category: 'journal',
    triggerEvent: 'photo_added',
  },
  {
    id: 'active_dad',
    title: 'Aktywny Tata',
    description: '10 wpisów w dzienniku',
    icon: '⭐',
    category: 'journal',
    triggerEvent: 'journal_entries_count',
  },
  // — Zaangażowanie —
  {
    id: 'notifications_on',
    title: 'Czujny Tata',
    description: 'Włączono powiadomienia tygodniowe',
    icon: '🔔',
    category: 'engagement',
    triggerEvent: 'notifications_enabled',
  },
];
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/data/badges-definitions.ts
git commit -m "feat: add badge definitions (10 badges)"
```

---

## Task 3: BadgeService — Supabase + cache

**Files:**
- Create: `mobile/src/services/gamification/BadgeService.ts`

- [ ] **Step 1: Stwórz katalog**

```bash
mkdir -p mobile/src/services/gamification
```

- [ ] **Step 2: Stwórz `mobile/src/services/gamification/BadgeService.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { logError } from '../../utils/logError';
import type { EarnedBadge } from '../../types/badges.types';
import { BADGE_DEFINITIONS } from '../../data/badges-definitions';

const BADGES_CACHE_KEY = '@ready_daddy/badges_cache';

export async function getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  // Cache-first: zwróć natychmiast z AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(BADGES_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw) as EarnedBadge[];
    }
  } catch (err: unknown) {
    logError('BadgeService:getEarnedBadges:cache', err);
  }

  // Fallback: Supabase
  return syncFromSupabase(userId);
}

export async function syncFromSupabase(userId: string): Promise<EarnedBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId);

  if (error) {
    logError('BadgeService:syncFromSupabase', error);
    return [];
  }

  const earned: EarnedBadge[] = (data ?? []).map(row => ({
    badgeId: row.badge_id as string,
    earnedAt: row.earned_at as string,
  }));

  try {
    await AsyncStorage.setItem(BADGES_CACHE_KEY, JSON.stringify(earned));
  } catch (err: unknown) {
    logError('BadgeService:syncFromSupabase:cache', err);
  }

  return earned;
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  // Sprawdź cache lokalnie — szybka ścieżka
  let earned: EarnedBadge[] = [];
  try {
    const raw = await AsyncStorage.getItem(BADGES_CACHE_KEY);
    if (raw) {
      earned = JSON.parse(raw) as EarnedBadge[];
    }
  } catch (err: unknown) {
    logError('BadgeService:awardBadge:cacheRead', err);
  }

  if (earned.some(b => b.badgeId === badgeId)) {
    return false; // już zdobyta
  }

  // Zapisz do Supabase
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId });

  if (error) {
    // Ignoruj conflict (unique constraint) — oznacza że już istnieje
    if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
      logError('BadgeService:awardBadge:supabase', error);
    }
    return false;
  }

  // Aktualizuj cache
  const newBadge: EarnedBadge = {
    badgeId,
    earnedAt: new Date().toISOString(),
  };
  earned.push(newBadge);

  try {
    await AsyncStorage.setItem(BADGES_CACHE_KEY, JSON.stringify(earned));
  } catch (err: unknown) {
    logError('BadgeService:awardBadge:cacheWrite', err);
  }

  return true; // nowo zdobyta
}

export async function isBadgeEarned(userId: string, badgeId: string): Promise<boolean> {
  const earned = await getEarnedBadges(userId);
  return earned.some(b => b.badgeId === badgeId);
}

export function getBadgeDefinition(badgeId: string) {
  return BADGE_DEFINITIONS.find(b => b.id === badgeId) ?? null;
}

export async function clearBadgeCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BADGES_CACHE_KEY);
  } catch (err: unknown) {
    logError('BadgeService:clearBadgeCache', err);
  }
}
```

- [ ] **Step 3: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/services/gamification/BadgeService.ts
git commit -m "feat: add BadgeService with Supabase + AsyncStorage cache"
```

---

## Task 4: BadgeChecker — logika warunków

**Files:**
- Create: `mobile/src/services/gamification/BadgeChecker.ts`

- [ ] **Step 1: Stwórz `mobile/src/services/gamification/BadgeChecker.ts`**

```typescript
import { awardBadge } from './BadgeService';
import {
  BADGE_T1_WEEK,
  BADGE_T2_WEEK,
  BADGE_T3_WEEK,
  BADGE_ACTIVE_DAD_ENTRIES,
} from '../../constants';

export async function checkWeekBadges(
  userId: string,
  currentWeek: number,
): Promise<string[]> {
  const newBadges: string[] = [];

  const weekMap: Record<number, string> = {
    [BADGE_T1_WEEK]: 'first_trimester',
    [BADGE_T2_WEEK]: 'second_trimester',
    [BADGE_T3_WEEK]: 'third_trimester',
  };

  const badgeId = weekMap[currentWeek];
  if (badgeId) {
    const isNew = await awardBadge(userId, badgeId);
    if (isNew) newBadges.push(badgeId);
  }

  return newBadges;
}

export async function checkChecklistBadge(
  userId: string,
  checklistId: 'hospital_bag' | 'layette' | 'post_birth',
): Promise<string | null> {
  const checklistMap: Record<string, string> = {
    hospital_bag: 'packed_bag',
    layette: 'layette_ready',
    post_birth: 'post_birth_done',
  };

  const badgeId = checklistMap[checklistId];
  if (!badgeId) return null;

  const isNew = await awardBadge(userId, badgeId);
  return isNew ? badgeId : null;
}

export async function checkJournalBadges(
  userId: string,
  totalEntries: number,
  hasPhoto: boolean,
): Promise<string[]> {
  const newBadges: string[] = [];

  if (totalEntries === 1) {
    const isNew = await awardBadge(userId, 'first_note');
    if (isNew) newBadges.push('first_note');
  }

  if (totalEntries >= BADGE_ACTIVE_DAD_ENTRIES) {
    const isNew = await awardBadge(userId, 'active_dad');
    if (isNew) newBadges.push('active_dad');
  }

  if (hasPhoto) {
    const isNew = await awardBadge(userId, 'first_usg');
    if (isNew) newBadges.push('first_usg');
  }

  return newBadges;
}

export async function checkNotificationsBadge(userId: string): Promise<string | null> {
  const isNew = await awardBadge(userId, 'notifications_on');
  return isNew ? 'notifications_on' : null;
}
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/services/gamification/BadgeChecker.ts
git commit -m "feat: add BadgeChecker with week/checklist/journal/notification checks"
```

---

## Task 5: useBadges hook

**Files:**
- Create: `mobile/src/hooks/useBadges.ts`

- [ ] **Step 1: Stwórz `mobile/src/hooks/useBadges.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEarnedBadges, syncFromSupabase } from '../services/gamification/BadgeService';
import { BADGE_DEFINITIONS } from '../data/badges-definitions';
import type { EarnedBadge } from '../types/badges.types';

interface UseBadgesReturn {
  earned: EarnedBadge[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  totalCount: number;
  earnedCount: number;
}

export function useBadges(): UseBadgesReturn {
  const { user } = useAuth();
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const badges = await getEarnedBadges(user.id);
    setEarned(badges);
    setIsLoading(false);

    // Odśwież w tle z Supabase
    syncFromSupabase(user.id).then(setEarned).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const badges = await syncFromSupabase(user.id);
    setEarned(badges);
  }, [user]);

  return {
    earned,
    isLoading,
    refresh,
    totalCount: BADGE_DEFINITIONS.length,
    earnedCount: earned.length,
  };
}
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/hooks/useBadges.ts
git commit -m "feat: add useBadges hook"
```

---

## Task 6: BadgeContext — globalny provider kolejki modalu

**Files:**
- Create: `mobile/src/context/BadgeContext.tsx`

- [ ] **Step 1: Stwórz `mobile/src/context/BadgeContext.tsx`**

```typescript
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

interface BadgeContextType {
  queueBadgeUnlock: (badgeId: string) => void;
  currentUnlock: string | null;
  dismissCurrent: () => void;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [currentUnlock, setCurrentUnlock] = useState<string | null>(null);
  const processingRef = useRef(false);

  const processQueue = useCallback((q: string[]) => {
    if (processingRef.current || q.length === 0) return;
    processingRef.current = true;
    setCurrentUnlock(q[0]);
  }, []);

  const queueBadgeUnlock = useCallback(
    (badgeId: string) => {
      setQueue(prev => {
        const next = [...prev, badgeId];
        processQueue(next);
        return next;
      });
    },
    [processQueue],
  );

  const dismissCurrent = useCallback(() => {
    setCurrentUnlock(null);
    processingRef.current = false;
    setQueue(prev => {
      const remaining = prev.slice(1);
      if (remaining.length > 0) {
        // Następna odznaka po krótkim opóźnieniu
        setTimeout(() => {
          processingRef.current = true;
          setCurrentUnlock(remaining[0]);
        }, 300);
      }
      return remaining;
    });
  }, []);

  return (
    <BadgeContext.Provider value={{ queueBadgeUnlock, currentUnlock, dismissCurrent }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadgeContext(): BadgeContextType {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error('useBadgeContext must be used within BadgeProvider');
  return ctx;
}
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/context/BadgeContext.tsx
git commit -m "feat: add BadgeContext with unlock queue"
```

---

## Task 7: BadgeCard komponent

**Files:**
- Create: `mobile/src/components/gamification/BadgeCard.tsx`

- [ ] **Step 1: Stwórz katalog**

```bash
mkdir -p mobile/src/components/gamification
```

- [ ] **Step 2: Stwórz `mobile/src/components/gamification/BadgeCard.tsx`**

```typescript
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../theme';
import type { BadgeDefinition, EarnedBadge } from '../../types/badges.types';

interface Props {
  definition: BadgeDefinition;
  earned: EarnedBadge | undefined;
}

export default function BadgeCard({ definition, earned }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const isEarned = Boolean(earned);

  const earnedDate = earned
    ? new Date(earned.earnedAt).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <View style={[s.card, !isEarned && s.cardLocked]}>
      <Text style={[s.icon, !isEarned && s.iconLocked]}>{definition.icon}</Text>
      <Text style={[s.title, !isEarned && s.titleLocked]} numberOfLines={2}>
        {definition.title}
      </Text>
      {isEarned ? (
        <Text style={s.date}>{earnedDate}</Text>
      ) : (
        <Text style={s.hint} numberOfLines={2}>
          {definition.description}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      width: '30%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
      minHeight: 110,
    },
    cardLocked: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.cardBorder,
      opacity: 0.6,
    },
    icon: {
      fontSize: 32,
      marginBottom: theme.spacing.xs,
    },
    iconLocked: {
      opacity: 0.4,
    },
    title: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 2,
    },
    titleLocked: {
      color: theme.colors.textMuted,
    },
    date: {
      fontSize: 10,
      color: theme.colors.primary,
      textAlign: 'center',
    },
    hint: {
      fontSize: 10,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 13,
    },
  });
```

- [ ] **Step 3: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/components/gamification/BadgeCard.tsx
git commit -m "feat: add BadgeCard component"
```

---

## Task 8: BadgeUnlockModal — animowany popup

**Files:**
- Create: `mobile/src/components/gamification/BadgeUnlockModal.tsx`

- [ ] **Step 1: Stwórz `mobile/src/components/gamification/BadgeUnlockModal.tsx`**

```typescript
import React, { useEffect, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useBadgeContext } from '../../context/BadgeContext';
import { getBadgeDefinition } from '../../services/gamification/BadgeService';
import type { Theme } from '../../theme';

export default function BadgeUnlockModal() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { currentUnlock, dismissCurrent } = useBadgeContext();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const visible = Boolean(currentUnlock);
  const definition = currentUnlock ? getBadgeDefinition(currentUnlock) : null;

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!definition) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Animated.View style={[s.card, animatedCardStyle]}>
          <Text style={s.emoji}>{definition.icon}</Text>
          <Text style={s.headline}>Nowa odznaka!</Text>
          <Text style={s.title}>{definition.title}</Text>
          <Text style={s.description}>{definition.description}</Text>
          <TouchableOpacity style={s.btn} onPress={dismissCurrent} activeOpacity={0.8}>
            <Text style={s.btnText}>Super! 🎉</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xxl,
      padding: theme.spacing.xl,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    emoji: {
      fontSize: 64,
      marginBottom: theme.spacing.md,
    },
    headline: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
    },
    title: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    btn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
    },
    btnText: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.white,
    },
  });
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/components/gamification/BadgeUnlockModal.tsx
git commit -m "feat: add BadgeUnlockModal with reanimated spring animation"
```

---

## Task 9: BadgesScreen — galeria odznak

**Files:**
- Create: `mobile/src/screens/BadgesScreen.tsx`

- [ ] **Step 1: Stwórz `mobile/src/screens/BadgesScreen.tsx`**

```typescript
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useBadges } from '../hooks/useBadges';
import BadgeCard from '../components/gamification/BadgeCard';
import Icon from '../components/Icon';
import { BADGE_DEFINITIONS } from '../data/badges-definitions';
import type { Theme } from '../theme';
import type { BadgeCategory } from '../types/badges.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'Badges'>;

const CATEGORIES: { key: BadgeCategory; label: string }[] = [
  { key: 'pregnancy', label: 'Ciąża' },
  { key: 'tasks', label: 'Zadania' },
  { key: 'journal', label: 'Dziennik' },
  { key: 'engagement', label: 'Zaangażowanie' },
];

export default function BadgesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const { earned, isLoading, totalCount, earnedCount } = useBadges();

  const progress = totalCount > 0 ? earnedCount / totalCount : 0;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Twoje Odznaki</Text>
        <Text style={s.counter}>{earnedCount}/{totalCount}</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressContainer}>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={s.progressLabel}>{Math.round(progress * 100)}% odblokowanych</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {CATEGORIES.map(cat => {
            const defs = BADGE_DEFINITIONS.filter(b => b.category === cat.key);
            return (
              <View key={cat.key} style={s.section}>
                <Text style={s.sectionTitle}>{cat.label}</Text>
                <View style={s.grid}>
                  {defs.map(def => {
                    const earnedBadge = earned.find(e => e.badgeId === def.id);
                    return (
                      <BadgeCard key={def.id} definition={def} earned={earnedBadge} />
                    );
                  })}
                </View>
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, topInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: topInset + 16,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
    },
    backBtn: { padding: theme.spacing.sm, width: 40 },
    counter: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
      width: 40,
      textAlign: 'right',
    },
    progressContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    progressBg: {
      height: 6,
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
    },
    progressLabel: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
    },
    scroll: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    section: { marginBottom: theme.spacing.xl },
    sectionTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/screens/BadgesScreen.tsx
git commit -m "feat: add BadgesScreen gallery with category sections"
```

---

## Task 10: BadgesWidget — mini-widget na HomeScreen

**Files:**
- Create: `mobile/src/components/gamification/BadgesWidget.tsx`

- [ ] **Step 1: Stwórz `mobile/src/components/gamification/BadgesWidget.tsx`**

```typescript
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useBadges } from '../../hooks/useBadges';
import { getBadgeDefinition } from '../../services/gamification/BadgeService';
import type { Theme } from '../../theme';

interface Props {
  onPressAll: () => void;
}

export default function BadgesWidget({ onPressAll }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { earned, totalCount, earnedCount, isLoading } = useBadges();

  if (isLoading) return null;

  const lastEarned = earned.length > 0 ? earned[earned.length - 1] : null;
  const lastDef = lastEarned ? getBadgeDefinition(lastEarned.badgeId) : null;

  return (
    <TouchableOpacity style={s.card} onPress={onPressAll} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Zobacz odznaki">
      <View style={s.left}>
        <Text style={s.emoji}>{lastDef ? lastDef.icon : '🏆'}</Text>
        <View style={s.textCol}>
          <Text style={s.title}>
            {lastDef ? lastDef.title : 'Zdobądź pierwszą odznakę!'}
          </Text>
          <Text style={s.sub}>
            {earnedCount > 0
              ? `${earnedCount} z ${totalCount} odznaki`
              : 'Brak odznak — zacznij działać!'}
          </Text>
        </View>
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      elevation: 1,
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    emoji: { fontSize: 28 },
    textCol: { flex: 1 },
    title: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
    },
    sub: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    arrow: {
      fontSize: 22,
      color: theme.colors.textMuted,
      marginLeft: theme.spacing.sm,
    },
  });
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 3: Commit**

```bash
cd mobile && git add src/components/gamification/BadgesWidget.tsx
git commit -m "feat: add BadgesWidget for HomeScreen"
```

---

## Task 11: Nawigacja — typy + AppNavigator + BadgeProvider

**Files:**
- Modify: `mobile/src/types/navigation.ts`
- Modify: `mobile/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Dodaj `Badges` do `HomeStackParamList` w `mobile/src/types/navigation.ts`**

W sekcji `HomeStackParamList` dodaj po ostatniej trasie:

```typescript
Badges: undefined;
```

Pełna lista po zmianie:
```typescript
export type HomeStackParamList = {
  HomeMain: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  WeekDetail: { week?: number };
  BirthPrep: undefined;
  DadModule: undefined;
  FourthTrimester: undefined;
  PostBirth: undefined;
  Checkups: undefined;
  Planning: undefined;
  DadPolog: undefined;
  DadRelacja: undefined;
  DadNoworodek: undefined;
  Badges: undefined;
};
```

- [ ] **Step 2: Zaktualizuj `mobile/src/navigation/AppNavigator.tsx`**

Dodaj importy na początku pliku (po istniejących importach):
```typescript
import BadgesScreen from '../screens/BadgesScreen';
import { BadgeProvider } from '../context/BadgeContext';
import BadgeUnlockModal from '../components/gamification/BadgeUnlockModal';
```

W `HomeStackNavigator`, po ostatnim `<HomeStack.Screen>`, dodaj:
```tsx
<HomeStack.Screen name="Badges" component={BadgesScreen} />
```

W `AppNavigator`, owiń `<SafeAreaProvider>` w `<BadgeProvider>` i dodaj `<BadgeUnlockModal />` wewnątrz:

```tsx
export default function AppNavigator() {
  const { user, loading, isFirstLogin, clearFirstLogin } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <BadgeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
              {user ? (
                isFirstLogin ? (
                  <Stack.Screen name="Onboarding">
                    {() => <OnboardingScreen onDone={clearFirstLogin} />}
                  </Stack.Screen>
                ) : (
                  <Stack.Screen name="Main" component={MainTabs} />
                )
              ) : (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                  <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
          <BadgeUnlockModal />
        </SafeAreaProvider>
      </BadgeProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/types/navigation.ts src/navigation/AppNavigator.tsx
git commit -m "feat: add Badges screen to navigation and BadgeProvider"
```

---

## Task 12: Integracja — HomeScreen (widget + checkWeekBadges)

**Files:**
- Modify: `mobile/src/screens/HomeScreen.tsx`

- [ ] **Step 1: Dodaj importy do `mobile/src/screens/HomeScreen.tsx`**

Po istniejących importach dodaj:
```typescript
import BadgesWidget from '../components/gamification/BadgesWidget';
import { checkWeekBadges } from '../services/gamification/BadgeChecker';
import { useBadgeContext } from '../context/BadgeContext';
```

- [ ] **Step 2: Dodaj `useBadgeContext` i `useEffect` do komponentu `HomeScreen`**

Po linii `const [sizeMode] = useSizeMode();` dodaj:

```typescript
const { queueBadgeUnlock } = useBadgeContext();
const checkedWeekRef = React.useRef<number | null>(null);

React.useEffect(() => {
  if (!user || !data?.currentWeek) return;
  const week = data.currentWeek;
  if (checkedWeekRef.current === week) return; // już sprawdzony
  checkedWeekRef.current = week;

  checkWeekBadges(user.id, week).then(newBadges => {
    newBadges.forEach(id => queueBadgeUnlock(id));
  });
}, [user, data?.currentWeek, queueBadgeUnlock]);
```

- [ ] **Step 3: Dodaj `BadgesWidget` do JSX HomeScreen**

W JSX, bezpośrednio przed `<View style={s.section}>` zawierającym `MODULES.map(...)`, dodaj:

```tsx
<BadgesWidget onPressAll={() => navigation.navigate('Badges')} />
```

- [ ] **Step 4: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 5: Commit**

```bash
cd mobile && git add src/screens/HomeScreen.tsx
git commit -m "feat: add BadgesWidget and week badge check to HomeScreen"
```

---

## Task 13: Integracja — AddEntryScreen (journal badges)

**Files:**
- Modify: `mobile/src/screens/journal/AddEntryScreen.tsx`

- [ ] **Step 1: Dodaj importy do `mobile/src/screens/journal/AddEntryScreen.tsx`**

Po istniejących importach dodaj:
```typescript
import { useAuth } from '../../context/AuthContext';
import { useBadgeContext } from '../../context/BadgeContext';
import { checkJournalBadges } from '../../services/gamification/BadgeChecker';
```

- [ ] **Step 2: Dodaj hooki do komponentu `AddEntryScreen`**

Po linii `const { entries, add, update } = useJournal();` dodaj:
```typescript
const { user } = useAuth();
const { queueBadgeUnlock } = useBadgeContext();
```

- [ ] **Step 3: Wywołaj `checkJournalBadges` po zapisie w `handleSave`**

W `handleSave`, bezpośrednio po `await add(payload);` (przed `navigation.goBack()`), dodaj:
```typescript
if (!isEdit && user) {
  const totalAfter = entries.length + 1;
  const hasPhoto = (payload.photos?.length ?? 0) > 0;
  const newBadges = await checkJournalBadges(user.id, totalAfter, hasPhoto);
  newBadges.forEach(id => queueBadgeUnlock(id));
}
```

- [ ] **Step 4: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 5: Commit**

```bash
cd mobile && git add src/screens/journal/AddEntryScreen.tsx
git commit -m "feat: check journal badges after adding entry"
```

---

## Task 14: Integracja — NotificationSettingsScreen

**Files:**
- Modify: `mobile/src/screens/NotificationSettingsScreen.tsx`

- [ ] **Step 1: Dodaj importy do `mobile/src/screens/NotificationSettingsScreen.tsx`**

Po istniejących importach dodaj:
```typescript
import { useBadgeContext } from '../context/BadgeContext';
import { checkNotificationsBadge } from '../services/gamification/BadgeChecker';
```

- [ ] **Step 2: Dodaj `useBadgeContext` do komponentu**

Po linii `const { settings, loading, enable, disable } = useNotifications();` dodaj:
```typescript
const { queueBadgeUnlock } = useBadgeContext();
```

- [ ] **Step 3: Wywołaj `checkNotificationsBadge` po udanym `enable`**

W `handleToggle`, po `const success = await enable(dueDate);`, zastąp blok `if (!success)` następującym:
```typescript
if (success) {
  if (user) {
    const badgeId = await checkNotificationsBadge(user.id);
    if (badgeId) queueBadgeUnlock(badgeId);
  }
} else {
  Alert.alert(
    'Brak uprawnień',
    'Zezwól aplikacji na wysyłanie powiadomień w ustawieniach telefonu.',
  );
}
```

- [ ] **Step 4: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 5: Commit**

```bash
cd mobile && git add src/screens/NotificationSettingsScreen.tsx
git commit -m "feat: check notification badge after enabling notifications"
```

---

## Task 15: Integracja — BirthPrepScreen (packed_bag)

**Files:**
- Modify: `mobile/src/screens/BirthPrepScreen.tsx`

- [ ] **Step 1: Dodaj importy do `mobile/src/screens/BirthPrepScreen.tsx`**

Po istniejących importach dodaj:
```typescript
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBadgeContext } from '../context/BadgeContext';
import { checkChecklistBadge } from '../services/gamification/BadgeChecker';
```

- [ ] **Step 2: Dodaj hooki i `useEffect` do komponentu `BirthPrepScreen`**

Po linii `const { checked, toggleCheck } = usePersistedChecklist('birth_prep');` dodaj:
```typescript
const { user } = useAuth();
const { queueBadgeUnlock } = useBadgeContext();
const badgeAwardedRef = useRef(false);

useEffect(() => {
  if (badgeAwardedRef.current) return;
  if (totalChecked > 0 && totalChecked === totalItems && user) {
    badgeAwardedRef.current = true;
    checkChecklistBadge(user.id, 'hospital_bag').then(badgeId => {
      if (badgeId) queueBadgeUnlock(badgeId);
    });
  }
}, [totalChecked, totalItems, user, queueBadgeUnlock]);
```

**Uwaga:** `totalChecked` i `totalItems` są już obliczone przez `useMemo` w tym komponencie — możesz użyć ich bezpośrednio.

- [ ] **Step 3: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/screens/BirthPrepScreen.tsx
git commit -m "feat: check packed_bag badge when birth prep checklist completed"
```

---

## Task 16: Integracja — PostBirthScreen (post_birth_done)

**Files:**
- Modify: `mobile/src/screens/PostBirthScreen.tsx`

- [ ] **Step 1: Dodaj importy do `mobile/src/screens/PostBirthScreen.tsx`**

Po istniejących importach dodaj:
```typescript
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBadgeContext } from '../context/BadgeContext';
import { checkChecklistBadge } from '../services/gamification/BadgeChecker';
```

- [ ] **Step 2: Dodaj hooki i `useEffect` do komponentu `PostBirthScreen`**

Po linii `const [otherChecked, setOtherChecked] = useState<Record<number, boolean>>({});` dodaj:
```typescript
const { user } = useAuth();
const { queueBadgeUnlock } = useBadgeContext();
const badgeAwardedRef = useRef(false);

useEffect(() => {
  if (badgeAwardedRef.current) return;
  if (totalChecked > 0 && totalChecked === totalItems && user) {
    badgeAwardedRef.current = true;
    checkChecklistBadge(user.id, 'post_birth').then(badgeId => {
      if (badgeId) queueBadgeUnlock(badgeId);
    });
  }
}, [totalChecked, totalItems, user, queueBadgeUnlock]);
```

- [ ] **Step 3: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/screens/PostBirthScreen.tsx
git commit -m "feat: check post_birth_done badge when post-birth checklist completed"
```

---

## Task 17: Integracja — ShoppingList (layette_ready)

**Files:**
- Modify: `mobile/src/components/ShoppingList.tsx`

- [ ] **Step 1: Dodaj importy do `mobile/src/components/ShoppingList.tsx`**

Po istniejących importach dodaj:
```typescript
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBadgeContext } from '../context/BadgeContext';
import { checkChecklistBadge } from '../services/gamification/BadgeChecker';
```

- [ ] **Step 2: Dodaj hooki i `useEffect` do komponentu `ShoppingList`**

Po linii `const { checked, toggleCheck } = usePersistedChecklist('shopping');` dodaj:
```typescript
const { user } = useAuth();
const { queueBadgeUnlock } = useBadgeContext();
const badgeAwardedRef = useRef(false);

useEffect(() => {
  if (badgeAwardedRef.current) return;
  if (totalChecked > 0 && totalChecked === totalItems && user) {
    badgeAwardedRef.current = true;
    checkChecklistBadge(user.id, 'layette').then(badgeId => {
      if (badgeId) queueBadgeUnlock(badgeId);
    });
  }
}, [totalChecked, totalItems, user, queueBadgeUnlock]);
```

- [ ] **Step 3: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/components/ShoppingList.tsx
git commit -m "feat: check layette_ready badge when shopping list completed"
```

---

## Task 18: Weryfikacja końcowa

- [ ] **Step 1: Pełny type check**

```bash
cd mobile && npx tsc --noEmit
```

Oczekiwany wynik: **zero błędów**.

- [ ] **Step 2: Uruchom Expo i sprawdź ręcznie**

```bash
cd mobile && npx expo start --clear
```

Sprawdź w kolejności:
1. HomeScreen — widoczny `BadgesWidget` między kartą tygodnia a siatką modułów
2. Kliknij "Zobacz wszystkie" → otwiera `BadgesScreen` z gridем 10 odznak (wszystkie wyszarzone)
3. Wróć, wejdź w Dziennik → Dodaj wpis → po zapisie pojawia się modal "Kronikarz 📓"
4. Wejdź w Ustawienia → Powiadomienia → Włącz → pojawia się modal "Czujny Tata 🔔"
5. BadgesScreen — odznaki "Kronikarz" i "Czujny Tata" mają datę zdobycia

- [ ] **Step 3: Commit końcowy jeśli są jakieś drobne poprawki**

```bash
cd mobile && git add -p
git commit -m "fix: final gamification adjustments"
```
