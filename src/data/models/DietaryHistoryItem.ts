import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class DietaryHistoryItem extends Model {
  static table = 'patient_dietary_history_items';

  @field('session_id') sessionId!: string;
  @field('meal_slot_type') mealSlotType!: string;
  @field('consumption_time') consumptionTime!: string;
  @field('food_exchange_id') foodExchangeId!: string;
  @field('custom_reported_name') customReportedName!: string;
  @field('serving_unit_used') servingUnitUsed!: string;
  @field('servings_consumed') servingsConsumed!: number;
  @field('derived_fluid_ml') derivedFluidMl!: number;
  @field('derived_calories') derivedCalories!: number;
  @field('derived_protein') derivedProtein!: number;
  @field('derived_carbs') derivedCarbs!: number;
  @field('derived_fat') derivedFat!: number;
}
