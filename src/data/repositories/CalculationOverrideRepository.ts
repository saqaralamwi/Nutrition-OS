import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import CalculationOverrideModel from '../models/CalculationOverride';
import { ICalculationOverrideRepository } from '../../domain/repositories/ICalculationOverrideRepository';
import { CalculationOverride } from '../../domain/entities/CalculationOverride';

function toDomain(model: CalculationOverrideModel): CalculationOverride {
  return {
    id: model.id,
    calculationId: model.calculationId,
    originalValue: model.originalValue,
    overriddenValue: model.overriddenValue,
    reason: model.reason,
    overriddenBy: model.overriddenBy,
    createdAt: model.createdAt?.toISOString(),
  };
}

export class CalculationOverrideRepository implements ICalculationOverrideRepository {
  async findByCalculationId(calculationId: string): Promise<CalculationOverride[]> {
    const db = await getDatabase();
    const records = await db.get<CalculationOverrideModel>('calculation_overrides')
      .query(
        Q.where('calculation_id', calculationId),
        Q.sortBy('created_at', 'desc'),
      ).fetch();
    return records.map(toDomain);
  }

  async create(override: CalculationOverride): Promise<string> {
    const db = await getDatabase();
    const now = new Date();
    const result = await db.write(async () => {
      const collection = db.get<CalculationOverrideModel>('calculation_overrides');
      return collection.create((r) => {
        r.calculationId = override.calculationId;
        r.originalValue = override.originalValue;
        r.overriddenValue = override.overriddenValue;
        r.reason = override.reason;
        r.overriddenBy = override.overriddenBy;
        r.createdAt = now;
      });
    });
    return result.id;
  }
}
