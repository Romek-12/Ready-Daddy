import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useWeekDetail } from '../hooks/useAppData';
import Icon from '../components/Icon';
import SkeletonBox from '../components/SkeletonBox';
import type { Theme } from '../theme';

interface WeekActionCard { id: string; title: string; scenario: string; science_explanation: string; concrete_action: string; }
interface WeekCheckup { id: string; name: string; description: string; }

type Props = { route?: any };

export default function WeekDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const week = route?.params?.week || 12;
  const { data, isLoading, error } = useWeekDetail(week);

  if (isLoading) return (
    <ScrollView style={s.c} bounces={false}>
      <View style={s.hero}>
        <SkeletonBox width={64} height={64} borderRadius={32} style={{ marginBottom: 16 }} />
        <SkeletonBox width={200} height={32} style={{ marginBottom: 8 }} />
        <SkeletonBox width={100} height={20} />
      </View>
      {[...Array(3)].map((_, i) => (
        <View key={i} style={s.card}>
          <SkeletonBox width={140} height={24} style={{ marginBottom: 16 }} />
          <SkeletonBox width="100%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBox width="100%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonBox width="80%" height={16} style={{ marginBottom: 16 }} />
          <SkeletonBox width="60%" height={32} borderRadius={16} />
        </View>
      ))}
    </ScrollView>
  );
  if (error) return (
    <View style={[s.c, s.center]}>
      <Text style={s.errorText}>{error instanceof Error ? error.message : 'Nie udało się załadować danych'}</Text>
    </View>
  );
  if (!data?.week) return <View style={[s.c, s.center]}><Text style={s.empty}>Brak danych dla tego tygodnia</Text></View>;
  const w = data.week;

  return (
    <ScrollView style={s.c}>
      <View style={s.hero}>
        <Icon name="fetus" size={64} color={theme.colors.primary} />
        <Text style={s.heroTitle}>Tydzień {w.week_number}</Text>
        <Text style={s.heroTri}>{w.trimester === 1 ? 'I' : w.trimester === 2 ? 'II' : 'III'} trymestr</Text>
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}><Icon name="ruler" size={20} color={theme.colors.fetus} /><Text style={s.cardTitle}> Rozwój płodu</Text></View>
        {w.size_comparison && <Text style={s.sizeComp}>{w.size_comparison}</Text>}
        {w.fetus_size_mm > 0 && <Text style={s.stat}>Długość: {w.fetus_size_mm} mm</Text>}
        {w.fetus_weight_g > 0 && <Text style={s.stat}>Waga: {w.fetus_weight_g} g</Text>}
        <Text style={s.desc}>{w.fetus_description}</Text>
      </View>

      {w.partner_feelings && (
        <View style={s.card}>
          <View style={s.cardHeader}><Icon name="brain" size={20} color={theme.colors.partner} /><Text style={s.cardTitle}> Co czuje Twoja partnerka</Text></View>
          <Text style={s.desc}>{w.partner_feelings}</Text>
        </View>
      )}

      {w.partner_tips && (
        <View style={s.card}>
          <View style={s.cardHeader}><Icon name="lightbulb" size={20} color={theme.colors.accent} /><Text style={s.cardTitle}> Co możesz zrobić</Text></View>
          <Text style={s.desc}>{w.partner_tips}</Text>
        </View>
      )}

      {w.dad_symptoms && (
        <View style={s.card}>
          <View style={s.cardHeader}><Icon name="dad" size={20} color={theme.colors.dadModule} /><Text style={s.cardTitle}> Co mi się dzieje?</Text></View>
          <Text style={s.desc}>{w.dad_symptoms}</Text>
          {w.dad_tips && <><Text style={s.tipLabel}>Porada:</Text><Text style={s.tipText}>{w.dad_tips}</Text></>}
        </View>
      )}

      {data.actionCards?.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}><Icon name="bolt" size={20} color={theme.colors.accent} /><Text style={s.sectionTitle}> Karty na ten tydzień</Text></View>
          {data.actionCards.map((card: WeekActionCard) => (
            <View key={card.id} style={s.actionCard}>
              <Text style={s.actionTitle}>{card.title}</Text>
              <Text style={s.desc}>{card.scenario}</Text>
              <Text style={s.science}>{card.science_explanation}</Text>
              <View style={s.actionBox}>
                <View style={s.actionBoxHeader}><Icon name="check-circle" size={16} color={theme.colors.primary} /><Text style={s.actionBoxLabel}> Co zrobić:</Text></View>
                <Text style={s.actionBoxText}>{card.concrete_action}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {data.checkups?.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}><Icon name="calendar" size={20} color={theme.colors.checkups} /><Text style={s.sectionTitle}> Badania w tym tygodniu</Text></View>
          {data.checkups.map((ch: WeekCheckup) => (
            <View key={ch.id} style={s.checkupCard}>
              <Text style={s.checkupName}>{ch.name}</Text>
              <Text style={s.desc}>{ch.description}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  empty: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  errorText: { fontSize: theme.fontSize.md, color: theme.colors.danger, textAlign: 'center', marginHorizontal: theme.spacing.xl },
  hero: { alignItems: 'center', paddingTop: 30, paddingBottom: theme.spacing.xl },
  heroTitle: { fontSize: theme.fontSize.hero, fontFamily: theme.fonts.title, color: theme.colors.text, marginTop: theme.spacing.sm },
  heroTri: { fontSize: theme.fontSize.md, color: theme.colors.primary, marginTop: theme.spacing.xs },
  card: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  cardTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  sizeComp: { fontSize: theme.fontSize.lg, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold, marginBottom: theme.spacing.sm },
  stat: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  desc: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 24, marginTop: theme.spacing.sm },
  tipLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.primary, marginTop: theme.spacing.md },
  tipText: { fontSize: theme.fontSize.md, color: theme.colors.text, lineHeight: 24, marginTop: 4 },
  section: { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  actionCard: { backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, marginBottom: theme.spacing.md, elevation: 1 },
  actionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.accent },
  science: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic', marginTop: theme.spacing.sm, lineHeight: 20 },
  actionBox: { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginTop: theme.spacing.md },
  actionBoxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  actionBoxLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  actionBoxText: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 22 },
  checkupCard: { backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, elevation: 1 },
  checkupName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.checkups },
});
