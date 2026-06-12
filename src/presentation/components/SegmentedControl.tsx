import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontFamilies } from '../theme';

interface Segment {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  segments: readonly Segment[] | Segment[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export default function SegmentedControl({
  segments,
  selectedValue,
  onValueChange,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isSelected = segment.value === selectedValue;
        return (
          <TouchableOpacity
            key={segment.value}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
            ]}
            onPress={() => onValueChange(segment.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextSelected,
              ]}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: colors.primary,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
});
