// AI recommendation types
export type AINutritionRecommendationType = 
  | 'calorie' 
  | 'protein' 
  | 'carbs' 
  | 'fat' 
  | 'micronutrient'
  | 'fiber'
  | 'sodium';

export type AIRiskType = 
  | 'malnutrition' 
  | 'dehydration' 
  | 'hyperglycemia' 
  | 'hypoglycemia'
  | 'electrolyte_imbalance'
  | 'protein_deficiency';

export type AIRiskLevel = 
  | 'low' 
  | 'moderate' 
  | 'high' 
  | 'critical';

export type AIDataAnalysisType = 
  | 'trend' 
  | 'pattern' 
  | 'correlation' 
  | 'outlier'
  | 'anomaly'
  | 'seasonal';

export type TrendDirection = 
  | 'up' 
  | 'down' 
  | 'stable'
  | 'fluctuating';

// AI nutrition recommendation
export interface AINutritionRecommendation {
  id: string;
  patientId: string;
  recommendationType: AINutritionRecommendationType;
  value: number;
  unit: string;
  confidence: number; // 0-1 (AI confidence score)
  reasoning: string;
  factors: string[];
  source: 'ai' | 'clinical' | 'manual';
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// AI risk prediction
export interface AIRiskPrediction {
  id: string;
  patientId: string;
  riskType: AIRiskType;
  riskScore: number; // 0-100
  riskLevel: AIRiskLevel;
  confidence: number; // 0-1
  factors: string[];
  recommendations: string[];
  severity: 'mild' | 'moderate' | 'severe';
  isFlagged: boolean;
  flaggedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// AI data analysis result
export interface AIDataAnalysis {
  id: string;
  patientId: string;
  analysisType: AIDataAnalysisType;
  metric: string;
  value: number;
  trend: TrendDirection;
  confidence: number; // 0-1
  insights: string[];
  dataPoints: number[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// AI model metadata
export interface AIModelMetadata {
  id: string;
  name: string;
  version: string;
  type: 'nutrition' | 'risk' | 'analysis';
  path: string;
  size: number; // bytes
  loaded: boolean;
  lastUsed: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
