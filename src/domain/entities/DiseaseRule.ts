export interface DiseaseAdjustment {
  calorieAdjustment: number;
  recommendations: string[];
  restrictions: string[];
  proteinPerKg?: number;
  fatPercentage?: number;
  carbsPercentage?: number;
}

export interface DiseaseRule {
  keywords: string[];
  apply: (currentCalories: number, weightKg: number) => DiseaseAdjustment;
}
