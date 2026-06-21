import { useState, useEffect, useCallback } from 'react';
import { CalculationRepository } from '../../data/repositories/CalculationRepository';
import { StrokeAssessment } from '../../domain/types/stroke';

export function useStrokeAssessment(patientId: string) {
  const [assessment, setAssessment] = useState<StrokeAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const repo = new CalculationRepository();

  const loadAssessment = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await repo.getByPatientIdAndType(patientId, 'stroke_assessment');
      if (results.length > 0) {
        const calc = results[0];
        const inputs = calc.inputValues || {};
        setAssessment({
          patientId,
          strokeType: inputs.strokeType ?? 'ischemic',
          strokeLocation: inputs.strokeLocation ?? 'left_hemisphere',
          severity: inputs.severity ?? 'moderate',
          hoursSinceStroke: inputs.hoursSinceStroke ?? 12,
          gcs: inputs.gcs ?? 15,
          nse: inputs.nse ?? inputs.nihss ?? 0,
          hasDysphagia: inputs.hasDysphagia ?? false,
          dysphagiaSeverity: inputs.dysphagiaSeverity ?? 'none',
          waterSwallowTestResult: inputs.waterSwallowTestResult ?? 'pass',
          coughReflex: inputs.coughReflex ?? 'normal',
          feedingRoute: inputs.feedingRoute ?? 'oral',
          foodConsistency: inputs.foodConsistency ?? 'regular',
          needsEnteralNutrition: inputs.needsEnteralNutrition ?? false,
          needsParenteralNutrition: inputs.needsParenteralNutrition ?? false,
          oralIntakePercentage: inputs.oralIntakePercentage ?? 100,
          strokeDate: inputs.strokeDate ?? new Date().toISOString().split('T')[0],
          createdAt: calc.createdAt || new Date().toISOString(),
          updatedAt: calc.updatedAt || new Date().toISOString(),
        });
      } else {
        setAssessment(null);
      }
    } catch (err) {
      console.error('[useStrokeAssessment] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  const saveAssessment = async (data: any) => {
    try {
      const resultValue = data.oralIntakePercentage || 100;
      await repo.upsert({
        patientId,
        calculationType: 'stroke_assessment',
        formulaName: 'Stroke Clinical Nutrition Protocol',
        inputValues: data,
        resultValue,
      });
      await loadAssessment();
    } catch (err) {
      console.error('[useStrokeAssessment] Save failed:', err);
      throw err;
    }
  };

  return {
    assessment,
    isLoading,
    createAssessment: saveAssessment,
    updateAssessment: saveAssessment,
    reload: loadAssessment,
  };
}
