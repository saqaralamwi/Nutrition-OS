import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class LaboratoryRecord extends Model {
  static table = 'laboratory_records';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @date('test_date') testDate!: Date;
  @field('test_type') testType!: string;

  // Hepatic Profile
  @field('alt') alt?: number;
  @field('ast') ast?: number;
  @field('albumin') albumin?: number;
  @field('bilirubin') bilirubin?: number;

  // Renal/Electrolytes
  @field('potassium') potassium?: number;
  @field('sodium') sodium?: number;
  @field('phosphorus') phosphorus?: number;
  @field('urea') urea?: number;
  @field('creatinine') creatinine?: number;

  // Metabolic Markers
  @field('blood_glucose') bloodGlucose?: number;
  @field('hba1c') hba1c?: number;

  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
