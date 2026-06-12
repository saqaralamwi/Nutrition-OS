import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import DatePickerField from '../../../src/presentation/components/DatePickerField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { getDatabase } from '../../../src/data/database';
import { Q } from '@nozbe/watermelondb';
import CalculationModel from '../../../src/data/models/Calculation';
import { Patient } from '../../../src/domain/entities/Patient';

const DISCHARGE_STATUS_OPTIONS = [
  { label: 'تحسن (Improved)', value: 'improved' },
  { label: 'مستقر (Stable)', value: 'stable' },
  { label: 'تدهور (Deteriorated)', value: 'deteriorated' },
  { label: 'نقل لمستشفى آخر (Transferred)', value: 'transferred' },
  { label: 'وفاة (Deceased)', value: 'deceased' },
];

const dischargeFormSchema = z.object({
  dischargeStatus: z.string().min(1, 'حالة الخروج مطلوبة'),
  finalWeight: z.string()
    .min(1, 'الوزن النهائي مطلوب')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1 && num <= 500;
    }, { message: 'يجب أن يكون الوزن بين 1 و 500 كجم' }),
  totalDaysOnEn: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 0;
  }, { message: 'يجب أن يكون عدد الأيام 0 أو أكثر' }),
  totalDaysOnPn: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 0;
  }, { message: 'يجب أن يكون عدد الأيام 0 أو أكثر' }),
  homeNutritionPlan: z.string().min(1, 'التوصيات المنزلية مطلوبة'),
  followUpRequired: z.boolean(),
});

type DischargeFormValues = z.infer<typeof dischargeFormSchema>;

export default function DischargeScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [baselineWeight, setBaselineWeight] = useState<number | null>(null);
  const [dischargeDate, setDischargeDate] = useState<Date>(new Date());
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | null>(null);

  const form = useForm<DischargeFormValues>({
    resolver: zodResolver(dischargeFormSchema),
    defaultValues: {
      dischargeStatus: 'improved',
      finalWeight: '',
      totalDaysOnEn: '',
      totalDaysOnPn: '',
      homeNutritionPlan: '',
      followUpRequired: false,
    },
  });

  const watchFinalWeight = form.watch('finalWeight');
  const watchFollowUpRequired = form.watch('followUpRequired');

  useEffect(() => {
    loadData();
  }, [patientId]);

  async function loadData() {
    try {
      setIsLoading(true);

      // Load Patient details
      const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
      const patientUc = new GetPatientUseCase();
      const p = await patientUc.execute(patientId);
      setPatient(p);

      // Fetch baseline weight (oldest body_metrics calculation)
      const db = await getDatabase();
      const results = await db.get<CalculationModel>('calculations')
        .query(
          Q.where('patient_id', patientId),
          Q.where('calculation_type', 'body_metrics'),
          Q.sortBy('created_at', 'asc'),
        )
        .fetch();

      if (results.length > 0) {
        const inputs = JSON.parse(results[0].inputValues || '{}');
        setBaselineWeight(inputs.weightKg || null);
      }

      // Check if existing discharge summary already exists
      const { GetDischargeSummaryUseCase } = await import('../../../src/domain/use-cases/GetDischargeSummaryUseCase');
      const getUc = new GetDischargeSummaryUseCase();
      const existing = await getUc.execute(patientId);

      if (existing) {
        setDischargeDate(new Date(existing.dischargeDate));
        setNextFollowUpDate(existing.nextFollowUpDate ? new Date(existing.nextFollowUpDate) : null);
        form.reset({
          dischargeStatus: existing.dischargeStatus,
          finalWeight: String(existing.finalWeight),
          totalDaysOnEn: existing.totalDaysOnEn !== undefined ? String(existing.totalDaysOnEn) : '',
          totalDaysOnPn: existing.totalDaysOnPn !== undefined ? String(existing.totalDaysOnPn) : '',
          homeNutritionPlan: existing.homeNutritionPlan,
          followUpRequired: existing.followUpRequired,
        });
      }
    } catch (error) {
      console.error('Error loading discharge data:', error);
      showToast('فشل في تحميل البيانات السريرية', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const weightComparison = useMemo(() => {
    const finalWeightVal = parseFloat(watchFinalWeight);
    if (isNaN(finalWeightVal) || baselineWeight === null) {
      return null;
    }
    const diff = finalWeightVal - baselineWeight;
    if (diff > 0) {
      return {
        text: `زيادة في الوزن بمقدار ${diff.toFixed(1)} كجم منذ الدخول`,
        color: colors.success,
        icon: 'trending-up-outline' as const,
      };
    } else if (diff < 0) {
      return {
        text: `فقدان في الوزن بمقدار ${Math.abs(diff).toFixed(1)} كجم منذ الدخول`,
        color: colors.danger,
        icon: 'trending-down-outline' as const,
      };
    } else {
      return {
        text: 'الوزن مستقر وثابت منذ الدخول',
        color: colors.textSecondary,
        icon: 'remove-outline' as const,
      };
    }
  }, [watchFinalWeight, baselineWeight]);

  const weightLossDetails = useMemo(() => {
    const finalWeightVal = parseFloat(watchFinalWeight);
    if (isNaN(finalWeightVal) || !baselineWeight || baselineWeight <= 0) {
      return null;
    }
    const diff = finalWeightVal - baselineWeight;
    const lossPercentage = ((baselineWeight - finalWeightVal) / baselineWeight) * 100;
    return {
      diff,
      lossPercentage,
      isCriticalLoss: lossPercentage >= 5.0,
    };
  }, [watchFinalWeight, baselineWeight]);

  const onSubmit = useCallback(async (values: DischargeFormValues) => {
    if (values.followUpRequired && !nextFollowUpDate) {
      showToast('يرجى تحديد موعد المراجعة القادمة', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const { AddDischargeSummaryUseCase } = await import('../../../src/domain/use-cases/AddDischargeSummaryUseCase');
      const uc = new AddDischargeSummaryUseCase();
      await uc.execute({
        patientId,
        dischargeDate: dischargeDate.getTime(),
        dischargeStatus: values.dischargeStatus,
        finalWeight: parseFloat(values.finalWeight),
        totalDaysOnEn: values.totalDaysOnEn ? parseInt(values.totalDaysOnEn, 10) : undefined,
        totalDaysOnPn: values.totalDaysOnPn ? parseInt(values.totalDaysOnPn, 10) : undefined,
        homeNutritionPlan: values.homeNutritionPlan,
        followUpRequired: values.followUpRequired,
        nextFollowUpDate: values.followUpRequired && nextFollowUpDate ? nextFollowUpDate.getTime() : undefined,
      });

      showToast('تم حفظ ملخص خروج المريض وتحديث حالته بنجاح', 'success');
      router.replace(`/patient/${patientId}`);
    } catch (error) {
      console.error('Error saving discharge summary:', error);
      showToast('فشل في حفظ ملخص خروج المريض', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, dischargeDate, nextFollowUpDate, showToast, router]);

  const handlePrintDischargeSummary = useCallback(() => {
    const finalWeightVal = parseFloat(watchFinalWeight);
    const dischargeStatusVal = form.getValues('dischargeStatus');
    const totalDaysOnEnVal = form.getValues('totalDaysOnEn');
    const totalDaysOnPnVal = form.getValues('totalDaysOnPn');
    const homeNutritionPlanVal = form.getValues('homeNutritionPlan');
    const followUpRequiredVal = form.getValues('followUpRequired');

    const statusLabel = DISCHARGE_STATUS_OPTIONS.find(o => o.value === dischargeStatusVal)?.label || dischargeStatusVal;
    const formattedDischargeDate = dischargeDate.toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedFollowUpDate = followUpRequiredVal && nextFollowUpDate
      ? nextFollowUpDate.toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'لا يتطلب متابعة مجدولة';

    const weightLossPercentageText = weightLossDetails ? `${weightLossDetails.lossPercentage.toFixed(1)}%` : '0.0%';
    const criticalWarningAlertHtml = weightLossDetails && weightLossDetails.isCriticalLoss ? `
      <div style="background-color: #FFEAEA; border: 1px solid #FFC1C1; color: #C62828; padding: 12px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 15px;">
        ⚠️ تحذير فسيولوجي: المريض فقد ${weightLossDetails.lossPercentage.toFixed(1)}% من وزنه الأساسي خلال فترة التنويم. هذه الخسارة الحرجة تتطلب إدراج مكملات عالية البروتين والطاقة في خطة التغذية المنزلية.
      </div>
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير الخروج والتوصيات التغذوية النهائية - نظام إدارة التغذية العلاجية (نسخة قيد التطوير من أنس الأموي)</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; direction: rtl; text-align: right; }
          .header { text-align: center; border-bottom: 2px solid #004D40; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #004D40; font-size: 24px; margin: 0; }
          .header p { color: #666; margin: 5px 0 0 0; }
          .section { margin-bottom: 25px; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #fafafa; }
          .section-title { font-size: 16px; font-weight: bold; color: #004D40; border-bottom: 1px solid #004D40; padding-bottom: 8px; margin-top: 0; margin-bottom: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .grid-item { font-size: 14px; }
          .grid-item span { font-weight: bold; color: #555; }
          .plan-box { font-size: 14px; line-height: 1.6; white-space: pre-wrap; background-color: #fff; border: 1px solid #eee; padding: 10px; border-radius: 4px; }
          .footer { margin-top: 50px; text-align: center; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
          .signature { margin-top: 20px; font-weight: bold; color: #004D40; }
          @media print { body { margin: 20px; } .section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير الخروج والتوصيات التغذوية النهائية - نظام إدارة التغذية العلاجية (نسخة قيد التطوير من أنس الأموي)</h1>
        </div>
        <div class="section">
          <h2 class="section-title">البيانات العامة للمريض</h2>
          <div class="grid">
            <div class="grid-item"><span>اسم المريض:</span> ${patient?.fullName || 'غير متوفر'}</div>
            <div class="grid-item"><span>رقم الملف:</span> ${patient?.fileNumber || 'غير متوفر'}</div>
            <div class="grid-item"><span>العمر المحسوب:</span> ${patient?.age !== undefined ? `${patient.age} سنة` : 'غير متوفر'}</div>
            <div class="grid-item"><span>تاريخ الخروج:</span> ${formattedDischargeDate}</div>
          </div>
        </div>
        <div class="section">
          <h2 class="section-title">الحصاد السريري والوزن</h2>
          <div class="grid">
            <div class="grid-item"><span>الوزن عند الدخول:</span> ${baselineWeight !== null ? `${baselineWeight} كجم` : 'غير متوفر'}</div>
            <div class="grid-item"><span>الوزن النهائي عند الخروج:</span> ${isNaN(finalWeightVal) ? 'غير محدد' : `${finalWeightVal} كجم`}</div>
            <div class="grid-item"><span>نسبة التغير في الوزن:</span> ${weightLossPercentageText}</div>
            <div class="grid-item"><span>إجمالي أيام التغذية الأنبوبية (EN):</span> ${totalDaysOnEnVal || '0'} أيام</div>
            <div class="grid-item"><span>إجمالي أيام التغذية الوريدية (PN):</span> ${totalDaysOnPnVal || '0'} أيام</div>
          </div>
        </div>
        <div class="section">
          <h2 class="section-title">التقييم والوضع النهائي</h2>
          <div class="grid">
            <div class="grid-item"><span>حالة الخروج الطبية:</span> ${statusLabel}</div>
          </div>
          ${criticalWarningAlertHtml}
        </div>
        <div class="section">
          <h2 class="section-title">التوصيات التغذوية للمنزل</h2>
          <div class="plan-box">${homeNutritionPlanVal || 'لا توجد توصيات مسجلة'}</div>
          <div style="margin-top: 15px; font-size: 14px;">
            <span>موعد المراجعة القادمة:</span> ${formattedFollowUpDate}
          </div>
        </div>
        <div class="footer">
          <div class="signature">توقيع إخصائي التغذية العلاجية المشرف: د. أنس المنصور الأُموي</div>
        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        'طباعة التقرير',
        'تنبيه: ميزة الطباعة المباشرة من التطبيق تتطلب اتصال طابعة لاسلكية. سيتم محاكاة الطباعة في هذه النسخة التجريبية.',
        [{ text: 'موافق' }]
      );
    }
  }, [patient, baselineWeight, dischargeDate, nextFollowUpDate, watchFinalWeight, form, weightLossDetails]);

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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
            </TouchableOpacity>
            <ArabicText bold style={styles.headerTitle}>خروج المريض وتلخيص الحالة</ArabicText>
            {patient && <ArabicText style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</ArabicText>}
          </View>

          {/* Section 1: الملخص السريري ومقارنة الوزن */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
              <ArabicText bold style={styles.sectionTitle}>القسم 1: الملخص السريري ومقارنة الوزن</ArabicText>
            </View>

            <View style={styles.weightRow}>
              <View style={styles.weightCard}>
                <ArabicText style={styles.weightLabel}>الوزن عند الدخول</ArabicText>
                <ArabicText bold style={styles.weightValue}>
                  {baselineWeight !== null ? `${baselineWeight} كجم` : 'غير متوفر'}
                </ArabicText>
              </View>

              <View style={styles.weightCard}>
                <ArabicText style={styles.weightLabel}>الوزن النهائي عند الخروج</ArabicText>
                <TextInputField
                  label=""
                  value={form.watch('finalWeight')}
                  onChangeText={(v) => form.setValue('finalWeight', v, { shouldValidate: true })}
                  placeholder="الوزن الحالي"
                  keyboardType="decimal-pad"
                  error={form.formState.errors.finalWeight?.message}
                  required
                />
              </View>
            </View>

            {weightComparison && (
              <View style={[styles.comparisonAlert, { backgroundColor: weightComparison.color + '10', borderColor: weightComparison.color + '30' }]}>
                <Ionicons name={weightComparison.icon} size={20} color={weightComparison.color} />
                <ArabicText style={[styles.comparisonText, { color: weightComparison.color }]}>
                  {weightComparison.text}
                </ArabicText>
              </View>
            )}

            {weightLossDetails && weightLossDetails.isCriticalLoss && (
              <View style={styles.criticalLossAlertContainer}>
                <Ionicons name="warning-outline" size={22} color="#D32F2F" />
                <ArabicText style={styles.criticalLossAlertText}>
                  ⚠️ تحذير فسيولوجي: المريض فقد {weightLossDetails.lossPercentage.toFixed(1)}% من وزنه الأساسي خلال فترة التنويم. هذه الخسارة الحرجة تتطلب إدراج مكملات عالية البروتين والطاقة في خطة التغذية المنزلية.
                </ArabicText>
              </View>
            )}

            <DropdownField
              label="حالة الخروج الطبية"
              options={DISCHARGE_STATUS_OPTIONS}
              selectedValue={form.watch('dischargeStatus')}
              onValueChange={(val) => form.setValue('dischargeStatus', val, { shouldValidate: true })}
              error={form.formState.errors.dischargeStatus?.message}
              required
            />

            <DatePickerField
              label="تاريخ الخروج"
              value={dischargeDate}
              onChange={(d) => setDischargeDate(d)}
              required
            />
          </View>

          {/* Section 2: تفاصيل الدعم التغذوي */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
              <ArabicText bold style={styles.sectionTitle}>القسم 2: تفاصيل الدعم التغذوي أثناء الإقامة</ArabicText>
            </View>

            <TextInputField
              label="إجمالي عدد أيام التغذية الأنبوبية (Enteral Nutrition)"
              value={form.watch('totalDaysOnEn') || ''}
              onChangeText={(v) => form.setValue('totalDaysOnEn', v, { shouldValidate: true })}
              placeholder="اختياري (أيام)"
              keyboardType="numeric"
              error={form.formState.errors.totalDaysOnEn?.message}
            />

            <TextInputField
              label="إجمالي عدد أيام التغذية الوريدية (Parenteral Nutrition)"
              value={form.watch('totalDaysOnPn') || ''}
              onChangeText={(v) => form.setValue('totalDaysOnPn', v, { shouldValidate: true })}
              placeholder="اختياري (أيام)"
              keyboardType="numeric"
              error={form.formState.errors.totalDaysOnPn?.message}
            />
          </View>

          {/* Section 3: التوصيات المنزلية وموعد المراجعة */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
              <ArabicText bold style={styles.sectionTitle}>القسم 3: التوصيات المنزلية وموعد المراجعة</ArabicText>
            </View>

            <TextInputField
              label="التوصيات المنزلية وخطة الدعم التغذوي"
              value={form.watch('homeNutritionPlan')}
              onChangeText={(v) => form.setValue('homeNutritionPlan', v, { shouldValidate: true })}
              placeholder="اكتب التوصيات المنزلية، المكملات المقترحة، خطة الانتقال التغذوية..."
              multiline
              error={form.formState.errors.homeNutritionPlan?.message}
              required
            />

            <RadioGroup
              label="هل يتطلب مراجعة ومتابعة في العيادة؟"
              options={[
                { label: 'نعم، يتطلب متابعة', value: 'yes' },
                { label: 'لا يتطلب متابعة', value: 'no' },
              ]}
              selectedValue={watchFollowUpRequired ? 'yes' : 'no'}
              onValueChange={(val) => form.setValue('followUpRequired', val === 'yes')}
              direction="row"
            />

            {watchFollowUpRequired && (
              <DatePickerField
                label="تاريخ المراجعة القادمة"
                value={nextFollowUpDate}
                onChange={(d) => setNextFollowUpDate(d)}
                required
              />
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="حفظ وإتمام عملية الخروج"
              onPress={form.handleSubmit(onSubmit)}
              loading={isSaving}
              disabled={isSaving}
              icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.primaryContrast} />}
            />
            <Button
              title="طباعة تقرير الخروج الشامل (PDF)"
              onPress={handlePrintDischargeSummary}
              variant="secondary"
              disabled={isSaving}
              icon={<Ionicons name="print-outline" size={20} color={colors.primary} />}
            />
            <Button
              title="إلغاء والعودة"
              onPress={() => router.back()}
              variant="secondary"
              disabled={isSaving}
            />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  loadingText: { fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  backBtn: { position: 'absolute', top: 54, start: spacing.md, zIndex: 1, padding: 4 },
  headerTitle: { fontSize: 20, color: colors.primaryContrast, textAlign: 'right', marginTop: spacing.lg },
  headerSubtitle: { fontSize: 13, color: colors.primaryContrast, opacity: 0.8, textAlign: 'right', marginTop: spacing.xs },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: { fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  weightRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weightCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  weightLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  weightValue: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  comparisonAlert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  comparisonText: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  actions: { padding: spacing.md, gap: spacing.sm },
  spacer: { height: 40 },
  criticalLossAlertContainer: {
    backgroundColor: '#FFEAEA',
    borderColor: '#FFC1C1',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  criticalLossAlertText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
});
