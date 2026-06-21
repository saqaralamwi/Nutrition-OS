import { useMemo, useCallback, useState, useEffect } from 'react';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { observePatients } from '../../data/database/observe';
import { useObservableArray } from '../hooks/useObservable';
import { PatientRepository } from '../../data/repositories/PatientRepository';
import type { Patient, PatientGender, PatientStatus, PatientType } from '../../domain/entities/Patient';
import type PatientModel from '../../data/models/Patient';

const repository = new PatientRepository();

function toDomain(model: PatientModel): Patient {
  let incompleteArr: string[] = [];
  if (model.incompleteSections) {
    try {
      incompleteArr = JSON.parse(model.incompleteSections);
    } catch {
      incompleteArr = [];
    }
  }
  return {
    id: model.id,
    fileNumber: model.fileNumber,
    fullName: model.fullName,
    age: model.age,
    dateOfBirth: model.dateOfBirth || null,
    gender: model.gender as PatientGender,
    nationalId: model.nationalId || null,
    nationality: model.nationality || null,
    phoneNumber: model.phoneNumber || null,
    department: model.department,
    bedNumber: model.bedNumber || null,
    admissionDate: model.admissionDate?.toISOString() || new Date().toISOString(),
    referringPhysician: model.referringPhysician || null,
    primaryDiagnosis: model.primaryDiagnosis,
    patientType: model.patientType as PatientType,
    status: model.status as PatientStatus,
    notes: model.notes || null,
    incompleteSections: incompleteArr,
    createdAt: model.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: model.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Observable stream of all patients, sorted newest-first.
 * Automatically emits on any insert/update/delete in the patients table.
 */
export const patients$: Observable<Patient[]> = observePatients().pipe(
  map((models) => models.map(toDomain)),
);

/**
 * Reactive patients hook.
 * Zero-stale-data: component re-renders automatically on any DB change.
 */
export function usePatients(): {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  deletePatient: (id: string) => Promise<void>;
} {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const patientObservable = useMemo(() => patients$, []);

  const patients = useObservableArray(patientObservable);

  useEffect(() => {
    if (isLoading) setIsLoading(false);
  }, [patients]);

  const deletePatient = useCallback(async (id: string) => {
    try {
      setError(null);
      await repository.delete(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ في حذف المريض');
    }
  }, []);

  return { patients, isLoading, error, deletePatient };
}

/**
 * @deprecated Use usePatients() instead. Included for compatibility with legacy components.
 */
export const usePatientStore = usePatients;
