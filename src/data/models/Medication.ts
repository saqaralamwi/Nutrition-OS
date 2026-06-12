import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class Medication extends Model {
  static table = 'medications';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @immutableRelation('patients', 'patient_id') patient!: any;
  @field('patient_id') patientId!: string;
  @field('drug_name') drugName!: string;
  @field('dosage') dosage!: string;
  @field('frequency') frequency!: string;
  @field('route') route!: string;
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @field('prescribing_physician') prescribingPhysician!: string;
  @field('dni_risk') dniRisk!: string;
  @field('dni_notes') dniNotes!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
