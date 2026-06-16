import type { RawAssessmentInput } from '../../data/types/assessment';
import type { FoodItem, PatientProfile } from '../../data/types/meal_planner';
import type { DrugNutrientInteractionRecord } from '../repositories/IDrugNutrientInteractionRepository';
import type { NutritionPlanSummary } from '../../data/types/recommendations';
import { DynamicAssessmentEngine } from './DynamicAssessmentEngine';
import { DNIEngine } from './DNIEngine';
import { MealPlannerEngine, type IFilterAndPlanResult } from './MealPlannerEngine';
import { RecommendationEngine } from './RecommendationEngine';

export interface INutritionOSPipelineResult {
  patientProfile: PatientProfile;
  mealPlanResult: IFilterAndPlanResult;
  summary: NutritionPlanSummary;
  error?: string;
}

export class NutritionOSOrchestrator {
  public static runPipeline(
    rawInput: RawAssessmentInput,
    activeDrugs: string[],
    masterDniRecords: DrugNutrientInteractionRecord[],
    availableFoods: FoodItem[],
  ): INutritionOSPipelineResult {
    const emptyResult = (): INutritionOSPipelineResult => ({
      patientProfile: {
        id: '', dryWeight: 0, targetCalories: 0, targetProtein: 0,
        targetCarbs: 0, targetFats: 0, isStrictProteinRestriction: false,
        activeContraindicatedNutrients: [],
      },
      mealPlanResult: { safeFoods: [], filteredCount: { contraindicated: 0, proteinViolation: 0, macroMismatch: 0 } },
      summary: { patientId: '', alerts: [], educationalNotesAr: [], suggestedActionPlanAr: '' },
    });

    try {
      if (!rawInput?.clinical || !rawInput?.labs) {
        return { ...emptyResult(), error: 'Missing clinical or labs data in rawInput' };
      }

      /* Step 1: Assessment Engine — produce baseline profile */
      const profile = DynamicAssessmentEngine.processAssessment(rawInput);

      /* Step 2: DNI Engine — evaluate drug-nutrient interactions */
      const safeRecords = masterDniRecords ?? [];
      const mappedDnis = DNIEngine.mapFromRepository(safeRecords);
      const dniResult = DNIEngine.evaluateInteractions(
        activeDrugs,
        profile.activeContraindicatedNutrients,
        mappedDnis,
      );

      /* Step 3: Merge drug blocks into profile */
      const finalProfile = DNIEngine.updatePatientProfile(profile, dniResult);

      /* Step 4: Meal Planner Engine — filter safe foods */
      const mealPlanResult = MealPlannerEngine.filterAndPlanMeals(
        finalProfile,
        availableFoods,
      );

      /* Step 5: Recommendation Engine — compile alerts and action plan */
      const summary = RecommendationEngine.generateSummary(
        finalProfile,
        dniResult.triggeredInteractions,
        rawInput.clinical.gcsScore,
      );

      return {
        patientProfile: finalProfile,
        mealPlanResult,
        summary,
      };
    } catch (e) {
      return { ...emptyResult(), error: `NutritionOS pipeline failed: ${(e as Error).message}` };
    }
  }
}
