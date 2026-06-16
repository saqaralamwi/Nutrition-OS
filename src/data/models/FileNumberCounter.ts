import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class FileNumberCounter extends Model {
  static table = 'file_number_counters';

  @field('year') year!: number;
  @field('count') count!: number;
  @date('last_incremented_at') lastIncrementedAt!: Date;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
