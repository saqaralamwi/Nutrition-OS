import { NutritionTemplate } from '../entities/NutritionTemplate';

export interface INutritionTemplateRepository {
  getAll(): Promise<NutritionTemplate[]>;
  getById(id: string): Promise<NutritionTemplate | null>;
  getByDiagnosis(diagnosis: string): Promise<NutritionTemplate[]>;
}
