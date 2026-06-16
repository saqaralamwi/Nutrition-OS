import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import VitalsRecord from './VitalsRecord';
import { TPatientDiabetesPayload } from '../types/endocrinology';

export default class NutritionalPlan extends Model {
  static table = 'nutritional_plans';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    vitals_records: { type: 'belongs_to' as const, key: 'vitals_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @relation('vitals_records', 'vitals_id') vitalsRecord?: VitalsRecord;
  @field('patient_id') patientId!: string;
  @field('vitals_id') vitalsId?: string;
  @field('target_calories') targetCalories!: number;
  @field('protein_target') proteinTarget!: number;
  @field('carbs_target') carbsTarget!: number;
  @field('fat_target') fatTarget!: number;
  @field('fluid_target') fluidTarget!: number;
  @field('meals_json') mealsJson!: string;
  @field('recommendations_json') recommendationsJson!: string;
  @field('final_calories') finalCalories?: number;
  @field('is_calories_overridden') isCaloriesOverridden?: boolean;
  @field('final_protein') finalProtein?: number;
  @field('is_protein_overridden') isProteinOverridden?: boolean;
  @field('final_carbs') finalCarbs?: number;
  @field('is_carbs_overridden') isCarbsOverridden?: boolean;
  @field('final_fat') finalFat?: number;
  @field('is_fat_overridden') isFatOverridden?: boolean;
  @field('fiber') fiber?: number;
  @field('sodium') sodium?: number;
  @field('potassium') potassium?: number;
  @field('phosphorus') phosphorus?: number;
  @field('calcium') calcium?: number;
  @field('magnesium') magnesium?: number;
  @field('iron') iron?: number;
  @field('zinc') zinc?: number;
  @field('vitamin_a') vitaminA?: number;
  @field('vitamin_c') vitaminC?: number;
  @field('vitamin_d') vitaminD?: number;
  @field('vitamin_e') vitaminE?: number;
  @field('vitamin_k') vitaminK?: number;
  @field('folate') folate?: number;
  @field('niacin') niacin?: number;
  @field('thiamin') thiamin?: number;
  @field('riboflavin') riboflavin?: number;
  @field('biotin') biotin?: number;
  @field('pantothenic_acid') pantothenicAcid?: number;
  @field('cholesterol') cholesterol?: number;
  @field('saturated_fat') saturatedFat?: number;
  @field('monounsaturated_fat') monounsaturatedFat?: number;
  @field('polyunsaturated_fat') polyunsaturatedFat?: number;
  @field('trans_fat') transFat?: number;
  @field('glycemic_load') glycemicLoad?: number;
  @field('diet_prescription') dietPrescription?: string;
  @field('diet_prescription_ar') dietPrescriptionAr?: string;
  @field('intervention_actions') interventionActions?: string;
  @field('clinical_notes') clinicalNotes?: string;
  @field('clinical_notes_ar') clinicalNotesAr?: string;
  @field('specialized_metadata') specializedMetadata?: string;
  @field('status') status?: string;
  @date('start_date') startDate?: Date;
  @date('end_date') endDate?: Date;
  @date('review_date') reviewDate?: Date;
  @field('created_by') createdBy?: string;
  @date('deleted_at') deletedAt?: Date;

  get diabetesProfile(): TPatientDiabetesPayload | null {
    if (!this.specializedMetadata) return null;
    try {
      const parsed = JSON.parse(this.specializedMetadata);
      if (!parsed || typeof parsed !== 'object' || !parsed.diabetesType) return null;
      return parsed as TPatientDiabetesPayload;
    } catch {
      return null;
    }
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
