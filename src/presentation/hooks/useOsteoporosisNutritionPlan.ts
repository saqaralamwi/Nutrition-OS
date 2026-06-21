import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { OsteoporosisNutritionPlan } from '../../domain/types/osteoporosis';

export function useOsteoporosisNutritionPlan(patientId: string) {
  const [plan, setPlan] = useState<OsteoporosisNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('osteoporosis_nutrition_plans')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any;
        setPlan(record.toDomain());
      } else {
        setPlan(null);
      }
    } catch (err) {
      console.error('[useOsteoporosisNutritionPlan] Load failed:', err);
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
        const collection = db.get('osteoporosis_nutrition_plans');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();

        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.assessmentId = data.assessmentId || '';
          record.targetCalcium = Number(data.targetCalcium ?? 0);
          record.targetVitaminD = Number(data.targetVitaminD ?? 0);
          record.targetProtein = Number(data.targetProtein ?? 0);
          record.targetVitaminK = Number(data.targetVitaminK ?? 0);
          record.targetMagnesium = Number(data.targetMagnesium ?? 0);
          record.targetZinc = Number(data.targetZinc ?? 0);
          record.targetPhosphorus = Number(data.targetPhosphorus ?? 0);
          record.targetPotassium = Number(data.targetPotassium ?? 0);
          record.needsCalciumSupplement = !!data.needsCalciumSupplement;
          record.calciumSupplementType = data.calciumSupplementType ?? 'calcium_carbonate';
          record.calciumSupplementDose = Number(data.calciumSupplementDose ?? 0);
          record.calciumSupplementTiming = data.calciumSupplementTiming ?? 'with_meals';
          record.needsVitaminDSupplement = !!data.needsVitaminDSupplement;
          record.vitaminDSupplementType = data.vitaminDSupplementType ?? 'd3';
          record.vitaminDSupplementDose = Number(data.vitaminDSupplementDose ?? 0);
          record.needsVitaminKSupplement = !!data.needsVitaminKSupplement;
          record.vitaminKSupplementDose = Number(data.vitaminKSupplementDose ?? 0);
          record.needsMagnesiumSupplement = !!data.needsMagnesiumSupplement;
          record.magnesiumSupplementDose = Number(data.magnesiumSupplementDose ?? 0);
          record.weightBearingExercise = !!data.weightBearingExercise;
          record.resistanceTraining = !!data.resistanceTraining;
          record.balanceExercise = !!data.balanceExercise;
          record.exerciseFrequency = Number(data.exerciseFrequency ?? 0);
          record.exerciseDuration = Number(data.exerciseDuration ?? 0);
          record.homeSafetyReview = !!data.homeSafetyReview;
          record.visionCheck = !!data.visionCheck;
          record.footwearAssessment = !!data.footwearAssessment;
          record.assistiveDevice = !!data.assistiveDevice;
          record.calciumRichFoods = JSON.stringify(data.calciumRichFoods ?? []);
          record.vitaminDRichFoods = JSON.stringify(data.vitaminDRichFoods ?? []);
          record.proteinRichFoods = JSON.stringify(data.proteinRichFoods ?? []);
          record.vitaminKRichFoods = JSON.stringify(data.vitaminKRichFoods ?? []);
          record.avoidExcessSodium = !!data.avoidExcessSodium;
          record.avoidExcessProtein = !!data.avoidExcessProtein;
          record.avoidSmoking = !!data.avoidSmoking;
          record.avoidExcessAlcohol = !!data.avoidExcessAlcohol;
          record.avoidCaffeineExcess = !!data.avoidCaffeineExcess;
          record.boneDensityCheckFrequency = data.boneDensityCheckFrequency ?? 'annual';
          record.targetBoneDensity = Number(data.targetBoneDensity ?? 0);
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
      console.error('[useOsteoporosisNutritionPlan] Save failed:', err);
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
