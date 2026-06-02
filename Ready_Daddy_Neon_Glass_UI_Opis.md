# Ready Daddy — Neon Glass UI · Opis wdrożenia dla Claude Code

> **Źródło:** prototyp HTML/React `Ready_Daddy_UI_-_standalone__1_.html` (Claude Design Canvas, 29 ekranów, 8 sekcji).
> **Wariant:** **PEŁEN BLUR z `expo-blur`** (świadoma decyzja Romka, trzecie podejście).
> **Cel dokumentu:** przekazać Claude Code kompletny plan wdrożenia tego UI w istniejącej aplikacji RN/Expo, ze świadomością ryzyka i z planem testów.

---

## ⚠️ READ FIRST — kontekst tej decyzji

Aurora Glass (gradient blobs + `rgba` cards) i Neon Glass (`BlurView`-based) były **dwa razy cofnięte**, oba z powodu problemów z renderowaniem `BlurView` na Androidzie (czarne tło zamiast blura, jank, niespójne wyniki na różnych Pixelach).

Romek wybrał wariant pełnego blura **świadomie** — co oznacza:
- **Faza 0 jest non-negotiable:** musi być spike test `<BlurView>` na minimum 2 urządzeniach, **przed** jakąkolwiek inną pracą. Bez zielonego światła z tego testu reszta nie ma sensu.
- **Feature flag obowiązkowy** — każda glass surface musi być przełączalna na fake-glass fallback bez przebudowy ekranów.
- **Każda nowa wersja `BlurView`-a w komponencie** musi być testowana na realnym urządzeniu, nie tylko emulatorze. Emulator kłamie przy blurze.

Jeśli Faza 0 padnie — nie ma sensu iść dalej z pełnym blurem; wracamy do fake-glass (opisanego jako Wariant B w sekcji 7).

---

## ⚠️ Inne rzeczy, które nie działają w RN out of the box

Nawet z `BlurView` zostają trzy rzeczy z prototypu, które wymagają portu ręcznego:

1. **`oklch()`** — RN nie wspiera. Wszystkie kolory już przeliczone na hex/rgba w sekcji [Tokeny](#tokeny).
2. **`color-mix(in oklch, ...)`** — w ogóle nie ma odpowiednika. Wyliczone statycznie w sekcji 4.5.
3. **Animowane SVG `<animate>`** w `BlobLoader` (organiczny morph) — `react-native-svg` tego nie umie. Strategia w sekcji 3.4.
4. **Fonty:** Climate Crisis i Space Grotesk są już w aplikacji. **JetBrains Mono trzeba dodać** (`@expo-google-fonts/jetbrains-mono`).
5. **PNG-i sylwetki płodu:** `FetusSilhouette` w `ScrFetusC` używa `assets/fetus/fetus_week_${weekStr}.png` — **istniejące w aplikacji** PNG-i, nie generujemy nowych.

---

## Spis treści

1. [Faza 0 — spike `BlurView` (NON-NEGOTIABLE)](#faza-0)
2. [Inwentarz ekranów (29 sztuk, 8 sekcji)](#inwentarz)
3. [Tokeny designu — paleta i typografia](#tokeny)
4. [Reużywalne komponenty (priorytet wdrożenia)](#komponenty)
5. [Strategia portowania glass i aurory do RN (z BlurView)](#strategia)
6. [Specyfikacja każdego ekranu](#ekrany)
7. [Plan wdrożenia w fazach](#plan)
8. [Wariant B — fallback do fake-glass (jeśli Faza 0 padnie)](#wariant-b)

---

<a id="faza-0"></a>
## 1. Faza 0 — spike `BlurView` (NON-NEGOTIABLE)

**Czas:** 2-3h. **Cel:** sprawdzić czy `<BlurView>` z `expo-blur` działa stabilnie na Androidzie w 2026 (nowsze API niż w poprzednich próbach).

### 1.1. Setup spike

- [ ] Stworzyć branch `spike/blur-view-test`
- [ ] Zainstalować `expo-blur` (najnowsza wersja kompatybilna z Expo 54)
- [ ] Stworzyć minimalny ekran testowy `BlurSpikeScreen.tsx` z 5 wariantami:
  1. `<BlurView intensity={20} tint="dark">` z prostą zawartością
  2. `<BlurView intensity={50} tint="dark">` z `experimentalBlurMethod="dimezisBlurView"`
  3. `<BlurView>` w pozycji `absolute` ponad gradientem
  4. `<BlurView>` jako tab bar bottom
  5. `<BlurView>` w komponencie scrollowanym (test janku przy scrollu)

### 1.2. Test matrix

Test **musi** odbyć się na minimum:
- [ ] Jeden Pixel (Pixel 6/7/8) — referencyjny dla expo-blur
- [ ] Jeden Samsung A-series lub starszy budżetowy Android — sprawdzenie czy działa na słabszym sprzęcie
- [ ] Jeden iOS (jeśli planowany) — tu zwykle nie ma problemu

### 1.3. Kryteria akceptacji (wszystkie muszą być spełnione)

- [ ] Blur renderuje się poprawnie (nie czarny prostokąt) na wszystkich urządzeniach z matrycy
- [ ] Brak jank-u przy scrollu pod surface'ami z blurem (60fps na Pixel, ≥45fps na Samsungu)
- [ ] Cold start nie wzrasta o więcej niż 200ms vs branch master
- [ ] Bundle size nie wzrasta o więcej niż 500KB

### 1.4. Decyzja

- ✅ **PASS** — zielone światło na pełen blur, dalej Faza 1+
- ❌ **FAIL** — przełączamy się na Wariant B (fake-glass), patrz sekcja 8. Nie traktujemy tego jako porażkę, tylko jako informację z testu.

**Output Fazy 0:** krótkie podsumowanie w Notion (osobna strona w bazie wiedzy: "Faza 0 — BlurView spike test") z screenshot-ami z urządzeń testowych. Bez tego nie ruszamy dalej.

---

<a id="inwentarz"></a>
## 2. Inwentarz ekranów

| Sekcja | Ekran | Komponent | Tab aktywny |
|---|---|---|---|
| **Auth** | Login | `ScrLogin` | — |
| | Rejestracja | `ScrRegister` | — |
| | Zapomniałem hasła | `ScrForgotPassword` | — |
| | Nowe hasło | `ScrResetPassword` | — |
| **Intro / Home** | Onboarding | `ScrOnboarding` | — |
| | Home | `ScrHome` | `home` |
| **Wizualizer płodu** | Rozwój płodu (Wariant C — z PNG sylwetką) | `ScrFetusC` | `dna` |
| | Week Detail | `ScrWeekDetail` | `dna` |
| **Główne ekrany** | Co robić teraz | `ScrActionCards` | `home` |
| | Dodaj wizytę | `ScrAddVisit` | — |
| | Badania | `ScrCheckups` | `list` |
| | Planowanie | `ScrPlanning` | `list` |
| | Imiona | `ScrNameDraw` | `home` |
| | Ustawienia | `ScrSettings` | `user` |
| | Powiadomienia | `ScrNotificationSettings` | `user` |
| **Checklisty / Dziennik** | Torba na poród | `ScrBag` | `list` |
| | Dziennik | `ScrJournal` | `book` |
| | Wpis szczegółowy | `ScrJournalEntry` | `book` |
| | Nowy wpis | `ScrAddEntry` | — |
| **Moduł Taty** | Menu modułu | `ScrDadModule` | `home` |
| | Noworodek | `ScrDadNoworodek` | `home` |
| | Połóg | `ScrDadPolog` | `home` |
| | Relacja | `ScrDadRelacja` | `home` |
| **Po porodzie** | Co teraz (timeline) | `ScrPostBirth` | `home` |
| | 4. trymestr | `ScrFourthTrimester` | `home` |
| | Pierwszy rok (siatka 4×3) | `ScrFirstYearHome` | `home` |
| | Miesiąc 4 | `ScrMonth` | `home` |
| **Gamifikacja** | Odznaki | `ScrBadges` | `user` |
| | Loader / Sync | `ScrLoader` | — |

**TabBar (5 itemów):**
- `home` — ikona `home`, label "Start"
- `dna` — ikona `dna`, label "Rozwój"
- `list` — ikona `list`, label "Plan"
- `book` — ikona `book`, label "Dziennik"
- `user` — ikona `user`, label "Ja"

---

<a id="tokeny"></a>
## 3. Tokeny designu

### 3.1. Paleta — DARK (domyślna)

```ts
// PRZELICZONE z oklch() do hex/rgba — używać tych wartości w theme.ts
const darkTokens = {
  // Tła
  bg:           '#0B1512',          // główne tło aplikacji
  bg2:          '#0E1A17',          // surface base (pod aurorą)

  // Glass surfaces (rgba — pod BlurView)
  surface:      'rgba(255,255,255,0.04)',
  surfaceHi:    'rgba(255,255,255,0.07)',
  border:       'rgba(255,255,255,0.08)',
  borderHi:     'rgba(255,255,255,0.14)',

  // Tekst
  text:         '#E8F4F1',
  textDim:      'rgba(232,244,241,0.62)',
  textMute:     'rgba(232,244,241,0.38)',

  // Akcenty (oklch → hex, weryfikowane wizualnie)
  cyan:         '#4DD9C0',          // oklch(0.82 0.16 210)  — neon mint/cyan
  cyanSoft:     'rgba(77,217,192,0.22)',
  violet:       '#9B7FD4',          // oklch(0.68 0.18 290)  — soft violet
  violetSoft:   'rgba(155,127,212,0.22)',
  danger:       '#E58B6B',          // oklch(0.7 0.17 25)

  // Stałe gradientowe
  gradCta:      ['#4DD9C0', '#9B7FD4'],         // CTA + progress
  gradAuroraCyan:   ['rgba(77,217,192,0.55)', 'transparent'],
  gradAuroraViolet: ['rgba(155,127,212,0.55)', 'transparent'],
};
```

### 3.2. Paleta — LIGHT (drugi motyw)

```ts
const lightTokens = {
  bg:           '#EEF3F1',
  bg2:          '#E4ECE9',
  surface:      'rgba(255,255,255,0.6)',
  surfaceHi:    'rgba(255,255,255,0.8)',
  border:       'rgba(15,35,30,0.08)',
  borderHi:     'rgba(15,35,30,0.16)',
  text:         '#0B1512',
  textDim:      'rgba(11,21,18,0.62)',
  textMute:     'rgba(11,21,18,0.42)',
  cyan:         '#2A8C7E',          // oklch(0.55 0.14 210)
  cyanSoft:     'rgba(42,140,126,0.18)',
  violet:       '#5E4490',          // oklch(0.5 0.18 290)
  violetSoft:   'rgba(94,68,144,0.18)',
};
```

### 3.3. Typografia

```ts
fontFamily: {
  display:  'ClimateCrisis',          // już w aplikacji, fontVariationSettings dla wagi
  ui:       'SpaceGrotesk_400Regular' // i pozostałe wagi: 500, 600, 700
  uiBold:   'SpaceGrotesk_700Bold',
  mono:     'JetBrainsMono_400Regular' // ⚠️ DODAĆ przez @expo-google-fonts/jetbrains-mono
}

// Klasy w prototypie:
// .rd-display  → ClimateCrisis, letterSpacing: -0.01em
// .rd-ui       → SpaceGrotesk
// .rd-mono     → JetBrains Mono, fontFeatureSettings: 'tnum' (tabular nums)

fontSize: {
  // Display (ClimateCrisis)
  hero:     52,    // okładka kierunku projektu
  h1:       36,    // hero week number, names, "Zostań gotowym tatą"
  h2:       28,    // tytuły ekranów typu "Wróciłeś"
  h3:       24,    // sekcyjne nagłówki, "Co teraz?"
  h4:       22,    // "Mango", journal entry titles
  h5:       20,    // standardowe tytuły ekranów

  // UI (Space Grotesk)
  bodyLg:   15,    // labele primary
  body:     13,    // standardowy tekst
  bodySm:   12,    // sub-labele
  caption:  11,    // chip text, glow pill content
  micro:    10,    // section labels, "TYDZ"

  // Mono (JetBrains Mono)
  mono:      11,   // dane liczbowe inline
  monoMicro:  9,   // ekstra male labele typu "MAR"
}

letterSpacing: {
  display: -0.01, // np. -0.01em
  bodyTight: -0.01,
  uppercase: 0.14, // np. labele sekcji "OSTATNIA ODZNAKA"
  mono: 0.18,      // header status tekst
}
```

### 3.4. Spacing & Radius

```ts
spacing:    { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 28 }
borderRadius: {
  sm:    8,
  md:   10,
  lg:   12,
  xl:   14,    // CTA buttons
  xxl:  16,
  glass: 20,   // standardowy radius .rd-glass
  pill: 999,
}
```

### 3.5. Shadows / Glows

```ts
// Tylko CTA i lokalne akcenty - nie spamować na każdej karcie
shadow: {
  cta:   { shadowColor: '#4DD9C0', shadowOpacity: 0.30, shadowRadius: 28, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  glowCyan:   { shadowColor: '#4DD9C0', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  glowViolet: { shadowColor: '#9B7FD4', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
}
```

---

<a id="komponenty"></a>
## 4. Reużywalne komponenty (priorytet wdrożenia)

### 4.1. `<GlassCard>` — fundament wszystkich kart, **z `BlurView`**

```tsx
// src/components/glass/GlassCard.tsx
import { View, ViewProps, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { useGlassFeatureFlag } from '@/hooks/useGlassFeatureFlag'; // patrz 4.2

interface GlassCardProps extends ViewProps {
  variant?: 'default' | 'hi';
  accentBorderColor?: string;     // np. theme.colors.cyan dla notification cards z borderLeft
  blurIntensity?: number;         // domyślnie 20 dla default, 30 dla hi
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  accentBorderColor,
  blurIntensity,
  style,
  children,
  ...rest
}) => {
  const theme = useTheme();
  const useBlur = useGlassFeatureFlag(); // false → fallback do rgba-only
  const intensity = blurIntensity ?? (variant === 'hi' ? 30 : 20);
  const styles = createStyles(theme, variant, accentBorderColor);

  if (!useBlur) {
    // FALLBACK do fake-glass (rgba + gradient border) - jak w wariancie B
    return (
      <View style={[styles.fakeGlass, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.outer, style]} {...rest}>
      <BlurView
        intensity={intensity}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.06)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inner}>{children}</View>
      </LinearGradient>
    </View>
  );
};
```

**Uwaga:** komponent **zawsze** ma branch fallback — to nie jest opcjonalne. Jeśli flaga się wyłączy, wszystko musi nadal działać.

### 4.2. Feature flag `useGlassFeatureFlag` — obowiązkowy

```ts
// src/hooks/useGlassFeatureFlag.ts
import { useFeatureFlags } from '@/store/featureFlags';

export const useGlassFeatureFlag = (): boolean => {
  const flags = useFeatureFlags();
  // Domyślnie true, ale możliwe wyłączenie per build albo per-user (np. w settings)
  return flags.glassUI ?? true;
};
```

Flaga musi być:
- Konfigurowalna przez plik (`config/featureFlags.ts`)
- Możliwa do podmienienia w runtime (np. przez `Settings` ekran z developer mode)
- Domyślnie `true` po Faza 0 PASS, `false` po FAIL

**Co jeszcze powinno respektować flagę:**
- `<GlassCard>` (główne)
- `<TabBar>` (BlurView jako tło)
- `<AuroraBackground>` (przy `false` może zostawić bloby ale bez dodatkowego blura overlay)

### 4.3. `<AuroraBackground>` — animowane tło ekranów

Bez `mix-blend-mode: screen` (RN nie wspiera). Statyczne `LinearGradient` + dwa pozycjonowane `View` z `opacity` i bardzo dużym `borderRadius`.

**Opcjonalnie (ale rekomendowane skoro idziemy w blur):** dodatkowy `<BlurView intensity={40}>` w pozycji absolute ponad blobami, żeby je dodatkowo rozmyć i osiągnąć efekt zbliżony do oryginalnego `filter: blur(60px)`.

```tsx
// src/components/glass/AuroraBackground.tsx
// 1. Bazowe tło: LinearGradient z trzech stopów (kierunek diag).
// 2. Dwa "blob" View:
//    - lewy-dolny:  width: 340, height: 340, borderRadius: 170,
//                   backgroundColor: theme.colors.cyanSoft, position: absolute
//                   top: -80, left: -60, opacity: 0.55
//    - prawy-górny: width: 420, height: 420, borderRadius: 210,
//                   backgroundColor: theme.colors.violetSoft, position: absolute
//                   bottom: -140, right: -100, opacity: 0.55
// 3. Animacja (opcjonalnie): Reanimated useAnimatedStyle z translateX/Y w pętli 18s
// 4. Jeśli useGlassFeatureFlag() === true:
//    - dodaj <BlurView intensity={40} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
//      ponad blobami (ale POD treścią ekranu)
```

### 4.4. `<RDIcon>` — system ikon (lucide-style outline, 24×24)

W prototypie zdefiniowano 24 ikony jako SVG paths bezpośrednio (`heart`, `bolt`, `calendar`, `baby`, `book`, `trophy`, `bell`, `check`, `chevronLeft`, `chevronRight`, `plus`, `home`, `dna`, `moon`, `gear`, `sparkle`, `ruler`, `weight`, `clock`, `drop`, `pin`, `camera`, `mic`, `list`, `user`, `search`, `more`, `lock`, `trending`).

**Najprościej:** użyć `lucide-react-native` — wszystkie te ikony tam są pod tymi samymi nazwami (z drobnymi różnicami: `bolt` → `Zap`, `chevronLeft/Right` → `ChevronLeft/Right` itp.). Stworzyć wrapper `<RDIcon name="..." size={20} color={...} strokeWidth={1.6} />` mapujący nazwy z prototypu na komponenty Lucide.

**Alternatywa:** żywcem przepisać paths z prototypu jako `react-native-svg` `<Path>` w komponencie `<RDIcon>`. Wszystkie 24 paths są w prototypie (plik `35b4414f-...`).

### 4.5. `<BlobLoader>` — animowany loader z numerem tygodnia

W prototypie używa SVG `<animate>` do morfowania path. **W RN to nie zadziała.**

**Strategia (akceptowany kompromis):**
- Statyczna sylwetka SVG (path z prototypu, weź pierwszy keyframe)
- Otoczyć `Animated.View` z Reanimated, zaaplikować `transform: [{ rotate }, { scale }]`
- Środek: `Text` z numerem tygodnia (np. `64`) w `ClimateCrisis`, plus drugi rotujący path z `react-native-svg` w odwrotnym kierunku (12s)
- `drop-shadow(0 0 30px var(--rd-cyan))` → `shadowColor: cyan, shadowRadius: 30, shadowOpacity: 1` na outer view
- Variantów potrzebnych: `size`, `label`, `sub`, `week`

### 4.6. `<FetusSilhouette>` — pulsująca sylwetka z PNG (Wariant C)

Używa **istniejących PNG-ów** `assets/fetus/fetus_week_${weekStr}.png`. Komponent:
- Aurora glow background (radial gradient via dwa absolutnie pozycjonowane `View`-y z opacity)
- Glass ring (cyrkularny `View` z border + box-shadow inset, ale `inset` nie ma w RN — pominąć lub użyć `react-native-shadow-2`)
- `<Image>` z PNG-iem płodu, z `filter: drop-shadow` zastąpionym przez `shadowColor`
- `<Animated.View>` z Reanimated dla pulsującego efektu (`scale 1.0 → 1.06 → 1.0`, `opacity 0.85 → 1 → 0.85`, 3.5s loop)

### 4.7. `<ProgressRing>` — okrągły progress

Czysty `react-native-svg`: dwa `<Circle>` (background border, foreground stroke) z `strokeDasharray` + `strokeDashoffset`. Linear gradient cyan→violet jako stroke przez `<Defs>` i `<LinearGradient>`. **Trzeba pamiętać o `transform="rotate(-90deg)"` (start od góry).** Glow przez `shadowColor` na otaczającym `View`.

### 4.8. `<RDInput>` — pole input

`<GlassCard>` wokół `<TextInput>`. Lewa ikona `<RDIcon>`, opcjonalna prawa ikona `eye` (toggle visibility) dla `type="password"`. Placeholder: `theme.colors.textMute`. Typed value: `theme.colors.text`.

### 4.9. `<TabBar>` — bottom navigation, **z `BlurView`**

5 itemów (home/dna/list/book/user). Tło: `<BlurView intensity={24} tint="dark">` + `borderTopWidth: 1, borderTopColor: theme.colors.border`. Aktywny item: ikona w cyjanie + `text-shadow` (w RN przez `textShadowColor/Offset/Radius`).

**Test:** TabBar to drugi po `<GlassCard>` najczęściej używany komponent z blurem. Jeśli on lagnie albo czarnieje, to widać natychmiast — wymaga osobnego testu wraz z `<GlassCard>` w Faza 0.

### 4.10. `<GlowPill>` — etykieta z neonową poświatą

Mały `<View>` z `borderRadius: 999`, `backgroundColor: cyanSoft`, `borderWidth: 1, borderColor: cyan@30%`, `shadowColor: cyan, shadowRadius: 24`. Tekst w środku: 11px uppercase, letterSpacing: 0.08em, color: cyan. Wariant `violet` zmienia kolor.

### 4.11. `<RDButton>` — CTA

`Pressable` + `LinearGradient` (gradCta: cyan→violet 135deg). Wnętrze:
- `paddingHorizontal: 22, paddingVertical: 14`
- `borderRadius: 14`
- `flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8`
- font: SpaceGrotesk 600, 15px
- color: `#051015` (ciemny tekst na neonowym tle)
- `shadowColor: cyan, shadowOpacity: 0.30, shadowRadius: 28, shadowOffset: { width: 0, height: 8 }`
- Pomijamy `::after` shimmer effect (kosmetyka, można dodać przez Reanimated później)

### 4.12. Pomocnicze (proste komponenty)

- **`<Chip>`** — `.rd-chip` w prototypie. Wariant `default` i `active`. Border + background z tokenów.
- **`<MetricCell>`** — używany w hero week card. Mała kafla z ikoną na górze, dużą liczbą (display) i jednostką + małym labelem na dole.
- **`<Stat>`** — pionowy label/value (uppercase label, value w 13px 600).
- **`<ArticleCard>`** — pozioma karta z chipem (tag), readTime mono, tytułem, preview.

---

<a id="strategia"></a>
## 5. Strategia portowania glass i aurory do RN (z BlurView)

### 5.1. `BlurView` recipe

```tsx
<View style={{ borderRadius: 20, overflow: 'hidden' }}>
  <BlurView
    intensity={20}
    tint="dark"
    experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
    style={StyleSheet.absoluteFillObject}
  />
  {/* gradient border + content */}
</View>
```

**Reguły:**
- Każda surface z blurem **musi** mieć `overflow: 'hidden'` na rodzicu — inaczej blur wycieka poza border-radius na Androidzie.
- `experimentalBlurMethod="dimezisBlurView"` jest non-negotiable na Androidzie (znacząco poprawia jakość renderingu).
- Intensywność: 20 dla zwykłych kart, 30 dla `glass-hi`, 24 dla TabBar, 40 dla aurora overlay.
- **Nie** zagnieżdżać `BlurView` w `BlurView` — efekty się nie sumują, a perf gwałtownie spada.

### 5.2. Aurora — kombinacja blob + BlurView overlay

`filter: blur(60px)` w prototypie odpowiada efektowi: bardzo duże, kolorowe, miękkie plamy w tle. W RN robimy to dwuetapowo:
- **Blob:** `<View>` z dużym `borderRadius` (połowa szerokości), `backgroundColor: rgba`, `opacity: 0.55`.
- **Blur overlay:** opcjonalny `<BlurView intensity={40}>` ponad blobami (pod treścią). Sprawia, że blob-y stają się fizycznie rozmyte, jak w originalu.

Stack dwóch–trzech blob-ów (różne kolory, różne pozycje, różne `opacity`) daje warstwowy efekt aurory. `mix-blend-mode: screen` po prostu **pomijamy** — w trybie dark RGB-owe sumowanie jasnych kolorów na ciemnym tle wygląda akceptowalnie.

### 5.3. Animacja BlobLoader (organic morph)

SVG `<animate>` morphing path **nie zadziała** w `react-native-svg`. Strategie (od najprostszej):

1. **Statyczny path + rotate + scale pulse** (rekomendowane na start). Wygląda 70% identycznie i działa.
2. **Reanimated + `withRepeat(withSequence(...))` interpolujące `d` przez `useDerivedValue`** — możliwe ale trzeba ręcznie interpolować segmenty path. Zostaw na drugą iterację.
3. Pomyśleć o Lottie (`lottie-react-native`) — eksport organicznego morphingu z After Effects/Rive. Najlepszy efekt, ale dodatkowy asset.

### 5.4. `oklch()` → hex/rgba (gotowe konwersje)

Wszystkie 4 oklch-e użyte w prototypie zostały już przeliczone w sekcji 3.1. **Nie używać dynamicznego `color-mix`** — przeliczać statycznie.

### 5.5. Wszystkie `color-mix` z prototypu i ich statyczne odpowiedniki

```ts
// color-mix(in oklch, cyan 30%, transparent)  → 'rgba(77,217,192,0.30)'
// color-mix(in oklch, cyan 40%, transparent)  → 'rgba(77,217,192,0.40)'
// color-mix(in oklch, cyan 50%, transparent)  → 'rgba(77,217,192,0.50)'
// color-mix(in oklch, cyan 12%, transparent)  → 'rgba(77,217,192,0.12)'
// color-mix(in oklch, cyan 18%, transparent)  → 'rgba(77,217,192,0.18)'
// color-mix(in oklch, violet 30%, transparent) → 'rgba(155,127,212,0.30)'
// color-mix(in oklch, violet 40%, transparent) → 'rgba(155,127,212,0.40)'
// color-mix(in oklch, violet 14%, transparent) → 'rgba(155,127,212,0.14)'
```

---

<a id="ekrany"></a>
## 6. Specyfikacja każdego ekranu

> Format: nazwa, layout w skrócie, dane mockowe, specjalne uwagi.

### 6.1. Auth

#### `ScrLogin`
Padding 28px 24px. Aurora-bloby (cyan top-left, violet bottom-right). Header: mono "READY DADDY · 1.0". Środek: `<BlobLoader size={140} label="Witaj z powrotem" />`. Dół: H2 "Wróciłeś.\nDobry ruch." (drugi wers gradient text), p subtitle, dwa `<RDInput>` (email + password), text-button "Zapomniałem hasła" (cyan), `<RDButton>` "Zaloguj się", separator "lub", footer "Pierwszy raz? Zarejestruj się".

#### `ScrRegister`
Header `<chevronLeft> REJESTRACJA` (mono). H2 "Twoja ciąża.\nTwoje ojcostwo." (drugi wers gradient). 3 `<RDInput>` (Imię, Email, Hasło) + 2 picker rows (Termin porodu, Tydzień ciąży) jako `GlassCard` z chevronRight. CTA "Zakładam konto". Footer z linkami do regulaminu/prywatności.

#### `ScrForgotPassword`
Header z back arrow (bez tytułu). Środek: kwadratowa ikona 64×64 z lock w cyanSoft + glow, H2 "Zresetuj hasło", p, jeden input email, CTA "Wyślij link", footer "Przypomniałeś sobie? Wróć".

#### `ScrResetPassword`
Header `<chevronLeft> NOWE HASŁO`. Ikona 64×64 z check (gradient cyan/violet). H2 "Ustaw nowe hasło". 2 inputy (nowe hasło, powtórz). Pasek siły hasła (4px, gradient fill 80%). CTA "Zapisz hasło".

### 6.2. Onboarding & Home

#### `ScrOnboarding`
Header z mono "V 1.0 · BETA" + tekst-button "Pomiń". Środek: `<BlobLoader size={210} label="Ready Daddy" sub="stay calm · stay ready" />`. Dół: GlowPill "dla przyszłych ojców", H1 "Zostań\ngotowym tatą." (drugi wers gradient), p "Tydzień po tygodniu...", `<RDButton>` "Zaczynamy", page indicator dots (4 dots, pierwszy szerszy/cyan).

#### `ScrHome`
**Najważniejszy ekran — implementować pierwszy po komponentach.**

- **Header:** "Cześć, Adam" (12px textMute) + "Ready Daddy" (display 20). Po prawej `GlassCard` 40×40 z ikoną bell.
- **Hero week card** (`GlassCard` 20px padding, position relative):
  - Lewa kolumna: GlowPill "2. trymestr", duża liczba "24" (display 36) + "tydzień" (14 textDim), mono "60% · 16 tyg do spotkania" (11)
  - Prawa kolumna: `<BlobLoader size={88} week={24} />`
  - Pod spodem: progress bar 6px (gradient fill 60% z glow), pod nim "ROZMIAR · mango" + "~600 g · 30 cm" (mono 11)
- **Notification card:** `GlassCard` "hi" wariant z `borderLeft: 2px solid cyan`, ikona sparkle w cyanSoft 36×36, tekst "W tym tygodniu" + "Dziecko rozpoznaje twój głos. Mów do brzucha — serio."
- **Module grid 3×2** (6 modułów, każdy aspectRatio 1:1, `GlassCard` 12px padding):
  - bolt cyan "Co robić\nteraz?"
  - calendar violet "Lekarz\ni badania"
  - list cyan "Planowanie"
  - heart violet "Porodówka"
  - book cyan "Dziennik"
  - trophy violet "Odznaki"
- **Section "Ostatnia odznaka"** (label uppercase 11): `GlassCard` z emoji 🌱 w 44×44 radial-gradient violet kafelku, "Pierwszy Trymestr" + "Odblokowane 18 marca", chevronRight.
- **TabBar** active=`home`.

### 6.3. Wizualizer płodu

#### `ScrFetusC` — Wariant C, pulsująca sylwetka z PNG
**Używa istniejących `assets/fetus/fetus_week_XX.png` z appki.**

- Header: chevronLeft + mono "TYDZIEŃ 24" + more icon
- Trymester pills (3 chipy: I trym, II trym, III trym; II aktywny)
- **Hero:** `GlassCard` z `<FetusSilhouette size={110} />` po lewej, po prawej "TYDZIEŃ" mono + "24" display + "Jestem jak mango"
- Metryki (grid 1×2): MetricCell ruler "30 cm" + MetricCell weight "600 g"
- **Compare to:** `GlassCard` z 3 toggle-cellami (Owoc 🥭 active, Zwierzę 🐾, Słodycz 🍬)
- Progress card (`GlassCard`): label "POSTĘP" + cyfra 60% (mono cyan), bar 6px gradient, pod spodem mono "TYG 24" / "16 do spotkania"
- TabBar active=`dna`

#### `ScrWeekDetail`
- Header: chevronLeft + "Tydzień 24" + GlowPill "2 TRYM"
- Hero `GlassCard`: BlobLoader 64 + "Mango" + mono "600 g · 30 cm" + 3 chipy (słuch active, płuca, sen)
- Tabs: Dziecko/Mama/Ty (Dziecko active)
- Content card "Co się dzieje w 24. tygodniu" + 3 staty (Ruchy, Sen, Tętno)
- Section "Do zrobienia w tym tygodniu" + 3 task cards (checkbox + tytuł + opis), pierwszy zaznaczony

### 6.4. Główne ekrany

#### `ScrActionCards`
- Header: H4 "Co robić teraz?" + "Tydzień 24 · 4 zadania"
- Filter chips: Wszystko (active), Dziś, Ten tydzień, Pilne
- Lista 4 action cards (`GlassCard` z `position: relative, overflow: hidden`):
  - Lewy 3px stripe (cyan/violet, glow)
  - Ikona w soft tint (40×40 radius 12)
  - Tag uppercase 10 (cyan/violet), tytuł 14 600, sub 12 textDim
  - chevronRight
- Dane mocków: "Porozmawiaj z partnerką", "Zapisz się na kurs dla par", "Zrób listę pytań do lekarza", "Zainstaluj fotelik"

#### `ScrAddVisit`
- Header z nawigacją: chevronLeft + tytuł + cyan tekst-button "Zapisz" po prawej
- Sekcje (każda z uppercase label 11):
  - **Typ wizyty:** lista 4 radio-row (USG active, Ginekolog, Szkoła rodzenia, Inne). Active: cyanSoft bg + cyan border + gradient dot
  - **Data i godzina:** `GlassCard` z calendar icon cyan + tekst + godzina po prawej
  - **Lekarz / placówka:** `RDInput`
  - **Notatka:** pusty `GlassCard` 80px min-height z placeholder
  - **Powiadomienie:** `GlassCard` z bell + "1 dzień wcześniej" + chevronRight
- CTA "Zapisz wizytę"

#### `ScrCheckups`
- Header: H4 "Badania" + "2 nadchodzące · 2 odbyte" + mały CTA "+Dodaj"
- Notification card "Następna: USG kontrolne" (`GlassCard` hi z borderLeft cyan, ikona bell)
- Section "HARMONOGRAM" + lista wizyt (`GlassCard` z opacity 0.6 dla done):
  - Lewa kolumna 36px: data display 18 + miesiąc mono 8
  - Vertical separator 1px × 40
  - Środek: tydzień mute, label 13 600, godzina mono 10
  - Prawa: cyan dot dla `urgent`, check icon dla `done`
- TabBar active=`list`

#### `ScrPlanning`
- Header: H4 "Planowanie" + "5 otwartych · 2 zakończone" + plus icon
- Filter chips: Wszystko, Poród, Dom, Finanse
- Sekcje: "Przed porodem" i "Finanse", każda jako `GlassCard` z listą rows:
  - Square checkbox 20×20 (gradient cyan→violet z glow gdy done, border gdy nie)
  - Label 13 z line-through dla done
  - Border-bottom między rowami (oprócz ostatniego)
- TabBar active=`list`

#### `ScrNameDraw`
- Header: chevronLeft + H4 "Imiona" + GlowPill "4 ulubione"
- Search bar (`GlassCard` z more icon + placeholder "Szukaj imienia…")
- Filter chips: Wszystkie (active), Chłopiec, Dziewczynka, Ulubione
- **Featured card:** `GlassCard` z violet glow blob top-right, "PROPOZYCJA DNIA" mono, "Jakub" display 36, "hebrajskie · Ten, który idzie za piętą", dwa CTA buttony (Zapisz z heart icon + chevron action)
- Lista nazw (`GlassCard` każda): nazwa 15 700 + origin (cyan) · meaning, heart icon button po prawej (28×28, fav: violetSoft + violet border)

#### `ScrSettings`
- Header: chevronLeft + H4 "Ustawienia"
- **Profile hero:** `GlassCard` z avatar 52×52 (linear-gradient cyanSoft+violetSoft), name 15 700, email mute, GlowPill "Tydzień 24"
- 3 grupy sekcji (label uppercase 11):
  - **Konto:** Profil, Zmień hasło, E-mail
  - **Aplikacja:** Powiadomienia, Tydzień ciąży, Motyw
  - **Dane:** Eksport danych, Regulamin i prywatność
- Każdy item: 32×32 surfaceHi kafel z ikoną cyan + label + sub
- **Logout button:** danger style (orange-ish background + border) "Wyloguj się"
- TabBar active=`user`

#### `ScrNotificationSettings`
- Header: chevronLeft + "Powiadomienia" / "4 z 6 włączonych"
- Info card: bell icon + tekst "Powiadomienia pomagają ci być na bieżąco..."
- Lista 6 toggle-rows (`GlassCard` z border-bottom):
  - Label + sub + custom toggle 42×24 (gradient gdy on, surfaceHi gdy off, biały kółko 18×18)
- Items: Tygodniowe przypomnienia (on), Wizyty lekarskie (on), Wskazówki dla taty (off), Odznaki i postęp (on), Artykuły tygodnia (off), Kopnięcia i ruchy (on)
- TabBar active=`user`

### 6.5. Checklisty / Dziennik

#### `ScrBag`
- Header: chevronLeft + "Torba na poród" + plus icon
- **Hero progress card:** ProgressRing 72×72 (zielony fill % z labels w środku: "6/11" + mono "SPAKOWANE"), tekst "Jesteś w połowie." + "Spakuj torbę do 36. tygodnia. Zostało ci 12 tygodni."
- Filter chips: Wszystko, Dla dziecka, Dla taty, Dla mamy
- 2 grupy: "Dla dziecka" i "Dla taty", każda z mono `done/total` po prawej
- Lista checkboxów (square 20×20, gradient gdy done)
- TabBar active=`list`

#### `ScrJournal`
- Header: H3 "Dziennik" + "12 wpisów · 8 zdjęć" + CTA mały "+Nowy"
- Filter chips: Wszystko (active), Momenty, USG, Głos
- Lista 3 wpisów (`GlassCard` z gap 14):
  - Lewa kolumna 38px: dzień display 22 + mono miesiąc 9 (np. "18 / MAR")
  - Vertical separator 1px
  - Główna kolumna: chip (Moment violet, Badanie cyan, Zakup cyan), tytuł 14 600, body 12 textDim 1.45 line-height
  - **Zdjęcia:** jeśli `pics > 0`, rząd 56×56 placeholderów (`repeating-linear-gradient` 45deg → w RN: surfaceHi z border + camera icon w środku)
- TabBar active=`book`

#### `ScrJournalEntry`
- Header: chevronLeft + "18 marca" + more icon
- Tag chip "Moment" (violet variant) + mono "TYDZIEŃ 24 · 21:34"
- H4 "Pierwsze kopnięcie" (display 24)
- **Photo placeholder:** 100% width × 140 height, surfaceHi + border, camera icon + "Zdjęcie z tego wieczoru"
- Body text 14 lineHeight 1.7 (longer paragraph)
- Bottom action row: "Nagranie głosowe" `GlassCard` (flex 1 z mic icon) + heart button (kwadratowy 50×50)
- TabBar active=`book`

#### `ScrAddEntry`
- Header: chevronLeft + "Nowy wpis" + cyan "Zapisz"
- Sekcje:
  - **Typ wpisu:** chip rząd (Moment active, Badanie, Zakup, Myśl, Głos) — wrapping
  - **Tytuł:** `GlassCard` z placeholder 16 600 muted "Co się wydarzyło?"
  - **Treść:** `GlassCard` min-height 120 z placeholder 13 muted "Opisz ten moment własnymi słowami…"
  - **Dodaj media:** dwa kafelki flex 1 (Zdjęcie z camera icon, Nagranie z mic icon) — `GlassCard` z `borderStyle: dashed`
- CTA "Zapisz wpis"

### 6.6. Moduł Taty

#### `ScrDadModule`
- Header: mono "MODUŁ TATY" + display 24 "Twój poradnik" + p
- **Hero tip card:** `GlassCard` z cyan blob top-right, GlowPill "Wskazówka dnia", cytat 14 600 w cudzysłowiu, footer "Moduł: Poród · Rozdział 3"
- Section "SEKCJE" + 3 module cards (`GlassCard` z borderLeft 3px stripe):
  - 👶 Noworodek (cyan)
  - 🏥 Połóg (violet)
  - ❤️ Relacja (cyan)
  - Każdy: emoji 22px w 48×48 soft kafelku z border, tytuł 15 700, sub 12 textDim, chevronRight
- TabBar active=`home`

#### `ScrDadNoworodek`, `ScrDadPolog`, `ScrDadRelacja`
**Wszystkie trzy używają tego samego layoutu:**
- Header: chevronLeft + "Noworodek/Połóg/Relacja" + "X artykułów" pod tytułem
- Hero card (różny per ekran):
  - Noworodek: `GlassCard` z dużym emoji 36px + display 20 "Pierwsze dni" + sub
  - Połóg: `GlassCard` hi z borderLeft violet, heart icon + tekst wsparcie
  - Relacja: `GlassCard` z cyan blob bottom-right, display 20 "Ty, ona\ni dziecko." + p
- Lista 3 `<ArticleCard>`-ów: chip tag + mono "X MIN", tytuł 14 600, preview 12 textDim
- TabBar active=`home`

### 6.7. Po porodzie

#### `ScrPostBirth`
- Header: mono "PO PORODZIE" + display 22 "Co teraz?"
- **Vertical timeline** (5 kroków):
  - Lewa kolumna: cirkular dot 22×22 (gradient cyan→violet gdy done; cyanSoft + cyan border gdy active; surfaceHi gdy upcoming) + vertical line 1px do następnego kroku
  - Prawa: tytuł 13 600 (mute + line-through gdy done) + opis 11 textMute lineHeight 1.4
- Kroki: "Pierwsze 24h" (done), "Dzień 2-3" (done), "Tydzień 1" (active), "Tydzień 2-6", "Miesiąc 3"
- CTA "Przejdź do 4. trymestru"
- TabBar active=`home`

#### `ScrFourthTrimester`
- Header: mono "PO PORODZIE" + display 22 "4. trymestr\nPierwsze 12 tygodni." (drugi wers gradient)
- **Progress card:** ProgressRing 60×60 (33%) z "4 TYG" w środku, "Tydzień 4 z 12" + opis
- Section "TEMATY" + 5 topic cards: 🍼 Karmienie, 😴 Sen dziecka, 🩺 Kontrole, 🧠 Twoje emocje, 🤝 Jako drużyna. Każdy `GlassCard` z 40×40 emoji kafelek.
- TabBar active=`home`

#### `ScrFirstYearHome`
- Header: mono "PIERWSZY ROK" + display 22 "Miesiąc 4." + GlowPill "12 mies."
- Hero card: cyan blob top-right, 36px emoji 🌿 + tytuł 14 600 "Dziecko gaworzy i odpowiada uśmiechem" + sub. Progress bar (current/12). Mono "MIESIĄC 4 Z 12".
- Section "OŚ CZASU" + grid 4×3 miesięcy:
  - Mały `GlassCard` każdy z mono "MIES" + display number
  - current month: glass-hi + cyan border + glow + cyan text
  - upcoming months: opacity 0.5
- TabBar active=`home`

#### `ScrMonth`
- Header: chevronLeft + "Miesiąc 4 / Kamienie milowe" + GlowPill "w toku"
- Hero card: 40px emoji + display 24 "Miesiąc 4" + p
- Section "KAMIENIE MILOWE" + 5 milestone rows (`GlassCard` każdy):
  - Round checkbox 20×20 (gradient gdy done)
  - Label 13 (mute + line-through gdy done; default 500 weight)
- Section "WSKAZÓWKI DLA TATY" + `GlassCard` "Zabawy wspierające rozwój" + dłuższy opis
- TabBar active=`home`

### 6.8. Gamifikacja

#### `ScrBadges`
- Header: chevronLeft + "Odznaki" + mono "3/12"
- **Hero level card:** `GlassCard` z violet blob top-right, GlowPill violet "Level 2 · Tata w biegu", display 24 "3 z 12 zdobyte", sub, progress bar 4px (25%)
- Grid 2×2 (8 odznak), każda `GlassCard`:
  - Glow blob top-right gdy `unlocked`
  - 44×44 kafelek: gradient cyanSoft+violetSoft + emoji gdy unlocked; surfaceHi + lock icon gdy locked
  - opacity 0.65 + grayscale dla locked
  - tytuł 12 600 + sub 10 mute
  - Unlocked: mono cyan "✓ 18 MAR"
  - Locked: progress bar 3px z procent
- Dane mocków: 🌱 Pierwszy Trymestr (unlocked), 🔔 Czujny Tata (unlocked), 📓 Kronikarz (unlocked), 👶 Drugi Trymestr (85%), 🧳 Spakowany Tata (60%), 🔬 Pierwsze USG (0%), 🌟 Trzeci Trymestr (0%), ⭐ Aktywny Tata (30%)
- TabBar active=`user`

#### `ScrLoader`
- Header: chevronLeft + "Synchronizacja"
- Środek (centered, gap 18, padding 24):
  - `<BlobLoader size={200} label="Ładuję dane" sub="aktualizacja w toku…" />`
  - Display 22 "Spokojnie, oddycham razem z tobą."
  - Sub textDim "Pobieram tygodniowy raport i zdjęcia z chmury. Chwilka."
  - Mono 10 letterSpacing 0.16em "SYNC · 67%"

---

<a id="plan"></a>
## 7. Plan wdrożenia w fazach

**Reguła:** **żadnej fazy nie zaczynamy bez ukończenia poprzedniej.** Po każdej fazie checkpoint w Notion — Romek potwierdza zanim ruszamy dalej.

### Faza 0 — `BlurView` spike (NON-NEGOTIABLE) — 2-3h
Patrz sekcja 1. **Tylko po PASS idziemy dalej.**

### Faza 1 — Przygotowanie (0.5h)
- [ ] Dodać `@expo-google-fonts/jetbrains-mono` (`npm install` lokalnie — Romek robi ręcznie)
- [ ] Sprawdzić `expo-linear-gradient` (już jest)
- [ ] Sprawdzić `lucide-react-native` — jeśli nie ma, zainstalować
- [ ] Ustawić feature flag `glassUI: true` w `config/featureFlags.ts`

### Faza 2 — Tokeny i theme (1h)
- [ ] Rozszerzyć `theme.ts` o nowe tokeny z sekcji 3 (`bg`, `bg2`, `surface`, `surfaceHi`, `cyan`, `cyanSoft`, `violet`, `violetSoft`, `borderHi`, `textDim`, `textMute`, gradienty)
- [ ] **WAŻNE:** zachować istniejące tokeny (`primary`, `accent`, `card`, `cardBorder`, `surfaceLight`, `tabBar`, `partner`, `notifications`, `gradientStart/End` itd.) — tylko dodać nowe, **nie zastępować wszystkich**
- [ ] Dodać paletę `light` analogicznie

### Faza 3 — Komponenty fundamentalne (4-5h)
Kolejność w której **muszą** powstać:
1. [ ] `<RDIcon>` (lub adapter na `lucide-react-native`)
2. [ ] `useGlassFeatureFlag` hook + plumbing dla feature flagi
3. [ ] `<GlassCard>` z wariantami `default` i `hi` + `accentBorderColor` + **branch fallback do fake-glass**
4. [ ] `<AuroraBackground>` (statyczne bloby + opcjonalny `BlurView` overlay przy fladze on)
5. [ ] `<RDButton>` (CTA z gradient + cienki shadow)
6. [ ] `<GlowPill>` (cyan + violet warianty)
7. [ ] `<RDInput>` (z optional eye toggle)
8. [ ] `<Chip>` (default/active)
9. [ ] `<TabBar>` (5 itemów, `BlurView` background, **z fallback'iem do semi-transparent jeśli flaga off**)
10. [ ] `<ProgressRing>` (SVG + linear gradient)
11. [ ] `<MetricCell>`, `<Stat>`, `<ArticleCard>` (proste)

**Checkpoint Faza 3:** zbudować jeden ekran testowy (`ScrBadges`) używający 80% komponentów. Test na realnym Androidzie — nie tylko w emulatorze. Sprawdzić, że feature flag off także działa (graceful fallback).

### Faza 4 — Animowane komponenty (2-3h)
- [ ] `<BlobLoader>` — statyczny path + Reanimated rotate + scale pulse
- [ ] `<FetusSilhouette>` — istniejące PNG-i + glow + pulse animation (Reanimated)

### Faza 5 — Ekrany Auth (2-3h)
- [ ] `ScrLogin`
- [ ] `ScrRegister`
- [ ] `ScrForgotPassword`
- [ ] `ScrResetPassword`
- [ ] **Checkpoint:** test logowania i routingu, build APK, instalacja na realnym urządzeniu

### Faza 6 — Onboarding + Home (2h)
- [ ] `ScrOnboarding`
- [ ] `ScrHome` (krytyczny — najwięcej komponentów)
- [ ] **Checkpoint:** najtrudniejszy ekran działa — sprawdzić perf scrollu nad blurem; jeśli lagnie, podjąć decyzję

### Faza 7 — Wizualizer (2h)
- [ ] `ScrFetusC` (wykorzystuje istniejące PNG-i)
- [ ] `ScrWeekDetail`

### Faza 8 — Główne ekrany (4h)
- [ ] `ScrActionCards`, `ScrAddVisit`, `ScrCheckups`, `ScrPlanning`, `ScrNameDraw`, `ScrSettings`, `ScrNotificationSettings`

### Faza 9 — Dziennik i checklisty (3h)
- [ ] `ScrBag`, `ScrJournal`, `ScrJournalEntry`, `ScrAddEntry`

### Faza 10 — Moduł taty (1.5h)
- [ ] `ScrDadModule`, `ScrDadNoworodek`, `ScrDadPolog`, `ScrDadRelacja`

### Faza 11 — Po porodzie (2h)
- [ ] `ScrPostBirth`, `ScrFourthTrimester`, `ScrFirstYearHome`, `ScrMonth`

### Faza 12 — Gamifikacja (1h)
- [ ] `ScrBadges`, `ScrLoader`

### Faza 13 — Polish & szerokie testy (3-4h)
- [ ] Build APK przez `./gradlew assembleRelease`
- [ ] Test na minimum 2 urządzeniach (Pixel + budżetowy Android)
- [ ] Profilowanie perf (FPS przy scrollu, cold start)
- [ ] Sprawdzić każdy ekran z feature flag glass=off — żeby fallback faktycznie działał
- [ ] Fix glitchy specyficzne dla Androida
- [ ] Update memory edit po wdrożeniu

**Łączny czas (estymacja):** ~30-35h.

---

<a id="wariant-b"></a>
## 8. Wariant B — fallback do fake-glass (jeśli Faza 0 padnie)

Jeśli Faza 0 wykaże, że `<BlurView>` nadal nie działa stabilnie:

**Co się zmienia:**
- Feature flag `glassUI` ustawiamy na `false` jako default
- `<GlassCard>` używa wyłącznie branch fake-glass: `rgba(255,255,255,0.04)` + gradient border przez `LinearGradient` wrapper
- `<TabBar>` ma `backgroundColor: 'rgba(11,21,18,0.7)'` zamiast `<BlurView>`
- `<AuroraBackground>` traci `<BlurView>` overlay — same blob-y na `opacity 0.55` + bardzo duży `borderRadius`

**Cała reszta dokumentu zostaje bez zmian** — komponenty mają już przygotowany branch dla fake-glass, więc switch jest natychmiastowy. Tokeny, layouty ekranów, animacje — identyczne.

Wizualnie różnica: ~15% mniej "miękkości" tła kart, tab bar bardziej solidny zamiast półprzezroczystego. Akceptowalne w kontekście stabilności.

---

## 9. Otwarte pytania (do potwierdzenia z Romkiem)

1. Czy zachowujemy obecny dark theme (`#0A0E1A` + `#00D9A6`) jako równoległą opcję, czy zastępujemy go w pełni nowym Neon Glass dark? — domyślnie: **zastępujemy** (nowe tokeny stają się głównymi)
2. Czy dodać light theme od razu, czy po dark? — domyślnie: **po dark, w osobnej iteracji**
3. Czy `<BlobLoader>` ma mieć animowany morph (ryzyko jank-u, więcej pracy) czy tylko statyczny path z rotate+pulse? — domyślnie: **statyczny path z rotate+pulse**
4. Czy istniejący komponent ekranu (np. `HomeScreen.tsx`) przepisujemy w miejscu, czy tworzymy nowy obok i przełączamy routing? — rekomendacja: **przepisujemy w miejscu z commitami per ekran**
5. Czy feature flag `glassUI` ma być widoczna w UI (developer mode w Settings), czy tylko z poziomu kodu? — rekomendacja: **w UI, w sekcji Settings → Aplikacja → Motyw → "Efekty glass" toggle**

---

## 10. Pliki referencyjne

- **Pełny prototyp z kodem każdego ekranu:** `Ready_Daddy_UI_-_standalone__1_.html` (źródło)
- **Wszystkie ikony jako SVG paths (24 sztuki):** w sekcji `RDIcon` prototypu (plik `35b4414f-...js`)
- **Wszystkie style CSS:** `:root { --rd-* }`, `.rd-glass`, `.rd-cta`, `.rd-glow-pill`, `.rd-chip`, `.rd-tabbar`, animacje `@keyframes rd-spin/rd-pulse/rd-float`

---

**Konwencja Claude Code dla tego dokumentu:**
- Każda faza = oddzielna sesja Claude Code z explicit checkpointem na końcu
- Każdy ekran = oddzielny commit z prefixem `feat(ui): <screen name>`
- Po każdej fazie testujemy build (`./gradlew assembleRelease`) i instalujemy APK
- Memory edit po zakończeniu wdrożenia: aktualizować przez `memory_user_edits` że Bold UI został zastąpiony przez Neon Glass z `expo-blur`
