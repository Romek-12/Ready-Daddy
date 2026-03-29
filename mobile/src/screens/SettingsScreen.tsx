import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import Icon from '../components/Icon';
import DateScrollPicker from '../components/DateScrollPicker';
import { api } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/navigation';
import type { Theme } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { user, updateUser, logout } = useAuth();
  const { theme, mode, setThemeMode } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState<'conception' | 'due'>('conception');
  const [selectedDate, setSelectedDate] = useState(user?.conceptionDate || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSaveDate = async () => {
    try {
      setSaving(true);
      let conceptionDate = selectedDate;
      if (dateType === 'due' && selectedDate) {
        const due = new Date(selectedDate);
        due.setDate(due.getDate() - 280);
        conceptionDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
      }
      await api.updateProfile(user!.id, { conceptionDate });
      updateUser({ conceptionDate });
      setDatePickerVisible(false);
      Alert.alert('Sukces', 'Data została zaktualizowana.');
    } catch (err: any) {
      Alert.alert('Błąd', err.message || 'Nie udało się zapisać zmiany.');
    } finally {
      setSaving(false);
    }
  };

  const renderThemeOption = (targetMode: ThemeMode, label: string, icon: string) => {
    const isSelected = mode === targetMode;
    return (
      <TouchableOpacity
        style={[s.optionCard, isSelected && s.optionCardSelected]}
        onPress={() => setThemeMode(targetMode)}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityLabel={`Motyw ${label}`}
        accessibilityState={{ checked: isSelected }}
      >
        <View style={[s.optionIcon, isSelected && s.optionIconSelected]}>
          <Icon name={icon} size={22} color={isSelected ? theme.colors.white : theme.colors.textMuted} />
        </View>
        <Text style={[s.optionLabel, isSelected && s.optionLabelSelected]}>{label}</Text>
        {isSelected && (
          <View style={s.checkIcon}>
            <Icon name="check" size={18} color={theme.colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Format daty dla wyświetlania
  const formatDateForDisplay = (isoString?: string) => {
    if (!isoString) return 'Nie podano';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Nie podano';
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <View style={s.c}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Wróć">
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ustawienia</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.section}>
          <Text style={s.sectionTitle}>Motyw aplikacji</Text>
          <Text style={s.sectionDesc}>Wybierz w jakim trybie ma działać aplikacja, lub zdaj się na ustawienia systemowe.</Text>
          
          <View style={s.optionsGrid}>
            {renderThemeOption('light', 'Jasny', 'lightbulb')}
            {renderThemeOption('dark', 'Ciemny', 'moon')}
            {renderThemeOption('system', 'Systemowy', 'phone')}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Konto i Dane</Text>
          <TouchableOpacity style={s.listButton} onPress={() => { setSelectedDate(user?.conceptionDate || new Date().toISOString()); setDatePickerVisible(true); }} accessibilityRole="button" accessibilityLabel="Zmień termin poczęcia">
            <View style={s.listButtonLeft}>
              <View style={[s.listButtonIcon, { backgroundColor: theme.colors.checkups + '20' }]}>
                <Icon name="calendar" size={20} color={theme.colors.checkups} />
              </View>
              <View>
                <Text style={s.listButtonText}>Zmień termin poczęcia</Text>
                <Text style={s.listButtonSub}>{formatDateForDisplay(user?.conceptionDate)}</Text>
              </View>
            </View>
            <Icon name="arrow-forward" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={s.spacer} />
        
        <TouchableOpacity style={s.logoutButton} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Wyloguj się">
          <Icon name="logout" size={20} color={theme.colors.danger} />
          <Text style={s.logoutText}>Wyloguj się</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>Wersja 1.0.0</Text>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={isDatePickerVisible} animationType="slide" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Wybierz datę</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={s.modalCloseBtn} accessibilityRole="button" accessibilityLabel="Zamknij okno wyboru daty">
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={s.pickerWrapper}>
              <View style={s.dateToggle}>
                <TouchableOpacity
                  style={[s.toggleBtn, dateType === 'conception' && s.toggleBtnActive]}
                  onPress={() => { setDateType('conception'); setSelectedDate(''); }}
                >
                  <Text style={[s.toggleText, dateType === 'conception' && s.toggleTextActive]}>Data poczęcia</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.toggleBtn, dateType === 'due' && s.toggleBtnActive]}
                  onPress={() => { setDateType('due'); setSelectedDate(''); }}
                >
                  <Text style={[s.toggleText, dateType === 'due' && s.toggleTextActive]}>Termin porodu</Text>
                </TouchableOpacity>
              </View>

              <DateScrollPicker 
                initialDate={selectedDate || user?.conceptionDate} 
                onDateChange={setSelectedDate}
                allowFuture={dateType === 'due'}
                maxDaysBack={dateType === 'conception' ? 366 : 30}
                maxDaysForward={dateType === 'due' ? 310 : 0}
              />
            </View>

            <TouchableOpacity
              style={[s.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleSaveDate}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Zapisz zmianę daty"
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>Zapisz zmianę</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingTop: 60, paddingBottom: theme.spacing.md, backgroundColor: theme.colors.surface },
  backBtn: { padding: theme.spacing.sm, borderRadius: 20, backgroundColor: theme.colors.background },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  content: { padding: theme.spacing.xl, paddingBottom: 40 },
  section: { marginBottom: theme.spacing.xxl },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  sectionDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg, lineHeight: 20 },
  
  optionsGrid: { gap: theme.spacing.md },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, borderWidth: 2, borderColor: 'transparent' },
  optionCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  optionIconSelected: { backgroundColor: theme.colors.primary },
  optionLabel: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: '500' },
  optionLabelSelected: { color: theme.colors.primary, fontWeight: '700' },
  checkIcon: { width: 24, height: 24, backgroundColor: theme.colors.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  listButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg },
  listButtonLeft: { flexDirection: 'row', alignItems: 'center' },
  listButtonIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  listButtonText: { fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: '500' },
  listButtonSub: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 2 },

  spacer: { flex: 1, minHeight: 40 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, marginTop: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.danger + '40' },
  logoutText: { marginLeft: theme.spacing.sm, fontSize: theme.fontSize.md, color: theme.colors.danger, fontWeight: theme.fontWeight.bold },
  
  versionText: { textAlign: 'center', fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: theme.spacing.lg },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
  modalTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  modalCloseBtn: { padding: theme.spacing.xs },
  pickerWrapper: { height: 250, marginBottom: theme.spacing.xl },
  saveButton: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: theme.borderRadius.xl, alignItems: 'center' },
  saveButtonText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold },

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
