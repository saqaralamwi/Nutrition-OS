import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';
import TestReferenceRange from './TestReferenceRange';

export default class TestCatalog extends Model {
  static table = 'test_catalog';

  static associations = {
    test_reference_ranges: { type: 'has_many' as const, foreignKey: 'test_catalog_id' },
  };

  @children('test_reference_ranges') referenceRanges?: TestReferenceRange[];
  @field('test_name_ar') testNameAr!: string;
  @field('test_name_en') testNameEn!: string;
  @field('default_unit') defaultUnit!: string;
  @field('default_range_low') defaultRangeLow!: number;
  @field('default_range_high') defaultRangeHigh!: number;
  @field('critical_low_factor') criticalLowFactor!: number;
  @field('critical_high_factor') criticalHighFactor!: number;
  @field('category') category!: string;
}
