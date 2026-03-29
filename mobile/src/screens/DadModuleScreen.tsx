import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';
import type { AppNavigation } from '../types/navigation';
import Icon from '../components/Icon';
import { useDadModule } from '../hooks/useAppData';

interface DadModuleContent {
  sections: Section[];
  emotions: Emotion[];
  stats: Stat[];
  conflicts: Conflict[];
  warnings: Warning[];
  helpSteps: HelpStep[];
  specialists: Specialist[];
  trimesterLibido: TrioContent[];
  safePractices: SafePractice[];
  stopReasons: string[];
  postBirthSex: PostBirth[];
  talkSteps: TalkStep[];
  bibliography: Bibliography[];
}

interface Section {
  id: string;
  icon: string;
  iconColorKey: string;
  title: string;
}

interface Emotion {
  icon: string;
  label: string;
  desc: string;
}

interface Stat {
  num: string;
  desc: string;
}

interface Conflict {
  feel: string;
  clash: string;
}

interface Warning {
  icon: string;
  text: string;
}

interface HelpStep {
  title: string;
  desc: string;
}

interface Specialist {
  icon: string;
  title: string;
  desc: string;
}

interface TrioContent {
  badge: string;
  weeks: string;
  colorHex: string;
  textColorHex: string;
  title: string;
  desc: string;
  tags: Array<{ text: string; type: string }>;
}

interface SafePractice {
  title: string;
  desc: string;
}

interface PostBirth {
  title: string;
  desc: string;
}

interface TalkStep {
  title: string;
  desc: string;
}

interface Bibliography {
  id: string;
  authors: string;
  title: string;
  journal: string;
}

const resolveIconColor = (colorKey: string, theme: Theme): string => {
  const colorMap: Record<string, string> = {
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
    dadModule: theme.colors.dadModule,
    rose: '#A05070',
  };
  return colorMap[colorKey] || theme.colors.primary;
};

export default function DadModuleScreen({ navigation }: { navigation: AppNavigation }) {
  const { theme } = useTheme();
  const { data: content, isLoading, error, refetch } = useDadModule();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  if (isLoading) {
    return (
      <View style={[s.c, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.dadModule} />
      </View>
    );
  }

  if (error || !content) {
    return (
      <View style={[s.c, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ color: theme.colors.danger, textAlign: 'center', marginBottom: 16 }}>
          {error?.message || 'Nie udało się załadować zawartości'}
        </Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ color: theme.colors.dadModule }}>Spróbuj ponownie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'ciaza':
        return (
          <View style={s.sectionContent}>
            <Text style={s.subheading}>Emocje, które mogą towarzyszyć ciąży partnera:</Text>
            {content.emotions.map((e, i) => (
              <View key={i} style={s.emotionCard}>
                <Icon name={e.icon} size={24} color={resolveIconColor('primary', theme)} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.emotionLabel}>{e.label}</Text>
                  <Text style={s.emotionDesc}>{e.desc}</Text>
                </View>
              </View>
            ))}
            <Text style={[s.subheading, { marginTop: 24 }]}>Statystyki depresji poporodowej u ojców:</Text>
            {content.stats.map((stat, i) => (
              <View key={i} style={s.statCard}>
                <Text style={s.statNum}>{stat.num}</Text>
                <Text style={s.statDesc}>{stat.desc}</Text>
              </View>
            ))}
          </View>
        );

      case 'konflikty':
        return (
          <View style={s.sectionContent}>
            {content.conflicts.map((conf, i) => (
              <View key={i} style={s.conflictCard}>
                <Text style={s.conflictFeel}>{conf.feel}</Text>
                <Icon name="arrow-forward" size={16} color={theme.colors.textMuted} style={{ marginVertical: 8 }} />
                <Text style={s.conflictClash}>{conf.clash}</Text>
              </View>
            ))}
          </View>
        );

      case 'sygnaly':
        return (
          <View style={s.sectionContent}>
            {content.warnings.map((w, i) => (
              <View key={i} style={s.warningCard}>
                <Icon name={w.icon} size={20} color={theme.colors.danger} />
                <Text style={[s.warningText, { marginLeft: 12, flex: 1 }]}>{w.text}</Text>
              </View>
            ))}
          </View>
        );

      case 'pomoc':
        return (
          <View style={s.sectionContent}>
            {content.helpSteps.map((step, i) => (
              <View key={i} style={s.stepCard}>
                <View style={s.stepNumber}>
                  <Text style={s.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'specjalista':
        return (
          <View style={s.sectionContent}>
            {content.specialists.map((spec, i) => (
              <View key={i} style={s.specialistCard}>
                <Icon name={spec.icon} size={32} color={resolveIconColor('accent', theme)} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.specialistTitle}>{spec.title}</Text>
                  <Text style={s.specialistDesc}>{spec.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'wspolzycie':
        return (
          <View style={s.sectionContent}>
            {content.trimesterLibido.map((lib, i) => (
              <View key={i} style={[s.libidoCard, { borderLeftColor: lib.colorHex }]}>
                <Text style={[s.badgeText, { backgroundColor: lib.colorHex, color: lib.textColorHex }]}>
                  {lib.badge}
                </Text>
                <Text style={s.libidoTitle}>{lib.title}</Text>
                <Text style={s.libidoDesc}>{lib.desc}</Text>
                <View style={s.tagsContainer}>
                  {lib.tags.map((tag, j) => (
                    <Text key={j} style={[s.tag, { color: tag.type === 'down' ? theme.colors.danger : theme.colors.primary }]}>
                      {tag.text}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
            <Text style={[s.subheading, { marginTop: 16 }]}>Bezpieczne praktyki:</Text>
            {content.safePractices.map((prac, i) => (
              <View key={i} style={s.practiceCard}>
                <Text style={s.practiceTitle}>{prac.title}</Text>
                <Text style={s.practiceDesc}>{prac.desc}</Text>
              </View>
            ))}
            <Text style={[s.subheading, { marginTop: 16 }]}>Kiedy powstrzymać się od zbliżeń:</Text>
            {content.stopReasons.map((reason, i) => (
              <Text key={i} style={s.reasonText}>
                {i + 1}. {reason}
              </Text>
            ))}
            <Text style={[s.subheading, { marginTop: 16 }]}>Okres poporodowy:</Text>
            {content.postBirthSex.map((post, i) => (
              <View key={i} style={s.postCard}>
                <Text style={s.postTitle}>{post.title}</Text>
                <Text style={s.postDesc}>{post.desc}</Text>
              </View>
            ))}
            <Text style={[s.subheading, { marginTop: 16 }]}>Jak rozmawiać o intymności:</Text>
            {content.talkSteps.map((talk, i) => (
              <View key={i} style={s.talkCard}>
                <Text style={s.talkTitle}>{talk.title}</Text>
                <Text style={s.talkDesc}>{talk.desc}</Text>
              </View>
            ))}
          </View>
        );

      case 'bibliografia':
        return (
          <View style={s.sectionContent}>
            {content.bibliography.map((bib) => (
              <View key={bib.id} style={s.bibCard}>
                <Text style={s.bibAuthors}>{bib.authors}</Text>
                <Text style={s.bibTitle}>{bib.title}</Text>
                <Text style={s.bibJournal}>{bib.journal}</Text>
              </View>
            ))}
          </View>
        );

      case 'po-porodzie':
      default:
        return (
          <View style={s.sectionContent}>
            <Text style={s.placeholder}>Zawartość dla tego rozdziału — przygotowywana</Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={s.c}>
      <View style={s.header}>
        <Icon name="dad" size={48} color={theme.colors.dadModule} />
        <Text style={s.title}>Moduł dla Ojców</Text>
        <Text style={s.subtitle}>Wsparcie i informacje dla przyszłych i nowych taciów</Text>
      </View>

      <View style={s.sectionGrid}>
        {content.sections.map((section) => (
          <View key={section.id} style={s.sectionButton}>
            <TouchableOpacity
              style={[s.sectionButtonInner, activeSection === section.id && s.sectionButtonActive]}
              onPress={() => setActiveSection(activeSection === section.id ? null : section.id)}
            >
              <Icon name={section.icon} size={28} color={resolveIconColor(section.iconColorKey, theme)} />
              <Text style={s.sectionButtonText}>{section.title}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {activeSection && renderSectionContent(activeSection)}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    c: { flex: 1, backgroundColor: theme.colors.background },
    header: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
    title: { fontSize: theme.fontSize.xl, fontFamily: theme.fonts.title, color: theme.colors.dadModule, marginTop: 12 },
    subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },

    sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginBottom: 24 },
    sectionButton: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    sectionButtonInner: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    sectionButtonActive: {
      borderColor: theme.colors.dadModule,
    },
    sectionButtonText: { fontSize: theme.fontSize.xs, color: theme.colors.text, marginTop: 8, textAlign: 'center', fontWeight: theme.fontWeight.bold },

    sectionContent: { paddingHorizontal: 16, marginBottom: 24 },
    subheading: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 12 },

    emotionCard: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    emotionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
    emotionDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },

    statCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.dadModule },
    statNum: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.dadModule },
    statDesc: { fontSize: theme.fontSize.sm, color: theme.colors.text, marginTop: 4 },

    conflictCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    conflictFeel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.primary, fontStyle: 'italic' },
    conflictClash: { fontSize: theme.fontSize.sm, color: theme.colors.text },

    warningCard: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    warningText: { fontSize: theme.fontSize.sm, color: theme.colors.text },

    stepCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.dadModule, justifyContent: 'center', alignItems: 'center' },
    stepNumberText: { color: '#fff', fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },
    stepTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginLeft: 12 },
    stepDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginLeft: 12, marginTop: 4 },

    specialistCard: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    specialistTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
    specialistDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },

    libidoCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12, borderLeftWidth: 3 },
    badgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 8 },
    libidoTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
    libidoDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 6 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    tag: { fontSize: theme.fontSize.xs, fontStyle: 'italic' },

    practiceCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    practiceTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
    practiceDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },

    reasonText: { fontSize: theme.fontSize.sm, color: theme.colors.text, marginBottom: 8, paddingLeft: 8 },

    postCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    postTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
    postDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },

    talkCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    talkTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
    talkDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },

    bibCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 12 },
    bibAuthors: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: theme.colors.dadModule },
    bibTitle: { fontSize: theme.fontSize.xs, color: theme.colors.text, marginTop: 4, fontStyle: 'italic' },
    bibJournal: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },

    placeholder: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic', padding: 16, textAlign: 'center' },
  });
