import { useState, useEffect, useCallback } from 'react';
import { CalculationRepository } from '../../data/repositories/CalculationRepository';
import { DysphagiaIntervention } from '../../domain/types/stroke';

export function useDysphagiaIntervention(patientId: string) {
  const [intervention, setIntervention] = useState<DysphagiaIntervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const repo = new CalculationRepository();

  const loadIntervention = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await repo.getByPatientIdAndType(patientId, 'dysphagia_intervention');
      if (results.length > 0) {
        const calc = results[0];
        const inputs = calc.inputValues || {};
        setIntervention({
          patientId,
          assessmentId: inputs.assessmentId || '',
          swallowTherapyType: inputs.swallowTherapyType ?? 'none',
          therapyFrequency: inputs.therapyFrequency ?? 0,
          feedingPosition: inputs.feedingPosition ?? 'semi_fowler',
          chinTuck: inputs.chinTuck ?? false,
          headRotation: inputs.headRotation ?? false,
          foodTemperature: inputs.foodTemperature ?? 'room_temp',
          foodTexture: inputs.foodTexture ?? 'liquid',
          suctionAvailable: inputs.suctionAvailable ?? false,
          emergencyProtocol: inputs.emergencyProtocol ?? 'none',
          createdAt: calc.createdAt || new Date().toISOString(),
          updatedAt: calc.updatedAt || new Date().toISOString(),
        });
      } else {
        setIntervention(null);
      }
    } catch (err) {
      console.error('[useDysphagiaIntervention] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadIntervention();
  }, [loadIntervention]);

  const saveIntervention = async (data: any) => {
    try {
      const resultValue = data.therapyFrequency || 0;
      await repo.upsert({
        patientId,
        calculationType: 'dysphagia_intervention',
        formulaName: 'Dysphagia Safe Swallowing Protocol',
        inputValues: data,
        resultValue,
      });
      await loadIntervention();
    } catch (err) {
      console.error('[useDysphagiaIntervention] Save failed:', err);
      throw err;
    }
  };

  return {
    intervention,
    isLoading,
    createIntervention: saveIntervention,
    updateIntervention: saveIntervention,
    reload: loadIntervention,
  };
}
