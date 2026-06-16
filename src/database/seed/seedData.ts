export interface FoodSeed {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  potassium: number;
  image_url: string;
  thumbnail_url: string;
  thumbnail_small_url: string;
}

export interface RecipeSeed {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: Array<{ food_id: string; amount: number; unit: string }>;
  instructions: Array<{ step: number; instructionEn: string; instructionAr: string }>;
  image_url: string;
  thumbnail_url: string;
  thumbnail_small_url: string;
}

export interface ClinicalGuidelineSeed {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  condition: string;
  recommendations: string;
  evidenceLevel: string;
  source: string;
  publishedDate: string;
}

export interface ClinicalAlertSeed {
  id: string;
  titleEn: string;
  titleAr: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityAr: string;
  condition: string;
  conditionAr: string;
  message: string;
  messageAr: string;
  action: string;
  actionAr: string;
}

export interface ClinicalRecommendationSeed {
  id: string;
  titleEn: string;
  titleAr: string;
  condition: string;
  conditionAr: string;
  recommendation: string;
  recommendationAr: string;
  priority: 'low' | 'medium' | 'high';
  priorityAr: string;
}

export interface NutritionTemplateSeed {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMG: number;
}

export interface FoodContraindicationFilterSeed {
  id: string;
  food_id: string;
  condition: string;
  conditionAr: string;
  contraindicationType: string;
  contraindicationTypeAr: string;
  severity: 'low' | 'medium' | 'high';
  severityAr: string;
  message: string;
  messageAr: string;
}
