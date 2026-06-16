export interface NutritionTemplate {
  id: string;
  conditionName: string;
  conditionNameAr: string;
  description: string;
  descriptionAr: string;

  energyKcalPerKg: number | null;
  energyTotalKcal: number | null;
  energyNote: string | null;
  energyNoteAr: string | null;

  proteinPercent: number | null;
  carbohydratePercent: number | null;
  fatPercent: number | null;

  proteinGPerKg: number | null;
  fiberGPerDay: number | null;

  sodiumGPerDay: number | null;
  potassiumNote: string | null;
  potassiumNoteAr: string | null;
  phosphorusMgPerDay: number | null;
  fluidMlPerDay: number | null;

  specialRecommendations: string;
  specialRecommendationsAr: string;

  mealsPerDay: number | null;
  mealPatternNote: string | null;
  mealPatternNoteAr: string | null;

  appliesToDiagnosis: readonly string[];
  appliesToDietType: string | null;
  appliesToRouteOfFeeding: string | null;
}
