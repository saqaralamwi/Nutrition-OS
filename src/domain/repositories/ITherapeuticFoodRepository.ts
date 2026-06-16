export interface TherapeuticFoodRecord {
  id?: string;
  nameAr: string;
  nameEn: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  potassiumMg?: number;
  phosphorusMg?: number;
  sodiumMg?: number;
  calciumMg?: number;
  glycemicIndex?: number;
  purineLevel?: string;
  allergenTags?: string;
  therapeuticBenefits?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITherapeuticFoodRepository {
  getAll(): Promise<TherapeuticFoodRecord[]>;
  getById(id: string): Promise<TherapeuticFoodRecord | null>;
  search(query: string): Promise<TherapeuticFoodRecord[]>;
  getByTherapeuticBenefit(benefit: string): Promise<TherapeuticFoodRecord[]>;
}
