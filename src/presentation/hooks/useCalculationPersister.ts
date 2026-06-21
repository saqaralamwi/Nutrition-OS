import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';
import CalculationModel from '../../data/models/Calculation';
import type { CalculationInputValues, CalculationResult } from '../../domain/entities/Calculation';
import {
  calculateHarrisBenedictBMR,
  calculateMifflinStJeorBMR,
  calculateVentilatedREE,
  KAU_ILLNESS_MATRIX,
  calculateHollidaySegarFluid,
  calculateGUR,
} from '../../domain/utils/kauRequirementsEngine';
import { clinicalEventBus, PatientMetric } from '../../services/ClinicalEventBus';

const DRAFT_TYPE = 'calculation_inputs';

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  comatose: 1.1,
  sedentary: 1.2,
  active: 1.3,
  very_active: 1.5,
};

export interface CalculationFormState {
  weightKg: string;
  heightCm: string;
  activityLevel: string;
  stressFactor: string;
  mechanicallyVentilated: boolean;
  trauma: boolean;
  burn: boolean;
  ve: string;
  tmax: string;
  fever: boolean;
  currentTemp: string;
  tempUnit: 'C' | 'F';
  selectedIllness: string;
  enteralVolume: string;
  enteralHours: string;
  pnVolume: string;
  pnDextrosePercent: string;
}

export interface IllnessDetails {
  rule: typeof KAU_ILLNESS_MATRIX[string];
  targetKcalMin: number;
  targetKcalMax: number;
  targetProteinMin: number;
  targetProteinMax: number;
}

export interface CalculationComputedValues {
  bmi: number;
  mifflinBMR: number;
  harrisBMR: number;
  ventilatedREE: { value: number; formulaName: string } | null;
  feverFactor: number;
  activityFactor: number;
  injuryFactor: number;
  calculatedTEE: number;
  illnessDetails: IllnessDetails | null;
  fluidHollidaySegar: number;
  fluidRda: number;
  enteralFeedingRate: number;
  gurResult: { gur: number; isSafe: boolean } | null;
}

const DEFAULT_FORM_STATE: CalculationFormState = {
  weightKg: '70',
  heightCm: '170',
  activityLevel: 'sedentary',
  stressFactor: '1.0',
  mechanicallyVentilated: false,
  trauma: false,
  burn: false,
  ve: '8.0',
  tmax: '37.0',
  fever: false,
  currentTemp: '37.0',
  tempUnit: 'C',
  selectedIllness: '',
  enteralVolume: '',
  enteralHours: '24',
  pnVolume: '',
  pnDextrosePercent: '',
};

function inputValuesToFormState(iv: CalculationInputValues): CalculationFormState {
  return {
    weightKg: iv.weightKg != null ? String(iv.weightKg) : DEFAULT_FORM_STATE.weightKg,
    heightCm: iv.heightCm != null ? String(iv.heightCm) : DEFAULT_FORM_STATE.heightCm,
    activityLevel: iv.activityLevel ?? DEFAULT_FORM_STATE.activityLevel,
    stressFactor: iv.stressFactor != null ? String(iv.stressFactor) : DEFAULT_FORM_STATE.stressFactor,
    mechanicallyVentilated: iv.mechanicallyVentilated ?? DEFAULT_FORM_STATE.mechanicallyVentilated,
    trauma: iv.trauma ?? DEFAULT_FORM_STATE.trauma,
    burn: iv.burn ?? DEFAULT_FORM_STATE.burn,
    ve: iv.ve != null ? String(iv.ve) : DEFAULT_FORM_STATE.ve,
    tmax: iv.tmax != null ? String(iv.tmax) : DEFAULT_FORM_STATE.tmax,
    fever: iv.fever ?? DEFAULT_FORM_STATE.fever,
    currentTemp: iv.currentTemp != null ? String(iv.currentTemp) : DEFAULT_FORM_STATE.currentTemp,
    tempUnit: (iv.tempUnit as 'C' | 'F') ?? DEFAULT_FORM_STATE.tempUnit,
    selectedIllness: iv.selectedIllness ?? DEFAULT_FORM_STATE.selectedIllness,
    enteralVolume: iv.enteralVolume != null ? String(iv.enteralVolume) : DEFAULT_FORM_STATE.enteralVolume,
    enteralHours: iv.enteralHours != null ? String(iv.enteralHours) : DEFAULT_FORM_STATE.enteralHours,
    pnVolume: iv.pnVolume != null ? String(iv.pnVolume) : DEFAULT_FORM_STATE.pnVolume,
    pnDextrosePercent: iv.pnDextrosePercent != null ? String(iv.pnDextrosePercent) : DEFAULT_FORM_STATE.pnDextrosePercent,
  };
}

function formMatchesSnapshot(state: CalculationFormState, snapshot: CalculationInputValues | null): boolean {
  if (!snapshot) return false;
  const seed = inputValuesToFormState(snapshot);
  return (
    seed.weightKg === state.weightKg &&
    seed.heightCm === state.heightCm &&
    seed.activityLevel === state.activityLevel &&
    seed.stressFactor === state.stressFactor &&
    seed.mechanicallyVentilated === state.mechanicallyVentilated &&
    seed.trauma === state.trauma &&
    seed.burn === state.burn &&
    seed.ve === state.ve &&
    seed.tmax === state.tmax &&
    seed.fever === state.fever &&
    seed.currentTemp === state.currentTemp &&
    seed.tempUnit === state.tempUnit &&
    seed.selectedIllness === state.selectedIllness &&
    seed.enteralVolume === state.enteralVolume &&
    seed.enteralHours === state.enteralHours &&
    seed.pnVolume === state.pnVolume &&
    seed.pnDextrosePercent === state.pnDextrosePercent
  );
}

export function useCalculationPersister(
  patientId: string,
  patientAge: number,
  patientIsMale: boolean,
) {
  const [formState, setFormState] = useState<CalculationFormState>(DEFAULT_FORM_STATE);
  const [dbSnapshot, setDbSnapshot] = useState<CalculationInputValues | null>(null);
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
          .get<CalculationModel>('calculations')
          .query(
            Q.where('patient_id', patientId),
            Q.where('calculation_type', DRAFT_TYPE),
            Q.sortBy('created_at', Q.desc),
          )
          .observe()
          .subscribe({
            next: (records) => {
              if (!active) return;
              if (records.length > 0) {
                const record = records[0];
                const iv: CalculationInputValues = JSON.parse(record.inputValues || '{}');
                setDbSnapshot(iv);
                if (!hasSeeded.current) {
                  setFormState(inputValuesToFormState(iv));
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
    const relevant: PatientMetric[] = ['weightKg', 'heightCm', 'fever', 'age'];
    const subs = relevant.map((metric) =>
      clinicalEventBus.onMetric(patientId, metric).subscribe(() => {
        setRevision((v) => v + 1);
      }),
    );
    return () => subs.forEach((s) => s.unsubscribe());
  }, [patientId]);

  const writeToDb = useCallback(
    async (state: CalculationFormState) => {
      setIsSaving(true);
      try {
        const db = await getDatabase();
        const w = parseFloat(state.weightKg) || 0;
        const h = parseFloat(state.heightCm) || 0;

        const iv: CalculationInputValues = {
          weightKg: w,
          heightCm: h,
          age: patientAge,
          isMale: patientIsMale,
          activityLevel: state.activityLevel,
          stressFactor: parseFloat(state.stressFactor) || 1.0,
          mechanicallyVentilated: state.mechanicallyVentilated,
          trauma: state.trauma,
          burn: state.burn,
          ve: parseFloat(state.ve) || 0,
          tmax: parseFloat(state.tmax) || 37.0,
          fever: state.fever,
          currentTemp: parseFloat(state.currentTemp) || 0,
          tempUnit: state.tempUnit,
          selectedIllness: state.selectedIllness,
          enteralVolume: parseFloat(state.enteralVolume) || 0,
          enteralHours: parseFloat(state.enteralHours) || 0,
          pnVolume: parseFloat(state.pnVolume) || 0,
          pnDextrosePercent: parseFloat(state.pnDextrosePercent) || 0,
        };

        await db.write(async () => {
          const existing = await db
            .get<CalculationModel>('calculations')
            .query(
              Q.where('patient_id', patientId),
              Q.where('calculation_type', DRAFT_TYPE),
              Q.sortBy('created_at', Q.desc),
            )
            .fetch();

          const inputJson = JSON.stringify(iv);

          if (existing.length > 0) {
            const record = existing[0];
            await record.update((r) => {
              r.inputValues = inputJson;
              r.inputWeightKg = w;
              r.inputHeightCm = h;
              r.inputAge = patientAge;
              r.inputGender = patientIsMale ? 'male' : 'female';
              r.inputBmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0;
              r.inputActivityFactor = ACTIVITY_MULTIPLIERS[state.activityLevel] || 1.2;
              r.inputStressFactor = parseFloat(state.stressFactor) || 1.0;
              r.resultValue = 0;
            });
          } else {
            const collection = db.get<CalculationModel>('calculations');
            await collection.create((r) => {
              r.patientId = patientId;
              r.calculationType = DRAFT_TYPE;
              r.formulaName = 'Calculation Inputs Draft';
              r.inputValues = inputJson;
              r.resultValue = 0;
              r.isOverridden = false;
              r.overrideValue = 0;
              r.overrideReason = '';
              r.inputWeightKg = w;
              r.inputHeightCm = h;
              r.inputAge = patientAge;
              r.inputGender = patientIsMale ? 'male' : 'female';
              r.inputBmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0;
              r.inputActivityFactor = ACTIVITY_MULTIPLIERS[state.activityLevel] || 1.2;
              r.inputStressFactor = parseFloat(state.stressFactor) || 1.0;
            });
          }
        });

        setDbSnapshot(iv);

        if (w > 0) {
          clinicalEventBus.publish({
            type: 'PATIENT_METRIC_CHANGED',
            patientId,
            metric: 'weightKg',
            value: w,
          });
        }
        if (h > 0) {
          clinicalEventBus.publish({
            type: 'PATIENT_METRIC_CHANGED',
            patientId,
            metric: 'heightCm',
            value: h,
          });
        }
        if (state.fever) {
          clinicalEventBus.publish({
            type: 'PATIENT_METRIC_CHANGED',
            patientId,
            metric: 'fever',
            value: true,
          });
        }
      } catch (e) {
        console.error('[CalculationPersister] Write failed:', e);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [patientId, patientAge, patientIsMale],
  );

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      writeToDb(formStateRef.current).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [formState, isLoading, writeToDb]);

  const setField = useCallback(
    <K extends keyof CalculationFormState>(field: K, value: CalculationFormState[K]) => {
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

  const computed = useMemo((): CalculationComputedValues => {
    const w = parseFloat(formState.weightKg) || 0;
    const h = parseFloat(formState.heightCm) || 0;

    const bmi = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0;

    const mifflinBMR = w > 0 && h > 0
      ? calculateMifflinStJeorBMR(w, h, patientAge, patientIsMale)
      : 0;

    const harrisBMR = w > 0 && h > 0
      ? calculateHarrisBenedictBMR(w, h, patientAge, patientIsMale)
      : 0;

    const ventilatedREE = w > 0 && h > 0
      ? calculateVentilatedREE({
          weightKg: w,
          heightCm: h,
          age: patientAge,
          isMale: patientIsMale,
          mechanicallyVentilated: formState.mechanicallyVentilated,
          trauma: formState.trauma,
          burn: formState.burn,
          ve: parseFloat(formState.ve) || 0,
          tmax: parseFloat(formState.tmax) || 37.0,
        })
      : null;

    const feverFactor = formState.fever
      ? (() => {
          const temp = parseFloat(formState.currentTemp) || 0;
          if (formState.tempUnit === 'C') {
            const diff = temp - 37.0;
            return diff > 0 ? 1.0 + diff * 0.13 : 1.0;
          }
          const diff = temp - 98.6;
          return diff > 0 ? 1.0 + diff * 0.07 : 1.0;
        })()
      : 1.0;

    const activityFactor = ACTIVITY_MULTIPLIERS[formState.activityLevel] || 1.2;
    const injuryFactor = parseFloat(formState.stressFactor) || 1.0;

    const calculatedTEE = (ventilatedREE?.value ?? mifflinBMR)
      * activityFactor * injuryFactor * feverFactor;

    const illnessDetails = (() => {
      if (!formState.selectedIllness || !KAU_ILLNESS_MATRIX[formState.selectedIllness] || w <= 0) return null;
      const rule = KAU_ILLNESS_MATRIX[formState.selectedIllness];
      const baseProteinMin = rule.minProtein * w;
      const baseProteinMax = rule.maxProtein * w;
      const finalProteinMin = formState.selectedIllness === 'pregnancy' ? baseProteinMin + 25 : baseProteinMin;
      const finalProteinMax = formState.selectedIllness === 'pregnancy' ? baseProteinMax + 25 : baseProteinMax;
      return {
        rule,
        targetKcalMin: rule.minKcal * w,
        targetKcalMax: rule.maxKcal * w,
        targetProteinMin: finalProteinMin,
        targetProteinMax: finalProteinMax,
      };
    })();

    const fluidHollidaySegar = w > 0 ? calculateHollidaySegarFluid(w) : 0;

    const enteralFeedingRate = (() => {
      const vol = parseFloat(formState.enteralVolume) || 0;
      const hrs = parseFloat(formState.enteralHours) || 0;
      if (vol <= 0 || hrs <= 0) return 0;
      return vol / hrs;
    })();

    const gurResult = (() => {
      const vol = parseFloat(formState.pnVolume) || 0;
      const dexPercent = parseFloat(formState.pnDextrosePercent) || 0;
      if (vol <= 0 || dexPercent <= 0 || w <= 0) return null;
      const gur = calculateGUR(vol, dexPercent, w);
      return { gur, isSafe: gur >= 4.0 && gur <= 6.0 };
    })();

    return {
      bmi,
      mifflinBMR,
      harrisBMR,
      ventilatedREE,
      feverFactor,
      activityFactor,
      injuryFactor,
      calculatedTEE,
      illnessDetails,
      fluidHollidaySegar,
      fluidRda: calculatedTEE,
      enteralFeedingRate,
      gurResult,
    };
  }, [formState, patientAge, patientIsMale, revision]);

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
