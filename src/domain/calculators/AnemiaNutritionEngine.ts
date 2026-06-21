import { AnemiaAssessment, AnemiaSeverity, AnemiaType } from '../types/anemia';

export interface AnemiaNutritionRequirements {
  targetIron: number; // mg/day
  targetB12: number; // µg/day
  targetFolate: number; // µg/day
  targetProtein: number; // g/day
  targetVitaminC: number; // mg/day (enhances iron absorption)
  targetZinc: number; // mg/day
  totalCalories: number; // kcal/day
}

export interface SupplementationRecommendation {
  needsIron: boolean;
  ironType: 'ferrous_sulfate' | 'ferrous_fumarate' | 'ferrous_glucosate' | 'heme_iron' | 'none';
  ironDose: number; // mg/day
  ironDuration: number; // weeks
  
  needsB12: boolean;
  b12Type: 'oral' | 'sublingual' | 'intranasal' | 'intramuscular' | 'none';
  b12Dose: number; // µg/day
  
  needsFolate: boolean;
  folateDose: number; // mg/day
}

export interface DietaryRecommendations {
  ironRichFoods: string[];
  b12RichFoods: string[];
  folateRichFoods: string[];
  vitaminCRichFoods: string[];
  avoidWithIron: string[];
  mealTiming: string;
}

export class AnemiaNutritionEngine {
  
  /**
   * Calculate comprehensive anemia nutrition requirements
   */
  static calculateRequirements(
    assessment: AnemiaAssessment,
    weight: number,
    age: number,
    gender: 'male' | 'female',
    isPregnant: boolean = false,
    isLactating: boolean = false
  ): AnemiaNutritionRequirements {
    
    if (!weight || weight <= 0) {
      throw new Error('Valid weight is required');
    }
    
    // Step 2: Calculate iron requirements
    let targetIron: number;
    
    if (isPregnant) {
      targetIron = 30; // Pregnancy: 30 mg/day
    } else if (isLactating) {
      targetIron = 10; // Lactation: 10 mg/day
    } else if (gender === 'female') {
      targetIron = 18; // Adult female: 18 mg/day
    } else {
      targetIron = 8; // Adult male: 8 mg/day
    }
    
    // Increase for deficiency
    if (assessment.ironStatus === 'very_low' || assessment.ironStatus === 'depleted') {
      targetIron *= 2.0; // Double for severe deficiency
    } else if (assessment.ironStatus === 'low') {
      targetIron *= 1.5; // 1.5x for moderate deficiency
    }
    
    // Step 3: Calculate B12 requirements
    let targetB12: number;
    
    if (assessment.b12Status === 'deficient' || assessment.b12Status === 'very_low') {
      targetB12 = 1000; // High dose for deficiency
    } else if (assessment.b12Status === 'low') {
      targetB12 = 50; // Moderate increase
    } else {
      targetB12 = 2.4; // Standard RDA
    }
    
    // Increase for vegans
    if (assessment.isVegan) {
      targetB12 *= 2.0;
    }
    
    // Step 4: Calculate folate requirements
    let targetFolate: number;
    
    if (isPregnant) {
      targetFolate = 600; // Pregnancy: 600 µg
    } else if (assessment.folateStatus === 'deficient' || assessment.folateStatus === 'very_low') {
      targetFolate = 1000; // High dose for deficiency
    } else if (assessment.folateStatus === 'low') {
      targetFolate = 800; // Moderate increase
    } else {
      targetFolate = 400; // Standard RDA
    }
    
    // Step 5: Calculate protein requirements (higher for recovery)
    const proteinPerKg = 1.2; 
    const targetProtein = weight * proteinPerKg;
    
    // Step 6: Calculate vitamin C requirements (enhances iron absorption)
    let targetVitaminC: number;
    
    if (assessment.ironStatus !== 'normal') {
      targetVitaminC = 200; // High dose to enhance absorption
    } else {
      targetVitaminC = 90; // Standard RDA for males
    }
    
    if (gender === 'female' && !isPregnant && !isLactating) {
      targetVitaminC = 75; // Standard RDA for females
    }
    
    // Step 7: Calculate zinc requirements
    const targetZinc = gender === 'male' ? 11 : 8; // Standard RDA
    
    // Step 8: Calculate total calories (for overall nutrition)
    const bmr = (10 * weight) + (6.25 * 160) - (5 * age) + (gender === 'male' ? 5 : -161);
    const totalCalories = bmr * 1.2; // Light activity
    
    return {
      targetIron: Math.round(targetIron),
      targetB12: Math.round(targetB12),
      targetFolate: Math.round(targetFolate),
      targetProtein: Math.round(targetProtein),
      targetVitaminC: Math.round(targetVitaminC),
      targetZinc: Math.round(targetZinc),
      totalCalories: Math.round(totalCalories),
    };
  }
  
  /**
   * Determine anemia type based on lab values
   */
  static determineAnemiaType(assessment: AnemiaAssessment): AnemiaType {
    const hasIronDeficiency = assessment.ironStatus !== 'normal';
    const hasB12Deficiency = assessment.b12Status !== 'normal';
    const hasFolateDeficiency = assessment.folateStatus !== 'normal';
    
    if (hasIronDeficiency && hasB12Deficiency && hasFolateDeficiency) {
      return 'mixed_deficiency';
    } else if (hasIronDeficiency) {
      return 'iron_deficiency';
    } else if (hasB12Deficiency) {
      return 'b12_deficiency';
    } else if (hasFolateDeficiency) {
      return 'folate_deficiency';
    }
    
    return assessment.anemiaType || 'unknown';
  }
  
  /**
   * Generate supplementation recommendations
   */
  static generateSupplementationRecommendations(
    assessment: AnemiaAssessment
  ): SupplementationRecommendation {
    
    // Iron supplementation
    let needsIron = false;
    let ironType: 'ferrous_sulfate' | 'ferrous_fumarate' | 'ferrous_glucosate' | 'heme_iron' | 'none' = 'none';
    let ironDose = 0;
    let ironDuration = 0;
    
    if (assessment.ironStatus !== 'normal') {
      needsIron = true;
      ironType = 'ferrous_sulfate';
      ironDose = assessment.ironStatus === 'depleted' ? 200 : 100;
      ironDuration = assessment.ironStatus === 'depleted' ? 12 : 6;
    }
    
    // B12 supplementation
    let needsB12 = false;
    let b12Type: 'oral' | 'sublingual' | 'intranasal' | 'intramuscular' | 'none' = 'none';
    let b12Dose = 0;
    
    if (assessment.b12Status !== 'normal') {
      needsB12 = true;
      b12Dose = assessment.b12Status === 'deficient' ? 1000 : 500;
      b12Type = assessment.b12Status === 'deficient' ? 'intramuscular' : 'oral';
    }
    
    // Folate supplementation
    let needsFolate = false;
    let folateDose = 0;
    
    if (assessment.folateStatus !== 'normal') {
      needsFolate = true;
      folateDose = assessment.folateStatus === 'deficient' ? 5 : 1;
    }
    
    return {
      needsIron,
      ironType,
      ironDose,
      ironDuration,
      needsB12,
      b12Type,
      b12Dose,
      needsFolate,
      folateDose,
    };
  }
  
  /**
   * Generate dietary recommendations
   */
  static generateDietaryRecommendations(
    anemiaType: AnemiaType
  ): DietaryRecommendations {
    
    const ironRichFoods = [
      'Red meat (beef, lamb)',
      'Poultry (chicken, turkey)',
      'Fish (salmon, tuna)',
      'Eggs',
      'Lentils',
      'Beans (black, kidney, pinto)',
      'Tofu',
      'Spinach',
      'Fortified cereals',
      'Pumpkin seeds',
    ];
    
    const b12RichFoods = [
      'Beef liver',
      'Fish (salmon, tuna, trout)',
      'Chicken',
      'Eggs',
      'Dairy (milk, cheese, yogurt)',
      'Fortified cereals',
      'Fortified nutritional yeast',
    ];
    
    const folateRichFoods = [
      'Leafy greens (spinach, kale, collards)',
      'Broccoli',
      'Brussels sprouts',
      'Legumes (lentils, beans)',
      'Avocado',
      'Citrus fruits',
      'Fortified cereals',
      'Asparagus',
      'Beets',
    ];
    
    const vitaminCRichFoods = [
      'Citrus fruits (orange, lemon, grapefruit)',
      'Strawberries',
      'Kiwi',
      'Bell peppers',
      'Broccoli',
      'Tomatoes',
    ];
    
    const avoidWithIron = [
      'Coffee',
      'Tea',
      'Calcium-rich foods',
      'Dairy products',
      'Eggs (high phosphorus)',
      'Whole grains (high phytates)',
    ];
    
    const mealTiming = 'Take iron supplements 1 hour before meals or 2 hours after meals. Avoid coffee/tea for 2 hours after iron.';
    
    return {
      ironRichFoods: anemiaType === 'b12_deficiency' ? b12RichFoods : (anemiaType === 'folate_deficiency' ? folateRichFoods : ironRichFoods),
      b12RichFoods,
      folateRichFoods,
      vitaminCRichFoods,
      avoidWithIron,
      mealTiming,
    };
  }
  
  /**
   * Classify anemia severity based on hemoglobin
   */
  static classifySeverity(
    hemoglobin: number,
    unit: 'g/dL' | 'g/L',
    gender: 'male' | 'female',
    isPregnant: boolean = false
  ): AnemiaSeverity {
    
    let hgb = hemoglobin;
    
    // Convert if needed
    if (unit === 'g/L') {
      hgb = hemoglobin / 10;
    }
    
    if (isPregnant) {
      if (hgb < 7) return 'critical';
      if (hgb < 8) return 'severe';
      if (hgb < 10) return 'moderate';
      if (hgb < 11) return 'mild';
      return 'none';
    } else if (gender === 'male') {
      if (hgb < 7) return 'critical';
      if (hgb < 8) return 'severe';
      if (hgb < 10) return 'moderate';
      if (hgb < 13) return 'mild';
      return 'none';
    } else {
      if (hgb < 7) return 'critical';
      if (hgb < 8) return 'severe';
      if (hgb < 10) return 'moderate';
      if (hgb < 12) return 'mild';
      return 'none';
    }
  }
  
  /**
   * Calculate expected recovery time in weeks
   */
  static calculateExpectedRecovery(
    severity: AnemiaSeverity,
    anemiaType: AnemiaType
  ): number {
    
    let weeks = 0;
    
    switch (severity) {
      case 'mild':
        weeks = 4;
        break;
      case 'moderate':
        weeks = 8;
        break;
      case 'severe':
        weeks = 12;
        break;
      case 'critical':
        weeks = 16;
        break;
      default:
        weeks = 0;
    }
    
    // Adjust by anemia type
    if (anemiaType === 'b12_deficiency') {
      weeks = Math.round(weeks * 1.5); // B12 takes longer to recover
    } else if (anemiaType === 'folate_deficiency') {
      weeks = Math.round(weeks * 0.8); // Folate recovers faster
    }
    
    return weeks;
  }
}
