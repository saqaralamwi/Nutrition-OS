import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ArabicText from '../../../src/presentation/components/ArabicText';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { ICUAdmission, IcuType, SeverityLevel, AdmissionSource, OxygenTherapy, AppetiteLevel, EatingDifficulty, PreviousNutritionSupport } from '../../../src/domain/entities/ICUAdmission';
import { validateICUAdmission, ValidationErrors, calculateBMI, calculateWeightChangePercent } from '../../../src/domain/validation/icuAdmissionValidation';

type SectionKey = 'basic' | 'clinical' | 'vitals' | 'nutrition' | 'history' | 'medications' | 'labs' | 'screening' | 'notes' | 'consent';

const SECTIONS: { key: SectionKey; labelAr: string; labelEn: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'basic', labelAr: 'المعلومات الأساسية', labelEn: 'Basic Information', icon: 'person-outline' },
  { key: 'clinical', labelAr: 'الحالة السريرية', labelEn: 'Clinical Status', icon: 'medical-outline' },
  { key: 'vitals', labelAr: 'العلامات الحيوية', labelEn: 'Vital Signs', icon: 'pulse-outline' },
  { key: 'nutrition', labelAr: 'الحالة التغذوية', labelEn: 'Nutritional Status', icon: 'nutrition-outline' },
  { key: 'history', labelAr: 'التاريخ الطبي', labelEn: 'Medical History', icon: 'document-text-outline' },
  { key: 'medications', labelAr: 'الأدوية', labelEn: 'Medications', icon: 'medical-outline' },
  { key: 'labs', labelAr: 'التحاليل المخبرية', labelEn: 'Laboratory', icon: 'flask-outline' },
  { key: 'screening', labelAr: 'فحص التغذية', labelEn: 'Nutrition Screening', icon: 'checkbox-outline' },
  { key: 'notes', labelAr: 'الملاحظات', labelEn: 'Notes', icon: 'clipboard-outline' },
  { key: 'consent', labelAr: 'الموافقة', labelEn: 'Consent', icon: 'shield-checkmark-outline' },
];

function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: { value: T; labelAr: string; labelEn: string }[];
  value: T;
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <View style={fieldStyles.container}>
      <ArabicText style={fieldStyles.label}>{label}</ArabicText>
      <View style={fieldStyles.optionRow}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            style={[fieldStyles.optionChip, value === o.value && fieldStyles.optionChipActive]}
            onPress={() => onChange(o.value)}
          >
            <ArabicText style={[fieldStyles.optionChipText, value === o.value && fieldStyles.optionChipTextActive]}>
              {o.labelAr}
            </ArabicText>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <ArabicText style={fieldStyles.error}>{error}</ArabicText> : null}
    </View>
  );
}

function NumberField({ label, value, onChange, error, placeholder, suffix }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <View style={fieldStyles.container}>
      <ArabicText style={fieldStyles.label}>{label}</ArabicText>
      <View style={fieldStyles.inputRow}>
        <TextInput
          style={[fieldStyles.input, error ? fieldStyles.inputError : null]}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
        />
        {suffix ? <ArabicText style={fieldStyles.suffix}>{suffix}</ArabicText> : null}
      </View>
      {error ? <ArabicText style={fieldStyles.error}>{error}</ArabicText> : null}
    </View>
  );
}

function BoolToggle({ label, value, onChange }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={fieldStyles.boolRow} onPress={() => onChange(!value)}>
      <Ionicons name={value ? 'checkbox' : 'square-outline'} size={20} color={value ? colors.success : colors.textSecondary} />
      <ArabicText style={fieldStyles.boolLabel}>{label}</ArabicText>
    </TouchableOpacity>
  );
}

export default function ICUAdmissionScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);


  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    basic: false, clinical: false, vitals: false, nutrition: false, history: false,
    medications: false, labs: false, screening: false, notes: false, consent: false,
  });

  const [form, setForm] = useState({
    fullName: '', fullNameAr: '', age: '', gender: 'male' as 'male' | 'female',
    weightKg: '', heightCm: '', mrn: '', admissionDate: '', admissionSource: 'er' as AdmissionSource,
    icuType: 'medical' as IcuType, primaryDiagnosis: '', primaryDiagnosisAr: '',
    secondaryDiagnoses: '', secondaryDiagnosesAr: '', apacheIIScore: '', gcs: '',
    severityLevel: 'moderate' as SeverityLevel,
    heartRate: '', bpSystolic: '', bpDiastolic: '', respiratoryRate: '', temperature: '',
    o2Sat: '', oxygenTherapy: 'none' as OxygenTherapy, ventilatorType: '',
    preAdmissionWeightKg: '', appetiteBeforeAdmission: 'normal' as AppetiteLevel,
    eatingDifficulty: 'none' as EatingDifficulty, npoStatus: false, npoDuration: '',
    previousNutritionSupport: 'none' as PreviousNutritionSupport,
    hasDiabetes: false, diabetesType: '', hasCardiovascular: false, hasKidney: false,
    kidneyStage: '', hasLiver: false, hasLung: false, hasGI: false, hasCancer: false,
    cancerStage: '', allergies: '', allergiesAr: '', previousSurgeries: '', previousSurgeriesAr: '',
    medications: '', medicationsAr: '',
    hemoglobin: '', wbc: '', platelets: '', creatinine: '', bun: '', eGFR: '',
    sodium: '', potassium: '', chloride: '', glucose: '', hba1c: '',
    totalProtein: '', albumin: '', totalBilirubin: '', alt: '', ast: '', triglycerides: '', cholesterol: '',
    stampScore: '', malnutritionRisk: '' as string, nutritionConcern: false,
    admissionReason: '', admissionReasonAr: '', specialConcerns: '', specialConcernsAr: '',
    physicianNotes: '', physicianNotesAr: '', dietitianNotes: '', dietitianNotesAr: '',
    nutritionConsent: false, guardianConsent: false, signedBy: '', consentDate: '',
  });

  const bmi = calculateBMI(parseFloat(form.weightKg) || 0, parseFloat(form.heightCm) || 0);
  const preWeightNum = parseFloat(form.preAdmissionWeightKg) || 0;
  const curWeightNum = parseFloat(form.weightKg) || 0;
  const weightChangePct = calculateWeightChangePercent(preWeightNum || null, curWeightNum);
  const weightChangeKg = preWeightNum && curWeightNum ? Math.round((curWeightNum - preWeightNum) * 100) / 100 : null;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setForm((f) => ({ ...f, admissionDate: today }));
    setIsLoading(false);
  }, []);

  const toggleSection = (key: SectionKey) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const set = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const handleSave = useCallback(async () => {
    const data = {
      fullName: form.fullName, fullNameAr: form.fullNameAr, age: parseInt(form.age) || 0,
      gender: form.gender, weightKg: parseFloat(form.weightKg) || 0, heightCm: parseFloat(form.heightCm) || 0,
      bmi, mrn: form.mrn, admissionDate: form.admissionDate || new Date().toISOString(),
      admissionSource: form.admissionSource, icuType: form.icuType,
      primaryDiagnosis: form.primaryDiagnosis, primaryDiagnosisAr: form.primaryDiagnosisAr,
      severityLevel: form.severityLevel, oxygenTherapy: form.oxygenTherapy,
      appetiteBeforeAdmission: form.appetiteBeforeAdmission, eatingDifficulty: form.eatingDifficulty,
      npoStatus: form.npoStatus, previousNutritionSupport: form.previousNutritionSupport,
      nutritionConcern: form.nutritionConcern, admissionReason: form.admissionReason,
      admissionReasonAr: form.admissionReasonAr, nutritionConsent: form.nutritionConsent,
    } as Partial<ICUAdmission>;
    const validationErrors = validateICUAdmission(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('يرجى تصحيح الأخطاء أولاً', 'error');
      return;
    }
    try {
      setIsSaving(true);
      const { ICUAdmissionRepository } = await import('../../../src/data/repositories/ICUAdmissionRepository');
      const repo = new ICUAdmissionRepository();
      await repo.create({
        patientId,
        fullName: form.fullName,
        fullNameAr: form.fullNameAr,
        age: parseInt(form.age) || 0,
        gender: form.gender,
        weightKg: parseFloat(form.weightKg) || 0,
        heightCm: parseFloat(form.heightCm) || 0,
        bmi,
        mrn: form.mrn,
        admissionDate: form.admissionDate || new Date().toISOString(),
        admissionSource: form.admissionSource,
        icuType: form.icuType,
        primaryDiagnosis: form.primaryDiagnosis,
        primaryDiagnosisAr: form.primaryDiagnosisAr,
        secondaryDiagnoses: form.secondaryDiagnoses || undefined,
        secondaryDiagnosesAr: form.secondaryDiagnosesAr || undefined,
        apacheIIScore: parseInt(form.apacheIIScore) || undefined,
        gcs: parseInt(form.gcs) || undefined,
        severityLevel: form.severityLevel,
        heartRate: parseInt(form.heartRate) || undefined,
        bpSystolic: parseInt(form.bpSystolic) || undefined,
        bpDiastolic: parseInt(form.bpDiastolic) || undefined,
        respiratoryRate: parseInt(form.respiratoryRate) || undefined,
        temperature: parseFloat(form.temperature) || undefined,
        o2Sat: parseInt(form.o2Sat) || undefined,
        oxygenTherapy: form.oxygenTherapy,
        ventilatorType: form.ventilatorType || undefined,
        preAdmissionWeightKg: parseFloat(form.preAdmissionWeightKg) || undefined,
        weightChangeKg: weightChangeKg ?? undefined,
        weightChangePercent: weightChangePct ?? undefined,
        appetiteBeforeAdmission: form.appetiteBeforeAdmission,
        eatingDifficulty: form.eatingDifficulty,
        npoStatus: form.npoStatus,
        npoDuration: form.npoDuration || undefined,
        previousNutritionSupport: form.previousNutritionSupport,
        hasDiabetes: form.hasDiabetes,
        diabetesType: form.diabetesType || undefined,
        hasCardiovascular: form.hasCardiovascular,
        hasKidney: form.hasKidney,
        kidneyStage: form.kidneyStage || undefined,
        hasLiver: form.hasLiver,
        hasLung: form.hasLung,
        hasGI: form.hasGI,
        hasCancer: form.hasCancer,
        cancerStage: form.cancerStage || undefined,
        allergies: form.allergies || undefined,
        allergiesAr: form.allergiesAr || undefined,
        previousSurgeries: form.previousSurgeries || undefined,
        previousSurgeriesAr: form.previousSurgeriesAr || undefined,
        medications: form.medications || undefined,
        medicationsAr: form.medicationsAr || undefined,
        hemoglobin: parseFloat(form.hemoglobin) || undefined,
        wbc: parseFloat(form.wbc) || undefined,
        platelets: parseFloat(form.platelets) || undefined,
        creatinine: parseFloat(form.creatinine) || undefined,
        bun: parseFloat(form.bun) || undefined,
        eGFR: parseInt(form.eGFR) || undefined,
        sodium: parseInt(form.sodium) || undefined,
        potassium: parseFloat(form.potassium) || undefined,
        chloride: parseInt(form.chloride) || undefined,
        glucose: parseInt(form.glucose) || undefined,
        hba1c: parseFloat(form.hba1c) || undefined,
        totalProtein: parseFloat(form.totalProtein) || undefined,
        albumin: parseFloat(form.albumin) || undefined,
        totalBilirubin: parseFloat(form.totalBilirubin) || undefined,
        alt: parseInt(form.alt) || undefined,
        ast: parseInt(form.ast) || undefined,
        triglycerides: parseInt(form.triglycerides) || undefined,
        cholesterol: parseInt(form.cholesterol) || undefined,
        stampScore: parseInt(form.stampScore) || undefined,
        malnutritionRisk: form.malnutritionRisk || undefined,
        nutritionConcern: form.nutritionConcern,
        admissionReason: form.admissionReason,
        admissionReasonAr: form.admissionReasonAr,
        specialConcerns: form.specialConcerns || undefined,
        specialConcernsAr: form.specialConcernsAr || undefined,
        physicianNotes: form.physicianNotes || undefined,
        physicianNotesAr: form.physicianNotesAr || undefined,
        dietitianNotes: form.dietitianNotes || undefined,
        dietitianNotesAr: form.dietitianNotesAr || undefined,
        nutritionConsent: form.nutritionConsent,
        guardianConsent: form.guardianConsent || undefined,
        signedBy: form.signedBy || undefined,
        consentDate: form.consentDate || undefined,
        createdBy: 'current_user',
        isTransferredToICU: false,
      });
      showToast('تم حفظ قبول ICU بنجاح', 'success');
      router.back();
    } catch (err) {
      console.error('Save ICU admission error:', err);
      showToast('فشل في الحفظ', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form, bmi, weightChangeKg, weightChangePct, patientId, showToast, router]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.success} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ArabicText bold style={styles.headerTitle}>قبول العناية المركزة (ICU)</ArabicText>
            <ArabicText style={styles.headerSubtitle}>10 أقسام — جمع بيانات الدخول</ArabicText>
          </View>
        </View>

        {/* BMI Summary */}
        <View style={styles.bmiSummary}>
          <View style={styles.bmiItem}>
            <ArabicText style={styles.bmiLabel}>BMI</ArabicText>
            <ArabicText bold style={styles.bmiValue}>{bmi || '—'}</ArabicText>
          </View>
          {weightChangeKg !== null && (
            <View style={styles.bmiItem}>
              <ArabicText style={styles.bmiLabel}>تغير الوزن</ArabicText>
              <ArabicText bold style={[styles.bmiValue, { color: weightChangeKg < 0 ? colors.danger : colors.success }]}>
                {weightChangeKg > 0 ? '+' : ''}{weightChangeKg} كغم
              </ArabicText>
            </View>
          )}
          <View style={styles.bmiItem}>
            <ArabicText style={styles.bmiLabel}>النسبة</ArabicText>
            <ArabicText bold style={styles.bmiValue}>{weightChangePct !== null ? `${weightChangePct}%` : '—'}</ArabicText>
          </View>
        </View>

        {/* Sections */}
        {SECTIONS.map((sec) => (
          <View key={sec.key} style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sec.key)}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Ionicons name={sec.icon} size={20} color={colors.success} />
                <ArabicText bold style={styles.sectionTitle}>{sec.labelAr}</ArabicText>
                <ArabicText style={styles.sectionSubtitle}>{sec.labelEn}</ArabicText>
              </View>
              <Ionicons name={collapsed[sec.key] ? 'chevron-down' : 'chevron-up'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {!collapsed[sec.key] && (
              <View style={styles.sectionBody}>
                {sec.key === 'basic' && (
                  <>
                    <NumberField label="الوزن (كغم)" value={form.weightKg} onChange={(v) => set('weightKg', v)} error={errors.weightKg} placeholder="مثال: 70" />
                    <NumberField label="الطول (سم)" value={form.heightCm} onChange={(v) => set('heightCm', v)} error={errors.heightCm} placeholder="مثال: 170" />
                    <TextInput style={styles.textInput} value={form.fullName} onChangeText={(v) => set('fullName', v)} placeholder="الاسم الكامل (English)" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    {errors.fullName ? <ArabicText style={fieldStyles.error}>{errors.fullName}</ArabicText> : null}
                    <TextInput style={styles.textInput} value={form.fullNameAr} onChangeText={(v) => set('fullNameAr', v)} placeholder="الاسم الكامل (بالعربية)" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    {errors.fullNameAr ? <ArabicText style={fieldStyles.error}>{errors.fullNameAr}</ArabicText> : null}
                    <NumberField label="العمر" value={form.age} onChange={(v) => set('age', v)} error={errors.age} placeholder="سنوات" />
                    <OptionPicker label="الجنس" value={form.gender} onChange={(v) => set('gender', v)} options={[{ value: 'male', labelAr: 'ذكر', labelEn: 'Male' }, { value: 'female', labelAr: 'أنثى', labelEn: 'Female' }]} />
                    <TextInput style={styles.textInput} value={form.mrn} onChangeText={(v) => set('mrn', v)} placeholder="رقم الملف الطبي (MRN)" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    {errors.mrn ? <ArabicText style={fieldStyles.error}>{errors.mrn}</ArabicText> : null}
                    <NumberField label="تاريخ الدخول" value={form.admissionDate} onChange={(v) => set('admissionDate', v)} placeholder="YYYY-MM-DD" />
                    <OptionPicker label="مصدر الدخول" value={form.admissionSource} onChange={(v) => set('admissionSource', v)} options={[
                      { value: 'er', labelAr: 'طوارئ', labelEn: 'ER' }, { value: 'ward', labelAr: 'قسم', labelEn: 'Ward' },
                      { value: 'transfer', labelAr: 'تحويل', labelEn: 'Transfer' }, { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
                    ]} />
                  </>
                )}
                {sec.key === 'clinical' && (
                  <>
                    <OptionPicker label="نوع ICU" value={form.icuType} onChange={(v) => set('icuType', v)} error={errors.icuType} options={[
                      { value: 'medical', labelAr: 'طب', labelEn: 'Medical' }, { value: 'surgical', labelAr: 'جراحة', labelEn: 'Surgical' },
                      { value: 'cardiac', labelAr: 'قلب', labelEn: 'Cardiac' }, { value: 'neuro', labelAr: 'أعصاب', labelEn: 'Neuro' },
                      { value: 'pediatric', labelAr: 'أطفال', labelEn: 'Pediatric' }, { value: 'neonatal', labelAr: 'حديثي الولادة', labelEn: 'Neonatal' },
                    ]} />
                    <TextInput style={styles.textInput} value={form.primaryDiagnosis} onChangeText={(v) => set('primaryDiagnosis', v)} placeholder="التشخيص الرئيسي (English)" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    {errors.primaryDiagnosis ? <ArabicText style={fieldStyles.error}>{errors.primaryDiagnosis}</ArabicText> : null}
                    <TextInput style={styles.textInput} value={form.primaryDiagnosisAr} onChangeText={(v) => set('primaryDiagnosisAr', v)} placeholder="التشخيص الرئيسي (بالعربية)" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    {errors.primaryDiagnosisAr ? <ArabicText style={fieldStyles.error}>{errors.primaryDiagnosisAr}</ArabicText> : null}
                    <TextInput style={styles.textInput} value={form.secondaryDiagnoses} onChangeText={(v) => set('secondaryDiagnoses', v)} placeholder="تشخيصات ثانوية (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={styles.textInput} value={form.secondaryDiagnosesAr} onChangeText={(v) => set('secondaryDiagnosesAr', v)} placeholder="تشخيصات ثانوية (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <NumberField label="APACHE II Score" value={form.apacheIIScore} onChange={(v) => set('apacheIIScore', v)} placeholder="0-71" />
                    <NumberField label="GCS (Glasgow Coma Scale)" value={form.gcs} onChange={(v) => set('gcs', v)} error={errors.gcs} placeholder="3-15" />
                    <OptionPicker label="مستوى الشدة" value={form.severityLevel} onChange={(v) => set('severityLevel', v)} error={errors.severityLevel} options={[
                      { value: 'mild', labelAr: 'خفيف', labelEn: 'Mild' }, { value: 'moderate', labelAr: 'متوسط', labelEn: 'Moderate' },
                      { value: 'severe', labelAr: 'شديد', labelEn: 'Severe' }, { value: 'critical', labelAr: 'خطير', labelEn: 'Critical' },
                    ]} />
                  </>
                )}
                {sec.key === 'vitals' && (
                  <>
                    <NumberField label="معدل القلب (HR)" value={form.heartRate} onChange={(v) => set('heartRate', v)} error={errors.heartRate} placeholder="bpm" suffix="نبضة/دقيقة" />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="BP انقباضي" value={form.bpSystolic} onChange={(v) => set('bpSystolic', v)} placeholder="مث: 120" suffix="مم زئبق" /></View>
                      <View style={{ flex: 1 }}><NumberField label="BP انبساطي" value={form.bpDiastolic} onChange={(v) => set('bpDiastolic', v)} placeholder="مث: 80" suffix="مم زئبق" /></View>
                    </View>
                    <NumberField label="معدل التنفس (RR)" value={form.respiratoryRate} onChange={(v) => set('respiratoryRate', v)} placeholder="/min" suffix="نفس/دقيقة" />
                    <NumberField label="درجة الحرارة" value={form.temperature} onChange={(v) => set('temperature', v)} error={errors.temperature} placeholder="مث: 37.0" suffix="°م" />
                    <NumberField label="تشبع الأكسجين (SpO2)" value={form.o2Sat} onChange={(v) => set('o2Sat', v)} error={errors.o2Sat} placeholder="%" suffix="%" />
                    <OptionPicker label="العلاج بالأكسجين" value={form.oxygenTherapy} onChange={(v) => set('oxygenTherapy', v)} options={[
                      { value: 'none', labelAr: 'لا يوجد', labelEn: 'None' }, { value: 'nasal_cannula', labelAr: 'قنية أنفية', labelEn: 'Nasal Cannula' },
                      { value: 'mask', labelAr: 'قناع', labelEn: 'Mask' }, { value: 'ventimeter', labelAr: 'Ventimeter', labelEn: 'Ventimeter' },
                      { value: 'mechanical', labelAr: 'تنفس اصطناعي', labelEn: 'Mechanical' },
                    ]} />
                    {form.oxygenTherapy === 'mechanical' && (
                      <TextInput style={styles.textInput} value={form.ventilatorType} onChangeText={(v) => set('ventilatorType', v)} placeholder="نوع جهاز التنفس" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    )}
                  </>
                )}
                {sec.key === 'nutrition' && (
                  <>
                    <NumberField label="الوزن قبل الدخول" value={form.preAdmissionWeightKg} onChange={(v) => set('preAdmissionWeightKg', v)} placeholder="كغم" suffix="كغم" />
                    <OptionPicker label="الشهية قبل الدخول" value={form.appetiteBeforeAdmission} onChange={(v) => set('appetiteBeforeAdmission', v)} options={[
                      { value: 'normal', labelAr: 'طبيعية', labelEn: 'Normal' }, { value: 'decreased', labelAr: 'مخفّضة', labelEn: 'Decreased' },
                      { value: 'poor', labelAr: 'سيئة', labelEn: 'Poor' }, { value: 'none', labelAr: 'معدومة', labelEn: 'None' },
                    ]} />
                    <OptionPicker label="صعوبة الأكل" value={form.eatingDifficulty} onChange={(v) => set('eatingDifficulty', v)} options={[
                      { value: 'none', labelAr: 'لا يوجد', labelEn: 'None' }, { value: 'dysphagia', labelAr: 'عسر بلع', labelEn: 'Dysphagia' },
                      { value: 'chewing', labelAr: 'مضغ', labelEn: 'Chewing' }, { value: 'swallowing', labelAr: 'بلع', labelEn: 'Swallowing' },
                    ]} />
                    <BoolToggle label="NPO (لا شيء بالفم)" value={form.npoStatus} onChange={(v) => set('npoStatus', v)} />
                    {form.npoStatus && (
                      <TextInput style={styles.textInput} value={form.npoDuration} onChangeText={(v) => set('npoDuration', v)} placeholder="مدة NPO (مثال: 3 أيام)" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    )}
                    <OptionPicker label="الدعم التغذوي السابق" value={form.previousNutritionSupport} onChange={(v) => set('previousNutritionSupport', v)} options={[
                      { value: 'none', labelAr: 'لا يوجد', labelEn: 'None' }, { value: 'oral_supplements', labelAr: 'مكملات فموية', labelEn: 'Oral Supplements' },
                      { value: 'enteral', labelAr: 'تغذية أنبوبية', labelEn: 'Enteral' }, { value: 'parenteral', labelAr: 'تغذية وريدية', labelEn: 'Parenteral' },
                    ]} />
                  </>
                )}
                {sec.key === 'history' && (
                  <>
                    <BoolToggle label="السكري (Diabetes)" value={form.hasDiabetes} onChange={(v) => set('hasDiabetes', v)} />
                    {form.hasDiabetes && <TextInput style={styles.textInput} value={form.diabetesType} onChangeText={(v) => set('diabetesType', v)} placeholder="نوع السكري" placeholderTextColor={colors.textDisabled} textAlign="right" />}
                    <BoolToggle label="أمراض القلب (Cardiovascular)" value={form.hasCardiovascular} onChange={(v) => set('hasCardiovascular', v)} />
                    <BoolToggle label="أمراض الكلى (Kidney)" value={form.hasKidney} onChange={(v) => set('hasKidney', v)} />
                    {form.hasKidney && <TextInput style={styles.textInput} value={form.kidneyStage} onChangeText={(v) => set('kidneyStage', v)} placeholder="مرحلة الكلى" placeholderTextColor={colors.textDisabled} textAlign="right" />}
                    <BoolToggle label="أمراض الكبد (Liver)" value={form.hasLiver} onChange={(v) => set('hasLiver', v)} />
                    <BoolToggle label="أمراض الرئة (Lung)" value={form.hasLung} onChange={(v) => set('hasLung', v)} />
                    <BoolToggle label="أمراض الجهاز الهضمي (GI)" value={form.hasGI} onChange={(v) => set('hasGI', v)} />
                    <BoolToggle label="السرطان (Cancer)" value={form.hasCancer} onChange={(v) => set('hasCancer', v)} />
                    {form.hasCancer && <TextInput style={styles.textInput} value={form.cancerStage} onChangeText={(v) => set('cancerStage', v)} placeholder="مرحلة السرطان" placeholderTextColor={colors.textDisabled} textAlign="right" />}
                    <TextInput style={styles.textInput} value={form.allergies} onChangeText={(v) => set('allergies', v)} placeholder="الحساسية (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={styles.textInput} value={form.allergiesAr} onChangeText={(v) => set('allergiesAr', v)} placeholder="الحساسية (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={styles.textInput} value={form.previousSurgeries} onChangeText={(v) => set('previousSurgeries', v)} placeholder="العمليات السابقة (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={styles.textInput} value={form.previousSurgeriesAr} onChangeText={(v) => set('previousSurgeriesAr', v)} placeholder="العمليات السابقة (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                  </>
                )}
                {sec.key === 'medications' && (
                  <>
                    <TextInput style={[styles.textInput, { minHeight: 80 }]} value={form.medications} onChangeText={(v) => set('medications', v)} placeholder="الأدوية الحالية (EN) - اسم، جرعة، تكرار" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={[styles.textInput, { minHeight: 80 }]} value={form.medicationsAr} onChangeText={(v) => set('medicationsAr', v)} placeholder="الأدوية الحالية (AR) - اسم، جرعة، تكرار" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                  </>
                )}
                {sec.key === 'labs' && (
                  <>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="Hb" value={form.hemoglobin} onChange={(v) => set('hemoglobin', v)} placeholder="g/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="WBC" value={form.wbc} onChange={(v) => set('wbc', v)} placeholder="×10³/µL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="Plt" value={form.platelets} onChange={(v) => set('platelets', v)} placeholder="×10³/µL" /></View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="Cr" value={form.creatinine} onChange={(v) => set('creatinine', v)} placeholder="mg/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="BUN" value={form.bun} onChange={(v) => set('bun', v)} placeholder="mg/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="eGFR" value={form.eGFR} onChange={(v) => set('eGFR', v)} placeholder="mL/min" /></View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="Na" value={form.sodium} onChange={(v) => set('sodium', v)} placeholder="mEq/L" /></View>
                      <View style={{ flex: 1 }}><NumberField label="K" value={form.potassium} onChange={(v) => set('potassium', v)} placeholder="mEq/L" /></View>
                      <View style={{ flex: 1 }}><NumberField label="Cl" value={form.chloride} onChange={(v) => set('chloride', v)} placeholder="mEq/L" /></View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="Glucose" value={form.glucose} onChange={(v) => set('glucose', v)} placeholder="mg/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="HbA1c" value={form.hba1c} onChange={(v) => set('hba1c', v)} placeholder="%" /></View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="Total Protein" value={form.totalProtein} onChange={(v) => set('totalProtein', v)} placeholder="g/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="Albumin" value={form.albumin} onChange={(v) => set('albumin', v)} placeholder="g/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="T. Bilirubin" value={form.totalBilirubin} onChange={(v) => set('totalBilirubin', v)} placeholder="mg/dL" /></View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="ALT" value={form.alt} onChange={(v) => set('alt', v)} placeholder="U/L" /></View>
                      <View style={{ flex: 1 }}><NumberField label="AST" value={form.ast} onChange={(v) => set('ast', v)} placeholder="U/L" /></View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><NumberField label="Triglycerides" value={form.triglycerides} onChange={(v) => set('triglycerides', v)} placeholder="mg/dL" /></View>
                      <View style={{ flex: 1 }}><NumberField label="Cholesterol" value={form.cholesterol} onChange={(v) => set('cholesterol', v)} placeholder="mg/dL" /></View>
                    </View>
                  </>
                )}
                {sec.key === 'screening' && (
                  <>
                    <NumberField label="STAMP Score" value={form.stampScore} onChange={(v) => set('stampScore', v)} placeholder="0-6" />
                    <OptionPicker label="خطر سوء التغذية" value={form.malnutritionRisk as any || 'low'} onChange={(v) => set('malnutritionRisk', v)} options={[
                      { value: 'low', labelAr: 'منخفض', labelEn: 'Low' }, { value: 'medium', labelAr: 'متوسط', labelEn: 'Medium' },
                      { value: 'high', labelAr: 'مرتفع', labelEn: 'High' },
                    ]} />
                    <BoolToggle label="قلق تغذوي (Nutrition Concern)" value={form.nutritionConcern} onChange={(v) => set('nutritionConcern', v)} />
                  </>
                )}
                {sec.key === 'notes' && (
                  <>
                    <TextInput style={[styles.textInput, { minHeight: 80 }]} value={form.admissionReason} onChangeText={(v) => set('admissionReason', v)} placeholder="سبب الدخول (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    {errors.admissionReason ? <ArabicText style={fieldStyles.error}>{errors.admissionReason}</ArabicText> : null}
                    <TextInput style={[styles.textInput, { minHeight: 80 }]} value={form.admissionReasonAr} onChangeText={(v) => set('admissionReasonAr', v)} placeholder="سبب الدخول (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    {errors.admissionReasonAr ? <ArabicText style={fieldStyles.error}>{errors.admissionReasonAr}</ArabicText> : null}
                    <TextInput style={[styles.textInput, { minHeight: 60 }]} value={form.specialConcerns} onChangeText={(v) => set('specialConcerns', v)} placeholder="مخاوف خاصة (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={[styles.textInput, { minHeight: 60 }]} value={form.specialConcernsAr} onChangeText={(v) => set('specialConcernsAr', v)} placeholder="مخاوف خاصة (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={[styles.textInput, { minHeight: 60 }]} value={form.physicianNotes} onChangeText={(v) => set('physicianNotes', v)} placeholder="ملاحظات الطبيب (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={[styles.textInput, { minHeight: 60 }]} value={form.physicianNotesAr} onChangeText={(v) => set('physicianNotesAr', v)} placeholder="ملاحظات الطبيب (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={[styles.textInput, { minHeight: 60 }]} value={form.dietitianNotes} onChangeText={(v) => set('dietitianNotes', v)} placeholder="ملاحظات أخصائي التغذية (EN)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                    <TextInput style={[styles.textInput, { minHeight: 60 }]} value={form.dietitianNotesAr} onChangeText={(v) => set('dietitianNotesAr', v)} placeholder="ملاحظات أخصائي التغذية (AR)" placeholderTextColor={colors.textDisabled} textAlign="right" multiline />
                  </>
                )}
                {sec.key === 'consent' && (
                  <>
                    <BoolToggle label="موافقة التغذية (Nutrition Consent)" value={form.nutritionConsent} onChange={(v) => set('nutritionConsent', v)} />
                    <BoolToggle label="موافقة ولي الأمر (Guardian Consent)" value={form.guardianConsent} onChange={(v) => set('guardianConsent', v)} />
                    <TextInput style={styles.textInput} value={form.signedBy} onChangeText={(v) => set('signedBy', v)} placeholder="التوقيع بواسطة" placeholderTextColor={colors.textDisabled} textAlign="right" />
                    <NumberField label="تاريخ الموافقة" value={form.consentDate} onChange={(v) => set('consentDate', v)} placeholder="YYYY-MM-DD" />
                  </>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primaryContrast} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.primaryContrast} />
              <ArabicText bold style={styles.saveBtnText}>💾 حفظ قبول ICU</ArabicText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, color: colors.textPrimary, fontSize: 14, textAlign: 'right' },
  inputError: { borderColor: colors.danger },
  suffix: { fontSize: 12, color: colors.textSecondary },
  error: { fontSize: 11, color: colors.danger, textAlign: 'right', marginTop: 2 },
  optionRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  optionChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionChipActive: { borderColor: colors.success, backgroundColor: '#064E3B' },
  optionChipText: { fontSize: 12, color: colors.textSecondary },
  optionChipTextActive: { color: colors.success },
  boolRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  boolLabel: { fontSize: 14, color: colors.textPrimary, flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: colors.primary, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.md, paddingHorizontal: spacing.md, gap: spacing.sm },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, color: colors.primaryContrast, textAlign: 'right' },
  headerSubtitle: { fontSize: 12, color: colors.primaryContrast + 'AA', textAlign: 'right' },
  bmiSummary: { flexDirection: 'row', backgroundColor: colors.surface, margin: spacing.md, borderRadius: 10, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  bmiItem: { flex: 1, alignItems: 'center' },
  bmiLabel: { fontSize: 11, color: colors.textSecondary },
  bmiValue: { fontSize: 18, color: colors.textPrimary, marginTop: 2 },
  section: { marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  sectionTitle: { fontSize: 14, color: colors.textPrimary },
  sectionSubtitle: { fontSize: 11, color: colors.textDisabled },
  sectionBody: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  textInput: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, color: colors.textPrimary, fontSize: 14, textAlign: 'right', marginBottom: spacing.sm, minHeight: 44 },
  saveBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xl, padding: spacing.md, borderRadius: 10, gap: spacing.sm, minHeight: 52 },
  saveBtnText: { color: colors.primaryContrast, fontSize: 16 },
});
