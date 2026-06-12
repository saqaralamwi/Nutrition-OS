import { View, TextInput, StyleSheet, Text } from 'react-native';
import { colors, spacing, fontFamilies } from '../theme';

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  required?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
  leftIcon?: React.ReactNode;
}

export default function TextInputField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  keyboardType = 'default',
  multiline = false,
  required = false,
  editable = true,
  secureTextEntry = false,
  leftIcon,
}: TextInputFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputRow, error && styles.inputRowError, !editable && styles.inputRowDisabled]}>
        {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlign="right"
          editable={editable}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
        />
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  inputRowError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  inputRowDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  iconSlot: {
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    padding: spacing.sm + 2,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
});
