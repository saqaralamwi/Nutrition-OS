export interface TestCatalogItem {
  id: string;
  testNameAr: string;
  testNameEn: string;
  defaultUnit: string;
  defaultRangeLow: number;
  defaultRangeHigh: number;
  criticalLowFactor: number | null;
  criticalHighFactor: number | null;
  category: string;
}
