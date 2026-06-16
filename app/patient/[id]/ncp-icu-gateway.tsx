import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  Text,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { Q } from '@nozbe/watermelondb';

// Models
import Patient from '../../../src/data/models/Patient';
import IcuCriticalAssessment from '../../../src/data/models/IcuCriticalAssessment';
import ElectrolyteMonitoring from '../../../src/data/models/ElectrolyteMonitoring';
import VitalsRecord from '../../../src/data/models/VitalsRecord';

// Engines
import { PennStateEngine } from '../../../src/domain/calculators/PennStateEngine';
import { IcuLipidCalorieEngine } from '../../../src/domain/calculators/IcuLipidCalorieEngine';
import { EnteralNutritionEngine } from '../../../src/domain/calculators/EnteralNutritionEngine';
import { ParenteralNutritionEngine } from '../../../src/domain/calculators/ParenteralNutritionEngine';
import { RefeedingSyndromeMonitor } from '../../../src/domain/monitors/RefeedingSyndromeMonitor';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';

// Helper for Mifflin BMR
function calculateMifflinBMR(weight: number, height: number, age: number, isMale: boolean): number {
  if (weight <= 0 || height <= 0 || age <= 0) return 1500;
  const genderOffset = isMale ? 5 : -161;
  return Math.round(10 * weight + 6.25 * height - 5 * age + genderOffset);
}

export default function NCPIcuGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  // Core stream states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestIcuCritical, setLatestIcuCritical] = useState<IcuCriticalAssessment | null>(null);
  const [latestElectrolyte, setLatestElectrolyte] = useState<ElectrolyteMonitoring | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states - ICU Parameters
  const [isMechanicallyVentilated, setIsMechanicallyVentilated] = useState(false);
  const [isOnVasopressors, setIsOnVasopressors] = useState(false);
  const [propofolInfusionRate, setPropofolInfusionRate] = useState('15'); // ml/hr
  const [dexmedetomidineInfusionRate, setDexmedetomidineInfusionRate] = useState('0'); // ml/hr
  const [gastricResidualVolume, setGastricResidualVolume] = useState('120'); // ml
  const [crpLevel, setCrpLevel] = useState('12'); // mg/L
  const [nitrogenBalance, setNitrogenBalance] = useState('-5'); // g

  // Vitals & Ventilation inputs
  const [temperature, setTemperature] = useState('37.5'); // °C
  const [minuteVentilation, setMinuteVentilation] = useState('7.5'); // L/min

  // Electrolyte inputs (Refeeding)
  const [serumPhosphorus, setSerumPhosphorus] = useState('3.0'); // mg/dL
  const [serumPotassium, setSerumPotassium] = useState('3.9'); // mmol/L
  const [serumMagnesium, setSerumMagnesium] = useState('1.9'); // mg/dL
  const [daysOfStarvation, setDaysOfStarvation] = useState('3');

  // Enteral inputs
  const [enteralCaloricDensity, setEnteralCaloricDensity] = useState('1.0'); // kcal/ml
  const [enteralProteinDensity, setEnteralProteinDensity] = useState('4.0'); // g/100ml
  const [enteralMethod, setEnteralMethod] = useState<'continuous' | 'bolus'>('continuous');
  const [enteralOsmolality, setEnteralOsmolality] = useState('300'); // mOsm/kg

  // Parenteral inputs
  const [parenteralRoute, setParenteralRoute] = useState<'central' | 'peripheral'>('central');
  const [parenteralFluidLimit, setParenteralFluidLimit] = useState('1800'); // ml
  const [parenteralTargetProtein, setParenteralTargetProtein] = useState('80'); // g

  // Overrides inputs
  const [flowRateOverride, setFlowRateOverride] = useState('');
  const [enteralProteinOverride, setEnteralProteinOverride] = useState('');
  const [parenteralOsmOverride, setParenteralOsmOverride] = useState('');
  const [isOsmViolationBypassed, setIsOsmViolationBypassed] = useState(false);

  // Save Modal inputs
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [justification, setJustification] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pulsating animation for Refeeding Critical warning banner
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  // 1.3 Unified reactive pipeline utilising combineLatest
  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);
    
    const latestIcuCritical$ = watchQuery<IcuCriticalAssessment>((db) => {
      return db.get('icu_critical_assessments').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const latestElectrolyte$ = watchQuery<ElectrolyteMonitoring>((db) => {
      return db.get('electrolyte_monitorings').query(
        Q.where('patient_id', patientId),
        Q.sortBy('monitoring_date', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const stream = combineLatest([patient$, latestIcuCritical$, latestElectrolyte$, vitals$]).subscribe({
      next: ([p, icu, elec, vitals]) => {
        setPatient(p);
        setLatestIcuCritical(icu);
        setLatestElectrolyte(elec);
        setLatestVitals(vitals);

        if (icu) {
          setIsMechanicallyVentilated(!!icu.isMechanicallyVentilated);
          setIsOnVasopressors(!!icu.isOnVasopressors);
          setPropofolInfusionRate(String(icu.propofolInfusionRateMlHr ?? ''));
          setDexmedetomidineInfusionRate(String(icu.dexmedetomidineInfusionRateMlHr ?? ''));
          setGastricResidualVolume(String(icu.gastricResidualVolumeMl ?? ''));
          setCrpLevel(String(icu.crpLevel ?? ''));
          setNitrogenBalance(String(icu.nitrogenBalanceG ?? ''));
        }

        if (elec) {
          setSerumPhosphorus(String(elec.phosphorus ?? ''));
          setSerumPotassium(String(elec.potassium ?? ''));
          setSerumMagnesium(String(elec.magnesium ?? ''));
        }

        if (vitals) {
          setTemperature(String(vitals.temperature ?? ''));
        }
        setIsLoading(false);
      },
      error: (err) => {
        console.error('NCP ICU Gateway stream error:', err);
        showToast('فشل تحميل بيانات البث التفاعلي للرعاية المركزة', 'error');
        setIsLoading(false);
      }
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  // Fallback patient metrics
  const weight = latestVitals?.weightKg ?? latestVitals?.weight ?? 70;
  const height = latestVitals?.heightCm ?? latestVitals?.height ?? 165;
  const age = patient?.age ?? 40;
  const isMale = patient?.gender === 'male';

  const computedBmr = useMemo(() => {
    return calculateMifflinBMR(weight, height, age, isMale);
  }, [weight, height, age, isMale]);

  const bmi = useMemo(() => {
    const htM = height / 100;
    return htM > 0 ? weight / (htM * htM) : 0;
  }, [weight, height]);

  const isObese = bmi >= 30;

  // 1.4 sequential logic execution sequence
  const pipelineResults = useMemo(() => {
    // Step 1: Resolve energy expenditure using Penn State if ventilated
    let baseTargetCalories = computedBmr * 1.2; // default BMR * activity factor
    let pennStateRes = null;

    if (isMechanicallyVentilated) {
      const tempVal = parseFloat(temperature) || 37.0;
      const mvVal = parseFloat(minuteVentilation) || 7.5;
      
      pennStateRes = PennStateEngine.calculatePennState({
        mifflinRee: computedBmr,
        minuteVentilationLMin: mvVal,
        maxTemperatureCelsius: tempVal,
        isObese,
      });
      if (pennStateRes.isSafe) {
        baseTargetCalories = pennStateRes.rmrValue;
      }
    }

    // Step 2: Feed into IcuLipidCalorieEngine to compute net requirement
    const propofolRate = parseFloat(propofolInfusionRate) || 0;
    const lipidRes = IcuLipidCalorieEngine.calculateNetRequirements({
      targetCalories: baseTargetCalories,
      propofolInfusionRateMlHr: propofolRate,
    });

    // Step 3: Refeeding Syndrome Monitor check
    const phosVal = parseFloat(serumPhosphorus) || 3.0;
    const potVal = parseFloat(serumPotassium) || 4.0;
    const magVal = parseFloat(serumMagnesium) || 2.0;
    const starvationDays = parseFloat(daysOfStarvation) || 0;
    
    const refeedingRes = RefeedingSyndromeMonitor.evaluateRefeedingRisk({
      serumPhosphorus: phosVal,
      serumPotassium: potVal,
      serumMagnesium: magVal,
      daysOfStarvationOrSevereMalnutrition: starvationDays,
      plannedInitialCalories: lipidRes.netCaloricRequirement,
      weightKg: weight,
    });

    // Step 4: Pass adjusted net target into both Enteral and Parenteral engines
    const activeTargetCal = refeedingRes.adjustedCalories;

    // Enteral Nutrition Engine
    const densityVal = parseFloat(enteralCaloricDensity) || 1.0;
    const protVal = parseFloat(enteralProteinDensity) || 4.0;
    const grvVal = parseFloat(gastricResidualVolume) || 0;
    const osmVal = parseFloat(enteralOsmolality) || 300;

    const enteralRes = EnteralNutritionEngine.calculateEnteralFeed({
      netCaloricRequirement: activeTargetCal,
      formulaCaloricDensity: densityVal,
      formulaProteinDensityGrams: protVal,
      feedingMethod: enteralMethod,
      gastricResidualVolumeMl: grvVal,
      formulaOsmolality: osmVal,
    });

    // Parenteral Nutrition Engine
    const ptFluidLimit = parseFloat(parenteralFluidLimit) || 1800;
    const ptProteinGrams = parseFloat(parenteralTargetProtein) || 80;

    const parenteralRes = ParenteralNutritionEngine.calculateParenteralFeed({
      targetCalories: activeTargetCal,
      targetProteinGrams: ptProteinGrams,
      totalFluidLimitMl: ptFluidLimit,
      routeType: parenteralRoute,
    });

    return {
      baseTargetCalories,
      pennState: pennStateRes,
      lipid: lipidRes,
      refeeding: refeedingRes,
      activeTargetCal,
      enteral: enteralRes,
      parenteral: parenteralRes,
    };
  }, [
    isMechanicallyVentilated,
    computedBmr,
    temperature,
    minuteVentilation,
    isObese,
    propofolInfusionRate,
    serumPhosphorus,
    serumPotassium,
    serumMagnesium,
    daysOfStarvation,
    weight,
    enteralCaloricDensity,
    enteralProteinDensity,
    gastricResidualVolume,
    enteralOsmolality,
    enteralMethod,
    parenteralFluidLimit,
    parenteralTargetProtein,
    parenteralRoute,
  ]);

  // Pulsating warning animation for refeeding risk
  const isRefeedingRiskCritical = pipelineResults.refeeding.riskTier === 'critical' || pipelineResults.refeeding.riskTier === 'moderate';
  useEffect(() => {
    if (isRefeedingRiskCritical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRefeedingRiskCritical]);

  // Derived target metrics factoring overrides
  const overriddenTargets = useMemo(() => {
    const calculatedRate = pipelineResults.enteral.flowRateMlHr;
    const activeRate = flowRateOverride.trim() ? parseFloat(flowRateOverride) : calculatedRate;

    const calculatedProtein = pipelineResults.enteral.totalProteinGrams;
    const activeProtein = enteralProteinOverride.trim() ? parseFloat(enteralProteinOverride) : calculatedProtein;

    const calculatedOsm = pipelineResults.parenteral.predictedOsmolarity;
    const activeOsm = parenteralOsmOverride.trim() ? parseFloat(parenteralOsmOverride) : calculatedOsm;

    // Submission lockout conditions
    const isPNOsmViolation = pipelineResults.parenteral.isOsmolarityViolation;
    const isSubmissionLocked = isPNOsmViolation && !isOsmViolationBypassed;

    return {
      flowRate: Math.round(activeRate * 100) / 100,
      protein: Math.round(activeProtein * 100) / 100,
      osmolarity: Math.round(activeOsm * 100) / 100,
      isSubmissionLocked,
    };
  }, [pipelineResults, flowRateOverride, enteralProteinOverride, parenteralOsmOverride, isOsmViolationBypassed]);

  // 3.2 Secure persistency handler enclosed in WatermelonDB write transaction
  const handleSaveIcuSession = async () => {
    if (overriddenTargets.isSubmissionLocked) {
      showToast('خطأ: لا يمكن حفظ الجلسة بسبب انتهاك حد أسمولية الوريد المحيطي. يرجى التغيير للوريد المركزي أو تجاوز التنبيه بمبرر مقبول', 'error');
      return;
    }

    if (!signature.trim() || !justification.trim()) {
      showToast('يرجى كتابة التبرير السريري وتوقيع الأخصائي لحفظ السجل', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        const icuCollection = db.get<IcuCriticalAssessment>('icu_critical_assessments');
        const auditLogCollection = db.get('audit_logs');

        // Create the new ICU critical assessment row
        const newRecord = await icuCollection.create((record) => {
          record.patientId = patientId;
          record.isMechanicallyVentilated = isMechanicallyVentilated;
          record.isOnVasopressors = isOnVasopressors;
          record.propofolInfusionRateMlHr = parseFloat(propofolInfusionRate) || 0;
          record.dexmedetomidineInfusionRateMlHr = parseFloat(dexmedetomidineInfusionRate) || 0;
          record.gastricResidualVolumeMl = parseFloat(gastricResidualVolume) || 0;
          record.crpLevel = parseFloat(crpLevel) || 0;
          record.nitrogenBalanceG = parseFloat(nitrogenBalance) || 0;
          record.recordedAt = new Date();
        });

        // Log detailed clinical audit log
        await auditLogCollection.create((record: any) => {
          record.actionType = 'icu_critical_override_audit';
          record.userId = signature.trim();
          record.details = JSON.stringify({
            assessmentId: newRecord.id,
            patientId,
            justification: justification.trim(),
            energyRmrValue: pipelineResults.activeTargetCal,
            refeedingRiskTier: pipelineResults.refeeding.riskTier,
            isCalorieCapTriggered: pipelineResults.refeeding.isCalorieCapTriggered,
            isOsmViolationBypassed,
            originalTargets: {
              flowRate: pipelineResults.enteral.flowRateMlHr,
              proteinGrams: pipelineResults.enteral.totalProteinGrams,
              predictedOsmolarity: pipelineResults.parenteral.predictedOsmolarity,
            },
            overriddenTargets: {
              flowRate: flowRateOverride.trim() ? parseFloat(flowRateOverride) : null,
              proteinGrams: enteralProteinOverride.trim() ? parseFloat(enteralProteinOverride) : null,
              predictedOsmolarity: parenteralOsmOverride.trim() ? parseFloat(parenteralOsmOverride) : null,
            },
            timestamp: new Date().toISOString(),
          });
        });
      });

      showToast('تم حفظ جلسة الرعاية المركزة وتوقيع سجل التدقيق بنجاح', 'success');
      setIsSaveModalOpen(false);
      setJustification('');
    } catch (e) {
      console.error('Failed to save ICU critical assessment:', e);
      showToast('فشل في حفظ سجل الرعاية المركزة بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ArabicText bold style={styles.headerTitle}>بوابة التغذية السريرية للعناية المركزة (ICU Gateway)</ArabicText>
            <ArabicText style={styles.headerSubtitle}>
              المريض: {patient?.fullName} | وزن: {weight} كغ | كتلة الجسم: {Math.round(bmi * 10) / 10} ({isObese ? 'سمنة' : 'طبيعي'})
            </ArabicText>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

          {/* ICU Parameters Card */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>مؤشرات الفحص السريري الحرج (Telemetry & Vitals)</ArabicText>

            <View style={styles.switchRow}>
              <ArabicText style={styles.switchLabel}>خاضع للتنفس الاصطناعي (Mechanical Ventilation)</ArabicText>
              <Switch
                value={isMechanicallyVentilated}
                onValueChange={setIsMechanicallyVentilated}
                trackColor={{ false: '#334155', true: colors.primary }}
                thumbColor={isMechanicallyVentilated ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={styles.switchRow}>
              <ArabicText style={styles.switchLabel}>مستمر على رافعات الضغط (Vasopressors Support)</ArabicText>
              <Switch
                value={isOnVasopressors}
                onValueChange={setIsOnVasopressors}
                trackColor={{ false: '#334155', true: colors.primary }}
                thumbColor={isOnVasopressors ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="معدل تسريب البروبوفول (مل/ساعة)"
                  value={propofolInfusionRate}
                  onChangeText={setPropofolInfusionRate}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="البقايا المعدية GRV (مل)"
                  value={gastricResidualVolume}
                  onChangeText={setGastricResidualVolume}
                  keyboardType="numeric"
                />
              </View>
              {isMechanicallyVentilated && (
                <>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="أعلى درجة حرارة للجسم (°C)"
                      value={temperature}
                      onChangeText={setTemperature}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="التهوية الدقيقة Minute Vent (لتر/د)"
                      value={minuteVentilation}
                      onChangeText={setMinuteVentilation}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}
            </View>

            {/* Electrolytes block for refeeding */}
            <ArabicText bold style={styles.subSectionTitle}>نتائج شوارد المصل الصباحية (أملاح إعادة التغذية)</ArabicText>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="فوسفور المصل (mg/dL)"
                  value={serumPhosphorus}
                  onChangeText={setSerumPhosphorus}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="بوتاسيوم المصل (mmol/L)"
                  value={serumPotassium}
                  onChangeText={setSerumPotassium}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="مغنيسيوم المصل (mg/dL)"
                  value={serumMagnesium}
                  onChangeText={setSerumMagnesium}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="فترة الصيام المسبقة (أيام)"
                  value={daysOfStarvation}
                  onChangeText={setDaysOfStarvation}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* SECTOR 1 (METABOLIC METRICS & REFEEDING RADAR) */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>القطاع الأول: قياسات التمثيل الغذائي ورادار إعادة التغذية</ArabicText>

            {/* Flashing Warning Banner for Refeeding Syndrome Risk */}
            {isRefeedingRiskCritical && (
              <Animated.View style={[styles.refeedingAlertContainer, { opacity: pulseAnim }]}>
                <ArabicText bold style={styles.refeedingAlertText}>
                  🚨 بروتوكول سلامة حرج: تم رصد مؤشرات خطورة لمتلازمة إعادة التغذية (Refeeding Syndrome). تم تقييد وحفظ الحد الأقصى للسعرات بـ {pipelineResults.refeeding.maxSafeCaloriesCeiling} سعرة/يوم لتجنب الانهيار الأيضي وهبوط الشوارد.
                </ArabicText>
              </Animated.View>
            )}

            <View style={styles.doubleMetricContainer}>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{pipelineResults.baseTargetCalories} سعرة</Text>
                <ArabicText style={styles.metricLabel}>إجمالي الطاقة المقدر (TEE)</ArabicText>
                {pipelineResults.pennState && (
                  <ArabicText style={styles.metricSubtext}>معادلة: {pipelineResults.pennState.equationUsed}</ArabicText>
                )}
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{pipelineResults.lipid.totalHiddenLipidCalories} سعرة</Text>
                <ArabicText style={styles.metricLabel}>السعرات الدهنية الخفية (Lipid)</ArabicText>
                {pipelineResults.lipid.isOverfeedingRisk && (
                  <ArabicText style={[styles.metricSubtext, { color: colors.danger }]}>خطر فرط التغذية</ArabicText>
                )}
              </View>
            </View>

            <View style={styles.netTargetCard}>
              <Text style={styles.netTargetVal}>{pipelineResults.activeTargetCal} سعرة / يوم</Text>
              <ArabicText bold style={styles.netTargetLabel}>صافي السعرات المستهدف الآمن المعتمد</ArabicText>
            </View>

            {/* Refeeding Alerts list */}
            <View style={styles.alertList}>
              {pipelineResults.refeeding.arabicClinicalAlerts.map((rec, i) => (
                <ArabicText key={i} style={[
                  styles.alertListItem,
                  rec.includes('شديد') || rec.includes('الحد الآمن') ? { color: colors.danger } : {}
                ]}>• {rec}</ArabicText>
              ))}
            </View>
          </View>

          {/* SECTOR 2 (ENTERAL NUTRITION TUNING CARD) */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>القطاع الثاني: ضبط وضوابط التغذية المعوية (Enteral Tuning)</ArabicText>

            {/* Enteral densities input */}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="كثافة السعرات (kcal/ml)"
                  value={enteralCaloricDensity}
                  onChangeText={setEnteralCaloricDensity}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="نسبة البروتين (g/100ml)"
                  value={enteralProteinDensity}
                  onChangeText={setEnteralProteinDensity}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="أسمولالية التركيبة (mOsm)"
                  value={enteralOsmolality}
                  onChangeText={setEnteralOsmolality}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Feeding Method Tab Selector */}
            <ArabicText style={styles.label}>طريقة التغذية المعوية:</ArabicText>
            <View style={styles.tabRow}>
              {(['continuous', 'bolus'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.tabButton,
                    enteralMethod === method && styles.tabButtonActive,
                  ]}
                  onPress={() => setEnteralMethod(method)}
                >
                  <ArabicText
                    bold={enteralMethod === method}
                    style={[
                      styles.tabText,
                      enteralMethod === method && styles.tabTextActive,
                    ]}
                  >
                    {method === 'continuous' ? 'ضخ مستمر (Continuous)' : 'وجبات متقطعة (Bolus)'}
                  </ArabicText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gastric Tolerance Badge Display */}
            {pipelineResults.enteral.isToleranceIssue && (
              <View style={[
                styles.toleranceBadgeContainer,
                pipelineResults.enteral.clinicalActionRecommendation === 'hold_feed'
                  ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: colors.danger }
                  : { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: colors.warning }
              ]}>
                <View style={styles.badgeHeader}>
                  <Ionicons 
                    name={pipelineResults.enteral.clinicalActionRecommendation === 'hold_feed' ? 'close-circle' : 'warning'} 
                    size={20} 
                    color={pipelineResults.enteral.clinicalActionRecommendation === 'hold_feed' ? colors.danger : colors.warning} 
                  />
                  <ArabicText bold style={[
                    styles.badgeTitle,
                    pipelineResults.enteral.clinicalActionRecommendation === 'hold_feed' ? { color: colors.danger } : { color: colors.warning }
                  ]}>
                    إجراء فوري مطلوب: {
                      pipelineResults.enteral.clinicalActionRecommendation === 'hold_feed' 
                        ? 'إيقاف مؤقت للتغذية (Hold Feed)' 
                        : 'تقليل معدل الضخ 50% (Reduce Rate)'
                    }
                  </ArabicText>
                </View>
              </View>
            )}

            {/* Enteral Directives List */}
            <View style={styles.alertList}>
              {pipelineResults.enteral.arabicDirectives.map((dir, i) => (
                <ArabicText key={i} style={styles.alertListItem}>• {dir}</ArabicText>
              ))}
            </View>
          </View>

          {/* SECTOR 3 (PARENTERAL NUTRITION LINE GUARD) */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>القطاع الثالث: مراقبة وحماية التغذية الوريدية (Parenteral Line Guard)</ArabicText>

            {/* Route Type Segmented Tab */}
            <ArabicText style={styles.label}>مسار القسطرة الوريدية (Route):</ArabicText>
            <View style={styles.tabRow}>
              {(['central', 'peripheral'] as const).map((route) => (
                <TouchableOpacity
                  key={route}
                  style={[
                    styles.tabButton,
                    parenteralRoute === route && styles.tabButtonActive,
                  ]}
                  onPress={() => setParenteralRoute(route)}
                >
                  <ArabicText
                    bold={parenteralRoute === route}
                    style={[
                      styles.tabText,
                      parenteralRoute === route && styles.tabTextActive,
                    ]}
                  >
                    {route === 'central' ? 'وريد مركزي (Central Line)' : 'وريد محيطي (Peripheral Line)'}
                  </ArabicText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="الحد الأقصى للسوائل (مل)"
                  value={parenteralFluidLimit}
                  onChangeText={setParenteralFluidLimit}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="البروتين المستهدف (غرام)"
                  value={parenteralTargetProtein}
                  onChangeText={setParenteralTargetProtein}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* predicted values & osmolarity */}
            <View style={styles.doubleMetricContainer}>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{pipelineResults.parenteral.dextroseGrams} غ</Text>
                <ArabicText style={styles.metricLabel}>جلوكوز (Dextrose)</ArabicText>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>{pipelineResults.parenteral.lipidGrams} غ</Text>
                <ArabicText style={styles.metricLabel}>دهون وريدية (Lipids)</ArabicText>
              </View>
            </View>

            <View style={[
              styles.osmContainer,
              pipelineResults.parenteral.isOsmolarityViolation && styles.osmContainerViolation
            ]}>
              <Text style={[
                styles.osmValText,
                pipelineResults.parenteral.isOsmolarityViolation ? { color: colors.danger } : { color: colors.success }
              ]}>
                {overriddenTargets.osmolarity} mOsm/L
              </Text>
              <ArabicText style={styles.osmLabel}>الأسمولالية المتوقعة للمحلول</ArabicText>
            </View>

            {/* Osmolarity Warning and Lockout */}
            {pipelineResults.parenteral.isOsmolarityViolation && (
              <View style={styles.osmWarningBlock}>
                <Ionicons name="alert-circle" size={24} color={colors.danger} />
                <View style={{ flex: 1, marginRight: spacing.xs }}>
                  <ArabicText bold style={styles.osmWarningTitle}>تنبيه حظر الوريد المحيطي!</ArabicText>
                  <ArabicText style={styles.osmWarningText}>
                    أسمولية التركيبة ({pipelineResults.parenteral.predictedOsmolarity}) تتجاوز حد 900 mOsm/L للحقن الطرفي. يوصى بتوصيلها عبر وريد مركزي لتفادي تهيج الوريد والتهابه.
                  </ArabicText>
                  
                  {/* Bypass Switch */}
                  <View style={styles.bypassRow}>
                    <ArabicText style={styles.bypassLabel}>تجاوز تحذير الحظر بمسؤولية الطبيب المعالج</ArabicText>
                    <Switch
                      value={isOsmViolationBypassed}
                      onValueChange={setIsOsmViolationBypassed}
                      trackColor={{ false: '#334155', true: colors.danger }}
                      thumbColor={isOsmViolationBypassed ? '#ffffff' : '#94a3b8'}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* TRANSACTION AUDITED OVERRIDE BLOCK */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>تجاوز معدلات التغذية السريرية وتدفق السوائل (ICU Overrides)</ArabicText>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز معدل الضخ المعوي (مل/ساعة)"
                  value={flowRateOverride}
                  onChangeText={setFlowRateOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز بروتين الوجبة المعوية (غ)"
                  value={enteralProteinOverride}
                  onChangeText={setEnteralProteinOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز أسمولية المحلول الوريدي"
                  value={parenteralOsmOverride}
                  onChangeText={setParenteralOsmOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
            </View>

            <Button
              title="حفظ سجلات التدخل والتوقيع سريرياً"
              onPress={() => setIsSaveModalOpen(true)}
              variant="primary"
              disabled={overriddenTargets.isSubmissionLocked}
            />
          </View>

        </ScrollView>

        {/* Auditing Save Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isSaveModalOpen}
          onRequestClose={() => setIsSaveModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ArabicText bold style={styles.modalTitle}>توقيع وإقرار تدخل العناية المركزة</ArabicText>
              <ArabicText style={styles.modalDescription}>
                يتطلب حفظ معايير التغذية المكثفة وتجاوزاتها الأمنية تبريراً طبياً مكتوباً باللغة العربية وتوقيع الطبيب الاستشاري.
              </ArabicText>

              <TextInputField
                label="التبرير الطبي للتدخل (باللغة العربية)"
                value={justification}
                onChangeText={setJustification}
                placeholder="اكتب التبرير السريري للتجاوز هنا..."
                multiline
              />

              <TextInputField
                label="اسم الطبيب الاستشاري (التوقيع الإلكتروني)"
                value={signature}
                onChangeText={setSignature}
                placeholder="الاسم الثلاثي للطبيب..."
              />

              <View style={styles.modalActions}>
                <Button
                  title="إلغاء"
                  onPress={() => {
                    setIsSaveModalOpen(false);
                    setJustification('');
                  }}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  title="توقيع وإرسال السجل"
                  onPress={handleSaveIcuSession}
                  variant="primary"
                  loading={isSaving}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: safeHeaderPaddingTop + spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  subSectionTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryContrast,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    textAlign: 'right',
  },
  refeedingAlertContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  refeedingAlertText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 20,
    textAlign: 'right',
  },
  doubleMetricContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  metricSubtext: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  netTargetCard: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  netTargetVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
  },
  netTargetLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  alertList: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertListItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
    textAlign: 'right',
  },
  toleranceBadgeContainer: {
    borderRadius: 8,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeTitle: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  osmContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  osmContainerViolation: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  osmValText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  osmLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  osmWarningBlock: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.danger,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  osmWarningTitle: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'right',
    marginBottom: 2,
  },
  osmWarningText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    textAlign: 'right',
  },
  bypassRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 0.5,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  bypassLabel: {
    fontSize: 11,
    color: colors.danger,
    flex: 1,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  modalDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
