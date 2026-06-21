// Stroke severity levels
export type StrokeSeverity = 'mild' | 'moderate' | 'severe' | 'massive';

// Dysphagia severity (from water swallow test)
export type DysphagiaSeverity = 'none' | 'mild' | 'moderate' | 'severe' | 'cannot_eat';

// Food consistency levels for dysphagia
export type FoodConsistency = 
  | 'regular'
  | 'soft'
  | 'pureed'
  | 'liquidized_thick'
  | 'liquidized_thin'
  | 'npo'; // nil per oral (IV only)

// Feeding route
export type FeedingRoute = 
  | 'oral'
  | 'enteral_nasogastric'
  | 'enteral_percutaneous'
  | 'parenteral Central'
  | 'parenteral_peripheral'
  | 'mixed';

// Stroke type
export type StrokeType = 
  | 'ischemic'
  | 'hemorrhagic'
  | 'subarachnoid_hemorrhage'
  | 'unknown';

// Stroke location
export type StrokeLocation = 
  | 'left_hemisphere'
  | 'right_hemisphere'
  | 'bilateral'
  | 'brainstem'
  | 'cerebellum'
  | 'unknown';

// Interface for stroke assessment
export interface StrokeAssessment {
  patientId: string;
  strokeDate: string; // ISO date
  strokeType: StrokeType;
  strokeLocation: StrokeLocation;
  severity: StrokeSeverity;
  hoursSinceStroke: number;
  
  // Neurological status
  gcs: number; // Glasgow Coma Scale (3-15)
  nse: number; // NIHSS Stroke Score (0-56)
  
  // Dysphagia assessment
  hasDysphagia: boolean;
  dysphagiaSeverity: DysphagiaSeverity;
  waterSwallowTestResult: 'pass' | 'fail' | 'inconclusive';
  coughReflex: 'normal' | 'diminished' | 'absent';
  
  // Feeding status
  feedingRoute: FeedingRoute;
  foodConsistency: FoodConsistency;
  
  // Nutrition status
  needsEnteralNutrition: boolean;
  needsParenteralNutrition: boolean;
  oralIntakePercentage: number; // 0-100%
  
  // Created/Updated
  createdAt: string;
  updatedAt: string;
}

// Interface for stroke nutrition plan
export interface StrokeNutritionPlan {
  patientId: string;
  assessmentId: string;
  
  // Energy requirements
  targetCalories: number; // kcal/day
  targetProtein: number; // grams/day
  targetFluid: number; // mL/day
  
  // Adjustments for stroke
  stressFactor: number; // 1.0-1.4 (hypermetabolism)
  activityFactor: number; // 0.9-1.2
  
  // Dysphagia modifications
  thickenLiquids: boolean;
  liquidThickness: 'thin' | 'moderate' | 'thick' | 'nectar' | 'honey';
  avoidFoods: string[]; // e.g., ['watery fruits', 'green vegetables', 'bread']
  
  // Feeding schedule
  feedingFrequency: number; // meals per day
  nocturnalFeeding: boolean;
  nocturnalRate: number; // mL/hour
  
  // Monitoring
  weightCheckFrequency: 'daily' | 'weekly' | 'biweekly';
  aspirationRisk: 'low' | 'moderate' | 'high';
  
  // Created/Updated
  createdAt: string;
  updatedAt: string;
}

// Interface for dysphagia intervention
export interface DysphagiaIntervention {
  patientId: string;
  assessmentId: string;
  
  // Swallowing therapy
  swallowTherapyType: 'none' | 'oral_motor' | 'compensatory' | 'rehabilitative';
  therapyFrequency: number; // sessions per week
  
  // Positioning
  feedingPosition: 'supine' | 'semi_fowler' | 'fowler' | 'upright_90';
  chinTuck: boolean;
  headRotation: boolean;
  
  // Food modifications
  foodTemperature: 'cold' | 'room_temp' | 'warm';
  foodTexture: 'liquid' | 'pureed' | 'minced' | 'regular';
  
  // Safety
  suctionAvailable: boolean;
  emergencyProtocol: 'none' | 'fast_response' | 'full_support';
  
  // Created/Updated
  createdAt: string;
  updatedAt: string;
}
