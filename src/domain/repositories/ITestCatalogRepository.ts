import { TestCatalogItem } from '../entities/TestCatalog';

export interface ITestCatalogRepository {
  getAll(): Promise<TestCatalogItem[]>;
}
