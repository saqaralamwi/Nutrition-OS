import { useState, useCallback } from 'react';
import { CreatePatientInput } from '../../domain/entities/Patient';
import { PatientRepository } from '../../data/repositories/PatientRepository';

const repository = new PatientRepository();

interface UsePatientFormReturn {
  isSaving: boolean;
  error: string | null;
  savePatient: (input: CreatePatientInput) => Promise<string | null>;
}

export function usePatientForm(): UsePatientFormReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePatient = useCallback(
    async (input: CreatePatientInput): Promise<string | null> => {
      try {
        setIsSaving(true);
        setError(null);
        const patient = await repository.create(input);
        return patient.id;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'حدث خطأ في حفظ المريض';
        setError(message);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return { isSaving, error, savePatient };
}
