import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';
import Medication from '../../data/models/Medication';
import Food from '../../data/models/Food';
import DrugNutrientInteraction from '../../data/models/DrugNutrientInteraction';
import ClinicalAlert from '../../data/models/ClinicalAlert';
import ClinicalGuideline from '../../data/models/ClinicalGuideline';

export interface IDNISafetyResult {
  isSafe: boolean;
  conflicts: Array<{
    medication: string;
    food: string;
    nutrient: string;
    severity: 'high' | 'warning' | 'info';
    mechanism: string;
    actionRequired: string;
  }>;
}

export class DrugNutrientEngine {
  /**
   * Analyzes a meal (array of food IDs) for a patient by checking active medications
   * against the Drug-Nutrient Interaction (DNI) knowledge base.
   */
  static async checkMealSafety(patientId: string, foodIds: string[]): Promise<IDNISafetyResult> {
    const db = await getDatabase();
    
    // 1. Fetch active medications for the patient
    const activeMeds = await db.get<Medication>('medications')
      .query(
        Q.where('patient_id', patientId),
        Q.where('is_active', true)
      )
      .fetch();

    if (activeMeds.length === 0 || foodIds.length === 0) {
      return { isSafe: true, conflicts: [] };
    }

    // 2. Fetch the selected foods with their nutrient profiles
    const selectedFoods = await db.get<Food>('foods')
      .query(Q.where('id', Q.oneOf(foodIds)))
      .fetch();

    // 3. Fetch all DNI rules from the knowledge base
    const dniRules = await db.get<DrugNutrientInteraction>('drug_nutrient_interactions')
      .query()
      .fetch();

    const conflicts: IDNISafetyResult['conflicts'] = [];

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
            conflicts.push({
              medication: drugName,
              food: food.nameAr || food.nameEn || 'طعام غير معروف',
              nutrient: rule.mechanismDescription || 'عنصر غذائي',
              severity: rule.clinicalSeverity as any,
              mechanism: rule.mechanismDescription || '',
              actionRequired: rule.dietaryActionRequired || '',
            });

            // 5. Automatically create clinical alert record
            await this.createClinicalAlert(patientId, med, food, rule);
          }
        }
      }
    }

    return {
      isSafe: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Heuristic logic to determine if a food item triggers a specific DNI rule.
   */
  private static isConflict(rule: DrugNutrientInteraction, food: Food): boolean {
    const mechanism = (rule.mechanismDescription || '').toLowerCase();
    const action = (rule.dietaryActionRequired || '').toLowerCase();
    
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
      // Logic for depletion or blockers
      if (mechanism.includes('impairs') || mechanism.includes('reduced absorption')) {
        // Here we trigger if the food is a known blocker or lacks the supplement
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
    rule: DrugNutrientInteraction
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
        alert.message = rule.dietaryActionRequired || 'تنبيه: تم رصد تداخل بين الدواء والطعام المختار.';
        alert.severity = rule.clinicalSeverity === 'high' ? 'critical' : 'warning';
        alert.medication = med.name || med.drugName;
        alert.foodContraindication = food.nameAr;
        alert.mechanism = rule.mechanismDescription;
        alert.action = rule.dietaryActionRequired;
        alert.guideline = guidelines[0]?.title || 'Standard Clinical DNI Protocols';
        alert.isRead = false;
        alert.isDismissed = false;
        alert.isActive = true;
      });
    });
  }
}
