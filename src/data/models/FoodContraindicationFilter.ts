import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class FoodContraindicationFilter extends Model {
  static table = 'food_contraindication_filters';

  @field('food_item_id') foodItemId?: string;
  @field('condition') condition!: string;
  @field('condition_ar') conditionAr?: string;
  @field('severity') severity!: string;
  @field('reason') reason?: string;
  @field('allergen') allergen?: string;
  @field('allergen_ar') allergenAr?: string;
  @field('action') action?: string;
  @field('action_ar') actionAr?: string;
  @field('threshold_min') thresholdMin?: number;
  @field('threshold_max') thresholdMax?: number;
  @field('threshold_unit') thresholdUnit?: string;
  @field('description') description?: string;
  @field('description_ar') descriptionAr?: string;
  @field('warning_message') warningMessage?: string;
  @field('warning_message_ar') warningMessageAr?: string;
  @field('blocked_food_ids') blockedFoodIds?: string;
  @field('blocked_food_names') blockedFoodNames?: string;
  @field('blocked_food_names_ar') blockedFoodNamesAr?: string;
  @field('exceptions') exceptions?: string;
  @field('exceptions_ar') exceptionsAr?: string;
  @field('allow_with_permission') allowWithPermission?: boolean;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
