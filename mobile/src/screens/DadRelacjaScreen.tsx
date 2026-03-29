import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';

export default function DadRelacjaScreen() {
  const { theme } = useTheme();
  const st = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <ScrollView style={st.c}>
      <View style={st.header}>
        <Text style={st.title}>Budowanie relacji partnerskiej po narodzinach</Text>
        <Text style={st.sub}>
          Pojawienie się dziecka całkowicie zmienia dynamikę między dwojgiem dorosłych ludzi. Brak snu, stres i nagła zmiana dotychczasowych ról wystawiają związek na potężną próbę. Poniżej zebrano praktyczne wskazówki dotyczące utrzymania więzi na właściwych torach.
        </Text>
      </View>

      <View style={st.introCard}>
        <View style={st.introIconWrap}>
          <Text style={st.introEmoji}>💑</Text>
        </View>
        <View style={st.introContent}>
          <Text style={st.introLabel}>NOWY ETAP, NOWE WYZWANIA</Text>
          <Text style={st.introText}>
            Ustabilizowanie waszej relacji i unikanie zbędnych nieporozumień zadecyduje o atmosferze, w jakiej będzie wychowywało się dziecko. Świadome obniżenie oczekiwań w pierwszych tygodniach pomoże wam działać w zespole, zamiast rzucać sobie kłody pod nogi.
          </Text>
        </View>
      </View>

      <View style={st.sectionGrid}>
        {/* 01 Co się zmienia */}
        <View style={[st.card, st.cardRose]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: '#fb7185' }]}>01</Text>
              <Text style={st.cardTitle}>CO ZAZWYCZAJ SIĘ ZMIENIA</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>NOWY ROZDZIAŁ</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>⚠️</Text></View>
              <Text style={st.vText}>
                Narasta tendencja do <Text style={st.hlRose}>mimowolnej rywalizacji</Text> — licytacji, kto jest dzisiaj bardziej zmęczony, kto mniej spał, czyja praca/obowiązki były cięższe. To naturalny mechanizm obronny zmęczonego organizmu obu stron.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>💬</Text></View>
              <Text style={st.vText}>
                Spontaniczność oraz czas i jakość wieczornych pieszczot radykalnie spadają. Używajcie <Text style={st.hlWhite}>łagodnego języka bez domyślnych pretensji</Text>, kiedy zmęczenie fizyczne wygrywa z pożądaniem intymnym. To absolutna norma medyczna.
              </Text>
            </View>
          </View>
        </View>

        {/* 02 Komunikacja */}
        <View style={[st.card, st.cardPurple]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: '#a78bfa' }]}>02</Text>
              <Text style={st.cardTitle}>ZDROWA KOMUNIKACJA W KRYZYSIE</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>JAK ROZMAWIAĆ</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>💬</Text></View>
              <Text style={st.vText}>W skrajnym zmęczeniu drastycznie łatwo wejść w oceniający ton z wyrzutami. Kluczem jest formułowanie zdań od "Ja potrzeubje", zamiast od "Ty zawsze/nigdy".</Text>
            </View>
            
            <View style={st.quoteBad}>
              <Text style={st.quoteLabelBad}>❌ ZDANIA DESTRUKCYJNE — UNIKAJ ICH!</Text>
              <Text style={st.quoteTextBad}>„Traktujesz mnie jak powietrze. Ty zawsze myślisz, że tylko i wyłącznie ty jesteś najbardziej zmęczona w tym domu!"</Text>
            </View>
            
            <View style={st.quoteGood}>
              <Text style={st.quoteLabelGood}>✅ WZOROWY KOMUNIKAT NASTAWIONY NA POTRZEBĘ</Text>
              <Text style={st.quoteTextGood}>„Czuję, że oboje jedziemy na resztkach paliwa i nie mam już dzisiaj kompletnie energii. Bardzo potrzebuję, byśmy dzisiaj zamienili się w nocy obowiązkami."</Text>
            </View>

            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>⚠️</Text></View>
              <Text style={st.vText}>
                Pamiętajcie, że stoicie <Text style={st.hlWhite}>po jednej, tej samej stronie barykady</Text>. Matka, poprawiająca każdą twoją czynność nad dzieckiem ("Maternal gatekeeping") realizuje w ten sposób po prostu swój atawistyczny biologiczny lęk, nie po złości nakierowanej w Ciebie.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>⏱️</Text></View>
              <Text style={st.vText}>
                Wybuch kłótni o "błahostkę" zazwyczaj odsłania prawdziwy problem — <Text style={st.hlRose}>brak spersonalizowanego wsparcia, ukryty głód snu bądź samotność</Text>. Kłótnia z potwornym zmęczeniem z góry narzuca ton defensywny obojgu.
              </Text>
            </View>
          </View>
        </View>

        {/* 03 Podział obowiązków */}
        <View style={[st.card, st.cardBlue]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: '#34d399' }]}>03</Text>
              <Text style={st.cardTitle}>GRA W JEDNEJ DRUŻYNIE</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>WSPÓŁPRACA</Text>
            </View>
          </View>
          
          <View style={st.voiceLine}>
            <View style={st.vIconBlue}><Text style={st.vEmoji}>📝</Text></View>
            <Text style={st.vText}>
              Brak zdefiniowanego harmonogramu generuje konflikt od rozejścia "komu należy się w tej chwili relaks na kanapie". <Text style={st.hlWhite}>Bycie przy własnym dziecku nie jest „pomaganiem mamie”. Ty nie pomagasz - Ty budujesz własne, unikalne ojcostwo.</Text>
            </Text>
          </View>
          
          <View style={st.actionList}>
            <View style={st.actionItem}>
              <View style={st.aBulletGreen}><Text style={st.aBulletTextGreen}>A</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Asystowanie oraz podział nocnych czuwań</Text> — Jeśli tylko matka wyrazi zgodę, podzielcie nocne interwencje po połowie celem minimalizacji nagłego załamania zdrowia matki.
              </Text>
            </View>
            <View style={st.actionItem}>
              <View style={st.aBulletGreen}><Text style={st.aBulletTextGreen}>B</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Przejmij nawigację domową z urzędu</Text> — Codzienne zakupy, obiady lub logistyka starszych dzieci to pole, na którym twój brak inicjatywy podwoi frustrację partnerki zajętej karmieniem.
              </Text>
            </View>
            <View style={st.actionItem}>
              <View style={st.aBulletGreen}><Text style={st.aBulletTextGreen}>C</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Planowanie opieki medycznej noworodka</Text> — Ogarnianie aptek i wizyt szczepiennych to idealny moment by z odwagą i odpowiedzialnością odciążyć głowę matki od zbędnego obciążenia pamięciowego.
              </Text>
            </View>
          </View>
        </View>

        {/* 04 Bycie parą */}
        <View style={[st.card, st.cardAmber]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: '#fbbf24' }]}>04</Text>
              <Text style={st.cardTitle}>PODTRZYMYWANIE BLISKOŚCI</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>DROBNE O ISkry</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIconAmber}><Text style={st.vEmoji}>❤️</Text></View>
              <Text style={st.vText}>
                Chwile mikro-bliskości (5-10 minut skupienia w stu procentach na sobie podczas np. drzemki niemowlaka) są filarem przetrwania dorosłej więzi. <Text style={st.hlAmber}>Pocałunek po wejściu do domu musi dotyczyć jej, a nie noworodka.</Text> To banalny powrót z rangi spędzanego bez przerwy w ringu wspólnika powrotem do z powrotem roli kochanka. 
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>💡</Text></View>
              <Text style={st.vText}>
                Szereg małych wspierających działań jest dostrzegany bardziej z entuzjazmem niż np. wymuszony wyczyn z kwiatami. Pokaż partnerce, że nadal ją postrzegasz:
              </Text>
            </View>
          </View>

          <View style={st.gesturesRow}>
            <View style={st.gestureChip}><Text style={st.gestureEmoji}>🛁</Text><Text style={st.gestureText}>Przejęcie bez słowa zapowiedzi i uwolnienie wieczornego czasu matki na dłuższą od gorącej kąpieli</Text></View>
            <View style={st.gestureChip}><Text style={st.gestureEmoji}>💆</Text><Text style={st.gestureText}>Propozycje fizycznego i aktywnego pieszczenia wymęczonych po nocy karku i lędźwi u mamy</Text></View>
            <View style={st.gestureChip}><Text style={st.gestureEmoji}>🍵</Text><Text style={st.gestureText}>Systematyczne donoszenie do miejsca karmienia gorących herbat czy poduszek w opiecie rzutkowej</Text></View>
            <View style={st.gestureChip}><Text style={st.gestureEmoji}>🌙</Text><Text style={st.gestureText}>Poinstruowanie bliskich o potrzebie wsparcia rano, po najcięższej nieprzedziwniającej laktacji noce</Text></View>
          </View>
        </View>
      </View>

      <View style={st.footer}>
        <Text style={st.footerBrand}>PAPA • WIEDZA Twarda i Ochronna.</Text>
        <Text style={st.footerText}>Podtrzymywanie relacji romantycznych często jest traktowane marginalnie przez mężczyzn na korzyść bezosobowego załatwiania spraw z zadaniami noworodka. W konsekwencji ulegasz oddaleniu. Buduj to od początku dbając tak samo na i noworodka u relacji we was!</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.xl, paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8, letterSpacing: 0.5 },
  sub: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  
  introCard: { margin: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 16, borderWidth: 1, borderColor: theme.colors.cardBorder },
  introIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(167,139,250,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  introEmoji: { fontSize: 22 },
  introContent: { flex: 1 },
  introLabel: { fontSize: 10, fontWeight: 'bold', color: '#8b5cf6', marginBottom: 6, letterSpacing: 1.5 },
  introText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  
  sectionGrid: { paddingHorizontal: theme.spacing.lg, gap: 16 },
  card: { backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 16 },
  cardRose: { borderColor: 'rgba(251,113,133,0.3)', backgroundColor: 'rgba(251,113,133,0.05)' },
  cardPurple: { borderColor: 'rgba(167,139,250,0.3)', backgroundColor: 'rgba(167,139,250,0.05)' },
  cardBlue: { borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.05)' },
  cardAmber: { borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.05)' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  cardIndex: { color: '#8b5cf6', fontSize: 12, fontWeight: 'bold' },
  cardTitle: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  cardPill: { borderWidth: 1, borderColor: theme.colors.cardBorder, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardPillText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: 'bold' },
  
  voiceBlock: { gap: 12 },
  voiceLine: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  vIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(167,139,250,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  vIconBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  vIconAmber: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  vIconSm: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(148,163,184,0.1)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  vEmoji: { fontSize: 16 },
  vEmojiSm: { fontSize: 12 },
  vText: { flex: 1, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  
  hlRose: { color: '#f43f5e', fontWeight: 'bold' },
  hlWhite: { color: theme.colors.text, fontWeight: 'bold' },
  hlAmber: { color: '#d97706', fontWeight: 'bold' },
  
  quoteBad: { borderLeftWidth: 3, borderLeftColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.08)', padding: 12, borderRadius: 8, marginBottom: 8 },
  quoteLabelBad: { fontSize: 10, fontWeight: 'bold', color: '#f43f5e', letterSpacing: 1.5, marginBottom: 4 },
  quoteTextBad: { color: theme.colors.danger, fontStyle: 'italic', fontSize: 14 },
  
  quoteGood: { borderLeftWidth: 3, borderLeftColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', padding: 12, borderRadius: 8, marginBottom: 16 },
  quoteLabelGood: { fontSize: 10, fontWeight: 'bold', color: '#10b981', letterSpacing: 1.5, marginBottom: 4 },
  quoteTextGood: { color: '#059669', fontStyle: 'italic', fontSize: 14 },
  
  actionList: { gap: 12, marginTop: 4 },
  actionItem: { flexDirection: 'row', gap: 12 },
  aBulletGreen: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  aBulletTextGreen: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  aText: { flex: 1, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  
  gesturesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  gestureChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, width: '48%' },
  gestureEmoji: { fontSize: 16 },
  gestureText: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold' },
  
  footer: { marginTop: 32, padding: 24, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder },
  footerBrand: { color: '#8b5cf6', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  footerText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }
});
