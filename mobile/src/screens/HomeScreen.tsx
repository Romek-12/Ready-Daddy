import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, RefreshControl } from 'react-native';
import type { Theme } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCurrentWeek } from '../hooks/useAppData';
import Icon from '../components/Icon';
import SkeletonBox from '../components/SkeletonBox';
import type { AppNavigation } from '../types/navigation';

interface ActionCardSummary { id: string; title: string; scenario: string; }

export default function HomeScreen({ navigation }: { navigation: AppNavigation }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const CARD_W = (width - theme.spacing.lg * 3) / 2;
  const s = React.useMemo(() => createStyles(theme, CARD_W), [theme, CARD_W]);
  const { user } = useAuth();

  const { data, isLoading, error, refetch, isRefetching } = useCurrentWeek(user?.conceptionDate);

  const MODULES = React.useMemo(() => [
    { key: 'WeekDetailTab', icon: 'fetus', label: 'Rozwój dziecka', color: theme.colors.fetus, isTab: true },
    { key: 'ActionCards', icon: 'bolt', label: 'Co robić teraz?', color: theme.colors.actionCards, isTab: true },
    { key: 'Checkups', icon: 'calendar', label: 'Lekarz i badania', color: theme.colors.checkups },
    { key: 'Planning', icon: 'planning', label: 'Planowanie', color: theme.colors.planning },
    { key: 'BirthPrep', icon: 'hospital', label: 'Porodówka', color: theme.colors.birth },
    { key: 'DadModuleTab', icon: 'dad', label: 'Co czujesz?', color: theme.colors.dadModule, isTab: true },
    { key: 'FourthTrimester', icon: 'baby', label: '4. Trymestr', color: theme.colors.fourthTrimester },
    { key: 'PostBirth', icon: 'post-birth', label: 'Po porodzie', color: theme.colors.postBirth },
  ], [theme]);

  if (isLoading) return (
    <ScrollView style={s.c} bounces={false}>
      <View style={s.header}>
        <View>
          <SkeletonBox width={100} height={20} style={{ marginBottom: 8 }} />
          <SkeletonBox width={160} height={32} />
        </View>
        <SkeletonBox width={40} height={40} borderRadius={20} />
      </View>
      <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
        <SkeletonBox height={220} borderRadius={theme.borderRadius.xl} style={{ marginBottom: theme.spacing.lg }} />
        <SkeletonBox height={100} borderRadius={theme.borderRadius.lg} style={{ marginBottom: theme.spacing.lg }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} width={CARD_W} height={120} borderRadius={theme.borderRadius.lg} style={{ marginBottom: theme.spacing.md }} />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  if (error) return (
    <View style={[s.c, s.center]}>
      <Text style={s.errorText}>{error instanceof Error ? error.message : 'Nie udało się załadować danych'}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Spróbuj ponownie">
        <Text style={s.retryText}>Spróbuj ponownie</Text>
      </TouchableOpacity>
    </View>
  );

  const w = data?.weekData;
  const progress = data?.progress || 0;

  return (
    <ScrollView
      style={s.c}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={s.header}>
        <View>
          <View style={s.greetRow}>
            <Text style={s.greeting}>Cześć! </Text>
            <Icon name="wave" size={20} color={theme.colors.accent} />
          </View>
          <Text style={s.appName}>Ready Daddy</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.settingsBtn} accessibilityRole="button" accessibilityLabel="Ustawienia">
          <Icon name="gear" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {w && (
        <TouchableOpacity style={s.weekCard} onPress={() => navigation.navigate('WeekDetailTab', { week: data.currentWeek })} accessibilityRole="button" accessibilityLabel={`Tydzień ${data.currentWeek} – sprawdź szczegóły`}>
          <View style={s.weekHeader}>
            <View style={s.weekBadge}><Text style={[s.weekBadgeText, { color: data.trimesterColor }]}>{data.trimester} trymestr</Text></View>
          </View>
          <Text style={s.weekNumber}>{data.currentWeek}. tydzień</Text>
          {w.size_comparison && <Text style={s.fetusSize}>{w.size_comparison}</Text>}
          {w.fetus_description && <Text style={s.fetusDesc}>{w.fetus_description}</Text>}
          <View style={s.progressContainer}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={s.progressText}>{progress}% ciąży za nami</Text>
          </View>
          <View style={s.detailBtn}>
            <Text style={s.detailBtnText}>Sprawdź szczegóły</Text>
            <Icon name="arrow-forward" size={16} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>
      )}

      {w?.notification && (
        <View style={s.notifCard}>
          <View style={s.notifHeader}>
            <Icon name="notifications" size={24} color={theme.colors.accent} />
            <Text style={s.notifTitle}>Ważne w tym tygodniu</Text>
          </View>
          <Text style={s.notifText}>{w.notification}</Text>
        </View>
      )}

      {data?.actionCards?.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Icon name="bolt" size={20} color={theme.colors.accent} />
            <Text style={s.sectionTitle}> Co dzieje się teraz?</Text>
          </View>
          {data.actionCards.slice(0, 2).map((card: ActionCardSummary, index: number) => (
            <TouchableOpacity key={card.id} style={s.quickCard} onPress={() => navigation.navigate('ActionCards', { initialCardId: card.id })} accessibilityRole="button" accessibilityLabel={`Karta reakcji: ${card.title}`}>
              <Text style={s.quickTitle}>{card.title}</Text>
              <Text style={s.quickScenario}>{card.scenario?.substring(0, 80)}...</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.section}>
        <View style={s.moduleGrid}>
          {MODULES.map(m => (
            <TouchableOpacity key={m.key} style={s.moduleCard} onPress={() => {
              if (m.isTab) {
                navigation.navigate(m.key, m.key === 'WeekDetailTab' ? { week: data?.currentWeek } : undefined);
              } else {
                navigation.navigate(m.key);
              }
            }} accessibilityRole="button" accessibilityLabel={m.label}>
              <View style={[s.moduleIcon, { backgroundColor: m.color + '20' }]}>
                <Icon name={m.icon} size={28} color={m.color} />
              </View>
              <Text style={s.moduleLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme, CARD_W: number) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: theme.fontSize.md, color: theme.colors.danger, textAlign: 'center', marginHorizontal: theme.spacing.xl },
  retryBtn: { marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full },
  retryText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold as any, fontSize: theme.fontSize.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.xl, paddingTop: 60 },
  greetRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  appName: { fontSize: theme.fontSize.xl, fontFamily: theme.fonts.title, color: theme.colors.primary, letterSpacing: 1 },
  settingsBtn: { padding: theme.spacing.sm },
  weekCard: { margin: theme.spacing.lg, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, elevation: 2 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  weekBadge: { backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  weekBadgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold as any },
  weekNumber: { fontSize: theme.fontSize.hero, fontFamily: theme.fonts.title, color: theme.colors.text },
  fetusSize: { fontSize: theme.fontSize.lg, color: theme.colors.accent, marginTop: theme.spacing.sm },
  fetusDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, lineHeight: 20 },
  progressContainer: { marginTop: theme.spacing.lg },
  progressBar: { height: 6, backgroundColor: theme.colors.surfaceLight, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  progressText: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  detailBtn: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, gap: 4 },
  detailBtnText: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold as any, fontSize: theme.fontSize.sm },
  notifCard: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, backgroundColor: theme.colors.accentLight, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, elevation: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, gap: 8 },
  notifTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold as any, color: theme.colors.text },
  notifText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },
  section: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold as any, color: theme.colors.text },
  quickCard: { backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  quickTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold as any, color: theme.colors.accent },
  quickScenario: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },
  moduleCard: { width: CARD_W, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, alignItems: 'center', elevation: 1 },
  moduleIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
  moduleLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, textAlign: 'center', fontWeight: theme.fontWeight.medium as any },
});
