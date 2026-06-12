import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import SegmentedControl from '../../../src/presentation/components/SegmentedControl';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import {
  EXAM_TEMPLATES,
  EXAM_DOMAINS,
  EXAM_RESPONSE_OPTIONS,
} from '../../../src/core/constants/physicalExamTemplates';

interface ItemState {
  response: string;
  comments: string;
}

export default function PhysicalExamScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>(EXAM_DOMAINS[0].value);
  const [responses, setResponses] = useState<Record<string, ItemState>>({});

  const currentTemplates = useMemo(
    () => EXAM_TEMPLATES.filter((t) => t.domain === selectedDomain),
    [selectedDomain],
  );

  useEffect(() => {
    loadExistingData();
  }, [patientId]);

  async function loadExistingData() {
    try {
      setIsLoading(true);
      const { GetPhysicalExamUseCase } = await import('../../../src/domain/use-cases/GetPhysicalExamUseCase');
      const uc = new GetPhysicalExamUseCase();
      const records = await uc.execute(patientId);
      const mapped: Record<string, ItemState> = {};
      for (const r of records) {
        mapped[r.itemKey] = {
          response: r.response,
          comments: r.comments || '',
        };
      }
      setResponses(mapped);
    } catch {
      showToast('فشل تحميل البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleResponseChange = useCallback((itemKey: string, value: string) => {
    setResponses((prev) => {
      const current = prev[itemKey];
      const cleared = value === 'no';
      return {
        ...prev,
        [itemKey]: {
          response: value,
          comments: cleared ? '' : (current?.comments || ''),
        },
      };
    });
  }, []);

  const handleCommentsChange = useCallback((itemKey: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        comments: value,
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const { SavePhysicalExamUseCase } = await import('../../../src/domain/use-cases/SavePhysicalExamUseCase');
      const uc = new SavePhysicalExamUseCase();
      const items = EXAM_TEMPLATES
        .filter((t) => responses[t.itemKey]?.response)
        .map((t) => ({
          patientId,
          domain: t.domain,
          itemKey: t.itemKey,
          response: responses[t.itemKey].response,
          comments: responses[t.itemKey].comments || undefined,
        }));
      await uc.execute(patientId, items);
      showToast('تم حفظ الفحص', 'success');
      router.replace({ pathname: "/patient/[id]/laboratory", params: { id: patientId } });
    } catch {
      showToast('فشل الحفظ', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, responses, router, showToast]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  const segmentItems = EXAM_DOMAINS.map((d) => ({ label: d.label, value: d.value }));

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="fitness-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>الفحص السريري</ArabicText>
          </View>
        </View>

        {/* Domain Segmented Control */}
        <View style={styles.segmentWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <SegmentedControl
              segments={segmentItems}
              selectedValue={selectedDomain}
              onValueChange={(val) => setSelectedDomain(val)}
            />
          </ScrollView>
        </View>

        {/* Exam Items for Selected Domain */}
        <View style={styles.section}>
          {currentTemplates.map((template) => {
            const state = responses[template.itemKey] || { response: '', comments: '' };
            const showComments = state.response === 'yes' || state.response === 'cm';

            return (
              <View key={template.itemKey} style={styles.examItem}>
                <ArabicText style={styles.itemLabel}>{template.labelAr}</ArabicText>

                <RadioGroup
                  label=""
                  options={[...EXAM_RESPONSE_OPTIONS]}
                  selectedValue={state.response}
                  onValueChange={(val) => handleResponseChange(template.itemKey, val)}
                  direction="row"
                />

                {showComments && (
                  <TextInputField
                    label="ملاحظات"
                    value={state.comments}
                    onChangeText={(val) => handleCommentsChange(template.itemKey, val)}
                    multiline
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="حفظ"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            icon={<Ionicons name="checkmark" size={20} color={colors.primaryContrast} />}
          />
          <Button
            title="إلغاء"
            onPress={() => router.back()}
            variant="secondary"
            disabled={isSaving}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    color: colors.primaryContrast,
    flex: 1,
  },
  segmentWrapper: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  spacer: {
    height: 40,
  },
});
