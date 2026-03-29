import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFourthTrimester } from '../hooks/useAppData';
import Icon from '../components/Icon';
import type { Theme } from '../theme';

interface FourthTrimesterWeek {
  id: number;
  week_after_birth: number;
  title: string;
  description: string;
  baby_development?: string;
  relationship_tips?: string;
  self_care?: string;
  warning_signs?: string;
}

export default function FourthTrimesterScreen() {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const { data } = useFourthTrimester();
  const weeks: FourthTrimesterWeek[] = data?.weeks ?? [];

  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (idx: number) => setExpanded(expanded === idx ? null : idx);

  if (!data) {
    return (
      <View style={[s.c, s.center]}>
        <Text style={{ color: theme.colors.textMuted }}>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.c}>
      <View style={s.header}>
        <Icon name="baby" size={48} color={theme.colors.fourthTrimester} />
        <Text style={s.title}>4. Trymestr</Text>
        <Text style={s.sub}>Pierwsze tygodnie dziecka i matki po porodzie</Text>
      </View>

      <View style={s.infoCard}>
        <Text style={s.infoText}>
          Czwarty trymestr to pierwsze 12 tygodni życia noworodka poza łonem matki. Niemowlę powoli adaptuje się do nowych bodźców, dźwięków i bodźców, a dla Was to bardzo wymagający okres wdrażania się w nową rolę.
        </Text>
      </View>

      <View style={s.listContainer}>
        {weeks.map((w: FourthTrimesterWeek, idx: number) => {
          const isExpanded = expanded === idx;
          return (
            <View key={w.id} style={s.accordionWrap}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggle(idx)} style={[s.cardHeader, isExpanded && s.cardHeaderActive]}>
                <View style={s.headerLeft}>
                  <View style={s.weekBadge}>
                    <Text style={s.weekBadgeText}>Tydzień {w.week_after_birth}</Text>
                  </View>
                  <Text style={s.cardTitle}>{w.title}</Text>
                </View>
                <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={s.cardContent}>
                  <Text style={s.desc}>{w.description}</Text>

                  {w.baby_development ? (
                    <View style={s.section}>
                       <View style={s.sectionHeader}><Icon name="baby" size={16} color={theme.colors.primary} /><Text style={s.sectionLabel}> Rozwój dziecka:</Text></View>
                      <Text style={s.sectionText}>{w.baby_development}</Text>
                    </View>
                  ) : null}

                  {w.relationship_tips ? (
                    <View style={[s.section, { backgroundColor: theme.colors.primaryLight }]}>
                       <View style={s.sectionHeader}><Icon name="couple" size={16} color={theme.colors.primary} /><Text style={s.sectionLabel}> Wy i Wasza relacja:</Text></View>
                      <Text style={s.sectionText}>{w.relationship_tips}</Text>
                    </View>
                  ) : null}

                  {w.warning_signs ? (
                    <View style={[s.section, { backgroundColor: theme.colors.dangerLight }]}>
                       <View style={s.sectionHeader}><Icon name="warning" size={16} color={theme.colors.danger} /><Text style={[s.sectionLabel, { color: theme.colors.danger }]}> Zwróć uwagę (objawy alarmowe):</Text></View>
                      <Text style={s.sectionText}>{w.warning_signs}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: theme.spacing.xl },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.fourthTrimester, marginTop: theme.spacing.sm },
  sub: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  infoCard: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl, backgroundColor: 'rgba(255,107,157,0.1)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.xl, borderWidth: 1, borderColor: 'rgba(255,107,157,0.2)' },
  infoText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 24 },
  listContainer: { paddingHorizontal: theme.spacing.lg },
  accordionWrap: { marginBottom: theme.spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  cardHeaderActive: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  headerLeft: { flex: 1, paddingRight: theme.spacing.md },
  weekBadge: { backgroundColor: theme.colors.fourthTrimester, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full, alignSelf: 'flex-start', marginBottom: theme.spacing.xs },
  weekBadgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: theme.colors.white },
  cardTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  cardContent: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: theme.borderRadius.lg, borderBottomRightRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderTopWidth: 0, padding: theme.spacing.lg },
  desc: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 24 },
  section: { marginTop: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.borderRadius.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  sectionText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 22 },
});
