# Design: Podmiana BlobLoader → RingLoader

**Status:** Approved (2026-05-08)
**Scope:** `mobile/` — wszystkie miejsca używające `BlobLoader`

## Problem

Aktualny `BlobLoader` (kropla z radialnym gradientem) ma trzy warianty (`fullscreen`, `inline`, `button`) i propsy tekstowe (`week`, `label`, `sub`). Designer dostarczył nowy komponent `RingLoader` w stylu V3.1 — pierścień 40 segmentów z animacją komety i monogramem "RD" w środku. Chcemy ujednolicić: usuwamy `BlobLoader`, wszystkie miejsca przechodzą na `RingLoader`.

## Architektura

### Nowy komponent: `RingLoader`

`mobile/src/components/ui/RingLoader.tsx` — z handoff'a, **z modyfikacjami**:

1. **Defaulty kolorów zostają** — `fromColor='#00E5FF'` (cyan), `toColor='#00BFA5'` (teal). Loader-style, nie używa tokenów theme.
2. **Brak propsów tekstowych** — nie dodajemy `label`/`sub`/`week`. Komponent czysty, jak w handoff. Tekst pod loaderem (jeśli kiedyś potrzebny) → ekran rozwiązuje lokalnie.
3. **Auto-segments dla małych rozmiarów** — gdy `segments` nie podany jawnie, używamy `size < 64 ? 20 : 40`. Trail proporcjonalny: `Math.round(segments * 0.75)` (15 dla 20, 30 dla 40 — zgodne z handoff).
4. **Wymuszony `showMonogram=false` dla `size < 64`** — monogram "RD" w 20px loaderze byłby nieczytelny (~4px wysokości). Komponent ignoruje `showMonogram=true` jeśli size < 64.

### Mapping wariantów BlobLoader → RingLoader

| BlobLoader | RingLoader |
|---|---|
| `variant="fullscreen"` (120px, glow, ring, monogram) | `<RingLoader size={120} />` (default 40 segs, monogram on) |
| `variant="inline"` (48px, glow, brak tekstu) | `<RingLoader size={48} showMonogram={false} />` (auto 20 segs) |
| `variant="button"` (20px, brak glow) z `color={X}` | `<RingLoader size={20} showMonogram={false} fromColor={X} toColor={X} />` (auto 20 segs) |
| `label="..."` prop (4 ekrany) | usunięty — sam loader, bez tekstu |

### Pliki do zmiany (15 użyć BlobLoadera)

**Ekrany:**
- `mobile/src/navigation/AppNavigator.tsx` — fullscreen + label
- `mobile/src/screens/journal/JournalScreen.tsx` — inline
- `mobile/src/screens/DadModuleScreen.tsx` — fullscreen + label
- `mobile/src/screens/SettingsScreen.tsx` — inline lub fullscreen
- `mobile/src/screens/ProfileSetupScreen.tsx` — button
- `mobile/src/screens/AddVisitScreen.tsx` — button
- `mobile/src/screens/journal/AddEntryScreen.tsx` — button
- `mobile/src/screens/NotificationSettingsScreen.tsx` — button
- `mobile/src/screens/BadgesScreen.tsx` — fullscreen + label
- `mobile/src/screens/ActionCardsScreen.tsx` — fullscreen + label

**Komponenty:**
- `mobile/src/components/SocialAuthButtons.tsx` — button z color
- `mobile/src/components/ui/GradientButton.tsx` — button z color
- `mobile/src/components/Button.tsx` — button
- `mobile/src/components/BabyNameModal.tsx` — button

**Usunięte:**
- `mobile/src/components/ui/BlobLoader.tsx`

## Testy

`mobile/src/components/ui/__tests__/RingLoader.test.tsx`:
- Renderuje SVG (nie crash) z różnymi rozmiarami (20, 48, 120, 200).
- Auto-segments: `size=20` → 20 segmentów. `size=120` → 40 segmentów. `size=20` z explicit `segments=10` → 10.
- `showMonogram={true}` przy `size<64` nie renderuje monogramu (wymuszone false).
- `showMonogram={true}` przy `size>=64` renderuje "RD".
- `progress={0.5}` mode — animacja statyczna (mock reanimated weryfikuje brak `withRepeat`).
- `testID` propaguje na root view.

Po podmianie: `npm test` musi przejść 96/96 (wszystkie obecne testy nadal działają, nie testują BlobLoadera bezpośrednio).

## Edge cases

| Sytuacja | Zachowanie |
|---|---|
| Font Climate Crisis nie załadowany | Monogram "RD" renderuje się fallback'iem systemowym. Akceptowalne. |
| `size < 64` + `showMonogram={true}` | Komponent ignoruje, monogram nie renderuje. |
| `progress={0}` | Renderuje pierścień bez wypełnienia. |
| `progress={1}` | Renderuje pełny pierścień. |
| `progress` zmienia się dynamicznie | Animacja `withTiming(400ms)` interpoluje wartość. |
| Zewnętrzny `segments` przekraczający handoff | Bez walidacji — props użytkownika respektowany. |

## Świadomie nieobjęte (YAGNI)

- `label`/`sub` props — odrzucone w brainstormingu.
- `week` prop (tygodnie ciąży w środku) — nie był używany w aplikacji.
- `RingLoaderOverlay` z BlurView i tłem (z handoff README sekcja "Dalsze kroki").
- Haptic feedback na milestone'ach.
- Wariant kompaktowy z grubszymi segmentami (z handoff README).

## Pliki

**Nowe:**
- `mobile/src/components/ui/RingLoader.tsx`
- `mobile/src/components/ui/__tests__/RingLoader.test.tsx`

**Zmienione (14 plików):**
- 14 plików z mapping table powyżej (ekrany + komponenty)

**Usunięte:**
- `mobile/src/components/ui/BlobLoader.tsx`
