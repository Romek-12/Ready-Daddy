# Ready Daddy UI Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Ready Daddy UI handoff (Notion doc, April 2026) to all 18 screens — refine existing components (`GlassCard`, `AuroraBackground`, `GradientProgressBar`, `FetusVisualizerCompact`), add new shared primitives (`NeonCheckbox`, `ProgressRing`, `GradientText`), extend design tokens, and apply per-screen visual refinements (neon glow, aurora blobs, gradient titles, accent border-left cards, grid badges, timeline layouts).

**Architecture:** Bottom-up — design tokens first, then shared primitives, then refinements propagate through screens naturally. Existing components keep backwards-compatible APIs (new props are optional). No refactors of navigation or state.

**Tech Stack:** React Native 0.81 + Expo 54, TypeScript 5.8, `expo-linear-gradient`, `react-native-svg`, `react-native-reanimated` (all present). New dep: `@react-native-masked-view/masked-view` for gradient text.

---

## File Structure

**Theme & tokens:**
- Modify: `mobile/src/theme/index.ts` — add `primaryGlow`, `violetGlow`, `surfaceBase` to dark/light color sets; bump `fontSize.hero` 34 → 36.

**New shared primitives (all under `mobile/src/components/ui/`):**
- Create: `NeonCheckbox.tsx` — gradient-filled checkbox with neon glow when checked.
- Create: `ProgressRing.tsx` — SVG ring with cyan→violet gradient stroke.
- Create: `GradientText.tsx` — MaskedView + LinearGradient for gradient headings.

**Existing components — extend (backwards compatible):**
- Modify: `GlassCard.tsx` — add optional `accent?: 'cyan' | 'violet'` prop (left-border 3px).
- Modify: `GradientProgressBar.tsx` — add optional `glow?: boolean` prop (shadow).
- Modify: `AuroraBackground.tsx` — bump opacity 0.55 → 0.7; add slow reanimated drift.
- Modify: `FetusVisualizerCompact.tsx` — shrink svgBox 80×90 → 72×82, image 68×78 → 58×68, keep `overflow: 'hidden'`.
- Modify: `FetusVisualizer.tsx` — add reanimated pulse animation to fetus image.

**Screen refinements — each in its own task, grouped by priority:**
- `HomeScreen.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`, `WeekDetailScreen.tsx`, `ActionCardsScreen.tsx`, `CheckupsScreen.tsx`, `PlanningScreen.tsx`, `BirthPrepScreen.tsx`, `BadgesScreen.tsx`, `JournalScreen.tsx`, `DadModuleScreen.tsx` (+ `DadNoworodekScreen.tsx`, `DadPologScreen.tsx`, `DadRelacjaScreen.tsx`), `SettingsScreen.tsx`, `NotificationSettingsScreen.tsx`, `FourthTrimesterScreen.tsx`, `PostBirthScreen.tsx`, `first-year/FirstYearHomeScreen.tsx`, `NameDrawScreen.tsx`.

---

## Phase 1 — Foundation (design tokens, shared primitives)

### Task 1: Extend theme tokens

**Files:**
- Modify: `mobile/src/theme/index.ts`

- [ ] **Step 1: Add new tokens to `darkColors` and `lightColors`**

Open `mobile/src/theme/index.ts`. In `darkColors` (after `violetSoft`), add:

```typescript
  primaryGlow: 'rgba(77,217,192,0.55)',
  violetGlow: 'rgba(155,127,212,0.55)',
  surfaceBase: '#0E1A17',
```

In `lightColors` (same position), add:

```typescript
  primaryGlow: 'rgba(26,158,138,0.45)',
  violetGlow: 'rgba(123,94,167,0.45)',
  surfaceBase: '#E4ECE9',
```

- [ ] **Step 2: Bump `fontSize.hero` from 34 to 36**

In `sharedTheme.fontSize`, change `hero: 34` → `hero: 36`.

- [ ] **Step 3: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/theme/index.ts
git commit -m "feat(theme): add primaryGlow, violetGlow, surfaceBase tokens; hero 36"
```

---

### Task 2: `NeonCheckbox` component

**Files:**
- Create: `mobile/src/components/ui/NeonCheckbox.tsx`

- [ ] **Step 1: Create the component**

```typescript
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../Icon';

interface Props {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

export default function NeonCheckbox({ checked, onPress, size = 22 }: Props) {
  const { theme } = useTheme();
  const box = {
    width: size,
    height: size,
    borderRadius: 6,
  };
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={8}>
      {checked ? (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            box,
            styles.checked,
            {
              shadowColor: theme.colors.primary,
            },
          ]}
        >
          <Icon name="check" size={Math.round(size * 0.6)} color={theme.colors.black} />
        </LinearGradient>
      ) : (
        <View
          style={[
            box,
            {
              borderWidth: 1.5,
              borderColor: theme.colors.cardBorderHi,
              backgroundColor: 'transparent',
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checked: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
```

- [ ] **Step 2: Verify `Icon` supports `"check"`**

Run: `grep -n "check" mobile/src/components/Icon.tsx | head -5`
Expected: a case/key for `check`. If not present, use alternative: replace the `<Icon .../>` line with `<Text style={{ color: theme.colors.black, fontWeight: '700', fontSize: Math.round(size * 0.65) }}>✓</Text>` (and add `Text` to the imports).

- [ ] **Step 3: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/ui/NeonCheckbox.tsx
git commit -m "feat(ui): add NeonCheckbox with gradient fill + neon glow"
```

---

### Task 3: `ProgressRing` component

**Files:**
- Create: `mobile/src/components/ui/ProgressRing.tsx`

- [ ] **Step 1: Create the component**

```typescript
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

export default function ProgressRing({ value, size = 72, stroke = 6, children }: Props) {
  const { theme } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <LinearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={theme.colors.primary} />
            <Stop offset="100%" stopColor={theme.colors.violet} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={theme.colors.cardBorder}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
        />
      </Svg>
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/ui/ProgressRing.tsx
git commit -m "feat(ui): add ProgressRing with cyan→violet gradient stroke"
```

---

### Task 4: Install masked-view and create `GradientText`

**Files:**
- Modify: `mobile/package.json` (via `expo install`)
- Create: `mobile/src/components/ui/GradientText.tsx`

- [ ] **Step 1: Install masked-view**

Run: `cd mobile && npx expo install @react-native-masked-view/masked-view`
Expected: package added to `dependencies`.

- [ ] **Step 2: Create the component**

```typescript
import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  colors?: [string, string];
}

export default function GradientText({ children, style, colors }: Props) {
  const { theme } = useTheme();
  const gradientColors = colors ?? [theme.colors.primary, theme.colors.violet];
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/src/components/ui/GradientText.tsx
git commit -m "feat(ui): add GradientText via masked-view + linear-gradient"
```

---

### Task 5: Extend `GlassCard` with `accent` prop

**Files:**
- Modify: `mobile/src/components/ui/GlassCard.tsx`

- [ ] **Step 1: Add `accent` prop and border-left styling**

Replace the full contents of `mobile/src/components/ui/GlassCard.tsx` with:

```typescript
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  accent?: 'cyan' | 'violet';
}

export default function GlassCard({ children, style, elevated = false, accent }: GlassCardProps) {
  const { theme } = useTheme();
  const accentColor =
    accent === 'cyan' ? theme.colors.primary : accent === 'violet' ? theme.colors.violet : undefined;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: elevated ? theme.colors.surfaceHi : theme.colors.surface,
          borderColor: elevated ? theme.colors.cardBorderHi : theme.colors.cardBorder,
          borderRadius: theme.borderRadius.xl,
        },
        accentColor && { borderLeftWidth: 3, borderLeftColor: accentColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/ui/GlassCard.tsx
git commit -m "feat(ui): GlassCard accent prop (cyan/violet border-left)"
```

---

### Task 6: Add `glow` prop to `GradientProgressBar`

**Files:**
- Modify: `mobile/src/components/ui/GradientProgressBar.tsx`

- [ ] **Step 1: Add glow prop**

Replace contents of `mobile/src/components/ui/GradientProgressBar.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  value: number;
  height?: number;
  glow?: boolean;
}

export default function GradientProgressBar({ value, height = 6, glow = false }: Props) {
  const { theme } = useTheme();
  const clamped = Math.max(2, Math.min(100, value));
  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: theme.colors.cardBorder, borderRadius: height / 2 },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.fill,
          { width: `${clamped}%`, borderRadius: height / 2 },
          glow && {
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.7,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
```

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/components/ui/GradientProgressBar.tsx
git commit -m "feat(ui): GradientProgressBar optional neon glow"
```

---

### Task 7: `AuroraBackground` — bump opacity + slow drift

**Files:**
- Modify: `mobile/src/components/ui/AuroraBackground.tsx`

- [ ] **Step 1: Add reanimated drift and bump opacity**

Replace contents of `mobile/src/components/ui/AuroraBackground.tsx`:

```typescript
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface AuroraBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export default function AuroraBackground({ children, style }: AuroraBackgroundProps) {
  const { theme } = useTheme();
  const cyanY = useSharedValue(0);
  const violetY = useSharedValue(0);

  useEffect(() => {
    cyanY.value = withRepeat(
      withSequence(withTiming(-20, { duration: 6000 }), withTiming(0, { duration: 6000 })),
      -1,
      true
    );
    violetY.value = withRepeat(
      withSequence(withTiming(16, { duration: 7000 }), withTiming(0, { duration: 7000 })),
      -1,
      true
    );
  }, [cyanY, violetY]);

  const cyanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cyanY.value }] }));
  const violetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: violetY.value }] }));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      <AnimatedGradient
        colors={[theme.colors.primaryLight, 'transparent']}
        style={[styles.blobCyan, cyanStyle]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <AnimatedGradient
        colors={[theme.colors.violetSoft, 'transparent']}
        style={[styles.blobViolet, violetStyle]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0, y: 0 }}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  blobCyan: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    bottom: -80,
    left: -60,
    opacity: 0.7,
  },
  blobViolet: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -140,
    right: -100,
    opacity: 0.7,
  },
  content: { flex: 1, zIndex: 1 },
});
```

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/components/ui/AuroraBackground.tsx
git commit -m "feat(ui): AuroraBackground opacity 0.7 + slow drift"
```

---

### Task 8: `FetusVisualizerCompact` — fix overflow sizes

**Files:**
- Modify: `mobile/src/components/FetusVisualizerCompact.tsx`

- [ ] **Step 1: Shrink image and svgBox**

In `FetusVisualizerCompact.tsx`:

- Line 39: change `<Image source={fetusImage} style={{ width: 68, height: 78 }} resizeMode="contain" />` to `<Image source={fetusImage} style={{ width: 58, height: 68 }} resizeMode="contain" />`
- In `createStyles`, `svgBox`: change `width: 80` → `width: 72`, `height: 90` → `height: 82`.

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/components/FetusVisualizerCompact.tsx
git commit -m "fix(ui): FetusVisualizerCompact tighter box + image"
```

---

### Task 9: `FetusVisualizer` — pulsing animation

**Files:**
- Modify: `mobile/src/components/FetusVisualizer.tsx`

- [ ] **Step 1: Read and locate the `<Image>` element**

Run: `grep -n "Image\|fetusImage" mobile/src/components/FetusVisualizer.tsx`
Identify the `<Image>` line that renders the fetus image (the main, large one).

- [ ] **Step 2: Wrap image in `Animated.View` with pulse**

At the top of the file, add imports (keep existing imports):

```typescript
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
```

Inside the component body (before the `return`), add:

```typescript
const scale = useSharedValue(1);
useEffect(() => {
  scale.value = withRepeat(
    withSequence(
      withTiming(1.06, { duration: 1800 }),
      withTiming(1.0, { duration: 1800 })
    ),
    -1,
    true
  );
}, [scale]);
const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
```

Wrap the main fetus `<Image ... />` with `<Animated.View style={pulseStyle}>...</Animated.View>`.

- [ ] **Step 3: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/components/FetusVisualizer.tsx
git commit -m "feat(ui): pulsing animation for fetus image"
```

---

## Phase 2 — High-impact screens

### Task 10: `HomeScreen` — week number 36px, neon progress bar, notif accent

**Files:**
- Modify: `mobile/src/screens/HomeScreen.tsx`

- [ ] **Step 1: Inspect current styles**

Run: `grep -n "weekNumber\|weekCard\|progressBar\|notifCard\|notifBanner" mobile/src/screens/HomeScreen.tsx`
Identify: the style for the hero week number, the week hero card, and any notification banner.

- [ ] **Step 2: Apply changes**

In `HomeScreen.tsx`:

1. For the `weekNumber` style (hero digit): change `fontSize: theme.fontSize.hero` to `fontSize: 36` if not already (theme change should handle this; verify it's `theme.fontSize.hero`).
2. On the `weekCard` / hero container style: add `overflow: 'hidden'`.
3. Replace any inline `<View style={{...progress bar...}} />` used as the weekly progress with `<GradientProgressBar value={progressPct} glow />` — import `GradientProgressBar` from `../components/ui/GradientProgressBar`.
4. Any notification/alert card: add `borderLeftWidth: 2, borderLeftColor: theme.colors.primary` to its style (or replace with `<GlassCard accent="cyan">...</GlassCard>`).

- [ ] **Step 3: Visual verification**

Start the dev server: `cd mobile && npx expo start`
Expected: Home screen shows large gradient-glow progress bar, week number reads 36pt, notification card has a cyan left accent. Kill server.

- [ ] **Step 4: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/HomeScreen.tsx
git commit -m "feat(home): neon progress bar, cyan accent on notif, hero 36"
```

---

### Task 11: Auth screens — AuroraBackground, gradient titles, glass inputs, gradient CTA

**Files:**
- Modify: `mobile/src/screens/LoginScreen.tsx`
- Modify: `mobile/src/screens/RegisterScreen.tsx`
- Modify: `mobile/src/screens/ForgotPasswordScreen.tsx`
- Modify: `mobile/src/screens/ResetPasswordScreen.tsx`

Apply the same pattern to each. (Register has extra inputs — handle in step 3.)

- [ ] **Step 1: Wrap each screen root in `<AuroraBackground>`**

For each file: at the top of the returned JSX, wrap the existing root `<View>` (or `<SafeAreaView>`) with `<AuroraBackground>...</AuroraBackground>`. Import: `import AuroraBackground from '../components/ui/AuroraBackground';`.

- [ ] **Step 2: Use `GradientText` for the screen title**

Import: `import GradientText from '../components/ui/GradientText';`.
Replace the main heading `<Text style={s.title}>...</Text>` with `<GradientText style={s.title}>...</GradientText>`.

- [ ] **Step 3: Wrap form inputs in `GlassCard` with icon**

For each input row: wrap with `<GlassCard>` and place an `<Icon>` to the left of the `<TextInput>`. Example for Login email field:

```typescript
<GlassCard style={s.inputCard}>
  <View style={s.inputRow}>
    <Icon name="mail" size={18} color={theme.colors.textMuted} />
    <TextInput style={s.input} placeholder="Email" ... />
  </View>
</GlassCard>
```

Add styles:

```typescript
inputCard: { paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
input: { flex: 1, color: theme.colors.text, fontSize: theme.fontSize.md, fontFamily: 'SpaceGrotesk_400Regular' },
```

(For Register: email, password, display name, due date, pregnancy week. Due date + pregnancy week stay as pickers — still wrap in `GlassCard` with a `calendar` / `clock` icon.)

For `ForgotPasswordScreen`: also add a lock-icon hero — a `<GlassCard>` with a centered `<Icon name="lock" size={32} color={theme.colors.primary} />` above the form.

- [ ] **Step 4: Gradient CTA button**

Replace the primary submit `<TouchableOpacity>`/`<Button>` with a gradient button. Add locally or in-place:

```typescript
<TouchableOpacity onPress={onSubmit} disabled={loading} activeOpacity={0.9}>
  <LinearGradient
    colors={[theme.colors.primary, theme.colors.violet]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={s.ctaBtn}
  >
    <Text style={s.ctaText}>Zaloguj się</Text>
  </LinearGradient>
</TouchableOpacity>
```

Styles:

```typescript
ctaBtn: {
  paddingVertical: 14,
  borderRadius: theme.borderRadius.xl,
  alignItems: 'center',
  shadowColor: theme.colors.primary,
  shadowOpacity: 0.5,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
},
ctaText: {
  color: theme.colors.black,
  fontFamily: 'SpaceGrotesk_700Bold',
  fontWeight: theme.fontWeight.bold,
  fontSize: theme.fontSize.md,
},
```

Update the CTA label per screen (Register: "Zarejestruj się", ForgotPassword: "Wyślij link", ResetPassword: "Zmień hasło").

- [ ] **Step 5: Type-check + visual check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.
Start expo, open each auth screen, verify aurora blobs visible, gradient title, glass inputs with icons, gradient CTA.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/LoginScreen.tsx mobile/src/screens/RegisterScreen.tsx mobile/src/screens/ForgotPasswordScreen.tsx mobile/src/screens/ResetPasswordScreen.tsx
git commit -m "feat(auth): aurora bg, gradient title, glass inputs, gradient CTA"
```

---

### Task 12: `WeekDetailScreen` — hero card with compact fetus visualizer

**Files:**
- Modify: `mobile/src/screens/WeekDetailScreen.tsx`

- [ ] **Step 1: Inspect layout**

Run: `grep -n "FetusVisualizer\|hero\|GlassCard" mobile/src/screens/WeekDetailScreen.tsx`

- [ ] **Step 2: Wrap fetus visualizer in hero `GlassCard elevated`**

At the top of the screen content, replace/wrap the existing fetus area with:

```typescript
<GlassCard elevated style={s.heroCard}>
  <FetusVisualizerCompact week={week} sizeMm={sizeMm} weightG={weightG} trimester={trimester} />
</GlassCard>
```

Add style: `heroCard: { padding: theme.spacing.md, marginBottom: theme.spacing.md, overflow: 'hidden' }`. Imports: `GlassCard`, `FetusVisualizerCompact` (if not already).

- [ ] **Step 3: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/WeekDetailScreen.tsx
git commit -m "feat(week-detail): hero card with compact fetus visualizer"
```

---

### Task 13: `PlanningScreen` + `BirthPrepScreen` — NeonCheckbox

**Files:**
- Modify: `mobile/src/screens/PlanningScreen.tsx`
- Modify: `mobile/src/screens/BirthPrepScreen.tsx`

- [ ] **Step 1: Replace checkboxes in PlanningScreen**

Find any checkbox-like `<TouchableOpacity>` with an icon or square — the element that toggles a planning-item `done` state. Replace with:

```typescript
<NeonCheckbox checked={item.done} onPress={() => toggle(item.id)} />
```

Import: `import NeonCheckbox from '../components/ui/NeonCheckbox';`.

- [ ] **Step 2: Replace checkboxes in BirthPrepScreen (torba)**

Same pattern — the bag-item checkbox.

- [ ] **Step 3: Add ProgressRing to BirthPrep hero**

Locate the header/summary section. Add:

```typescript
<GlassCard elevated style={s.progressHero}>
  <ProgressRing value={percentPacked} size={80} stroke={7}>
    <Text style={s.progressText}>{percentPacked}%</Text>
  </ProgressRing>
  <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
    <Text style={s.progressTitle}>Torba na porodówkę</Text>
    <Text style={s.progressSub}>{packedCount} z {totalCount} spakowane</Text>
  </View>
</GlassCard>
```

Imports: `ProgressRing`, `GlassCard`.
Styles:

```typescript
progressHero: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, marginBottom: theme.spacing.md },
progressText: { fontFamily: 'ClimateCrisis', fontSize: 16, color: theme.colors.text },
progressTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: theme.fontSize.lg, color: theme.colors.text },
progressSub: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
```

Derive `percentPacked`, `packedCount`, `totalCount` from existing state (whatever list drives the bag). If those variables don't exist yet, compute inline: `const totalCount = items.length; const packedCount = items.filter(i => i.done).length; const percentPacked = totalCount ? Math.round((packedCount/totalCount)*100) : 0;`.

- [ ] **Step 4: Type-check + visual check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors. Visually verify checkboxes and ring render.

```bash
git add mobile/src/screens/PlanningScreen.tsx mobile/src/screens/BirthPrepScreen.tsx
git commit -m "feat(planning,birth-prep): NeonCheckbox + BirthPrep ProgressRing hero"
```

---

## Phase 3 — Content screens

### Task 14: `ActionCardsScreen` — left-accent cards + uppercase tags

**Files:**
- Modify: `mobile/src/screens/ActionCardsScreen.tsx`

- [ ] **Step 1: Replace card wrapper with `GlassCard accent`**

Find the card component/JSX for each action card. Wrap with `<GlassCard accent={index % 2 === 0 ? 'cyan' : 'violet'} style={s.card}>...</GlassCard>`. Pass the variant based on any existing category field if present, otherwise alternate.

- [ ] **Step 2: Uppercase tag chip styling**

For the tag `<Text>` element on each card, set style:

```typescript
tag: {
  fontFamily: 'SpaceGrotesk_600SemiBold',
  fontSize: 10,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: theme.colors.primary,
},
```

- [ ] **Step 3: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/ActionCardsScreen.tsx
git commit -m "feat(action-cards): accent border-left + uppercase tags"
```

---

### Task 15: `CheckupsScreen` — timeline + upcoming alert

**Files:**
- Modify: `mobile/src/screens/CheckupsScreen.tsx`

- [ ] **Step 1: Inspect current layout**

Run: `grep -n "GlassCard\|upcoming\|item\|visit" mobile/src/screens/CheckupsScreen.tsx | head -30`

- [ ] **Step 2: Upcoming card — cyan accent**

Locate the "upcoming / najbliższa wizyta" card. Wrap/replace with `<GlassCard accent="cyan" elevated style={s.upcomingCard}>`.

- [ ] **Step 3: Timeline entries**

For each past/future visit item: render a row with a left column containing a 10px circle (dot) + vertical connector line, and a right column with `GlassCard`. Add styles:

```typescript
timelineRow: { flexDirection: 'row', alignItems: 'stretch', marginBottom: theme.spacing.md },
timelineCol: { width: 24, alignItems: 'center' },
timelineDot: {
  width: 10, height: 10, borderRadius: 5,
  backgroundColor: theme.colors.primary, marginTop: 10,
  shadowColor: theme.colors.primary, shadowOpacity: 0.6, shadowRadius: 6,
},
timelineLine: { flex: 1, width: 2, backgroundColor: theme.colors.cardBorder, marginTop: 4 },
timelineContent: { flex: 1, marginLeft: theme.spacing.sm },
```

JSX pattern per item:

```typescript
<View style={s.timelineRow}>
  <View style={s.timelineCol}>
    <View style={s.timelineDot} />
    {!isLast && <View style={s.timelineLine} />}
  </View>
  <View style={s.timelineContent}>
    <GlassCard style={{ padding: theme.spacing.md }}>
      {/* date, title, notes */}
    </GlassCard>
  </View>
</View>
```

- [ ] **Step 4: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/CheckupsScreen.tsx
git commit -m "feat(checkups): timeline layout + cyan accent upcoming card"
```

---

### Task 16: `BadgesScreen` — 2-col grid + glow / locked states

**Files:**
- Modify: `mobile/src/screens/BadgesScreen.tsx`

- [ ] **Step 1: 2-column grid container**

Convert the list into a row/wrap container:

```typescript
<View style={s.grid}>
  {badges.map(b => <BadgeTile key={b.id} badge={b} />)}
</View>
```

Styles:

```typescript
grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
tile: { width: '48%' },  // with gap=8 rows wrap naturally
```

- [ ] **Step 2: Unlocked glow + locked grayscale**

Inside each badge tile (keep existing inline or extract small inline component):

```typescript
<GlassCard
  style={[
    s.tile,
    { padding: theme.spacing.md, alignItems: 'center' },
    badge.unlocked && {
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5,
    },
    !badge.unlocked && { opacity: 0.55 },
  ]}
>
  {badge.unlocked ? (
    <Text style={s.badgeEmoji}>{badge.emoji}</Text>
  ) : (
    <Icon name="lock" size={28} color={theme.colors.textMuted} />
  )}
  <Text style={s.badgeName}>{badge.name}</Text>
  {!badge.unlocked && (
    <View style={s.progressWrap}>
      <GradientProgressBar value={badge.progress ?? 0} height={4} />
    </View>
  )}
</GlassCard>
```

Styles:

```typescript
badgeEmoji: { fontSize: 40, marginBottom: 8 },
badgeName: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: theme.fontSize.sm, color: theme.colors.text, textAlign: 'center' },
progressWrap: { marginTop: 6, width: '100%' },
```

If the existing badge type doesn't have `progress`, use `0` — don't add new fields.

- [ ] **Step 3: Hero card — violet aurora blob + GlowPill**

Above the grid add:

```typescript
<GlassCard elevated style={s.hero}>
  <View style={s.heroBlob} pointerEvents="none" />
  <GlowPill>Poziom {level}</GlowPill>
  <Text style={s.heroTitle}>Twoje odznaki</Text>
  <Text style={s.heroSub}>{unlockedCount} z {totalCount} zdobytych</Text>
</GlassCard>
```

Import `GlowPill` from `../components/ui/GlowPill`. Derive counts from the existing badges array: `const unlockedCount = badges.filter(b=>b.unlocked).length; const totalCount = badges.length; const level = Math.floor(unlockedCount/3)+1;`.

Styles:

```typescript
hero: { padding: theme.spacing.lg, marginBottom: theme.spacing.md, overflow: 'hidden' },
heroBlob: {
  position: 'absolute', width: 220, height: 220, borderRadius: 110,
  top: -80, right: -60,
  backgroundColor: theme.colors.violetSoft, opacity: 0.6,
},
heroTitle: { fontFamily: 'ClimateCrisis', fontSize: theme.fontSize.xl, color: theme.colors.text, marginTop: 8 },
heroSub: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
```

- [ ] **Step 4: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/BadgesScreen.tsx
git commit -m "feat(badges): 2-col grid, unlocked neon glow, locked lock icon + progress"
```

---

### Task 17: `JournalScreen` — card refinements

**Files:**
- Modify: `mobile/src/screens/journal/JournalScreen.tsx`

- [ ] **Step 1: Card layout**

For each journal entry card:

- Top row: date (mono) | separator | title (semibold).
- Tag chip: rounded pill, border, primary color.
- Photo placeholders: if entry has photos, render up to 3 thumbnails at 56×56 with 8px gap; otherwise omit.

Replace the existing entry card body:

```typescript
<GlassCard style={s.entry}>
  <View style={s.entryHead}>
    <Text style={s.entryDate}>{formatDate(entry.date)}</Text>
    <Text style={s.entrySep}>·</Text>
    <Text style={s.entryTitle} numberOfLines={1}>{entry.title}</Text>
  </View>
  {entry.tag ? <Text style={s.entryTag}>{entry.tag}</Text> : null}
  {entry.photos?.length ? (
    <View style={s.photoRow}>
      {entry.photos.slice(0, 3).map((uri, i) => (
        <View key={i} style={s.photoThumb}>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      ))}
    </View>
  ) : null}
  {entry.preview ? <Text style={s.entryPreview} numberOfLines={2}>{entry.preview}</Text> : null}
</GlassCard>
```

Styles:

```typescript
entry: { padding: theme.spacing.md, marginBottom: theme.spacing.sm },
entryHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
entryDate: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: theme.fontSize.xs, color: theme.colors.textMuted, letterSpacing: 0.5 },
entrySep: { color: theme.colors.textMuted },
entryTitle: { flex: 1, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: theme.fontSize.md, color: theme.colors.text },
entryTag: {
  alignSelf: 'flex-start', marginTop: 6,
  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  borderWidth: 1, borderColor: theme.colors.primary,
  color: theme.colors.primary, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
  fontFamily: 'SpaceGrotesk_600SemiBold',
},
photoRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
photoThumb: { width: 56, height: 56, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface, overflow: 'hidden' },
entryPreview: { marginTop: 8, fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
```

If any of `entry.tag`, `entry.photos`, `entry.preview` fields don't exist on the current `JournalEntry` type, remove the corresponding block — don't add fields to the type.

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/journal/JournalScreen.tsx
git commit -m "feat(journal): refined entry card with tag chip + photo row"
```

---

### Task 18: `DadModuleScreen` + sub-screens — accent sections + hero tip

**Files:**
- Modify: `mobile/src/screens/DadModuleScreen.tsx`
- Modify: `mobile/src/screens/DadNoworodekScreen.tsx`
- Modify: `mobile/src/screens/DadPologScreen.tsx`
- Modify: `mobile/src/screens/DadRelacjaScreen.tsx`

- [ ] **Step 1: DadModuleScreen — hero tip**

At top of screen, add:

```typescript
<GlassCard elevated style={s.tipCard}>
  <GlowPill>Wskazówka dnia</GlowPill>
  <Text style={s.tipText}>{dailyTip}</Text>
</GlassCard>
```

`dailyTip` — use an existing const if present, otherwise a static string `"Spędź dziś 15 minut sam na sam z partnerką bez telefonów."`.

Styles:

```typescript
tipCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.md },
tipText: { marginTop: 8, fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.md, color: theme.colors.text, lineHeight: 22 },
```

- [ ] **Step 2: Section cards with accents**

For the three section entries (Noworodek, Połóg, Relacja), wrap each with `<GlassCard accent="cyan">` (or `violet` alternately — Noworodek: cyan, Połóg: violet, Relacja: cyan). Keep the existing emoji icon at 48px (style: `fontSize: 48`).

- [ ] **Step 3: ArticleCard pattern in sub-screens**

In `DadNoworodekScreen`, `DadPologScreen`, `DadRelacjaScreen`, for each article/entry render:

```typescript
<GlassCard style={s.articleCard}>
  <View style={s.articleHead}>
    <Text style={s.articleTag}>{tag}</Text>
    <Text style={s.articleTime}>{readMinutes} MIN</Text>
  </View>
  <Text style={s.articleTitle}>{title}</Text>
  {preview ? <Text style={s.articlePreview} numberOfLines={2}>{preview}</Text> : null}
</GlassCard>
```

Styles:

```typescript
articleCard: { padding: theme.spacing.md, marginBottom: theme.spacing.sm },
articleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
articleTag: {
  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  borderWidth: 1, borderColor: theme.colors.primary, color: theme.colors.primary,
  fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'SpaceGrotesk_600SemiBold',
},
articleTime: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 10, color: theme.colors.textMuted, letterSpacing: 1 },
articleTitle: { marginTop: 8, fontFamily: 'SpaceGrotesk_700Bold', fontSize: theme.fontSize.lg, color: theme.colors.text },
articlePreview: { marginTop: 4, fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
```

Only render `articleTag` / `articleTime` if those fields exist on the current article type; otherwise omit.

- [ ] **Step 4: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/DadModuleScreen.tsx mobile/src/screens/DadNoworodekScreen.tsx mobile/src/screens/DadPologScreen.tsx mobile/src/screens/DadRelacjaScreen.tsx
git commit -m "feat(dad): hero tip, accent sections, article cards"
```

---

### Task 19: `SettingsScreen` + `NotificationSettingsScreen` — profile hero + toggles

**Files:**
- Modify: `mobile/src/screens/SettingsScreen.tsx`
- Modify: `mobile/src/screens/NotificationSettingsScreen.tsx`

- [ ] **Step 1: Settings profile hero**

Above existing sections:

```typescript
<GlassCard elevated style={s.profileHero}>
  <View style={s.avatar}>
    <Text style={s.avatarInitial}>{initial}</Text>
  </View>
  <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
    <Text style={s.profileName}>{displayName ?? 'Tata'}</Text>
    <Text style={s.profileEmail}>{email ?? ''}</Text>
  </View>
</GlassCard>
```

`displayName`, `email`, `initial` — read from existing auth/user context (whatever the file already imports). If unavailable, fall back to `'Tata'` / `''` / `'T'`.

Styles:

```typescript
profileHero: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, marginBottom: theme.spacing.md },
avatar: {
  width: 56, height: 56, borderRadius: 28,
  backgroundColor: theme.colors.primaryLight,
  justifyContent: 'center', alignItems: 'center',
  borderWidth: 1, borderColor: theme.colors.primary,
},
avatarInitial: { fontFamily: 'ClimateCrisis', fontSize: 22, color: theme.colors.primary },
profileName: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: theme.fontSize.lg, color: theme.colors.text },
profileEmail: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
```

- [ ] **Step 2: Group setting rows in `GlassCard`**

Wrap existing settings rows (theme, language, etc.) in `<GlassCard style={s.group}>` groups. If there are multiple groups, separate them with `marginBottom: theme.spacing.md`.

Style: `group: { paddingVertical: 6, marginBottom: theme.spacing.md }`.

- [ ] **Step 3: NotificationSettingsScreen — group toggles**

Similarly wrap each toggle row in a grouped `GlassCard`. For toggles that are enabled, the native `Switch` uses `trackColor` — set `trackColor={{ false: theme.colors.cardBorder, true: theme.colors.primary }}` and `thumbColor={theme.colors.white}` on each `<Switch>`. Add subtext `<Text style={s.toggleSub}>` beneath each toggle label where not already present.

Style: `toggleSub: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }`.

- [ ] **Step 4: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/SettingsScreen.tsx mobile/src/screens/NotificationSettingsScreen.tsx
git commit -m "feat(settings): profile hero, grouped glass cards, tuned switches"
```

---

### Task 20: `FourthTrimesterScreen` — ProgressRing + emoji list

**Files:**
- Modify: `mobile/src/screens/FourthTrimesterScreen.tsx`

- [ ] **Step 1: Add ProgressRing hero**

At the top of screen content:

```typescript
<GlassCard elevated style={s.hero}>
  <ProgressRing value={weekProgress} size={80} stroke={7}>
    <Text style={s.ringText}>{currentWeek}</Text>
  </ProgressRing>
  <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
    <Text style={s.heroTitle}>Czwarty trymestr</Text>
    <Text style={s.heroSub}>Tydzień {currentWeek} z 12</Text>
  </View>
</GlassCard>
```

`currentWeek`: if present in existing state, use it; else default to `1`. `weekProgress = (currentWeek/12)*100`.

Styles:

```typescript
hero: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, marginBottom: theme.spacing.md },
ringText: { fontFamily: 'ClimateCrisis', fontSize: 22, color: theme.colors.text },
heroTitle: { fontFamily: 'ClimateCrisis', fontSize: theme.fontSize.xl, color: theme.colors.text },
heroSub: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
```

- [ ] **Step 2: Topic rows with emoji**

For each topic row: render emoji at `fontSize: 28` on the left, title + preview on the right, wrapped in `GlassCard` with `padding: theme.spacing.md, marginBottom: theme.spacing.sm`.

- [ ] **Step 3: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/FourthTrimesterScreen.tsx
git commit -m "feat(4th-trimester): ProgressRing hero + emoji topic rows"
```

---

### Task 21: `PostBirthScreen` — timeline steps

**Files:**
- Modify: `mobile/src/screens/PostBirthScreen.tsx`

- [ ] **Step 1: Timeline layout**

Render each step as a row with:

- Left column (24px): step circle + connector line.
- Done: gradient circle (cyan→violet) with check icon.
- Active: transparent circle with cyan border + inner cyan dot.
- Future: muted border, no fill.
- Right column: `GlassCard` with title; if done, `textDecorationLine: 'line-through'` on the title and `color: theme.colors.textMuted`.

JSX:

```typescript
<View style={s.step}>
  <View style={s.stepCol}>
    {step.state === 'done' ? (
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.violet]}
        style={s.circleBase}
        start={{x:0,y:0}} end={{x:1,y:1}}
      >
        <Icon name="check" size={12} color={theme.colors.black} />
      </LinearGradient>
    ) : step.state === 'active' ? (
      <View style={[s.circleBase, s.circleActive]}>
        <View style={s.activeDot} />
      </View>
    ) : (
      <View style={[s.circleBase, s.circleFuture]} />
    )}
    {!isLast && <View style={s.connector} />}
  </View>
  <GlassCard style={s.stepCard}>
    <Text style={[s.stepTitle, step.state === 'done' && s.stepDoneText]}>{step.title}</Text>
    {step.desc ? <Text style={s.stepDesc}>{step.desc}</Text> : null}
  </GlassCard>
</View>
```

Styles:

```typescript
step: { flexDirection: 'row', alignItems: 'stretch', marginBottom: theme.spacing.md },
stepCol: { width: 24, alignItems: 'center' },
circleBase: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
circleActive: { borderWidth: 2, borderColor: theme.colors.primary },
activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
circleFuture: { borderWidth: 2, borderColor: theme.colors.cardBorder },
connector: { flex: 1, width: 2, backgroundColor: theme.colors.cardBorder, marginTop: 4 },
stepCard: { flex: 1, marginLeft: theme.spacing.sm, padding: theme.spacing.md },
stepTitle: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: theme.fontSize.md, color: theme.colors.text },
stepDoneText: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
stepDesc: { marginTop: 4, fontFamily: 'SpaceGrotesk_400Regular', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
```

Read `steps` from existing state. If steps don't have a `state` field, derive: first unfinished = `'active'`, previous = `'done'`, rest = `'future'`. `isLast = index === steps.length - 1`.

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/PostBirthScreen.tsx
git commit -m "feat(post-birth): timeline layout with done/active/future states"
```

---

### Task 22: `FirstYearHomeScreen` — 4×3 months grid

**Files:**
- Modify: `mobile/src/screens/first-year/FirstYearHomeScreen.tsx`

- [ ] **Step 1: Grid layout**

Replace current month list with a 4×3 grid. Render 12 tiles:

```typescript
<View style={s.grid}>
  {Array.from({ length: 12 }).map((_, i) => {
    const month = i + 1;
    const isActive = month === currentMonth;
    const isDone = month < currentMonth;
    return (
      <TouchableOpacity key={month} onPress={() => onOpenMonth(month)} style={s.tileWrap}>
        <GlassCard
          style={[
            s.tile,
            isActive && {
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
              elevation: 5,
            },
            isDone && { opacity: 0.75 },
          ]}
        >
          <Text style={[s.tileNum, isActive && { color: theme.colors.primary }]}>{month}</Text>
          <Text style={s.tileLbl}>mies.</Text>
        </GlassCard>
      </TouchableOpacity>
    );
  })}
</View>
```

Styles:

```typescript
grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
tileWrap: { width: '23%' },
tile: { aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
tileNum: { fontFamily: 'ClimateCrisis', fontSize: 26, color: theme.colors.text },
tileLbl: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 10, color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
```

`currentMonth`, `onOpenMonth` — use whatever the file already has (existing nav callback / state). If absent: `const currentMonth = 1; const onOpenMonth = (m: number) => navigation.navigate('FirstYearMonth', { month: m });`.

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/first-year/FirstYearHomeScreen.tsx
git commit -m "feat(first-year): 4×3 month grid with active glow"
```

---

### Task 23: `NameDrawScreen` — featured card + heart toggle

**Files:**
- Modify: `mobile/src/screens/NameDrawScreen.tsx`

- [ ] **Step 1: Featured card with violet blob**

Add at the top of the content:

```typescript
<GlassCard elevated style={s.featured}>
  <View style={s.featuredBlob} pointerEvents="none" />
  <GlowPill>Wylosowane</GlowPill>
  <Text style={s.featuredName}>{currentName ?? '—'}</Text>
  <TouchableOpacity onPress={onToggleFav} style={s.heartBtn}>
    <Icon name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? theme.colors.primary : theme.colors.textMuted} />
  </TouchableOpacity>
</GlassCard>
```

Styles:

```typescript
featured: { padding: theme.spacing.lg, marginBottom: theme.spacing.md, overflow: 'hidden' },
featuredBlob: {
  position: 'absolute', width: 220, height: 220, borderRadius: 110,
  top: -80, right: -60,
  backgroundColor: theme.colors.violetSoft, opacity: 0.6,
},
featuredName: { fontFamily: 'ClimateCrisis', fontSize: theme.fontSize.xxl, color: theme.colors.text, marginTop: 8 },
heartBtn: { position: 'absolute', top: theme.spacing.md, right: theme.spacing.md },
```

`currentName`, `isFav`, `onToggleFav` — use whatever's already wired in the screen for the drawn name + favorites; fall back to the existing `useNameDraw` hook output if present.

If `Icon` doesn't support `heart-outline`, pass the same `heart` name but toggle the color only.

- [ ] **Step 2: Type-check + commit**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

```bash
git add mobile/src/screens/NameDrawScreen.tsx
git commit -m "feat(name-draw): featured card with violet blob + heart toggle"
```

---

## Phase 4 — Verification

### Task 24: Full type-check + smoke test

**Files:** (none — verification only)

- [ ] **Step 1: Full type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors. If any, fix the reported file+line directly and re-run.

- [ ] **Step 2: Run tests**

Run: `cd mobile && npm test -- --watchAll=false`
Expected: all pass. Fix regressions.

- [ ] **Step 3: Manual smoke — start expo and walk the app**

Run: `cd mobile && npx expo start`

In the simulator, open in order:
- Login → aurora blobs, gradient title, glass inputs, gradient CTA visible.
- Register → same.
- Forgot/Reset → same + lock icon on Forgot.
- Home → week number 36pt, gradient-glow progress bar, notif card cyan accent.
- Week detail → compact fetus in hero card, no image overflow.
- Action Cards → accent border-left on cards, uppercase tags.
- Checkups → timeline with dots + connector, cyan-accent upcoming card.
- Planning → neon gradient checkboxes.
- Birth Prep → ProgressRing hero, neon checkboxes.
- Badges → 2-col grid, unlocked glow, locked lock icon + progress bar.
- Journal → date · title, tag chip, photo row (if photos).
- Dad Module → hero tip with GlowPill, accent section cards.
- Settings → profile hero with avatar, grouped cards.
- Notif settings → toggles with cyan track.
- Fourth trimester → ProgressRing + emoji topic rows.
- Post-birth → timeline with done/active/future.
- First year → 4×3 grid, active month glow.
- Name draw → featured card with violet blob + heart toggle.

Kill server when done.

- [ ] **Step 4: Final commit if any small fixes were needed**

```bash
git status
# if dirty:
git add -A
git commit -m "chore(ui): final smoke-test fixups"
```

---

## Notes / Conventions

- Every new style uses `createStyles(theme: Theme)` pattern and is memoized via `useMemo` — follow the existing screen's convention.
- All colors come from `theme.colors.*`. No raw hex literals except inside the new primitives where gradient stops intentionally use theme values (see `ProgressRing`).
- Do **not** introduce `as any`. If TypeScript complains about unknown fields (e.g., `entry.tag`), remove the corresponding JSX block instead of widening types.
- Keep backwards-compatibility: new props on existing components are all optional.
- No new `.md` docs, no README updates — this plan is the documentation.
