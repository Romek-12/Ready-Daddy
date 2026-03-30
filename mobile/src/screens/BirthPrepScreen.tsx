import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';
import { usePersistedChecklist } from '../hooks/usePersistedChecklist';
import { useBirthPreparation, useBagChecklist } from '../hooks/useAppData';
import Icon from '../components/Icon';

interface BagItem {
  name: string;
  note?: string;
  optional?: boolean;
}

interface BagCategory {
  title: string;
  icon: string;
  items: BagItem[];
}

interface PersonSection {
  person: string;
  personIcon: string;
  color: string;
  bagNote?: string;
  categories: BagCategory[];
}

const getChecklist = (theme: Theme): PersonSection[] => [
  {
    person: 'Dla mamy',
    personIcon: 'mom',
    color: theme.colors.birth,
    categories: [
      {
        title: 'Papiery mamy (teczka na wierzchu)', icon: 'checklist',
        items: [
          { name: 'Dowód osobisty' },
          { name: 'Karta ciąży' },
          { name: 'Wyniki badań', note: 'morfologia, grupa krwi, GBS, USG III trym., OGTT, HIV/HBs' },
          { name: 'Skierowanie do szpitala', note: 'jeśli wymagane' },
          { name: 'Plan porodu', optional: true },
          { name: 'Numer NIP pracodawcy', note: 'do urlopu' },
        ],
      },
      {
        title: 'Odzież', icon: 'shirt',
        items: [
          { name: 'Koszula porodowa lub T-shirt', note: 'wygodna, rozpinana – 2–3 szt.' },
          { name: 'Skarpetki ciepłe', note: '3–4 pary' },
          { name: 'Szlafrok' },
          { name: 'Klapki pod prysznic' },
        ],
      },
      {
        title: 'Higiena', icon: 'hygiene',
        items: [
          { name: 'Przybory toaletowe', note: 'szampon, pasta, szczoteczka, krem, pomadka' },
          { name: 'Gumka/spinka do włosów' },
          { name: 'Ręcznik mały', note: 'do twarzy/okładów' },
          { name: 'Butelka wody z rurką (1,5 l)' },
          { name: 'Przekąski energetyczne', note: 'batony, orzechy' },
        ],
      },
      {
        title: 'W trakcie porodu', icon: 'timer',
        items: [
          { name: 'Telefon + ładowarka (powerbank)' },
          { name: 'Słuchawki do muzyki/medytacji' },
          { name: 'Masażer/rolka do pleców' },
        ],
      },
      {
        title: 'Po porodzie (torba na pobyt)', icon: 'luggage',
        items: [
          { name: 'Koszule nocne do karmienia', note: 'rozpinane z przodu – 2–3 szt.' },
          { name: 'Biustonosze do karmienia', note: 'bez fiszbin – 2 szt.' },
          { name: 'Wkładki laktacyjne', note: '1 opak.' },
          { name: 'Majtki siateczkowe jednorazowe', note: '5–10 szt.' },
          { name: 'Podpaski poporodowe XXL', note: '2 opak.' },
          { name: 'Pas poporodowy', optional: true },
          { name: 'Szlafrok, kapcie, klapki' },
          { name: 'Ręcznik kąpielowy' },
        ],
      },
    ],
  },
  {
    person: 'Dla dziecka',
    personIcon: 'baby',
    color: theme.colors.primary,
    bagNote: 'Wyprawka na wyjście ze szpitala.',
    categories: [
      {
        title: 'Na czas podróży', icon: 'car',
        items: [
          { name: 'Fotelik samochodowy', note: 'zainstalowany w aucie — obowiązkowy!' },
          { name: 'Nosidełko lub chusta', optional: true },
        ],
      },
      {
        title: 'Odzież (rozm. 50–62)', icon: 'shirt',
        items: [
          { name: 'Body rozpinane', note: '3–5 szt.' },
          { name: 'Pajacyki/śpiochy', note: '3–5 szt.' },
          { name: 'Czapeczki', note: '2 szt.' },
          { name: 'Skarpetki', note: '3–5 par' },
          { name: 'Rękawiczki niedrapki', note: '2 pary' },
          { name: 'Rożek/kocyk ciepły', note: '1–2 szt.' },
        ],
      },
      {
        title: 'Opieka', icon: 'hygiene',
        items: [
          { name: 'Pieluszki jednorazowe', note: '10–20 szt.' },
          { name: 'Chusteczki nawilżane', note: 'małe opak.' },
          { name: 'Krem na pupę', note: 'małe opak.' },
          { name: 'Ręczniki z kapturkiem', note: '2 szt.' },
          { name: 'Pieluszki tetrowe/muślinowe', note: '5–10 szt.' },
          { name: 'Gaziki + sól fizjologiczna', note: 'do pępka' },
          { name: 'Termometr niemowlęcy' },
        ],
      },
    ],
  },
  {
    person: 'Dla taty',
    personIcon: 'dad',
    color: theme.colors.dadModule,
    bagNote: 'Twoja wyprawka na czas porodu.',
    categories: [
      {
        title: 'Dokumenty', icon: 'checklist',
        items: [
          { name: 'Dowód osobisty' },
          { name: 'Karta zdrowia/prywatnego ubezpieczenia' },
        ],
      },
      {
        title: 'Odzież', icon: 'shirt',
        items: [
          { name: 'Ubranie na zmianę', note: '2 zestawy' },
          { name: 'Buty na zmianę' },
        ],
      },
      {
        title: 'W trakcie porodu', icon: 'timer',
        items: [
          { name: 'Woda i przekąski', note: 'dla siebie i mamy' },
          { name: 'Ładowarka do telefonu/powerbank' },
          { name: 'Gotówka/monety/karta', note: 'automat z jedzeniem i parking' },
          { name: 'Słuchawki/książka/e-book', note: 'na oczekiwanie' },
        ],
      },
      {
        title: 'Po porodzie', icon: 'luggage',
        items: [
          { name: 'Szlafrok/koszula nocna', note: 'jeśli nocleg' },
          { name: 'Higiena osobista', note: 'pasta, szczotka' },
          { name: 'Kamera/telefon do nagrywania/zdjęć' },
          { name: 'Prezent dla mamy', note: 'kwiaty, ulubiona przekąska' },
        ],
      },
    ],
  },
];

const TIPS = [
  'Zadzwoń do szpitala o regulamin — może być zakaz jedzenia, używania mocnych perfum u osoby towarzyszącej.',
  'Torby: Miękka torba podróżna dla mamy, plecak dla Ciebie, osobna mniejsza torba z rzeczami dla dziecka na wyjście ze szpitala.',
  'Fotelik w aucie to podstawa — personel medyczny w wielu miejscach zwraca na to uwagę przy wypisie.',
  'Zostawcie dom w porządku — wynieś śmieci, opróżnij lodówkę z psujących się rzeczy, żeby po powrocie ze szpitala zastać ład.',
];

const getItemKey = (pIdx: number, cIdx: number, iIdx: number) => `p${pIdx}-c${cIdx}-i${iIdx}`;

export default function BirthPrepScreen() {
  const { theme } = useTheme();
  const CHECKLIST = React.useMemo(() => getChecklist(theme), [theme]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Pre-warm hook caches (bundled JSON, staleTime: Infinity)
  useBirthPreparation();
  useBagChecklist();

  const toggle = (idx: number) => setExpanded(expanded === idx ? null : idx);
  const { checked, toggleCheck } = usePersistedChecklist('birth_prep');

  const totalItems = useMemo(() =>
    CHECKLIST.reduce((sum, p) => sum + p.categories.reduce((s, c) => s + c.items.length, 0), 0), []);
  const totalChecked = useMemo(() =>
    Object.values(checked).filter(Boolean).length, [checked]);

  return (
    <ScrollView style={s.c}>
      <View style={s.header}>
        <Icon name="hospital" size={48} color={theme.colors.birth} />
        <Text style={s.title}>Wyprawka do Szpitala</Text>
        <Text style={s.sub}>Lista rzeczy do spakowania, by być gotowym</Text>
      </View>

      {/* Progress */}
      <View style={s.progressCard}>
        <Text style={s.progressLabel}>Spakowane łupy</Text>
        <View style={s.progressRight}>
          <Text style={s.progressCount}>{totalChecked}/{totalItems}</Text>
          <Text style={s.progressCheckLabel}>spakowanych rzeczy</Text>
        </View>
      </View>

      {CHECKLIST.map((person, pIdx) => {
        const isExpanded = expanded === pIdx;
        const personItemCount = person.categories.reduce((sum, c) => sum + c.items.length, 0);
        const personChecked = person.categories.reduce((sum, c, cIdx) =>
          sum + c.items.filter((_, iIdx) => checked[getItemKey(pIdx, cIdx, iIdx)]).length, 0);

        return (
          <View key={pIdx} style={s.personSection}>
            <TouchableOpacity style={[s.personHeader, { borderLeftColor: person.color }]} onPress={() => toggle(pIdx)} accessibilityRole="button" accessibilityLabel={`${person.person}, ${personChecked} z ${personItemCount} spakowanych`} accessibilityState={{ expanded: isExpanded }}>
              <View style={s.personHeaderLeft}>
                <View style={[s.personBadge, { backgroundColor: person.color }]}>
                  <Icon name={person.personIcon} size={18} color={theme.colors.white} />
                </View>
                <View style={s.personHeaderText}>
                  <Text style={s.personTitle}>{person.person}</Text>
                  {person.bagNote && <Text style={s.personNote}>{person.bagNote}</Text>}
                </View>
              </View>
              <View style={s.personHeaderRight}>
                <Text style={[s.personProgress, { color: personChecked === personItemCount && personItemCount > 0 ? theme.colors.primary : theme.colors.textMuted }]}>
                  {personChecked}/{personItemCount}
                </Text>
                <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={s.personContent}>
                {person.categories.map((cat, cIdx) => (
                  <View key={cIdx} style={s.catSection}>
                    <View style={s.catHeader}>
                      <Icon name={cat.icon} size={16} color={person.color} />
                      <Text style={s.catTitle}> {cat.title}</Text>
                      <Text style={[s.catCount, { color: person.color }]}>{cat.items.length}</Text>
                    </View>

                    {cat.items.map((item, iIdx) => {
                      const key = getItemKey(pIdx, cIdx, iIdx);
                      const isDone = checked[key] || false;
                      return (
                        <TouchableOpacity key={iIdx} style={[s.item, isDone && s.itemDone]} onPress={() => toggleCheck(key)} activeOpacity={0.7} accessibilityRole="checkbox" accessibilityLabel={item.name} accessibilityState={{ checked: isDone }}>
                          <Icon
                            name={isDone ? 'check-circle' : 'checkbox-blank'}
                            size={22}
                            color={isDone ? theme.colors.primary : theme.colors.textMuted}
                          />
                          <View style={s.itemInfo}>
                            <Text style={[s.itemName, isDone && s.itemNameDone]}>
                              {item.optional && <Text style={s.optional}>(opcja) </Text>}
                              {item.name}
                            </Text>
                            {item.note && <Text style={s.itemNote}>{item.note}</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={s.tipsSection}>
        <View style={s.tipsHeader}>
          <Icon name="info" size={18} color={theme.colors.accent} />
          <Text style={s.tipsTitle}> Dodatkowe wskazówki</Text>
        </View>
        {TIPS.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.tipDot}>•</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Icon name="info" size={16} color={theme.colors.textMuted} />
        <Text style={s.disclaimerText}>Ta lista jest orientacyjna. Szpitale mogą mieć własne wymagania — sprawdź je na stronie oddziału położniczego, w którym planujecie poród.</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: theme.spacing.lg },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.birth, marginTop: theme.spacing.sm },
  sub: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },

  progressCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl, backgroundColor: theme.colors.birth, borderRadius: theme.borderRadius.xl, paddingHorizontal: theme.spacing.lg, paddingVertical: 24, minHeight: 110 },
  progressLabel: { fontSize: theme.fontSize.lg, color: 'rgba(255,255,255,0.9)', fontWeight: theme.fontWeight.bold, flex: 1, marginRight: theme.spacing.md },
  progressRight: { alignItems: 'flex-end' },
  progressCount: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.white },
  progressCheckLabel: { fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: theme.fontWeight.medium },

  personSection: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  personHeader: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
  personHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  personBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  personHeaderText: { flex: 1 },
  personTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  personNote: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  personHeaderRight: { alignItems: 'flex-end', marginLeft: theme.spacing.sm },
  personProgress: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, marginBottom: 4 },

  personContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, marginTop: 2, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },

  catSection: { marginBottom: theme.spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  catTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text, flex: 1 },
  catCount: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.full },

  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder, gap: 10 },
  itemDone: { opacity: 0.5 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },
  itemNameDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  optional: { color: theme.colors.textMuted, fontStyle: 'italic', fontSize: theme.fontSize.xs },
  itemNote: { fontSize: 11, color: theme.colors.textMuted, fontStyle: 'italic', marginTop: 1 },

  tipsSection: { marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  tipsTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  tipDot: { color: theme.colors.accent, fontSize: 14, marginRight: 8, marginTop: 1 },
  tipText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },

  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  disclaimerText: { flex: 1, fontSize: 11, color: theme.colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
