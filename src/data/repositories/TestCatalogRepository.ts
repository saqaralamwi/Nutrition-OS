import { getDatabase } from '../database';
import TestCatalogModel from '../models/TestCatalog';
import { TestCatalogItem } from '../../domain/entities/TestCatalog';
import { ITestCatalogRepository } from '../../domain/repositories/ITestCatalogRepository';

function toDomain(model: TestCatalogModel): TestCatalogItem {
  return {
    id: model.id,
    testNameAr: model.testNameAr,
    testNameEn: model.testNameEn,
    defaultUnit: model.defaultUnit,
    defaultRangeLow: model.defaultRangeLow,
    defaultRangeHigh: model.defaultRangeHigh,
    criticalLowFactor: model.criticalLowFactor ?? null,
    criticalHighFactor: model.criticalHighFactor ?? null,
    category: model.category,
  };
}

export class TestCatalogRepository implements ITestCatalogRepository {
  async getAll(): Promise<TestCatalogItem[]> {
    const db = await getDatabase();
    const results = await db.get<TestCatalogModel>('test_catalog').query().fetch();
    return results.map(toDomain);
  }
}
