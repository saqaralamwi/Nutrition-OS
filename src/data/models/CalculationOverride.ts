import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class CalculationOverride extends Model {
  static table = 'calculation_overrides';

  static associations = {
    calculations: { type: 'belongs_to' as const, key: 'calculation_id' },
  };

  @immutableRelation('calculations', 'calculation_id') calculation!: any;
  @field('calculation_id') calculationId!: string;
  @field('original_value') originalValue!: number;
  @field('overridden_value') overriddenValue!: number;
  @field('reason') reason!: string;
  @field('overridden_by') overriddenBy!: string;
  @date('created_at') createdAt!: Date;
}
