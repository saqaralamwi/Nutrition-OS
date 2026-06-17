import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class WhoGrowthStandard extends Model {
  static table = 'who_growth_standards';

  @field('gender') gender!: 'male' | 'female';
  @field('age_months') ageMonths!: number;
  @field('length_height_cm') lengthHeightCm?: number;
  @field('indicator_type') indicatorType!: 'wfa' | 'hfa' | 'bfa' | 'wfh' | 'wfl';
  @field('l_value') lValue!: number;
  @field('m_value') mValue!: number;
  @field('s_value') sValue!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
