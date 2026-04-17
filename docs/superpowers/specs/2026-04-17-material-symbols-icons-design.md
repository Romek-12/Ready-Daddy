# Design: Zamiana emoji na Material Symbols Sharp

**Data:** 2026-04-17  
**Zakres:** `mobile/` — ikony UI w ekranach i komponentach

---

## Cel

Zastąpić emoji używane jako ikony UI ikonami z biblioteki Material Symbols Sharp (weight 300) z Google Fonts. Zachować spójne API przez istniejący komponent `Icon.tsx`.

---

## Architektura

### Nowe pliki
- `mobile/assets/fonts/MaterialSymbolsSharp-VariableFont_FILL,GRAD,opsz,wght.ttf` — czcionka variable font z Google Fonts
- `mobile/src/components/MaterialSymbol.tsx` — komponent renderujący ikony jako znaki unicode tej czcionki

### Modyfikowane pliki
- `mobile/App.tsx` — ładowanie czcionki przez `expo-font` z `fontVariationSettings: "'wght' 300"`
- `mobile/src/components/Icon.tsx` — zamiana `@expo/vector-icons` na `MaterialSymbol` wewnętrznie; publiczne API bez zmian
- `mobile/src/screens/DadNoworodekScreen.tsx` — zamiana emoji voice block
- `mobile/src/screens/DadPologScreen.tsx` — zamiana emoji voice block
- `mobile/src/screens/DadRelacjaScreen.tsx` — zamiana emoji voice block
- `mobile/src/screens/first-year/MonthScreen.tsx` — zamiana emoji nagłówków sekcji
- `mobile/src/screens/first-year/FirstYearHomeScreen.tsx` — zamiana emoji tytułu i odznaki
- `mobile/src/screens/SettingsScreen.tsx` — zamiana emoji płci; tryby rozmiaru → tekst

### Bez zmian
- `@expo/vector-icons` zostaje w `package.json` (nie usuwamy)
- `mobile/src/components/FetusVisualizer.tsx` — emoji owoców są istotą wizualizacji
- `mobile/src/components/gamification/BadgeUnlockModal.tsx` — 🎉 w tekście przycisku
- `mobile/src/screens/ActionCardsScreen.tsx` — `card.emoji` z danych, 🎉 empty state
- `mobile/src/data/badges-definitions.ts` — odznaki
- `mobile/src/services/notifications/` — powiadomienia

---

## Komponent MaterialSymbol

```tsx
// mobile/src/components/MaterialSymbol.tsx
import { Text } from 'react-native';

// Renderuje ikonę Material Symbols Sharp przez unicode codepoint
// Czcionka musi być załadowana przez expo-font jako 'MaterialSymbolsSharp'
export default function MaterialSymbol({ name, size, color }: {
  name: string;
  size: number;
  color: string;
}) {
  const codepoint = CODEPOINTS[name];
  return (
    <Text style={{
      fontFamily: 'MaterialSymbolsSharp',
      fontSize: size,
      color,
      fontVariationSettings: "'wght' 300",
    }}>
      {codepoint ? String.fromCodePoint(codepoint) : '?'}
    </Text>
  );
}
```

Plik `codepoints.ts` zawiera mapę `name → unicode codepoint` wygenerowaną z pliku `MaterialSymbolsSharp[wght].codepoints` dołączonego do czcionki przez Google Fonts.

---

## Mapowanie ikon — ICON_MAP w Icon.tsx

Wszystkie istniejące wpisy w `ICON_MAP` przepisujemy na nazwy Material Symbols. Przykłady:

| Klucz semantyczny | Obecna ikona | Material Symbol |
|---|---|---|
| `home` | MaterialIcons `home` | `home` |
| `bolt` | MaterialIcons `bolt` | `bolt` |
| `calendar` | MaterialIcons `event` | `event` |
| `fetus` | MaterialCommunityIcons `dna` | `genetics` |
| `partner` | MaterialIcons `psychology` | `psychology` |
| `checkups` | MaterialIcons `event-note` | `event_note` |
| `hospital` | MaterialIcons `local-hospital` | `local_hospital` |
| `dad` | MaterialIcons `face-6` | `face_6` |
| `baby` | MaterialIcons `child-care` | `child_care` |
| `notifications` | MaterialIcons `notifications` | `notifications` |
| `brain` | MaterialIcons `psychology` | `psychology` |
| `lightbulb` | MaterialIcons `lightbulb` | `lightbulb` |
| `check-circle` | MaterialIcons `check-circle` | `check_circle` |
| `shopping-cart` | MaterialIcons `shopping-cart` | `shopping_cart` |
| `checklist` | MaterialIcons `assignment` | `assignment` |
| `warning` | MaterialIcons `warning` | `warning` |
| `science` | MaterialIcons `science` | `science` |
| `gear` | MaterialIcons `settings` | `settings` |
| `journal` | MaterialIcons `book` | `book` |
| `add` | MaterialIcons `add` | `add` |
| `close` | MaterialIcons `close` | `close` |
| `delete` | MaterialIcons `delete` | `delete` |
| `back` | MaterialIcons `arrow-back` | `arrow_back` |

---

## Mapowanie emoji → ikony UI

### DadNoworodekScreen / DadPologScreen / DadRelacjaScreen

| Emoji | Kontekst | Material Symbol |
|-------|----------|-----------------|
| 🍼 | rozumienie potrzeb | `baby_changing_station` |
| 🫂 | bliskość/bonding | `sentiment_very_satisfied` |
| ❤️ | kangur/kontakt | `favorite` |
| 🎯 | proaktywna opieka | `target` |
| ⛔ | czerwone flagi | `do_not_disturb_on` |
| 🛏️ | bezpieczny sen | `bed` |
| ✓ | normalna fizjologia | `check` |
| ⚠️ | objawy alarmowe | `warning` |
| 💡 | przypomnienie | `lightbulb` |
| 🤝 | rola ojca | `handshake` |
| 🏥 | połóg | `local_hospital` |
| 💬 | komunikacja | `chat` |
| 🌧️ | baby blues | `cloud` |
| 🛡️ | wsparcie matki | `shield` |
| 👨 | emocje ojca | `person` |
| 💑 | relacja partnerska | `favorite` |
| ⏱️ | czas/problemy | `timer` |
| ❌ | destrukcyjne zdania | `close` |
| ✅ | dobra komunikacja | `check_circle` |

### MonthScreen

| Emoji | Kontekst | Material Symbol |
|-------|----------|-----------------|
| 👶 | rozwój dziecka | `child_care` |
| 💪 | rola taty | `fitness_center` |
| ⭐ | kamienie milowe | `star` |
| 💉 | szczepienia | `vaccines` |
| 💙 | emocje | `favorite` |

### FirstYearHomeScreen

| Emoji | Kontekst | Material Symbol |
|-------|----------|-----------------|
| 👶 | tytuł sekcji | `child_care` |
| 🏆 | odznaki/osiągnięcia | `emoji_events` |

### SettingsScreen

| Emoji | Kontekst | Zamiana |
|-------|----------|---------|
| 👧 | płeć dziewczynka | `girl` |
| 👦 | płeć chłopiec | `boy` |
| 🍎 | tryb owoców | tekst "Owoce" |
| 🐾 | tryb zwierząt | `pets` |
| 🍬 | tryb słodyczy | tekst "Słodkie" |

---

## Kroki implementacji (kolejność)

1. Pobranie czcionki i pliku codepoints z Google Fonts
2. Wygenerowanie `codepoints.ts` z pliku `.codepoints`
3. Stworzenie `MaterialSymbol.tsx`
4. Załadowanie czcionki w `App.tsx`
5. Przepisanie `Icon.tsx` na `MaterialSymbol`
6. Zamiana emoji w ekranach (Dad*, MonthScreen, FirstYearHomeScreen, SettingsScreen)
7. Weryfikacja TypeScript + test na urządzeniu
