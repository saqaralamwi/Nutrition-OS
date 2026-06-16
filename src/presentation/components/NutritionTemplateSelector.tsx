import { View, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { colors, spacing } from '../theme';
import ArabicText from './ArabicText';
import { NutritionTemplate } from '../../domain/entities/NutritionTemplate';
import { NutritionTemplateRepository } from '../../data/repositories/NutritionTemplateRepository';

interface NutritionTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: NutritionTemplate) => void;
}

export default function NutritionTemplateSelector({
  visible,
  onClose,
  onSelect,
}: NutritionTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const repo = new NutritionTemplateRepository();
  const templates = repo.getAll() as unknown as NutritionTemplate[];

  const handleConfirm = () => {
    const template = templates.find((t) => t.id === selectedId);
    if (template) {
      onSelect(template);
      setSelectedId(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <ArabicText bold style={styles.headerTitle}>اختيار قالب خطة تغذوية</ArabicText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedId === template.id && styles.templateCardSelected,
                ]}
                onPress={() => setSelectedId(template.id)}
                activeOpacity={0.7}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.radioOuter}>
                    {selectedId === template.id && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.templateInfo}>
                    <ArabicText bold style={styles.conditionName}>
                      {template.conditionNameAr}
                    </ArabicText>
                    <ArabicText style={styles.conditionNameEn}>
                      {template.conditionName}
                    </ArabicText>
                    <ArabicText style={styles.templateDescription}>
                      {template.descriptionAr}
                    </ArabicText>
                  </View>
                </View>

                <View style={styles.paramsPreview}>
                  {(template.proteinGPerKg || template.proteinPercent) && (
                    <View style={styles.paramChip}>
                      <ArabicText style={styles.paramChipText}>
                        بروتين: {template.proteinGPerKg ? `${template.proteinGPerKg} غ/كغم` : `${template.proteinPercent}%`}
                      </ArabicText>
                    </View>
                  )}
                  {template.energyKcalPerKg && (
                    <View style={styles.paramChip}>
                      <ArabicText style={styles.paramChipText}>
                        طاقة: {template.energyKcalPerKg} سعرة/كغم
                      </ArabicText>
                    </View>
                  )}
                  {template.fiberGPerDay && (
                    <View style={styles.paramChip}>
                      <ArabicText style={styles.paramChipText}>
                        ألياف: {template.fiberGPerDay} غ/يوم
                      </ArabicText>
                    </View>
                  )}
                  {template.sodiumGPerDay && (
                    <View style={styles.paramChip}>
                      <ArabicText style={styles.paramChipText}>
                        {`صوديوم: <${template.sodiumGPerDay} غ/يوم`}
                      </ArabicText>
                    </View>
                  )}
                </View>

                <ArabicText style={styles.recommendationPreview} numberOfLines={2}>
                  {template.specialRecommendationsAr}
                </ArabicText>
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedId && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selectedId}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primaryContrast} />
              <ArabicText bold style={styles.confirmBtnText}>تطبيق القالب المحدد</ArabicText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  templateCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  templateHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  templateInfo: {
    flex: 1,
  },
  conditionName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  conditionNameEn: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  templateDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  paramsPreview: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  paramChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paramChipText: {
    fontSize: 11,
    color: colors.primary,
  },
  recommendationPreview: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: colors.primaryContrast,
    fontSize: 16,
  },
});
