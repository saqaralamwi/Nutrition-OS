import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class ElectrolyteMonitoring extends Model {
  static table = 'electrolyte_monitorings';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('monitoring_date') monitoringDate!: Date;
  @field('phosphorus') phosphorus!: number;
  @field('potassium') potassium!: number;
  @field('magnesium') magnesium!: number;
  @field('glucose') glucose!: number;
  @field('is_safe') isSafe!: boolean;
  @field('needs_correction') needsCorrection!: boolean;
  @field('correction_notes') correctionNotes?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
