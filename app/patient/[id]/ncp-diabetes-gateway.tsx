import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Switch,
  Modal,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { Q } from '@nozbe/watermelondb';

// Models
import Patient from '../../../src/data/models/Patient';
import NutritionalPlan from '../../../src/data/models/NutritionalPlan';
import VitalsRecord from '../../../src/data/models/VitalsRecord';

// Engines
import { InsulinCarbRatioEngine } from '../../../src/domain/calculators/InsulinCarbRatioEngine';
import { InsulinSensitivityEngine } from '../../../src/domain/calculators/InsulinSensitivityEngine';
import { Type2DiabetesEngine } from '../../../src/domain/calculators/Type2DiabetesEngine';
import { GestationalDiabetesEngine } from '../../../src/domain/calculators/GestationalDiabetesEngine';
import { GestationalMetabolicTracker } from '../../../src/domain/monitors/GestationalMetabolicTracker';

// Psychiatric Engines
import { AnorexiaNutritionalRehab } from '../../../src/domain/calculators/AnorexiaNutritionalRehab';
import { BulimiaNutritionalPlan } from '../../../src/domain/calculators/BulimiaNutritionalPlan';
import { EVAvoidantRestrictiveDiet } from '../../../src/domain/calculators/EVAvoidantRestrictiveDiet';
import { PsychotropicNutrientInteractions } from '../../../src/domain/calculators/PsychotropicNutrientInteractions';

// Pediatric Engines
import { PediatricEERCalculator } from '../../../src/domain/calculators/PediatricEERCalculator';
import { PediatricFluidRequirement } from '../../../src/domain/calculators/PediatricFluidRequirement';
import { PediatricProteinRequirement } from '../../../src/domain/calculators/PediatricProteinRequirement';
import { PediatricRefeedingMonitor } from '../../../src/domain/calculators/PediatricRefeedingMonitor';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';

// Helper for Mifflin St-Jeor BMR
function calculateMifflinBMR(weight: number, height: number, age: number, isMale: boolean): number {
  if (weight <= 0 || height <= 0 || age <= 0) return 1500;
  const genderOffset = isMale ? 5 : -161;
  return Math.round(10 * weight + 6.25 * height - 5 * age + genderOffset);
}

export default function NCPDiabetesGatewayScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  // Core stream states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestPlan, setLatestPlan] = useState<NutritionalPlan | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states - Diabetes Profile / Glycemic values
  const [diabetesType, setDiabetesType] = useState<'type_1' | 'type_2' | 'gestational'>('type_1');
  const [fastingBG, setFastingBG] = useState('90');
  const [postPrandialBG, setPostPrandialBG] = useState('120');
  const [hba1c, setHba1c] = useState('5.8');
  const [ketonesPresent, setKetonesPresent] = useState(false);

  // Type 1 Inputs
  const [tdd, setTdd] = useState('40');
  const [insulinRegimen, setInsulinRegimen] = useState<'basal_bolus' | 'pump' | 'split_mixed'>('basal_bolus');
  const [plannedCarbs, setPlannedCarbs] = useState('60'); // Carb exchange interactive counter
  const [targetBG, setTargetBG] = useState('100');

  // Type 2 Inputs
  const [hasInsulinResistance, setHasInsulinResistance] = useState(false);
  const [activityFactor, setActivityFactor] = useState('1.2');
  const [targetWeightLossPercent, setTargetWeightLossPercent] = useState('10');

  // Gestational Inputs
  const [gestationalWeeks, setGestationalWeeks] = useState('24');
  const [prePregnancyBMI, setPrePregnancyBMI] = useState('24.5');
  const [prePregnancyWeight, setPrePregnancyWeight] = useState('65');

  // Mode State
  const [pediatricMode, setPediatricMode] = useState(false);
  const [psychiatricMode, setPsychiatricMode] = useState(false);
  const [pedAgeMonths, setPedAgeMonths] = useState('24');
  const [pedWeightKg, setPedWeightKg] = useState('12');
  const [pedHeightCm, setPedHeightCm] = useState('85');
  const [pedGender, setPedGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [pedCriticallyIll, setPedCriticallyIll] = useState(false);
  const [pedHasFever, setPedHasFever] = useState(false);
  const [pedHasDehydration, setPedHasDehydration] = useState(false);
  const [pedOnIVFluids, setPedOnIVFluids] = useState(false);
  const [pedRenalImpairment, setPedRenalImpairment] = useState(false);
  const [pedLiverImpairment, setPedLiverImpairment] = useState(false);
  const [pedOnCRRT, setPedOnCRRT] = useState(false);
  const [pedPhosphorus, setPedPhosphorus] = useState('4.0');
  const [pedPotassium, setPedPotassium] = useState('4.5');
  const [pedMagnesium, setPedMagnesium] = useState('2.0');
  const [pedMalnutritionDays, setPedMalnutritionDays] = useState('2');
  const [pedPlannedKcal, setPedPlannedKcal] = useState('500');

  // Psychiatric Mode State
  const [psychDiagType, setPsychDiagType] = useState<'anorexia' | 'bulimia' | 'arfid' | 'psychotropic'>('anorexia');
  const [psychWeight, setPsychWeight] = useState('55');
  const [psychTargetWeight, setPsychTargetWeight] = useState('60');
  const [psychBmi, setPsychBmi] = useState('17.5');
  const [psychMedicalStability, setPsychMedicalStability] = useState<'stable' | 'unstable'>('stable');
  const [psychRiskLevel, setPsychRiskLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [psychBingeFreq, setPsychBingeFreq] = useState('3');
  const [psychPurgeFreq, setPsychPurgeFreq] = useState('2');
  const [psychFoodRestriction, setPsychFoodRestriction] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [psychAnxietyLevel, setPsychAnxietyLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [psychMedication, setPsychMedication] = useState('lithium');
  const [psychNutrient, setPsychNutrient] = useState('sodium');
  const [psychDose, setPsychDose] = useState('600');

  // Overrides inputs
  const [calorieOverride, setCalorieOverride] = useState('');
  const [icrOverride, setIcrOverride] = useState('');
  const [carbOverride, setCarbOverride] = useState('');

  // Save justifications & signing
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [justification, setJustification] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pulsating animation for ketones warning
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  // 1. Reactive stream aggregation via combineLatest
  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);
    
    const latestPlan$ = watchQuery<NutritionalPlan>((db) => {
      return db.get('nutritional_plans').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(plans => plans.length > 0 ? plans[0] : null)
    );

    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const stream = combineLatest([patient$, latestPlan$, vitals$]).subscribe({
      next: ([p, plan, vitals]) => {
        setPatient(p);
        setLatestPlan(plan);
        setLatestVitals(vitals);

        if (plan) {
          const profile = plan.diabetesProfile;
          if (profile) {
            setDiabetesType(profile.diabetesType as any);
            setFastingBG(String(profile.fastingBloodGlucose ?? ''));
            setPostPrandialBG(String(profile.postPrandialBloodGlucose ?? ''));
            setHba1c(String(profile.hba1c ?? ''));
            
            if (profile.diabetesType === 'type_1') {
              const t1 = profile as any;
              setTdd(String(t1.totalDailyInsulinDose ?? ''));
              setInsulinRegimen(t1.currentInsulinRegimen ?? 'basal_bolus');
            } else if (profile.diabetesType === 'type_2') {
              const t2 = profile as any;
              setHasInsulinResistance(!!t2.hasInsulinResistance);
            } else if (profile.diabetesType === 'gestational') {
              const gest = profile as any;
              setGestationalWeeks(String(gest.gestationalWeeks ?? ''));
              setPrePregnancyBMI(String(gest.prePregnancyBMI ?? ''));
              setPrePregnancyWeight(String(gest.prePregnancyWeightKg ?? ''));
              setKetonesPresent(!!gest.morningUrineKetonesPresent);
            }

            // Load overrides
            try {
              const metadata = JSON.parse(plan.specializedMetadata || '{}');
              if (metadata.overrides) {
                setCalorieOverride(String(metadata.overrides.calorieLimitOverride ?? ''));
                setIcrOverride(String(metadata.overrides.icrOverride ?? ''));
                setCarbOverride(String(metadata.overrides.carbLimitOverride ?? ''));
              }
            } catch {}
          }
        }
        setIsLoading(false);
      },
      error: (err) => {
        console.error('NCP Diabetes Gateway stream error:', err);
        showToast('فشل تحميل البيانات التفاعلية', 'error');
        setIsLoading(false);
      }
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  // Pulsating ketones warning animation
  useEffect(() => {
    if (ketonesPresent && diabetesType === 'gestational') {
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
  }, [ketonesPresent, diabetesType]);

  // Fallback metrics computed from patient age/gender + latest vitals weight/height
  const weight = latestVitals?.weightKg ?? latestVitals?.weight ?? 70;
  const height = latestVitals?.heightCm ?? latestVitals?.height ?? 165;
  const age = patient?.age ?? 40;
  const isMale = patient?.gender === 'male';

  const computedBmr = useMemo(() => {
    return calculateMifflinBMR(weight, height, age, isMale);
  }, [weight, height, age, isMale]);

  // 1.3 DISPATCHING PIPELINE & VARIABLE PRE-CALCULATION
  const type1Outputs = useMemo(() => {
    if (diabetesType !== 'type_1') return null;
    const rawTdd = parseFloat(tdd ?? '');
    const tddVal = (tdd && tdd.trim().length > 0 && !isNaN(rawTdd)) ? rawTdd : null;
    const icrRes = tddVal !== null ? InsulinCarbRatioEngine.calculateICR(tddVal) : { icrValue: 0, isSafe: false, clinicalNote: 'TDD غير مدخل' };
    
    const currentBGNum = postPrandialBG ? parseFloat(postPrandialBG) : 0;
    const targetBGNum = targetBG ? parseFloat(targetBG) : 100;
    const isfRes = tddVal !== null
      ? InsulinSensitivityEngine.calculateCorrection({
          totalDailyDose: tddVal,
          currentBloodGlucose: currentBGNum,
          targetBloodGlucose: targetBGNum,
        })
      : { isfValue: 0, correctionDose: 0, isSafe: false, clinicalDirective: ['TDD غير مدخل'] };

    return {
      icr: icrRes,
      isf: isfRes,
    };
  }, [diabetesType, tdd, postPrandialBG, targetBG]);

  const type2Outputs = useMemo(() => {
    if (diabetesType !== 'type_2') return null;
    const activity = safeParseFloat(activityFactor) || 1.2;
    const lossPct = safeParseFloat(targetWeightLossPercent) || 10;
    
    return Type2DiabetesEngine.calculateType2Requirements({
      baselineREE: computedBmr,
      activityFactor: activity,
      gender: isMale ? 'male' : 'female',
      weightKg: weight,
      targetWeightLossPercent: lossPct,
      hasInsulinResistance,
    });
  }, [diabetesType, computedBmr, activityFactor, weight, isMale, targetWeightLossPercent, hasInsulinResistance]);

  // Pediatric Calculations
  const safeParseFloat = (v: string): number => {
    if (!v || v.trim() === '') return 0;
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  const safeParseInt = (v: string): number => {
    if (!v || v.trim() === '') return 0;
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  };

  const pedEER = useMemo(() => {
    if (!pediatricMode) return null;
    return PediatricEERCalculator.calculate({
      ageInMonths: safeParseInt(pedAgeMonths),
      weightKg: safeParseFloat(pedWeightKg),
      heightCm: safeParseFloat(pedHeightCm),
      gender: pedGender,
      isCriticallyIll: pedCriticallyIll,
      hasFever: pedHasFever,
    });
  }, [pediatricMode, pedAgeMonths, pedWeightKg, pedHeightCm, pedGender, pedCriticallyIll, pedHasFever]);

  const pedFluid = useMemo(() => {
    if (!pediatricMode) return null;
    return PediatricFluidRequirement.calculate({
      weightKg: safeParseFloat(pedWeightKg),
      ageInMonths: safeParseInt(pedAgeMonths),
      hasDehydration: pedHasDehydration,
      isOnIVFluids: pedOnIVFluids,
    });
  }, [pediatricMode, pedWeightKg, pedAgeMonths, pedHasDehydration, pedOnIVFluids]);

  const pedProtein = useMemo(() => {
    if (!pediatricMode) return null;
    return PediatricProteinRequirement.calculate({
      ageInMonths: safeParseInt(pedAgeMonths),
      weightKg: safeParseFloat(pedWeightKg),
      isCriticallyIll: pedCriticallyIll,
      hasRenalImpairment: pedRenalImpairment,
      hasLiverImpairment: pedLiverImpairment,
      onCRRT: pedOnCRRT,
    });
  }, [pediatricMode, pedAgeMonths, pedWeightKg, pedCriticallyIll, pedRenalImpairment, pedLiverImpairment, pedOnCRRT]);

  const pedRFS = useMemo(() => {
    if (!pediatricMode) return null;
    return PediatricRefeedingMonitor.evaluate({
      serumPhosphorus: safeParseFloat(pedPhosphorus),
      serumPotassium: safeParseFloat(pedPotassium),
      serumMagnesium: safeParseFloat(pedMagnesium),
      weightKg: safeParseFloat(pedWeightKg),
      daysOfMalnutrition: safeParseInt(pedMalnutritionDays),
      plannedKcal: safeParseFloat(pedPlannedKcal),
    });
  }, [pediatricMode, pedPhosphorus, pedPotassium, pedMagnesium, pedWeightKg, pedMalnutritionDays, pedPlannedKcal]);

  // Psychiatric Calculations
  const psychAnorexia = useMemo(() => {
    if (!psychiatricMode || psychDiagType !== 'anorexia') return null;
    return AnorexiaNutritionalRehab.calculate({
      age: age,
      weight: safeParseFloat(psychWeight),
      targetWeight: safeParseFloat(psychTargetWeight),
      bmi: safeParseFloat(psychBmi),
      medicalStability: psychMedicalStability,
      riskLevel: psychRiskLevel,
    });
  }, [psychiatricMode, psychDiagType, psychWeight, psychTargetWeight, psychBmi, psychMedicalStability, psychRiskLevel, age]);

  const psychBulimia = useMemo(() => {
    if (!psychiatricMode || psychDiagType !== 'bulimia') return null;
    return BulimiaNutritionalPlan.calculate({
      age: age,
      weight: safeParseFloat(psychWeight),
      height: height || 165, // default 165cm if not yet loaded
      gender: ((patient?.gender as 'male' | 'female') || 'female'),
      mealFrequency: 3,
      bingeFrequency: safeParseInt(psychBingeFreq),
      purgingFrequency: safeParseInt(psychPurgeFreq),
      electrolytes: null,
    });
  }, [psychiatricMode, psychDiagType, psychWeight, psychBingeFreq, psychPurgeFreq, age, height, patient]);

  const psychArfid = useMemo(() => {
    if (!psychiatricMode || psychDiagType !== 'arfid') return null;
    return EVAvoidantRestrictiveDiet.calculate({
      age: age,
      weight: safeParseFloat(psychWeight),
      foodRestriction: psychFoodRestriction,
      anxietyLevel: psychAnxietyLevel,
      nutritionalDeficiency: ['iron'],
    });
  }, [psychiatricMode, psychDiagType, psychWeight, psychFoodRestriction, psychAnxietyLevel, age]);

  const psychInteraction = useMemo(() => {
    if (!psychiatricMode || psychDiagType !== 'psychotropic') return null;
    return PsychotropicNutrientInteractions.calculate({
      medication: psychMedication,
      nutrient: psychNutrient,
      dose: safeParseFloat(psychDose),
    });
  }, [psychiatricMode, psychDiagType, psychMedication, psychNutrient, psychDose]);

  const gestationalOutputs = useMemo(() => {
    if (diabetesType !== 'gestational') return null;
    const preBMIVal = safeParseFloat(prePregnancyBMI) || 24.5;
    const preWtVal = safeParseFloat(prePregnancyWeight) || 65;
    const weeksVal = safeParseFloat(gestationalWeeks) || 24;
    const bmrVal = calculateMifflinBMR(preWtVal, height, age, false); // always female

    const gdmRes = GestationalDiabetesEngine.calculateGDMDynamics({
      prePregnancyBMI: preBMIVal,
      currentWeightKg: weight,
      prePregnancyWeightKg: preWtVal,
      gestationalWeeks: weeksVal,
      baseCaloriesREE: bmrVal,
      activityFactor: 1.2,
    });

    const trackerRes = GestationalMetabolicTracker.evaluatePregnancyMetabolism({
      fastingBloodGlucose: safeParseFloat(fastingBG) || 90,
      twoHourPostPrandial: safeParseFloat(postPrandialBG) || 120,
      hba1c: safeParseFloat(hba1c) || 5.8,
      morningUrineKetonesPresent: ketonesPresent,
    });

    return {
      dynamics: gdmRes,
      metabolism: trackerRes,
    };
  }, [diabetesType, prePregnancyBMI, prePregnancyWeight, gestationalWeeks, weight, height, age, fastingBG, postPrandialBG, hba1c, ketonesPresent]);

  // Real-time bolus and correction estimation for Carb exchange counter (Type 1)
  const realTimeInsulinEstimations = useMemo(() => {
    if (!type1Outputs) return { bolus: 0, correction: 0, total: 0 };
    const plannedCarbsNum = safeParseFloat(plannedCarbs);
    
    // ICR factor (unit per grams)
    const icrVal = safeParseFloat(icrOverride) || type1Outputs.icr.icrValue || 15;
    const estimatedBolus = icrVal > 0 ? plannedCarbsNum / icrVal : 0;
    
    // Correction dose
    const correction = type1Outputs.isf.correctionDose || 0;
    const total = estimatedBolus + correction;

    return {
      bolus: Math.round(estimatedBolus * 10) / 10,
      correction: Math.round(correction * 10) / 10,
      total: Math.round(total * 10) / 10,
    };
  }, [type1Outputs, plannedCarbs, icrOverride]);

  // 3.2 WATERMELONDB TRANSACTION-WRITTEN AUDITING HANDLER
  const persistClinicianAdjustments = async () => {
    if (!signature.trim() || !justification.trim()) {
      showToast('الرجاء كتابة التبرير السريري والتوقيع لحفظ التعديلات', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        const plansCollection = db.get<NutritionalPlan>('nutritional_plans');

        // Compile specialized metadata structure
        const specializedPayload = {
          diabetesType,
          fastingBloodGlucose: safeParseFloat(fastingBG),
          postPrandialBloodGlucose: safeParseFloat(postPrandialBG),
          hba1c: safeParseFloat(hba1c),
          morningUrineKetonesPresent: ketonesPresent && diabetesType === 'gestational',
          lastUpdatedTimestamp: Date.now(),
          clinicianSignature: signature.trim(),
          justificationText: justification.trim(),

          // Type 1 specific fields
          ...(diabetesType === 'type_1' && {
            totalDailyInsulinDose: safeParseFloat(tdd),
            currentInsulinRegimen: insulinRegimen,
            targetBloodGlucose: safeParseFloat(targetBG) || 100,
          }),

          // Type 2 specific fields
          ...(diabetesType === 'type_2' && {
            hasInsulinResistance,
            activityFactor: safeParseFloat(activityFactor) || 1.2,
            targetWeightLossPercent: safeParseFloat(targetWeightLossPercent) || 10,
          }),

          // Gestational specific fields
          ...(diabetesType === 'gestational' && {
            gestationalWeeks: safeParseFloat(gestationalWeeks),
            prePregnancyBMI: safeParseFloat(prePregnancyBMI),
            prePregnancyWeightKg: safeParseFloat(prePregnancyWeight),
          }),

          // Audited Override values
          overrides: {
            calorieLimitOverride: calorieOverride.trim() ? parseFloat(calorieOverride) : null,
            icrOverride: icrOverride.trim() ? parseFloat(icrOverride) : null,
            carbLimitOverride: carbOverride.trim() ? parseFloat(carbOverride) : null,
          },
        };

        const metadataStr = JSON.stringify(specializedPayload);

        // Derive active target values considering overrides
        let targetCals = computedBmr * 1.2;
        if (diabetesType === 'type_2' && type2Outputs) {
          targetCals = type2Outputs.targetCalories;
        } else if (diabetesType === 'gestational' && gestationalOutputs) {
          targetCals = gestationalOutputs.dynamics.totalRecommendedCalories;
        }
        if (calorieOverride.trim()) {
          targetCals = parseFloat(calorieOverride);
        }

        let targetCarbs = 0;
        if (diabetesType === 'type_1' && type1Outputs) {
          targetCarbs = Math.round(weight * 3);
        } else if (diabetesType === 'type_2' && type2Outputs) {
          targetCarbs = type2Outputs.carbGrams;
        } else if (diabetesType === 'gestational' && gestationalOutputs) {
          targetCarbs = gestationalOutputs.dynamics.targetCarbGrams;
        }
        if (carbOverride.trim()) {
          targetCarbs = parseFloat(carbOverride);
        }

        const targetPro = weight * 1.2;
        const targetFat = (targetCals - (targetCarbs * 4) - (targetPro * 4)) / 9;

        if (latestPlan) {
          await latestPlan.update((record) => {
            record.specializedMetadata = metadataStr;
            record.targetCalories = Math.round(targetCals);
            record.carbsTarget = Math.round(targetCarbs);
            record.proteinTarget = Math.round(targetPro);
            record.fatTarget = Math.round(targetFat);
          });
        } else {
          await plansCollection.create((record) => {
            record.patientId = patientId;
            record.targetCalories = Math.round(targetCals);
            record.carbsTarget = Math.round(targetCarbs);
            record.proteinTarget = Math.round(targetPro);
            record.fatTarget = Math.round(targetFat);
            record.fluidTarget = Math.round(weight * 30);
            record.mealsJson = '[]';
            record.recommendationsJson = '[]';
            record.specializedMetadata = metadataStr;
            record.status = 'active';
          });
        }
      });

      showToast('تم حفظ التعديلات وتوقيع التبرير السريري بنجاح', 'success');
      setIsSaveModalOpen(false);
      setJustification('');
    } catch (e) {
      console.error('Failed to save adjustments:', e);
      showToast('خطأ في كتابة التعديلات بقاعدة البيانات', 'error');
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
            <ArabicText bold style={styles.headerTitle}>بوابة التغذية السريرية لمرضى السكري (NCP)</ArabicText>
            <ArabicText style={styles.headerSubtitle}>
              المريض: {patient?.fullName} | وزن: {weight}كغم | طول: {height}سم | عمر: {age}
            </ArabicText>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          {/* Mode Selector: Adult / Pediatric / Psychiatric */}
          <ArabicText style={styles.label}>وضع التشغيل:</ArabicText>
          <View style={styles.tabRow}>
            {(['adult', 'pediatric', 'psychiatric'] as const).map((mode) => {
              const isActive = mode === 'adult' ? (!pediatricMode && !psychiatricMode)
                : mode === 'pediatric' ? pediatricMode
                : psychiatricMode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => {
                    setPediatricMode(mode === 'pediatric');
                    setPsychiatricMode(mode === 'psychiatric');
                  }}
                >
                  <ArabicText bold={isActive} style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {mode === 'adult' ? 'بالغ' : mode === 'pediatric' ? 'أطفال' : 'نفسي'}
                  </ArabicText>
                </TouchableOpacity>
              );
            })}
          </View>

          {!pediatricMode && !psychiatricMode && (
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>الملف الأيضي وحالة السكري</ArabicText>
            
            {/* Segmented Tab Selector for Diabetes Type */}
            <ArabicText style={styles.label}>تصنيف السكري:</ArabicText>
            <View style={styles.tabRow}>
              {(['type_1', 'type_2', 'gestational'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.tabButton,
                    diabetesType === type && styles.tabButtonActive,
                  ]}
                  onPress={() => setDiabetesType(type)}
                >
                  <ArabicText
                    bold={diabetesType === type}
                    style={[
                      styles.tabText,
                      diabetesType === type && styles.tabTextActive,
                    ]}
                  >
                    {type === 'type_1' ? 'النوع الأول' : type === 'type_2' ? 'النوع الثاني' : 'الحملي'}
                  </ArabicText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Core Glycemic inputs grid */}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="سكر الصائم (ملغم/دل)"
                  value={fastingBG}
                  onChangeText={setFastingBG}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="سكر فاطر / عشوائي"
                  value={postPrandialBG}
                  onChangeText={setPostPrandialBG}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="معدل التراكمي HbA1c (%)"
                  value={hba1c}
                  onChangeText={setHba1c}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Additional Conditional Profile Inputs */}
            {diabetesType === 'type_1' && (
              <View style={styles.subGrid}>
                <View style={styles.gridItem}>
                  <TextInputField
                    label="إجمالي الجرعة اليومية (TDD)"
                    value={tdd}
                    onChangeText={setTdd}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gridItem}>
                  <TextInputField
                    label="مستوى السكر المستهدف"
                    value={targetBG}
                    onChangeText={setTargetBG}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {diabetesType === 'type_2' && (
              <View style={styles.switchRow}>
                <ArabicText style={styles.switchLabel}>مقاومة الإنسولين الموثقة سريراً (Insulin Resistance)</ArabicText>
                <Switch
                  value={hasInsulinResistance}
                  onValueChange={setHasInsulinResistance}
                  trackColor={{ false: '#334155', true: colors.primary }}
                  thumbColor={hasInsulinResistance ? '#ffffff' : '#94a3b8'}
                />
              </View>
            )}

            {diabetesType === 'gestational' && (
              <View>
                <View style={styles.subGrid}>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="أسابيع الحمل"
                      value={gestationalWeeks}
                      onChangeText={setGestationalWeeks}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="الوزن قبل الحمل (كغم)"
                      value={prePregnancyWeight}
                      onChangeText={setPrePregnancyWeight}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField
                      label="مؤشر كتلة الجسم قبل الحمل"
                      value={prePregnancyBMI}
                      onChangeText={setPrePregnancyBMI}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>وجود أجسام كيتونية في البول الصباحي (Urine Ketones)</ArabicText>
                  <Switch
                    value={ketonesPresent}
                    onValueChange={setKetonesPresent}
                    trackColor={{ false: '#334155', true: colors.danger }}
                    thumbColor={ketonesPresent ? '#ffffff' : '#94a3b8'}
                  />
                </View>
              </View>
            )}
          </View>
          )}

          {/* 2. CONDITIONAL METABOLIC UI RENDERING MATRIX */}

          {/* PANEL A: TYPE 1 INSULIN STRATEGY CARD */}
          {!pediatricMode && !psychiatricMode && diabetesType === 'type_1' && type1Outputs && (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <ArabicText bold style={styles.badgeText}>نشط</ArabicText>
                </View>
                <ArabicText bold style={styles.cardTitle}>لوحة حسابات الإنسولين والجرعات (Type 1)</ArabicText>
              </View>

              <View style={styles.doubleMetricContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{type1Outputs.icr.icrValue || '—'}</Text>
                  <ArabicText style={styles.metricLabel}>معامل الكربوهيدرات (ICR)</ArabicText>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{type1Outputs.isf.isfValue || '—'}</Text>
                  <ArabicText style={styles.metricLabel}>معامل حساسية الإنسولين (ISF)</ArabicText>
                </View>
              </View>

              <ArabicText style={styles.helperText}>{type1Outputs.icr.clinicalNote}</ArabicText>

              {/* Carbohydrate Exchange Counter */}
              <View style={styles.calcGrid}>
                <ArabicText bold style={styles.subSectionTitle}>عداد بدائل الكربوهيدرات التفاعلي</ArabicText>
                <View style={styles.stepperContainer}>
                  <TextInputField
                    label="كمية الكربوهيدرات المخططة للوجبة (غرام)"
                    value={plannedCarbs}
                    onChangeText={setPlannedCarbs}
                    keyboardType="numeric"
                  />
                  <View style={styles.stepperActions}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setPlannedCarbs(prev => String(Math.max(0, (parseInt(prev) || 0) - 10)))}
                    >
                      <ArabicText bold style={styles.stepBtnText}>- 10غ</ArabicText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setPlannedCarbs(prev => String((parseInt(prev) || 0) + 10))}
                    >
                      <ArabicText bold style={styles.stepBtnText}>+ 10غ</ArabicText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Real-time estimations */}
                <View style={styles.outputEstimationContainer}>
                  <View style={styles.estimationItem}>
                    <Text style={styles.estVal}>{realTimeInsulinEstimations.bolus} و</Text>
                    <ArabicText style={styles.estLabel}>جرعة الوجبة (Bolus)</ArabicText>
                  </View>
                  <View style={styles.estimationItem}>
                    <Text style={styles.estVal}>{realTimeInsulinEstimations.correction} و</Text>
                    <ArabicText style={styles.estLabel}>جرعة التصحيح (Correction)</ArabicText>
                  </View>
                  <View style={[styles.estimationItem, styles.estimationItemHighlight]}>
                    <Text style={[styles.estVal, styles.estValHighlight]}>{realTimeInsulinEstimations.total} و</Text>
                    <ArabicText bold style={styles.estLabelHighlight}>إجمالي الإنسولين السريع المطلوب</ArabicText>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* PANEL B: TYPE 2 METABOLIC DEFICIT CARD */}
          {!pediatricMode && !psychiatricMode && diabetesType === 'type_2' && type2Outputs && (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                {type2Outputs.isFloorGuardTriggered ? (
                  <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                    <ArabicText bold style={styles.badgeText}>حارس الحد الأدنى مفعل</ArabicText>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <ArabicText bold style={styles.badgeText}>مستقر</ArabicText>
                  </View>
                )}
                <ArabicText bold style={styles.cardTitle}>حسابات العجز الأيضي (Type 2)</ArabicText>
              </View>

              <View style={styles.doubleMetricContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{type2Outputs.totalEnergyExpenditure}</Text>
                  <ArabicText style={styles.metricLabel}>إجمالي حرق الطاقة اليومي (TEE)</ArabicText>
                </View>
                <View style={[styles.metricCard, type2Outputs.isFloorGuardTriggered && styles.metricCardWarning]}>
                  <Text style={styles.metricVal}>{type2Outputs.targetCalories}</Text>
                  <ArabicText style={styles.metricLabel}>السعرات المستهدفة</ArabicText>
                </View>
              </View>

              {/* Macronutrient Split Layout Bar Chart */}
              <ArabicText bold style={styles.subSectionTitle}>توزيع المغذيات الكبرى المستهدف ({hasInsulinResistance ? '45%' : '50%'} كربوهيدرات):</ArabicText>
              <View style={styles.macroProgressContainer}>
                <View style={[styles.macroBar, { flex: hasInsulinResistance ? 45 : 50, backgroundColor: '#14b8a6' }]}>
                  <ArabicText bold style={styles.macroBarText}>كربوهيدرات</ArabicText>
                  <Text style={styles.macroBarGram}>{type2Outputs.carbGrams}غ</Text>
                </View>
                <View style={[styles.macroBar, { flex: 20, backgroundColor: '#3b82f6' }]}>
                  <ArabicText bold style={styles.macroBarText}>بروتين</ArabicText>
                  <Text style={styles.macroBarGram}>{type2Outputs.proteinGrams}غ</Text>
                </View>
                <View style={[styles.macroBar, { flex: hasInsulinResistance ? 35 : 30, backgroundColor: '#eab308' }]}>
                  <ArabicText bold style={styles.macroBarText}>دهون</ArabicText>
                  <Text style={styles.macroBarGram}>{type2Outputs.fatGrams}غ</Text>
                </View>
              </View>

              {/* Recommendations list */}
              <View style={styles.alertList}>
                {type2Outputs.clinicalRecommendations.map((rec, i) => (
                  <ArabicText key={i} style={styles.alertListItem}>• {rec}</ArabicText>
                ))}
              </View>
            </View>
          )}

          {/* PANEL C: GESTATIONAL PROTECTION & KETONE HAZARD PANEL */}
          {!pediatricMode && !psychiatricMode && diabetesType === 'gestational' && gestationalOutputs && (
            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>متابعة الحمل والتمثيل الغذائي (Gestational)</ArabicText>

              {/* Flashing Crimson Ketones Warning Alert Box */}
              {ketonesPresent && (
                <Animated.View style={[styles.ketoneAlertContainer, { opacity: pulseAnim }]}>
                  <ArabicText bold style={styles.ketoneAlertText}>
                    🚨 تحذير حرج: وجود أجسام كيتونية في البول الصباحي يشير إلى كيتوزية المجاعة نتيجة التقييد المفرط للكربوهيدرات! يجب رفع حصص الكربوهيدرات المعقدة فوراً لحماية الجهاز العصبي للجنين.
                  </ArabicText>
                </Animated.View>
              )}

              {/* Projections & Limits */}
              <View style={styles.doubleMetricContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>
                    {gestationalOutputs.dynamics.targetWeightGainMinKg} - {gestationalOutputs.dynamics.targetWeightGainMaxKg} كغم
                  </Text>
                  <ArabicText style={styles.metricLabel}>زيادة الوزن المستهدفة (IOM)</ArabicText>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricVal,
                    gestationalOutputs.dynamics.actualWeightGainSoFarKg < 0 ? { color: colors.danger } : {}
                  ]}>
                    {gestationalOutputs.dynamics.actualWeightGainSoFarKg} كغم
                  </Text>
                  <ArabicText style={styles.metricLabel}>زيادة الوزن الفعلية حالياً</ArabicText>
                </View>
              </View>

              <View style={styles.pregnancyStatusContainer}>
                <ArabicText bold style={styles.subSectionTitle}>مستهدفات الطاقة والكربوهيدرات في الحمل:</ArabicText>
                <View style={styles.targetRow}>
                  <ArabicText style={styles.targetText}>السعرات الموصى بها:</ArabicText>
                  <Text style={styles.targetNum}>{gestationalOutputs.dynamics.totalRecommendedCalories} سعرة</Text>
                </View>
                <View style={styles.targetRow}>
                  <ArabicText style={styles.targetText}>مستهدف الكربوهيدرات اليومي:</ArabicText>
                  <Text style={styles.targetNum}>{gestationalOutputs.dynamics.targetCarbGrams} غرام</Text>
                </View>
                <View style={styles.targetRow}>
                  <ArabicText style={styles.targetText}>الحد الأدنى الآمن للكربوهيدرات:</ArabicText>
                  <Text style={[styles.targetNum, { color: colors.danger }]}>{gestationalOutputs.dynamics.minimumSafeCarbGrams} غرام</Text>
                </View>
              </View>

              {/* Alerts list */}
              <View style={styles.alertList}>
                {gestationalOutputs.metabolism.clinicalAlerts.map((rec, i) => (
                  <ArabicText key={i} style={[
                    styles.alertListItem, 
                    rec.includes('حرج') ? { color: colors.danger } : {}
                  ]}>• {rec}</ArabicText>
                ))}
              </View>
            </View>
          )}

          {/* 3. TRANSACTION WRAPPED OVERRIDE LAYER */}
          {!pediatricMode && !psychiatricMode && (
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>تعديل وتجاوز المعايير الغذائية (السريرية)</ArabicText>
            
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز السعرات اليومية"
                  value={calorieOverride}
                  onChangeText={setCalorieOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              {diabetesType === 'type_1' && (
                <View style={styles.gridItem}>
                  <TextInputField
                    label="تجاوز ICR"
                    value={icrOverride}
                    onChangeText={setIcrOverride}
                    keyboardType="numeric"
                    placeholder="تلقائي"
                  />
                </View>
              )}
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز الكربوهيدرات (غ)"
                  value={carbOverride}
                  onChangeText={setCarbOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
            </View>

            <Button
              title="حفظ التعديلات والتوقيع سريرياً"
              onPress={() => setIsSaveModalOpen(true)}
              variant="primary"
            />
          </View>
          )}

          {/* 4. PEDIATRIC CALCULATOR PANELS */}
          {pediatricMode && (
            <>
              {/* PEDIATRIC INPUT CARD */}
              <View style={styles.card}>
                <ArabicText bold style={styles.cardTitle}>حسابات تغذية الأطفال (Pediatric)</ArabicText>
                <View style={styles.grid}>
                  <View style={styles.gridItem}>
                    <TextInputField label="العمر (شهر)" value={pedAgeMonths} onChangeText={setPedAgeMonths} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField label="الوزن (كغم)" value={pedWeightKg} onChangeText={setPedWeightKg} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField label="الطول (سم)" value={pedHeightCm} onChangeText={setPedHeightCm} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <ArabicText style={styles.label}>الجنس:</ArabicText>
                    <View style={styles.tabRow}>
                      {(['MALE', 'FEMALE'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.tabButton, pedGender === g && styles.tabButtonActive]}
                          onPress={() => setPedGender(g)}
                        >
                          <ArabicText bold={pedGender === g} style={[styles.tabText, pedGender === g && styles.tabTextActive]}>
                            {g === 'MALE' ? 'ذكر' : 'أنثى'}
                          </ArabicText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>حالة حرجة</ArabicText>
                  <Switch value={pedCriticallyIll} onValueChange={setPedCriticallyIll} trackColor={{ false: '#334155', true: colors.primary }} thumbColor="#ffffff" />
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>حمى</ArabicText>
                  <Switch value={pedHasFever} onValueChange={setPedHasFever} trackColor={{ false: '#334155', true: colors.warning }} thumbColor="#ffffff" />
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>جفاف (Dehydration)</ArabicText>
                  <Switch value={pedHasDehydration} onValueChange={setPedHasDehydration} trackColor={{ false: '#334155', true: colors.warning }} thumbColor="#ffffff" />
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>قصور كلوي</ArabicText>
                  <Switch value={pedRenalImpairment} onValueChange={setPedRenalImpairment} trackColor={{ false: '#334155', true: colors.danger }} thumbColor="#ffffff" />
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>قصور كبدي</ArabicText>
                  <Switch value={pedLiverImpairment} onValueChange={setPedLiverImpairment} trackColor={{ false: '#334155', true: colors.danger }} thumbColor="#ffffff" />
                </View>
                <View style={styles.switchRow}>
                  <ArabicText style={styles.switchLabel}>غسيل كلوي مستمر (CRRT)</ArabicText>
                  <Switch value={pedOnCRRT} onValueChange={setPedOnCRRT} trackColor={{ false: '#334155', true: colors.primary }} thumbColor="#ffffff" />
                </View>
              </View>

              {/* PEDIATRIC RFS INPUT CARD */}
              <View style={styles.card}>
                <ArabicText bold style={styles.cardTitle}>متابعة متلازمة إعادة التغذية للأطفال</ArabicText>
                <View style={styles.grid}>
                  <View style={styles.gridItem}>
                    <TextInputField label="الفوسفور (ملغم/دل)" value={pedPhosphorus} onChangeText={setPedPhosphorus} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField label="البوتاسيوم (ملغم/دل)" value={pedPotassium} onChangeText={setPedPotassium} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField label="المغنيسيوم (ملغم/دل)" value={pedMagnesium} onChangeText={setPedMagnesium} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField label="أيام سوء التغذية" value={pedMalnutritionDays} onChangeText={setPedMalnutritionDays} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridItem}>
                    <TextInputField label="السعرات المخططة" value={pedPlannedKcal} onChangeText={setPedPlannedKcal} keyboardType="numeric" />
                  </View>
                </View>
              </View>

              {/* ENERGY OUTPUT */}
              {pedEER && (
                <View style={styles.card}>
                  <ArabicText bold style={styles.cardTitle}>الطاقة (EER)</ArabicText>
                  <View style={styles.doubleMetricContainer}>
                    <View style={pedEER.isSafe ? styles.metricCard : [styles.metricCard, styles.metricCardWarning]}>
                      <Text style={styles.metricVal}>{pedEER.eerKcal}</Text>
                      <ArabicText style={styles.metricLabel}>سعرة/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{pedEER.kcalPerKg}</Text>
                      <ArabicText style={styles.metricLabel}>سعرة/كغ/يوم</ArabicText>
                    </View>
                  </View>
                  {!pedEER.isSafe && (
                    <ArabicText style={[styles.helperText, { color: colors.danger }]}>{pedEER.appliedAdjustment}</ArabicText>
                  )}
                  <ArabicText style={styles.helperText}>{pedEER.appliedAdjustment}</ArabicText>
                </View>
              )}

              {/* FLUID OUTPUT */}
              {pedFluid && (
                <View style={styles.card}>
                  <ArabicText bold style={styles.cardTitle}>السوائل (Holliday-Segar)</ArabicText>
                  <View style={styles.doubleMetricContainer}>
                    <View style={pedFluid.isSafe ? styles.metricCard : [styles.metricCard, styles.metricCardWarning]}>
                      <Text style={styles.metricVal}>{pedFluid.dailyFluidMl}</Text>
                      <ArabicText style={styles.metricLabel}>مل/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{pedFluid.mlPerKg}</Text>
                      <ArabicText style={styles.metricLabel}>مل/كغ/يوم</ArabicText>
                    </View>
                  </View>
                  {!pedFluid.isSafe && <ArabicText style={[styles.helperText, { color: colors.danger }]}>{pedFluid.source}</ArabicText>}
                  <ArabicText style={styles.helperText}>{pedFluid.source}</ArabicText>
                </View>
              )}

              {/* PROTEIN OUTPUT */}
              {pedProtein && (
                <View style={styles.card}>
                  <ArabicText bold style={styles.cardTitle}>البروتين (ESPGHAN/ESPEN)</ArabicText>
                  <View style={styles.doubleMetricContainer}>
                    <View style={pedProtein.isSafe ? styles.metricCard : [styles.metricCard, styles.metricCardWarning]}>
                      <Text style={styles.metricVal}>{pedProtein.proteinGramsPerDay}</Text>
                      <ArabicText style={styles.metricLabel}>غرام بروتين/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{pedProtein.gPerKg}</Text>
                      <ArabicText style={styles.metricLabel}>غ/كغ/يوم</ArabicText>
                    </View>
                  </View>
                  {!pedProtein.isSafe && <ArabicText style={[styles.helperText, { color: colors.danger }]}>{pedProtein.guidelineSource}</ArabicText>}
                  <ArabicText style={styles.helperText}>{pedProtein.guidelineSource}</ArabicText>
                </View>
              )}

              {/* RFS OUTPUT */}
              {pedRFS && (
                <View style={styles.card}>
                  <ArabicText bold style={styles.cardTitle}>متلازمة إعادة التغذية للطفل</ArabicText>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, {
                      backgroundColor: pedRFS.riskTier === 'critical' ? colors.danger : pedRFS.riskTier === 'moderate' ? colors.warning : colors.success
                    }]}>
                      <ArabicText bold style={styles.badgeText}>
                        {pedRFS.riskTier === 'critical' ? 'خطر شديد' : pedRFS.riskTier === 'moderate' ? 'خطر متوسط' : 'خطر منخفض'}
                      </ArabicText>
                    </View>
                    <ArabicText bold style={styles.cardTitle}>حالة الطفل</ArabicText>
                  </View>
                  <View style={styles.doubleMetricContainer}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{pedRFS.adjustedKcal}</Text>
                      <ArabicText style={styles.metricLabel}>السعرات المعدلة/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{pedRFS.isCapApplied ? 'نعم' : 'لا'}</Text>
                      <ArabicText style={styles.metricLabel}>تم تطبيق السقف</ArabicText>
                    </View>
                  </View>
                  <View style={styles.alertList}>
                    {pedRFS.alerts.map((alert, i) => (
                      <ArabicText key={i} style={[styles.alertListItem, alert.includes('شديد') ? { color: colors.danger } : {}]}>• {alert}</ArabicText>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* 5. PSYCHIATRIC CALCULATOR PANELS */}
          {psychiatricMode && (
            <>
              {/* PSYCHIATRIC DIAGNOSIS TYPE SELECTOR */}
              <View style={styles.card}>
                <ArabicText bold style={styles.cardTitle}>حسابات التغذية النفسية (Psychiatric)</ArabicText>
                <ArabicText style={styles.label}>نوع الاضطراب:</ArabicText>
                <View style={styles.tabRow}>
                  {(['anorexia', 'bulimia', 'arfid', 'psychotropic'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.tabButton,
                        psychDiagType === type && styles.tabButtonActive,
                        type === 'psychotropic' && { flex: 1.5 },
                      ]}
                      onPress={() => setPsychDiagType(type)}
                    >
                      <ArabicText
                        bold={psychDiagType === type}
                        style={[styles.tabText, psychDiagType === type && styles.tabTextActive]}
                      >
                        {type === 'anorexia' ? 'فقدان شهية' : type === 'bulimia' ? 'نهام' : type === 'arfid' ? 'ARFID' : 'تفاعل دوائي'}
                      </ArabicText>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.grid}>
                  <View style={styles.gridItem}>
                    <TextInputField label="الوزن (كغم)" value={psychWeight} onChangeText={setPsychWeight} keyboardType="numeric" />
                  </View>
                  {psychDiagType === 'anorexia' && (
                    <>
                      <View style={styles.gridItem}>
                        <TextInputField label="الوزن المستهدف (كغم)" value={psychTargetWeight} onChangeText={setPsychTargetWeight} keyboardType="numeric" />
                      </View>
                      <View style={styles.gridItem}>
                        <TextInputField label="مؤشر كتلة الجسم (BMI)" value={psychBmi} onChangeText={setPsychBmi} keyboardType="numeric" />
                      </View>
                    </>
                  )}
                  {psychDiagType === 'bulimia' && (
                    <>
                      <View style={styles.gridItem}>
                        <TextInputField label="نوبات الشراهة/أسبوع" value={psychBingeFreq} onChangeText={setPsychBingeFreq} keyboardType="numeric" />
                      </View>
                      <View style={styles.gridItem}>
                        <TextInputField label="نوبات التطهير/أسبوع" value={psychPurgeFreq} onChangeText={setPsychPurgeFreq} keyboardType="numeric" />
                      </View>
                    </>
                  )}
                  {psychDiagType === 'psychotropic' && (
                    <>
                      <View style={styles.gridItem}>
                        <TextInputField label="الدواء" value={psychMedication} onChangeText={setPsychMedication} />
                      </View>
                      <View style={styles.gridItem}>
                        <TextInputField label="المغذي" value={psychNutrient} onChangeText={setPsychNutrient} />
                      </View>
                      <View style={styles.gridItem}>
                        <TextInputField label="الجرعة (ملغم/يوم)" value={psychDose} onChangeText={setPsychDose} keyboardType="numeric" />
                      </View>
                    </>
                  )}
                </View>
                {psychDiagType === 'anorexia' && (
                  <>
                    <ArabicText style={styles.label}>الاستقرار الطبي:</ArabicText>
                    <View style={styles.tabRow}>
                      {(['stable', 'unstable'] as const).map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.tabButton, psychMedicalStability === s && styles.tabButtonActive]}
                          onPress={() => setPsychMedicalStability(s)}
                        >
                          <ArabicText bold={psychMedicalStability === s} style={[styles.tabText, psychMedicalStability === s && styles.tabTextActive]}>
                            {s === 'stable' ? 'مستقر' : 'غير مستقر'}
                          </ArabicText>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <ArabicText style={styles.label}>مستوى الخطورة:</ArabicText>
                    <View style={styles.tabRow}>
                      {(['low', 'moderate', 'high'] as const).map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.tabButton, psychRiskLevel === r && styles.tabButtonActive]}
                          onPress={() => setPsychRiskLevel(r)}
                        >
                          <ArabicText bold={psychRiskLevel === r} style={[styles.tabText, psychRiskLevel === r && styles.tabTextActive]}>
                            {r === 'low' ? 'منخفض' : r === 'moderate' ? 'متوسط' : 'مرتفع'}
                          </ArabicText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                {psychDiagType === 'arfid' && (
                  <>
                    <ArabicText style={styles.label}>مستوى تقييد الطعام:</ArabicText>
                    <View style={styles.tabRow}>
                      {(['low', 'moderate', 'high'] as const).map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.tabButton, psychFoodRestriction === r && styles.tabButtonActive]}
                          onPress={() => setPsychFoodRestriction(r)}
                        >
                          <ArabicText bold={psychFoodRestriction === r} style={[styles.tabText, psychFoodRestriction === r && styles.tabTextActive]}>
                            {r === 'low' ? 'خفيف' : r === 'moderate' ? 'متوسط' : 'شديد'}
                          </ArabicText>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <ArabicText style={styles.label}>مستوى القلق:</ArabicText>
                    <View style={styles.tabRow}>
                      {(['low', 'moderate', 'high'] as const).map((a) => (
                        <TouchableOpacity
                          key={a}
                          style={[styles.tabButton, psychAnxietyLevel === a && styles.tabButtonActive]}
                          onPress={() => setPsychAnxietyLevel(a)}
                        >
                          <ArabicText bold={psychAnxietyLevel === a} style={[styles.tabText, psychAnxietyLevel === a && styles.tabTextActive]}>
                            {a === 'low' ? 'خفيف' : a === 'moderate' ? 'متوسط' : 'شديد'}
                          </ArabicText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* ANOREXIA OUTPUT */}
              {psychAnorexia && (
                <View style={styles.card}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: psychAnorexia.supervisionLevel === 'inpatient' ? colors.danger : psychAnorexia.supervisionLevel === 'dayPatient' ? colors.warning : colors.success }]}>
                      <ArabicText bold style={styles.badgeText}>
                        {psychAnorexia.supervisionLevel === 'inpatient' ? 'منوم' : psychAnorexia.supervisionLevel === 'dayPatient' ? 'نهاري' : 'عيادة خارجية'}
                      </ArabicText>
                    </View>
                    <ArabicText bold style={styles.cardTitle}>خطة التأهيل الغذائي (NICE CG9)</ArabicText>
                  </View>
                  <View style={styles.doubleMetricContainer}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychAnorexia.startCalories}</Text>
                      <ArabicText style={styles.metricLabel}>سعرات البداية/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychAnorexia.increasePerDay}</Text>
                      <ArabicText style={styles.metricLabel}>زيادة/يوم (سعرة)</ArabicText>
                    </View>
                  </View>
                  <View style={styles.doubleMetricContainer}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychAnorexia.weeklyIncrease}</Text>
                      <ArabicText style={styles.metricLabel}>زيادة الوزن/أسبوع (كغم)</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>
                        {psychAnorexia.supervisionLevel === 'inpatient' ? 'منوم' : psychAnorexia.supervisionLevel === 'dayPatient' ? 'نهاري' : 'عيادة خارجية'}
                      </Text>
                      <ArabicText style={styles.metricLabel}>مستوى الإشراف</ArabicText>
                    </View>
                  </View>
                </View>
              )}

              {/* BULIMIA OUTPUT */}
              {psychBulimia && (
                <View style={styles.card}>
                  <ArabicText bold style={styles.cardTitle}>الخطة الغذائية للنهام العصبي (APA 2022)</ArabicText>
                  <View style={styles.doubleMetricContainer}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychBulimia.targetCalories}</Text>
                      <ArabicText style={styles.metricLabel}>السعرات المستهدفة/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychBulimia.mealFrequency + psychBulimia.snackFrequency}</Text>
                      <ArabicText style={styles.metricLabel}>وجبات + سناك/يوم</ArabicText>
                    </View>
                  </View>
                  <ArabicText style={styles.helperText}>{psychBulimia.regularitySchedule}</ArabicText>
                </View>
              )}

              {/* ARFID OUTPUT */}
              {psychArfid && (
                <View style={styles.card}>
                  <ArabicText bold style={styles.cardTitle}>خطة ARFID (DSM-5-TR)</ArabicText>
                  <View style={styles.doubleMetricContainer}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychArfid.targetCalories}</Text>
                      <ArabicText style={styles.metricLabel}>سعرة/يوم</ArabicText>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychArfid.proteinGrams}</Text>
                      <ArabicText style={styles.metricLabel}>غرام بروتين/يوم</ArabicText>
                    </View>
                  </View>
                  <View style={styles.doubleMetricContainer}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricVal}>{psychArfid.exposureFoods}</Text>
                      <ArabicText style={styles.metricLabel}>أطعمة جديدة/أسبوع</ArabicText>
                    </View>
                    <View style={[styles.metricCard, styles.estimationItemHighlight, { flex: 2 }]}>
                      <ArabicText style={styles.estLabelHighlight}>{psychArfid.therapyType}</ArabicText>
                      <ArabicText style={styles.metricLabel}>العلاج الموصى به</ArabicText>
                    </View>
                  </View>
                </View>
              )}

              {/* PSYCHOTROPIC INTERACTION OUTPUT */}
              {psychInteraction && (
                <View style={styles.card}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, {
                      backgroundColor: psychInteraction.interactionLevel === 'severe' ? colors.danger : psychInteraction.interactionLevel === 'moderate' ? colors.warning : psychInteraction.interactionLevel === 'mild' ? '#14b8a6' : colors.success
                    }]}>
                      <ArabicText bold style={styles.badgeText}>
                        {psychInteraction.interactionLevel === 'severe' ? 'شديد' : psychInteraction.interactionLevel === 'moderate' ? 'متوسط' : psychInteraction.interactionLevel === 'mild' ? 'خفيف' : 'لا يوجد'}
                      </ArabicText>
                    </View>
                    <ArabicText bold style={styles.cardTitle}>تفاعل الدواء مع المغذيات (Maudsley)</ArabicText>
                  </View>
                  <View style={styles.alertList}>
                    <ArabicText style={styles.alertListItem}>• القيد الغذائي: {psychInteraction.restriction}</ArabicText>
                    <ArabicText style={styles.alertListItem}>• المراقبة: {psychInteraction.monitor}</ArabicText>
                    {psychInteraction.alternative && (
                      <ArabicText style={[styles.alertListItem, { color: colors.warning }]}>• بديل مقترح: {psychInteraction.alternative}</ArabicText>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

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
              <ArabicText bold style={styles.modalTitle}>إقرار التعديل والتجاوز السريري</ArabicText>
              <ArabicText style={styles.modalDescription}>
                يتطلب تغيير معايير السكري الغذائية وحفظها تبريراً سريرياً وتوقيع الأخصائي في سجل التدقيق الأمني.
              </ArabicText>

              <TextInputField
                label="التبرير السريري للتجاوز (السبب الطبي)"
                value={justification}
                onChangeText={setJustification}
                placeholder="أدخل مبرر التغيير السريري..."
                multiline
              />

              <TextInputField
                label="اسم الأخصائي المعالج (التوقيع الإلكتروني)"
                value={signature}
                onChangeText={setSignature}
                placeholder="اسم الأخصائي..."
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
                  title="توقيع وحفظ السجل"
                  onPress={persistClinicianAdjustments}
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
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
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
  subGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primaryContrast,
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
  metricCardWarning: {
    borderColor: colors.warning,
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  calcGrid: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subSectionTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepperContainer: {
    marginBottom: spacing.md,
  },
  stepperActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  stepBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  stepBtnText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  outputEstimationContainer: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  estimationItem: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    alignItems: 'center',
  },
  estimationItemHighlight: {
    backgroundColor: 'rgba(27, 107, 74, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  estVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  estValHighlight: {
    color: colors.success,
  },
  estLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  estLabelHighlight: {
    fontSize: 10,
    color: colors.success,
    marginTop: 2,
    textAlign: 'center',
  },
  macroProgressContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  macroBar: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  macroBarText: {
    fontSize: 10,
    color: colors.primaryContrast,
  },
  macroBarGram: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primaryContrast,
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
  },
  ketoneAlertContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ketoneAlertText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 20,
    textAlign: 'right',
  },
  pregnancyStatusContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  targetText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  targetNum: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
