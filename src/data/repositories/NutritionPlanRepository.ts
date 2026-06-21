import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import NutritionalPlanModel from '../models/NutritionalPlan';
import { NutritionPlan } from '../../domain/entities/NutritionPlan';
import { INutritionPlanRepository } from '../../domain/repositories/INutritionPlanRepository';

export class NutritionPlanRepository implements INutritionPlanRepository {
  async save(plan: NutritionPlan): Promise<string> {
    const db = await getDatabase();
    const result = await db.write(async () => {
      const collection = db.get<NutritionalPlanModel>('nutritional_plans');
      return collection.create((record) => {
        record.patientId = plan.patientId;
        if (plan.vitalsId) record.vitalsId = plan.vitalsId;
        
        record.targetCalories = plan.targetCalories;
        record.proteinTarget = plan.proteinTarget;
        record.carbsTarget = plan.carbsTarget;
        record.fatTarget = plan.fatTarget;
        record.fluidTarget = plan.fluidTarget;
        
        record.mealsJson = plan.mealsJson || '[]';
        record.recommendationsJson = plan.recommendationsJson || '[]';
        
        record.finalCalories = plan.finalCalories ?? undefined;
        record.isCaloriesOverridden = plan.isCaloriesOverridden ?? undefined;
        record.finalProtein = plan.finalProtein ?? undefined;
        record.isProteinOverridden = plan.isProteinOverridden ?? undefined;
        record.finalCarbs = plan.finalCarbs ?? undefined;
        record.isCarbsOverridden = plan.isCarbsOverridden ?? undefined;
        record.finalFat = plan.finalFat ?? undefined;
        record.isFatOverridden = plan.isFatOverridden ?? undefined;
        
        record.fiber = plan.fiber ?? undefined;
        record.sodium = plan.sodium ?? undefined;
        record.potassium = plan.potassium ?? undefined;
        record.phosphorus = plan.phosphorus ?? undefined;
        record.calcium = plan.calcium ?? undefined;
        record.magnesium = plan.magnesium ?? undefined;
        record.iron = plan.iron ?? undefined;
        record.zinc = plan.zinc ?? undefined;
        record.vitaminA = plan.vitaminA ?? undefined;
        record.vitaminC = plan.vitaminC ?? undefined;
        record.vitaminD = plan.vitaminD ?? undefined;
        record.vitaminE = plan.vitaminE ?? undefined;
        record.vitaminK = plan.vitaminK ?? undefined;
        record.folate = plan.folate ?? undefined;
        record.niacin = plan.niacin ?? undefined;
        record.thiamin = plan.thiamin ?? undefined;
        record.riboflavin = plan.riboflavin ?? undefined;
        record.biotin = plan.biotin ?? undefined;
        record.pantothenicAcid = plan.pantothenicAcid ?? undefined;
        record.cholesterol = plan.cholesterol ?? undefined;
        record.saturatedFat = plan.saturatedFat ?? undefined;
        record.monounsaturatedFat = plan.monounsaturatedFat ?? undefined;
        record.polyunsaturatedFat = plan.polyunsaturatedFat ?? undefined;
        record.transFat = plan.transFat ?? undefined;
        record.glycemicLoad = plan.glycemicLoad ?? undefined;
        
        if (plan.dietitianNotes) record.clinicalNotes = plan.dietitianNotes;
        record.status = 'active';
      });
    });
    return result.id;
  }

  async getByPatientId(patientId: string): Promise<NutritionPlan[]> {
    const db = await getDatabase();
    const results = await db.get<NutritionalPlanModel>('nutritional_plans')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
      )
      .fetch();
    return results.map(this.toDomain);
  }

  async getLatestByPatientId(patientId: string): Promise<NutritionPlan | null> {
    const db = await getDatabase();
    const results = await db.get<NutritionalPlanModel>('nutritional_plans')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
        Q.take(1),
      )
      .fetch();
    return results.length > 0 ? this.toDomain(results[0]) : null;
  }

  async updateNotes(id: string, notes: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const plan = await db.get<NutritionalPlanModel>('nutritional_plans').find(id);
      await plan.update((record) => {
        record.clinicalNotes = notes;
      });
    });
  }

  private toDomain(model: NutritionalPlanModel): NutritionPlan {
    return {
      id: model.id,
      patientId: model.patientId,
      vitalsId: model.vitalsId,
      targetCalories: model.targetCalories,
      proteinTarget: model.proteinTarget,
      carbsTarget: model.carbsTarget,
      fatTarget: model.fatTarget,
      fluidTarget: model.fluidTarget,
      mealsJson: model.mealsJson,
      recommendationsJson: model.recommendationsJson,
      finalCalories: model.finalCalories,
      isCaloriesOverridden: model.isCaloriesOverridden,
      finalProtein: model.finalProtein,
      isProteinOverridden: model.isProteinOverridden,
      finalCarbs: model.finalCarbs,
      isCarbsOverridden: model.isCarbsOverridden,
      finalFat: model.finalFat,
      isFatOverridden: model.isFatOverridden,
      fiber: model.fiber,
      sodium: model.sodium,
      potassium: model.potassium,
      phosphorus: model.phosphorus,
      calcium: model.calcium,
      magnesium: model.magnesium,
      iron: model.iron,
      zinc: model.zinc,
      vitaminA: model.vitaminA,
      vitaminC: model.vitaminC,
      vitaminD: model.vitaminD,
      vitaminE: model.vitaminE,
      vitaminK: model.vitaminK,
      folate: model.folate,
      niacin: model.niacin,
      thiamin: model.thiamin,
      riboflavin: model.riboflavin,
      biotin: model.biotin,
      pantothenicAcid: model.pantothenicAcid,
      cholesterol: model.cholesterol,
      saturatedFat: model.saturatedFat,
      monounsaturatedFat: model.monounsaturatedFat,
      polyunsaturatedFat: model.polyunsaturatedFat,
      transFat: model.transFat,
      glycemicLoad: model.glycemicLoad,
      createdAt: model.createdAt?.toISOString(),
      dietitianNotes: model.clinicalNotes || undefined,
    };
  }
}
