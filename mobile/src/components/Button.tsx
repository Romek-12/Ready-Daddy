import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  accessibilityLabel?: string;
}

export default function Button({ title, onPress, loading, disabled, variant = 'primary', accessibilityLabel }: ButtonProps) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[s.base, isPrimary ? s.primary : s.outline, (disabled || loading) && s.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.black : theme.colors.primary} />
      ) : (
        <Text style={isPrimary ? s.primaryText : s.outlineText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg },
    primary: { backgroundColor: theme.colors.primary },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary },
    disabled: { opacity: 0.6 },
    primaryText: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold as any, color: theme.colors.black },
    outlineText: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold as any, color: theme.colors.primary },
  });
