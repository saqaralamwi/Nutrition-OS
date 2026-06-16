import { NutritionTemplate } from '../../domain/entities/NutritionTemplate';
import { INutritionTemplateRepository } from '../../domain/repositories/INutritionTemplateRepository';
import { NUTRITION_TEMPLATES } from '../nutritionTemplates/templatesData';

export class NutritionTemplateRepository implements INutritionTemplateRepository {
  async getAll(): Promise<NutritionTemplate[]> {
    return NUTRITION_TEMPLATES;
  }

  async getById(id: string): Promise<NutritionTemplate | null> {
    return NUTRITION_TEMPLATES.find((t) => t.id === id) ?? null;
  }

  async getByDiagnosis(diagnosis: string): Promise<NutritionTemplate[]> {
    const lower = diagnosis.toLowerCase();
    return NUTRITION_TEMPLATES.filter((t) =>
      t.appliesToDiagnosis.some((d) => lower.includes(d) || d.includes(lower)),
    );
  }
}
