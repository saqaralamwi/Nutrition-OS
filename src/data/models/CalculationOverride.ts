import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Calculation from './Calculation';

export default class CalculationOverride extends Model {
  static table = 'calculation_overrides';

  static associations = {
    calculations: { type: 'belongs_to' as const, key: 'calculation_id' },
  };

  @relation('calculations', 'calculation_id') calculation?: Calculation;
  @field('calculation_id') calculationId!: string;
  @field('original_value') originalValue!: number;
  @field('overridden_value') overriddenValue!: number;
  @field('reason') reason!: string;
  @field('overridden_by') overriddenBy!: string;

  @readonly @date('created_at') createdAt!: Date;
}
