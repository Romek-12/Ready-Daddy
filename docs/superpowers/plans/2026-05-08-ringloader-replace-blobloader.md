# RingLoader Replace BlobLoader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zastąpić `BlobLoader` (kropla z gradientem, 3 warianty) przez nowy `RingLoader` (40-segmentowy pierścień z animacją komety) we wszystkich 19 użyciach, usunąć stary komponent.

**Architecture:** Tworzymy `RingLoader.tsx` na bazie handoff'u — dodajemy auto-segments (gdy size<64 → 20 segmentów, w przeciwnym razie 40), wymuszony `showMonogram=false` dla size<64. Mapujemy 3 warianty BlobLoadera na rozmiary RingLoadera (button=20, inline=48, fullscreen=120). Usuwamy `label` props w 4 miejscach. Na końcu kasujemy `BlobLoader.tsx`.

**Tech Stack:** React Native 0.81 + Expo 55, TypeScript strict, react-native-svg ^15.15.3, react-native-reanimated ^4.3.0, Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-05-08-ringloader-replace-blobloader-design.md`

---

## File Structure

**Nowe:**
- `mobile/src/components/ui/RingLoader.tsx` — komponent pierścienia
- `mobile/src/components/ui/__tests__/RingLoader.test.tsx`

**Zmienione (14 plików):**
- `mobile/src/navigation/AppNavigator.tsx`
- `mobile/src/screens/journal/JournalScreen.tsx`
- `mobile/src/screens/journal/AddEntryScreen.tsx`
- `mobile/src/screens/DadModuleScreen.tsx`
- `mobile/src/screens/SettingsScreen.tsx`
- `mobile/src/screens/ProfileSetupScreen.tsx`
- `mobile/src/screens/AddVisitScreen.tsx`
- `mobile/src/screens/NotificationSettingsScreen.tsx`
- `mobile/src/screens/BadgesScreen.tsx`
- `mobile/src/screens/ActionCardsScreen.tsx`
- `mobile/src/components/SocialAuthButtons.tsx`
- `mobile/src/components/ui/GradientButton.tsx`
- `mobile/src/components/Button.tsx`
- `mobile/src/components/BabyNameModal.tsx`

**Usunięte:**
- `mobile/src/components/ui/BlobLoader.tsx`

---

## Task 1: `RingLoader` komponent + testy

**Files:**
- Create: `mobile/src/components/ui/RingLoader.tsx`
- Create: `mobile/src/components/ui/__tests__/RingLoader.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/components/ui/__tests__/RingLoader.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import RingLoader from '../RingLoader';

describe('RingLoader', () => {
  it('renders without crashing at default size', () => {
    const { getByTestId } = render(<RingLoader testID="loader" />);
    expect(getByTestId('loader')).toBeTruthy();
  });

  it('renders with explicit size 20 (button-sized)', () => {
    const { getByTestId } = render(<RingLoader testID="loader" size={20} />);
    const root = getByTestId('loader');
    expect(root.props.style).toMatchObject([{ width: 20, height: 20 }, undefined]);
  });

  it('hides monogram automatically when size < 64', () => {
    const { queryByText } = render(<RingLoader size={20} showMonogram />);
    expect(queryByText('RD')).toBeNull();
  });

  it('shows monogram when size >= 64 and showMonogram=true', () => {
    const { getByText } = render(<RingLoader size={120} showMonogram />);
    expect(getByText('RD')).toBeTruthy();
  });

  it('hides monogram when showMonogram=false even for large size', () => {
    const { queryByText } = render(<RingLoader size={120} showMonogram={false} />);
    expect(queryByText('RD')).toBeNull();
  });

  it('uses 40 segments by default for large size', () => {
    const { UNSAFE_root } = render(<RingLoader size={120} testID="loader" />);
    const rects = UNSAFE_root.findAllByType('RNSVGRect');
    expect(rects.length).toBe(40);
  });

  it('uses 20 segments automatically for small size', () => {
    const { UNSAFE_root } = render(<RingLoader size={20} testID="loader" />);
    const rects = UNSAFE_root.findAllByType('RNSVGRect');
    expect(rects.length).toBe(20);
  });

  it('respects explicit segments prop over auto-mapping', () => {
    const { UNSAFE_root } = render(<RingLoader size={20} segments={10} testID="loader" />);
    const rects = UNSAFE_root.findAllByType('RNSVGRect');
    expect(rects.length).toBe(10);
  });

  it('accepts custom fromColor and toColor', () => {
    const { getByTestId } = render(
      <RingLoader testID="loader" fromColor="#FF0000" toColor="#00FF00" />,
    );
    expect(getByTestId('loader')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Dev/mobile && npx jest src/components/ui/__tests__/RingLoader.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement RingLoader**

Create `mobile/src/components/ui/RingLoader.tsx`:

```typescript
import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Text } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface RingLoaderProps {
  /** Diameter in px. Default 200. */
  size?: number;
  /** Number of segments around the ring. Default: 20 if size<64, otherwise 40. */
  segments?: number;
  /** Length of trail in segments. Default: round(segments * 0.75). */
  trail?: number;
  /** Time for one full rotation in ms. Default 3600. */
  duration?: number;
  /** Gradient stops. Default cyan→teal. */
  fromColor?: string;
  toColor?: string;
  /** Show "RD" monogram in center. Auto-disabled for size<64. Default true. */
  showMonogram?: boolean;
  /** Optional fixed progress 0–1 (disables animation). */
  progress?: number;
  style?: ViewStyle;
  testID?: string;
}

const SMALL_SIZE_THRESHOLD = 64;

/**
 * Ready Daddy ring loader — 40-segment progress ring with comet-trail animation.
 * Use animated mode (default) for indeterminate loading; pass `progress` for determinate.
 *
 * Sizing:
 *  - size >= 64: 40 segments, monogram visible (if showMonogram).
 *  - size < 64: 20 segments, monogram hidden (regardless of showMonogram).
 */
export default function RingLoader({
  size = 200,
  segments,
  trail,
  duration = 3600,
  fromColor = '#00E5FF',
  toColor = '#00BFA5',
  showMonogram = true,
  progress,
  style,
  testID,
}: RingLoaderProps) {
  const isSmall = size < SMALL_SIZE_THRESHOLD;
  const resolvedSegments = segments ?? (isSmall ? 20 : 40);
  const resolvedTrail = trail ?? Math.round(resolvedSegments * 0.75);
  const monogramVisible = showMonogram && !isSmall;

  const head = useSharedValue(0);

  useEffect(() => {
    if (progress === undefined) {
      head.value = withRepeat(
        withTiming(resolvedSegments, { duration, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      head.value = withTiming(progress * resolvedSegments, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, resolvedSegments, duration, head]);

  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={fromColor} />
            <Stop offset="1" stopColor={toColor} />
          </LinearGradient>
        </Defs>

        {Array.from({ length: resolvedSegments }).map((_, i) => (
          <Segment
            key={i}
            index={i}
            segments={resolvedSegments}
            trail={resolvedTrail}
            head={head}
            indeterminate={progress === undefined}
          />
        ))}

        {monogramVisible && (
          <Text
            x={100}
            y={120}
            textAnchor="middle"
            fontFamily="ClimateCrisis"
            fontSize={62}
            fill="url(#ringGrad)"
          >
            RD
          </Text>
        )}
      </Svg>
    </View>
  );
}

interface SegmentProps {
  index: number;
  segments: number;
  trail: number;
  head: SharedValue<number>;
  indeterminate: boolean;
}

function Segment({ index, segments, trail, head, indeterminate }: SegmentProps) {
  const animatedProps = useAnimatedProps(() => {
    const dist = indeterminate
      ? (head.value - index + segments) % segments
      : index < head.value
        ? 0
        : segments;

    const opacity =
      dist < trail
        ? interpolate(dist, [0, trail], [1, 0.12], Extrapolation.CLAMP)
        : 0.12;

    return { opacity };
  });

  return (
    <AnimatedRect
      x={98}
      y={14}
      width={4}
      height={14}
      rx={2}
      fill="url(#ringGrad)"
      transform={`rotate(${(index / segments) * 360} 100 100)`}
      animatedProps={animatedProps}
    />
  );
}
```

Note: `fontFamily="ClimateCrisis"` (bez spacji) — w `mobile/src/theme/index.ts` font jest zarejestrowany jako `'ClimateCrisis'`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Dev/mobile && npx jest src/components/ui/__tests__/RingLoader.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd c:/Dev/mobile
git add src/components/ui/RingLoader.tsx src/components/ui/__tests__/RingLoader.test.tsx
git commit -m "feat(ui): add RingLoader component with auto segment sizing"
```

---

## Task 2: Podmiana w komponentach ui (GradientButton)

**Files:**
- Modify: `mobile/src/components/ui/GradientButton.tsx`

- [ ] **Step 1: Modify imports and JSX**

In `mobile/src/components/ui/GradientButton.tsx`, replace:

```typescript
import BlobLoader from './BlobLoader';
```

With:

```typescript
import RingLoader from './RingLoader';
```

In the same file, find:

```typescript
        {loading ? (
          <BlobLoader variant="button" color={theme.colors.black} />
        ) : (
          <Text style={s.text}>{title}</Text>
        )}
```

Replace with:

```typescript
        {loading ? (
          <RingLoader size={20} showMonogram={false} fromColor={theme.colors.black} toColor={theme.colors.black} />
        ) : (
          <Text style={s.text}>{title}</Text>
        )}
```

- [ ] **Step 2: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run: `cd c:/Dev/mobile && npm test`
Expected: 96/96 pass (no regression).

- [ ] **Step 4: Commit**

```bash
cd c:/Dev/mobile
git add src/components/ui/GradientButton.tsx
git commit -m "refactor(ui): replace BlobLoader with RingLoader in GradientButton"
```

---

## Task 3: Podmiana w komponentach (Button, BabyNameModal, SocialAuthButtons)

**Files:**
- Modify: `mobile/src/components/Button.tsx`
- Modify: `mobile/src/components/BabyNameModal.tsx`
- Modify: `mobile/src/components/SocialAuthButtons.tsx`

- [ ] **Step 1: Update Button.tsx**

In `mobile/src/components/Button.tsx`, replace:

```typescript
import BlobLoader from './ui/BlobLoader';
```

With:

```typescript
import RingLoader from './ui/RingLoader';
```

Find:

```typescript
        <BlobLoader variant="button" color={isPrimary ? theme.colors.black : theme.colors.primary} />
```

Replace with:

```typescript
        <RingLoader size={20} showMonogram={false} fromColor={isPrimary ? theme.colors.black : theme.colors.primary} toColor={isPrimary ? theme.colors.black : theme.colors.primary} />
```

- [ ] **Step 2: Update BabyNameModal.tsx**

In `mobile/src/components/BabyNameModal.tsx`, replace:

```typescript
import BlobLoader from './ui/BlobLoader';
```

With:

```typescript
import RingLoader from './ui/RingLoader';
```

Find:

```typescript
                <BlobLoader variant="button" color="#fff" />
```

Replace with:

```typescript
                <RingLoader size={20} showMonogram={false} fromColor="#fff" toColor="#fff" />
```

- [ ] **Step 3: Update SocialAuthButtons.tsx**

In `mobile/src/components/SocialAuthButtons.tsx`, replace:

```typescript
import BlobLoader from './ui/BlobLoader';
```

With:

```typescript
import RingLoader from './ui/RingLoader';
```

Find both `BlobLoader` lines (Google + Facebook) and replace:

```typescript
          <BlobLoader variant="button" color="#3C4043" />
```

With:

```typescript
          <RingLoader size={20} showMonogram={false} fromColor="#3C4043" toColor="#3C4043" />
```

And:

```typescript
          <BlobLoader variant="button" color="#fff" />
```

With:

```typescript
          <RingLoader size={20} showMonogram={false} fromColor="#fff" toColor="#fff" />
```

- [ ] **Step 4: Run typecheck and tests**

Run: `cd c:/Dev/mobile && npx tsc --noEmit && npm test`
Expected: typecheck clean, 96/96 tests pass.

- [ ] **Step 5: Commit**

```bash
cd c:/Dev/mobile
git add src/components/Button.tsx src/components/BabyNameModal.tsx src/components/SocialAuthButtons.tsx
git commit -m "refactor(ui): replace BlobLoader with RingLoader in shared components"
```

---

## Task 4: Podmiana w nawigacji i ekranach z fullscreen+label

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.tsx`
- Modify: `mobile/src/screens/DadModuleScreen.tsx`
- Modify: `mobile/src/screens/BadgesScreen.tsx`
- Modify: `mobile/src/screens/ActionCardsScreen.tsx`

W każdym z tych plików: usuwamy `label="..."`, zostawiamy tylko loader.

- [ ] **Step 1: Update AppNavigator.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find:

```typescript
        <BlobLoader variant="fullscreen" label="Ładowanie..." />
```

Replace with:

```typescript
        <RingLoader size={120} />
```

- [ ] **Step 2: Update DadModuleScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find:

```typescript
        <BlobLoader variant="fullscreen" label="Ładowanie poradnika..." />
```

Replace with:

```typescript
        <RingLoader size={120} />
```

- [ ] **Step 3: Update BadgesScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find:

```typescript
          <BlobLoader variant="fullscreen" label="Ładowanie odznak..." />
```

Replace with:

```typescript
          <RingLoader size={120} />
```

- [ ] **Step 4: Update ActionCardsScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find:

```typescript
        <BlobLoader variant="fullscreen" label="Ładowanie kart..." />
```

Replace with:

```typescript
        <RingLoader size={120} />
```

- [ ] **Step 5: Run typecheck and tests**

Run: `cd c:/Dev/mobile && npx tsc --noEmit && npm test`
Expected: typecheck clean, 96/96 pass.

- [ ] **Step 6: Commit**

```bash
cd c:/Dev/mobile
git add src/navigation/AppNavigator.tsx src/screens/DadModuleScreen.tsx src/screens/BadgesScreen.tsx src/screens/ActionCardsScreen.tsx
git commit -m "refactor(ui): replace BlobLoader with RingLoader in fullscreen loaders"
```

---

## Task 5: Podmiana w pozostałych ekranach

**Files:**
- Modify: `mobile/src/screens/journal/JournalScreen.tsx`
- Modify: `mobile/src/screens/journal/AddEntryScreen.tsx`
- Modify: `mobile/src/screens/SettingsScreen.tsx`
- Modify: `mobile/src/screens/ProfileSetupScreen.tsx`
- Modify: `mobile/src/screens/AddVisitScreen.tsx`
- Modify: `mobile/src/screens/NotificationSettingsScreen.tsx`

- [ ] **Step 1: Update JournalScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../../components/ui/RingLoader';
```

Find:

```typescript
              <BlobLoader variant="inline" />
```

Replace with:

```typescript
              <RingLoader size={48} showMonogram={false} />
```

- [ ] **Step 2: Update AddEntryScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../../components/ui/RingLoader';
```

Find first occurrence:

```typescript
            <BlobLoader variant="button" color={theme.colors.background} />
```

Replace with:

```typescript
            <RingLoader size={20} showMonogram={false} fromColor={theme.colors.background} toColor={theme.colors.background} />
```

Find second occurrence (without color):

```typescript
              <BlobLoader variant="button" />
```

Replace with:

```typescript
              <RingLoader size={20} showMonogram={false} />
```

- [ ] **Step 3: Update SettingsScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find all 3 occurrences and replace each:

```typescript
                  <BlobLoader variant="button" color="#fff" />
```

With:

```typescript
                  <RingLoader size={20} showMonogram={false} fromColor="#fff" toColor="#fff" />
```

(Use search-and-replace if your editor supports it; same line appears 2x. Third occurrence is on a different line: `{saving ? <BlobLoader variant="button" color="#fff" /> : ...}` — apply the same replacement.)

- [ ] **Step 4: Update ProfileSetupScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find:

```typescript
            <BlobLoader variant="button" color={theme.colors.black} />
```

Replace with:

```typescript
            <RingLoader size={20} showMonogram={false} fromColor={theme.colors.black} toColor={theme.colors.black} />
```

- [ ] **Step 5: Update AddVisitScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find:

```typescript
            <BlobLoader variant="button" color={theme.colors.background} />
```

Replace with:

```typescript
            <RingLoader size={20} showMonogram={false} fromColor={theme.colors.background} toColor={theme.colors.background} />
```

- [ ] **Step 6: Update NotificationSettingsScreen.tsx**

Replace import:

```typescript
import BlobLoader from '../components/ui/BlobLoader';
```

With:

```typescript
import RingLoader from '../components/ui/RingLoader';
```

Find first occurrence:

```typescript
        <BlobLoader variant="inline" />
```

Replace with:

```typescript
        <RingLoader size={48} showMonogram={false} />
```

Find second occurrence:

```typescript
            <BlobLoader variant="button" />
```

Replace with:

```typescript
            <RingLoader size={20} showMonogram={false} />
```

- [ ] **Step 7: Run typecheck and tests**

Run: `cd c:/Dev/mobile && npx tsc --noEmit && npm test`
Expected: typecheck clean, 96/96 pass.

- [ ] **Step 8: Verify no BlobLoader imports remain in src (excluding the BlobLoader.tsx file itself)**

Run: `cd c:/Dev/mobile && grep -rn "BlobLoader" src/ --include="*.tsx" --include="*.ts" | grep -v "BlobLoader.tsx$"`
Expected: NO output (everything migrated).

- [ ] **Step 9: Commit**

```bash
cd c:/Dev/mobile
git add src/screens/
git commit -m "refactor(ui): replace BlobLoader with RingLoader in remaining screens"
```

---

## Task 6: Usunięcie BlobLoadera

**Files:**
- Delete: `mobile/src/components/ui/BlobLoader.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run: `cd c:/Dev/mobile && grep -rn "BlobLoader" src/`
Expected: only `src/components/ui/BlobLoader.tsx` itself in output.

- [ ] **Step 2: Delete the file**

Run: `cd c:/Dev/mobile && rm src/components/ui/BlobLoader.tsx`

- [ ] **Step 3: Run full test suite**

Run: `cd c:/Dev/mobile && npm test`
Expected: 96/96 pass.

- [ ] **Step 4: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd c:/Dev/mobile
git add -A
git commit -m "chore(ui): delete BlobLoader, fully replaced by RingLoader"
```

---

## Self-Review

**Spec coverage:**
- ✅ RingLoader z auto-segments → Task 1 (`isSmall = size < 64`, `resolvedSegments = segments ?? (isSmall ? 20 : 40)`)
- ✅ Wymuszony brak monogramu dla size<64 → Task 1 (`monogramVisible = showMonogram && !isSmall`)
- ✅ Defaulty kolorów cyan→teal (z handoff) → Task 1 (`fromColor='#00E5FF'`, `toColor='#00BFA5'`)
- ✅ Brak propsów `label`/`sub`/`week` → Task 1 (interface `RingLoaderProps` ich nie zawiera)
- ✅ Mapping fullscreen → size=120 → Tasks 4
- ✅ Mapping inline → size=48, showMonogram=false → Task 5 (JournalScreen, NotificationSettingsScreen)
- ✅ Mapping button → size=20, showMonogram=false, kolory z `color` → Tasks 2, 3, 5
- ✅ Usunięcie label w 4 miejscach → Task 4 (AppNavigator, DadModuleScreen, BadgesScreen, ActionCardsScreen)
- ✅ Usunięcie BlobLoadera → Task 6
- ✅ Testy: render, auto-segments, monogram visibility, kolory → Task 1

**Placeholder scan:** brak TBD/TODO; wszystkie kroki mają konkretne snippety przed/po.

**Type consistency:**
- `RingLoaderProps` zdefiniowany w Task 1, używany identycznie wszędzie indziej (`size`, `showMonogram`, `fromColor`, `toColor`).
- Wszystkie `BlobLoader.color` (jeden kolor) mapują się na `fromColor=X toColor=X` (gradient bez przejścia, czyli pełny kolor).

Plan gotowy.
