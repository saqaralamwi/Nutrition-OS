import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ArabicText from './ArabicText';
import { LabTestCategory, LAB_TEST_PARAMETERS } from '../../domain/constants/labTestParameters';

const COLORS = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  accent: '#10B981',
  accentBg: '#064E3B',
  danger: '#F43F5E',
  warning: '#F59E0B',
};

const CATEGORIES: LabTestCategory[] = [
  'electrolytes',
  'kidneyFunction',
  'liverFunction',
  'bloodCount',
  'nutritionMetabolic',
  'thyroid',
  'coagulation',
];

function getCategoryLabel(cat: LabTestCategory): { en: string; ar: string; icon: keyof typeof Ionicons.glyphMap } {
  switch (cat) {
    case 'electrolytes': return { en: 'Electrolytes', ar: 'الكهارل', icon: 'water-outline' };
    case 'kidneyFunction': return { en: 'Kidney', ar: 'الكلى', icon: 'fitness-outline' };
    case 'liverFunction': return { en: 'Liver', ar: 'الكبد', icon: 'leaf-outline' };
    case 'bloodCount': return { en: 'Blood Count', ar: 'الدم', icon: 'heart-outline' };
    case 'nutritionMetabolic': return { en: 'Nutrition/Metabolic', ar: 'التغذية', icon: 'nutrition-outline' };
    case 'thyroid': return { en: 'Thyroid', ar: 'الغدة الدرقية', icon: 'pulse-outline' };
    case 'coagulation': return { en: 'Coagulation', ar: 'التخثر', icon: 'bandage-outline' };
    default: return { en: 'Other', ar: 'أخرى', icon: 'ellipse-outline' };
  }
}

export interface LabFilters {
  category: LabTestCategory | null;
  showOnlyAbnormal: boolean;
}

interface LabTrendChartFiltersProps {
  onFilterChange: (filters: LabFilters) => void;
  selectedCodes: string[];
  onSelectedCodesChange: (codes: string[]) => void;
}

export default function LabTrendChartFilters({
  onFilterChange,
  selectedCodes,
  onSelectedCodesChange,
}: LabTrendChartFiltersProps) {
  const [category, setCategory] = useState<LabTestCategory | null>(null);
  const [showOnlyAbnormal, setShowOnlyAbnormal] = useState(false);
  const [showParams, setShowParams] = useState(false);

  const toggleCategory = (cat: LabTestCategory) => {
    const next = category === cat ? null : cat;
    setCategory(next);
    onFilterChange({ category: next, showOnlyAbnormal });
  };

  const toggleAbnormal = () => {
    const next = !showOnlyAbnormal;
    setShowOnlyAbnormal(next);
    onFilterChange({ category, showOnlyAbnormal: next });
  };

  const filteredCodes = category
    ? Object.entries(LAB_TEST_PARAMETERS)
        .filter(([, p]) => p.category === category)
        .map(([code]) => code)
    : Object.keys(LAB_TEST_PARAMETERS);

  const toggleParam = (code: string) => {
    if (selectedCodes.includes(code)) {
      onSelectedCodesChange(selectedCodes.filter((c) => c !== code));
    } else {
      onSelectedCodesChange([...selectedCodes, code]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Category chips */}
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => {
          const label = getCategoryLabel(cat);
          const active = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
            >
              <Ionicons name={label.icon} size={14} color={active ? COLORS.accent : COLORS.textSecondary} />
              <ArabicText style={[styles.chipText, active && styles.chipTextActive]}>
                {label.ar}
              </ArabicText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Abnormal toggle */}
      <TouchableOpacity style={styles.abnormalRow} onPress={toggleAbnormal}>
        <Ionicons
          name={showOnlyAbnormal ? 'checkbox' : 'square-outline'}
          size={18}
          color={showOnlyAbnormal ? COLORS.danger : COLORS.textSecondary}
        />
        <ArabicText style={[styles.abnormalText, showOnlyAbnormal && { color: COLORS.danger }]}>
          القيم غير الطبيعية فقط
        </ArabicText>
      </TouchableOpacity>

      {/* Parameter selector toggle */}
      <TouchableOpacity style={styles.paramToggle} onPress={() => setShowParams(!showParams)}>
        <Ionicons name={showParams ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
        <ArabicText style={styles.paramToggleText}>
          اختيار المعاملات ({selectedCodes.length})
        </ArabicText>
      </TouchableOpacity>

      {showParams && (
        <View style={styles.paramGrid}>
          {filteredCodes.map((code) => {
            const param = LAB_TEST_PARAMETERS[code];
            const selected = selectedCodes.includes(code);
            return (
              <TouchableOpacity
                key={code}
                style={[styles.paramChip, selected && styles.paramChipSelected]}
                onPress={() => toggleParam(code)}
              >
                <ArabicText style={[styles.paramChipText, selected && styles.paramChipTextSelected]}>
                  {param.nameAr}
                </ArabicText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, gap: 10 },
  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceSecondary },
  chipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentBg },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.accent },
  abnormalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingVertical: 4 },
  abnormalText: { fontSize: 13, color: COLORS.textSecondary },
  paramToggle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingVertical: 4 },
  paramToggleText: { fontSize: 13, color: COLORS.textSecondary },
  paramGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  paramChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceSecondary },
  paramChipSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accentBg },
  paramChipText: { fontSize: 12, color: COLORS.textSecondary },
  paramChipTextSelected: { color: COLORS.accent },
});
