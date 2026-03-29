import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';

export default function DadNoworodekScreen() {
  const { theme } = useTheme();
  const st = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <ScrollView style={st.c}>
      <View style={st.header}>
        <Text style={st.title}>Opieka nad noworodkiem. Twoja nowa rola.</Text>
        <Text style={st.sub}>
          Praktyczny przewodnik po pierwszych tygodniach z dzieckiem w domu. Przeczytaj o najważniejszych zasadach bezpiecznej i świadomej opieki.
        </Text>
      </View>

      <View style={st.introCard}>
        <View style={st.introIconWrap}>
          <Text style={st.introEmoji}>🍼</Text>
        </View>
        <View style={st.introContent}>
          <Text style={st.introLabel}>ZROZUMIENIE POTRZEB</Text>
          <Text style={st.introText}>
            Dziecko przez 9 miesięcy przebywało w bezpiecznym środowisku. Nagłe pojawienie się w głośnym, jasnym świecie to dla niego szok. Układ nerwowy noworodka jest jeszcze niedojrzały i potrzebuje nieustannego poczucia bezpieczeństwa.
          </Text>
        </View>
      </View>

      <View style={st.sectionGrid}>
        {/* 01 Bliskość */}
        <View style={st.card}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={st.cardIndex}>01</Text>
              <Text style={st.cardTitle}>POTRZEBA BLISKOŚCI</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>BEZPIECZEŃSTWO</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>🫂</Text></View>
              <Text style={st.vText}>
                W pierwszych godzinach i tygodniach życia noworodek jest niemal w całości uzależniony od fizycznego kontaktu z rodzicami.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>❤️</Text></View>
              <Text style={st.vText}>
                Przytulanie "skóra do skóry" (kangurowanie) buduje w nim poczucie bezpieczeństwa, wyrównuje jego temperaturę ciała oraz oddech. Twój głos i bicie serca mają silne działanie uspokajające.
              </Text>
            </View>
          </View>
        </View>

        {/* 02 Proaktywna opieka */}
        <View style={[st.card, st.cardBlue]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: theme.colors.primary }]}>02</Text>
              <Text style={st.cardTitle}>PROAKTYWNA OPIEKA</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>TATO, DZIAŁAJ</Text>
            </View>
          </View>
          
          <View style={st.voiceLine}>
            <View style={st.vIcon}><Text style={st.vEmoji}>🎯</Text></View>
            <Text style={st.vText}>
              Bądź inicjatorem działań bez pytania partnerki o polecenia. Buduj swoją własną ojcowską więź:
            </Text>
          </View>
          
          <View style={st.actionList}>
            <View style={st.actionItem}>
              <View style={st.aBullet}><Text style={st.aBulletText}>A</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Pełna higiena.</Text> Codzienne przewijanie, asystowanie w kąpieli oraz dbanie o czystość kikuta pępowinowego budują Twoją pewność siebie.
              </Text>
            </View>
            <View style={st.actionItem}>
              <View style={st.aBullet}><Text style={st.aBulletText}>B</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Kangurowanie.</Text> Pokładanie dziecka nagą klatką piersiową na swojej klatce pod przykryciem stabilizuje jego parametry i odciąża wyczerpaną mamę.
              </Text>
            </View>
            <View style={st.actionItem}>
              <View style={st.aBullet}><Text style={st.aBulletText}>C</Text></View>
              <Text style={st.aText}>
                <Text style={st.hlWhite}>Aktywne noszenie.</Text> Poprawna mechanika noszenia redukuje bóle u malucha, szczególnie podczas kolki czy refluksu.
              </Text>
            </View>
          </View>
        </View>

        {/* 03 Czerwone flagi */}
        <View style={[st.card, st.cardRed]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: theme.colors.danger }]}>03</Text>
              <Text style={st.cardTitle}>BEZWZGLĘDNE "CZERWONE FLAGI"</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>BEZ WYJĄTKÓW</Text>
            </View>
          </View>
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIcon}><Text style={st.vEmoji}>⛔</Text></View>
              <Text style={st.vText}>
                <Text style={st.hlDanger}>Nigdy, pod żadnym pozorem nie potrząsaj noworodkiem!</Text> Powoduje to wymierne uszkodzenia i Syndrom Dziecka Potrząsanego (SBS). Gdy opadasz z sił: odłóż płaczące dziecko w bezpieczne miejsce i wyjdź na minutę ochłonąć.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>🛏️</Text></View>
              <Text style={st.vText}>
                <Text style={st.hlDanger}>Bezpieczny sen na plecach.</Text> Do ukończenia 1. roku życia jedynym bezpiecznym ułożeniem dla noworodka do snu jest pozycja wybitnie na plecach w pustym bezpiecznym łóżku i na płaskim materacu (prewencja SIDS).
              </Text>
            </View>
          </View>
        </View>

        {/* 04 Fizjologia */}
        <View style={[st.card, st.cardAmber]}>
          <View style={st.cardHeader}>
            <View style={st.cardTitleRow}>
              <Text style={[st.cardIndex, { color: '#f59e0b' }]}>04</Text>
              <Text style={st.cardTitle}>CO NIE JEST POWODEM DO PANIKI</Text>
            </View>
            <View style={st.cardPill}>
              <Text style={st.cardPillText}>FIZJOLOGIA</Text>
            </View>
          </View>
          
          <View style={st.voiceBlock}>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>✓</Text></View>
              <Text style={st.vText}>
                <Text style={st.hlWhite}>Odruch Moro.</Text> Niespodziewane trzęsące się nóżki i nagłe ruchy rąk we śnie to naturalny, fizjologiczny odruch.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>✓</Text></View>
              <Text style={st.vText}>
                <Text style={st.hlWhite}>Zmiana naskórka.</Text> Silnie sucha skóra z odpadającym martwym naskórkiem to po prostu normalna i w pełni bezpieczna zmiana bariery ochronnej.
              </Text>
            </View>
            <View style={st.voiceLine}>
              <View style={st.vIconSm}><Text style={st.vEmojiSm}>⚠️</Text></View>
              <Text style={st.vText}>
                <Text style={st.hlDanger}>Alarmowe objawy do lekarza:</Text> twarde zaczerwienienie, obrzęk kikuta pępkowego oraz wysięk gnijącej ropy z okolic pępka. Tak samo przedłużający się mocno zażółcony odcień skóry i gałek ocznych.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={st.footer}>
        <Text style={st.footerBrand}>💡 PAMIĘTAJ</Text>
        <Text style={st.footerText}>
          Dziecko doskonale wyłapuje Twoje zdenerwowanie po tętnie i sztywności ciała taty. Twój spokój i łagodny "brzuszkowy" głęboki bas to Twoja najmocniejsza broń na uciszenie malucha we wspólnym domu.
        </Text>
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
  cardAmber: { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' },
  
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
