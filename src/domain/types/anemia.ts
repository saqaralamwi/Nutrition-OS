// Anemia severity levels (WHO classification)
export type AnemiaSeverity = 
  | 'none' 
  | 'mild' 
  | 'moderate' 
  | 'severe' 
  | 'critical';

// Anemia type
export type AnemiaType = 
  | 'iron_deficiency'
  | 'b12_deficiency'
  | 'folate_deficiency'
  | 'mixed_deficiency'
  | 'hemolytic'
  | 'sickle_cell'
  | 'chronic_disease'
  | 'unknown';

// Iron status
export type IronStatus = 
  | 'normal'
  | 'low'
  | 'very_low'
  | 'depleted';

// B12 status
export type B12Status = 
  | 'normal'
  | 'low'
  | 'very_low'
  | 'deficient';

// Folate status
export type FolateStatus = 
  | 'normal'
  | 'low'
  | 'very_low'
  | 'deficient';

// Interface for anemia assessment
export interface AnemiaAssessment {
  id?: string;
  patientId: string;
  
  // Hemoglobin levels
  hemoglobin: number; // g/dL
  hemoglobinUnit: 'g/dL' | 'g/L';
  
  // Anemia classification
  severity: AnemiaSeverity;
  anemiaType: AnemiaType;
  
  // Iron status
  serumIron: number; // µg/dL
  tibc: number; // Total Iron Binding Capacity µg/dL
  ferritin: number; // ng/mL
  transferrinSaturation: number; // percentage
  ironStatus: IronStatus;
  
  // B12 status
  vitaminB12: number; // pg/mL
  b12Status: B12Status;
  
  // Folate status
  serumFolate: number; // ng/mL
  folateStatus: FolateStatus;
  
  // Additional labs
  mcv: number; // Mean Corpuscular Volume fL
  mch: number; // Mean Corpuscular Hemoglobin pg
  mchc: number; // Mean Corpuscular Hemoglobin Concentration g/dL
  rdw: number; // Red Cell Distribution Width percentage
  
  // RBC indices
  reticulocyteCount: number; // percentage
  leukocyteCount: number; // WBC x10^9/L
  plateletCount: number; // x10^9/L
  
  // Clinical symptoms
  hasFatigue: boolean;
  hasWeakness: boolean;
  hasDyspnea: boolean;
  hasPalpitations: boolean;
  hasHeadache: boolean;
  hasDizziness: boolean;
  hasColdIntolerance: boolean;
  hasPallor: boolean;
  hasKoilonychia: boolean; // Spoon nails
  hasGlossitis: boolean; // Inflamed tongue
  
  // Risk factors
  hasMenstruation: boolean;
  isPregnant: boolean;
  isLactating: boolean;
  hasGIBleeding: boolean;
  hasChronicDisease: boolean;
  isVegetarian: boolean; // Vegetarian
  isVegan: boolean; // Vegan
  hasMalnutrition: boolean;
  
  // Dietary assessment
  avgIronIntake: number; // mg/day
  avgB12Intake: number; // µg/day
  avgFolateIntake: number; // µg/day
  dietaryPattern: 'regular' | 'vegetarian' | 'vegan' | 'restricted';
  
  // Created/Updated
  createdAt: string;
  updatedAt: string;
}

// Interface for anemia nutrition plan
export interface AnemiaNutritionPlan {
  id?: string;
  patientId: string;
  assessmentId: string;
  
  // Nutrient targets
  targetIron: number; // mg/day
  targetB12: number; // µg/day
  targetFolate: number; // µg/day
  targetProtein: number; // g/day
  targetVitaminC: number; // mg/day (enhances iron absorption)
  targetZinc: number; // mg/day
  
  // Supplementation
  needsIronSupplement: boolean;
  ironSupplementType: 'ferrous_sulfate' | 'ferrous_fumarate' | 'ferrous_glucosate' | 'heme_iron';
  ironSupplementDose: number; // mg/day
  ironSupplementDuration: number; // weeks
  
  needsB12Supplement: boolean;
  b12SupplementType: 'oral' | 'sublingual' | 'intranasal' | 'intramuscular';
  b12SupplementDose: number; // µg/day
  
  needsFolateSupplement: boolean;
  folateSupplementDose: number; // mg/day
  
  // Dietary recommendations
  ironRichFoods: string[];
  b12RichFoods: string[];
  folateRichFoods: string[];
  vitaminCRichFoods: string[];
  
  // Avoid/inhibitors
  avoidWithIron: string[]; // e.g., ['coffee', 'tea', 'calcium']
  avoidTiming: string; // e.g., '2 hours before/after iron'
  
  // Monitoring
  hemoglobinCheckFrequency: 'weekly' | 'biweekly' | 'monthly';
  targetHemoglobin: number; // g/dL
  expectedRecoveryWeeks: number;
  
  // Created/Updated
  createdAt: string;
  updatedAt: string;
}

// Interface for anemia monitoring
export interface AnemiaMonitoring {
  id?: string;
  patientId: string;
  planId: string;
  
  // Follow-up labs
  followUpDate: string;
  hemoglobin: number;
  ferritin: number;
  serumIron: number;
  vitaminB12: number;
  serumFolate: number;
  mcv: number;
  
  // Clinical status
  fatigueImprovement: 'none' | 'mild' | 'moderate' | 'significant';
  weaknessImprovement: 'none' | 'mild' | 'moderate' | 'significant';
  adherenceToSupplements: boolean;
  adherenceToDiet: boolean;
  
  // Side effects
  hasGISideEffects: boolean;
  sideEffectSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  
  // Progress
  isImproving: boolean;
  recoveryPercentage: number; // 0-100%
  nextFollowUpDate: string;
  
  // Created/Updated
  createdAt: string;
  updatedAt: string;
}
