import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class RespiratoryAssessmentRecord extends Model {
  static table = 'respiratory_assessment_records';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('fev1_percentage') fev1Percentage!: number;
  @field('has_co2_retention') hasCo2Retention!: boolean;
  @field('respiratory_quotient_target') respiratoryQuotientTarget!: number;
  @field('oxygen_delivery_mode') oxygenDeliveryMode!: string;
  @field('max_carbohydrate_energy_ratio') maxCarbohydrateEnergyRatio!: number;
  @date('recorded_at') recordedAt!: Date;
}
