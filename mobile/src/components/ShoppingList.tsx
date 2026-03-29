import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';
import Icon from '../components/Icon';
import { usePersistedChecklist } from '../hooks/usePersistedChecklist';

interface ShopItem {
  id: string;
  name: string;
  minCost: number;
  maxCost: number;
  qty?: string;
  note?: string;
  optional?: boolean;
}

interface Category {
  title: string;
  icon: string;
  color: string;
  note?: string;
  items: ShopItem[];
}

interface TrimesterData {
  title: string;
  subtitle: string;
  color: string;
  tip?: string;
  categories: Category[];
}

const getTrimestersData = (theme: any): TrimesterData[] => [
  {
    title: 'I Trymestr',
    subtitle: 'Wczesny etap – skup się na komforcie przyszłej mamy',
    color: theme.colors.trimester1,
    tip: 'Brzuszek jeszcze nie jest duży. Wstrzymajcie się z zakupem typowej odzieży ciążowej i mebelków.',
    categories: [
      {
        title: 'Komfort i kosmetyki dla ciężej', icon: 'couple', color: theme.colors.partner,
        items: [
          { id: 's1-1', name: 'Krem/olejek na rozstępy w ciąży', minCost: 30, maxCost: 120, note: 'Do smarowania na co dzień' },
          { id: 's1-2', name: 'Wygodny, bezszwowy biustonosz', minCost: 60, maxCost: 150, qty: '1–2 szt.' },
          { id: 's1-3', name: 'Miękka bielizna / figi (rozciągliwe)', minCost: 30, maxCost: 60, qty: '3–5 szt.' },
        ],
      },
      {
        title: 'Organizacja i dokumenty', icon: 'checklist', color: theme.colors.checkups,
        items: [
          { id: 's1-4', name: 'Pamiętnik / segregator ciąży', minCost: 20, maxCost: 60, optional: true },
          { id: 's1-5', name: 'Teczka na wyniki badań i USG', minCost: 10, maxCost: 30 },
        ],
      },
    ],
  },
  {
    title: 'II Trymestr',
    subtitle: 'Najlepszy czas na większe zakupy i przygotowanie pokoju',
    color: theme.colors.trimester2,
    tip: 'Zacznijcie planować zakupy fotelika i wózka – na niektóre modele z zagranicy czeka się nawet kilka miesięcy!',
    categories: [
      {
        title: 'Odzież ciążowa i wygoda', icon: 'couple', color: theme.colors.partner,
        items: [
          { id: 's2-1', name: 'Legginsy ciążowe z panelem', minCost: 100, maxCost: 360, qty: '2–3 pary' },
          { id: 's2-2', name: 'Spodnie/jeansy ciążowe', minCost: 80, maxCost: 400, qty: '1–2 pary' },
          { id: 's2-3', name: 'Poduszka ciążowa rogowa (wąż)', minCost: 100, maxCost: 300, note: 'ok. 20. tygodnia do spania na boku' },
          { id: 's2-4', name: 'Wygodne, płaskie buty wsuwane', minCost: 100, maxCost: 300, note: 'stopy często zaczynają puchnąć' },
          { id: 's2-5', name: 'Rajstopy ciążowe', minCost: 40, maxCost: 100 },
        ],
      },
      {
        title: 'Pojazdy i wyposażenie domu', icon: 'baby', color: theme.colors.primary,
        note: 'Te rzeczy są najdroższe, więc lepiej odłożyć wydatki w czasie.',
        items: [
          { id: 's2-6', name: 'Wózek 2w1 lub 3w1 (gondola, spacerówka)', minCost: 2000, maxCost: 5000 },
          { id: 's2-7', name: 'Fotelik samochodowy 0-13 kg', minCost: 500, maxCost: 2000 },
          { id: 's2-8', name: 'Łóżeczko dostawne lub drewniane (120x60)', minCost: 500, maxCost: 1500 },
          { id: 's2-9', name: 'Materac do łóżeczka (twardszy)', minCost: 200, maxCost: 800 },
          { id: 's2-10', name: 'Kosz Mojżesza (alternatywa do salonu)', minCost: 200, maxCost: 700, optional: true },
          { id: 's2-11', name: 'Komoda z przewijakiem / przewijak na łóżeczko', minCost: 200, maxCost: 800 },
        ],
      },
      {
        title: 'Higiena i sprzęt medyczny', icon: 'science', color: theme.colors.dadModule,
        items: [
          { id: 's2-12', name: 'Wanienka (ze stojakiem lub składana)', minCost: 200, maxCost: 500 },
          { id: 's2-13', name: 'Termometr do wody i pokojowy', minCost: 20, maxCost: 50 },
          { id: 's2-14', name: 'Termometr bezdotykowy na podczerwień', minCost: 60, maxCost: 200 },
          { id: 's2-15', name: 'Aspirator do nosa (np. Katarek) + sól fizjologiczna', minCost: 80, maxCost: 200 },
          { id: 's2-16', name: 'Nawilżacz powietrza (ultradźwiękowy/ewaporacyjny)', minCost: 50, maxCost: 100, optional: true },
        ],
      },
    ],
  },
  {
    title: 'III Trymestr',
    subtitle: 'Wyprawka szpitalna i domowa dla noworodka',
    color: theme.colors.trimester3,
    categories: [
      {
        title: 'Pakujemy torbę mamy', icon: 'couple', color: theme.colors.partner,
        items: [
          { id: 's3-1', name: 'Koszula nocna rozpinana z przodu (do karmienia)', minCost: 80, maxCost: 200, qty: '2–3 szt.' },
          { id: 's3-2', name: 'Koszula do porodu (luźna, stara)', minCost: 60, maxCost: 150 },
          { id: 's3-3', name: 'Biustonosz do karmienia', minCost: 160, maxCost: 600, qty: '2–3 szt.', note: 'najlepiej kupić pod koniec ciąży' },
          { id: 's3-4', name: 'Wkładki laktacyjne', minCost: 30, maxCost: 60 },
        ],
      },
      {
        title: 'Ubranka noworodkowe (roz. 50-62)', icon: 'baby', color: theme.colors.primary,
        items: [
          { id: 's3-5', name: 'Body rozpinane z przodu (krótki/długi rękaw)', minCost: 90, maxCost: 500, qty: '6–10 szt.' },
          { id: 's3-6', name: 'Pajacyki (jednoczęściowe, pełne nogi)', minCost: 120, maxCost: 600, qty: '4–6 szt.' },
          { id: 's3-7', name: 'Śpiochy i kaftaniki', minCost: 120, maxCost: 320, qty: '3–4 szt.' },
          { id: 's3-8', name: 'Cienkie czapeczki bawełniane (po kąpieli / wyjście)', minCost: 40, maxCost: 150, qty: '2–3 szt.' },
          { id: 's3-9', name: 'Skarpetki i „niedrapki”', minCost: 30, maxCost: 120, qty: 'kilka par' },
          { id: 's3-10', name: 'Kombinezon jesienno-zimowy (zależnie od pory roku)', minCost: 80, maxCost: 200 },
          { id: 's3-11', name: 'Pieluszki tetrowe i bambusowe/muślinowe', minCost: 120, maxCost: 480, qty: '4–6 szt.' },
          { id: 's3-12', name: 'Rożek niemowlęcy (usztywniany lub miękki)', minCost: 60, maxCost: 300, qty: '1–2 szt.' },
        ],
      },
      {
        title: 'Akcesoria do snu i owijania', icon: 'bedtime', color: theme.colors.planning,
        items: [
          { id: 's3-13', name: 'Prześcieradło z gumką do łóżeczka / dostawki', minCost: 200, maxCost: 600, qty: '2 komplety' },
          { id: 's3-14', name: 'Ochraniacz do łóżeczka na szczebelki', minCost: 50, maxCost: 200 },
          { id: 's3-15', name: 'Cieńszy i grubszy kocyk', minCost: 100, maxCost: 450, qty: '2–3 szt.' },
          { id: 's3-16', name: 'Śpiworek do spania zamiast pościeli', minCost: 160, maxCost: 400, qty: '2 szt.' },
        ],
      },
      {
        title: 'Karmienie piersią i butelką', icon: 'baby-bottle', color: theme.colors.accent,
        items: [
          { id: 's3-17', name: 'Laktator elektryczny lub ręczny', minCost: 100, maxCost: 800 },
          { id: 's3-18', name: 'Butelki startowe na mleko i smoczki uspokajające', minCost: 90, maxCost: 480, qty: '3–6 szt.' },
          { id: 's3-19', name: 'Sterylizator do butelek / woreczki', minCost: 100, maxCost: 400 },
          { id: 's3-20', name: 'Podgrzewacz do butelek', minCost: 100, maxCost: 300 },
          { id: 's3-21', name: 'Miękka rogowa poduszka do karmienia piersią (kura)', minCost: 100, maxCost: 250 },
          { id: 's3-22', name: 'Maść z lanoliną / kompresy na brodawki dla mamy', minCost: 40, maxCost: 80 },
        ],
      },
      {
        title: 'Przewijanie i kosmetyki dla dziecka', icon: 'science', color: theme.colors.dadModule,
        items: [
          { id: 's3-23', name: 'Chusteczki nawilżane (water wipes)', minCost: 30, maxCost: 80, qty: '3–4 opak.' },
          { id: 's3-24', name: 'Pieluszki jednorazowe newborn', minCost: 60, maxCost: 120, note: 'Rozmiar 1 – nie kupuj za dużo, noworodki szybko rosną!' },
          { id: 's3-25', name: 'Krem do pupy z tlenkiem cynku i na co dzień (np. Bepanthen)', minCost: 15, maxCost: 40 },
          { id: 's3-26', name: 'Płyn do kąpieli/żel od 1. dnia życia (emolienty)', minCost: 20, maxCost: 50 },
          { id: 's3-27', name: 'Patyczki higieniczne z ogranicznikiem i sterylne gaziki', minCost: 20, maxCost: 40 },
          { id: 's3-28', name: 'Ręczniki z kapturkiem (frotte) do osuszania', minCost: 120, maxCost: 300, qty: '2 szt.' },
        ],
      },
      {
        title: 'Wyprawka poporodowa i higiena intymna (do 36 tyg.)', icon: 'luggage', color: theme.colors.birth,
        items: [
          { id: 's3-29', name: 'Jednorazowe lub wielorazowe siateczkowe majtki poporodowe', minCost: 15, maxCost: 30, qty: '6–10 szt.' },
          { id: 's3-30', name: 'Podkłady poporodowe grube (podpaski XXL)', minCost: 20, maxCost: 40, qty: '20+ szt.' },
          { id: 's3-31', name: 'Podkłady higieniczne na łóżko', minCost: 15, maxCost: 30 },
        ],
      },
      {
        title: 'Noszenie na sobie i wychodzenie', icon: 'baby', color: theme.colors.primary,
        items: [
          { id: 's3-32', name: 'Chusta tkana do noszenia (dla pasjonatów)', minCost: 150, maxCost: 500 },
          { id: 's3-33', name: 'Nosidełko ergonomiczne (bez miękkich nosideł wisiadeł!)', minCost: 300, maxCost: 1200, optional: true, note: 'Tylko dla niemowląt potrafiących już stabilnie siedzieć lub polecane hybrydy' },
        ],
      },
    ],
  },
  {
    title: 'IV Trymestr',
    subtitle: 'Miesiące po porodzie · Rzeczy pomagające zapanować nad rutyną',
    color: theme.colors.fourthTrimester,
    categories: [
      {
        title: 'Gadżety ułatwiające regenerację dla mamy', icon: 'couple', color: theme.colors.partner,
        items: [
          { id: 's4-1', name: 'Zimne kompresy żelowe na krocze / bliznę', minCost: 60, maxCost: 200 },
          { id: 's4-2', name: 'Luźne odzienie do karmienia po domu', minCost: 60, maxCost: 150 },
          { id: 's4-3', name: 'Bluzki z suwakami przy piersiach', minCost: 60, maxCost: 150, qty: '2–3 szt.' },
          { id: 's4-4', name: 'Maść żelowa na przyspieszenie gojenia blizn', minCost: 30, maxCost: 80 },
          { id: 's4-5', name: 'Kółko poporodowe / dmuchane do siedzenia', minCost: 50, maxCost: 150, note: 'w razie nacięcia krocza' },
        ],
      },
      {
        title: 'Pierwsze rozrywki i opieka domowa', icon: 'baby', color: theme.colors.primary,
        note: 'Dokup po narodzinach, zależnie od tego na co dziecko będzie reagować i co okaże się problemem.',
        items: [
          { id: 's4-6', name: 'Leżaczek-bujaczek ergonomiczny (nie nadużywać do snu!)', minCost: 200, maxCost: 800, optional: true },
          { id: 's4-7', name: 'Mata edukacyjna', minCost: 100, maxCost: 400, optional: true },
          { id: 's4-8', name: 'Karuzela nad łóżeczko / rzutnik sufitowy', minCost: 80, maxCost: 300, optional: true },
          { id: 's4-9', name: 'Niania elektroniczna z kamerą lub monitorem oddechu', minCost: 150, maxCost: 700 },
        ],
      },
    ],
  },
];

export default function ShoppingList() {
  const { theme } = useTheme();
  // Use useMemo to get the trimester data based on the theme
  const TRIMESTERS = React.useMemo(() => getTrimestersData(theme), [theme]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [expandedTri, setExpandedTri] = useState<number | null>(null);
  const [userCosts, setUserCosts] = useState<Record<string, string>>({});
  const { checked, toggleCheck } = usePersistedChecklist('shopping');

  const toggleTrimester = (idx: number) => {
    setExpandedTri(expandedTri === idx ? null : idx);
  };

  const setUserCost = (id: string, value: string) => {
    // Allow digits, one comma or period, max 2 decimal places
    let cleaned = value.replace(/[^0-9.,]/g, '');
    // Normalize: replace comma with period for consistency
    cleaned = cleaned.replace(',', '.');
    // Only allow one period
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts[1];
    // Max 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    setUserCosts(prev => ({ ...prev, [id]: cleaned }));
  };

  const parseCost = (val: string | undefined): number => {
    if (!val || val.length === 0) return 0;
    return parseFloat(val.replace(',', '.')) || 0;
  };

  const getItemCost = (item: ShopItem): number => {
    return parseCost(userCosts[item.id]);
  };

  const getCategoryTotal = (cat: Category): number => {
    return cat.items.reduce((sum, item) => sum + getItemCost(item), 0);
  };

  const getOtherCost = (tIdx: number): number => {
    return parseCost(userCosts[`other-s-${tIdx}`]);
  };

  const getTrimesterTotal = (tri: TrimesterData, tIdx: number): number => {
    return tri.categories.reduce((sum, cat) => sum + getCategoryTotal(cat), 0) + getOtherCost(tIdx);
  };

  const grandTotal = useMemo(() => {
    return TRIMESTERS.reduce((sum, tri, tIdx) => sum + getTrimesterTotal(tri, tIdx), 0);
  }, [userCosts]);

  const totalChecked = useMemo(() => {
    return Object.values(checked).filter(Boolean).length;
  }, [checked]);

  const totalItems = TRIMESTERS.reduce((sum, tri) => sum + tri.categories.reduce((s, c) => s + c.items.length, 0), 0);

  const fmt = (n: number) => n.toLocaleString('pl-PL') + ' zł';

  return (
    <ScrollView style={s.c} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Icon name="shopping-cart" size={48} color={theme.colors.accent} />
        <Text style={s.title}>Lista zakupów</Text>
        <Text style={s.sub}>Kompletna wyprawka dla mamy i dziecka z kalkulatorem</Text>
      </View>

      {/* Grand total */}
      <View style={s.grandTotal}>
        <Text style={s.grandLabel}>Dotychczasowy koszt:</Text>
        <View style={s.grandRight}>
          <Text style={s.grandValue}>{fmt(grandTotal)}</Text>
          <Text style={s.grandCheckLabel}>{totalChecked}/{totalItems} odznaczone</Text>
        </View>
      </View>

      {TRIMESTERS.map((tri, tIdx) => {
        const isExpanded = expandedTri === tIdx;
        const triTotal = getTrimesterTotal(tri, tIdx);
        const triChecked = tri.categories.reduce((s, c) => s + c.items.filter(i => checked[i.id]).length, 0);
        const triItems = tri.categories.reduce((s, c) => s + c.items.length, 0);

        return (
          <View key={tIdx} style={s.triSection}>
            <TouchableOpacity style={[s.triHeader, { borderLeftColor: tri.color }]} onPress={() => toggleTrimester(tIdx)}>
              <View style={s.triHeaderLeft}>
                <Text style={[s.triTitle, { color: tri.color }]}>{tri.title}</Text>
                <Text style={s.triSubtitle} numberOfLines={2}>{tri.subtitle}</Text>
              </View>
              <View style={s.triHeaderRight}>
                <Text style={[s.triTotal, { color: tri.color }]}>{fmt(triTotal)}</Text>
                <Text style={s.triCount}>{triChecked}/{triItems}</Text>
                <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={s.triContent}>
                {tri.tip && (
                  <View style={s.tipBox}>
                    <Icon name="lightbulb" size={16} color={theme.colors.accent} />
                    <Text style={s.tipText}> {tri.tip}</Text>
                  </View>
                )}

                {tri.categories.map((cat, cIdx) => (
                  <View key={cIdx} style={s.catSection}>
                    <View style={s.catHeader}>
                      <Icon name={cat.icon} size={18} color={cat.color} />
                      <Text style={s.catTitle}> {cat.title}</Text>
                      <Text style={[s.catTotal, { color: cat.color }]}>{fmt(getCategoryTotal(cat))}</Text>
                    </View>
                    {cat.note && <Text style={s.catNote}>{cat.note}</Text>}

                    {cat.items.map(item => {
                      const userVal = userCosts[item.id] || '';
                      const isChecked = checked[item.id] || false;
                      return (
                        <View key={item.id} style={[s.shopItem, isChecked && s.shopItemChecked]}>
                          <TouchableOpacity style={s.checkBtn} onPress={() => toggleCheck(item.id)}>
                            <Icon name={isChecked ? 'check-circle' : 'checkbox-blank'} size={22} color={isChecked ? theme.colors.primary : theme.colors.textMuted} />
                          </TouchableOpacity>
                          <View style={s.shopInfo}>
                            <Text style={[s.shopName, isChecked && s.shopNameChecked]}>
                              {item.optional && <Text style={s.optional}>(opcja) </Text>}
                              {item.name}
                            </Text>
                            <View style={s.shopMeta}>
                              {item.qty && <Text style={s.shopQty}>{item.qty}</Text>}
                              {item.note && <Text style={s.shopNote}>{item.note}</Text>}
                              <Text style={s.shopRange}>{item.minCost}–{item.maxCost} zł</Text>
                            </View>
                          </View>
                          <View style={s.shopInputCol}>
                            <TextInput
                              style={s.shopInput}
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
                      );
                    })}
                  </View>
                ))}

                {/* Inne */}
                <View style={s.otherRow}>
                  <View style={s.otherLeft}>
                    <Icon name="arrow-forward" size={16} color={theme.colors.textMuted} />
                    <Text style={s.otherLabel}> Inne własne wydatki z kategorii</Text>
                  </View>
                  <View style={s.shopInputCol}>
                    <TextInput
                      style={s.shopInput}
                      value={userCosts[`other-s-${tIdx}`] || ''}
                      onChangeText={(v) => setUserCost(`other-s-${tIdx}`, v)}
                      placeholder="—"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                    <Text style={s.zlText}>zł</Text>
                  </View>
                </View>

                <View style={[s.triSummary, { borderTopColor: tri.color + '30' }]}>
                  <Text style={s.triSumLabel}>Suma dla wpisów {tri.title}:</Text>
                  <Text style={[s.triSumValue, { color: tri.color }]}>{fmt(triTotal)}</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.accent, marginTop: theme.spacing.sm },
  sub: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },

  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl, backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.xl, paddingHorizontal: theme.spacing.lg, paddingVertical: 24, minHeight: 110 },
  grandLabel: { fontSize: theme.fontSize.lg, color: 'rgba(0,0,0,0.8)', fontWeight: theme.fontWeight.bold, flex: 1, marginRight: theme.spacing.md },
  grandRight: { alignItems: 'flex-end' },
  grandValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.black },
  grandCheckLabel: { fontSize: theme.fontSize.xs, color: 'rgba(0,0,0,0.6)', marginTop: 4, fontWeight: theme.fontWeight.medium },

  triSection: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  triHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, elevation: 1 },
  triHeaderLeft: { flex: 1 },
  triTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },
  triSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  triHeaderRight: { alignItems: 'flex-end' },
  triTotal: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, marginBottom: 2 },
  triCount: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },

  triContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, marginTop: 4, padding: theme.spacing.xl, elevation: 1 },

  tipBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.accentLight, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  tipText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },

  catSection: { marginBottom: theme.spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  catTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text, flex: 1 },
  catTotal: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },
  catNote: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold, marginBottom: theme.spacing.sm, marginLeft: 26 },

  shopItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder },
  shopItemChecked: { opacity: 0.6 },
  checkBtn: { marginRight: 10 },
  shopInfo: { flex: 1, marginRight: 8 },
  shopName: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 19 },
  shopNameChecked: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  optional: { color: theme.colors.textMuted, fontStyle: 'italic', fontSize: theme.fontSize.xs },
  shopMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  shopQty: { fontSize: 10, color: theme.colors.primary, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  shopNote: { fontSize: 10, color: theme.colors.textMuted, fontStyle: 'italic' },
  shopRange: { fontSize: 10, color: theme.colors.textMuted },
  shopInputCol: { flexDirection: 'row', alignItems: 'center' },
  shopInput: { width: 70, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 5, fontSize: theme.fontSize.sm, color: theme.colors.text, textAlign: 'right', borderWidth: 1, borderColor: theme.colors.cardBorder },
  zlText: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: 3 },

  otherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: theme.spacing.sm },
  otherLeft: { flexDirection: 'row', alignItems: 'center' },
  otherLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic' },

  triSummary: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: theme.spacing.md, borderTopWidth: 1, marginTop: theme.spacing.sm },
  triSumLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  triSumValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },
});
