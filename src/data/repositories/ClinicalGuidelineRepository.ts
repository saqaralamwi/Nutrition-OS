import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import ClinicalGuideline from '../models/ClinicalGuideline';
import FoodContraindicationFilter from '../models/FoodContraindicationFilter';

export interface IGuidelineThresholds {
  energyKcalPerKg: number | null;
  proteinGPerKg: number | null;
  carbsPercent: number | null;
  fatPercent: number | null;
  sodiumMg: number | null;
  potassiumMg: number | null;
  phosphorusMg: number | null;
  fiberG: number | null;
}

export interface IContraindicationFilter {
  condition: string;
  conditionAr: string;
  severity: string;
  reason: string | null;
  warningMessageAr: string | null;
  blockedFoodNamesAr: string | null;
  actionAr: string | null;
  thresholdMin: number | null;
  thresholdMax: number | null;
  thresholdUnit: string | null;
}

export class ClinicalGuidelineRepository {
  static async getGuidelinesByCondition(condition: string): Promise<ClinicalGuideline[]> {
    const db = await getDatabase();
    const sanitized = condition.trim().toLowerCase();
    if (!sanitized) return [];

    const guidelines = await db.get<ClinicalGuideline>('clinical_guidelines')
      .query(
        Q.or(
          Q.where('condition', Q.like(`%${sanitized}%`)),
          Q.where('condition_ar', Q.like(`%${sanitized}%`)),
          Q.where('title_ar', Q.like(`%${sanitized}%`)),
        ),
        Q.where('is_active', true),
        Q.take(5),
      )
      .fetch();

    return guidelines;
  }

  static extractThresholds(guidelines: ClinicalGuideline[]): IGuidelineThresholds {
    const thresholds: IGuidelineThresholds = {
      energyKcalPerKg: null,
      proteinGPerKg: null,
      carbsPercent: null,
      fatPercent: null,
      sodiumMg: null,
      potassiumMg: null,
      phosphorusMg: null,
      fiberG: null,
    };

    for (const g of guidelines) {
      if (g.energyKcalPerKg) {
        const v = parseFloat(g.energyKcalPerKg);
        if (!isNaN(v)) thresholds.energyKcalPerKg = v;
      }
      if (g.proteinGPerKg) {
        const v = parseFloat(g.proteinGPerKg);
        if (!isNaN(v)) thresholds.proteinGPerKg = v;
      }
      if (g.carbsPercent) {
        const v = parseFloat(g.carbsPercent);
        if (!isNaN(v)) thresholds.carbsPercent = v;
      }
      if (g.fatPercent) {
        const v = parseFloat(g.fatPercent);
        if (!isNaN(v)) thresholds.fatPercent = v;
      }
      if (g.sodiumMg) {
        const v = parseFloat(g.sodiumMg);
        if (!isNaN(v)) thresholds.sodiumMg = v;
      }
      if (g.potassiumMg) {
        const v = parseFloat(g.potassiumMg);
        if (!isNaN(v)) thresholds.potassiumMg = v;
      }
      if (g.phosphorusMg) {
        const v = parseFloat(g.phosphorusMg);
        if (!isNaN(v)) thresholds.phosphorusMg = v;
      }
      if (g.fiberG) {
        const v = parseFloat(g.fiberG);
        if (!isNaN(v)) thresholds.fiberG = v;
      }
    }

    return thresholds;
  }

  static async getContraindicationFilters(condition: string): Promise<IContraindicationFilter[]> {
    const db = await getDatabase();
    const sanitized = condition.trim().toLowerCase();
    if (!sanitized) return [];

    const filters = await db.get<FoodContraindicationFilter>('food_contraindication_filters')
      .query(
        Q.or(
          Q.where('condition', Q.like(`%${sanitized}%`)),
          Q.where('condition_ar', Q.like(`%${sanitized}%`)),
        ),
        Q.take(20),
      )
      .fetch();

    return filters.map((f) => ({
      condition: f.condition,
      conditionAr: f.conditionAr || '',
      severity: f.severity,
      reason: f.reason || null,
      warningMessageAr: f.warningMessageAr || null,
      blockedFoodNamesAr: f.blockedFoodNamesAr || null,
      actionAr: f.actionAr || null,
      thresholdMin: f.thresholdMin ?? null,
      thresholdMax: f.thresholdMax ?? null,
      thresholdUnit: f.thresholdUnit || null,
    }));
  }
}
