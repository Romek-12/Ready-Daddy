import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';
import Icon from '../components/Icon';

interface TaskItem {
  title: string;
  who: string;
  deadline: string;
  where: string[];
  details?: string[];
  tip?: string;
}

interface OtherItem {
  name: string;
  deadline: string;
  where: string;
}

const TASKS: TaskItem[] = [
  {
    title: 'Zgłoszenie urodzenia dziecka',
    who: 'Matka, ojciec lub przedstawiciel',
    deadline: 'Do 21 dni',
    where: [
      'Online: mObywatel (zakładka „Usługi" → „Rodzina" → „Zgłoś urodzenie dziecka") lub gov.pl',
      'Osobiście: Urząd Stanu Cywilnego (USC) wg miejsca urodzenia',
    ],
    details: [
      'Akt urodzenia (1 odpis bezpłatny)',
      'Numer PESEL dziecka',
      'Meldunek dziecka pod adresem rodziców',
    ],
    tip: 'Co zabrać: Kartę urodzenia ze szpitala.',
  },
  {
    title: 'Ubezpieczenie zdrowotne dziecka',
    who: 'Rodzic ubezpieczony (pracownik — u pracodawcy, przedsiębiorca — w ZUS, bezrobotny — w UP)',
    deadline: 'Do 7 dni od PESEL',
    where: [
      'Pracodawca / ZUS / KRUS / UP',
      'Online przez PUE ZUS',
    ],
    tip: 'Efekt: Dziecko ma NFZ, pediatra przyjmuje, wizyty bezpłatne.',
  },
  {
    title: 'Świadczenie Rodzina 800+',
    who: 'Rodzic/opiekun (800 zł/mies. do 18. roku życia)',
    deadline: 'Do 3 miesięcy od narodzin',
    where: [
      'Bankowość elektroniczna (PKO, mBank itp. — najszybciej)',
      'Emp@tia lub PUE ZUS',
    ],
    tip: 'Potrzebne: PESEL dziecka i rodzica, konto bankowe. Pierwsza wypłata w 2–3 miesiące.',
  },
  {
    title: 'Zasiłek macierzyński i urlop',
    who: 'Mama (20 tyg. po porodzie naturalnym, 37 po cc) + tata (urlop ojcowski/tacierzyński)',
    deadline: 'Natychmiast po porodzie',
    where: [
      'Pracodawca lub ZUS (ZUS Z-3A + zaświadczenie o narodzinach)',
    ],
    tip: 'Zgłoś narodziny do ZUS w ciągu 7 dni.',
  },
  {
    title: 'Rejestracja w przychodni (POZ)',
    who: 'Rodzic',
    deadline: 'W ciągu 30 dni',
    where: [
      'POZ pediatry (online lub osobiście) — dla bilansów i szczepień',
    ],
  },
];

const OTHER_ITEMS: OtherItem[] = [
  { name: 'Rodzinny Kapitał Opiekuńczy (12–24 tys. zł)', deadline: 'Do 12 mies.', where: 'ZUS / Emp@tia' },
  { name: 'Becikowe (jeśli przysługuje)', deadline: 'Do 12 mies.', where: 'GOPS (dochód < 1922 zł/os.)' },
  { name: 'Zaktualizuj dane w US (PIT-36)', deadline: 'Przy rozliczeniu', where: 'e-US' },
  { name: 'Rodzeństwo — dodaj do 800+', deadline: 'Natychmiast', where: 'Emp@tia' },
];

const getTaskKey = (idx: number) => `task-${idx}`;

export default function PostBirthScreen() {
  const { theme } = useTheme();
  const st = React.useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [otherChecked, setOtherChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => setExpanded(expanded === idx ? null : idx);
  const toggleCheck = (key: string) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleOther = (idx: number) => setOtherChecked(prev => ({ ...prev, [idx]: !prev[idx] }));

  const totalItems = TASKS.length + OTHER_ITEMS.length;
  const totalChecked = useMemo(() =>
    Object.values(checked).filter(Boolean).length + Object.values(otherChecked).filter(Boolean).length,
    [checked, otherChecked]);

  return (
    <ScrollView style={st.c}>
      <View style={st.header}>
        <Icon name="post-birth" size={48} color={theme.colors.postBirth} />
        <Text style={st.title}>Po porodzie</Text>
        <Text style={st.sub}>Formalności i sprawy do załatwienia</Text>
      </View>

      {/* Progress */}
      <View style={st.progressCard}>
        <Text style={st.progressLabel}>Postęp spraw</Text>
        <View style={st.progressRight}>
          <Text style={st.progressCount}>{totalChecked}/{totalItems}</Text>
          <Text style={st.progressCheckLabel}>ukończonych</Text>
        </View>
      </View>

      {/* Main tasks */}
      {TASKS.map((task, idx) => {
        const isExpanded = expanded === idx;
        const key = getTaskKey(idx);
        const isDone = checked[key] || false;

        return (
          <View key={idx} style={st.taskSection}>
            <TouchableOpacity style={[st.taskHeader, isDone && st.taskHeaderDone]} onPress={() => toggle(idx)}>
              <TouchableOpacity onPress={() => toggleCheck(key)} style={st.checkBtn}>
                <Icon
                  name={isDone ? 'check-circle' : 'checkbox-blank'}
                  size={24}
                  color={isDone ? theme.colors.primary : theme.colors.textMuted}
                />
              </TouchableOpacity>
              <View style={st.taskHeaderInfo}>
                <View style={st.taskNumRow}>
                  <View style={[st.taskNum, { backgroundColor: theme.colors.postBirth }]}>
                    <Text style={st.taskNumText}>{idx + 1}</Text>
                  </View>
                  <View style={st.deadlineBadge}>
                    <Icon name="timer" size={12} color={theme.colors.accent} />
                    <Text style={st.deadlineText}> {task.deadline}</Text>
                  </View>
                </View>
                <Text style={[st.taskTitle, isDone && st.taskTitleDone]}>{task.title}</Text>
                <Text style={st.taskWho}>{task.who}</Text>
              </View>
              <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>

            {isExpanded && (
              <View style={st.taskContent}>
                {/* Where */}
                <View style={st.detailBlock}>
                  <View style={st.detailHeader}>
                    <Icon name="search" size={14} color={theme.colors.postBirth} />
                    <Text style={st.detailLabel}> Gdzie załatwić:</Text>
                  </View>
                  {task.where.map((w, i) => (
                    <View key={i} style={st.bulletRow}>
                      <Text style={st.bullet}>•</Text>
                      <Text style={st.bulletText}>{w}</Text>
                    </View>
                  ))}
                </View>

                {/* Details (what you get) */}
                {task.details && (
                  <View style={st.detailBlock}>
                    <View style={st.detailHeader}>
                      <Icon name="check-circle" size={14} color={theme.colors.primary} />
                      <Text style={st.detailLabel}> Co dostajesz automatycznie:</Text>
                    </View>
                    {task.details.map((d, i) => (
                      <View key={i} style={st.bulletRow}>
                        <Text style={st.bullet}>✓</Text>
                        <Text style={st.bulletText}>{d}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tip */}
                {task.tip && (
                  <View style={st.tipBox}>
                    <Icon name="lightbulb" size={14} color={theme.colors.accent} />
                    <Text style={st.tipText}> {task.tip}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      {/* Other items table */}
      <View style={st.otherSection}>
        <View style={st.otherHeader}>
          <Icon name="checklist" size={18} color={theme.colors.postBirth} />
          <Text style={st.otherTitle}> Inne ważne zgłoszenia</Text>
        </View>
        {OTHER_ITEMS.map((item, idx) => {
          const isDone = otherChecked[idx] || false;
          return (
            <TouchableOpacity key={idx} style={[st.otherRow, isDone && st.otherRowDone]} onPress={() => toggleOther(idx)} activeOpacity={0.7}>
              <Icon
                name={isDone ? 'check-circle' : 'checkbox-blank'}
                size={20}
                color={isDone ? theme.colors.primary : theme.colors.textMuted}
              />
              <View style={st.otherInfo}>
                <Text style={[st.otherName, isDone && st.otherNameDone]}>{item.name}</Text>
                <View style={st.otherMeta}>
                  <Text style={st.otherDeadline}>{item.deadline}</Text>
                  <Text style={st.otherWhere}>{item.where}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pro tip */}
      <View style={st.proTip}>
        <Icon name="lightbulb" size={18} color={theme.colors.accent} />
        <Text style={st.proTipText}> Najłatwiej online — mObywatel i Profil Zaufany załatwiają 90% spraw bez wychodzenia z domu. Szpital przekazuje kartę urodzenia do USC automatycznie w 3 dni.</Text>
      </View>

      {/* Disclaimer */}
      <View style={st.disclaimer}>
        <Icon name="info" size={16} color={theme.colors.textMuted} />
        <Text style={st.disclaimerText}>Przedstawione informacje mają charakter orientacyjny i mogą stanowić jedynie ogólny drogowskaz. Nie zastępują one indywidualnej konsultacji ani zaleceń lekarza prowadzącego czy położnej, którzy najlepiej ocenią Twoją sytuację zdrowotną i dostosują plan postępowania do Twoich potrzeb.</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: theme.spacing.lg },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.postBirth, marginTop: theme.spacing.sm },
  sub: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },

  progressCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl, backgroundColor: theme.colors.postBirth, borderRadius: theme.borderRadius.xl, paddingHorizontal: theme.spacing.lg, paddingVertical: 24, minHeight: 110 },
  progressLabel: { fontSize: theme.fontSize.lg, color: 'rgba(255,255,255,0.9)', fontWeight: theme.fontWeight.bold, flex: 1, marginRight: theme.spacing.md },
  progressRight: { alignItems: 'flex-end' },
  progressCount: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.white },
  progressCheckLabel: { fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: theme.fontWeight.medium },

  taskSection: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  taskHeader: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder, flexDirection: 'row', alignItems: 'center' },
  taskHeaderDone: { opacity: 0.5 },
  checkBtn: { marginRight: theme.spacing.sm },
  taskHeaderInfo: { flex: 1 },
  taskNumRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs, gap: 8 },
  taskNum: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskNumText: { color: theme.colors.white, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.xs },
  deadlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,181,71,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.full },
  deadlineText: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  taskTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  taskWho: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },

  taskContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, marginTop: 2, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  detailBlock: { marginBottom: theme.spacing.md },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  detailLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 4, marginBottom: 4 },
  bullet: { color: theme.colors.postBirth, fontSize: 14, marginRight: 8, marginTop: 1 },
  bulletText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },

  tipBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.accentLight, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
  tipText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },

  otherSection: { marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  otherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  otherTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  otherRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder, gap: 10 },
  otherRowDone: { opacity: 0.45 },
  otherInfo: { flex: 1 },
  otherName: { fontSize: theme.fontSize.sm, color: theme.colors.text, fontWeight: theme.fontWeight.medium },
  otherNameDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  otherMeta: { flexDirection: 'row', gap: 12, marginTop: 3 },
  otherDeadline: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  otherWhere: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },

  proTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, padding: theme.spacing.md, backgroundColor: theme.colors.accentLight, borderRadius: theme.borderRadius.lg },
  proTipText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },

  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.cardBorder },
  disclaimerText: { flex: 1, fontSize: 11, color: theme.colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
