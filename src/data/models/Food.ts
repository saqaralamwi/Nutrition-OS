import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export interface IClinicalNotes {
  benefits: string[];
  contraindications: string[];
  servingRecommendation: {
    condition: string;
    amount: string;
    note?: string;
  }[];
}

export default class Food extends Model {
  static table = 'foods';

  @field('name_ar') nameAr!: string;
  @field('name_en') nameEn?: string;
  @field('name') name?: string;
  @field('culture') culture?: string;
  @field('culture_ar') cultureAr?: string;
  @field('region') region?: string;
  @field('region_ar') regionAr?: string;
  @field('category') category!: string;
  @field('category_ar') categoryAr?: string;
  @field('subcategory') subcategory?: string;
  @field('serving_size_g') servingSizeG?: number;
  @field('serving_size_text') servingSizeText?: string;
  @field('serving_unit') servingUnit?: string;
  @field('servings_per_package') servingsPerPackage?: number;
  @field('calories') calories!: number;
  @field('protein_g') proteinG!: number;
  @field('carbs_g') carbsG!: number;
  @field('fat_g') fatG!: number;
  @field('fiber_g') fiberG?: number;
  @field('sugar_g') sugarG?: number;
  @field('saturated_fat') saturatedFat?: number;
  @field('monounsaturated_fat') monounsaturatedFat?: number;
  @field('polyunsaturated_fat') polyunsaturatedFat?: number;
  @field('trans_fat') transFat?: number;
  @field('cholesterol_mg') cholesterolMg?: number;
  @field('sodium_mg') sodiumMg?: number;
  @field('potassium_mg') potassiumMg?: number;
  @field('phosphorus_mg') phosphorusMg?: number;
  @field('calcium_mg') calciumMg?: number;
  @field('magnesium_mg') magnesiumMg?: number;
  @field('iron_mg') ironMg?: number;
  @field('zinc_mg') zincMg?: number;
  @field('selenium_mcg') seleniumMcg?: number;
  @field('vitamin_a_mcg') vitaminAMcg?: number;
  @field('vitamin_c_mg') vitaminCMg?: number;
  @field('vitamin_d_mcg') vitaminDMcg?: number;
  @field('vitamin_e_mg') vitaminEMg?: number;
  @field('vitamin_k_mcg') vitaminKMcg?: number;
  @field('thiamin_mg') thiaminMg?: number;
  @field('riboflavin_mg') riboflavinMg?: number;
  @field('niacin_mg') niacinMg?: number;
  @field('vitamin_b6_mg') vitaminB6Mg?: number;
  @field('vitamin_b12_mcg') vitaminB12Mcg?: number;
  @field('folate_mcg') folateMcg?: number;
  @field('biotin_mcg') biotinMcg?: number;
  @field('pantothenic_acid_mg') pantothenicAcidMg?: number;
  @field('glycemic_index') glycemicIndex?: number;
  @field('glycemic_load') glycemicLoad?: number;
  @field('glycemic_category') glycemicCategory?: string;
  @field('glycemic_category_ar') glycemicCategoryAr?: string;
  @field('allergens') allergens?: string;
  @field('allergens_ar') allergensAr?: string;
  @field('is_vegetarian') isVegetarian?: boolean;
  @field('is_vegan') isVegan?: boolean;
  @field('is_halal') isHalal?: boolean;
  @field('is_harmal') isHarmal?: boolean;
  @field('is_arabic') isArabic!: boolean;
  @field('instructions') instructions?: string;
  @field('instructions_ar') instructionsAr?: string;
  @field('cooking_method') cookingMethod?: string;
  @field('cooking_method_ar') cookingMethodAr?: string;
  @field('prep_time') prepTime?: number;
  @field('cook_time') cookTime?: number;
  @field('price_sar') priceSar?: number;
  @field('price_usd') priceUsd?: number;
  @field('price_yer') priceYer?: number;
  @field('image_url') imageUrl?: string;
  @field('image_thumbnail') imageThumbnail?: string;
  @field('is_popular') isPopular?: boolean;
  @field('is_active') isActive?: boolean;
  @field('verified') verified?: boolean;
  @field('source') source?: string;
  @field('version') version?: number;
  @field('created_by') createdBy?: string;
  @field('clinical_notes') clinicalNotes?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get parsedClinicalNotes(): IClinicalNotes | null {
    if (!this.clinicalNotes) return null;
    try {
      return JSON.parse(this.clinicalNotes) as IClinicalNotes;
    } catch {
      return null;
    }
  }
}
