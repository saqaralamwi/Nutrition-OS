import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class TherapeuticFood extends Model {
  static table = 'therapeutic_foods';

  @field('name_ar') nameAr!: string;
  @field('name_en') nameEn!: string;
  @field('calories_per_100g') caloriesPer100g!: number;
  @field('protein_per_100g') proteinPer100g!: number;
  @field('carbs_per_100g') carbsPer100g!: number;
  @field('fat_per_100g') fatPer100g!: number;
  @field('potassium_mg') potassiumMg!: number;
  @field('phosphorus_mg') phosphorusMg!: number;
  @field('sodium_mg') sodiumMg!: number;
  @field('calcium_mg') calciumMg!: number;
  @field('glycemic_index') glycemicIndex!: number;
  @field('purine_level') purineLevel!: string;
  @field('allergen_tags') allergenTagsRaw!: string;
  @field('therapeutic_benefits') therapeuticBenefitsRaw!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get allergenTags(): string[] {
    if (!this.allergenTagsRaw) return [];
    try {
      const parsed = JSON.parse(this.allergenTagsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  get therapeuticBenefits(): Record<string, string> {
    if (!this.therapeuticBenefitsRaw) return {};
    try {
      const parsed = JSON.parse(this.therapeuticBenefitsRaw);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  get isHighPotassium(): boolean {
    return this.potassiumMg > 200;
  }

  get isHighPhosphorus(): boolean {
    return this.phosphorusMg > 250;
  }

  get isHighSodium(): boolean {
    return this.sodiumMg > 120;
  }

  get isLowGlycemic(): boolean {
    return this.glycemicIndex <= 55;
  }
}
