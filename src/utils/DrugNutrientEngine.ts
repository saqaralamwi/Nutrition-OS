import { Database, Q } from '@nozbe/watermelondb';
import { getDatabase } from '../data/database';
import DrugNutrientInteractionModel from '../data/models/DrugNutrientInteraction';
import MedicationModel from '../data/models/Medication';

export interface IDNIInteractionMatch {
  drugName: string;
  mechanism: string;
  severity: string;
  dietaryActionRequired: boolean;
  category?: string;
}

export class DrugNutrientEngine {
  /**
   * Cross-references active patient medications with food contraindications.
   * Performs case-insensitive fuzzy matching to catch various naming conventions.
   */
  public static async checkInteractions(
    patientId: string,
    foodName?: string
  ): Promise<IDNIInteractionMatch[]> {
    const db = await getDatabase();
    
    // 1. Fetch active medications for the patient
    const activeMeds = await db.get<MedicationModel>('medications')
      .query(Q.where('patient_id', patientId), Q.where('is_active', true))
      .fetch();

    if (activeMeds.length === 0) return [];

    const matches: IDNIInteractionMatch[] = [];

    // 2. Query DrugNutrientInteraction reference table
    const referenceData = await db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
      .query()
      .fetch();

    for (const med of activeMeds) {
      const medName = med.drugName.toLowerCase().trim();
      
      // Look for a match in the reference data using fuzzy matching on active_ingredient
      const interaction = referenceData.find(ref => {
        const refName = (ref.activeIngredient || '').toLowerCase().trim();
        // The activeIngredient in the seed now contains "English / Arabic", 
        // so medName should be checked against it.
        return refName.includes(medName) || medName.includes(refName);
      });

      if (interaction) {
        const mechanism = interaction.mechanismAr || interaction.mechanismEn || 'تفاعل دوائي غذائي محتمل';
        const isDietaryActionReq = interaction.dietaryActionAr !== undefined || interaction.dietaryActionEn !== undefined;

        if (foodName) {
          const foodNorm = foodName.toLowerCase().trim();
          const mechanismEn = (interaction.mechanismEn || '').toLowerCase();
          if (mechanismEn.includes(foodNorm) || mechanism.includes(foodNorm)) {
            matches.push({
              drugName: med.drugName,
              mechanism,
              severity: interaction.clinicalSeverity,
              dietaryActionRequired: isDietaryActionReq,
              category: interaction.pharmacologicalClass,
            });
          }
        } else {
          matches.push({
            drugName: med.drugName,
            mechanism,
            severity: interaction.clinicalSeverity,
            dietaryActionRequired: isDietaryActionReq,
            category: interaction.pharmacologicalClass,
          });
        }
      }
    }

    return matches;
  }
}
