import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { colors, spacing, fontFamilies } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface DropdownOption {
  label: string;
  value: string;
}

interface SearchableDropdownFieldProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function SearchableDropdownField({
  label,
  options,
  selectedValue,
  onValueChange,
  error,
  required = false,
  placeholder = 'اختر...',
  searchPlaceholder = 'بحث...',
}: SearchableDropdownFieldProps) {
  const { theme, animatedCard, animatedText, animatedSubtext, themeMode } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query) || 
      opt.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, animatedSubtext]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Animated.Text>

      <TouchableOpacity
        onPress={() => {
          setSearchQuery('');
          setIsOpen(true);
        }}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.trigger, animatedCard, error && styles.triggerError]}>
          <Animated.Text
            style={[
              styles.triggerText,
              animatedText,
              !selectedOption && { color: theme.subtext },
            ]}
            numberOfLines={1}
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
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Animated.Text style={[styles.modalTitle, animatedText]}>{label}</Animated.Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="search" size={20} color={theme.subtext} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                textAlign="right"
              />
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContent}
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Animated.Text style={[styles.emptyText, animatedSubtext]}>لم يتم العثور على نتائج</Animated.Text>
                </View>
              }
            />
          </View>
        </View>
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
    flexDirection: 'row-reverse',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
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
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    margin: spacing.md,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textDisabled,
    fontFamily: fontFamilies.regular,
  },
});
