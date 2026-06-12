import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import MultiSelect from '../../../src/presentation/components/MultiSelect';
import Button from '../../../src/presentation/components/Button';

const COMORBIDITY_OPTIONS = [
  { label: 'سكري', value: 'diabetes' },
  { label: 'ضغط', value: 'hypertension' },
  { label: 'قلب', value: 'heart_disease' },
  { label: 'ربو', value: 'asthma' },
  { label: 'فشل كلوي', value: 'renal_failure' },
  { label: 'كبد', value: 'liver_disease' },
  { label: 'سرطان', value: 'cancer' },
  { label: 'فقر دم', value: 'anemia' },
  { label: 'سمنة', value: 'obesity' },
  { label: 'غدة درقية', value: 'thyroid' },
  { label: 'صرع', value: 'epilepsy' },
  { label: 'ذئبة حمراء', value: 'lupus' },
] as const;

const COVID_OPTIONS = [
  { label: 'لم يصب', value: 'never' },
  { label: 'متعافٍ', value: 'recovered' },
  { label: 'مصاب حالياً', value: 'active' },
  { label: 'مطعم', value: 'vaccinated' },
] as const;

const medicalHistorySchema = z.object({
  chiefComplaint: z.string().min(1, 'حقل الشكوى الرئيسية مطلوب'),
  currentDiagnosis: z.string().min(1, 'حقل التشخيص الحالي مطلوب'),
  icd10Code: z.string(),
  comorbidities: z.array(z.string()),
  surgicalHistory: z.string(),
  pastMedicalHistory: z.string(),
  familyHistory: z.string(),
  medicationAllergies: z.string(),
  covid19Status: z.string().min(1, 'حالة كوفيد-19 مطلوبة'),
  comments: z.string(),
});

type MedicalHistoryFormValues = z.infer<typeof medicalHistorySchema>;

export default function MedicalHistoryScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MedicalHistoryFormValues>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      chiefComplaint: '',
      currentDiagnosis: '',
      icd10Code: '',
      comorbidities: [],
      surgicalHistory: '',
      pastMedicalHistory: '',
      familyHistory: '',
      medicationAllergies: '',
      covid19Status: '',
      comments: '',
    },
  });

  useEffect(() => {
    loadExistingData();
  }, [patientId]);

  async function loadExistingData() {
    try {
      setIsLoading(true);
      const { GetMedicalHistoryUseCase } = await import('../../../src/domain/use-cases/GetMedicalHistoryUseCase');
      const useCase = new GetMedicalHistoryUseCase();
      const data = await useCase.execute(patientId);
      if (data) {
        let comorbiditiesArray: string[] = [];
        if (data.comorbidities) {
          try {
            const parsed = JSON.parse(data.comorbidities);
            if (Array.isArray(parsed)) {
              comorbiditiesArray = parsed;
            }
          } catch {
            comorbiditiesArray = [];
          }
        }
        reset({
          chiefComplaint: data.chiefComplaint || '',
          currentDiagnosis: data.currentDiagnosis || '',
          icd10Code: data.icd10Code || '',
          comorbidities: comorbiditiesArray,
          surgicalHistory: data.surgicalHistory || '',
          pastMedicalHistory: data.pastMedicalHistory || '',
          familyHistory: data.familyHistory || '',
          medicationAllergies: data.medicationAllergies || '',
          covid19Status: data.covid19Status || '',
          comments: data.comments || '',
        });
      }
    } catch {
      /* silent fail */
    } finally {
      setIsLoading(false);
    }
  }

  const onSubmit = useCallback(async (values: MedicalHistoryFormValues) => {
    try {
      setIsSaving(true);
      const { SaveMedicalHistoryUseCase } = await import('../../../src/domain/use-cases/SaveMedicalHistoryUseCase');
      const useCase = new SaveMedicalHistoryUseCase();
      await useCase.execute({
        patientId,
        chiefComplaint: values.chiefComplaint,
        currentDiagnosis: values.currentDiagnosis,
        icd10Code: values.icd10Code || undefined,
        comorbidities: values.comorbidities.length > 0 ? JSON.stringify(values.comorbidities) : undefined,
        surgicalHistory: values.surgicalHistory || undefined,
        pastMedicalHistory: values.pastMedicalHistory || undefined,
        familyHistory: values.familyHistory || undefined,
        medicationAllergies: values.medicationAllergies || undefined,
        covid19Status: values.covid19Status,
        comments: values.comments || undefined,
      });
      router.replace({ pathname: "/patient/[id]/social-history", params: { id: patientId } });
    } catch {
      /* error handled via toast */
    } finally {
      setIsSaving(false);
    }
  }, [patientId, router]);

  const renderDropdown = (name: keyof MedicalHistoryFormValues, label: string, options: readonly { label: string; value: string }[]) => (
    <DropdownField
      label={label}
      options={options}
      selectedValue={watch(name) as string}
      onValueChange={(val) => setValue(name, val, { shouldValidate: true })}
      error={errors[name]?.message}
      placeholder={`اختر ${label}...`}
    />
  );

  const renderRadioGroup = (name: keyof MedicalHistoryFormValues, label: string, options: readonly { label: string; value: string }[], required = false) => (
    <RadioGroup
      label={required ? `${label}` : label}
      options={options}
      selectedValue={watch(name) as string}
      onValueChange={(val) => setValue(name, val, { shouldValidate: true })}
      error={errors[name]?.message}
      direction="row"
    />
  );

  const renderTextInput = (name: keyof MedicalHistoryFormValues, label: string, opts?: { keyboardType?: 'default' | 'numeric'; multiline?: boolean }) => (
    <TextInputField
      label={label}
      value={(watch(name) as string) || ''}
      onChangeText={(val) => setValue(name, val, { shouldValidate: true })}
      error={errors[name]?.message}
      keyboardType={opts?.keyboardType}
      multiline={opts?.multiline}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="medkit-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>التاريخ المرضي</ArabicText>
          </View>
        </View>

        {/* Chief Complaint & Diagnosis */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>الشكوى الرئيسية والتشخيص</ArabicText>
          {renderTextInput('chiefComplaint', 'الشكوى الرئيسية', { multiline: true })}
          {renderTextInput('currentDiagnosis', 'التشخيص الحالي', { multiline: true })}
          {renderTextInput('icd10Code', 'رمز ICD-10 (اختياري)')}
        </View>

        {/* Comorbidities */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>الأمراض المصاحبة</ArabicText>
          <MultiSelect
            label="اختر الأمراض المصاحبة (إن وجدت)"
            options={COMORBIDITY_OPTIONS}
            selectedValues={watch('comorbidities')}
            onSelectionChange={(vals) => setValue('comorbidities', vals, { shouldValidate: true })}
            columns={2}
          />
        </View>

        {/* Medical History */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>التاريخ الطبي</ArabicText>
          {renderTextInput('surgicalHistory', 'التاريخ الجراحي', { multiline: true })}
          {renderTextInput('pastMedicalHistory', 'التاريخ الطبي السابق', { multiline: true })}
          {renderTextInput('familyHistory', 'التاريخ العائلي', { multiline: true })}
        </View>

        {/* Allergies & Immunity */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>الحساسية والمناعة</ArabicText>
          {renderTextInput('medicationAllergies', 'حساسية الأدوية', { multiline: true })}
          {renderRadioGroup('covid19Status', 'حالة كوفيد-19', COVID_OPTIONS, true)}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>ملاحظات</ArabicText>
          {renderTextInput('comments', 'ملاحظات إضافية', { multiline: true })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="حفظ"
            onPress={handleSubmit(onSubmit)}
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
    </KeyboardAvoidingView>
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
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    paddingBottom: spacing.sm,
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  spacer: {
    height: 40,
  },
});
