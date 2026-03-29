import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import DateScrollPicker from '../components/DateScrollPicker';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import { registerSchema, type RegisterForm } from '../lib/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { Theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const { register } = useAuth();
  const [dateType, setDateType] = useState<'conception' | 'due'>('conception');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      conceptionDate: '',
      partnerName: '',
    },
  });

  const selectedDate = watch('conceptionDate');

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const onSubmit = async (data: RegisterForm) => {
    // Convert due date to conception date (due - 280 days)
    let conceptionDate = data.conceptionDate;
    if (dateType === 'due') {
      const due = new Date(conceptionDate);
      due.setDate(due.getDate() - 280);
      conceptionDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
    }

    const [year, month, day] = conceptionDate.split('-').map(Number);
    const conceptionDateObj = new Date(year, month - 1, day);
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    if (dateType === 'conception') {
      if (conceptionDateObj > today) {
        showAlert('Błąd', 'Data poczęcia nie może być w przyszłości');
        return;
      }
      if (conceptionDateObj < maxDate) {
        showAlert('Błąd', 'Data poczęcia jest za dawna (max 1 rok wstecz)');
        return;
      }
    }

    setLoading(true);
    try {
      await register(data.email.trim(), data.password, conceptionDate, data.partnerName?.trim() || undefined);
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert(`Błąd rejestracji: ${err.message || 'Spróbuj ponownie'}`);
      else Alert.alert('Błąd rejestracji', err.message || 'Spróbuj ponownie');
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return `${d} ${months[m - 1]} ${y}`;
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.iconWrap}><Logo width={120} height={120} color={theme.colors.primary} /></View>
        <Text style={s.title}>Dołącz do akcji!</Text>
        <Text style={s.subtitle}>Stwórz konto i zacznij swoją podróż</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="twoj@email.pl"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Hasło"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Min. 6 znaków"
              isPassword
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="partnerName"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Imię partnerki (opcjonalne)"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="np. Anna"
              error={errors.partnerName?.message}
            />
          )}
        />

        <View style={s.dateGroup}>
          {/* Date type toggle */}
          <Text style={s.label}>Wprowadź</Text>
          <View style={s.dateToggle}>
            <TouchableOpacity
              style={[s.toggleBtn, dateType === 'conception' && s.toggleBtnActive]}
              onPress={() => { setDateType('conception'); setValue('conceptionDate', ''); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: dateType === 'conception' }}
            >
              <Text style={[s.toggleText, dateType === 'conception' && s.toggleTextActive]}>Datę poczęcia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, dateType === 'due' && s.toggleBtnActive]}
              onPress={() => { setDateType('due'); setValue('conceptionDate', ''); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: dateType === 'due' }}
            >
              <Text style={[s.toggleText, dateType === 'due' && s.toggleTextActive]}>Termin porodu</Text>
            </TouchableOpacity>
          </View>

          <DateScrollPicker
            onDateChange={(date: string) => setValue('conceptionDate', date, { shouldValidate: true })}
            allowFuture={dateType === 'due'}
            maxDaysBack={dateType === 'conception' ? 366 : 30}
            maxDaysForward={dateType === 'due' ? 310 : 0}
          />
          {selectedDate ? (
            <Text style={s.dateDisplay}>Wybrano: {formatDisplayDate(selectedDate)}</Text>
          ) : null}
          {errors.conceptionDate?.message ? (
            <Text style={s.dateError}>{errors.conceptionDate.message}</Text>
          ) : null}
          <Text style={s.hint}>
            {dateType === 'conception'
              ? 'Przybliżona data poczęcia '
              : 'Przewidywany termin porodu '}
            — możesz ją później zmienić
          </Text>
        </View>

        <Button
          title="Zarejestruj się"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          accessibilityLabel="Zarejestruj się"
        />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.link} accessibilityRole="button" accessibilityLabel="Przejdź do logowania">
          <Text style={s.linkText}>Masz już konto? <Text style={s.linkBold}>Zaloguj się</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl },
  iconWrap: { alignItems: 'center', marginBottom: theme.spacing.md },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.text, textAlign: 'center' },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl },
  dateGroup: { marginBottom: theme.spacing.lg },
  label: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, fontWeight: theme.fontWeight.medium },
  dateDisplay: { fontSize: theme.fontSize.md, color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, marginTop: theme.spacing.sm, textAlign: 'center' },
  dateError: { color: theme.colors.danger, fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs, textAlign: 'center' },
  hint: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: theme.spacing.xs, textAlign: 'center' },
  link: { marginTop: theme.spacing.xl, alignItems: 'center', marginBottom: theme.spacing.xxl },
  linkText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  linkBold: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },

  dateToggle: { flexDirection: 'row', marginBottom: theme.spacing.md, gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight, borderWidth: 1,
    borderColor: theme.colors.cardBorder, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  toggleText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: theme.fontWeight.medium },
  toggleTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
});
