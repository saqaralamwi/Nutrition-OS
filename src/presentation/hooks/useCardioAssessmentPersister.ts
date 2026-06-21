import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { watchQuery } from '../../data/database/observe';
import type { ICardiovascularAssessment, EdemaGrading } from '../../data/types/cardiovascular';
import CardioAssessmentRecord from '../../data/models/CardiovascularAssessment';
import { clinicalEventBus, PatientMetric } from '../../services/ClinicalEventBus';

export interface CardioFormState {
  systolicBp: string;
  diastolicBp: string;
  heartRate: string;
  totalCholesterol: string;
  ldlCholesterol: string;
  hdlCholesterol: string;
  triglycerides: string;
  dryWeight: string;
  edemaGrading: EdemaGrading;
  hasDyspnea: boolean;
  hasOrthopnea: boolean;
  dashLowSodium: boolean;
  dashLowSaturatedFat: boolean;
  dashFruitVeg: boolean;
  dashWholeGrains: boolean;
  dashLeanProtein: boolean;
  dashLowSugar: boolean;
  dashModerateAlcohol: boolean;
  dashDailyExercise: boolean;
}

export interface RiskDisplay {
  status: string;
  color: string;
  alerts: string[];
  fluidRestriction: number;
}

export interface CardioComputedValues {
  dashScore: number;
  riskResult: RiskDisplay;
}

function createDefaultFormState(): CardioFormState {
  return {
    systolicBp: '',
    diastolicBp: '',
    heartRate: '',
    totalCholesterol: '',
    ldlCholesterol: '',
    hdlCholesterol: '',
    triglycerides: '',
    dryWeight: '',
    edemaGrading: 'none',
    hasDyspnea: false,
    hasOrthopnea: false,
    dashLowSodium: false,
    dashLowSaturatedFat: false,
    dashFruitVeg: false,
    dashWholeGrains: false,
    dashLeanProtein: false,
    dashLowSugar: false,
    dashModerateAlcohol: false,
    dashDailyExercise: false,
  };
}

function seedFromAssessment(a: ICardiovascularAssessment): CardioFormState {
  return {
    systolicBp: String(a.systolicBloodPressure ?? ''),
    diastolicBp: String(a.diastolicBloodPressure ?? ''),
    heartRate: String(a.heartRate ?? ''),
    totalCholesterol: String(a.totalCholesterol ?? ''),
    ldlCholesterol: String(a.ldlCholesterol ?? ''),
    hdlCholesterol: String(a.hdlCholesterol ?? ''),
    triglycerides: String(a.triglycerides ?? ''),
    dryWeight: String(a.measuredDryWeightKg ?? ''),
    edemaGrading: a.edemaGrading ?? 'none',
    hasDyspnea: a.hasDyspnea ?? false,
    hasOrthopnea: a.hasOrthopnea ?? false,
    dashLowSodium: a.dashLowSodium ?? false,
    dashLowSaturatedFat: a.dashLowSaturatedFat ?? false,
    dashFruitVeg: a.dashFruitVeg ?? false,
    dashWholeGrains: a.dashWholeGrains ?? false,
    dashLeanProtein: a.dashLeanProtein ?? false,
    dashLowSugar: a.dashLowSugar ?? false,
    dashModerateAlcohol: a.dashModerateAlcohol ?? false,
    dashDailyExercise: a.dashDailyExercise ?? false,
  };
}

function formMatchesSnapshot(state: CardioFormState, snapshot: ICardiovascularAssessment | null): boolean {
  if (!snapshot) return false;
  const seed = seedFromAssessment(snapshot);
  return (
    seed.systolicBp === state.systolicBp &&
    seed.diastolicBp === state.diastolicBp &&
    seed.heartRate === state.heartRate &&
    seed.totalCholesterol === state.totalCholesterol &&
    seed.ldlCholesterol === state.ldlCholesterol &&
    seed.hdlCholesterol === state.hdlCholesterol &&
    seed.triglycerides === state.triglycerides &&
    seed.dryWeight === state.dryWeight &&
    seed.edemaGrading === state.edemaGrading &&
    seed.hasDyspnea === state.hasDyspnea &&
    seed.hasOrthopnea === state.hasOrthopnea &&
    seed.dashLowSodium === state.dashLowSodium &&
    seed.dashLowSaturatedFat === state.dashLowSaturatedFat &&
    seed.dashFruitVeg === state.dashFruitVeg &&
    seed.dashWholeGrains === state.dashWholeGrains &&
    seed.dashLeanProtein === state.dashLeanProtein &&
    seed.dashLowSugar === state.dashLowSugar &&
    seed.dashModerateAlcohol === state.dashModerateAlcohol &&
    seed.dashDailyExercise === state.dashDailyExercise
  );
}

function computeRisk(state: CardioFormState): RiskDisplay {
  const sbp = parseFloat(state.systolicBp);
  const dbp = parseFloat(state.diastolicBp);
  const tc = parseFloat(state.totalCholesterol);
  const ldl = parseFloat(state.ldlCholesterol);
  const hdl = parseFloat(state.hdlCholesterol);
  const tg = parseFloat(state.triglycerides);
  const hr = parseFloat(state.heartRate);

  const dashScore = [
    state.dashLowSodium, state.dashLowSaturatedFat, state.dashFruitVeg,
    state.dashWholeGrains, state.dashLeanProtein, state.dashLowSugar,
    state.dashModerateAlcohol, state.dashDailyExercise,
  ].filter(Boolean).length;

  const warnings: string[] = [];

  if (sbp >= 180 || dbp >= 120) {
    warnings.push('🚨 أزمة فرط ضغط دم (Hypertensive Crisis) — تدخل طبي فوري مطلوب');
  } else if (sbp >= 140 || dbp >= 90) {
    warnings.push('⚠️ المرحلة الثانية من ارتفاع الضغط — يحتاج علاج دوائي');
  } else if (sbp >= 130 || dbp >= 85) {
    warnings.push('⚠️ المرحلة الأولى من ارتفاع الضغط — يستلزم متابعة');
  } else if (sbp >= 120 && sbp < 130) {
    warnings.push('⚠️ ضغط دم مرتفع (Elevated) — يستلزم تغيير نمط الحياة');
  }

  if (tc > 0 && (tc >= 240 || ldl >= 160 || tg >= 200)) {
    warnings.push('🚨 فرط شحوم الدم مرتفع الخطورة (High-Risk Dyslipidemia)');
  } else if (tc > 0 && (tc >= 200 || ldl >= 130 || tg >= 150)) {
    warnings.push('⚠️ فرط شحوم الدم حدودي (Borderline Dyslipidemia)');
  }

  if (hdl > 0 && hdl < 40) {
    warnings.push('⚠️ HDL منخفض — خطر قلبي وعائي مرتفع');
  }

  if (hr > 0 && hr > 100) {
    warnings.push('⚠️ تسرع القلب (Tachycardia) — معدل النبض فوق 100/دقيقة');
  }
  if (hr > 0 && hr < 50) {
    warnings.push('⚠️ بطء القلب (Bradycardia) — معدل النبض أقل من 50/دقيقة');
  }

  if (dashScore < 5) {
    warnings.push('📋 الامتثال لنظام DASH الغذائي منخفض — تحتاج استشارة تغذوية عاجلة');
  }

  let fluidRestriction = 0;
  if (state.edemaGrading !== 'none' || state.hasDyspnea || state.hasOrthopnea) {
    fluidRestriction = 1500;
    if (state.edemaGrading === '3+' || state.edemaGrading === '4+' || state.hasDyspnea || state.hasOrthopnea) {
      fluidRestriction = 1000;
    }
    warnings.push(`💧 تقييد السوائل: ${fluidRestriction} مل/يوم بناءً على حالة الاحتقان`);
  }

  let status: string;
  let color: string;

  if (warnings.some((w) => w.startsWith('🚨'))) {
    status = 'إنذار أحمر — خطر مرتفع';
    color = '#EF4444';
  } else if (warnings.some((w) => w.startsWith('⚠️'))) {
    status = 'تنبيه أصفر — بحاجة لمتابعة';
    color = '#F59E0B';
  } else {
    status = 'مستقر — أخضر';
    color = '#10B981';
  }

  return { status, color, alerts: warnings, fluidRestriction };
}

export function useCardioAssessmentPersister(patientId: string) {
  const [formState, setFormState] = useState<CardioFormState>(createDefaultFormState);
  const [dbSnapshot, setDbSnapshot] = useState<ICardiovascularAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  const hasSeeded = useRef(false);
  const formStateRef = useRef(formState);
  formStateRef.current = formState;

  useEffect(() => {
    hasSeeded.current = false;
    setIsLoading(true);
    let subscription: any = null;
    let active = true;

    (async () => {
      try {
        const db = await getDatabase();
        if (!active) return;
        subscription = db
          .get('cardiovascular_assessments')
          .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', 'desc'))
          .observe()
          .subscribe({
            next: (records: any[]) => {
              if (!active) return;
              if (records.length > 0) {
                const domain = records[0].toDomain() as ICardiovascularAssessment;
                setDbSnapshot(domain);
                if (!hasSeeded.current) {
                  setFormState(seedFromAssessment(domain));
                  hasSeeded.current = true;
                }
              } else {
                setDbSnapshot(null);
                if (!hasSeeded.current) {
                  hasSeeded.current = true;
                }
              }
              setIsLoading(false);
            },
            error: () => {
              if (active) setIsLoading(false);
            },
          });
      } catch {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [patientId]);

  useEffect(() => {
    const relevant: PatientMetric[] = ['weightKg'];
    const subs = relevant.map((metric) =>
      clinicalEventBus.onMetric(patientId, metric).subscribe(() => {
        setRevision((v) => v + 1);
      }),
    );
    return () => subs.forEach((s) => s.unsubscribe());
  }, [patientId]);

  const writeToDb = useCallback(
    async (state: CardioFormState) => {
      setIsSaving(true);
      try {
        const db = await getDatabase();
        const sbp = parseFloat(state.systolicBp) || 0;
        const dbp = parseFloat(state.diastolicBp) || 0;
        const hr = parseFloat(state.heartRate) || 0;
        const tc = parseFloat(state.totalCholesterol) || 0;
        const ldl = parseFloat(state.ldlCholesterol) || 0;
        const hdl = parseFloat(state.hdlCholesterol) || 0;
        const tg = parseFloat(state.triglycerides) || 0;
        const dw = parseFloat(state.dryWeight) || 0;

        await db.write(async () => {
          const collection = db.get('cardiovascular_assessments');

          const copyFields = (record: any) => {
            record.patientId = patientId;
            record.systolicBloodPressure = sbp;
            record.diastolicBloodPressure = dbp;
            record.heartRate = hr;
            record.totalCholesterol = tc;
            record.ldlCholesterol = ldl;
            record.hdlCholesterol = hdl;
            record.triglycerides = tg;
            record.measuredDryWeightKg = dw;
            record.hasPeripheralEdema = state.edemaGrading !== 'none';
            record.edemaGrading = state.edemaGrading;
            record.hasDyspnea = state.hasDyspnea;
            record.hasOrthopnea = state.hasOrthopnea;
            record.dashLowSodium = state.dashLowSodium;
            record.dashLowSaturatedFat = state.dashLowSaturatedFat;
            record.dashFruitVeg = state.dashFruitVeg;
            record.dashWholeGrains = state.dashWholeGrains;
            record.dashLeanProtein = state.dashLeanProtein;
            record.dashLowSugar = state.dashLowSugar;
            record.dashModerateAlcohol = state.dashModerateAlcohol;
            record.dashDailyExercise = state.dashDailyExercise;
            record.recordedAt = new Date();
          };

          await collection.create((record: any) => {
            copyFields(record);
            record.createdAt = new Date();
            record.updatedAt = new Date();
          });
        });

        const records = await db
          .get<CardioAssessmentRecord>('cardiovascular_assessments')
          .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', 'desc'))
          .fetch();
        if (records.length > 0) {
          setDbSnapshot(records[0].toDomain());
        }
      } catch (e) {
        console.error('[CardioPersister] Write failed:', e);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [patientId],
  );

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      writeToDb(formStateRef.current).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [formState, isLoading, writeToDb]);

  const setField = useCallback(
    <K extends keyof CardioFormState>(field: K, value: CardioFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const saveImmediate = useCallback(async () => {
    setIsSaving(true);
    try {
      await writeToDb(formStateRef.current);
    } catch (e) {
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [writeToDb]);

  const isDirty = useMemo(
    () => !formMatchesSnapshot(formState, dbSnapshot),
    [formState, dbSnapshot],
  );

  const computed = useMemo((): CardioComputedValues => {
    const dashScore = [
      formState.dashLowSodium, formState.dashLowSaturatedFat, formState.dashFruitVeg,
      formState.dashWholeGrains, formState.dashLeanProtein, formState.dashLowSugar,
      formState.dashModerateAlcohol, formState.dashDailyExercise,
    ].filter(Boolean).length;

    const riskResult = computeRisk(formState);

    return { dashScore, riskResult };
  }, [formState, revision]);

  return {
    formState,
    setField,
    computed,
    isDirty,
    isSaving,
    isLoading,
    saveImmediate,
  };
}
