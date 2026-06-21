import { useMemo } from 'react';
import { useObservable } from './useObservable';
import { watchQuery, watchRecord } from '../../data/database/observe';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, debounceTime } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import Patient from '../../data/models/Patient';
import MedicalHistory from '../../data/models/MedicalHistory';
import ICUAdmission from '../../data/models/ICUAdmission';

export interface WizardStepConfig {
  id: 'screening' | 'diabetes' | 'renal' | 'icu' | 'final_report';
  title: string;
  titleAr: string;
  isActive: boolean;
  isCompleted: boolean;
  order: number;
}

interface StreamInput {
  patient: Patient | null;
  medicalHistories: MedicalHistory[];
  icuAdmissions: ICUAdmission[];
}

function deriveSteps(input: StreamInput): WizardStepConfig[] {
  const { patient, medicalHistories, icuAdmissions } = input;

  const incompleteSections: string = patient?.incompleteSections ?? '';
  const primaryDiagnosis: string = patient?.primaryDiagnosis ?? '';
  const clinicalTagsRaw: string = patient?.clinicalTags ?? '';
  const clinicalTags: string[] = (() => {
    try {
      const parsed = JSON.parse(clinicalTagsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return clinicalTagsRaw ? clinicalTagsRaw.split(',').map(t => t.trim().toLowerCase()) : [];
    }
  })();

  const comorbiditiesRaw: string = medicalHistories.length > 0
    ? (medicalHistories[0]?.comorbidities ?? '')
    : '';
  const comorbiditiesLower: string = comorbiditiesRaw.toLowerCase();

  const latestIcu: ICUAdmission | null = icuAdmissions.length > 0 ? icuAdmissions[0] : null;
  const kidneyStage: string = latestIcu?.kidneyStage ?? '';

  const screeningActive = true;
  const screeningCompleted = !incompleteSections.includes('screening');

  const diabetesActive =
    primaryDiagnosis.toUpperCase() === 'DIABETES' ||
    clinicalTags.includes('dm') ||
    clinicalTags.includes('diabetes') ||
    comorbiditiesLower.includes('diabetes') ||
    comorbiditiesLower.includes('سكري') ||
    (latestIcu?.hasDiabetes ?? false);

  const renalActive =
    comorbiditiesLower.includes('renal') ||
    comorbiditiesLower.includes('kidney') ||
    comorbiditiesLower.includes('ckd') ||
    comorbiditiesLower.includes('كلوي') ||
    comorbiditiesLower.includes('فشل كلوي') ||
    kidneyStage !== '' ||
    (latestIcu?.hasKidney ?? false);

  const icuActive = icuAdmissions.length > 0;

  const finalActive = true;

  return [
    {
      id: 'screening',
      title: 'Nutritional Screening',
      titleAr: 'الفحص التغذوي',
      isActive: screeningActive,
      isCompleted: screeningCompleted,
      order: 1,
    },
    {
      id: 'diabetes',
      title: 'Diabetes NCP',
      titleAr: 'التقييم الغذائي لمرضى السكري',
      isActive: diabetesActive,
      isCompleted: false,
      order: 2,
    },
    {
      id: 'renal',
      title: 'Renal NCP',
      titleAr: 'التقييم الغذائي لأمراض الكلى',
      isActive: renalActive,
      isCompleted: false,
      order: 3,
    },
    {
      id: 'icu',
      title: 'ICU Critical Care',
      titleAr: 'رعاية العناية المركزة',
      isActive: icuActive,
      isCompleted: false,
      order: 4,
    },
    {
      id: 'final_report',
      title: 'Summary & Report',
      titleAr: 'التقرير الختامي',
      isActive: finalActive,
      isCompleted: false,
      order: 5,
    },
  ];
}

function buildStream(patientId: string): Observable<StreamInput> {
  const patient$ = watchRecord<Patient>('patients', patientId).pipe(
    catchError(() => of(null as Patient | null)),
  );

  const medicalHistories$ = watchQuery<MedicalHistory>(db =>
    db.get('medical_histories').query(
      Q.where('patient_id', patientId),
      Q.sortBy('created_at', Q.desc),
    ),
  ).pipe(
    catchError(() => of([] as MedicalHistory[])),
  );

  const icuAdmissions$ = watchQuery<ICUAdmission>(db =>
    db.get('icu_admissions').query(
      Q.where('patient_id', patientId),
      Q.sortBy('created_at', Q.desc),
    ),
  ).pipe(
    catchError(() => of([] as ICUAdmission[])),
  );

  return combineLatest([patient$, medicalHistories$, icuAdmissions$]).pipe(
    debounceTime(50),
    map(([patient, medicalHistories, icuAdmissions]) => ({
      patient,
      medicalHistories,
      icuAdmissions,
    })),
  );
}

export function useAdaptiveWizardSteps(patientId: string): {
  steps: WizardStepConfig[];
  loading: boolean;
} {
  const stream$ = useMemo(() => buildStream(patientId), [patientId]);
  const input = useObservable<StreamInput>(
    stream$,
    { patient: null, medicalHistories: [], icuAdmissions: [] },
  );

  const steps = deriveSteps(input);
  const loading = input.patient === null;

  return { steps, loading };
}
