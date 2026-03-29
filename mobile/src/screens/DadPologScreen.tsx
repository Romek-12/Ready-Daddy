import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';
import Icon from '../components/Icon';

export default function DadPologScreen() {
  const { theme } = useTheme();
  const st = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <ScrollView style={st.c}>
      <View style={st.header}>
        <Text style={st.title}>Połóg, baby blues i zdrowie psychiczne</Text>
        <Text style={st.sub}>
          Tato, pojawienie się noworodka to gigantyczny wysiłek dla organizmu partnerki. Jej ciało potrzebuje czasu, a psychika Twojego pełnego zrozumienia. Oto trudny czas gojenia i burzy hormonalnej:
        </Text>
      </View>

      <View style={st.introCard}>
        <View style={st.introIconWrap}>
          <Text style={st.introEmoji}>🤝</Text>
        </View>
        <View style={st.introContent}>
          <Text style={st.introLabel}>TATO, TWOJA ROLA JEST KLUCZOWA</Text>
          <Text style={st.introText}>
            Kobieta wykonała niesamowitą i wyczerpującą pracę. By ustabilizować waszą nową rzeczywistość, musisz teraz przejąć wiele obowiązków i być murem obronnym rodziny. Jeśli Ty staniesz na wysokości zadania – noworodek i partnerka też poczują się bezpieczniej.
          </Text>
        </View>
      </View>

      <View style={st.sectionGrid}>
        {/* 01 Czym jest połóg */}
        <View style={st.card}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={st.cardIndex}>01</Text>
              <Text style={st.cardTitle}>CZYM JEST POŁÓG</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>FAZA ~6 TYGODNI</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>🏥</Text></View>
              <Text style={st.vText}>
                Narodziny wiążą się z obciążeniem fizycznym. Organizm matki musi wygoić pęknięcia tkanek, zregenerować mięśnie i naczynia. Połóg to okres <Text style={st.hlAccent}>około 6 tygodni po porodzie</Text>, podczas którego cofają się zmiany ciążowe.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>💬</Text></View>
              <Text style={st.vText}>
                Towarzyszy temu stabilizacja laktacji (nawał mleczny) oraz drastyczny spadek hormonów dający uczucie rozbicia. Płaczliwość w tym okresie ma podłoże fizjologiczne. Nie wynika to z jej "kaprysów", lecz biologii.
              </Text>
            </View>
          </View>
        </View>

        {/* 02 Baby blues / depresja */}
        <View style={[st.card, st.cardRed]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: theme.colors.danger }]}>02</Text>
              <Text style={st.cardTitle}>„BABY BLUES" A DEPRESJA</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>SYGNAŁY ALARMOWE</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>🌧️</Text></View>
              <Text style={st.vText}>
                W okolicach 3-5 dnia po porodzie u ponad połowy kobiet tzw. „baby blues”. Przejawia się on huśtawką nastrojów, wrażliwością, smutkiem i płaczem bez konkretnego powodu. Zwykle po kilkunastu dniach ten stan ustępuje naturalnie.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>⚠️</Text></View>
              <Text style={st.vText}>
                Jeżeli stan głębokiego smutku, poczucie braku nadziei, natrętne myśli, czy brak zdolności do snu <Text style={st.hlDanger}>utrzymują się powyżej dwóch tygodni</Text> – należy podejrzewać depresję poporodową! Konieczna jest wówczas profesjonalna pomoc lekarza psychiatry i psychoterapeuty.
              </Text>
            </View>
          </View>
        </View>

        {/* 03 Jak wspierać mamę */}
        <View style={[st.card, st.cardBlue]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: theme.colors.primary }]}>03</Text>
              <Text style={st.cardTitle}>JAK MOŻESZ WSPIERAĆ MAMĘ</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>TATO, DZIAŁAJ</Text>
            </View>
          </View>
          
          <View style={st.voiceLine}>
            <View style={st.vIcon}><Text style={st.vEmoji}>🛡️</Text></View>
            <Text style={st.vText}>
              Nie zabierzesz od partnerki dyskomfortu fizycznego, ale Twoje zaangażowanie zmniejsza napięcie i przyspiesza jej gojenie. Oto trzy żelazne zasady dla wspierającego ojca:
            </Text>
          </View>
          
          <View style={st.actionList}>
            <View style={st.actionItem}>
              <View style={st.aBullet}><Text style={st.aBulletText}>A</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Akceptuj i validuj uczucia.</Text> Unikaj zwrotów w stylu: "Urodziłaś, masz zdrowe dziecko, nie płacz". Zastąp je słowami: "Widzę, że jest ci ciężko, masz prawo czuć się wyczerpana. Jesteś bardzo dzielna".
              </Text>
            </View>
            <View style={st.actionItem}>
              <View style={st.aBullet}><Text style={st.aBulletText}>B</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Zarządzaj statkiem bez jej instrukcji.</Text> Bierz na siebie gotowanie, pranie, przewijanie, zakupy, nie wymuszając na partnerce ciągłego decydowania o detalach. Ogranicz lub wstrzymaj uciążliwe wizyty rodziny, jeśli partnerka woli spokój.
              </Text>
            </View>
            <View style={st.actionItem}>
              <View style={st.aBullet}><Text style={st.aBulletText}>C</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Organizuj specjalistyczną pomoc.</Text> Kiedy zauważysz symptomy wykraczające poza normę połogu – pomóż umówić wizytę u doradcy laktacyjnego, psychologa wspierającego lub osteopaty. Ty trzymasz rękę na pulsie.
              </Text>
            </View>
          </View>
        </View>

        {/* 04 Twoje emocje */}
        <View style={st.card}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={st.cardIndex}>04</Text>
              <Text style={st.cardTitle}>TWOJE EMOCJE W POŁOGU</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>STATUS TATY</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>👨</Text></View>
              <Text style={st.vText}>
                Pamiętaj, że ojcowie w okresie okołoporodowym także dotknięci są ogromnym wstrząsem życiowym. Masz prawo czuć strach, bezradność pod naporem odpowiedzialności, a nawet niechęć lub chroniczne zmęczenie. <Text style={st.hlAccent}>Twój stan jest równie ważny.</Text>
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>💬</Text></View>
              <Text style={st.vText}>
                Kiedy trzeba proś bliskich o wsparcie! Organizuj drzemki na zmianę, wychodź przewietrzyć głowę. <Text style={st.hlGreen}>Z pustego i Salomon nie naleje — wypalony, sfrustrowany tata na wyczerpaniu nie zbuduje mocnego filaru wsparcia dla młodej matki i jej dziecka.</Text> Dbaj również o własną higienę psychiczną i w razie potrzeby rozmawiaj z innymi ojcami o swoich obawach.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={st.footer}>
        <Text style={st.footerText}>Uwaga: Informacje tu przedstawione mają charakter wspierający, nie są poradą medyczną. Przy ostrych objawach u partnerki zgłaszacie się pod opiekę lekarza psychiatrii.</Text>
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
  introIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  introEmoji: { fontSize: 22 },
  introContent: { flex: 1 },
  introLabel: { fontSize: 10, fontWeight: 'bold', color: '#3b82f6', marginBottom: 6, letterSpacing: 1.5 },
  introText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  
  sectionGrid: { paddingHorizontal: theme.spacing.lg, gap: 16 },
  card: { backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 16 },
  cardRed: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' },
  cardBlue: { borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.05)' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  cardIndex: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  cardTitle: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  cardPill: { borderWidth: 1, borderColor: theme.colors.cardBorder, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardPillText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: 'bold' },
  
  voiceBlock: { gap: 12 },
  voiceLine: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  vIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  vIconSm: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(148,163,184,0.1)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  vEmoji: { fontSize: 16 },
  vEmojiSm: { fontSize: 12 },
  vText: { flex: 1, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  
  hlAccent: { color: theme.colors.primary, fontWeight: 'bold' },
  hlDanger: { color: theme.colors.danger, fontWeight: 'bold' },
  hlGreen: { color: '#10b981', fontWeight: 'bold' },
  hlWhite: { color: theme.colors.text, fontWeight: 'bold' },
  
  actionList: { gap: 12, marginTop: 4 },
  actionItem: { flexDirection: 'row', gap: 12 },
  aBullet: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  aBulletText: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  aText: { flex: 1, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  
  footer: { marginTop: 32, padding: 24, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder },
  footerBrand: { color: theme.colors.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  footerText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }
});
