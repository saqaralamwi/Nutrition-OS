import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class AuditLog extends Model {
  static table = 'audit_logs';

  @field('action_type') actionType!: string;
  @field('details') details!: string;
  @field('user_id') userId!: string;
  @readonly @date('created_at') createdAt!: Date;
}
