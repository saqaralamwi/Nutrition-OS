import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../src/presentation/stores/toastStore';
import { useSettingsStore } from '../../src/presentation/stores/settingsStore';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies, fontSizes, lineHeights } from '../../src/presentation/theme';
import { useAppTheme } from '../../src/presentation/hooks/useAppTheme';
import { Patient } from '../../src/domain/entities/Patient';
import { ActivityLevel, ACTIVITY_LEVELS } from '../../src/domain/entities/NutritionPlan';
import DropdownField from '../../src/presentation/components/DropdownField';
import ClinicalAlertsBanner from '../../src/presentation/components/ClinicalAlertsBanner';
import DraftBanner from '../../src/presentation/components/DraftBanner';
import useClinicalAlerts from '../../src/presentation/hooks/useClinicalAlerts';
import { usePatientDrafts } from '../../src/presentation/hooks/usePatientDrafts';
import { withAuth } from '../../src/presentation/components/withAuth';
import { VitalsRepository } from '../../src/data/repositories/VitalsRepository';
import { CardioRepository } from '../../src/data/repositories/CardioRepository';
import { getBmiCategory, getBmiColor, getBmiSeverity } from '../../src/domain/utils/bmiClassification';
import { getRecommendation } from '../../src/domain/clinical/recommendations/NutritionalRecommender';
import type { RecommenderOutput } from '../../src/domain/clinical/recommendations/NutritionalRecommender';
import type { ICardiovascularAssessment } from '../../src/data/types/cardiovascular';

const DEPARTMENT_LABELS: Record<string, string> = {
  ICU: 'عناية مركزة',
  Internal: 'داخلي',
  Surgical: 'جراحي',
  Pediatrics: 'أطفال',
  'OB/GYN': 'نساء وتوليد',
  Outpatient: 'عيادات خارجية',
};

const PATIENT_TYPE_LABELS: Record<string, string> = {
  inpatient: 'منوم',
  outpatient: 'عيادات خارجية',
  consultation: 'استشارة',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'ذكر',
  female: 'أنثى',
};

const FREQUENCY_LABELS: Record<string, string> = {
  once_daily: 'مرة يومياً',
  twice_daily: 'مرتين يومياً',
  three_times_daily: 'ثلاث مرات يومياً',
  four_times_daily: 'أربع مرات يومياً',
  prn: 'عند الحاجة',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
};

const SUPPLEMENT_TYPE_LABELS: Record<string, string> = {
  vitamin: 'فيتامين',
  mineral: 'معدن',
  protein: 'بروتين',
  amino_acid: 'أحماض أمينية',
  herbal: 'أعشاب',
  oil: 'زيوت',
  other: 'أخرى',
};

function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const FILTER_CHIPS = useMemo(() => [
    { id: 'all', label: 'الكل', icon: 'apps' as const },
    { id: 'pediatrics', label: 'طب الأطفال', icon: 'happy-outline' as const },
    { id: 'icu', label: 'العناية المركزة', icon: 'fitness-outline' as const },
    { id: 'chronic', label: 'الأمراض المزمنة', icon: 'heart-outline' as const },
    { id: 'oncology_surgery', label: 'الأورام والجراحة', icon: 'medkit-outline' as const },
  ], []);

  const MODULE_FILTER_CATEGORY: Record<string, string> = useMemo(() => ({
    'stamp': 'pediatrics',
    'growth-charts': 'pediatrics',
    'pediatric-measurement-form': 'pediatrics',
    'icu-admission': 'icu',
    'icu-gateway': 'icu',
    'critical-care': 'icu',
    'icu-charts': 'icu',
    'burn-assessment': 'icu',
    'respiratory-deck': 'icu',
    'nutrition-calculator': 'icu',
    'iv-medications': 'icu',
    'ncp-diabetes-gateway': 'chronic',
    'diabetes-gateway': 'chronic',
    'renal-gateway': 'chronic',
    'ncp-nephrology-gateway': 'chronic',
    'cirrhosis-gateway': 'chronic',
    'anemia-gateway': 'chronic',
    'osteoporosis-gateway': 'chronic',
    'gout-gateway': 'chronic',
    'cardio-assessment': 'chronic',
    'cardio-charts': 'chronic',
    'screening': 'chronic',
    'gastro-oncology-gateway': 'oncology_surgery',
    'ncp-gastro-oncology-gateway': 'oncology_surgery',
    'surgical-life-gateway': 'oncology_surgery',
    'gastro-immunology-deck': 'oncology_surgery',
    'eating-disorders-gateway': 'oncology_surgery',
    'orthopedics-gateway': 'oncology_surgery',
    'pregnancy-lactation-gateway': 'oncology_surgery',
    'stroke-gateway': 'oncology_surgery',
    'dysphagia-intervention': 'oncology_surgery',
    'ncp-anemia-gateway': 'chronic',
    'ncp-osteoporosis-gateway': 'chronic',
    'ncp-gout-gateway': 'chronic',
    'ncp-stroke-gateway': 'oncology_surgery',
    'ncp-eating-disorders-gateway': 'oncology_surgery',
    'ncp-orthopedics-gateway': 'oncology_surgery',
    'ncp-pregnancy-lactation-gateway': 'oncology_surgery',
  }), []);

  const { alerts } = useClinicalAlerts(id);
  const { infos: draftInfos } = usePatientDrafts(id ?? '');

  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  const [socialHistory, setSocialHistory] = useState<any>(null);
  const [physicalExam, setPhysicalExam] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [intervention, setIntervention] = useState<any>(null);

  const [latestBmi, setLatestBmi] = useState<number | null>(null);
  const [latestCardio, setLatestCardio] = useState<ICardiovascularAssessment | null>(null);
  const [zScoreAssessment, setZScoreAssessment] = useState<any>(null);

  const diagnosisCategory = useMemo(() => {
    if (!patient) return 'GENERAL';
    const diag = patient.primaryDiagnosis?.toLowerCase() || '';
    const dept = patient.department?.toLowerCase() || '';
    if (dept.includes('icu') || diag.includes('icu') || diag.includes('critical') || diag.includes('عناية') || diag.includes('حرجة')) return 'ICU';
    if (diag.includes('renal') || diag.includes('kidney') || diag.includes('كلى') || diag.includes('فشل')) return 'RENAL';
    if (diag.includes('diabetes') || diag.includes('dm') || diag.includes('سكر')) return 'DIABETES';
    if (diag.includes('liver') || diag.includes('cirrhosis') || diag.includes('hepatitis') || diag.includes('كبد') || diag.includes('تشمع')) return 'LIVER';
    if (diag.includes('cancer') || diag.includes('tumor') || diag.includes('oncology') || diag.includes('سرطان') || diag.includes('ورم')) return 'CANCER';
    if (diag.includes('gastro') || diag.includes('gerd') || diag.includes('pancreat') || diag.includes('ibd') || diag.includes('بطن') || diag.includes('معدة') || diag.includes('قولون') || diag.includes('هضم')) return 'GI';
    if (dept.includes('surgical') || dept.includes('جراحي') || diag.includes('surgery') || diag.includes('post-op') || diag.includes('جراح')) return 'SURGERY';
    if (diag.includes('anorexia') || diag.includes('bulimia') || diag.includes('arfid') || diag.includes('eating') || diag.includes('شهية') || diag.includes('شره') || diag.includes('اضطراب الأكل')) return 'EATING_DISORDER';
    if (diag.includes('ortho') || diag.includes('fracture') || diag.includes('bone') || diag.includes('عظام') || diag.includes('كسر')) return 'ORTHO';
    if (diag.includes('pregnancy') || diag.includes('lactat') || diag.includes('حمل') || diag.includes('رضاعة')) return 'PREGNANCY';
    if (diag.includes('stroke') || diag.includes('cva') || diag.includes('neuro') || diag.includes('جلطة') || diag.includes('دماغ') || diag.includes('شلل')) return 'STROKE';
    if (diag.includes('anemia') || diag.includes('iron') || diag.includes('b12') || diag.includes('folate') || diag.includes('فقر دم') || diag.includes('نقص الحديد') || diag.includes('نقص الفيتامين')) return 'ANEMIA';
    if (diag.includes('osteoporosis') || diag.includes('osteopenia') || diag.includes('bone density') || diag.includes('هشاشة') || diag.includes('ترقق')) return 'OSTEO';
    if (diag.includes('gout') || diag.includes('uric acid') || diag.includes('نقرس') || diag.includes('حمض البوليك')) return 'GOUT';
    return 'GENERAL';
  }, [patient]);

  const MODULES_CONFIG = useMemo(() => [
    { id: 'medical-history', title: 'التاريخ المرضي', icon: 'clipboard' as const, route: `/patient/${patient?.id}/medical-history`, color: colors.accentTeal },
    { id: 'social-history', title: 'التاريخ الاجتماعي والنمط', icon: 'people' as const, route: `/patient/${patient?.id}/social-history`, color: colors.accentAmber },
    { id: 'physical-exam', title: 'الفحص السريري', icon: 'person' as const, route: `/patient/${patient?.id}/physical-exam`, color: colors.accentSky },
    { id: 'laboratory', title: 'الفحوصات المخبرية', icon: 'flask' as const, route: `/patient/${patient?.id}/laboratory`, color: colors.accentRose },
    { id: 'screening', title: 'تقييم الخطر التغذوي (NRS-2002)', icon: 'checkbox-outline' as const, route: `/patient/${patient?.id}/screening`, color: colors.accentTeal, minAge: 18 },
    { id: 'stamp', title: 'فحص سوء التغذية للأطفال (STAMP)', icon: 'bonfire' as const, route: `/patient/${patient?.id}/stamp`, color: colors.accentAmber, maxAge: 17 },
    { id: 'icu-admission', title: 'قبول العناية المركزة (ICU)', icon: 'fitness' as const, route: `/patient/${patient?.id}/icu-admission`, color: colors.danger, highlightFor: ['ICU'] },
    { id: 'dietary-history', title: 'تقييم التاريخ التغذوي (24h Recall)', icon: 'clipboard' as const, route: `/meal-planner/dietary-history?patientId=${patient?.id}`, color: colors.accentIndigo },
    { id: 'medications', title: 'الأدوية والمكملات', icon: 'medical' as const, route: `/patient/${patient?.id}/medications`, color: colors.accentIndigo },
    { id: 'supplements', title: 'المكملات الغذائية (منفصل)', icon: 'nutrition' as const, route: `/patient/${patient?.id}/supplements`, color: colors.accentTeal },
    { id: 'cardio-assessment', title: 'تقييم القلب والأوعية الدموية', icon: 'heart' as const, route: `/patient/${patient?.id}/cardio-assessment`, color: colors.accentRose, isWide: true },
    { id: 'iv-medications', title: 'المحاليل والأدوية المسببة للسعرات', icon: 'flask-outline' as const, route: `/patient/${patient?.id}/iv-medications`, color: colors.accentAmber, highlightFor: ['ICU'] },
    { id: 'nutrition-calculator', title: 'حاسبة التغذية الأنبوبية والوريدية', icon: 'flask' as const, route: `/patient/${patient?.id}/nutrition-calculator`, color: colors.accentTeal, highlightFor: ['ICU'] },
    { id: 'clinical-analysis', title: 'التحليل السريري المتقدم', icon: 'analytics' as const, route: `/patient/${patient?.id}/clinical-analysis`, color: colors.accentSky },
    { id: 'diabetes-gateway', title: 'بوابة رعاية السكري (Diabetes NCP)', icon: 'water' as const, route: `/patient/${patient?.id}/ncp-diabetes-gateway`, color: colors.danger, isWide: true, highlightFor: ['DIABETES'] },
    { id: 'renal-gateway', title: 'بوابة رعاية أمراض الكلى (Nephrology)', icon: 'funnel' as const, route: `/patient/${patient?.id}/ncp-nephrology-gateway`, color: colors.info, isWide: true, highlightFor: ['RENAL'] },
    { id: 'icu-gateway', title: 'بوابة العناية المركزة (ICU NCP)', icon: 'bed' as const, route: `/patient/${patient?.id}/ncp-icu-gateway`, color: colors.accentViolet, isWide: true, highlightFor: ['ICU'] },
    { id: 'critical-care', title: 'محاكي الرعاية الحرجة والتغذية الوريدية', icon: 'pulse' as const, route: `/patient/${patient?.id}/icu-critical-care`, color: colors.accentSky, isWide: true, highlightFor: ['ICU'] },
    { id: 'icu-charts', title: 'منحنيات سوائل العناية والأسموزية', icon: 'analytics' as const, route: `/patient/${patient?.id}/icu-charts`, color: colors.accentViolet, isWide: true, secondary: true },
    { id: 'burn-assessment', title: 'إنعاش وتقييم الحروق البليغة', icon: 'flame' as const, route: `/patient/${patient?.id}/burn-assessment`, color: colors.accentAmber, isWide: true, secondary: true },
    { id: 'respiratory-deck', title: 'لوحة التحكم التنفسي وكبح الكربوهيدرات', icon: 'options' as const, route: `/patient/${patient?.id}/respiratory-deck`, color: colors.accentSky, isWide: true, highlightFor: ['ICU'] },
    { id: 'certified-audit', title: 'بوابة التصديق والتدقيق السريري', icon: 'lock-closed' as const, route: `/patient/${patient?.id}/certified-audit-gateway`, color: colors.accentAmber, isWide: true, secondary: true },
    { id: 'growth-charts', title: 'منحنيات النمو للأطفال (WHO)', icon: 'trending-up' as const, route: `/patient/${patient?.id}/growth-charts`, color: colors.accentTeal, isWide: true, secondary: true, maxAge: 17 },
    { id: 'cardio-charts', title: 'منحنيات القلب والسوائل', icon: 'pulse' as const, route: `/patient/${patient?.id}/cardio-charts`, color: colors.danger, isWide: true, secondary: true },
    { id: 'cirrhosis-gateway', title: 'بوابة رعاية تشمع الكبد (Cirrhosis)', icon: 'leaf' as const, route: `/patient/${patient?.id}/cirrhosis-gateway`, color: colors.accentAmber, isWide: true, highlightFor: ['LIVER'] },
    { id: 'gastro-oncology-gateway', title: 'بوابة الجهاز الهضمي والأورام (Oncology / GI)', icon: 'analytics-outline' as const, route: `/patient/${patient?.id}/ncp-gastro-oncology-gateway`, color: colors.accentRose, isWide: true, highlightFor: ['CANCER', 'GI'] },
    { id: 'surgical-life-gateway', title: 'بوابة التعافي المعزز بعد الجراحة (ERAS)', icon: 'shield-checkmark-outline' as const, route: `/patient/${patient?.id}/surgical-life-gateway`, color: colors.accentTeal, isWide: true, highlightFor: ['SURGERY'] },
    { id: 'gastro-immunology-deck', title: 'بوابة أمراض الهضم والمناعة (GI & IBD)', icon: 'medical-outline' as const, route: `/patient/${patient?.id}/gastro-immunology-deck`, color: colors.accentSky, isWide: true, highlightFor: ['GI'] },
    { id: 'eating-disorders-gateway', title: 'بوابة رعاية اضطرابات الأكل (Eating Disorders)', icon: 'heart-half-outline' as const, route: `/patient/${patient?.id}/ncp-eating-disorders-gateway`, color: colors.accentAmber, isWide: true, highlightFor: ['EATING_DISORDER'] },
    { id: 'orthopedics-gateway', title: 'بوابة رعاية جراحة العظام والكسور', icon: 'shield-outline' as const, route: `/patient/${patient?.id}/ncp-orthopedics-gateway`, color: colors.accentSky, isWide: true, highlightFor: ['ORTHO'] },
    { id: 'pregnancy-lactation-gateway', title: 'بوابة رعاية الحوامل والمرضعات', icon: 'female-outline' as const, route: `/patient/${patient?.id}/ncp-pregnancy-lactation-gateway`, color: colors.accentRose, isWide: true, highlightFor: ['PREGNANCY'] },
    { id: 'stroke-gateway', title: 'بوابة الرعاية العصبية والجلطات (Stroke NCP)', icon: 'pulse-outline' as const, route: `/patient/${patient?.id}/ncp-stroke-gateway`, color: colors.accentRose, isWide: true, highlightFor: ['STROKE'] },
    { id: 'anemia-gateway', title: 'بوابة رعاية فقر الدم والتأهيل الغذائي (Anemia NCP)', icon: 'water-outline' as const, route: `/patient/${patient?.id}/ncp-anemia-gateway`, color: colors.danger, isWide: true, highlightFor: ['ANEMIA'] },
    { id: 'osteoporosis-gateway', title: 'بوابة رعاية هشاشة العظام (Osteoporosis NCP)', icon: 'shield-checkmark-outline' as const, route: `/patient/${patient?.id}/ncp-osteoporosis-gateway`, color: colors.accentAmber, isWide: true, highlightFor: ['OSTEO'] },
    { id: 'gout-gateway', title: 'بوابة رعاية النقرس (Gout NCP)', icon: 'medkit-outline' as const, route: `/patient/${patient?.id}/ncp-gout-gateway`, color: colors.accentRose, isWide: true, highlightFor: ['GOUT'] },
    { id: 'dysphagia-intervention', title: 'عسر البلع وتعديل القوام (Dysphagia)', icon: 'cafe-outline' as const, route: `/patient/${patient?.id}/dysphagia-intervention`, color: colors.accentSky, isWide: true, highlightFor: ['STROKE'] },
    { id: 'report', title: 'مركز التقارير السريرية', icon: 'document-text' as const, route: `/patient/${patient?.id}/report`, color: colors.primary, isWide: true },
  ], [patient]);

  const bmiCategory = useMemo(() => latestBmi != null ? getBmiCategory(latestBmi) : null, [latestBmi]);

  const clinicalInsight = useMemo<RecommenderOutput | null>(() => {
    if (!bmiCategory) return null;
    return getRecommendation({
      bmiCategory,
      bmi: latestBmi ?? 0,
      cardioAssessment: latestCardio,
    });
  }, [bmiCategory, latestBmi, latestCardio]);

  const { priorityModules, standardModules, secondaryModules } = useMemo(() => {
    if (!patient) return { priorityModules: [], standardModules: [], secondaryModules: [] };
    let filtered = MODULES_CONFIG.filter(m => {
      if (m.minAge !== undefined && patient.age < m.minAge) return false;
      if (m.maxAge !== undefined && patient.age > m.maxAge) return false;
      return true;
    });
    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => MODULE_FILTER_CATEGORY[m.id] === activeFilter);
    }
    return {
      priorityModules: filtered.filter(m => (m as any).highlightFor?.includes(diagnosisCategory)),
      standardModules: filtered.filter(m => !(m as any).highlightFor?.includes(diagnosisCategory) && !(m as any).secondary),
      secondaryModules: filtered.filter(m => (m as any).secondary && !(m as any).highlightFor?.includes(diagnosisCategory)),
    };
  }, [MODULES_CONFIG, patient, diagnosisCategory, activeFilter, MODULE_FILTER_CATEGORY]);

  const scrollViewRef = useRef<ScrollView>(null);
  const clinicalAnalysisYRef = useRef<number>(0);
  const showToast = useToastStore((s) => s.showToast);

  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  async function loadClinicalData(patientId: string) {
    try {
      const [medHistMod, socHistMod, physExamMod, labMod, medsMod, supsMod, intervMod] = await Promise.all([
        import('../../src/domain/use-cases/GetMedicalHistoryUseCase'),
        import('../../src/domain/use-cases/GetSocialHistoryUseCase'),
        import('../../src/domain/use-cases/GetPhysicalExamUseCase'),
        import('../../src/domain/use-cases/GetLabResultsUseCase'),
        import('../../src/domain/use-cases/GetMedicationsUseCase'),
        import('../../src/domain/use-cases/GetSupplementsUseCase'),
        import('../../src/domain/use-cases/GetActiveInterventionUseCase')
      ]);
      const [medHist, socHist, physExam, labs, meds, sups, interv] = await Promise.all([
        new medHistMod.GetMedicalHistoryUseCase().execute(patientId).catch(() => null),
        new socHistMod.GetSocialHistoryUseCase().execute(patientId).catch(() => null),
        new physExamMod.GetPhysicalExamUseCase().execute(patientId).catch(() => []),
        new labMod.GetLabResultsUseCase().execute(patientId).catch(() => []),
        new medsMod.GetMedicationsUseCase().execute(patientId).catch(() => []),
        new supsMod.GetSupplementsUseCase().execute(patientId).catch(() => []),
        new intervMod.GetActiveInterventionUseCase().execute(patientId).catch(() => null)
      ]);
      setMedicalHistory(medHist); setSocialHistory(socHist); setPhysicalExam(physExam);
      setLabResults(labs); setMedications(meds); setSupplements(sups); setIntervention(interv);
    } catch (e) { console.error(e); }

    try {
      const vitalsRepo = new VitalsRepository();
      const latest = await vitalsRepo.getLatestByPatientId(patientId);
      if (latest?.bmi) setLatestBmi(latest.bmi);
    } catch { /* vitals not available */ }

    try {
      const cardioRepo = new CardioRepository();
      const assessment = await cardioRepo.getLatestByPatientId(patientId);
      if (assessment) setLatestCardio(assessment);
    } catch { /* cardio not available */ }
  }

  async function computePediatricAssessment(p: any) {
    try {
      const vitalsRepo = new VitalsRepository();
      const latest = await vitalsRepo.getLatestByPatientId(p.id);
      if (latest?.weightKg && latest?.heightCm) {
        const { calculateAssessment } = await import('../../src/domain/calculators/ClinicalEngine');
        const result = await calculateAssessment({
          age: p.age,
          gender: p.gender as 'male' | 'female',
          weightKg: latest.weightKg,
          heightCm: latest.heightCm,
        });
        setZScoreAssessment(result);
      }
    } catch { /* z-score not available */ }
  }

  useEffect(() => {
    loadPatient();
    loadClinicalData(id);
  }, [id]);

  useEffect(() => {
    if (patient && patient.age < 19) {
      computePediatricAssessment(patient);
    }
  }, [patient]);

  async function loadPatient() {
    try {
      const { GetPatientUseCase } = await import('../../src/domain/use-cases/GetPatientUseCase');
      const p = await new GetPatientUseCase().execute(id);
      setPatient(p);
    } catch { showToast('فشل تحميل البيانات', 'error'); }
    finally { setLoading(false); }
  }

  const handleCalculate = useCallback(async () => {
    if (!patient) return;
    const w = parseFloat(weightKg); const h = parseFloat(heightCm);
    if (!w || !h) return showToast('يرجى إدخال الوزن والطول', 'error');
    setIsCalculating(true);
    try {
      const { calculatePatientMetrics } = await import('../../src/domain/calculators/NutritionEngine');
      setCurrentMetrics(calculatePatientMetrics({
        patientId: id, weightKg: w, heightCm: h, age: patient.age,
        isMale: patient.gender === 'male', activityLevel
      }) as any);
    } catch { showToast('فشل الحساب', 'error'); }
    finally { setIsCalculating(false); }
  }, [patient, weightKg, heightCm, activityLevel, id, showToast]);

  const handleGeneratePlan = useCallback(async () => {
    if (!patient || !currentMetrics) return;
    setIsGeneratingPlan(true);
    try {
      const { generateNutritionPlan } = await import('../../src/domain/calculators/NutritionEngine');
      setCurrentPlan(generateNutritionPlan({
        patientId: id, metricsId: currentMetrics.id || '', weightKg: currentMetrics.weightKg,
        tdee: currentMetrics.tdee.value, activityLevel, diagnosis: patient.primaryDiagnosis
      }) as any);
    } catch { showToast('فشل توليد الخطة', 'error'); }
    finally { setIsGeneratingPlan(false); }
  }, [patient, currentMetrics, activityLevel, id, showToast]);

  const userName = useSettingsStore((s) => s.username) || 'Dietitian';

  const handlePrintReport = useCallback(async () => {
    try {
      const { GenerateUniversalReportUseCase } = await import('../../src/domain/use-cases/GenerateUniversalReportUseCase');
      const { ReportFormatter } = await import('../../src/domain/reports/ReportFormatter');
      
      const useCase = new GenerateUniversalReportUseCase();
      const payload = await useCase.execute(id);
      
      payload.header.clinicianName = userName;
      const htmlContent = ReportFormatter.toHTML(payload);
      await Print.printAsync({ html: htmlContent });
      showToast('تم تهيئة ملف الطباعة السريري بنجاح ✓', 'success');
    } catch (error) {
      console.error('Print error:', error);
      showToast('فشل تصدير التقرير السريري', 'error');
    }
  }, [id, showToast, userName]);

  if (loading) return <View style={[styles.centered, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!patient) return <View style={[styles.centered, { backgroundColor: theme.background }]}><Text style={[styles.errorText, { color: theme.text }]}>المريض غير موجود</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollViewRef} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{patient.fullName}</Text>
          <Text style={styles.headerSubtitle}>{patient.fileNumber}</Text>
        </View>

        <ClinicalAlertsBanner alerts={alerts} />

        <DraftBanner drafts={draftInfos} patientId={id ?? ''} />

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>معلومات المريض</Text>
          <InfoRow label="القسم" value={DEPARTMENT_LABELS[patient.department] || patient.department} />
          <InfoRow label="التشخيص" value={patient.primaryDiagnosis} />
          <InfoRow label="العمر" value={`${patient.age} سنة`} />
          
          <View style={{ marginTop: spacing.md }}>
            <DropdownField
              label="مستوى النشاط البدني (Activity Level)"
              options={Object.entries(ACTIVITY_LEVELS).map(([key, val]) => ({ label: val.label, value: key }))}
              selectedValue={activityLevel}
              onValueChange={(val) => setActivityLevel(val as ActivityLevel)}
            />
          </View>
        </View>

        {patient && patient.age < 19 && zScoreAssessment ? (
          <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: (zScoreAssessment.zScore >= -1 && zScoreAssessment.zScore <= 1 ? '#4ade80' : zScoreAssessment.zScore >= -2 && zScoreAssessment.zScore <= 2 ? '#fbbf24' : '#f43f5e') + '40' }]}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb-outline" size={20} color={zScoreAssessment.zScore >= -1 && zScoreAssessment.zScore <= 1 ? '#4ade80' : zScoreAssessment.zScore >= -2 && zScoreAssessment.zScore <= 2 ? '#fbbf24' : '#f43f5e'} />
              <Text style={[styles.insightTitle, { color: theme.text }]}>بصيرة سريرية</Text>
            </View>
            <View style={styles.insightBmiRow}>
              <Text style={[styles.insightCategory, { color: zScoreAssessment.zScore >= -1 && zScoreAssessment.zScore <= 1 ? '#4ade80' : zScoreAssessment.zScore >= -2 && zScoreAssessment.zScore <= 2 ? '#fbbf24' : '#f43f5e' }]}>
                {zScoreAssessment.indicatorLabel}
              </Text>
              <Text style={[styles.insightBmiValue, { color: theme.subtext }]}>
                Z-Score: {zScoreAssessment.zScore.toFixed(2)}
              </Text>
            </View>
            <View style={styles.zScoreBar}>
              <View style={[styles.zScoreSegment, { backgroundColor: '#f43f5e' }]} />
              <View style={[styles.zScoreSegment, { backgroundColor: '#fbbf24' }]} />
              <View style={[styles.zScoreSegment, { backgroundColor: '#4ade80' }]} />
              <View style={[styles.zScoreSegment, { backgroundColor: '#fbbf24' }]} />
              <View style={[styles.zScoreSegment, { backgroundColor: '#f43f5e' }]} />
              <View style={[styles.zScoreNeedle, { left: `${Math.min(Math.max((zScoreAssessment.zScore + 3) / 6 * 100, 0), 100)}%` }]} />
            </View>
            <View style={styles.zScoreScaleLabels}>
              <Text style={styles.zScoreScaleText}>-3</Text>
              <Text style={styles.zScoreScaleText}>-2</Text>
              <Text style={styles.zScoreScaleText}>-1</Text>
              <Text style={styles.zScoreScaleText}>0</Text>
              <Text style={styles.zScoreScaleText}>+1</Text>
              <Text style={styles.zScoreScaleText}>+2</Text>
              <Text style={styles.zScoreScaleText}>+3</Text>
            </View>
            <Text style={[styles.insightRecommendation, zScoreAssessment.isStunted && { color: '#f43f5e', fontWeight: '700' }]}>
              {zScoreAssessment.isStunted ? '⚠️ مؤشرات التقزم: استشارة طبية عاجلة ومتابعة غذائية مكثفة' : 'مؤشرات النمو ضمن الحدود الطبيعية'}
            </Text>
          </View>
        ) : clinicalInsight && bmiCategory && (patient?.age ?? 0) >= 19 && (
          <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: getBmiColor(latestBmi ?? 0) + '40' }]}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb-outline" size={20} color={getBmiColor(latestBmi ?? 0)} />
              <Text style={[styles.insightTitle, { color: theme.text }]}>بصيرة سريرية</Text>
            </View>
            <View style={styles.insightBmiRow}>
              <Text style={[styles.insightCategory, { color: getBmiColor(latestBmi ?? 0) }]}>
                {bmiCategory}
              </Text>
              <Text style={[styles.insightBmiValue, { color: theme.subtext }]}>
                BMI {latestBmi?.toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.insightRecommendation, { color: theme.subtext }]}>{clinicalInsight.recommendation}</Text>
            {clinicalInsight.alertMessage && (
              <View style={styles.insightAlert}>
                <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                <Text style={styles.insightAlertText}>{clinicalInsight.alertMessage}</Text>
              </View>
            )}
          </View>
        )}

        {/* أقسام الرعاية المتخصصة */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>أقسام الرعاية المتخصصة</Text>
          <View style={styles.specializedContainer}>
            <TouchableOpacity
              style={[styles.specializedCard, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => router.push(`/patient/${patient.id}/growth-charts` as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.specializedIconContainer, { backgroundColor: colors.accentTeal + '18' }]}>
                <Ionicons name="trending-up" size={26} color={colors.accentTeal} />
              </View>
              <View style={styles.specializedTextCol}>
                <Text style={[styles.specializedTitle, { color: theme.text }]}>قسم طب الأطفال ومخططات النمو</Text>
                <Text style={[styles.specializedSub, { color: theme.subtext }]}>منحنيات WHO و CDC الموسعة للأطفال والمراهقين</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.accentTeal} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.specializedCard, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => router.push(`/patient/${patient.id}/ncp-gastro-oncology-gateway` as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.specializedIconContainer, { backgroundColor: colors.accentRose + '18' }]}>
                <Ionicons name="analytics-outline" size={26} color={colors.accentRose} />
              </View>
              <View style={styles.specializedTextCol}>
                <Text style={[styles.specializedTitle, { color: theme.text }]}>قسم الأورام والجهاز الهضمي</Text>
                <Text style={[styles.specializedSub, { color: theme.subtext }]}>رعاية الأورام وجراحات السمنة والإخراج والمناعة</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.accentRose} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>مساحة العمل السريرية الذكية</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipContainer}
            style={styles.filterChipScroll}
          >
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(chip.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={chip.icon}
                    size={16}
                    color={isActive ? '#fff' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {priorityModules.length > 0 && (
            <View style={styles.prioritySection}>
              <Text style={styles.subSectionTitle}>⚠️ وحدات ذات أولوية للحالة</Text>
              {priorityModules.map(m => <ModuleButton key={m.id} {...(m as any)} highlighted isWide />)}
            </View>
          )}
          <IntegratedInterventionCard patientId={patient.id} />
          <View style={styles.twoColumnContainer}>
            <View style={styles.column}>{standardModules.filter((_, i) => i % 2 === 0).map(m => <ModuleButton key={m.id} {...(m as any)} />)}</View>
            <View style={styles.column}>{standardModules.filter((_, i) => i % 2 !== 0).map(m => <ModuleButton key={m.id} {...(m as any)} />)}</View>
          </View>
          {secondaryModules.length > 0 && (
            <>
              <TouchableOpacity style={styles.moreToolsToggle} onPress={() => setShowMoreTools(!showMoreTools)}>
                <Text style={styles.moreToolsToggleText}>{showMoreTools ? 'إخفاء الأدوات الإضافية' : 'عرض المزيد من الأدوات'}</Text>
                <Ionicons name={showMoreTools ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
              </TouchableOpacity>
              {showMoreTools && <View style={styles.secondarySection}>{secondaryModules.map(m => <ModuleButton key={m.id} {...(m as any)} isWide />)}</View>}
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => clinicalAnalysisYRef.current = e.nativeEvent.layout.y}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>التحليل السريري</Text>
          <TextInput style={[styles.input, { marginBottom: spacing.md, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="الوزن (كجم)" placeholderTextColor={theme.subtext} textAlign="right" />
          <TextInput style={[styles.input, { marginBottom: spacing.md, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="الطول (سم)" placeholderTextColor={theme.subtext} textAlign="right" />
          
          <DropdownField
            label="مستوى النشاط البدني"
            options={Object.entries(ACTIVITY_LEVELS).map(([key, val]) => ({ label: val.label, value: key }))}
            selectedValue={activityLevel}
            onValueChange={(val) => setActivityLevel(val as ActivityLevel)}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleCalculate}><Text style={styles.primaryButtonText}>حساب القياسات</Text></TouchableOpacity>
          {currentMetrics && <MetricDisplay label="BMI" value={currentMetrics.bmi.value.toFixed(2)} />}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>خطة التغذية</Text>
          {currentPlan ? <Text style={[styles.planTitle, { color: theme.text }]}>السعرات المستهدفة: {currentPlan.totalCalories} سعرة</Text> : <Text style={[styles.noDataText, { color: theme.subtext }]}>لا توجد خطة حالية. يرجى إدخال البيانات أعلاه والضغط على توليد الخطة.</Text>}
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={handleGeneratePlan}><Text style={styles.primaryButtonText}>توليد الخطة</Text></TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <ModuleButton title="📉 المتابعة والتقييم الدوري" icon="pulse" route={`/patient/${patient.id}/monitoring`} color={colors.accentSky} isWide />
          <ModuleButton title="🚪 خروج وتلخيص الحالة" icon="log-out" route={`/patient/${patient.id}/discharge`} color={colors.accentAmber} isWide />
          <View style={[styles.reportActionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.reportActionContent}>
              <View style={[styles.reportActionIcon, { backgroundColor: colors.accentTeal + '20' }]}>
                <Ionicons name="document-outline" size={28} color={colors.accentTeal} />
              </View>
              <View style={styles.reportActionTextCol}>
                <Text style={[styles.reportActionTitle, { color: theme.text }]}>إصدار تقرير طبي</Text>
                <Text style={[styles.reportActionSub, { color: theme.subtext }]}>تقرير سريري شامل مع قياسات النمو والقلب والمكملات</Text>
              </View>
              <Ionicons name="arrow-back" size={20} color={colors.accentTeal} />
            </View>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={() => router.push(`/patient/${patient.id}/report` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.reportActionButtonText}>عرض التقرير وتصفح PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function IntegratedInterventionCard({ patientId }: { patientId: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.integratedInterventionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.integratedHeader}>
        <Ionicons name="restaurant" size={22} color={colors.primary} />
        <Text style={[styles.integratedTitle, { color: theme.text }]}>خطة التدخل الغذائي المتكاملة</Text>
      </View>
      <View style={styles.tabContainer}>
        <TabBtn title="الحسابات" icon="calculator" route={`/patient/${patientId}/calculations`} color={colors.accentTeal} />
        <TabBtn title="الخطة" icon="document-text" route={`/patient/${patientId}/intervention`} color={colors.accentIndigo} />
        <TabBtn title="البدائل" icon="nutrition" route={`/patient/${patientId}/diet-plan`} color={colors.accentSky} />
        <TabBtn title="الوصفة الذكية" icon="flash" route={`/meal-planner/smart-planner?patientId=${patientId}`} color={colors.accentAmber} />
      </View>
    </View>
  );
}

function TabBtn({ title, icon, route, color }: any) {
  const router = useRouter();
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity style={[styles.tabButton, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => router.push(route as any)}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.tabButtonText, { color: theme.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function ModuleButton({ title, icon, route, color, isWide, highlighted, onPress }: any) {
  const router = useRouter();
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      style={[
        isWide ? styles.moduleButtonWide : styles.moduleButton,
        highlighted && styles.moduleHighlighted,
        highlighted && { borderLeftColor: color, borderLeftWidth: 3 },
        { backgroundColor: theme.card, borderColor: theme.border }
      ]}
      onPress={() => onPress ? onPress() : router.push(route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.moduleButtonText, { color: theme.text }]} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: any) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.subtext }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function MetricDisplay({ label, value }: any) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: theme.subtext }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    position: 'absolute',
    top: safeHeaderPaddingTop + 4,
    start: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: 36,
    lineHeight: fontSizes.xl * 1.8,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
    opacity: 0.85,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: fontSizes.lg * 1.8,
  },
  filterChipScroll: {
    marginBottom: spacing.md,
  },
  filterChipContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Medium',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  prioritySection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  subSectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
    color: colors.danger,
    marginBottom: spacing.xs,
    lineHeight: fontSizes.md * 1.8,
  },
  twoColumnContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  column: { flex: 1, gap: spacing.sm },
  moduleButtonWide: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  moduleButton: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  moduleHighlighted: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  moduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.8,
    flexShrink: 1,
  },
  integratedInterventionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  integratedHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  integratedTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: fontSizes.lg * 1.8,
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
    lineHeight: fontSizes.sm * 1.8,
  },
  moreToolsToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  moreToolsToggleText: {
    color: colors.primary,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.8,
  },
  secondarySection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bottomSection: {
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    minWidth: 72,
    lineHeight: fontSizes.sm * 1.8,
  },
  infoValue: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    lineHeight: fontSizes.sm * 1.8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.8,
  },
  metricValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surfaceCard,
    color: colors.textPrimary,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
  },
  planTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.medium,
    color: colors.success,
    textAlign: 'right',
    lineHeight: fontSizes.md * 1.8,
  },
  noDataText: {
    textAlign: 'right',
    color: colors.textPrimary,
    marginVertical: spacing.md,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 15 * 1.8,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.8,
  },
  reportActionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentTeal + '40',
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  reportActionContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  reportActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportActionTextCol: {
    flex: 1,
    gap: 4,
  },
  reportActionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: fontSizes.lg * 1.8,
  },
  reportActionSub: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: fontSizes.xs * 1.8,
  },
  reportActionButton: {
    backgroundColor: colors.accentTeal,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportActionButtonText: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
  },
  insightCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  insightHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  insightTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * 1.8,
  },
  insightBmiRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  insightCategory: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    lineHeight: fontSizes.md * 1.8,
  },
  insightBmiValue: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.8,
  },
  insightRecommendation: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: fontSizes.sm * 1.8,
  },
  insightAlert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: '#f43f5e15',
    padding: spacing.sm,
    borderRadius: 8,
  },
  insightAlertText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    color: '#f43f5e',
    flex: 1,
    textAlign: 'right',
    lineHeight: fontSizes.sm * 1.8,
  },
  zScoreBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: spacing.sm,
    position: 'relative',
  },
  zScoreSegment: {
    flex: 1,
    height: '100%',
  },
  zScoreNeedle: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 16,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#F8FAFC',
    marginLeft: -6,
  },
  zScoreScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  zScoreScaleText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: fontFamilies.regular,
  },
  specializedContainer: {
    gap: spacing.md,
  },
  specializedCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  specializedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specializedTextCol: {
    flex: 1,
    gap: 2,
  },
  specializedTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    lineHeight: fontSizes.md * 1.5,
  },
  specializedSub: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
    lineHeight: fontSizes.xs * 1.5,
  },
});

export default withAuth(PatientDetailScreen);
