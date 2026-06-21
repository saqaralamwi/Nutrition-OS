import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { GoutNutritionPlan } from '../../domain/types/gout';

export function useGoutNutritionPlan(patientId: string) {
  const [plan, setPlan] = useState<GoutNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('gout_nutrition_plans')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any;
        setPlan(record.toDomain());
      } else {
        setPlan(null);
      }
    } catch (err) {
      console.error('[useGoutNutritionPlan] Load failed:', err);
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
        const collection = db.get('gout_nutrition_plans');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();

        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.assessmentId = data.assessmentId ?? '';
          record.targetUricAcid = Number(data.targetUricAcid ?? 0);
          record.targetUrinaryUricAcid = Number(data.targetUrinaryUricAcid ?? 0);
          record.maxPurineIntake = Number(data.maxPurineIntake ?? 0);
          record.purineIntakeLevel = data.purineIntakeLevel ?? 'moderate';
          record.targetCalories = Number(data.targetCalories ?? 0);
          record.targetProtein = Number(data.targetProtein ?? 0);
          record.targetCarbs = Number(data.targetCarbs ?? 0);
          record.targetFat = Number(data.targetFat ?? 0);
          record.targetFiber = Number(data.targetFiber ?? 0);
          record.needsVitaminC = !!data.needsVitaminC;
          record.vitaminCDose = Number(data.vitaminCDose ?? 0);
          record.needsCoenzymeQ10 = !!data.needsCoenzymeQ10;
          record.coq10Dose = Number(data.coq10Dose ?? 0);
          record.needsFishOil = !!data.needsFishOil;
          record.fishOilDose = Number(data.fishOilDose ?? 0);
          record.allowedFoods = JSON.stringify(data.allowedFoods ?? []);
          record.limitedFoods = JSON.stringify(data.limitedFoods ?? []);
          record.avoidFoods = JSON.stringify(data.avoidFoods ?? []);
          record.lowPurineProteins = JSON.stringify(data.lowPurineProteins ?? []);
          record.lowPurineVegetables = JSON.stringify(data.lowPurineVegetables ?? []);
          record.lowPurineFruits = JSON.stringify(data.lowPurineFruits ?? []);
          record.lowPurineGrains = JSON.stringify(data.lowPurineGrains ?? []);
          record.highPurineMeats = JSON.stringify(data.highPurineMeats ?? []);
          record.highPurineSeafood = JSON.stringify(data.highPurineSeafood ?? []);
          record.highPurineVegetables = JSON.stringify(data.highPurineVegetables ?? []);
          record.highPurineLegumes = JSON.stringify(data.highPurineLegumes ?? []);
          record.avoidBeer = !!data.avoidBeer;
          record.avoidLiquor = !!data.avoidLiquor;
          record.limitWine = !!data.limitWine;
          record.maxAlcoholUnits = Number(data.maxAlcoholUnits ?? 0);
          record.targetFluid = Number(data.targetFluid ?? 0);
          record.encourageWater = !!data.encourageWater;
          record.avoidSugaryDrinks = !!data.avoidSugaryDrinks;
          record.encourageCoffee = !!data.encourageCoffee;
          record.encourageCherry = !!data.encourageCherry;
          record.needsWeightLoss = !!data.needsWeightLoss;
          record.targetWeight = Number(data.targetWeight ?? 0);
          record.weightLossRate = Number(data.weightLossRate ?? 0);
          record.onUrateLoweringTherapy = !!data.onUrateLoweringTherapy;
          record.medicationName = data.medicationName ?? '';
          record.medicationDose = data.medicationDose ?? '';
          record.medicationAdherence = Number(data.medicationAdherence ?? 0);
          record.uricAcidCheckFrequency = data.uricAcidCheckFrequency ?? 'monthly';
          record.targetFlareFrequency = Number(data.targetFlareFrequency ?? 0);
          record.expectedImprovementMonths = Number(data.expectedImprovementMonths ?? 0);
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
      console.error('[useGoutNutritionPlan] Save failed:', err);
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
