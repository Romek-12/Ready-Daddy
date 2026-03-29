import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  useWindowDimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';
import type { Theme } from '../theme';

const SLIDES = [
  {
    icon: 'home',
    colorKey: 'primary',
    title: 'Witaj w Ready Daddy!',
    desc: 'To Twoja baza wiedzy i wsparcie przez całą ciążę i pierwsze tygodnie z dzieckiem. Wszystko w jednym miejscu.',
  },
  {
    icon: 'fetus',
    colorKey: 'primary',
    title: 'Tydzie\u0144 po tygodniu',
    desc: 'Śledź rozw\xf3j dziecka, dowiedz się co czuje partnerka i co możesz dla niej zrobić. Nowe treści odblokują się automatycznie.',
  },
  {
    icon: 'bolt',
    colorKey: 'actionCards',
    title: 'Karty Reakcji',
    desc: 'Konkretne działania na konkretne sytuacje. Przesuń kartę w prawo, gdy chcesz zapamiętać wskazówkę. W lewo, gdy już to wiesz.',
  },
  {
    icon: 'calendar',
    colorKey: 'checkups',
    title: 'Badania i planowanie',
    desc: 'Lista kontrolna wizyt lekarskich, interaktywna lista zakup\xf3w i kalkulator koszt\xf3w — żeby nic Cię nie zaskoczyło.',
  },
  {
    icon: 'dad',
    colorKey: 'dadModule',
    title: 'Moduł dla Taty',
    desc: 'Emocje, wątpliwości, bliskie tematy — napisane wprost dla przyszłych i młodych ojc\xf3w. Tu możesz być szczery.',
  },
];

export const ONBOARDING_KEY = 'onboarding_done';

interface Slide {
  icon: string;
  colorKey: string;
  title: string;
  desc: string;
}

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const s = React.useMemo(() => createStyles(theme, width), [theme, width]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const dotAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  const animateDots = (index: number) => {
    dotAnim.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === index ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
    animateDots(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  };

  const resolveColor = (key: string): string => {
    const map: Record<string, string> = {
      primary: theme.colors.primary,
      actionCards: theme.colors.actionCards,
      checkups: theme.colors.checkups,
      dadModule: theme.colors.dadModule,
    };
    return map[key] || theme.colors.primary;
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    const color = resolveColor(item.colorKey);
    return (
      <View style={[s.slide, { width }]}>
        <View style={[s.iconCircle, { backgroundColor: color + '20', borderColor: color + '40' }]}>
          <Icon name={item.icon} size={56} color={color} />
        </View>
        <Text style={s.slideTitle}>{item.title}</Text>
        <Text style={s.slideDesc}>{item.desc}</Text>
      </View>
    );
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* Skip button */}
      <TouchableOpacity style={s.skipBtn} onPress={handleFinish} accessibilityRole="button" accessibilityLabel="Pomiń onboarding">
        <Text style={s.skipText}>Pomiń</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
        style={s.flatList}
      />

      {/* Dot indicators */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              s.dot,
              {
                backgroundColor: dotAnim[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [theme.colors.textMuted, theme.colors.primary],
                }),
                width: dotAnim[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 24],
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* Next / Get started button */}
      <TouchableOpacity
        style={[s.nextBtn, { backgroundColor: theme.colors.primary }]}
        onPress={handleNext}
        accessibilityRole="button"
        accessibilityLabel={isLast ? 'Zaczynamy!' : 'Dalej'}
      >
        <Text style={s.nextText}>{isLast ? 'Zaczynamy! 🚀' : 'Dalej'}</Text>
        {!isLast && <Icon name="arrow-forward" size={20} color={theme.colors.black} />}
      </TouchableOpacity>

      {/* Step counter */}
      <Text style={s.counter}>{currentIndex + 1} / {SLIDES.length}</Text>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, width: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center' },
  skipBtn: { alignSelf: 'flex-end', padding: theme.spacing.lg },
  skipText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: theme.fontWeight.medium },

  flatList: { flexGrow: 0 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
    minHeight: 380,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  slideTitle: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fonts.title,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  slideDesc: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.xl },
  dot: { height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md + 4,
    borderRadius: theme.borderRadius.xl,
    minWidth: 180,
    justifyContent: 'center',
  },
  nextText: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.black },
  counter: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
});
