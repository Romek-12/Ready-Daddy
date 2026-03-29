import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';
import type { Theme } from '../theme';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Renders a password toggle eye icon on the right. */
  isPassword?: boolean;
}

export default function FormInput({ label, error, isPassword, secureTextEntry, ...rest }: FormInputProps) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <View style={isPassword ? s.passwordContainer : undefined}>
        <TextInput
          style={isPassword ? s.passwordInput : s.input}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(v => !v)}
            style={s.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    group: { marginBottom: theme.spacing.lg },
    label: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: theme.fontWeight.medium as any },
    input: { backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: theme.fontSize.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.cardBorder },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.cardBorder },
    passwordInput: { flex: 1, padding: theme.spacing.md, fontSize: theme.fontSize.md, color: theme.colors.text },
    eyeBtn: { padding: theme.spacing.md },
    error: { color: theme.colors.danger, fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs },
  });
