import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import Button from '../../../src/presentation/components/Button';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';
import NutritionTemplateSelector from '../../../src/presentation/components/NutritionTemplateSelector';
import type { NutritionTemplate } from '../../../src/domain/entities/NutritionTemplate';
import { useClinicalSequence, ClinicalStep } from '../../../src/presentation/hooks/useClinicalSequence';

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
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Consume Strict Clinical Sequence Hook
  const sequence = useClinicalSequence(patientId);

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
    setIsDataLoaded(false);
  }, [patientId]);

  useEffect(() => {
    if (!sequence.isLoading && sequence.isComplete && !isDataLoaded) {
      loadInterventionData();
    }
  }, [sequence.isLoading, sequence.isComplete, isDataLoaded]);

  async function loadInterventionData() {
    try {
      const { GetActiveInterventionUseCase } = await import('../../../src/domain/use-cases/GetActiveInterventionUseCase');
      const getUC = new GetActiveInterventionUseCase();
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
      setIsDataLoaded(true);
    } catch {
      showToast('فشل تحميل البيانات', 'error');
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

  const applyTemplate = useCallback((template: NutritionTemplate) => {
    const current = watch();
    const calcFromPercent = (pct: number | null, calories: number): string => {
      if (!pct) return '';
      const targetKcal = calories > 0 ? calories : 2000;
      return String(Math.round((pct / 100) * targetKcal / 4));
    };

    reset({
      ...current,
      dietType: template.appliesToDietType || current.dietType,
      targetCalories: template.energyKcalPerKg
        ? String(Math.round(template.energyKcalPerKg * 70))
        : current.targetCalories,
      targetProtein: template.proteinGPerKg
        ? String(Math.round(template.proteinGPerKg * 70))
        : template.proteinPercent
          ? calcFromPercent(template.proteinPercent, parseFloat(current.targetCalories || '2000'))
          : current.targetProtein,
      targetCarbohydrates: template.carbohydratePercent
        ? calcFromPercent(template.carbohydratePercent, parseFloat(current.targetCalories || '2000'))
        : current.targetCarbohydrates,
      targetFat: template.fatPercent
        ? calcFromPercent(template.fatPercent, parseFloat(current.targetCalories || '2000'))
        : current.targetFat,
      fluidAllowance: template.fluidMlPerDay
        ? String(template.fluidMlPerDay)
        : current.fluidAllowance,
      dietModifications: template.specialRecommendationsAr
        ? current.dietModifications
          ? current.dietModifications + '\n---\n' + template.specialRecommendationsAr
          : template.specialRecommendationsAr
        : current.dietModifications,
      dietRecommendations: template.mealPatternNoteAr
        ? current.dietRecommendations
          ? current.dietRecommendations + '\n' + template.mealPatternNoteAr
          : template.mealPatternNoteAr
        : current.dietRecommendations,
    });

    showToast(`تم تطبيق قالب: ${template.conditionNameAr}`, 'success');
  }, [watch, reset, showToast]);

  const w = watch;

  if (sequence.isLoading && !isDataLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري التحقق من المسار السريري...</ArabicText>
      </View>
    );
  }

  // Render strict Smart Progress Timeline UI if clinical sequence is incomplete
  if (!sequence.isComplete) {
    return (
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="git-network-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>مسار التقييم السريري الصارم</ArabicText>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.blockingScroll} style={styles.container}>
          <View style={styles.blockingIcon}>
            <Ionicons name="git-commit-outline" size={64} color={colors.accentTeal} />
          </View>
          <ArabicText bold style={styles.blockingTitle}>تسلسل خطوات التقييم الإلزامي</ArabicText>
          <ArabicText style={styles.blockingSubtitle}>
            يجب إكمال الخطوات السريرية بالترتيب التالي لتجنب الأخطاء وبناء خطة تدخل تغذوي دقيقة:
          </ArabicText>

          <View style={styles.timelineContainer}>
            {sequence.steps.map((step, index) => {
              const isFinished = step.status === 'complete';
              const isCurrent = step.status === 'current';
              const isLocked = step.status === 'locked';

              return (
                <View key={`timeline-step-${step.id}`} style={styles.timelineItemRow}>
                  {/* Timeline Node Connector Line */}
                  {index < sequence.steps.length - 1 && (
                    <View 
                      style={[
                        styles.timelineLine,
                        { backgroundColor: isFinished ? colors.success : colors.border }
                      ]} 
                    />
                  )}

                  {/* Step Card with Right-to-Left contents */}
                  <View 
                    style={[
                      styles.stepTimelineCard,
                      isCurrent && styles.stepTimelineCardCurrent,
                      isLocked && styles.stepTimelineCardLocked
                    ]}
                  >
                    <View style={styles.stepCardHeader}>
                      <View style={[
                        styles.nodeIndicator,
                        isFinished && { backgroundColor: colors.success },
                        isCurrent && { backgroundColor: colors.accentTeal },
                        isLocked && { backgroundColor: colors.surfaceSecondary }
                      ]}>
                        <Ionicons 
                          name={isFinished ? "checkmark-circle" : isCurrent ? "ellipse" : "lock-closed"} 
                          size={18} 
                          color={isFinished || isCurrent ? colors.primaryContrast : colors.textDisabled} 
                        />
                      </View>
                      
                      <View style={styles.stepTextContainer}>
                        <ArabicText bold style={[
                          styles.stepTitleText,
                          isLocked && { color: colors.textDisabled }
                        ]}>
                          {step.titleAr}
                        </ArabicText>
                        <ArabicText style={styles.stepDescText}>
                          {step.descriptionAr}
                        </ArabicText>
                      </View>
                    </View>

                    {/* Prominent Action Button for the FIRST incomplete step */}
                    {isCurrent && sequence.nextRequiredRoute && (
                      <TouchableOpacity 
                        style={styles.pulsingActionBtn}
                        onPress={() => router.push(sequence.nextRequiredRoute as string)}
                        activeOpacity={0.8}
                      >
                        <ArabicText bold style={styles.pulsingActionBtnText}>ابدأ التقييم</ArabicText>
                        <Ionicons name="arrow-back" size={16} color={colors.primaryContrast} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <Button
            title="العودة لملف المريض"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.backButton}
          />
        </ScrollView>
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
            <TouchableOpacity
              style={styles.templateBtn}
              onPress={() => setShowTemplateSelector(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={18} color={colors.primaryContrast} />
              <ArabicText style={styles.templateBtnText}>قوالب</ArabicText>
            </TouchableOpacity>
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

      <NutritionTemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={applyTemplate}
      />
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
  },
  numRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  spacer: {
    height: 40,
  },
  blockingScroll: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: colors.surfaceSecondary,
  },
  blockingIcon: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  blockingTitle: {
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  blockingSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  timelineContainer: {
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  timelineItemRow: {
    position: 'relative',
    paddingBottom: spacing.xl,
    width: '100%',
  },
  timelineLine: {
    position: 'absolute',
    right: 25,
    top: 30,
    width: 2,
    height: '100%',
    zIndex: 1,
  },
  stepTimelineCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 0,
    width: '100%',
    zIndex: 2,
  },
  stepTimelineCardCurrent: {
    borderColor: colors.accentTeal,
    backgroundColor: colors.surfaceElevated,
  },
  stepTimelineCardLocked: {
    opacity: 0.5,
    borderColor: colors.border,
  },
  stepCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  nodeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textDisabled,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
    gap: 2,
  },
  stepTitleText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  stepDescText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  pulsingActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentTeal,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  pulsingActionBtnText: {
    color: colors.primaryContrast,
    fontSize: 14,
  },
  backButton: {
    marginTop: spacing.md,
    width: '100%',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  templateBtnText: {
    color: colors.primaryContrast,
    fontSize: 13,
  },
});
