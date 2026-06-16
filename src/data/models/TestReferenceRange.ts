import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import TestCatalog from './TestCatalog';

export default class TestReferenceRange extends Model {
  static table = 'test_reference_ranges';

  static associations = {
    test_catalog: { type: 'belongs_to' as const, key: 'test_catalog_id' },
  };

  @relation('test_catalog', 'test_catalog_id') testCatalog?: TestCatalog;
  @field('age_min') ageMin!: number;
  @field('age_max') ageMax!: number;
  @field('sex') sex!: string;
  @field('range_low') rangeLow!: number;
  @field('range_high') rangeHigh!: number;
  @field('source') source!: string;
}
