import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import InterventionModel from '../models/Intervention';
import { NutritionPlan } from '../../domain/entities/NutritionPlan';
import { INutritionPlanRepository } from '../../domain/repositories/INutritionPlanRepository';

export class NutritionPlanRepository implements INutritionPlanRepository {
  async save(plan: NutritionPlan): Promise<string> {
    const db = await getDatabase();
    const result = await db.write(async () => {
      const collection = db.get<InterventionModel>('interventions');
      return collection.create((record) => {
        record.nutritionDiagnosis = `plan:${plan.patientId}`;
        record.mainGoal = 'dietary_plan';
        record.dietType = 'standard';
        record.foodTexture = 'normal';
        record.routeOfFeeding = 'oral';
        record.targetCalories = plan.totalCalories;
        record.targetProtein = plan.macros.proteinGrams;
        record.targetCarbohydrates = plan.macros.carbsGrams;
        record.targetFat = plan.macros.fatGrams;
        record.dietRecommendations = JSON.stringify(plan.recommendations);
        record.dietModifications = JSON.stringify(plan.restrictions);
        record.followUpInterval = 'weekly';
        record.status = 'active';
        record.linkedFindings = JSON.stringify({
          macros: plan.macros,
          calorieAdjustment: plan.calorieAdjustment,
        });
        if (plan.dietitianNotes) record.comments = plan.dietitianNotes;
      });
    });
    return result.id;
  }

  async getByPatientId(patientId: string): Promise<NutritionPlan[]> {
    const db = await getDatabase();
    const results = await db.get<InterventionModel>('interventions')
      .query(
        Q.where('patient_id', patientId),
        Q.where('nutrition_diagnosis', Q.like('plan:%')),
      )
      .fetch();
    return results.map((r) => this.toDomain(r, patientId));
  }

  async getLatestByPatientId(patientId: string): Promise<NutritionPlan | null> {
    const db = await getDatabase();
    const results = await db.get<InterventionModel>('interventions')
      .query(
        Q.where('patient_id', patientId),
        Q.where('nutrition_diagnosis', Q.like('plan:%')),
        Q.sortBy('created_at', 'desc'),
      )
      .fetch();
    return results.length > 0 ? this.toDomain(results[0], patientId) : null;
  }

  async updateNotes(id: string, notes: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const plan = await db.get<InterventionModel>('interventions').find(id);
      await plan.update((record) => {
        record.comments = notes;
      });
    });
  }

  private toDomain(model: InterventionModel, patientId: string): NutritionPlan {
    const linked = model.linkedFindings ? JSON.parse(model.linkedFindings) : {};
    const recommendations = model.dietRecommendations ? JSON.parse(model.dietRecommendations) : [];
    const restrictions = model.dietModifications ? JSON.parse(model.dietModifications) : [];
    const macros = linked.macros || { proteinGrams: 0, proteinCalories: 0, carbsGrams: 0, carbsCalories: 0, fatGrams: 0, fatCalories: 0 };

    return {
      id: model.id,
      patientId,
      patientMetricsId: '',
      totalCalories: model.targetCalories || 0,
      calorieAdjustment: linked.calorieAdjustment || 0,
      macros: {
        proteinGrams: model.targetProtein || macros.proteinGrams,
        proteinCalories: (model.targetProtein || macros.proteinGrams) * 4,
        carbsGrams: model.targetCarbohydrates || macros.carbsGrams,
        carbsCalories: (model.targetCarbohydrates || macros.carbsGrams) * 4,
        fatGrams: model.targetFat || macros.fatGrams,
        fatCalories: (model.targetFat || macros.fatGrams) * 9,
      },
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      restrictions: Array.isArray(restrictions) ? restrictions : [],
      createdAt: model.createdAt?.toISOString(),
      dietitianNotes: model.comments || undefined,
    };
  }
}
