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
import Button from '../../../src/presentation/components/Button';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';

const NUTRITION_DIAGNOSIS_OPTIONS = [
  { label: 'سوء التغذية', value: 'malnutrition' },
  { label: 'السمنة', value: 'obesity' },
  { label: 'داء السكري', value: 'diabetes' },
  { label: 'مرض كلوي', value: 'renal' },
  { label: 'مرض كبدي', value: 'liver' },
  { label: 'اضطرابات الجهاز الهضمي', value: 'gi' },
  { label: 'الأورام', value: 'cancer' },
  { label: 'فقر الدم', value: 'anemia' },
  { label: 'اضطرابات الأكل', value: 'eating_disorder' },
  { label: 'تغذية حرجة', value: 'critical' },
  { label: 'تغذية أطفال', value: 'pediatric' },
  { label: 'تغذية حمل', value: 'pregnancy' },
  { label: 'أخرى', value: 'other' },
] as const;

const MAIN_GOAL_OPTIONS = [
  { label: 'إنقاص الوزن', value: 'weight_loss' },
  { label: 'زيادة الوزن', value: 'weight_gain' },
  { label: 'المحافظة على الوزن', value: 'maintenance' },
  { label: 'السيطرة على السكر', value: 'glycemic_control' },
  { label: 'النظام الكلوي', value: 'renal_diet' },
  { label: 'بناء العضلات', value: 'muscle_building' },
  { label: 'تحسين الصحة العامة', value: 'general_health' },
  { label: 'تعديل السلوك الغذائي', value: 'behavioral' },
  { label: 'تعويض نقص التغذية', value: 'repletion' },
] as const;

const DIET_TYPE_OPTIONS = [
  { label: 'عادي', value: 'regular' },
  { label: 'سكري', value: 'diabetic' },
  { label: 'قليل الصوديوم', value: 'low_sodium' },
  { label: 'قليل الدهون', value: 'low_fat' },
  { label: 'عالي البروتين', value: 'high_protein' },
  { label: 'قليل البروتين', value: 'low_protein' },
  { label: 'كلوي', value: 'renal' },
  { label: 'كبدي', value: 'liver' },
  { label: 'لين', value: 'soft' },
  { label: 'سائل', value: 'liquid' },
  { label: 'DASH', value: 'dash' },
  { label: 'البحر المتوسط', value: 'mediterranean' },
  { label: 'نباتي', value: 'vegetarian' },
] as const;

const FOOD_TEXTURE_OPTIONS = [
  { label: 'عادي', value: 'regular' },
  { label: 'لين', value: 'soft' },
  { label: 'مفروم', value: 'minced' },
  { label: 'مهروس', value: 'pureed' },
  { label: 'سائل', value: 'liquid' },
  { label: 'سائل كثيف', value: 'thickened_liquid' },
] as const;

const ROUTE_OF_FEEDING_OPTIONS = [
  { label: 'عن طريق الفم', value: 'oral' },
  { label: 'أنبوب أنفي معدي (NGT)', value: 'ng_tube' },
  { label: 'فغر المعدة (PEG)', value: 'peg' },
  { label: 'فغر الصائم (Jejunostomy)', value: 'jejunostomy' },
  { label: 'تغذية وريدية كلية (TPN)', value: 'tpn' },
  { label: 'تغذية وريدية جزئية (PPN)', value: 'ppn' },
] as const;

const FOLLOW_UP_INTERVAL_OPTIONS = [
  { label: 'يومي', value: 'daily' },
  { label: 'يوم بعد يوم', value: 'every_other_day' },
  { label: 'مرتين أسبوعياً', value: 'twice_weekly' },
  { label: 'أسبوعي', value: 'weekly' },
  { label: 'كل أسبوعين', value: 'biweekly' },
  { label: 'شهري', value: 'monthly' },
  { label: 'مخصص', value: 'custom' },
] as const;

const interventionSchema = z.object({
  nutritionDiagnosis: z.string().min(1, 'تشخيص التغذية مطلوب'),
  mainGoal: z.string().min(1, 'الهدف الرئيسي مطلوب'),
  dietType: z.string().min(1, 'نوع الحمية مطلوب'),
  foodTexture: z.string().min(1, 'قوام الطعام مطلوب'),
  routeOfFeeding: z.string().min(1, 'طريقة التغذية مطلوبة'),
  followUpInterval: z.string().min(1, 'فترة المتابعة مطلوبة'),
  targetCalories: z.string(),
  targetProtein: z.string(),
  targetCarbohydrates: z.string(),
  targetFat: z.string(),
  fluidAllowance: z.string(),
  dietModifications: z.string(),
  dietRecommendations: z.string(),
  supplementPlan: z.string(),
  behavioralInstructions: z.string(),
  linkedFindings: z.string(),
  comments: z.string(),
});

type InterventionFormData = z.infer<typeof interventionSchema>;

export default function InterventionScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [missingModules, setMissingModules] = useState<string[]>([]);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<InterventionFormData>({
    mode: 'onChange',
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      nutritionDiagnosis: '',
      mainGoal: '',
      dietType: '',
      foodTexture: '',
      routeOfFeeding: '',
      followUpInterval: '',
      targetCalories: '',
      targetProtein: '',
      targetCarbohydrates: '',
      targetFat: '',
      fluidAllowance: '',
      dietModifications: '',
      dietRecommendations: '',
      supplementPlan: '',
      behavioralInstructions: '',
      linkedFindings: '',
      comments: '',
    },
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  async function loadData() {
    try {
      setIsLoading(true);

      const [assessmentMod, interventionMod] = await Promise.all([
        import('../../../src/domain/use-cases/ValidateAssessmentCompleteUseCase'),
        import('../../../src/domain/use-cases/GetActiveInterventionUseCase'),
      ]);

      const assessmentUC = new assessmentMod.ValidateAssessmentCompleteUseCase();
      const result = await assessmentUC.execute(patientId);

      if (!result.complete) {
        setAssessmentComplete(false);
        setMissingModules(result.missingModules);
        return;
      }

      setAssessmentComplete(true);

      const getUC = new interventionMod.GetActiveInterventionUseCase();
      const existing = await getUC.execute(patientId);

      if (existing) {
        setExistingId(existing.id ?? null);
        reset({
          nutritionDiagnosis: existing.nutritionDiagnosis || '',
          mainGoal: existing.mainGoal || '',
          dietType: existing.dietType || '',
          foodTexture: existing.foodTexture || '',
          routeOfFeeding: existing.routeOfFeeding || '',
          followUpInterval: existing.followUpInterval || '',
          targetCalories: existing.targetCalories ? String(existing.targetCalories) : '',
          targetProtein: existing.targetProtein ? String(existing.targetProtein) : '',
          targetCarbohydrates: existing.targetCarbohydrates ? String(existing.targetCarbohydrates) : '',
          targetFat: existing.targetFat ? String(existing.targetFat) : '',
          fluidAllowance: existing.fluidAllowance ? String(existing.fluidAllowance) : '',
          dietModifications: existing.dietModifications || '',
          dietRecommendations: existing.dietRecommendations || '',
          supplementPlan: existing.supplementPlan || '',
          behavioralInstructions: existing.behavioralInstructions || '',
          linkedFindings: existing.linkedFindings || '',
          comments: existing.comments || '',
        });
      }
    } catch {
      showToast('فشل تحميل البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    let success = false;
    await handleSubmit(async (data) => {
      try {
        setIsSaving(true);
        const { SaveInterventionUseCase } = await import('../../../src/domain/use-cases/SaveInterventionUseCase');
        const uc = new SaveInterventionUseCase();

        const parseNum = (v: string) => {
          const n = parseFloat(v);
          return isNaN(n) ? undefined : n;
        };

        await uc.execute({
          id: existingId ?? undefined,
          patientId,
          nutritionDiagnosis: data.nutritionDiagnosis,
          mainGoal: data.mainGoal,
          dietType: data.dietType,
          foodTexture: data.foodTexture,
          routeOfFeeding: data.routeOfFeeding,
          followUpInterval: data.followUpInterval,
          targetCalories: parseNum(data.targetCalories),
          targetProtein: parseNum(data.targetProtein),
          targetCarbohydrates: parseNum(data.targetCarbohydrates),
          targetFat: parseNum(data.targetFat),
          fluidAllowance: parseNum(data.fluidAllowance),
          dietModifications: data.dietModifications || undefined,
          dietRecommendations: data.dietRecommendations || undefined,
          supplementPlan: data.supplementPlan || undefined,
          behavioralInstructions: data.behavioralInstructions || undefined,
          linkedFindings: data.linkedFindings || undefined,
          status: 'active',
          comments: data.comments || undefined,
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

  const w = watch;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري التحقق من اكتمال التقييم...</ArabicText>
      </View>
    );
  }

  if (!assessmentComplete) {
    return (
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="clipboard-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>خطة التدخل التغذوي</ArabicText>
          </View>
        </View>
        <View style={styles.blockingContainer}>
          <View style={styles.blockingIcon}>
            <Ionicons name="alert-circle" size={64} color={colors.danger} />
          </View>
          <ArabicText bold style={styles.blockingTitle}>التقييم غير مكتمل</ArabicText>
          <ArabicText style={styles.blockingSubtitle}>
            يجب إكمال جميع خطوات التقييم التالية قبل إنشاء خطة التدخل:
          </ArabicText>
          <View style={styles.missingList}>
            {missingModules.map((mod, idx) => (
              <View key={idx} style={styles.missingItem}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
                <ArabicText style={styles.missingItemText}>{mod}</ArabicText>
              </View>
            ))}
          </View>
          <Button
            title="العودة للمريض"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
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
            <Ionicons name="clipboard-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>خطة التدخل التغذوي</ArabicText>
          </View>
        </View>

        {/* Required Fields */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>البيانات الأساسية</ArabicText>

          <DropdownField
            label="تشخيص التغذية"
            options={NUTRITION_DIAGNOSIS_OPTIONS}
            selectedValue={w('nutritionDiagnosis')}
            onValueChange={(val) => setValue('nutritionDiagnosis', val)}
            error={errors.nutritionDiagnosis?.message}
            required
            placeholder="اختر تشخيص التغذية..."
          />

          <DropdownField
            label="الهدف الرئيسي"
            options={MAIN_GOAL_OPTIONS}
            selectedValue={w('mainGoal')}
            onValueChange={(val) => setValue('mainGoal', val)}
            error={errors.mainGoal?.message}
            required
            placeholder="اختر الهدف الرئيسي..."
          />

          <DropdownField
            label="نوع الحمية"
            options={DIET_TYPE_OPTIONS}
            selectedValue={w('dietType')}
            onValueChange={(val) => setValue('dietType', val)}
            error={errors.dietType?.message}
            required
            placeholder="اختر نوع الحمية..."
          />

          <DropdownField
            label="قوام الطعام"
            options={FOOD_TEXTURE_OPTIONS}
            selectedValue={w('foodTexture')}
            onValueChange={(val) => setValue('foodTexture', val)}
            error={errors.foodTexture?.message}
            required
            placeholder="اختر قوام الطعام..."
          />

          <DropdownField
            label="طريقة التغذية"
            options={ROUTE_OF_FEEDING_OPTIONS}
            selectedValue={w('routeOfFeeding')}
            onValueChange={(val) => setValue('routeOfFeeding', val)}
            error={errors.routeOfFeeding?.message}
            required
            placeholder="اختر طريقة التغذية..."
          />

          <DropdownField
            label="فترة المتابعة"
            options={FOLLOW_UP_INTERVAL_OPTIONS}
            selectedValue={w('followUpInterval')}
            onValueChange={(val) => setValue('followUpInterval', val)}
            error={errors.followUpInterval?.message}
            required
            placeholder="اختر فترة المتابعة..."
          />
        </View>

        {/* Numeric Targets */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>الأهداف الرقمية (اختياري)</ArabicText>

          <View style={styles.numRow}>
            <View style={styles.halfInput}>
              <TextInputField
                label="السعرات (سعرة)"
                value={w('targetCalories')}
                onChangeText={(val) => setValue('targetCalories', val)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInputField
                label="البروتين (غم)"
                value={w('targetProtein')}
                onChangeText={(val) => setValue('targetProtein', val)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.numRow}>
            <View style={styles.halfInput}>
              <TextInputField
                label="الكربوهيدرات (غم)"
                value={w('targetCarbohydrates')}
                onChangeText={(val) => setValue('targetCarbohydrates', val)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInputField
                label="الدهون (غم)"
                value={w('targetFat')}
                onChangeText={(val) => setValue('targetFat', val)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          </View>

          <TextInputField
            label="السوائل (مل)"
            value={w('fluidAllowance')}
            onChangeText={(val) => setValue('fluidAllowance', val)}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>

        {/* Detailed Plans */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>تفاصيل الخطة</ArabicText>

          <TextInputField
            label="تعديلات الحمية"
            value={w('dietModifications')}
            onChangeText={(val) => setValue('dietModifications', val)}
            multiline
            placeholder="أي تعديلات على الحمية..."
          />
          <TextInputField
            label="توصيات الحمية"
            value={w('dietRecommendations')}
            onChangeText={(val) => setValue('dietRecommendations', val)}
            multiline
            placeholder="توصيات إضافية..."
          />
          <TextInputField
            label="خطة المكملات"
            value={w('supplementPlan')}
            onChangeText={(val) => setValue('supplementPlan', val)}
            multiline
            placeholder="تفاصيل المكملات الغذائية..."
          />
          <TextInputField
            label="تعليمات سلوكية"
            value={w('behavioralInstructions')}
            onChangeText={(val) => setValue('behavioralInstructions', val)}
            multiline
            placeholder="تعليمات لتعديل السلوك الغذائي..."
          />
          <TextInputField
            label="نتائج مرتبطة"
            value={w('linkedFindings')}
            onChangeText={(val) => setValue('linkedFindings', val)}
            multiline
            placeholder="نتائج الفحوصات المرتبطة..."
          />
          <TextInputField
            label="ملاحظات"
            value={w('comments')}
            onChangeText={(val) => setValue('comments', val)}
            multiline
            placeholder="ملاحظات إضافية..."
          />
        </View>

        <TripleActionFooter
          patientId={patientId}
          screenKey="intervention"
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
  },
  numRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  spacer: {
    height: 40,
  },
  blockingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.md,
  },
  blockingIcon: {
    marginBottom: spacing.md,
  },
  blockingTitle: {
    fontSize: 22,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  blockingSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  missingList: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missingItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
});
