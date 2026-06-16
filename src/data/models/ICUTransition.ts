import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import ICUAdmission from './ICUAdmission';
import ICUPatientRecord from './ICUPatientRecord';

export default class ICUTransition extends Model {
  static table = 'icu_transitions';

  static associations = {
    icu_admissions: { type: 'belongs_to' as const, key: 'icu_admission_id' },
    icu_patient_records: { type: 'belongs_to' as const, key: 'icu_patient_record_id' },
  };

  @relation('icu_admissions', 'icu_admission_id') icuAdmission?: ICUAdmission;
  @relation('icu_patient_records', 'icu_patient_record_id') icuPatientRecord?: ICUPatientRecord;
  @field('icu_admission_id') icuAdmissionId!: string;
  @field('icu_patient_record_id') icuPatientRecordId?: string;
  @date('transition_date') transitionDate!: Date;
  @field('from_type') fromType!: string;
  @field('to_type') toType!: string;
  @field('reason') reason!: string;
  @field('tolerance') tolerance!: string;
  @field('notes') notes?: string;
  @field('transition_type') transitionType?: string;
  @field('transition_type_ar') transitionTypeAr?: string;
  @field('transition_time') transitionTime?: string;
  @field('nutrition_status') nutritionStatus?: string;
  @field('nutrition_status_ar') nutritionStatusAr?: string;
  @field('weight_at_discharge') weightAtDischarge?: number;
  @field('weight_change') weightChange?: number;
  @field('weight_change_percent') weightChangePercent?: number;
  @field('nutrition_needs') nutritionNeeds?: string;
  @field('nutrition_needs_ar') nutritionNeedsAr?: string;
  @field('energy_kcal') energyKcal?: number;
  @field('protein_g') proteinG?: number;
  @field('fluid_ml') fluidMl?: number;
  @field('diet_type') dietType?: string;
  @field('diet_type_ar') dietTypeAr?: string;
  @field('follow_up_plan') followUpPlan?: string;
  @field('follow_up_plan_ar') followUpPlanAr?: string;
  @date('follow_up_date') followUpDate?: Date;
  @field('follow_up_provider') followUpProvider?: string;
  @field('follow_up_provider_ar') followUpProviderAr?: string;
  @field('home_instructions') homeInstructions?: string;
  @field('home_instructions_ar') homeInstructionsAr?: string;
  @field('meal_preparation') mealPreparation?: string;
  @field('meal_preparation_ar') mealPreparationAr?: string;
  @field('food_shopping') foodShopping?: string;
  @field('food_shopping_ar') foodShoppingAr?: string;
  @field('warning_signs') warningSigns?: string;
  @field('warning_signs_ar') warningSignsAr?: string;
  @field('emergency_contact') emergencyContact?: string;
  @field('emergency_contact_ar') emergencyContactAr?: string;
  @field('transitioned_by') transitionedBy?: string;
  @date('transitioned_at') transitionedAt?: Date;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
