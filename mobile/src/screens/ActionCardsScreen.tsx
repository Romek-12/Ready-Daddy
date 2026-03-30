import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swiper from 'react-native-deck-swiper';
import { useTheme } from '../context/ThemeContext';
import { useActionCardsDeck } from '../hooks/useAppData';
import Icon from '../components/Icon';
import type { AppNavigation } from '../types/navigation';
import type { Theme } from '../theme';


interface ReactionCard {
  id: string;
  weekRange: string;
  emoji: string;
  title: string;
  herSide: string[];
  do: string[];
  dont: string[];
  trimester: string;
}

const TRIMESTERS = ['I', 'II', 'III', 'IV'];

export default function ActionCardsScreen({ route, navigation }: { route: { params?: { initialCardId?: string } }; navigation: AppNavigation }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const s = React.useMemo(() => createStyles(theme, width), [theme, width]);
  const initialCardId = route?.params?.initialCardId;

  const { data, isLoading, error } = useActionCardsDeck();
  const cards: ReactionCard[] = data?.cards ?? [];

  const [activeTri, setActiveTri] = useState('I');
  const [key, setKey] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);

  useEffect(() => {
    if (initialCardId && cards.length > 0) {
      const card = cards.find(c => c.id === initialCardId);
      if (card) {
        setActiveTri(card.trimester);
        const filtered = cards.filter(c => c.trimester === card.trimester);
        const idx = filtered.findIndex(c => c.id === initialCardId);
        setCardIndex(idx >= 0 ? idx : 0);
        setKey(prev => prev + 1);
      }
    }
  }, [initialCardId, cards]);

  const filteredCards = useMemo(() => cards.filter(c => c.trimester === activeTri), [activeTri, cards]);

  const renderCard = (card: ReactionCard, index: number) => {
    if (!card) return null;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardWeek}>{card.weekRange}</Text>
          <Text style={s.cardEmoji}>{card.emoji}</Text>
        </View>
        <Text style={s.cardTitle}>{card.title}</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={s.cardScroll}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Co się naprawdę dzieje</Text>
            {card.herSide.map((item, i) => (
              <View key={i} style={s.listItem}><Text style={s.listBullet}>•</Text><Text style={s.listText}>{item}</Text></View>
            ))}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Tato, działaj</Text>
            {card.do.map((item, i) => (
              <View key={i} style={[s.listItem, s.doItem]}><Text style={[s.listBullet, s.doBullet]}>✓</Text><Text style={[s.listText, s.doText]}>{item}</Text></View>
            ))}
          </View>

          {card.dont.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Czego nie robić</Text>
              {card.dont.map((item, i) => (
                <View key={i} style={[s.listItem, s.dontItem]}><Text style={[s.listBullet, s.dontBullet]}>✗</Text><Text style={[s.listText, s.dontText]}>{item}</Text></View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const onSwiped = (index: number) => {
    const nextIndex = index + 1;
    if (nextIndex >= filteredCards.length) {
      const idx = TRIMESTERS.indexOf(activeTri);
      if (idx < TRIMESTERS.length - 1) {
        setActiveTri(TRIMESTERS[idx + 1]);
        setCardIndex(0);
        setKey(prev => prev + 1);
      } else {
        setCardIndex(nextIndex);
      }
    } else {
      setCardIndex(nextIndex);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[s.c, s.center]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[s.c, s.center]} edges={['top']}>
        <Text style={s.errorText}>{error instanceof Error ? error.message : 'Nie udało się załadować kart'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.c} edges={['top']}>
      <View style={s.header}>
        <Icon name="bolt" size={48} color={theme.colors.accent} />
        <Text style={s.headerTitle}>Karty Reakcji</Text>
        <Text style={s.headerSub}>Konkretne działania na konkretne sytuacje</Text>
      </View>

      <View style={s.triNav}>
        {TRIMESTERS.map(tri => (
          <TouchableOpacity
            key={tri}
            style={[s.triChip, activeTri === tri && s.triChipActive]}
            onPress={() => {
              setActiveTri(tri);
              setCardIndex(0);
              setKey(key + 1);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${tri} trymestr`}
            accessibilityState={{ selected: activeTri === tri }}
          >
            <Text style={[s.triText, activeTri === tri && s.triTextActive]}>{tri} trym.</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipe hint */}
      <View style={s.swipeHint}>
        <Text style={s.swipeHintText}>← Odrzuć</Text>
        <Icon name="swap-horiz" size={18} color={theme.colors.textMuted} />
        <Text style={s.swipeHintText}>Przyjmij →</Text>
      </View>

      <View style={s.swiperContainer}>
        {cardIndex < filteredCards.length ? (
          <Swiper
            key={key}
            cards={filteredCards}
            renderCard={renderCard}
            onSwiped={onSwiped}
            cardIndex={0}
            backgroundColor={'transparent'}
            stackSize={3}
            infinite={false}
            showSecondCard={true}
            animateCardOpacity={true}
            swipeBackCard={true}
            containerStyle={s.swiperWrapper}
            cardStyle={s.cardContainer}
            overlayLabels={{
              left: { title: 'Uff', style: { label: s.overlayLeft, wrapper: s.overlayWrapper } },
              right: { title: 'Dzięki!', style: { label: s.overlayRight, wrapper: s.overlayWrapper } }
            }}
          />
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🎉</Text>
            <Text style={s.emptyText}>To wszystkie karty!</Text>
            <TouchableOpacity style={s.resetBtn} onPress={() => { setActiveTri('I'); setCardIndex(0); setKey(key + 1); }} accessibilityRole="button" accessibilityLabel="Zacznij od początku">
              <Text style={s.resetText}>Zacznij od początku</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, width: number) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
  headerTitle: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.accent, marginTop: theme.spacing.sm },
  headerSub: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  errorText: { fontSize: theme.fontSize.md, color: theme.colors.danger, textAlign: 'center', marginHorizontal: theme.spacing.xl },

  triNav: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: theme.colors.background },
  triChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.surface },
  triChipActive: { backgroundColor: theme.colors.actionCards + '20', borderColor: theme.colors.actionCards },
  triText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  triTextActive: { color: theme.colors.actionCards },

  swiperContainer: { flex: 1, backgroundColor: 'transparent', marginBottom: 20 },
  swiperWrapper: { backgroundColor: 'transparent' },
  cardContainer: { top: 0, left: 0, bottom: 0, right: 0, height: '100%', width: width * 0.9, marginLeft: width * 0.05, marginTop: 5 },

  card: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.xl, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: theme.colors.cardBorder, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardWeek: { fontSize: 13, fontWeight: '600', color: theme.colors.actionCards },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  cardScroll: { flex: 1 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 6 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 4 },
  listBullet: { color: theme.colors.textSecondary, fontSize: 18, marginTop: -4, marginRight: 8 },
  listText: { fontSize: 13, color: theme.colors.textSecondary, flex: 1, lineHeight: 20 },

  doItem: {},
  doBullet: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16, marginTop: -2 },
  doText: { color: theme.colors.primary },

  dontItem: {},
  dontBullet: { color: theme.colors.danger, fontWeight: 'bold', fontSize: 16, marginTop: -2 },
  dontText: { color: theme.colors.danger },

  overlayWrapper: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 },
  overlayLeft: { backgroundColor: theme.colors.danger, color: '#fff', fontSize: 24, fontWeight: 'bold', borderRadius: 10, padding: 10, overflow: 'hidden' },
  overlayRight: { backgroundColor: theme.colors.primary, color: '#fff', fontSize: 24, fontWeight: 'bold', borderRadius: 10, padding: 10, overflow: 'hidden' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: theme.colors.textMuted, fontWeight: '500', marginBottom: 20 },
  resetBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: theme.colors.actionCards, borderRadius: 24 },
  resetText: { color: theme.colors.white, fontWeight: 'bold' },

  swipeHint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 6, marginBottom: 4, opacity: 0.6 },
  swipeHintText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
});
