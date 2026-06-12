import { Model } from '@nozbe/watermelondb';
import { field, date, children, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class Calculation extends Model {
  static table = 'calculations';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    calculation_overrides: { type: 'has_many' as const, foreignKey: 'calculation_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @children('calculation_overrides') overrides!: any;
  @field('calculation_type') calculationType!: string;
  @field('formula_name') formulaName!: string;
  @field('input_values') inputValues!: string;
  @field('result_value') resultValue!: number;
  @field('is_overridden') isOverridden!: boolean;
  @field('override_value') overrideValue!: number;
  @field('override_reason') overrideReason!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
