export interface Intervention {
  id?: string;
  patientId: string;
  nutritionDiagnosis: string;
  mainGoal: string;
  dietType: string;
  foodTexture: string;
  routeOfFeeding: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbohydrates?: number;
  targetFat?: number;
  fluidAllowance?: number;
  dietModifications?: string;
  dietRecommendations?: string;
  supplementPlan?: string;
  behavioralInstructions?: string;
  followUpInterval: string;
  linkedFindings?: string;
  status: string;
  supersededBy?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}
