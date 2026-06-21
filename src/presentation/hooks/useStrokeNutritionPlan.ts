import { useState, useEffect, useCallback } from 'react';
import { CalculationRepository } from '../../data/repositories/CalculationRepository';
import { StrokeNutritionPlan } from '../../domain/types/stroke';

export function useStrokeNutritionPlan(patientId: string) {
  const [plan, setPlan] = useState<StrokeNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const repo = new CalculationRepository();

  const loadPlan = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await repo.getByPatientIdAndType(patientId, 'stroke_nutrition_plan');
      if (results.length > 0) {
        const calc = results[0];
        const inputs = calc.inputValues || {};
        setPlan({
          patientId,
          assessmentId: inputs.assessmentId || '',
          targetCalories: inputs.targetCalories ?? 2000,
          targetProtein: inputs.targetProtein ?? 75,
          targetFluid: inputs.targetFluid ?? 2000,
          stressFactor: inputs.stressFactor ?? 1.1,
          activityFactor: inputs.activityFactor ?? 1.0,
          thickenLiquids: inputs.thickenLiquids ?? false,
          liquidThickness: inputs.liquidThickness ?? 'thin',
          avoidFoods: inputs.avoidFoods ?? [],
          feedingFrequency: inputs.feedingFrequency ?? 5,
          nocturnalFeeding: inputs.nocturnalFeeding ?? false,
          nocturnalRate: inputs.nocturnalRate ?? 0,
          weightCheckFrequency: inputs.weightCheckFrequency ?? 'weekly',
          aspirationRisk: inputs.aspirationRisk ?? 'low',
          createdAt: calc.createdAt || new Date().toISOString(),
          updatedAt: calc.updatedAt || new Date().toISOString(),
        });
      } else {
        setPlan(null);
      }
    } catch (err) {
      console.error('[useStrokeNutritionPlan] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const savePlan = async (data: any) => {
    try {
      const resultValue = data.targetCalories || 2000;
      await repo.upsert({
        patientId,
        calculationType: 'stroke_nutrition_plan',
        formulaName: 'Stroke Nutrition Plan Protocol',
        inputValues: data,
        resultValue,
      });
      await loadPlan();
    } catch (err) {
      console.error('[useStrokeNutritionPlan] Save failed:', err);
      throw err;
    }
  };

  return {
    plan,
    isLoading,
    createPlan: savePlan,
    updatePlan: savePlan,
    reload: loadPlan,
  };
}
