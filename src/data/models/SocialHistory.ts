import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class SocialHistory extends Model {
  static table = 'social_histories';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @field('marital_status') maritalStatus!: string;
  @field('education_level') educationLevel!: string;
  @field('occupation') occupation!: string;
  @field('living_area') livingArea!: string;
  @field('family_structure') familyStructure!: string;
  @field('income_level') incomeLevel!: string;
  @field('smoking') smoking!: string;
  @field('cigarettes_per_day') cigarettesPerDay!: number;
  @field('years_smoked') yearsSmoked!: number;
  @field('alcohol_substance_use') alcoholSubstanceUse!: string;
  @field('physical_activity') physicalActivity!: string;
  @field('activity_description') activityDescription!: string;
  @field('dietary_history') dietaryHistory!: string;
  @field('food_allergies') foodAllergies!: string;
  @field('special_diet_before_admission') specialDietBeforeAdmission!: string;
  @field('comments') comments!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
