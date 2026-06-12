import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Setting extends Model {
  static table = 'settings';

  @field('key') key!: string;
  @field('value') value!: string;
  @date('updated_at') updatedAt!: Date;
}
