import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class FhirNutritionOrder extends Model {
  static table = 'fhir_nutrition_orders';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('order_date') orderDate!: Date;
  @field('order_type') orderType!: string;
  @field('status') status!: string;
  @field('status_ar') statusAr?: string;
  @field('code') code?: string;
  @field('description') description!: string;
  @field('formulation') formulation?: string;
  @field('route_of_administration') routeOfAdministration?: string;
  @field('rate_quantity') rateQuantity?: string;
  @field('rate_unit') rateUnit?: string;
  @field('energy_modifier') energyModifier?: string;
  @field('protein_modifier') proteinModifier?: string;
  @field('carbohydrate_modifier') carbohydrateModifier?: string;
  @field('fat_modifier') fatModifier?: string;
  @field('fiber_modifier') fiberModifier?: string;
  @field('fluid_modifier') fluidModifier?: string;
  @field('additive') additive?: string;
  @field('ordered_by') orderedBy?: string;
  @field('encounter_id') encounterId?: string;
  @field('reason_code') reasonCode?: string;
  @field('note') note?: string;
  @field('fhir_id') fhirId?: string;
  @field('fhir_version') fhirVersion?: string;
  @field('patient_reference') patientReference?: string;
  @field('dietary_preference') dietaryPreference?: string;
  @field('dietary_preference_ar') dietaryPreferenceAr?: string;
  @field('dietary_restriction') dietaryRestriction?: string;
  @field('dietary_restriction_ar') dietaryRestrictionAr?: string;
  @field('meal_preparation_instructions') mealPreparationInstructions?: string;
  @field('meal_preparation_instructions_ar') mealPreparationInstructionsAr?: string;
  @field('nutrition_components') nutritionComponents?: string;
  @field('nutrition_components_ar') nutritionComponentsAr?: string;
  @field('sync_status') syncState?: string;
  @field('sync_status_ar') syncStatusAr?: string;
  @date('sync_at') syncAt?: Date;
  @field('sync_error') syncError?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
