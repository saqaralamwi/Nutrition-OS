import { useEffect, useState, useCallback } from 'react';
import { Patient } from '../../domain/entities/Patient';
import { PatientRepository } from '../../data/repositories/PatientRepository';

const repository = new PatientRepository();

interface UsePatientsReturn {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
}

export function usePatients(): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await repository.findAll();
      setPatients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ في تحميل المرضى');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    try {
      await repository.delete(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ في حذف المريض');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { patients, isLoading, error, refresh, deletePatient };
}
