import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { forgotPasswordSchema } from '../lib/validation';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Icon from '../components/Icon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { Theme } from '../theme';

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim());
      if (error) throw error;

      Alert.alert(
        'Sukces',
        'Sprawdź swoją skrzynkę mailową. Wysłaliśmy link do resetowania hasła.',
      );
    } catch (err: any) {
      Alert.alert('Błąd', err.message || 'Nie udało się wysłać emaila z linkiem resetowania.');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Wróć">
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={s.iconWrap}>
            <Icon name="lock-reset" size={56} color={theme.colors.primary} />
          </View>
          <Text style={s.title}>Zapomniane hasło?</Text>
          <Text style={s.subtitle}>Wpisz swój email. Wyślemy Ci link do resetu hasła.</Text>

          <View style={s.inputGroup}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput
                  label="Adres email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  placeholder="twoj@email.pl"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />
          </View>

          <Button
            title="Wyślij link"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.link} accessibilityRole="button">
            <Text style={s.linkText}>Pamiętasz hasło? <Text style={s.linkBold}>Zaloguj się</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { flexGrow: 1, padding: theme.spacing.xl, paddingTop: theme.spacing.md },
  backBtn: { marginBottom: theme.spacing.xl },
  iconWrap: { alignItems: 'center', marginBottom: theme.spacing.xl },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.text, textAlign: 'center' },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxl },
  inputGroup: { marginBottom: theme.spacing.xl },
  link: { marginTop: theme.spacing.xl, alignItems: 'center' },
  linkText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  linkBold: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
});
