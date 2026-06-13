import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
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
import DatePickerField from '../../../src/presentation/components/DatePickerField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { formatSafeDate } from '../../../src/utils/date';
import { FollowUpVisitRecord } from '../../../src/domain/repositories/IFollowUpVisitRepository';
import { LaboratoryRecordRecord } from '../../../src/domain/repositories/ILaboratoryRepository';

// Clinical drop-down options aligned with database constraints
const EDEMA_OPTIONS = [
  { label: 'لا يوجد', value: 'no' },
  { label: 'خفيف', value: 'mild' },
  { label: 'متوسط', value: 'moderate' },
  { label: 'شديد', value: 'severe' },
] as const;

const DEHYDRATION_OPTIONS = [
  { label: 'لا يوجد', value: 'no' },
  { label: 'خفيف', value: 'mild' },
  { label: 'متوسط', value: 'moderate' },
  { label: 'شديد', value: 'severe' },
] as const;

const TOLERANCE_OPTIONS = [
  { label: 'جيد', value: 'good' },
  { label: 'متوسط (مقبول)', value: 'fair' },
  { label: 'سيء', value: 'poor' },
  { label: 'غير مطبق', value: 'na' },
] as const;

const RESPIRATORY_OPTIONS = [
  { label: 'مستقر', value: 'stable' },
  { label: 'متحسن', value: 'improved' },
  { label: 'متدهور', value: 'deteriorated' },
  { label: 'غير مطبق', value: 'na' },
] as const;

const STOOL_CONSISTENCY_OPTIONS = [
  { label: 'عادي', value: 'normal' },
  { label: 'لين', value: 'soft' },
  { label: 'مائي', value: 'watery' },
  { label: 'صلب', value: 'hard' },
  { label: 'مخاطي', value: 'mucous' },
  { label: 'دموي', value: 'bloody' },
] as const;

const PROGRESS_OPTIONS = [
  { label: 'متحسن', value: 'improved' },
  { label: 'مستقر', value: 'stable' },
  { label: 'متدهور', value: 'deteriorated' },
  { label: 'غير مؤكد', value: 'uncertain' },
] as const;

const PLAN_SUCCESSFUL_OPTIONS = [
  { label: 'نعم', value: 'yes' },
  { label: 'جزئياً', value: 'partial' },
  { label: 'لا', value: 'no' },
] as const;

const REPLAN_OPTIONS = [
  { label: 'نعم', value: 'yes' },
  { label: 'لا', value: 'no' },
] as const;

const TEST_TYPE_OPTIONS = [
  { label: 'تحليل مرجعي (Baseline)', value: 'baseline' },
  { label: 'تحليل متابعة (Follow-up)', value: 'follow_up' },
] as const;

// 1. Zod Validation Schemas
const followUpSchema = z.object({
  visitDate: z.date(),
  currentWeight: z.string().min(1, 'الوزن الحالي مطلوب'),
  height: z.string(),
  bmi: z.string(),
  edema: z.string().min(1, 'حالة الوذمة مطلوبة'),
  dehydration: z.string().min(1, 'حالة الجفاف مطلوبة'),
  stoolFrequency: z.string(),
  stoolConsistency: z.string(),
  enteralTolerance: z.string().min(1, 'تحمل التغذية المعوية مطلوب'),
  parenteralTolerance: z.string().min(1, 'تحمل التغذية الوريدية مطلوب'),
  fluidIntake: z.string(),
  fluidOutput: z.string(),
  gastricResidual: z.string(),
  respiratoryStatus: z.string().min(1, 'الحالة التنفسية مطلوبة'),
  drugNutrientConsequences: z.string(),
  overallProgress: z.string().min(1, 'التقدم العام مطلوب'),
  planSuccessful: z.string().min(1, 'نجاح الخطة مطلوب'),
  replanRequired: z.string().min(1, 'حقل إعادة التخطيط مطلوب'),
  replanNotes: z.string(),
  comments: z.string(),
}).superRefine((data, ctx) => {
  if (data.replanRequired === 'yes' && !data.replanNotes.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ملاحظات إعادة التخطيط مطلوبة',
      path: ['replanNotes'],
    });
  }
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

// Helper for physiological range limits
const optionalNumberField = (min: number, max: number, message: string) =>
  z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed >= min && parsed <= max;
    }, { message });

const labRecordSchema = z.object({
  testDate: z.date(),
  testType: z.string().min(1, 'نوع التحليل مطلوب'),
  // Hepatic Profile
  alt: optionalNumberField(0, 1000, 'ALT يجب أن يكون بين 0 و 1000 U/L'),
  ast: optionalNumberField(0, 1000, 'AST يجب أن يكون بين 0 و 1000 U/L'),
  albumin: optionalNumberField(0.5, 7.0, 'الألبومين يجب أن يكون بين 0.5 و 7.0 g/dL'),
  bilirubin: optionalNumberField(0.0, 30.0, 'البيليروبين يجب أن يكون بين 0.0 و 30.0 mg/dL'),
  // Renal/Electrolytes
  potassium: optionalNumberField(1.5, 8.0, 'البوتاسيوم يجب أن يكون بين 1.5 و 8.0 mEq/L'),
  sodium: optionalNumberField(100, 180, 'الصوديوم يجب أن يكون بين 100 و 180 mEq/L'),
  phosphorus: optionalNumberField(0.5, 15.0, 'الفوسفور يجب أن يكون بين 0.5 و 15.0 mg/dL'),
  urea: optionalNumberField(0, 300, 'اليوريا يجب أن تكون بين 0 و 300 mg/dL'),
  creatinine: optionalNumberField(0.0, 20.0, 'الكرياتينين يجب أن يكون بين 0.0 و 20.0 mg/dL'),
  // Metabolic Markers
  bloodGlucose: optionalNumberField(10, 1000, 'السكر يجب أن يكون بين 10 و 1000 mg/dL'),
  hba1c: optionalNumberField(2.0, 20.0, 'السكر التراكمي يجب أن يكون بين 2.0% و 20.0%'),
});

type LabRecordFormData = z.infer<typeof labRecordSchema>;

function evaluateRefeedingRisk(potassium?: number, phosphorus?: number, sodium?: number): boolean {
  if (phosphorus !== undefined && phosphorus !== null && phosphorus < 2.5) return true;
  if (potassium !== undefined && potassium !== null && potassium < 3.5) return true;
  if (sodium !== undefined && sodium !== null && sodium < 135) return true;
  return false;
}

export default function MonitoringScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  // Layout states
  const [activeTab, setActiveTab] = useState<'visits' | 'labs'>('visits');
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState<FollowUpVisitRecord[]>([]);
  const [labs, setLabs] = useState<LaboratoryRecordRecord[]>([]);

  // Modals visibility
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [isSavingLab, setIsSavingLab] = useState(false);

  // Hook Forms
  const {
    handleSubmit: handleFollowUpSubmit,
    reset: resetFollowUp,
    watch: watchFollowUp,
    setValue: setFollowUpValue,
    formState: { errors: followUpErrors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      visitDate: new Date(),
      currentWeight: '',
      height: '',
      bmi: '',
      edema: '',
      dehydration: '',
      stoolFrequency: '',
      stoolConsistency: '',
      enteralTolerance: '',
      parenteralTolerance: '',
      fluidIntake: '',
      fluidOutput: '',
      gastricResidual: '',
      respiratoryStatus: '',
      drugNutrientConsequences: '',
      overallProgress: '',
      planSuccessful: '',
      replanRequired: '',
      replanNotes: '',
      comments: '',
    },
  });

  const {
    handleSubmit: handleLabSubmit,
    reset: resetLab,
    watch: watchLab,
    setValue: setLabValue,
    formState: { errors: labErrors },
  } = useForm<LabRecordFormData>({
    resolver: zodResolver(labRecordSchema),
    defaultValues: {
      testDate: new Date(),
      testType: 'baseline',
      alt: '',
      ast: '',
      albumin: '',
      bilirubin: '',
      potassium: '',
      sodium: '',
      phosphorus: '',
      urea: '',
      creatinine: '',
      bloodGlucose: '',
      hba1c: '',
    },
  });

  const replanValue = watchFollowUp('replanRequired');

  useEffect(() => {
    loadData();
  }, [patientId]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [visitUCMod, labUCMod] = await Promise.all([
        import('../../../src/domain/use-cases/GetFollowUpVisitsUseCase'),
        import('../../../src/domain/use-cases/GetLaboratoryRecordsUseCase'),
      ]);
      const visitUC = new visitUCMod.GetFollowUpVisitsUseCase();
      const labUC = new labUCMod.GetLaboratoryRecordsUseCase();

      const [visitResult, labResult] = await Promise.all([
        visitUC.execute(patientId),
        labUC.execute(patientId),
      ]);

      setVisits(visitResult);
      setLabs(labResult);
    } catch {
      showToast('فشل تحميل بيانات المتابعة والمختبر', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Follow Up submission
  const onSubmitFollowUp = useCallback(async (data: FollowUpFormData) => {
    try {
      setIsSavingVisit(true);
      const { AddFollowUpVisitUseCase } = await import('../../../src/domain/use-cases/AddFollowUpVisitUseCase');
      const uc = new AddFollowUpVisitUseCase();

      const parseNum = (v: string) => {
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      };

      await uc.execute({
        patientId,
        visitDate: data.visitDate.getTime(),
        currentWeight: parseFloat(data.currentWeight),
        height: parseNum(data.height),
        bmi: parseNum(data.bmi),
        edema: data.edema,
        dehydration: data.dehydration,
        stoolFrequency: parseNum(data.stoolFrequency),
        stoolConsistency: data.stoolConsistency || undefined,
        enteralTolerance: data.enteralTolerance,
        parenteralTolerance: data.parenteralTolerance,
        fluidIntake: parseNum(data.fluidIntake),
        fluidOutput: parseNum(data.fluidOutput),
        gastricResidual: parseNum(data.gastricResidual),
        respiratoryStatus: data.respiratoryStatus,
        drugNutrientConsequences: data.drugNutrientConsequences || undefined,
        overallProgress: data.overallProgress,
        planSuccessful: data.planSuccessful,
        replanRequired: data.replanRequired === 'yes',
        replanNotes: data.replanNotes || undefined,
        comments: data.comments || undefined,
      });

      setShowAddVisitModal(false);
      showToast('تم إضافة زيارة المتابعة بنجاح', 'success');
      loadData();
    } catch (e: any) {
      showToast(e.message || 'فشل في حفظ زيارة المتابعة', 'error');
    } finally {
      setIsSavingVisit(false);
    }
  }, [patientId, showToast]);

  // Lab record submission
  const onSubmitLab = useCallback(async (data: LabRecordFormData) => {
    try {
      setIsSavingLab(true);
      const { AddLaboratoryRecordUseCase } = await import('../../../src/domain/use-cases/AddLaboratoryRecordUseCase');
      const uc = new AddLaboratoryRecordUseCase();

      const parseNum = (v?: string) => {
        if (!v) return undefined;
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      };

      await uc.execute({
        patientId,
        testDate: data.testDate.getTime(),
        testType: data.testType,
        alt: parseNum(data.alt),
        ast: parseNum(data.ast),
        albumin: parseNum(data.albumin),
        bilirubin: parseNum(data.bilirubin),
        potassium: parseNum(data.potassium),
        sodium: parseNum(data.sodium),
        phosphorus: parseNum(data.phosphorus),
        urea: parseNum(data.urea),
        creatinine: parseNum(data.creatinine),
        bloodGlucose: parseNum(data.bloodGlucose),
        hba1c: parseNum(data.hba1c),
      });

      setShowAddLabModal(false);
      showToast('تم حفظ النتائج المخبرية بنجاح', 'success');
      loadData();
    } catch (e: any) {
      showToast(e.message || 'فشل في حفظ النتائج المخبرية', 'error');
    } finally {
      setIsSavingLab(false);
    }
  }, [patientId, showToast]);

  const openAddVisit = useCallback(() => {
    resetFollowUp({
      visitDate: new Date(),
      currentWeight: '',
      height: '',
      bmi: '',
      edema: '',
      dehydration: '',
      stoolFrequency: '',
      stoolConsistency: '',
      enteralTolerance: '',
      parenteralTolerance: '',
      fluidIntake: '',
      fluidOutput: '',
      gastricResidual: '',
      respiratoryStatus: '',
      drugNutrientConsequences: '',
      overallProgress: '',
      planSuccessful: '',
      replanRequired: '',
      replanNotes: '',
      comments: '',
    });
    setShowAddVisitModal(true);
  }, [resetFollowUp]);

  const openAddLab = useCallback(() => {
    resetLab({
      testDate: new Date(),
      testType: 'baseline',
      alt: '',
      ast: '',
      albumin: '',
      bilirubin: '',
      potassium: '',
      sodium: '',
      phosphorus: '',
      urea: '',
      creatinine: '',
      bloodGlucose: '',
      hba1c: '',
    });
    setShowAddLabModal(true);
  }, [resetLab]);

  function formatDate(ts: number): string {
    return formatSafeDate(ts);
  }

  const edemaLabel = (v: string) => EDEMA_OPTIONS.find((o) => o.value === v)?.label || v;
  const tolLabel = (v: string) => TOLERANCE_OPTIONS.find((o) => o.value === v)?.label || v;
  const progLabel = (v: string) => PROGRESS_OPTIONS.find((o) => o.value === v)?.label || v;

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="pulse-outline" size={24} color={colors.primaryContrast} />
          <ArabicText bold style={styles.headerTitle}>المتابعة والتقييم المخبري</ArabicText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={activeTab === 'visits' ? openAddVisit : openAddLab}
          >
            <Ionicons name="add-circle" size={28} color={colors.primaryContrast} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'visits' && styles.activeTabButton]}
          onPress={() => setActiveTab('visits')}
        >
          <ArabicText bold={activeTab === 'visits'} style={[styles.tabText, activeTab === 'visits' && styles.activeTabText]}>
            زيارات المتابعة
          </ArabicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'labs' && styles.activeTabButton]}
          onPress={() => setActiveTab('labs')}
        >
          <ArabicText bold={activeTab === 'labs'} style={[styles.tabText, activeTab === 'labs' && styles.activeTabText]}>
            النتائج المخبرية
          </ArabicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Tab 1: Follow-Up Visits */}
        {activeTab === 'visits' && (
          visits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textDisabled} />
              <ArabicText style={styles.emptyText}>لا توجد زيارات متابعة مسجلة</ArabicText>
              <Button
                title="إضافة زيارة متابعة"
                onPress={openAddVisit}
                icon={<Ionicons name="add" size={20} color={colors.primaryContrast} />}
              />
            </View>
          ) : (
            <View style={styles.listSection}>
              <ArabicText bold style={styles.listTitle}>سجل زيارات المتابعة السريرية</ArabicText>
              {visits.map((visit) => (
                <View key={visit.id} style={styles.visitCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <ArabicText bold style={styles.cardDate}>
                      {formatDate(visit.visitDate)}
                    </ArabicText>
                    {visit.replanRequired && (
                      <View style={styles.replanBadge}>
                        <ArabicText style={styles.replanBadgeText}>إعادة تخطيط</ArabicText>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                      <ArabicText style={styles.cardLabel}>الوزن الحالي:</ArabicText>
                      <ArabicText style={styles.cardValue}>{visit.currentWeight} كجم</ArabicText>
                    </View>
                    <View style={styles.cardRow}>
                      <ArabicText style={styles.cardLabel}>الوذمة (Edema):</ArabicText>
                      <ArabicText style={styles.cardValue}>{edemaLabel(visit.edema)}</ArabicText>
                    </View>
                    <View style={styles.cardRow}>
                      <ArabicText style={styles.cardLabel}>تحمل معوي:</ArabicText>
                      <ArabicText style={styles.cardValue}>{tolLabel(visit.enteralTolerance)}</ArabicText>
                    </View>
                    <View style={styles.cardRow}>
                      <ArabicText style={styles.cardLabel}>تحمل وريدي:</ArabicText>
                      <ArabicText style={styles.cardValue}>{tolLabel(visit.parenteralTolerance)}</ArabicText>
                    </View>
                    <View style={styles.cardRow}>
                      <ArabicText style={styles.cardLabel}>التقدم العام:</ArabicText>
                      <ArabicText style={styles.cardValue}>{progLabel(visit.overallProgress)}</ArabicText>
                    </View>
                    {visit.replanRequired && visit.replanNotes && (
                      <View style={styles.replanSection}>
                        <ArabicText bold style={styles.replanLabel}>ملاحظات إعادة التخطيط:</ArabicText>
                        <ArabicText style={styles.replanNotesText}>{visit.replanNotes}</ArabicText>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        )}

        {/* Tab 2: Lab Records */}
        {activeTab === 'labs' && (
          labs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={64} color={colors.textDisabled} />
              <ArabicText style={styles.emptyText}>لا توجد لوحات مخبرية مسجلة</ArabicText>
              <Button
                title="تسجيل لوحة مخبرية"
                onPress={openAddLab}
                icon={<Ionicons name="add" size={20} color={colors.primaryContrast} />}
              />
            </View>
          ) : (
            <View style={styles.listSection}>
              <ArabicText bold style={styles.listTitle}>سجل التحاليل الكيميائية الحيوية</ArabicText>
              {labs.map((record) => {
                const hasHepatic = record.alt !== undefined || record.ast !== undefined || record.albumin !== undefined || record.bilirubin !== undefined;
                const hasRenal = record.potassium !== undefined || record.sodium !== undefined || record.phosphorus !== undefined || record.urea !== undefined || record.creatinine !== undefined;
                const hasMetabolic = record.bloodGlucose !== undefined || record.hba1c !== undefined;

                return (
                  <View key={record.id} style={styles.labCard}>
                    <View style={styles.labCardHeader}>
                      <View style={styles.labHeaderInfo}>
                        <Ionicons name="flask" size={16} color={colors.primary} />
                        <ArabicText bold style={styles.labCardDate}>{formatDate(record.testDate)}</ArabicText>
                      </View>
                      <View style={[styles.typeBadge, record.testType === 'baseline' ? styles.baselineBadge : styles.followupBadge]}>
                        <ArabicText style={[styles.typeBadgeText, record.testType === 'baseline' ? styles.baselineBadgeText : styles.followupBadgeText]}>
                          {record.testType === 'baseline' ? 'تحليل مرجعي' : 'متابعة'}
                        </ArabicText>
                      </View>
                    </View>

                    {evaluateRefeedingRisk(record.potassium, record.phosphorus, record.sodium) && (
                      <View style={styles.refeedingAlertContainer}>
                        <Ionicons name="alert-circle" size={20} color="#900" />
                        <ArabicText style={styles.refeedingAlertText}>
                          🚨 تنبيه سريري حرج: المؤشرات البيوكيميائية (الفوسفور/البوتاسيوم) تشير إلى خطر حاد للإصابة بمتلازمة إعادة التغذية (Refeeding Syndrome). يرجى مراجعة وتعديل الخطة التغذوية فوراً وتعويض الأملاح بحذر.
                        </ArabicText>
                      </View>
                    )}

                    <View style={styles.labCardBody}>
                      {hasHepatic && (
                        <View style={styles.labGroup}>
                          <ArabicText bold style={styles.labGroupTitle}>وظائف الكبد (Hepatic Profile)</ArabicText>
                          <View style={styles.labGrid}>
                            <ValueRow label="ALT" value={record.alt} unit="U/L" />
                            <ValueRow label="AST" value={record.ast} unit="U/L" />
                            <ValueRow label="الألبومين (Albumin)" value={record.albumin} unit="g/dL" />
                            <ValueRow label="البيليروبين (Bilirubin)" value={record.bilirubin} unit="mg/dL" />
                          </View>
                        </View>
                      )}

                      {hasRenal && (
                        <View style={styles.labGroup}>
                          <ArabicText bold style={styles.labGroupTitle}>وظائف الكلى والأملاح (Renal & Electrolytes)</ArabicText>
                          <View style={styles.labGrid}>
                            <ValueRow label="البوتاسيوم (Potassium)" value={record.potassium} unit="mEq/L" />
                            <ValueRow label="الصوديوم (Sodium)" value={record.sodium} unit="mEq/L" />
                            <ValueRow label="الفوسفور (Phosphorus)" value={record.phosphorus} unit="mg/dL" />
                            <ValueRow label="اليوريا (Urea)" value={record.urea} unit="mg/dL" />
                            <ValueRow label="الكرياتينين (Creatinine)" value={record.creatinine} unit="mg/dL" />
                          </View>
                        </View>
                      )}

                      {hasMetabolic && (
                        <View style={styles.labGroup}>
                          <ArabicText bold style={styles.labGroupTitle}>العلامات الأيضية (Metabolic Markers)</ArabicText>
                          <View style={styles.labGrid}>
                            <ValueRow label="السكر (Blood Glucose)" value={record.bloodGlucose} unit="mg/dL" />
                            <ValueRow label="السكر التراكمي (HbA1c)" value={record.hba1c} unit="%" />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>

      {/* Add Visit Modal */}
      <Modal visible={showAddVisitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ArabicText bold style={styles.modalTitle}>إضافة زيارة متابعة</ArabicText>
                <TouchableOpacity onPress={() => setShowAddVisitModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator>
                <ArabicText bold style={styles.sectionTitle}>البيانات الأساسية</ArabicText>

                <DatePickerField
                  label="تاريخ الزيارة"
                  value={watchFollowUp('visitDate')}
                  onChange={(d) => setFollowUpValue('visitDate', d)}
                  error={followUpErrors.visitDate?.message}
                  required
                />

                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="الوزن الحالي (كجم)"
                      value={watchFollowUp('currentWeight')}
                      onChangeText={(val) => setFollowUpValue('currentWeight', val)}
                      keyboardType="decimal-pad"
                      placeholder="مثال: 70"
                      error={followUpErrors.currentWeight?.message}
                      required
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="الطول (سم)"
                      value={watchFollowUp('height')}
                      onChangeText={(val) => setFollowUpValue('height', val)}
                      keyboardType="decimal-pad"
                      placeholder="مثال: 170"
                    />
                  </View>
                </View>

                <TextInputField
                  label="BMI (مؤشر كتلة الجسم)"
                  value={watchFollowUp('bmi')}
                  onChangeText={(val) => setFollowUpValue('bmi', val)}
                  keyboardType="decimal-pad"
                  placeholder="محسوب تلقائياً"
                />

                <ArabicText bold style={styles.sectionTitle}>الحالة السريرية</ArabicText>

                <DropdownField
                  label="الوذمة (Edema)"
                  options={EDEMA_OPTIONS}
                  selectedValue={watchFollowUp('edema')}
                  onValueChange={(val) => setFollowUpValue('edema', val)}
                  error={followUpErrors.edema?.message}
                  required
                  placeholder="اختر حالة الوذمة..."
                />

                <DropdownField
                  label="الجفاف (Dehydration)"
                  options={DEHYDRATION_OPTIONS}
                  selectedValue={watchFollowUp('dehydration')}
                  onValueChange={(val) => setFollowUpValue('dehydration', val)}
                  error={followUpErrors.dehydration?.message}
                  required
                  placeholder="اختر حالة الجفاف..."
                />

                <DropdownField
                  label="تحمل التغذية المعوية"
                  options={TOLERANCE_OPTIONS}
                  selectedValue={watchFollowUp('enteralTolerance')}
                  onValueChange={(val) => setFollowUpValue('enteralTolerance', val)}
                  error={followUpErrors.enteralTolerance?.message}
                  required
                  placeholder="اختر مستوى التحمل..."
                />

                <DropdownField
                  label="تحمل التغذية الوريدية"
                  options={TOLERANCE_OPTIONS}
                  selectedValue={watchFollowUp('parenteralTolerance')}
                  onValueChange={(val) => setFollowUpValue('parenteralTolerance', val)}
                  error={followUpErrors.parenteralTolerance?.message}
                  required
                  placeholder="اختر مستوى التحمل..."
                />

                <DropdownField
                  label="الحالة التنفسية"
                  options={RESPIRATORY_OPTIONS}
                  selectedValue={watchFollowUp('respiratoryStatus')}
                  onValueChange={(val) => setFollowUpValue('respiratoryStatus', val)}
                  error={followUpErrors.respiratoryStatus?.message}
                  required
                  placeholder="اختر الحالة التنفسية..."
                />

                <ArabicText bold style={styles.sectionTitle}>الجهاز الهضمي والسوائل</ArabicText>

                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="عدد مرات التبرز"
                      value={watchFollowUp('stoolFrequency')}
                      onChangeText={(val) => setFollowUpValue('stoolFrequency', val)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <DropdownField
                      label="قوام البراز"
                      options={STOOL_CONSISTENCY_OPTIONS}
                      selectedValue={watchFollowUp('stoolConsistency')}
                      onValueChange={(val) => setFollowUpValue('stoolConsistency', val)}
                      placeholder="اختر القوام..."
                    />
                  </View>
                </View>

                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="السوائل المتناولة (مل)"
                      value={watchFollowUp('fluidIntake')}
                      onChangeText={(val) => setFollowUpValue('fluidIntake', val)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="السوائل المخرجة (مل)"
                      value={watchFollowUp('fluidOutput')}
                      onChangeText={(val) => setFollowUpValue('fluidOutput', val)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                </View>

                <TextInputField
                  label="البقايا المعدية (Gastric Residual)"
                  value={watchFollowUp('gastricResidual')}
                  onChangeText={(val) => setFollowUpValue('gastricResidual', val)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />

                <TextInputField
                  label="التفاعلات الدوائية الغذائية"
                  value={watchFollowUp('drugNutrientConsequences')}
                  onChangeText={(val) => setFollowUpValue('drugNutrientConsequences', val)}
                  multiline
                  placeholder="رصد أي تفاعلات دوائية..."
                />

                <ArabicText bold style={styles.sectionTitle}>التقييم والتقدم</ArabicText>

                <DropdownField
                  label="التقدم العام"
                  options={PROGRESS_OPTIONS}
                  selectedValue={watchFollowUp('overallProgress')}
                  onValueChange={(val) => setFollowUpValue('overallProgress', val)}
                  error={followUpErrors.overallProgress?.message}
                  required
                  placeholder="اختر التقدم..."
                />

                <DropdownField
                  label="هل الخطة ناجحة؟"
                  options={PLAN_SUCCESSFUL_OPTIONS}
                  selectedValue={watchFollowUp('planSuccessful')}
                  onValueChange={(val) => setFollowUpValue('planSuccessful', val)}
                  error={followUpErrors.planSuccessful?.message}
                  required
                  placeholder="اختر..."
                />

                <RadioGroup
                  label="هل يتطلب إعادة تخطيط؟"
                  options={REPLAN_OPTIONS}
                  selectedValue={replanValue}
                  onValueChange={(val) => {
                    setFollowUpValue('replanRequired', val);
                    if (val !== 'yes') setFollowUpValue('replanNotes', '');
                  }}
                  error={followUpErrors.replanRequired?.message}
                  required
                />

                {replanValue === 'yes' && (
                  <TextInputField
                    label="ملاحظات إعادة التخطيط"
                    value={watchFollowUp('replanNotes')}
                    onChangeText={(val) => setFollowUpValue('replanNotes', val)}
                    multiline
                    placeholder="اذكر مبررات وتعديلات الخطة الجديدة..."
                    error={followUpErrors.replanNotes?.message}
                    required
                  />
                )}

                <ArabicText bold style={styles.sectionTitle}>ملاحظات</ArabicText>

                <TextInputField
                  label="تعليقات عامة"
                  value={watchFollowUp('comments')}
                  onChangeText={(val) => setFollowUpValue('comments', val)}
                  multiline
                  placeholder="أي ملاحظات سريرية إضافية..."
                />

                <View style={styles.modalActions}>
                  <Button
                    title="حفظ زيارة المتابعة"
                    onPress={handleFollowUpSubmit(onSubmitFollowUp)}
                    loading={isSavingVisit}
                    disabled={isSavingVisit}
                    icon={<Ionicons name="checkmark" size={20} color={colors.primaryContrast} />}
                  />
                  <Button
                    title="إلغاء"
                    onPress={() => setShowAddVisitModal(false)}
                    variant="secondary"
                    disabled={isSavingVisit}
                  />
                </View>

                <View style={styles.modalSpacer} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Lab Record Modal */}
      <Modal visible={showAddLabModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ArabicText bold style={styles.modalTitle}>تسجيل النتائج المخبرية</ArabicText>
                <TouchableOpacity onPress={() => setShowAddLabModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator>
                <ArabicText bold style={styles.sectionTitle}>بيانات التحليل</ArabicText>

                <DatePickerField
                  label="تاريخ التحليل"
                  value={watchLab('testDate')}
                  onChange={(d) => setLabValue('testDate', d)}
                  error={labErrors.testDate?.message}
                  required
                />

                <DropdownField
                  label="نوع التحليل"
                  options={TEST_TYPE_OPTIONS}
                  selectedValue={watchLab('testType')}
                  onValueChange={(val) => setLabValue('testType', val)}
                  error={labErrors.testType?.message}
                  required
                />

                {/* Hepatic Profile */}
                <ArabicText bold style={styles.sectionTitle}>وظائف الكبد (Hepatic Profile)</ArabicText>
                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="ALT (U/L)"
                      value={watchLab('alt') ?? ''}
                      onChangeText={(val) => setLabValue('alt', val)}
                      keyboardType="decimal-pad"
                      placeholder="0 - 1000"
                      error={labErrors.alt?.message}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="AST (U/L)"
                      value={watchLab('ast') ?? ''}
                      onChangeText={(val) => setLabValue('ast', val)}
                      keyboardType="decimal-pad"
                      placeholder="0 - 1000"
                      error={labErrors.ast?.message}
                    />
                  </View>
                </View>

                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="Albumin (g/dL)"
                      value={watchLab('albumin') ?? ''}
                      onChangeText={(val) => setLabValue('albumin', val)}
                      keyboardType="decimal-pad"
                      placeholder="0.5 - 7.0"
                      error={labErrors.albumin?.message}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="Bilirubin (mg/dL)"
                      value={watchLab('bilirubin') ?? ''}
                      onChangeText={(val) => setLabValue('bilirubin', val)}
                      keyboardType="decimal-pad"
                      placeholder="0.0 - 30.0"
                      error={labErrors.bilirubin?.message}
                    />
                  </View>
                </View>

                {/* Renal/Electrolytes */}
                <ArabicText bold style={styles.sectionTitle}>وظائف الكلى والأملاح (Renal & Electrolytes)</ArabicText>
                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="البوتاسيوم Potassium (mEq/L)"
                      value={watchLab('potassium') ?? ''}
                      onChangeText={(val) => setLabValue('potassium', val)}
                      keyboardType="decimal-pad"
                      placeholder="1.5 - 8.0"
                      error={labErrors.potassium?.message}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="الصوديوم Sodium (mEq/L)"
                      value={watchLab('sodium') ?? ''}
                      onChangeText={(val) => setLabValue('sodium', val)}
                      keyboardType="decimal-pad"
                      placeholder="100 - 180"
                      error={labErrors.sodium?.message}
                    />
                  </View>
                </View>

                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="الفوسفور Phosphorus (mg/dL)"
                      value={watchLab('phosphorus') ?? ''}
                      onChangeText={(val) => setLabValue('phosphorus', val)}
                      keyboardType="decimal-pad"
                      placeholder="0.5 - 15.0"
                      error={labErrors.phosphorus?.message}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="اليوريا Urea (mg/dL)"
                      value={watchLab('urea') ?? ''}
                      onChangeText={(val) => setLabValue('urea', val)}
                      keyboardType="decimal-pad"
                      placeholder="0 - 300"
                      error={labErrors.urea?.message}
                    />
                  </View>
                </View>

                <TextInputField
                  label="الكرياتينين Creatinine (mg/dL)"
                  value={watchLab('creatinine') ?? ''}
                  onChangeText={(val) => setLabValue('creatinine', val)}
                  keyboardType="decimal-pad"
                  placeholder="0.0 - 20.0"
                  error={labErrors.creatinine?.message}
                />

                {/* Metabolic Markers */}
                <ArabicText bold style={styles.sectionTitle}>العلامات الأيضية (Metabolic Markers)</ArabicText>
                <View style={styles.numRow}>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="السكر Glucose (mg/dL)"
                      value={watchLab('bloodGlucose') ?? ''}
                      onChangeText={(val) => setLabValue('bloodGlucose', val)}
                      keyboardType="decimal-pad"
                      placeholder="10 - 1000"
                      error={labErrors.bloodGlucose?.message}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <TextInputField
                      label="السكر التراكمي HbA1c (%)"
                      value={watchLab('hba1c') ?? ''}
                      onChangeText={(val) => setLabValue('hba1c', val)}
                      keyboardType="decimal-pad"
                      placeholder="2.0 - 20.0"
                      error={labErrors.hba1c?.message}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="حفظ النتائج المخبرية"
                    onPress={handleLabSubmit(onSubmitLab)}
                    loading={isSavingLab}
                    disabled={isSavingLab}
                    icon={<Ionicons name="checkmark" size={20} color={colors.primaryContrast} />}
                  />
                  <Button
                    title="إلغاء"
                    onPress={() => setShowAddLabModal(false)}
                    variant="secondary"
                    disabled={isSavingLab}
                  />
                </View>

                <View style={styles.modalSpacer} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// Subcomponent for displaying key-value rows in biochemical cards
const ValueRow = ({ label, value, unit }: { label: string; value?: number; unit: string }) => {
  if (value === undefined || value === null) return null;
  return (
    <View style={styles.valueRow}>
      <ArabicText style={styles.valueLabel}>{label}:</ArabicText>
      <ArabicText bold style={styles.valueText}>{value} {unit}</ArabicText>
    </View>
  );
};

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
    paddingTop: 50,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    color: colors.primaryContrast,
    flex: 1,
    textAlign: 'right',
  },
  addButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textDisabled,
  },
  listSection: {
    padding: spacing.md,
  },
  listTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  // Visit card styles
  visitCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  cardDate: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  replanBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  replanBadgeText: {
    fontSize: 11,
    color: colors.warning,
  },
  cardBody: {
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  replanSection: {
    backgroundColor: '#FFF8E1',
    padding: spacing.sm,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  replanLabel: {
    fontSize: 12,
    color: colors.warning,
    marginBottom: 2,
    textAlign: 'right',
  },
  replanNotesText: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  // Lab card styles
  labCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
  },
  labHeaderInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labCardDate: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  baselineBadge: {
    backgroundColor: '#E8EAF6',
  },
  followupBadge: {
    backgroundColor: '#E8F5E9',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  baselineBadgeText: {
    color: '#3F51B5',
  },
  followupBadgeText: {
    color: '#4CAF50',
  },
  labCardBody: {
    gap: spacing.sm,
  },
  labGroup: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
  },
  labGroupTitle: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  labGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  valueRow: {
    width: '47%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingBottom: 2,
  },
  valueLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  valueText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  numRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalSpacer: {
    height: 50,
  },
  refeedingAlertContainer: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FFAAAA',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  refeedingAlertText: {
    color: '#990000',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
});
