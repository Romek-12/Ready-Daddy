import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../theme';
import Icon from './Icon';

interface CostItem {
  id: string;
  name: string;
  minCost: number;
  maxCost: number;
  note?: string;
  optional?: boolean;
}

interface Category {
  title: string;
  icon: string;
  color: string;
  items: CostItem[];
}

interface TrimesterData {
  title: string;
  subtitle: string;
  color: string;
  categories: Category[];
}

export default function CostCalculator() {
  const { theme } = useTheme();

  const getTrimestersData = (theme: Theme): TrimesterData[] => [
    {
      title: 'I Trymestr',
      subtitle: '1-12 tydzień · Pierwsze badania i wizyty u specjalistów',
      color: theme.colors.trimester1,
      categories: [
        {
          title: 'Wizyty lekarskie', icon: 'hospital', color: theme.colors.birth,
          items: [
            { id: 't1-w1', name: 'Pierwsza wizyta u ginekologa (potwierdzenie ciąży)', minCost: 150, maxCost: 400, note: 'Konsultacja, założenie karty ciąży, cytologia' },
            { id: 't1-w2', name: 'Kolejne wizyty kontrolne (1-2 wizyty)', minCost: 150, maxCost: 800 },
          ],
        },
        {
          title: 'Badania laboratoryjne', icon: 'science', color: theme.colors.dadModule,
          items: [
            { id: 't1-b1', name: 'Pakiet badań z krwi i moczu (I trymestr)', minCost: 500, maxCost: 700 },
          ],
        },
        {
          title: 'Badania USG i prenatalne', icon: 'fetus', color: theme.colors.primary,
          items: [
            { id: 't1-u1', name: 'USG wczesnej ciąży (6-10 tydzień)', minCost: 200, maxCost: 350 },
            { id: 't1-u2', name: 'USG genetyczne + test PAPP-A', minCost: 350, maxCost: 400 },
            { id: 't1-u3', name: 'Test wolnego DNA płodowego NIPT (np. NIFTY Pro, Sanco)', minCost: 2000, maxCost: 2000, optional: true },
          ],
        },
        {
          title: 'Suplementacja i Leki', icon: 'tip', color: theme.colors.accent,
          items: [
            { id: 't1-s1', name: 'Witaminy dla kobiet w ciąży (I trymestr)', minCost: 150, maxCost: 390 },
          ],
        },
      ],
    },
    {
      title: 'II Trymestr',
      subtitle: '13-26 tydzień · Czas intensywnego wzrostu dziecka, USG połówkowe',
      color: theme.colors.trimester2,
      categories: [
        {
          title: 'Wizyty lekarskie', icon: 'hospital', color: theme.colors.birth,
          items: [
            { id: 't2-w1', name: 'Wizyty kontrolne u ginekologa (2-3 wizyty)', minCost: 300, maxCost: 1200 },
            { id: 't2-w2', name: 'Wizyta u diabetologa', minCost: 200, maxCost: 200, optional: true, note: 'w przypadku zdiagnozowania cukrzycy ciążowej' },
          ],
        },
        {
          title: 'Badania laboratoryjne', icon: 'science', color: theme.colors.dadModule,
          items: [
            { id: 't2-b1', name: 'Morfologia (przy dwóch wizytach)', minCost: 10, maxCost: 16 },
            { id: 't2-b2', name: 'Badanie ogólne moczu (przy dwóch wizytach)', minCost: 10, maxCost: 16 },
            { id: 't2-b3', name: 'Test obciążenia glukozą OGTT', minCost: 20, maxCost: 40 },
            { id: 't2-b4', name: 'Ocena czystości pochwy (biocenoza)', minCost: 30, maxCost: 50, note: 'Badanie zwykle około 1-2 razy.' },
          ],
        },
        {
          title: 'Badania USG i prenatalne', icon: 'fetus', color: theme.colors.primary,
          items: [
            { id: 't2-u1', name: 'USG połówkowe (18-22 tydzień)', minCost: 200, maxCost: 400 },
            { id: 't2-u2', name: 'USG 3D/4D (pamiątkowe)', minCost: 250, maxCost: 500, optional: true },
          ],
        },
        {
          title: 'Suplementacja', icon: 'tip', color: theme.colors.accent,
          items: [
            { id: 't2-s1', name: 'Witaminy dla kobiet w ciąży (II trymestr)', minCost: 175, maxCost: 455 },
            { id: 't2-s2', name: 'Dodatkowe DHA', minCost: 105, maxCost: 210, note: 'jeśli brakuje w diecie' },
            { id: 't2-s3', name: 'Żelazo na receptę', minCost: 70, maxCost: 193, optional: true, note: 'przy potwierdzonej anemii' },
          ],
        },
      ],
    },
    {
      title: 'III Trymestr',
      subtitle: '27-40 tydzień · Ostatnie przygotowania do porodu',
      color: theme.colors.trimester3,
      categories: [
        {
          title: 'Wizyty lekarskie', icon: 'hospital', color: theme.colors.birth,
          items: [
            { id: 't3-w1', name: 'Wizyty kontrolne u ginekologa (ok. 3-5 wizyt)', minCost: 450, maxCost: 2000 },
            { id: 't3-w2', name: 'Konsultacja z anestezjologiem do znieczulenia', minCost: 180, maxCost: 200, optional: true },
            { id: 't3-w3', name: 'Konsultacja u fizjoterapeuty uroginekologicznego', minCost: 180, maxCost: 200, optional: true },
          ],
        },
        {
          title: 'Badania laboratoryjne', icon: 'science', color: theme.colors.dadModule,
          items: [
            { id: 't3-b1', name: 'Morfologia krwi', minCost: 10, maxCost: 16 },
            { id: 't3-b2', name: 'Badanie ogólne moczu', minCost: 10, maxCost: 16 },
            { id: 't3-b3', name: 'Posiew z pochwy i odbytu (GBS)', minCost: 30, maxCost: 40 },
          ],
        },
        {
          title: 'Badania USG i KTG', icon: 'fetus', color: theme.colors.primary,
          items: [
            { id: 't3-u1', name: 'USG III trymestru', minCost: 350, maxCost: 480 },
            { id: 't3-u2', name: 'Zapis KTG (po 36. tygodniu)', minCost: 300, maxCost: 750 },
            { id: 't3-u3', name: 'Echo Serca Płodu', minCost: 450, maxCost: 450, optional: true },
          ],
        },
        {
          title: 'Przygotowanie do Edukacji Rodzicielskiej', icon: 'menu-book', color: theme.colors.checkups,
          items: [
            { id: 't3-sr1', name: 'Szkoła rodzenia (komercyjna prywatna)', minCost: 200, maxCost: 600, optional: true },
          ],
        },
        {
          title: 'Suplementacja i Leki', icon: 'tip', color: theme.colors.accent,
          items: [
            { id: 't3-s1', name: 'Witaminy + DHA (kobieta w ciąży)', minCost: 280, maxCost: 665 },
            { id: 't3-s2', name: 'Magnez (leki zalecone od lekarza)', minCost: 70, maxCost: 140, note: 'w przypadku dolegliwości skurczowych' },
          ],
        },
      ],
    },
    {
      title: 'IV Trymestr (Połóg)',
      subtitle: '0-12 tygodni po porodzie · Zdrowie matki w okresie połogu',
      color: theme.colors.fourthTrimester,
      categories: [
        {
          title: 'Wizyty kontrolne u specjalistów', icon: 'couple', color: theme.colors.partner,
          items: [
            { id: 't4-w1', name: 'Wizyta kontrolna u ginekologa (po 6 tygodniach połogu)', minCost: 150, maxCost: 300 },
            { id: 't4-w2', name: 'Porada Doradcy Laktacyjnego', minCost: 150, maxCost: 250 },
            { id: 't4-w3', name: 'Fizjoterapia uroginekologiczna poporodowa', minCost: 750, maxCost: 2200 },
            { id: 't4-w4', name: 'Psychoterapia wspierająca (okołoporodowa)', minCost: 1900, maxCost: 4900, optional: true },
          ],
        },
        {
          title: 'Opieka medyczna i pakiety noworodka', icon: 'baby', color: theme.colors.primary,
          items: [
            { id: 't4-p1', name: 'Badania bioderek u fizjoterapeuty lub lekarza USG', minCost: 0, maxCost: 600, note: 'Na NFZ często bardzo długi czas oczekiwania, często decydujemy się na pójście prywatne' },
          ],
        },
        {
          title: 'Suplementacja Matki Karmiącej', icon: 'tip', color: theme.colors.accent,
          items: [
            { id: 't4-s1', name: 'Witaminy dla karmiącej (np. Prenatal DHA)', minCost: 180, maxCost: 450 },
          ],
        },
      ],
    },
  ];

  const TRIMESTERS = React.useMemo(() => getTrimestersData(theme), [theme]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [expandedTri, setExpandedTri] = useState<number | null>(null);
  const [userCosts, setUserCosts] = useState<Record<string, string>>({});

  const toggleTrimester = (idx: number) => {
    setExpandedTri(expandedTri === idx ? null : idx);
  };

  const setUserCost = (id: string, value: string) => {
    // Allow digits, one comma or period, max 2 decimal places
    let cleaned = value.replace(/[^0-9.,]/g, '');
    cleaned = cleaned.replace(',', '.');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts[1];
    if (parts.length === 2 && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    setUserCosts(prev => ({ ...prev, [id]: cleaned }));
  };

  const parseCost = (val: string | undefined): number => {
    if (!val || val.length === 0) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  const getItemCost = (item: CostItem): number => {
    return parseCost(userCosts[item.id]);
  };

  const getCategoryTotal = (cat: Category): number => {
    return cat.items.reduce((sum, item) => sum + getItemCost(item), 0);
  };

  const getOtherCost = (tIdx: number): number => {
    return parseCost(userCosts[`other-m-${tIdx}`]);
  };

  const getTrimesterTotal = (tri: TrimesterData, tIdx: number): number => {
    return tri.categories.reduce((sum, cat) => sum + getCategoryTotal(cat), 0) + getOtherCost(tIdx);
  };

  const grandTotal = useMemo(() => {
    return TRIMESTERS.reduce((sum, tri, tIdx) => sum + getTrimesterTotal(tri, tIdx), 0);
  }, [userCosts]);

  const fmt = (n: number) => n.toLocaleString('pl-PL') + ' zł';

  return (
    <ScrollView style={s.c} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Icon name="calculate" size={48} color={theme.colors.planning} />
        <Text style={s.title}>Kalkulator Kosztów</Text>
        <Text style={s.sub}>Śledź wydatki związane z ciążą i wyprawką</Text>
      </View>

      {/* Grand total card */}
      <View style={s.grandTotal}>
        <Text style={s.grandLabel}>Dotychczasowy koszt:</Text>
        <View style={s.grandRight}>
          <Text style={s.grandValue}>{fmt(grandTotal)}</Text>
        </View>
      </View>

      {TRIMESTERS.map((tri, tIdx) => {
        const isExpanded = expandedTri === tIdx;
        const triTotal = getTrimesterTotal(tri, tIdx);

        return (
          <View key={tIdx} style={s.triSection}>
            <TouchableOpacity style={[s.triHeader, { borderLeftColor: tri.color }]} onPress={() => toggleTrimester(tIdx)}>
              <View style={s.triHeaderLeft}>
                <Text style={[s.triTitle, { color: tri.color }]}>{tri.title}</Text>
                <Text style={s.triSubtitle}>{tri.subtitle}</Text>
              </View>
              <View style={s.triHeaderRight}>
                <Text style={[s.triTotal, { color: tri.color }]}>{fmt(triTotal)}</Text>
                <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={s.triContent}>
                {tri.categories.map((cat, cIdx) => (
                  <View key={cIdx} style={s.catSection}>
                    <View style={s.catHeader}>
                      <Icon name={cat.icon} size={18} color={cat.color} />
                      <Text style={s.catTitle}> {cat.title}</Text>
                      <Text style={[s.catTotal, { color: cat.color }]}>{fmt(getCategoryTotal(cat))}</Text>
                    </View>

                    {cat.items.map(item => {
                      const userVal = userCosts[item.id] || '';
                      return (
                        <View key={item.id} style={s.costItem}>
                          <View style={s.costItemTop}>
                            <View style={s.costNameCol}>
                              <Text style={s.costName}>
                                {item.optional && <Text style={s.optional}>(opcja) </Text>}
                                {item.name}
                              </Text>
                              <View style={s.costMeta}>
                                {item.note && <Text style={s.costNote}>{item.note}</Text>}
                                <Text style={s.costRange}>{item.minCost}–{item.maxCost} zł</Text>
                              </View>
                            </View>
                            <View style={s.costInputCol}>
                              <TextInput
                                style={s.costInput}
                                value={userVal}
                                onChangeText={(v) => setUserCost(item.id, v)}
                                placeholder="—"
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="decimal-pad"
                                maxLength={9}
                              />
                              <Text style={s.zlText}>zł</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {/* Inne */}
                <View style={s.otherRow}>
                  <View style={s.otherLeft}>
                    <Icon name="arrow-forward" size={16} color={theme.colors.textMuted} />
                    <Text style={s.otherLabel}> Inne własne wydatki w tym trymestrze</Text>
                  </View>
                  <View style={s.costInputCol}>
                    <TextInput
                      style={s.costInput}
                      value={userCosts[`other-m-${tIdx}`] || ''}
                      onChangeText={(v) => setUserCost(`other-m-${tIdx}`, v)}
                      placeholder="—"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    <Text style={s.zlText}>zł</Text>
                  </View>
                </View>

                {/* Trimester summary */}
                <View style={[s.triSummary, { borderTopColor: tri.color + '30' }]}>
                  <Text style={s.triSumLabel}>Suma dla {tri.title}:</Text>
                  <Text style={[s.triSumValue, { color: tri.color }]}>{fmt(triTotal)}</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}

      <View style={s.disclaimer}>
        <Icon name="info" size={16} color={theme.colors.textMuted} />
        <Text style={s.disclaimerText}>Powyższy kalkulator służy wyłącznie do celów poglądowych. Ostateczne ceny i częstotliwości badań, w tym z udziałem NFZ, ustala placówka oraz lekarz w oparciu o stan medyczny matki i dziecka.</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.planning, marginTop: theme.spacing.sm },
  sub: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },

  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl, backgroundColor: theme.colors.planning, borderRadius: theme.borderRadius.xl, paddingHorizontal: theme.spacing.lg, paddingVertical: 24, minHeight: 110 },
  grandLabel: { fontSize: theme.fontSize.lg, color: 'rgba(255,255,255,0.9)', fontWeight: theme.fontWeight.bold, flex: 1, marginRight: theme.spacing.md },
  grandRight: { alignItems: 'flex-end' },
  grandValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.white },

  triSection: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  triHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, elevation: 1 },
  triHeaderLeft: { flex: 1 },
  triTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },
  triSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  triHeaderRight: { alignItems: 'flex-end' },
  triTotal: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, marginBottom: 2 },

  triContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, marginTop: 4, padding: theme.spacing.xl, elevation: 1 },

  catSection: { marginBottom: theme.spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  catTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text, flex: 1 },
  catTotal: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },

  costItem: { marginBottom: theme.spacing.md, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder },
  costItemTop: { flexDirection: 'row', alignItems: 'flex-start' },
  costNameCol: { flex: 1, marginRight: theme.spacing.sm },
  costName: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },
  optional: { color: theme.colors.textMuted, fontStyle: 'italic', fontSize: theme.fontSize.xs },
  costMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  costNote: { fontSize: 10, color: theme.colors.textMuted, fontStyle: 'italic' },
  costRange: { fontSize: 10, color: theme.colors.textMuted },
  costInputCol: { flexDirection: 'row', alignItems: 'center' },
  costInput: { width: 70, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 5, fontSize: theme.fontSize.sm, color: theme.colors.text, textAlign: 'right', borderWidth: 1, borderColor: theme.colors.cardBorder },
  zlText: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: 3 },

  otherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: theme.spacing.sm },
  otherLeft: { flexDirection: 'row', alignItems: 'center' },
  otherLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic' },

  triSummary: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: theme.spacing.md, borderTopWidth: 1, marginTop: theme.spacing.sm },
  triSumLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  triSumValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },

  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, padding: theme.spacing.xl, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.xl },
  disclaimerText: { flex: 1, fontSize: 11, color: theme.colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
