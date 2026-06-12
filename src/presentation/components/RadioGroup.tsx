import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../theme';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label: string;
  options: readonly RadioOption[] | RadioOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  direction?: 'row' | 'column';
  error?: string;
  required?: boolean;
}

export default function RadioGroup({
  label,
  options,
  selectedValue,
  onValueChange,
  direction = 'column',
  error,
  required = false,
}: RadioGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <View style={[styles.optionsContainer, direction === 'row' && styles.optionsRow]}>
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                direction === 'row' && styles.optionRow,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onValueChange(option.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isSelected ? colors.primary : colors.textDisabled}
              />
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
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
  optionsContainer: {
    gap: spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
  },
  optionRow: {
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
});
