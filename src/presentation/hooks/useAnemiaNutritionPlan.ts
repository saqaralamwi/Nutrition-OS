import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { AnemiaNutritionPlan } from '../../domain/types/anemia';

export function useAnemiaNutritionPlan(patientId: string) {
  const [plan, setPlan] = useState<AnemiaNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('anemia_nutrition_plans')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any;
        setPlan(record.toDomain());
      } else {
        setPlan(null);
      }
    } catch (err) {
      console.error('[useAnemiaNutritionPlan] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const savePlan = async (data: any) => {
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const collection = db.get('anemia_nutrition_plans');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();

        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.assessmentId = data.assessmentId || '';
          record.targetIron = Number(data.targetIron ?? 0);
          record.targetB12 = Number(data.targetB12 ?? 0);
          record.targetFolate = Number(data.targetFolate ?? 0);
          record.targetProtein = Number(data.targetProtein ?? 0);
          record.targetVitaminC = Number(data.targetVitaminC ?? 0);
          record.targetZinc = Number(data.targetZinc ?? 0);
          record.needsIronSupplement = !!data.needsIronSupplement;
          record.ironSupplementType = data.ironSupplementType ?? 'ferrous_sulfate';
          record.ironSupplementDose = Number(data.ironSupplementDose ?? 0);
          record.ironSupplementDuration = Number(data.ironSupplementDuration ?? 0);
          record.needsB12Supplement = !!data.needsB12Supplement;
          record.b12SupplementType = data.b12SupplementType ?? 'oral';
          record.b12SupplementDose = Number(data.b12SupplementDose ?? 0);
          record.needsFolateSupplement = !!data.needsFolateSupplement;
          record.folateSupplementDose = Number(data.folateSupplementDose ?? 0);
          record.ironRichFoods = JSON.stringify(data.ironRichFoods ?? []);
          record.b12RichFoods = JSON.stringify(data.b12RichFoods ?? []);
          record.folateRichFoods = JSON.stringify(data.folateRichFoods ?? []);
          record.vitaminCRichFoods = JSON.stringify(data.vitaminCRichFoods ?? []);
          record.avoidWithIron = JSON.stringify(data.avoidWithIron ?? []);
          record.avoidTiming = data.avoidTiming ?? '';
          record.hemoglobinCheckFrequency = data.hemoglobinCheckFrequency ?? 'monthly';
          record.targetHemoglobin = Number(data.targetHemoglobin ?? 12);
          record.expectedRecoveryWeeks = Number(data.expectedRecoveryWeeks ?? 8);
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
      await loadPlan();
    } catch (err) {
      console.error('[useAnemiaNutritionPlan] Save failed:', err);
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
