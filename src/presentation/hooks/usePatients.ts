import { useCallback, useMemo, useState } from 'react';
import { Patient, PatientGender, PatientStatus, PatientType } from '../../domain/entities/Patient';
import { PatientRepository } from '../../data/repositories/PatientRepository';
import { observePatients } from '../../data/repositories/ReactiveQuery';
import { useObservable } from './useObservable';
import PatientModel from '../../data/models/Patient';
import { map } from 'rxjs/operators';

const repository = new PatientRepository();

interface UsePatientsReturn {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
}

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
 * Reactive Patients Hook.
 * Automatically synchronizes with database modifications in real-time.
 */
export function usePatients(whereClause?: any): UsePatientsReturn {
  const [error, setError] = useState<string | null>(null);

  // Memoize the observable to prevent resubscription on every render
  const patientsObservable = useMemo(() => {
    return observePatients(whereClause).pipe(
      map((models) => models.map(toDomain))
    );
  }, [JSON.stringify(whereClause)]);

  // Subscribes to patients stream
  const patients = useObservable(patientsObservable);

  const isLoading = patients === undefined;

  // Manual refresh is a no-op in reactive mode since updates are automatic.
  const refresh = useCallback(async () => {
    // Left as a placeholder for compatibility
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    try {
      setError(null);
      await repository.delete(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ في حذف المريض');
    }
  }, []);

  return {
    patients: patients || [],
    isLoading,
    error,
    refresh,
    deletePatient,
  };
}
