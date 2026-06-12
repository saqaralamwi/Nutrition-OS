import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class LabResult extends Model {
  static table = 'lab_results';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @field('test_name') testName!: string;
  @field('result_value') resultValue!: number;
  @field('unit') unit!: string;
  @field('reference_range_low') referenceRangeLow!: number;
  @field('reference_range_high') referenceRangeHigh!: number;
  @field('interpretation') interpretation!: string;
  @field('override_reason') overrideReason!: string;
  @date('test_date') testDate!: Date;
  @field('comments') comments!: string;
  @field('attached_image_path') attachedImagePath!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
