import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { colors, spacing, fontFamilies } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownFieldProps {
  label: string;
  options: readonly DropdownOption[] | DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export default function DropdownField({
  label,
  options,
  selectedValue,
  onValueChange,
  error,
  required = false,
  placeholder = 'اختر...',
}: DropdownFieldProps) {
  const { theme, animatedCard, animatedText, animatedSubtext, themeMode } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, animatedSubtext]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Animated.Text>

      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.trigger, animatedCard, error && styles.triggerError]}>
          <Animated.Text
            style={[
              styles.triggerText,
              animatedText,
              !selectedOption && { color: theme.subtext },
            ]}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Animated.Text>
          <Ionicons name="chevron-down" size={20} color={theme.subtext} />
        </Animated.View>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Animated.Text style={[styles.modalTitle, animatedText]}>{label}</Animated.Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options as DropdownOption[]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    { borderBottomColor: theme.border },
                    item.value === selectedValue && { backgroundColor: themeMode === 'night' ? 'rgba(27, 107, 74, 0.2)' : 'rgba(27, 107, 74, 0.1)' },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Animated.Text
                    style={[
                      styles.optionText,
                      animatedText,
                      item.value === selectedValue && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Animated.Text>
                  {item.value === selectedValue && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies.bold,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    minHeight: 44,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    fontFamily: fontFamilies.regular,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
