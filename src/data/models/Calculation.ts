import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import CalculationOverride from './CalculationOverride';

export default class Calculation extends Model {
  static table = 'calculations';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    calculation_overrides: { type: 'has_many' as const, foreignKey: 'calculation_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') declare patientId: string;
  @children('calculation_overrides') overrides?: CalculationOverride[];
  @field('calculation_type') declare calculationType: string;
  @field('formula_name') declare formulaName: string;
  @field('input_values') declare inputValues: string;
  @field('result_value') declare resultValue: number;
  @field('is_overridden') declare isOverridden: boolean;
  @field('override_value') declare overrideValue: number;
  @field('override_reason') declare overrideReason: string;

  @field('input_weight_kg') declare inputWeightKg: number;
  @field('input_height_cm') declare inputHeightCm: number;
  @field('input_age') declare inputAge: number;
  @field('input_gender') declare inputGender: string;
  @field('input_bmi') declare inputBmi: number;
  @field('input_activity_factor') declare inputActivityFactor: number;
  @field('input_stress_factor') declare inputStressFactor: number;

  @field('result_tee') declare resultTee: number;
  @field('result_ree') declare resultRee: number;
  @field('result_protein_g') declare resultProteinG: number;
  @field('result_carbs_g') declare resultCarbsG: number;
  @field('result_fat_g') declare resultFatG: number;
  @field('result_fluid_ml') declare resultFluidMl: number;
  @field('result_calories') declare resultCalories: number;
  @field('created_by') declare createdBy: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get proteinPerKg(): number | null {
    if (!this.resultProteinG || !this.inputWeightKg) return null;
    return this.resultProteinG / this.inputWeightKg;
  }

  get caloriesPerKg(): number | null {
    if (!this.resultCalories || !this.inputWeightKg) return null;
    return this.resultCalories / this.inputWeightKg;
  }
}
