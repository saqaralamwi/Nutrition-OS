import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../theme';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  required?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  error,
  required = false,
  maximumDate,
  minimumDate,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Scroll picker states (used on Native when picking past historical dates)
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isBirthDatePicker = maximumDate && maximumDate.getTime() <= new Date().getTime();

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('ar-SA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      const defaultDate = value || new Date();
      setSelectedDay(defaultDate.getDate());
      setSelectedMonth(defaultDate.getMonth() + 1);
      setSelectedYear(defaultDate.getFullYear());
      setShowPicker(true);
    }
  };

  const quickDates = [
    { label: 'اليوم', days: 0 },
    { label: 'غداً', days: 1 },
    { label: 'بعد غد', days: 2 },
  ];

  const handleQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    onChange(d);
    setShowPicker(false);
  };

  const handleConfirmScrollDate = () => {
    const d = new Date(selectedYear, selectedMonth - 1, selectedDay);
    onChange(d);
    setShowPicker(false);
  };

  // Generate Year, Month, Day lists dynamically
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {Platform.OS === 'web' ? (
        <View style={[styles.trigger, error && styles.triggerError]}>
          <input
            type="date"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: value ? colors.textPrimary : colors.textDisabled,
              fontSize: '16px',
              fontFamily: 'inherit',
              textAlign: 'right',
              outline: 'none',
              width: '100%',
              cursor: 'pointer',
              padding: 0,
            }}
            value={value ? value.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              if (e.target.value) {
                onChange(new Date(e.target.value + 'T00:00:00'));
              }
            }}
            max={maximumDate ? maximumDate.toISOString().split('T')[0] : undefined}
            min={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
          />
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginLeft: spacing.xs }} />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.trigger, error && styles.triggerError]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.triggerText,
              !value && styles.placeholderText,
            ]}
          >
            {value ? formatDate(value) : 'اختر تاريخ...'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {showPicker && Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={[styles.pickerModal, isBirthDatePicker && styles.pickerModalWide]}>
            <Text style={styles.pickerTitle}>{label}</Text>

            {isBirthDatePicker ? (
              <View style={styles.scrollPickerContainerOuter}>
                <View style={styles.scrollPickersContainer}>
                  {/* Day Column */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.columnHeader}>اليوم</Text>
                    <ScrollView style={styles.columnScroll} nestedScrollEnabled={true}>
                      {days.map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.pickerItem, selectedDay === d && styles.pickerItemActive]}
                          onPress={() => setSelectedDay(d)}
                        >
                          <Text style={[styles.pickerItemText, selectedDay === d && styles.pickerItemTextActive]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Month Column */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.columnHeader}>الشهر</Text>
                    <ScrollView style={styles.columnScroll} nestedScrollEnabled={true}>
                      {months.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.pickerItem, selectedMonth === m && styles.pickerItemActive]}
                          onPress={() => setSelectedMonth(m)}
                        >
                          <Text style={[styles.pickerItemText, selectedMonth === m && styles.pickerItemTextActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Year Column */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.columnHeader}>السنة</Text>
                    <ScrollView style={styles.columnScroll} nestedScrollEnabled={true}>
                      {years.map((y) => (
                        <TouchableOpacity
                          key={y}
                          style={[styles.pickerItem, selectedYear === y && styles.pickerItemActive]}
                          onPress={() => setSelectedYear(y)}
                        >
                          <Text style={[styles.pickerItemText, selectedYear === y && styles.pickerItemTextActive]}>
                            {y}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmScrollDate}
                >
                  <Text style={styles.confirmButtonText}>تأكيد التاريخ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quickRow}>
                {quickDates.map((qd) => (
                  <TouchableOpacity
                    key={qd.days}
                    style={styles.quickButton}
                    onPress={() => handleQuickDate(qd.days)}
                  >
                    <Text style={styles.quickButtonText}>{qd.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  required: {
    color: colors.danger,
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm + 2,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  triggerError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  triggerText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    fontFamily: fontFamilies.regular,
  },
  placeholderText: {
    color: colors.textDisabled,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  pickerModal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 320,
    gap: spacing.md,
  },
  pickerModalWide: {
    width: '90%',
    maxWidth: 360,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fontFamilies.bold,
  },
  scrollPickerContainerOuter: {
    gap: spacing.md,
  },
  scrollPickersContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    height: 160,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  columnScroll: {
    width: '90%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  pickerItemActive: {
    backgroundColor: colors.primary,
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  pickerItemTextActive: {
    color: colors.primaryContrast,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.primaryContrast,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: fontFamilies.bold,
  },
  cancelButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
});
