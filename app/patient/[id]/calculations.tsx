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
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import SegmentedControl from '../../../src/presentation/components/SegmentedControl';
import Button from '../../../src/presentation/components/Button';
import DropdownField from '../../../src/presentation/components/DropdownField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { Patient } from '../../../src/domain/entities/Patient';
import { ACTIVITY_LEVELS } from '../../../src/domain/entities/NutritionPlan';
import { CalculationResult } from '../../../src/domain/entities/Calculation';
import { getDatabase } from '../../../src/data/database';
import {
  calculateHarrisBenedictBMR,
  calculateMifflinStJeorBMR,
  calculateVentilatedREE,
  KAU_ILLNESS_MATRIX,
  calculateHollidaySegarFluid,
  calculateGUR,
} from '../../../src/domain/utils/kauRequirementsEngine';

const ACTIVITY_SEGMENTS = Object.entries(ACTIVITY_LEVELS).map(([key, val]) => ({
  label: val.label,
  value: key,
}));

const CALCULATION_TYPE_LABELS: Record<string, string> = {
  bmi: 'مؤشر كتلة الجسم (BMI)',
  bmr_mifflin: 'معدل الأيض الأساسي (Mifflin)',
  bmr_harris: 'معدل الأيض الأساسي (Harris-Benedict)',
  total_energy: 'الطاقة الكلية (TEE)',
  fluid: 'احتياج السوائل',
};

const ILLNESS_OPTIONS = Object.entries(KAU_ILLNESS_MATRIX).map(([key, val]) => ({
  label: val.nameAr,
  value: key,
}));

const overrideSchema = z.object({
  value: z.string().refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n > 0;
  }, { message: 'يجب إدخال رقم صحيح أكبر من صفر' }),
  reason: z.string().min(1, 'سبب التجاوز مطلوب'),
});

export default function CalculationsScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);

  // Core Inputs
  const [weightKg, setWeightKg] = useState('70');
  const [heightCm, setHeightCm] = useState('170');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [stressFactor, setStressFactor] = useState('1.0');

  // KAU Mechanically Ventilated inputs
  const [mechanicallyVentilated, setMechanicallyVentilated] = useState(false);
  const [trauma, setTrauma] = useState(false);
  const [burn, setBurn] = useState(false);
  const [ve, setVe] = useState('8.0'); // L/min
  const [tmax, setTmax] = useState('37.0'); // °C

  // Fever adjustment inputs
  const [fever, setFever] = useState(false);
  const [currentTemp, setCurrentTemp] = useState('37.0');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Illness specific multipliers selector
  const [selectedIllness, setSelectedIllness] = useState('');

  // Enteral nutrition inputs
  const [enteralVolume, setEnteralVolume] = useState('');
  const [enteralHours, setEnteralHours] = useState('24');

  // Parenteral nutrition inputs
  const [pnVolume, setPnVolume] = useState('');
  const [pnDextrosePercent, setPnDextrosePercent] = useState('');

  // Database results
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);

  // Override logic states
  const [showOverride, setShowOverride] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<CalculationResult | null>(null);
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  useEffect(() => {
    loadData();
  }, [patientId]);

  async function loadData() {
    try {
      setIsLoading(true);
      const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
      const patientUC = new GetPatientUseCase();
      const p = await patientUC.execute(patientId);
      setPatient(p);

      const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
      const repo = new CalculationRepository();
      const existing = await repo.getByPatientId(patientId);
      if (existing.length > 0) {
        setCalculations(existing);
        const first = existing[0];
        if (first.inputValues?.weightKg) setWeightKg(String(first.inputValues.weightKg));
        if (first.inputValues?.heightCm) setHeightCm(String(first.inputValues.heightCm));
        if (first.inputValues?.activityLevel) setActivityLevel(first.inputValues.activityLevel);
        if (first.inputValues?.stressFactor) setStressFactor(String(first.inputValues.stressFactor));
      }
    } catch (error) {
      console.error('Error loading calculations data:', error);
      showToast('فشل تحميل البيانات السريرية', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Parse Numeric Inputs
  const w = parseFloat(weightKg) || 0;
  const h = parseFloat(heightCm) || 0;
  const age = patient?.age || 30;
  const isMale = patient?.gender === 'male';

  // Calculations
  const bmi = useMemo(() => {
    if (w <= 0 || h <= 0) return 0;
    return w / Math.pow(h / 100, 2);
  }, [w, h]);

  const mifflinBMR = useMemo(() => {
    if (w <= 0 || h <= 0) return 0;
    return calculateMifflinStJeorBMR(w, h, age, isMale);
  }, [w, h, age, isMale]);

  const harrisBMR = useMemo(() => {
    if (w <= 0 || h <= 0) return 0;
    return calculateHarrisBenedictBMR(w, h, age, isMale);
  }, [w, h, age, isMale]);

  const ventilatedREE = useMemo(() => {
    if (w <= 0 || h <= 0) return null;
    return calculateVentilatedREE({
      weightKg: w,
      heightCm: h,
      age,
      isMale,
      mechanicallyVentilated,
      trauma,
      burn,
      ve: parseFloat(ve) || 0,
      tmax: parseFloat(tmax) || 37.0,
    });
  }, [w, h, age, isMale, mechanicallyVentilated, trauma, burn, ve, tmax]);

  const feverFactor = useMemo(() => {
    if (!fever) return 1.0;
    const temp = parseFloat(currentTemp) || 0;
    if (tempUnit === 'C') {
      const diff = temp - 37.0;
      return diff > 0 ? 1.0 + (diff * 0.13) : 1.0;
    } else {
      const diff = temp - 98.6;
      return diff > 0 ? 1.0 + (diff * 0.07) : 1.0;
    }
  }, [fever, currentTemp, tempUnit]);

  // Activity stress factors
  const activityMultipliers: Record<string, number> = {
    comatose: 1.1,
    sedentary: 1.2, // Confined to bed
    active: 1.3, // Out of bed
    very_active: 1.5, // Normal activities
  };

  const activityFactor = activityMultipliers[activityLevel] || 1.2;
  const injuryFactor = parseFloat(stressFactor) || 1.0;

  const calculatedTEE = useMemo(() => {
    const baseREE = ventilatedREE ? ventilatedREE.value : mifflinBMR;
    return baseREE * activityFactor * injuryFactor * feverFactor;
  }, [mifflinBMR, ventilatedREE, activityFactor, injuryFactor, feverFactor]);

  // Illness specific ranges
  const illnessDetails = useMemo(() => {
    if (!selectedIllness || !KAU_ILLNESS_MATRIX[selectedIllness] || w <= 0) return null;
    const rule = KAU_ILLNESS_MATRIX[selectedIllness];
    let multiplierKcalMin = rule.minKcal;
    let multiplierKcalMax = rule.maxKcal;
    let multiplierProteinMin = rule.minProtein;
    let multiplierProteinMax = rule.maxProtein;

    // Special case for pregnancy: add absolute +25g protein
    const baseProteinMin = multiplierProteinMin * w;
    const baseProteinMax = multiplierProteinMax * w;
    const finalProteinMin = selectedIllness === 'pregnancy' ? baseProteinMin + 25 : baseProteinMin;
    const finalProteinMax = selectedIllness === 'pregnancy' ? baseProteinMax + 25 : baseProteinMax;

    return {
      rule,
      targetKcalMin: multiplierKcalMin * w,
      targetKcalMax: multiplierKcalMax * w,
      targetProteinMin: finalProteinMin,
      targetProteinMax: finalProteinMax,
    };
  }, [selectedIllness, w]);

  // Fluids
  const fluidHollidaySegar = useMemo(() => {
    if (w <= 0) return 0;
    return calculateHollidaySegarFluid(w);
  }, [w]);

  // Alternative RDA shortcut: 1ml fluid / kcal of needs
  const fluidRda = useMemo(() => {
    return calculatedTEE;
  }, [calculatedTEE]);

  // Enteral rate
  const enteralFeedingRate = useMemo(() => {
    const vol = parseFloat(enteralVolume) || 0;
    const hrs = parseFloat(enteralHours) || 0;
    if (vol <= 0 || hrs <= 0) return 0;
    return vol / hrs;
  }, [enteralVolume, enteralHours]);

  // PN GUR
  const gurResult = useMemo(() => {
    const vol = parseFloat(pnVolume) || 0;
    const dexPercent = parseFloat(pnDextrosePercent) || 0;
    if (vol <= 0 || dexPercent <= 0 || w <= 0) return null;
    const gur = calculateGUR(vol, dexPercent, w);
    const isSafe = gur >= 4.0 && gur <= 6.0;
    return {
      gur,
      isSafe,
    };
  }, [pnVolume, pnDextrosePercent, w]);

  const handleCalculate = useCallback(async () => {
    if (w <= 0 || h <= 0) {
      showToast('يرجى إدخال وزن وطول صحيحين لإجراء الحسابات السريرية', 'error');
      return;
    }

    try {
      const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
      const repo = new CalculationRepository();

      const results: CalculationResult[] = [
        {
          patientId,
          calculationType: 'bmi',
          formulaName: 'BMI',
          inputValues: { weightKg: w, heightCm: h },
          resultValue: bmi,
          steps: [
            { label: 'الوزن', value: `${w} كجم` },
            { label: 'الطول', value: `${h} سم` },
            { label: 'النتيجة', value: bmi.toFixed(2) },
          ],
        },
        {
          patientId,
          calculationType: 'bmr_mifflin',
          formulaName: 'Mifflin-St Jeor',
          inputValues: { weightKg: w, heightCm: h, age, isMale },
          resultValue: mifflinBMR,
          steps: [
            { label: 'النتيجة', value: `${mifflinBMR.toFixed(0)} سعرة/يوم` },
          ],
        },
        {
          patientId,
          calculationType: 'bmr_harris',
          formulaName: 'Harris-Benedict',
          inputValues: { weightKg: w, heightCm: h, age, isMale },
          resultValue: harrisBMR,
          steps: [
            { label: 'النتيجة', value: `${harrisBMR.toFixed(0)} سعرة/يوم` },
          ],
        },
        {
          patientId,
          calculationType: 'total_energy',
          formulaName: ventilatedREE ? ventilatedREE.formulaName : 'Mifflin-St Jeor + Factor',
          inputValues: { baseREE: ventilatedREE ? ventilatedREE.value : mifflinBMR, activityFactor, injuryFactor, feverFactor },
          resultValue: calculatedTEE,
          steps: [
            { label: 'الأيض الأساسي المستهدف', value: `${(ventilatedREE ? ventilatedREE.value : mifflinBMR).toFixed(0)} سعرة` },
            { label: 'معامل النشاط البدني', value: String(activityFactor) },
            { label: 'معامل الإجهاد السريري', value: String(injuryFactor) },
            { label: 'معامل الحرارة/الحمى', value: String(feverFactor) },
            { label: 'الاحتياج الكلي للطاقة', value: `${calculatedTEE.toFixed(0)} سعرة` },
          ],
        },
        {
          patientId,
          calculationType: 'fluid',
          formulaName: 'Holliday-Segar',
          inputValues: { weightKg: w },
          resultValue: fluidHollidaySegar,
          steps: [
            { label: 'احتياج السوائل (Holliday-Segar)', value: `${fluidHollidaySegar.toFixed(0)} مل` },
            { label: 'احتياج السوائل البديل (RDA)', value: `${fluidRda.toFixed(0)} مل` },
          ],
        },
      ];

      await repo.upsertBatch(results);
      setCalculations(results);
      showToast('تمت معالجة وحساب جميع النماذج بنجاح وبشكل متكامل', 'success');
      router.replace({ pathname: "/patient/[id]/intervention", params: { id: patientId } });
    } catch {
      showToast('فشل في حفظ الحسابات في قاعدة البيانات', 'error');
    }
  }, [patientId, w, h, age, isMale, bmi, mifflinBMR, harrisBMR, ventilatedREE, activityFactor, injuryFactor, feverFactor, calculatedTEE, fluidHollidaySegar, fluidRda, showToast]);

  const openOverride = useCallback((calc: CalculationResult) => {
    setOverrideTarget(calc);
    setOverrideValue(String(calc.overrideValue ?? calc.resultValue));
    setOverrideReason('');
    setShowOverride(true);
  }, []);

  const handleSaveOverride = useCallback(async () => {
    const validation = overrideSchema.safeParse({ value: overrideValue, reason: overrideReason });
    if (!validation.success) {
      showToast(validation.error.issues.map((e) => e.message).join('، '), 'error');
      return;
    }
    if (!overrideTarget?.id) return;

    try {
      setIsOverriding(true);
      const { OverrideCalculationUseCase } = await import('../../../src/domain/use-cases/OverrideCalculationUseCase');
      const uc = new OverrideCalculationUseCase();
      const updated = await uc.execute({
        calculationId: overrideTarget.id,
        patientId,
        overriddenValue: parseFloat(overrideValue),
        reason: overrideReason.trim(),
        overriddenBy: 'أخصائي التغذية العلاجية',
      });

      setCalculations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setShowOverride(false);
      showToast('تم حفظ التجاوز وتحديث السجلات السريرية بنجاح', 'success');
    } catch {
      showToast('فشل في تجاوز القيمة المرجعية', 'error');
    } finally {
      setIsOverriding(false);
    }
  }, [overrideTarget, overrideValue, overrideReason, patientId, showToast]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centered}>
        <ArabicText style={styles.errorText}>المريض غير موجود</ArabicText>
        <Button title="عودة" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>محرك حساب الاحتياجات التغذوية المتكامل (KAU)</ArabicText>
          <ArabicText style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</ArabicText>
        </View>

        {/* Section 1: البيانات القياسية والوزن */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="body-outline" size={20} color={colors.primary} />
            <ArabicText bold style={styles.sectionTitle}>البيانات القياسية للأنثروبومتري</ArabicText>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <TextInputField
                label="الوزن الحالي (كجم)"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="مثال: 70"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInputField
                label="الطول الحالي (سم)"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="مثال: 170"
              />
            </View>
          </View>

          <View style={styles.metaInfoGrid}>
            <View style={styles.metaBox}>
              <ArabicText style={styles.metaLabel}>العمر الحالي</ArabicText>
              <ArabicText bold style={styles.metaValue}>{age} سنة</ArabicText>
            </View>
            <View style={styles.metaBox}>
              <ArabicText style={styles.metaLabel}>الجنس المقيد</ArabicText>
              <ArabicText bold style={styles.metaValue}>{isMale ? 'ذكر (Male)' : 'أنثى (Female)'}</ArabicText>
            </View>
            <View style={styles.metaBox}>
              <ArabicText style={styles.metaLabel}>كتلة الجسم (BMI)</ArabicText>
              <ArabicText bold style={[styles.metaValue, { color: colors.primary }]}>{bmi.toFixed(1)}</ArabicText>
            </View>
          </View>

          <ArabicText style={styles.fieldLabel}>مستوى النشاط البدني للمريض</ArabicText>
          <SegmentedControl
            segments={ACTIVITY_SEGMENTS}
            selectedValue={activityLevel}
            onValueChange={(val) => setActivityLevel(val)}
          />

          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <TextInputField
                label="معامل الإجهاد السريري (Injury Factor)"
                value={stressFactor}
                onChangeText={setStressFactor}
                keyboardType="decimal-pad"
                placeholder="1.0"
              />
            </View>
          </View>
        </View>

        {/* Section 2: مرضى التنفس الاصطناعي والإجهاد الحراري */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse-outline" size={20} color={colors.primary} />
            <ArabicText bold style={styles.sectionTitle}>مؤشرات التنفس الاصطناعي والحرارة (KAU Flowchart)</ArabicText>
          </View>

          <RadioGroup
            label="هل المريض موصول بجهاز تنفس اصطناعي؟ (Mechanical Ventilation)"
            options={[
              { label: 'نعم (Yes)', value: 'yes' },
              { label: 'لا (No)', value: 'no' },
            ]}
            selectedValue={mechanicallyVentilated ? 'yes' : 'no'}
            onValueChange={(val) => setMechanicallyVentilated(val === 'yes')}
            direction="row"
          />

          {mechanicallyVentilated && (
            <View style={styles.ventilatorSubSection}>
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <TextInputField
                    label="معدل التهوية بالدقيقة (VE - L/min)"
                    value={ve}
                    onChangeText={setVe}
                    keyboardType="decimal-pad"
                    placeholder="8.0"
                  />
                </View>
                <View style={styles.halfInput}>
                  <TextInputField
                    label="أقصى درجة حرارة اليوم (Tmax - °C)"
                    value={tmax}
                    onChangeText={setTmax}
                    keyboardType="decimal-pad"
                    placeholder="37.0"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <RadioGroup
                  label="هل توجد صدمة أو إصابة حادة؟ (Trauma)"
                  options={[
                    { label: 'نعم', value: 'yes' },
                    { label: 'لا', value: 'no' },
                  ]}
                  selectedValue={trauma ? 'yes' : 'no'}
                  onValueChange={(val) => setTrauma(val === 'yes')}
                  direction="row"
                />
              </View>

              {trauma && (
                <View style={styles.switchRow}>
                  <RadioGroup
                    label="هل توجد حروق مرافقة؟ (Burn)"
                    options={[
                      { label: 'نعم', value: 'yes' },
                      { label: 'لا', value: 'no' },
                    ]}
                    selectedValue={burn ? 'yes' : 'no'}
                    onValueChange={(val) => setBurn(val === 'yes')}
                    direction="row"
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.divider} />

          <RadioGroup
            label="هل توجد حمى أو ارتفاع مفرط بالحرارة؟ (Fever)"
            options={[
              { label: 'نعم', value: 'yes' },
              { label: 'لا', value: 'no' },
            ]}
            selectedValue={fever ? 'yes' : 'no'}
            onValueChange={(val) => setFever(val === 'yes')}
            direction="row"
          />

          {fever && (
            <View style={styles.ventilatorSubSection}>
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <TextInputField
                    label="درجة الحرارة المسجلة"
                    value={currentTemp}
                    onChangeText={setCurrentTemp}
                    keyboardType="decimal-pad"
                    placeholder="38.5"
                  />
                </View>
                <View style={styles.halfInput}>
                  <RadioGroup
                    label="الوحدة المستخدمة"
                    options={[
                      { label: 'مئوي (°C)', value: 'C' },
                      { label: 'فهرنهايت (°F)', value: 'F' },
                    ]}
                    selectedValue={tempUnit}
                    onValueChange={(val) => setTempUnit(val as 'C' | 'F')}
                    direction="row"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section 3: النتائج المباشرة لمعدلات الأيض المستهدفة */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            <ArabicText bold style={styles.sectionTitle}>حساب معدلات الأيض والطاقة الكلية المحسوبة</ArabicText>
          </View>

          <View style={styles.resultDetailsCard}>
            <View style={styles.resultDetailRow}>
              <ArabicText style={styles.resultDetailLabel}>أيض الأساس (Mifflin-St Jeor BMR):</ArabicText>
              <ArabicText bold style={styles.resultDetailValue}>{mifflinBMR.toFixed(0)} سعرة/يوم</ArabicText>
            </View>
            <View style={styles.resultDetailRow}>
              <ArabicText style={styles.resultDetailLabel}>أيض الأساس (Harris-Benedict RMR):</ArabicText>
              <ArabicText bold style={styles.resultDetailValue}>{harrisBMR.toFixed(0)} سعرة/يوم</ArabicText>
            </View>

            {ventilatedREE && (
              <View style={[styles.resultDetailRow, styles.activeREEHighlight]}>
                <ArabicText bold style={{ color: colors.primary, fontSize: 13 }}>معادلة التنفس المطبقة ({ventilatedREE.formulaName}):</ArabicText>
                <ArabicText bold style={{ color: colors.primary, fontSize: 13 }}>{ventilatedREE.value.toFixed(0)} سعرة/يوم</ArabicText>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.teeTotalBox}>
              <ArabicText bold style={styles.teeTotalLabel}>إجمالي طاقة التمثيل اليومي (Calculated TEE):</ArabicText>
              <ArabicText bold style={styles.teeTotalValue}>{calculatedTEE.toFixed(0)} سعرة/يوم</ArabicText>
            </View>
          </View>
        </View>

        {/* Section 4: مصفوفة الإرشاد السريري والحالات المرضية */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            <ArabicText bold style={styles.sectionTitle}>مصفوفة التقييم حسب الحالة المرضية (KAU Compendium)</ArabicText>
          </View>

          <DropdownField
            label="اختر الحالة السريرية الخاصة للمريض"
            options={ILLNESS_OPTIONS}
            selectedValue={selectedIllness}
            onValueChange={setSelectedIllness}
            placeholder="اختر الحالة..."
          />

          {illnessDetails && (
            <View style={styles.illnessResultCard}>
              <ArabicText bold style={styles.illnessName}>{illnessDetails.rule.nameAr}</ArabicText>
              <View style={styles.divider} />
              <View style={styles.illnessMetricsGrid}>
                <View style={styles.illnessMetricItem}>
                  <ArabicText style={styles.illnessMetricLabel}>السعرات المستهدفة</ArabicText>
                  <ArabicText bold style={styles.illnessMetricValue}>
                    {illnessDetails.targetKcalMin.toFixed(0)} - {illnessDetails.targetKcalMax.toFixed(0)} سعرة
                  </ArabicText>
                  <ArabicText style={styles.illnessMetricSub}>{illnessDetails.rule.minKcal} - {illnessDetails.rule.maxKcal} kcal/kg</ArabicText>
                </View>

                <View style={styles.illnessMetricItem}>
                  <ArabicText style={styles.illnessMetricLabel}>البروتين المستهدف</ArabicText>
                  <ArabicText bold style={styles.illnessMetricValue}>
                    {illnessDetails.targetProteinMin.toFixed(1)} - {illnessDetails.targetProteinMax.toFixed(1)} غم
                  </ArabicText>
                  <ArabicText style={styles.illnessMetricSub}>{illnessDetails.rule.minProtein} - {illnessDetails.rule.maxProtein} g/kg</ArabicText>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section 5: السوائل وترطيب الجسم */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water-outline" size={20} color={colors.primary} />
            <ArabicText bold style={styles.sectionTitle}>حساب الاحتياجات اليومية من السوائل</ArabicText>
          </View>

          <View style={styles.metaInfoGrid}>
            <View style={styles.metaBox}>
              <ArabicText style={styles.metaLabel}>Holliday-Segar</ArabicText>
              <ArabicText bold style={styles.metaValue}>{fluidHollidaySegar.toFixed(0)} مل/يوم</ArabicText>
            </View>
            <View style={styles.metaBox}>
              <ArabicText style={styles.metaLabel}>احتياج RDA (البديل)</ArabicText>
              <ArabicText bold style={styles.metaValue}>{fluidRda.toFixed(0)} مل/يوم</ArabicText>
            </View>
          </View>
        </View>

        {/* Section 6: الدعم التغذوي والـ GUR (Enteral & Parenteral) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="beaker-outline" size={20} color={colors.primary} />
            <ArabicText bold style={styles.sectionTitle}>حساب معدلات التغذية الأنبوبية والوريدية (PN / EN)</ArabicText>
          </View>

          <ArabicText bold style={styles.subTitle}>1. حساب معدل ضخ التغذية الأنبوبية (Enteral Feeding Rate)</ArabicText>
          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <TextInputField
                label="الحجم المستهدف (مل)"
                value={enteralVolume}
                onChangeText={setEnteralVolume}
                keyboardType="numeric"
                placeholder="1000"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInputField
                label="مدة الضخ (ساعة)"
                value={enteralHours}
                onChangeText={setEnteralHours}
                keyboardType="numeric"
                placeholder="24"
              />
            </View>
          </View>

          {enteralFeedingRate > 0 && (
            <View style={styles.valueRowHighlight}>
              <ArabicText style={styles.highlightLabel}>معدل الضخ الموصى به:</ArabicText>
              <ArabicText bold style={styles.highlightValue}>{enteralFeedingRate.toFixed(1)} مل/ساعة</ArabicText>
            </View>
          )}

          <View style={styles.divider} />

          <ArabicText bold style={styles.subTitle}>2. معدل استهلاك الجلوكوز (GUR) للتغذية الوريدية</ArabicText>
          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <TextInputField
                label="الحجم الكلي للـ PN (مل)"
                value={pnVolume}
                onChangeText={setPnVolume}
                keyboardType="numeric"
                placeholder="1500"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInputField
                label="نسبة تركيز الديكستروز (%)"
                value={pnDextrosePercent}
                onChangeText={setPnDextrosePercent}
                keyboardType="decimal-pad"
                placeholder="10"
              />
            </View>
          </View>

          {gurResult && (
            <View>
              <View style={[styles.valueRowHighlight, { borderColor: gurResult.isSafe ? colors.success : colors.danger, backgroundColor: gurResult.isSafe ? '#E8F5E9' : '#FFEBEE' }]}>
                <ArabicText style={[styles.highlightLabel, { color: gurResult.isSafe ? colors.success : colors.danger }]}>معدل استهلاك الجلوكوز (GUR):</ArabicText>
                <ArabicText bold style={[styles.highlightValue, { color: gurResult.isSafe ? colors.success : colors.danger }]}>
                  {gurResult.gur.toFixed(2)} mg/kg/min
                </ArabicText>
              </View>

              {!gurResult.isSafe && (
                <View style={styles.warningGURContainer}>
                  <Ionicons name="warning-outline" size={18} color="#D32F2F" />
                  <ArabicText style={styles.warningGURText}>
                    ⚠️ تحذير سريري حرج: معدل استهلاك الجلوكوز (GUR) خارج الحدود الفسيولوجية الآمنة (4.0 - 6.0 mg/kg/min). يرجى تعديل تركيز الديكستروز أو خفض معدل التدفق لتجنب حدوث اضطرابات في سكر الدم.
                  </ArabicText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Database records list */}
        {calculations.length > 0 && (
          <View style={styles.section}>
            <ArabicText bold style={styles.sectionTitle}>السجلات المسجلة مسبقاً</ArabicText>
            {calculations.map((calc) => (
              <CalculationCard
                key={calc.calculationType}
                calculation={calc}
                onOverride={openOverride}
              />
            ))}
          </View>
        )}

        {/* Action triggers */}
        <View style={styles.actions}>
          <Button
            title="حفظ السجل السريري المتكامل"
            onPress={handleCalculate}
            icon={<Ionicons name="save-outline" size={20} color={colors.primaryContrast} />}
          />
          <Button
            title="عودة لملف المريض"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Override Modal */}
      <Modal visible={showOverride} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ArabicText bold style={styles.modalTitle}>تجاوز القيمة المرجعية</ArabicText>
            {overrideTarget && (
              <ArabicText style={styles.modalSubtitle}>
                {CALCULATION_TYPE_LABELS[overrideTarget.calculationType] || overrideTarget.calculationType}
              </ArabicText>
            )}

            <View style={styles.modalOriginalRow}>
              <ArabicText style={styles.originalLabel}>القيمة المسجلة حالياً:</ArabicText>
              <ArabicText bold style={styles.originalValue}>
                {overrideTarget?.resultValue}
              </ArabicText>
            </View>

            <TextInputField
              label="القيمة الجديدة"
              value={overrideValue}
              onChangeText={setOverrideValue}
              keyboardType="decimal-pad"
            />

            <TextInputField
              label="سبب التجاوز (مطلوب)"
              value={overrideReason}
              onChangeText={setOverrideReason}
              multiline
              placeholder="اذكر مبررات التجاوز السريري..."
            />

            <View style={styles.modalActions}>
              <Button
                title="حفظ"
                onPress={handleSaveOverride}
                loading={isOverriding}
                disabled={isOverriding}
              />
              <Button
                title="إلغاء"
                onPress={() => setShowOverride(false)}
                variant="secondary"
                disabled={isOverriding}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function CalculationCard({
  calculation,
  onOverride,
}: {
  calculation: CalculationResult;
  onOverride: (calc: CalculationResult) => void;
}) {
  const label = CALCULATION_TYPE_LABELS[calculation.calculationType] || calculation.calculationType;
  const displayValue = calculation.isOverridden ? calculation.overrideValue : calculation.resultValue;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.headerRow}>
        <ArabicText bold style={cardStyles.title}>{label}</ArabicText>
        <ArabicText style={cardStyles.formula}>{calculation.formulaName}</ArabicText>
      </View>

      {calculation.steps && calculation.steps.length > 0 && (
        <View style={cardStyles.stepsContainer}>
          {calculation.steps.map((step, idx) => (
            <View key={idx} style={cardStyles.stepRow}>
              <ArabicText style={cardStyles.stepLabel}>{step.label}</ArabicText>
              <ArabicText style={cardStyles.stepValue}>{step.value}</ArabicText>
            </View>
          ))}
        </View>
      )}

      <View style={cardStyles.divider} />

      <View style={cardStyles.resultRow}>
        <ArabicText bold style={cardStyles.resultLabel}>النتيجة النهائية:</ArabicText>
        <ArabicText bold style={cardStyles.resultValue}>
          {typeof displayValue === 'number' ? String(displayValue) : displayValue}
        </ArabicText>
      </View>

      {calculation.isOverridden && (
        <View style={cardStyles.overrideInfo}>
          <ArabicText style={cardStyles.overrideText}>
            تم التجاوز: {calculation.resultValue} ← {calculation.overrideValue}
          </ArabicText>
          {calculation.overrideReason && (
            <ArabicText style={cardStyles.overrideReason}>
              السبب: {calculation.overrideReason}
            </ArabicText>
          )}
        </View>
      )}

      {!calculation.isOverridden && calculation.id && (
        <TouchableOpacity
          style={cardStyles.overrideButton}
          onPress={() => onOverride(calculation)}
        >
          <Ionicons name="create-outline" size={16} color={colors.warning} />
          <ArabicText style={cardStyles.overrideButtonText}>تجاوز القيمة المرجعية</ArabicText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  formula: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  stepsContainer: {
    gap: 2,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  stepLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  stepValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  resultValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  overrideInfo: {
    backgroundColor: '#FFF3E0',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  overrideText: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'right',
  },
  overrideReason: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  overrideButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  overrideButtonText: {
    fontSize: 13,
    color: colors.warning,
  },
});

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
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    start: spacing.md,
    zIndex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.primaryContrast,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
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
  sectionTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  subTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  metaInfoGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  metaBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  ventilatorSubSection: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  switchRow: {
    marginVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  resultDetailsCard: {
    gap: spacing.sm,
  },
  resultDetailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  resultDetailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resultDetailValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  activeREEHighlight: {
    backgroundColor: colors.primaryLight,
    padding: spacing.xs,
    borderRadius: 6,
  },
  teeTotalBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  teeTotalLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  teeTotalValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  illnessResultCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    padding: spacing.md,
    gap: spacing.xs,
  },
  illnessName: {
    fontSize: 14,
    color: '#1B5E20',
    textAlign: 'right',
  },
  illnessMetricsGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  illnessMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  illnessMetricLabel: {
    fontSize: 11,
    color: '#388E3C',
    marginBottom: 2,
  },
  illnessMetricValue: {
    fontSize: 15,
    color: '#1B5E20',
  },
  illnessMetricSub: {
    fontSize: 10,
    color: '#4CAF50',
  },
  valueRowHighlight: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  highlightLabel: {
    fontSize: 13,
    color: colors.primary,
  },
  highlightValue: {
    fontSize: 14,
    color: colors.primary,
  },
  warningGURContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  warningGURText: {
    fontSize: 11,
    color: '#C62828',
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
    fontWeight: '700',
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  spacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOriginalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
  },
  originalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  originalValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
