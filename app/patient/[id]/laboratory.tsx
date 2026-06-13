import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import DatePickerField from '../../../src/presentation/components/DatePickerField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { formatSafeDate } from '../../../src/utils/date';
// import Tesseract from 'tesseract.js';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';
import { InterpretationResult } from '../../../src/domain/entities/LabResult';
import { LabResultRecord } from '../../../src/domain/repositories/ILabResultRepository';
import { InterpretLabResultUseCase } from '../../../src/domain/use-cases/InterpretLabResultUseCase';

const INTERPRETATION_COLORS: Record<InterpretationResult, string> = {
  critically_low: '#8B0000',
  low: '#3498DB',
  normal: colors.success,
  high: '#F39C12',
  critically_high: colors.danger,
};

const INTERPRETATION_BG: Record<InterpretationResult, string> = {
  critically_low: '#FFE0E6',
  low: '#E8F4FD',
  normal: '#E8F5E9',
  high: '#FFF3E0',
  critically_high: '#FFEBEE',
};

const INTERPRETATION_LABELS: Record<InterpretationResult, string> = {
  critically_low: 'منخفض جداً',
  low: 'منخفض',
  normal: 'طبيعي',
  high: 'مرتفع',
  critically_high: 'مرتفع جداً',
};

interface CatalogOption {
  label: string;
  value: string;
  testNameEn: string;
  defaultUnit: string;
  defaultRangeLow: number;
  defaultRangeHigh: number;
  criticalLowFactor: number | null;
  criticalHighFactor: number | null;
  category: string;
}

const OCR_RULES = [
  {
    testNameEn: 'Albumin',
    patterns: [
      /albumin\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /ألبومين\s*[:=\-]?\s*(\d+(?:\.\d+)?)/,
      /alb\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ]
  },
  {
    testNameEn: 'Creatinine',
    patterns: [
      /creatinine\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /كرياتينين\s*[:=\-]?\s*(\d+(?:\.\d+)?)/,
      /creat\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /cr\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ]
  },
  {
    testNameEn: 'Urea',
    patterns: [
      /urea\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /يوريا\s*[:=\-]?\s*(\d+(?:\.\d+)?)/,
    ]
  },
  {
    testNameEn: 'ALT (SGPT)',
    patterns: [
      /alt\s*(?:\(sgpt\))?\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /sgpt\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ]
  },
  {
    testNameEn: 'AST (SGOT)',
    patterns: [
      /ast\s*(?:\(sgot\))?\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /sgot\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ]
  },
  {
    testNameEn: 'HbA1c',
    patterns: [
      /hba1c\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /a1c\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /التراكمي\s*[:=\-]?\s*(\d+(?:\.\d+)?)/,
      /السكر\s+التراكمي\s*[:=\-]?\s*(\d+(?:\.\d+)?)/,
    ]
  }
];

export default function LaboratoryScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(true);
  const [labResults, setLabResults] = useState<LabResultRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogOption | null>(null);
  const [liveInterpretation, setLiveInterpretation] = useState<InterpretationResult | null>(null);
  const [testDate, setTestDate] = useState<Date | null>(null);

  const defaultRangeLowRef = useRef<number>(0);
  const defaultRangeHighRef = useRef<number>(0);

  const handleOcrClick = () => {
    setShowAddModal(false);
    router.push(`/patient/${patientId}/ocr`);
  };

  const handleSave = useCallback(async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    return patientId;
  }, [patientId]);

  const labSchema = useMemo(() => z.object({
    testName: z.string().min(1, 'اسم الفحص مطلوب'),
    resultValue: z.string().min(1, 'النتيجة مطلوبة'),
    unit: z.string().min(1, 'الوحدة مطلوبة'),
    referenceRangeLow: z.string().min(1, 'الحد الأدنى مطلوب'),
    referenceRangeHigh: z.string().min(1, 'الحد الأعلى مطلوب'),
    overrideReason: z.string(),
    comments: z.string(),
  }).superRefine((data, ctx) => {
    const refLow = parseFloat(data.referenceRangeLow);
    const refHigh = parseFloat(data.referenceRangeHigh);
    if (!isNaN(refLow) && !isNaN(refHigh) && refLow >= refHigh) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'الحد الأدنى يجب أن يكون أقل من الحد الأعلى',
        path: ['referenceRangeHigh'],
      });
    }
    const lowDiffers = !isNaN(refLow) && refLow !== defaultRangeLowRef.current;
    const highDiffers = !isNaN(refHigh) && refHigh !== defaultRangeHighRef.current;
    if ((lowDiffers || highDiffers) && !data.overrideReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'سبب التعديل مطلوب عند تغيير النطاق المرجعي',
        path: ['overrideReason'],
      });
    }
  }), []);

  type LabFormValues = z.infer<typeof labSchema>;

  const form = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      testName: '',
      resultValue: '',
      unit: '',
      referenceRangeLow: '',
      referenceRangeHigh: '',
      overrideReason: '',
      comments: '',
    },
  });

  const watchResultValue = form.watch('resultValue');
  const watchRefLow = form.watch('referenceRangeLow');
  const watchRefHigh = form.watch('referenceRangeHigh');

  useEffect(() => {
    Promise.all([loadResults(), loadCatalog()]).finally(() => setIsLoading(false));
  }, [patientId]);

  async function loadResults() {
    const { GetLabResultsUseCase } = await import('../../../src/domain/use-cases/GetLabResultsUseCase');
    const uc = new GetLabResultsUseCase();
    const records = await uc.execute(patientId);
    setLabResults(records);
  }

  async function loadCatalog() {
    const { TestCatalogRepository } = await import('../../../src/data/repositories/TestCatalogRepository');
    const repo = new TestCatalogRepository();
    const items = await repo.getAll();
    setCatalogOptions(items.map((item) => ({
      label: item.testNameAr,
      value: item.testNameEn,
      testNameEn: item.testNameEn,
      defaultUnit: item.defaultUnit,
      defaultRangeLow: item.defaultRangeLow,
      defaultRangeHigh: item.defaultRangeHigh,
      criticalLowFactor: item.criticalLowFactor,
      criticalHighFactor: item.criticalHighFactor,
      category: item.category,
    })));
  }

  const handleTestSelect = useCallback((testNameEn: string) => {
    const item = catalogOptions.find((c) => c.value === testNameEn) || null;
    setSelectedCatalogItem(item);
    if (item) {
      defaultRangeLowRef.current = item.defaultRangeLow;
      defaultRangeHighRef.current = item.defaultRangeHigh;
      form.setValue('unit', item.defaultUnit);
      form.setValue('referenceRangeLow', String(item.defaultRangeLow));
      form.setValue('referenceRangeHigh', String(item.defaultRangeHigh));
      form.setValue('overrideReason', '');
      form.clearErrors();
      recalcInterpretation(
        parseFloat(form.getValues('resultValue')),
        item.defaultRangeLow,
        item.defaultRangeHigh,
        item.criticalLowFactor,
        item.criticalHighFactor,
      );
    }
  }, [catalogOptions, form]);

  const interpreterRef = useRef(new InterpretLabResultUseCase());

  const recalcInterpretation = useCallback(
    (val: number, low: number, high: number, critLow: number | null, critHigh: number | null) => {
      if (isNaN(val) || isNaN(low) || isNaN(high) || low >= high) {
        setLiveInterpretation(null);
        return;
      }
      const result = interpreterRef.current.execute({
        resultValue: val,
        referenceRangeLow: low,
        referenceRangeHigh: high,
        criticalLowFactor: critLow,
        criticalHighFactor: critHigh,
      });
      setLiveInterpretation(result);
    },
    [],
  );

  useEffect(() => {
    const val = parseFloat(watchResultValue);
    const low = parseFloat(watchRefLow);
    const high = parseFloat(watchRefHigh);
    const cLow = selectedCatalogItem?.criticalLowFactor ?? null;
    const cHigh = selectedCatalogItem?.criticalHighFactor ?? null;
    recalcInterpretation(val, low, high, cLow, cHigh);
  }, [watchResultValue, watchRefLow, watchRefHigh, selectedCatalogItem, recalcInterpretation]);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('حذف نتيجة', `هل أنت متأكد من حذف "${name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const { LabResultRepository } = await import('../../../src/data/repositories/LabResultRepository');
            const repo = new LabResultRepository();
            await repo.delete(id);
            setLabResults((prev) => prev.filter((r) => r.id !== id));
            showToast('تم الحذف', 'success');
          } catch { showToast('فشل الحذف', 'error'); }
        },
      },
    ]);
  }, [showToast]);

  const onSubmit = useCallback(async (values: LabFormValues) => {
    try {
      setIsSaving(true);
      const { AddLabResultUseCase } = await import('../../../src/domain/use-cases/AddLabResultUseCase');
      const uc = new AddLabResultUseCase();
      await uc.execute(
        {
          patientId,
          testName: values.testName,
          resultValue: parseFloat(values.resultValue),
          unit: values.unit,
          referenceRangeLow: parseFloat(values.referenceRangeLow),
          referenceRangeHigh: parseFloat(values.referenceRangeHigh),
          interpretation: '',
          testDate: testDate?.toISOString() || new Date().toISOString(),
          comments: values.comments || undefined,
          overrideReason: values.overrideReason || undefined,
        },
        selectedCatalogItem?.criticalLowFactor,
        selectedCatalogItem?.criticalHighFactor,
      );
      await loadResults();
      setShowAddModal(false);
      form.reset();
      setSelectedCatalogItem(null);
      setLiveInterpretation(null);
      setTestDate(null);
      showToast('تم إضافة النتيجة', 'success');
    } catch {
      showToast('فشل إضافة النتيجة', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, testDate, selectedCatalogItem, form, showToast]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="flask-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>التحاليل المخبرية</ArabicText>
          </View>
        </View>

        {/* Lab Results List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArabicText bold style={styles.sectionTitle}>النتائج المسجلة</ArabicText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/patient/${patientId}/ocr`)}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <ArabicText style={styles.addButtonText}>مسح ذكي (OCR)</ArabicText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
                <ArabicText style={styles.addButtonText}>إضافة نتيجة</ArabicText>
              </TouchableOpacity>
            </View>
          </View>

          {labResults.length === 0 ? (
            <ArabicText style={styles.emptyText}>لا توجد نتائج مختبرية مسجلة</ArabicText>
          ) : (
            labResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.resultCard}
                onLongPress={() => handleDelete(result.id!, result.testName)}
                activeOpacity={0.8}
              >
                <View style={styles.resultHeader}>
                  <View style={styles.resultInfo}>
                    <ArabicText bold style={styles.testName}>{result.testName}</ArabicText>
                    <ArabicText style={styles.testDateText}>
                      {formatSafeDate(result.testDate)}
                    </ArabicText>
                  </View>
                  <View style={[styles.interpBadge, { backgroundColor: INTERPRETATION_BG[result.interpretation as InterpretationResult] || '#F0F0F0' }]}>
                    <ArabicText style={[styles.interpBadgeText, { color: INTERPRETATION_COLORS[result.interpretation as InterpretationResult] || colors.textSecondary }]}>
                      {INTERPRETATION_LABELS[result.interpretation as InterpretationResult] || result.interpretation}
                    </ArabicText>
                  </View>
                </View>
                <View style={styles.resultBody}>
                  <ArabicText style={styles.resultValue}>
                    {result.resultValue} <ArabicText style={styles.resultUnit}>{result.unit}</ArabicText>
                  </ArabicText>
                  <ArabicText style={styles.refRange}>
                    النطاق المرجعي: {result.referenceRangeLow} - {result.referenceRangeHigh} {result.unit}
                  </ArabicText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TripleActionFooter
          patientId={patientId}
          screenKey="laboratory"
          onSave={handleSave}
          isSaving={false}
          isValid={true}
        />

        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Lab Result Modal */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ArabicText bold style={styles.modalTitle}>إضافة نتيجة مختبرية</ArabicText>
              <TouchableOpacity onPress={() => { setShowAddModal(false); form.reset(); setSelectedCatalogItem(null); setLiveInterpretation(null); setTestDate(null); }}>
                <Ionicons name="close" size={28} color={colors.primaryContrast} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.ocrButton}
                onPress={handleOcrClick}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={20} color="#FFF" />
                <ArabicText bold style={styles.ocrButtonText}>
                  📸 إدخال البيانات الذكي عبر التصوير (OCR Scan)
                </ArabicText>
              </TouchableOpacity>
              <DropdownField
                label="اسم الفحص"
                options={catalogOptions.map((o) => ({ label: o.label, value: o.value }))}
                selectedValue={form.watch('testName')}
                onValueChange={(val) => {
                  form.setValue('testName', val, { shouldValidate: true });
                  handleTestSelect(val);
                }}
                error={form.formState.errors.testName?.message}
                placeholder="اختر الفحص..."
                required
              />

              <TextInputField
                label="النتيجة"
                value={form.watch('resultValue')}
                onChangeText={(v) => form.setValue('resultValue', v, { shouldValidate: true })}
                keyboardType="decimal-pad"
                error={form.formState.errors.resultValue?.message}
                required
              />

              {/* Live Interpretation Badge */}
              {liveInterpretation && (
                <View style={[styles.liveBadge, { backgroundColor: INTERPRETATION_BG[liveInterpretation], borderColor: INTERPRETATION_COLORS[liveInterpretation] }]}>
                  <Ionicons
                    name={
                      liveInterpretation === 'normal' ? 'checkmark-circle' :
                      liveInterpretation === 'critically_low' || liveInterpretation === 'critically_high' ? 'alert-circle' :
                      'alert-circle-outline'
                    }
                    size={20}
                    color={INTERPRETATION_COLORS[liveInterpretation]}
                  />
                  <ArabicText style={[styles.liveBadgeText, { color: INTERPRETATION_COLORS[liveInterpretation] }]}>
                    التفسير: {INTERPRETATION_LABELS[liveInterpretation]}
                  </ArabicText>
                </View>
              )}

              <TextInputField
                label="الوحدة"
                value={form.watch('unit')}
                onChangeText={(v) => form.setValue('unit', v, { shouldValidate: true })}
                error={form.formState.errors.unit?.message}
                required
              />

              <TextInputField
                label="الحد الأدنى للنطاق المرجعي"
                value={form.watch('referenceRangeLow')}
                onChangeText={(v) => form.setValue('referenceRangeLow', v, { shouldValidate: true })}
                keyboardType="decimal-pad"
                error={form.formState.errors.referenceRangeLow?.message}
                required
              />

              <TextInputField
                label="الحد الأعلى للنطاق المرجعي"
                value={form.watch('referenceRangeHigh')}
                onChangeText={(v) => form.setValue('referenceRangeHigh', v, { shouldValidate: true })}
                keyboardType="decimal-pad"
                error={form.formState.errors.referenceRangeHigh?.message}
                required
              />

              <TextInputField
                label="سبب التعديل (مطلوب إذا تم تغيير النطاق المرجعي)"
                value={form.watch('overrideReason')}
                onChangeText={(v) => form.setValue('overrideReason', v, { shouldValidate: true })}
                error={form.formState.errors.overrideReason?.message}
                multiline
              />

              <DatePickerField
                label="تاريخ الفحص"
                value={testDate}
                onChange={(d) => setTestDate(d)}
              />

              <TextInputField
                label="ملاحظات"
                value={form.watch('comments')}
                onChangeText={(v) => form.setValue('comments', v)}
                multiline
              />

              <View style={styles.modalActions}>
                <Button
                  title="إضافة"
                  onPress={form.handleSubmit(onSubmit)}
                  loading={isSaving}
                  disabled={isSaving}
                />
                <Button
                  title="إلغاء"
                  variant="secondary"
                  onPress={() => { setShowAddModal(false); form.reset(); setSelectedCatalogItem(null); setLiveInterpretation(null); setTestDate(null); }}
                  disabled={isSaving}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  loadingText: { fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: 22, color: colors.primaryContrast, flex: 1 },
  section: { backgroundColor: colors.surface, margin: spacing.md, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceSecondary, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: 16, color: colors.textPrimary },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
  addButtonText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  emptyText: { fontSize: 14, color: colors.textDisabled, textAlign: 'center', paddingVertical: spacing.lg },
  resultCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: spacing.sm + 2, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  resultInfo: { flex: 1 },
  testName: { fontSize: 15, color: colors.textPrimary },
  testDateText: { fontSize: 11, color: colors.textDisabled, marginTop: 2 },
  interpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  interpBadgeText: { fontSize: 11, fontWeight: '700' },
  resultBody: { gap: 2, marginTop: spacing.xs },
  resultValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  resultUnit: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  refRange: { fontSize: 12, color: colors.textSecondary },
  spacer: { height: 40 },
  modalContainer: { flex: 1, backgroundColor: colors.surfaceSecondary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.md, paddingHorizontal: spacing.md },
  modalTitle: { fontSize: 20, color: colors.primaryContrast },
  modalContent: { padding: spacing.md },
  modalActions: { gap: spacing.sm, marginTop: spacing.md },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: 8, borderWidth: 1, marginBottom: spacing.md },
  liveBadgeText: { fontSize: 14, fontWeight: '600', flex: 1 },
  ocrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  ocrButtonDisabled: {
    opacity: 0.6,
  },
  ocrButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  ocrResultsContainer: {
    backgroundColor: '#F3F4F6',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ocrResultsTitle: {
    fontSize: 12,
    color: '#374151',
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  ocrChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ocrChip: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ocrChipText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '600',
  },
});
