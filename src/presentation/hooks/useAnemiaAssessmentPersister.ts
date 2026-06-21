import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { watchRecord } from '../../data/database/observe';
import { useObservable } from './useObservable';
import {
  AnemiaAssessment as AnemiaAssessmentType,
  AnemiaSeverity,
  AnemiaType,
  IronStatus,
  B12Status,
  FolateStatus,
} from '../../domain/types/anemia';
import { AnemiaNutritionEngine } from '../../domain/calculators/AnemiaNutritionEngine';
import AnemiaAssessmentRecord from '../../data/models/AnemiaAssessment';
import { clinicalEventBus, PatientMetric } from '../../services/ClinicalEventBus';

export interface AnemiaFormState {
  hemoglobin: string;
  hemoglobinUnit: 'g/dL' | 'g/L';
  serumIron: string;
  tibc: string;
  ferritin: string;
  vitaminB12: string;
  serumFolate: string;
  mcv: string;
  mch: string;
  mchc: string;
  rdw: string;
  reticulocyteCount: string;
  leukocyteCount: string;
  plateletCount: string;
  hasFatigue: boolean;
  hasWeakness: boolean;
  hasDyspnea: boolean;
  hasPalpitations: boolean;
  hasHeadache: boolean;
  hasDizziness: boolean;
  hasColdIntolerance: boolean;
  hasPallor: boolean;
  hasKoilonychia: boolean;
  hasGlossitis: boolean;
  hasMenstruation: boolean;
  isPregnant: boolean;
  isLactating: boolean;
  hasGIBleeding: boolean;
  hasChronicDisease: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  hasMalnutrition: boolean;
  avgIronIntake: string;
  avgB12Intake: string;
  avgFolateIntake: string;
  dietaryPattern: 'regular' | 'vegetarian' | 'vegan' | 'restricted';
}

export interface AnemiaComputedValues {
  severity: AnemiaSeverity;
  transferrinSaturation: number;
  ironStatus: IronStatus;
  b12Status: B12Status;
  folateStatus: FolateStatus;
  anemiaType: AnemiaType;
}

function createDefaultFormState(): AnemiaFormState {
  return {
    hemoglobin: '12',
    hemoglobinUnit: 'g/dL',
    serumIron: '80',
    tibc: '320',
    ferritin: '50',
    vitaminB12: '300',
    serumFolate: '8',
    mcv: '85',
    mch: '28',
    mchc: '33',
    rdw: '13',
    reticulocyteCount: '1',
    leukocyteCount: '6',
    plateletCount: '250',
    hasFatigue: false,
    hasWeakness: false,
    hasDyspnea: false,
    hasPalpitations: false,
    hasHeadache: false,
    hasDizziness: false,
    hasColdIntolerance: false,
    hasPallor: false,
    hasKoilonychia: false,
    hasGlossitis: false,
    hasMenstruation: false,
    isPregnant: false,
    isLactating: false,
    hasGIBleeding: false,
    hasChronicDisease: false,
    isVegetarian: false,
    isVegan: false,
    hasMalnutrition: false,
    avgIronIntake: '10',
    avgB12Intake: '2.4',
    avgFolateIntake: '400',
    dietaryPattern: 'regular',
  };
}

function seedFromAssessment(a: AnemiaAssessmentType): AnemiaFormState {
  return {
    hemoglobin: String(a.hemoglobin ?? 12),
    hemoglobinUnit: a.hemoglobinUnit ?? 'g/dL',
    serumIron: String(a.serumIron ?? 80),
    tibc: String(a.tibc ?? 320),
    ferritin: String(a.ferritin ?? 50),
    vitaminB12: String(a.vitaminB12 ?? 300),
    serumFolate: String(a.serumFolate ?? 8),
    mcv: String(a.mcv ?? 85),
    mch: String(a.mch ?? 28),
    mchc: String(a.mchc ?? 33),
    rdw: String(a.rdw ?? 13),
    reticulocyteCount: String(a.reticulocyteCount ?? 1),
    leukocyteCount: String(a.leukocyteCount ?? 6),
    plateletCount: String(a.plateletCount ?? 250),
    hasFatigue: a.hasFatigue ?? false,
    hasWeakness: a.hasWeakness ?? false,
    hasDyspnea: a.hasDyspnea ?? false,
    hasPalpitations: a.hasPalpitations ?? false,
    hasHeadache: a.hasHeadache ?? false,
    hasDizziness: a.hasDizziness ?? false,
    hasColdIntolerance: a.hasColdIntolerance ?? false,
    hasPallor: a.hasPallor ?? false,
    hasKoilonychia: a.hasKoilonychia ?? false,
    hasGlossitis: a.hasGlossitis ?? false,
    hasMenstruation: a.hasMenstruation ?? false,
    isPregnant: a.isPregnant ?? false,
    isLactating: a.isLactating ?? false,
    hasGIBleeding: a.hasGIBleeding ?? false,
    hasChronicDisease: a.hasChronicDisease ?? false,
    isVegetarian: a.isVegetarian ?? false,
    isVegan: a.isVegan ?? false,
    hasMalnutrition: a.hasMalnutrition ?? false,
    avgIronIntake: String(a.avgIronIntake ?? 10),
    avgB12Intake: String(a.avgB12Intake ?? 2.4),
    avgFolateIntake: String(a.avgFolateIntake ?? 400),
    dietaryPattern: a.dietaryPattern ?? 'regular',
  };
}

function formMatchesSnapshot(state: AnemiaFormState, snapshot: AnemiaAssessmentType | null): boolean {
  if (!snapshot) {
    const def = createDefaultFormState();
    return Object.keys(def).every((key) => {
      const k = key as keyof AnemiaFormState;
      return String(def[k]) === String(state[k]);
    });
  }
  const seed = seedFromAssessment(snapshot);
  return (
    seed.hemoglobin === state.hemoglobin &&
    seed.hemoglobinUnit === state.hemoglobinUnit &&
    seed.serumIron === state.serumIron &&
    seed.tibc === state.tibc &&
    seed.ferritin === state.ferritin &&
    seed.vitaminB12 === state.vitaminB12 &&
    seed.serumFolate === state.serumFolate &&
    seed.mcv === state.mcv &&
    seed.mch === state.mch &&
    seed.mchc === state.mchc &&
    seed.rdw === state.rdw &&
    seed.reticulocyteCount === state.reticulocyteCount &&
    seed.leukocyteCount === state.leukocyteCount &&
    seed.plateletCount === state.plateletCount &&
    seed.hasFatigue === state.hasFatigue &&
    seed.hasWeakness === state.hasWeakness &&
    seed.hasDyspnea === state.hasDyspnea &&
    seed.hasPalpitations === state.hasPalpitations &&
    seed.hasHeadache === state.hasHeadache &&
    seed.hasDizziness === state.hasDizziness &&
    seed.hasColdIntolerance === state.hasColdIntolerance &&
    seed.hasPallor === state.hasPallor &&
    seed.hasKoilonychia === state.hasKoilonychia &&
    seed.hasGlossitis === state.hasGlossitis &&
    seed.hasMenstruation === state.hasMenstruation &&
    seed.isPregnant === state.isPregnant &&
    seed.isLactating === state.isLactating &&
    seed.hasGIBleeding === state.hasGIBleeding &&
    seed.hasChronicDisease === state.hasChronicDisease &&
    seed.isVegetarian === state.isVegetarian &&
    seed.isVegan === state.isVegan &&
    seed.hasMalnutrition === state.hasMalnutrition &&
    seed.avgIronIntake === state.avgIronIntake &&
    seed.avgB12Intake === state.avgB12Intake &&
    seed.avgFolateIntake === state.avgFolateIntake &&
    seed.dietaryPattern === state.dietaryPattern
  );
}

export function useAnemiaAssessmentPersister(patientId: string) {
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null,
  );

  const patientGender = patient?.gender === 'female' ? 'female' : 'male';

  const [formState, setFormState] = useState<AnemiaFormState>(createDefaultFormState);
  const [dbSnapshot, setDbSnapshot] = useState<AnemiaAssessmentType | null>(null);
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
          .get('anemia_assessments')
          .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc))
          .observe()
          .subscribe({
            next: (records: any[]) => {
              if (!active) return;
              if (records.length > 0) {
                const domain = records[0].toDomain() as AnemiaAssessmentType;
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
    const relevant: PatientMetric[] = ['gender'];
    const subs = relevant.map((metric) =>
      clinicalEventBus.onMetric(patientId, metric).subscribe(() => {
        setRevision((v) => v + 1);
      }),
    );
    return () => subs.forEach((s) => s.unsubscribe());
  }, [patientId]);

  const writeToDb = useCallback(
    async (state: AnemiaFormState) => {
      setIsSaving(true);
      try {
        const db = await getDatabase();
        const hb = parseFloat(state.hemoglobin) || 0;
        const iron = parseFloat(state.serumIron) || 0;
        const tibcVal = parseFloat(state.tibc) || 1;
        const ferr = parseFloat(state.ferritin) || 0;
        const b12 = parseFloat(state.vitaminB12) || 0;
        const fol = parseFloat(state.serumFolate) || 0;
        const tsat = Math.round((iron / tibcVal) * 100) || 0;

        let ironStatus: IronStatus = 'normal';
        if (ferr < 15 || tsat < 16) ironStatus = 'depleted';
        else if (ferr < 30) ironStatus = 'very_low';
        else if (ferr < 50) ironStatus = 'low';

        let b12Status: B12Status = 'normal';
        if (b12 < 150) b12Status = 'deficient';
        else if (b12 < 200) b12Status = 'very_low';
        else if (b12 < 300) b12Status = 'low';

        let folateStatus: FolateStatus = 'normal';
        if (fol < 3) folateStatus = 'deficient';
        else if (fol < 4) folateStatus = 'very_low';
        else if (fol < 6) folateStatus = 'low';

        const severity = AnemiaNutritionEngine.classifySeverity(
          hb, state.hemoglobinUnit, patientGender, state.isPregnant,
        );

        const anemiaType = AnemiaNutritionEngine.determineAnemiaType({
          patientId,
          hemoglobin: hb,
          hemoglobinUnit: state.hemoglobinUnit,
          severity,
          anemiaType: 'unknown',
          serumIron: iron,
          tibc: parseFloat(state.tibc) || 0,
          ferritin: ferr,
          transferrinSaturation: tsat,
          ironStatus,
          vitaminB12: b12,
          b12Status,
          serumFolate: fol,
          folateStatus,
          mcv: parseFloat(state.mcv) || 0,
          mch: parseFloat(state.mch) || 0,
          mchc: parseFloat(state.mchc) || 0,
          rdw: parseFloat(state.rdw) || 0,
          reticulocyteCount: parseFloat(state.reticulocyteCount) || 0,
          leukocyteCount: parseFloat(state.leukocyteCount) || 0,
          plateletCount: parseFloat(state.plateletCount) || 0,
          hasFatigue: state.hasFatigue,
          hasWeakness: state.hasWeakness,
          hasDyspnea: state.hasDyspnea,
          hasPalpitations: state.hasPalpitations,
          hasHeadache: state.hasHeadache,
          hasDizziness: state.hasDizziness,
          hasColdIntolerance: state.hasColdIntolerance,
          hasPallor: state.hasPallor,
          hasKoilonychia: state.hasKoilonychia,
          hasGlossitis: state.hasGlossitis,
          hasMenstruation: state.hasMenstruation,
          isPregnant: state.isPregnant,
          isLactating: state.isLactating,
          hasGIBleeding: state.hasGIBleeding,
          hasChronicDisease: state.hasChronicDisease,
          isVegetarian: state.isVegetarian,
          isVegan: state.isVegan,
          hasMalnutrition: state.hasMalnutrition,
          avgIronIntake: parseFloat(state.avgIronIntake) || 0,
          avgB12Intake: parseFloat(state.avgB12Intake) || 0,
          avgFolateIntake: parseFloat(state.avgFolateIntake) || 0,
          dietaryPattern: state.dietaryPattern,
          createdAt: '',
          updatedAt: '',
        });

        await db.write(async () => {
          const collection = db.get('anemia_assessments');
          const existing = await collection
            .query(Q.where('patient_id', patientId))
            .fetch();

          const copyFields = (record: any) => {
            record.patientId = patientId;
            record.hemoglobin = hb;
            record.hemoglobinUnit = state.hemoglobinUnit;
            record.severity = severity;
            record.anemiaType = anemiaType;
            record.serumIron = iron;
            record.tibc = parseFloat(state.tibc) || 0;
            record.ferritin = ferr;
            record.transferrinSaturation = tsat;
            record.ironStatus = ironStatus;
            record.vitaminB12 = b12;
            record.b12Status = b12Status;
            record.serumFolate = fol;
            record.folateStatus = folateStatus;
            record.mcv = parseFloat(state.mcv) || 0;
            record.mch = parseFloat(state.mch) || 0;
            record.mchc = parseFloat(state.mchc) || 0;
            record.rdw = parseFloat(state.rdw) || 0;
            record.reticulocyteCount = parseFloat(state.reticulocyteCount) || 0;
            record.leukocyteCount = parseFloat(state.leukocyteCount) || 0;
            record.plateletCount = parseFloat(state.plateletCount) || 0;
            record.hasFatigue = state.hasFatigue;
            record.hasWeakness = state.hasWeakness;
            record.hasDyspnea = state.hasDyspnea;
            record.hasPalpitations = state.hasPalpitations;
            record.hasHeadache = state.hasHeadache;
            record.hasDizziness = state.hasDizziness;
            record.hasColdIntolerance = state.hasColdIntolerance;
            record.hasPallor = state.hasPallor;
            record.hasKoilonychia = state.hasKoilonychia;
            record.hasGlossitis = state.hasGlossitis;
            record.hasMenstruation = state.hasMenstruation;
            record.isPregnant = state.isPregnant;
            record.isLactating = state.isLactating;
            record.hasGIBleeding = state.hasGIBleeding;
            record.hasChronicDisease = state.hasChronicDisease;
            record.isVegetarian = state.isVegetarian;
            record.isVegan = state.isVegan;
            record.hasMalnutrition = state.hasMalnutrition;
            record.avgIronIntake = parseFloat(state.avgIronIntake) || 0;
            record.avgB12Intake = parseFloat(state.avgB12Intake) || 0;
            record.avgFolateIntake = parseFloat(state.avgFolateIntake) || 0;
            record.dietaryPattern = state.dietaryPattern;
          };

          if (existing.length > 0) {
            await existing[0].update((record: any) => {
              copyFields(record);
              record.updatedAt = new Date().toISOString();
            });
          } else {
            await collection.create((record: any) => {
              copyFields(record);
              record.createdAt = new Date().toISOString();
              record.updatedAt = new Date().toISOString();
            });
          }
        });

        const records = await db
          .get<AnemiaAssessmentRecord>('anemia_assessments')
          .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc))
          .fetch();
        if (records.length > 0) {
          setDbSnapshot(records[0].toDomain());
        }
      } catch (e) {
        console.error('[AnemiaPersister] Write failed:', e);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [patientId, patientGender],
  );

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      writeToDb(formStateRef.current).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [formState, isLoading, writeToDb]);

  const setField = useCallback(
    <K extends keyof AnemiaFormState>(field: K, value: AnemiaFormState[K]) => {
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

  const computed = useMemo((): AnemiaComputedValues => {
    const hb = parseFloat(formState.hemoglobin) || 12;
    const iron = parseFloat(formState.serumIron) || 0;
    const tibcVal = parseFloat(formState.tibc) || 1;
    const ferr = parseFloat(formState.ferritin) || 0;
    const b12 = parseFloat(formState.vitaminB12) || 0;
    const fol = parseFloat(formState.serumFolate) || 0;

    const transferrinSaturation = Math.round((iron / tibcVal) * 100) || 0;

    let ironStatus: IronStatus = 'normal';
    if (ferr < 15 || transferrinSaturation < 16) ironStatus = 'depleted';
    else if (ferr < 30) ironStatus = 'very_low';
    else if (ferr < 50) ironStatus = 'low';

    let b12Status: B12Status = 'normal';
    if (b12 < 150) b12Status = 'deficient';
    else if (b12 < 200) b12Status = 'very_low';
    else if (b12 < 300) b12Status = 'low';

    let folateStatus: FolateStatus = 'normal';
    if (fol < 3) folateStatus = 'deficient';
    else if (fol < 4) folateStatus = 'very_low';
    else if (fol < 6) folateStatus = 'low';

    const severity = AnemiaNutritionEngine.classifySeverity(
      hb,
      formState.hemoglobinUnit,
      patientGender,
      formState.isPregnant,
    );

    const anemiaType = AnemiaNutritionEngine.determineAnemiaType({
      patientId,
      hemoglobin: hb,
      hemoglobinUnit: formState.hemoglobinUnit,
      severity,
      anemiaType: 'unknown',
      serumIron: iron,
      tibc: parseFloat(formState.tibc) || 0,
      ferritin: ferr,
      transferrinSaturation,
      ironStatus,
      vitaminB12: b12,
      b12Status,
      serumFolate: fol,
      folateStatus,
      mcv: parseFloat(formState.mcv) || 0,
      mch: parseFloat(formState.mch) || 0,
      mchc: parseFloat(formState.mchc) || 0,
      rdw: parseFloat(formState.rdw) || 0,
      reticulocyteCount: parseFloat(formState.reticulocyteCount) || 0,
      leukocyteCount: parseFloat(formState.leukocyteCount) || 0,
      plateletCount: parseFloat(formState.plateletCount) || 0,
      hasFatigue: formState.hasFatigue,
      hasWeakness: formState.hasWeakness,
      hasDyspnea: formState.hasDyspnea,
      hasPalpitations: formState.hasPalpitations,
      hasHeadache: formState.hasHeadache,
      hasDizziness: formState.hasDizziness,
      hasColdIntolerance: formState.hasColdIntolerance,
      hasPallor: formState.hasPallor,
      hasKoilonychia: formState.hasKoilonychia,
      hasGlossitis: formState.hasGlossitis,
      hasMenstruation: formState.hasMenstruation,
      isPregnant: formState.isPregnant,
      isLactating: formState.isLactating,
      hasGIBleeding: formState.hasGIBleeding,
      hasChronicDisease: formState.hasChronicDisease,
      isVegetarian: formState.isVegetarian,
      isVegan: formState.isVegan,
      hasMalnutrition: formState.hasMalnutrition,
      avgIronIntake: parseFloat(formState.avgIronIntake) || 0,
      avgB12Intake: parseFloat(formState.avgB12Intake) || 0,
      avgFolateIntake: parseFloat(formState.avgFolateIntake) || 0,
      dietaryPattern: formState.dietaryPattern,
      createdAt: '',
      updatedAt: '',
    });

    return { severity, transferrinSaturation, ironStatus, b12Status, folateStatus, anemiaType };
  }, [formState, patientGender, patientId, revision]);

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
