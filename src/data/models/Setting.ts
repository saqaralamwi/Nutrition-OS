import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Setting extends Model {
  static table = 'settings';

  @field('key') key!: string;
  @field('value') value!: string;

  @readonly @date('updated_at') updatedAt!: Date;
}
