import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';
import Medication from '../../data/models/Medication';
import Food from '../../data/models/Food';
import DrugNutrientInteractionModel from '../../data/models/DrugNutrientInteraction';
import ClinicalAlert from '../../data/models/ClinicalAlert';
import ClinicalGuideline from '../../data/models/ClinicalGuideline';

// Type definitions
export type DrugNutrientInteractionSeverity = 'low' | 'moderate' | 'high' | 'critical' | 'warning' | 'info';

export interface DrugNutrientInteraction {
  interaction: string;
  severity: DrugNutrientInteractionSeverity;
  medicationName: string;
  matchedRule: string;
  recommendation: string;

  // Backward compatibility fields for useClinicalAlerts
  drugName: string;
  mechanism: string;
  dietaryActionEn: boolean;
  category?: string;
}

export type IDNIInteractionMatch = DrugNutrientInteraction;

export interface MealSafetyInteraction {
  foodName: string;
  medicationName: string;
  interaction: string;
  severity: DrugNutrientInteractionSeverity;
  recommendation: string;
}

export interface IDNISafetyResult {
  isSafe: boolean;
  conflicts: Array<{
    medication: string;
    food: string;
    nutrient: string;
    severity: 'high' | 'warning' | 'info' | 'critical' | 'low' | 'moderate';
    mechanism: string;
    actionRequired: string;
  }>;
}

// Unified service class
export class DrugNutrientEngine {
  /**
   * Check drug-nutrient interactions using token-based matching
   * @param patientId - Patient database ID
   * @param foodName - Optional food name to check against medications
   * @returns Array of detected interactions
   */
  static async checkInteractions(
    patientId: string,
    foodName?: string
  ): Promise<DrugNutrientInteraction[]> {
    if (!patientId) {
      throw new Error('patientId is required');
    }

    try {
      const db = await getDatabase();
      
      // 1. Fetch active medications for the patient
      const activeMeds = await db.get<Medication>('medications')
        .query(Q.where('patient_id', patientId), Q.where('is_active', true))
        .fetch();

      if (activeMeds.length === 0) return [];

      const matches: DrugNutrientInteraction[] = [];

      // 2. Query DrugNutrientInteraction reference table
      const referenceData = await db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
        .query()
        .fetch();

      /**
       * Normalizes and tokenizes a string:
       * - Lowercase
       * - Remove special characters (preserving Arabic and alphanumeric)
       * - Split by whitespace
       * - Filter tokens > 2 characters
       */
      const tokenize = (str: string): string[] => {
        if (!str) return [];
        return str
          .toLowerCase()
          .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
          .split(/\s+/)
          .filter(token => token.length > 2);
      };

      const foodTokens = foodName ? tokenize(foodName) : [];

      for (const med of activeMeds) {
        const medNameStr = med.drugName || med.name || '';
        const medTokens = tokenize(medNameStr);
        
        // Look for a match in the reference data using tokenized exact word matching
        const interaction = referenceData.find(ref => {
          const refTokens = tokenize(ref.activeIngredient || '');
          return medTokens.some(mToken => refTokens.includes(mToken));
        });

        if (interaction) {
          const mechanism = interaction.mechanismAr || interaction.mechanismEn || 'تفاعل دوائي غذائي محتمل';
          const isDietaryActionReq = !!(interaction.dietaryActionAr || interaction.dietaryActionEn);
          const severity = (interaction.clinicalSeverity || 'moderate') as DrugNutrientInteractionSeverity;

          const matchObj: DrugNutrientInteraction = {
            interaction: mechanism,
            severity: severity,
            medicationName: medNameStr,
            matchedRule: interaction.activeIngredient,
            recommendation: interaction.dietaryActionEn || '',
            // Backward compatibility fields
            drugName: medNameStr,
            mechanism,
            dietaryActionEn: isDietaryActionReq,
            category: interaction.pharmacologicalClass,
          };

          if (foodName && foodTokens.length > 0) {
            // If foodName is provided, only match if the food token appears in the mechanism description
            const mechanismTokens = tokenize(`${mechanism} ${interaction.mechanismEn || ''}`);
            const hasFoodConflict = foodTokens.some(fToken => mechanismTokens.includes(fToken));

            if (hasFoodConflict) {
              matches.push(matchObj);
            }
          } else if (!foodName) {
            // If no specific food is searched, return all potential drug interactions
            matches.push(matchObj);
          }
        }
      }

      return matches;
    } catch (err: any) {
      console.error('[DrugNutrientEngine] checkInteractions failed:', err.message);
      throw new Error(`Failed to check drug-nutrient interactions: ${err.message}`);
    }
  }

  /**
   * Check meal safety using food-nutrient conflict heuristic
   * @param patientId - Patient database ID
   * @param mealItems - Array of food names or database IDs in the meal
   * @returns Array of detected meal-medication concerns
   */
  static async checkMealSafety(
    patientId: string,
    mealItems: string[]
  ): Promise<MealSafetyInteraction[]> {
    if (!patientId) {
      throw new Error('patientId is required');
    }
    if (!mealItems || mealItems.length === 0) {
      return [];
    }

    try {
      const db = await getDatabase();
      
      // 1. Fetch active medications for the patient
      const activeMeds = await db.get<Medication>('medications')
        .query(
          Q.where('patient_id', patientId),
          Q.where('is_active', true)
        )
        .fetch();

      if (activeMeds.length === 0) {
        return [];
      }

      // 2. Fetch the selected foods with their nutrient profiles (by ID or English/Arabic Name)
      const selectedFoods = await db.get<Food>('foods')
        .query(
          Q.or(
            Q.where('id', Q.oneOf(mealItems)),
            Q.where('name_en', Q.oneOf(mealItems)),
            Q.where('name_ar', Q.oneOf(mealItems))
          )
        )
        .fetch();

      if (selectedFoods.length === 0) {
        return [];
      }

      // 3. Fetch all DNI rules from the knowledge base
      const dniRules = await db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
        .query()
        .fetch();

      const matches: MealSafetyInteraction[] = [];

      // 4. Analysis Logic
      for (const med of activeMeds) {
        const drugName = (med.name || med.drugName || '').toLowerCase();
        
        // Find matching DNI rules for this medication
        const matchingRules = dniRules.filter(rule => 
          drugName.includes(rule.activeIngredient.toLowerCase()) ||
          rule.activeIngredient.toLowerCase().includes(drugName)
        );

        for (const rule of matchingRules) {
          for (const food of selectedFoods) {
            if (this.isConflict(rule, food)) {
              matches.push({
                foodName: food.nameAr || food.nameEn || 'طعام غير معروف',
                medicationName: med.name || med.drugName || 'دواء غير معروف',
                interaction: rule.mechanismEn || 'تداخل دوائي غذائي محتمل',
                severity: rule.clinicalSeverity as DrugNutrientInteractionSeverity,
                recommendation: rule.dietaryActionEn || '',
              });

              // 5. Automatically create clinical alert record
              await this.createClinicalAlert(patientId, med, food, rule);
            }
          }
        }
      }

      return matches;
    } catch (err: any) {
      console.error('[DrugNutrientEngine] checkMealSafety failed:', err.message);
      throw new Error(`Failed to check meal safety: ${err.message}`);
    }
  }

  /**
   * For backward compatibility with legacy checkMealSafety return types if needed
   */
  static async checkMealSafetyLegacy(patientId: string, foodIds: string[]): Promise<IDNISafetyResult> {
    if (!patientId) {
      throw new Error('patientId is required');
    }
    try {
      const results = await this.checkMealSafety(patientId, foodIds);
      const conflicts = results.map(r => ({
        medication: r.medicationName,
        food: r.foodName,
        nutrient: r.interaction,
        severity: r.severity as any,
        mechanism: r.interaction,
        actionRequired: r.recommendation,
      }));
      return {
        isSafe: conflicts.length === 0,
        conflicts,
      };
    } catch (err: any) {
      console.error('[DrugNutrientEngine] checkMealSafetyLegacy failed:', err.message);
      throw new Error(`Failed to check meal safety legacy: ${err.message}`);
    }
  }

  /**
   * Heuristic logic to determine if a food item triggers a specific DNI rule.
   */
  private static isConflict(rule: DrugNutrientInteractionModel, food: Food): boolean {
    const mechanism = (rule.mechanismEn || '').toLowerCase();
    const action = (rule.dietaryActionEn || '').toLowerCase();
    
    // Warfarin / Vitamin K
    if (mechanism.includes('vitamin k') || action.includes('vitamin k')) {
      if ((food.vitaminKMcg || 0) > 50 || food.category === 'leafy_greens') return true;
    }

    // Ciprofloxacin / Levothyroxine / Calcium
    if (mechanism.includes('calcium') || mechanism.includes('dairy') || action.includes('calcium')) {
      if ((food.calciumMg || 0) > 100 || food.category === 'dairy') return true;
    }

    // Metformin / PPI / B12
    if (mechanism.includes('vitamin b12') || action.includes('vitamin b12')) {
      if (mechanism.includes('impairs') || mechanism.includes('reduced absorption')) {
        return true; // Simplified for engine logic
      }
    }

    // ACE / Potassium
    if (mechanism.includes('potassium') || action.includes('potassium')) {
      if ((food.potassiumMg || 0) > 200 || food.category === 'fruits') return true;
    }

    // Statins / Grapefruit
    if (mechanism.includes('grapefruit') || action.includes('grapefruit')) {
      const foodName = (food.nameEn || food.nameAr || '').toLowerCase();
      if (foodName.includes('grapefruit') || foodName.includes('جريب فروت')) return true;
    }

    return false;
  }

  /**
   * Persists the detected conflict into the clinical_alerts table.
   */
  private static async createClinicalAlert(
    patientId: string, 
    med: Medication, 
    food: Food, 
    rule: DrugNutrientInteractionModel
  ) {
    const db = await getDatabase();
    
    // Find matching guidelines if any
    const guidelines = await db.get<ClinicalGuideline>('clinical_guidelines')
      .query(Q.where('condition', Q.like(`%${rule.activeIngredient}%`)))
      .fetch();

    await db.write(async () => {
      await db.get<ClinicalAlert>('clinical_alerts').create(alert => {
        alert.patientId = patientId;
        alert.alertType = 'drug_nutrient_interaction';
        alert.title = `DNI: ${med.name || med.drugName} vs ${food.nameAr}`;
        alert.titleAr = `تداخل دوائي غذائي: ${med.nameAr || med.name} مع ${food.nameAr}`;
        alert.message = rule.dietaryActionEn || 'تنبيه: تم رصد تداخل بين الدواء والطعام المختار.';
        alert.severity = rule.clinicalSeverity === 'high' ? 'critical' : 'warning';
        alert.medication = med.name || med.drugName;
        alert.foodContraindication = food.nameAr;
        alert.mechanism = rule.mechanismEn;
        alert.action = rule.dietaryActionEn;
        alert.guideline = guidelines[0]?.title || 'Standard Clinical DNI Protocols';
        alert.isRead = false;
        alert.isDismissed = false;
        alert.isActive = true;
      });
    });
  }
}
