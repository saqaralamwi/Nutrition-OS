import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import Button from '../../../src/presentation/components/Button';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';

const MARITAL_OPTIONS = [
  { label: 'أعزب/عزباء', value: 'single' },
  { label: 'متزوج/متزوجة', value: 'married' },
  { label: 'مطلق/مطلقة', value: 'divorced' },
  { label: 'أرمل/أرملة', value: 'widowed' },
] as const;

const EDUCATION_OPTIONS = [
  { label: 'غير متعلم', value: 'none' },
  { label: 'ابتدائي', value: 'primary' },
  { label: 'متوسط', value: 'intermediate' },
  { label: 'ثانوي', value: 'secondary' },
  { label: 'جامعي', value: 'university' },
  { label: 'دراسات عليا', value: 'postgraduate' },
] as const;

const OCCUPATION_OPTIONS = [
  { label: 'موظف', value: 'employed' },
  { label: 'عامل حر', value: 'self_employed' },
  { label: 'متقاعد', value: 'retired' },
  { label: 'طالب', value: 'student' },
  { label: 'رب/ربة منزل', value: 'housewife' },
  { label: 'عاطل عن العمل', value: 'unemployed' },
] as const;

const LIVING_AREA_OPTIONS = [
  { label: 'مدينة', value: 'urban' },
  { label: 'ريف', value: 'rural' },
  { label: 'بادية', value: 'desert' },
] as const;

const FAMILY_STRUCTURE_OPTIONS = [
  { label: 'يعيش بمفرده', value: 'alone' },
  { label: 'مع الزوج/الزوجة', value: 'with_spouse' },
  { label: 'مع الأبناء', value: 'with_children' },
  { label: 'مع الوالدين', value: 'with_parents' },
  { label: 'مع العائلة الممتدة', value: 'extended_family' },
] as const;

const INCOME_LEVEL_OPTIONS = [
  { label: 'أقل من 3000 ريال', value: 'low' },
  { label: '3000 - 8000 ريال', value: 'middle_low' },
  { label: '8000 - 15000 ريال', value: 'middle' },
  { label: 'أكثر من 15000 ريال', value: 'high' },
] as const;

const YES_NO_OPTIONS = [
  { label: 'نعم', value: 'yes' },
  { label: 'لا', value: 'no' },
  { label: 'سابقاً', value: 'former' },
] as const;

const PHYSICAL_ACTIVITY_OPTIONS = [
  { label: 'خامل', value: 'sedentary' },
  { label: 'خفيف', value: 'light' },
  { label: 'معتدل', value: 'moderate' },
  { label: 'شديد', value: 'heavy' },
  { label: 'شديد جداً', value: 'very_heavy' },
] as const;

const DIET_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: 'نباتي', value: 'vegetarian' },
  { label: 'نباتي صرف', value: 'vegan' },
  { label: 'سكري', value: 'diabetic' },
  { label: 'ضغط', value: 'hypertension' },
  { label: 'كلوي', value: 'renal' },
  { label: 'أخرى', value: 'other' },
] as const;

const socialHistorySchema = z.object({
  maritalStatus: z.string(),
  educationLevel: z.string(),
  occupation: z.string(),
  livingArea: z.string(),
  familyStructure: z.string(),
  incomeLevel: z.string(),
  smoking: z.string().min(1, 'حقل التدخين مطلوب'),
  cigarettesPerDay: z.string(),
  yearsSmoked: z.string(),
  alcoholSubstanceUse: z.string().min(1, 'حقل الكحول/المخدرات مطلوب'),
  physicalActivity: z.string().min(1, 'حقل النشاط البدني مطلوب'),
  activityDescription: z.string(),
  dietaryHistory: z.string(),
  foodAllergies: z.string(),
  specialDietBeforeAdmission: z.string().min(1, 'حقل النظام الغذائي مطلوب'),
  comments: z.string(),
});

type SocialHistoryFormValues = z.infer<typeof socialHistorySchema>;

export default function SocialHistoryScreen() {
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
    formState: { errors, isValid },
  } = useForm<SocialHistoryFormValues>({
    mode: 'onChange',
    resolver: zodResolver(socialHistorySchema),
    defaultValues: {
      maritalStatus: '',
      educationLevel: '',
      occupation: '',
      livingArea: '',
      familyStructure: '',
      incomeLevel: '',
      smoking: '',
      cigarettesPerDay: '',
      yearsSmoked: '',
      alcoholSubstanceUse: '',
      physicalActivity: '',
      activityDescription: '',
      dietaryHistory: '',
      foodAllergies: '',
      specialDietBeforeAdmission: '',
      comments: '',
    },
  });

  const smokingValue = watch('smoking');
  const showSmokingDetails = smokingValue === 'yes' || smokingValue === 'former';

  useEffect(() => {
    loadExistingData();
  }, [patientId]);

  async function loadExistingData() {
    try {
      setIsLoading(true);
      const { GetSocialHistoryUseCase } = await import('../../../src/domain/use-cases/GetSocialHistoryUseCase');
      const useCase = new GetSocialHistoryUseCase();
      const data = await useCase.execute(patientId);
      if (data) {
        reset({
          maritalStatus: data.maritalStatus || '',
          educationLevel: data.educationLevel || '',
          occupation: data.occupation || '',
          livingArea: data.livingArea || '',
          familyStructure: data.familyStructure || '',
          incomeLevel: data.incomeLevel || '',
          smoking: data.smoking || '',
          cigarettesPerDay: data.cigarettesPerDay ? String(data.cigarettesPerDay) : '',
          yearsSmoked: data.yearsSmoked ? String(data.yearsSmoked) : '',
          alcoholSubstanceUse: data.alcoholSubstanceUse || '',
          physicalActivity: data.physicalActivity || '',
          activityDescription: data.activityDescription || '',
          dietaryHistory: data.dietaryHistory || '',
          foodAllergies: data.foodAllergies || '',
          specialDietBeforeAdmission: data.specialDietBeforeAdmission || '',
          comments: data.comments || '',
        });
      }
    } catch {
      /* silent fail */
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    let success = false;
    await handleSubmit(async (values) => {
      try {
        setIsSaving(true);
        const { SaveSocialHistoryUseCase } = await import('../../../src/domain/use-cases/SaveSocialHistoryUseCase');
        const useCase = new SaveSocialHistoryUseCase();
        await useCase.execute({
          patientId: patientId,
          maritalStatus: values.maritalStatus || undefined,
          educationLevel: values.educationLevel || undefined,
          occupation: values.occupation || undefined,
          livingArea: values.livingArea || undefined,
          familyStructure: values.familyStructure || undefined,
          incomeLevel: values.incomeLevel || undefined,
          smoking: values.smoking,
          cigarettesPerDay: values.cigarettesPerDay ? parseInt(values.cigarettesPerDay, 10) : undefined,
          yearsSmoked: values.yearsSmoked ? parseInt(values.yearsSmoked, 10) : undefined,
          alcoholSubstanceUse: values.alcoholSubstanceUse,
          physicalActivity: values.physicalActivity,
          activityDescription: values.activityDescription || undefined,
          dietaryHistory: values.dietaryHistory || undefined,
          foodAllergies: values.foodAllergies || undefined,
          specialDietBeforeAdmission: values.specialDietBeforeAdmission,
          comments: values.comments || undefined,
        });
        success = true;
      } catch {
        /* error handled via toast */
      } finally {
        setIsSaving(false);
      }
    })();
    return success ? patientId : undefined;
  };

  const renderDropdown = (name: keyof SocialHistoryFormValues, label: string, options: readonly { label: string; value: string }[], required = false) => (
    <DropdownField
      label={required ? `${label}` : label}
      options={options}
      selectedValue={watch(name)}
      onValueChange={(val) => setValue(name, val, { shouldValidate: true })}
      error={errors[name]?.message}
      placeholder={`اختر ${label}...`}
    />
  );

  const renderRadioGroup = (name: keyof SocialHistoryFormValues, label: string, options: readonly { label: string; value: string }[]) => {
    return (
      <RadioGroup
        label={label}
        options={options}
        selectedValue={watch(name)}
        onValueChange={(val) => setValue(name, val, { shouldValidate: true })}
        error={errors[name]?.message}
        direction="row"
      />
    );
  };

  const renderTextInput = (name: keyof SocialHistoryFormValues, label: string, opts?: { keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad'; multiline?: boolean }) => (
    <TextInputField
      label={label}
      value={watch(name) || ''}
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
            <Ionicons name="people-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>التاريخ الاجتماعي</ArabicText>
          </View>
        </View>

        {/* Demographic Info */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>المعلومات الديموغرافية</ArabicText>
          {renderDropdown('maritalStatus', 'الحالة الاجتماعية', MARITAL_OPTIONS)}
          {renderDropdown('educationLevel', 'المستوى التعليمي', EDUCATION_OPTIONS)}
          {renderDropdown('occupation', 'المهنة', OCCUPATION_OPTIONS)}
          {renderDropdown('livingArea', 'منطقة السكن', LIVING_AREA_OPTIONS)}
          {renderDropdown('familyStructure', 'التركيبة الأسرية', FAMILY_STRUCTURE_OPTIONS)}
          {renderDropdown('incomeLevel', 'مستوى الدخل', INCOME_LEVEL_OPTIONS)}
        </View>

        {/* Smoking & Substances */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>التدخين والمؤثرات</ArabicText>
          {renderRadioGroup('smoking', 'التدخين', YES_NO_OPTIONS)}
          {showSmokingDetails && (
            <View style={styles.subSection}>
              {renderTextInput('cigarettesPerDay', 'عدد السجائر يومياً', { keyboardType: 'numeric' })}
              {renderTextInput('yearsSmoked', 'عدد سنوات التدخين', { keyboardType: 'numeric' })}
            </View>
          )}
          {renderRadioGroup('alcoholSubstanceUse', 'الكحول / المخدرات', YES_NO_OPTIONS)}
        </View>

        {/* Physical Activity */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>النشاط البدني</ArabicText>
          {renderRadioGroup('physicalActivity', 'مستوى النشاط البدني', PHYSICAL_ACTIVITY_OPTIONS)}
          {renderTextInput('activityDescription', 'وصف النشاط البدني', { multiline: true })}
        </View>

        {/* Dietary History */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>التاريخ الغذائي</ArabicText>
          {renderDropdown('dietaryHistory', 'النظام الغذائي المتبع', DIET_OPTIONS)}
          {renderTextInput('foodAllergies', 'الحساسية الغذائية', { multiline: true })}
          {renderRadioGroup('specialDietBeforeAdmission', 'حمية خاصة قبل التنويم', YES_NO_OPTIONS)}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>ملاحظات</ArabicText>
          {renderTextInput('comments', 'ملاحظات إضافية', { multiline: true })}
        </View>

      <TripleActionFooter
        patientId={patientId}
        screenKey="social-history"
        onSave={handleSave}
        isSaving={isSaving}
        isValid={isValid}
      />

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
    paddingTop: safeHeaderPaddingTop,
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
  subSection: {
    paddingStart: spacing.md,
    borderStartWidth: 2,
    borderStartColor: colors.primaryLight,
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
