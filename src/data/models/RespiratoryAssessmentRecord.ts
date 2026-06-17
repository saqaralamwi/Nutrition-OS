import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import type { IRespiratoryAssessmentRecord, OxygenDeliveryMode } from '../../data/types/respiratory';

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

  toDomain(): IRespiratoryAssessmentRecord {
    return {
      patientId: this.patientId,
      fev1Percentage: this.fev1Percentage,
      hasCo2Retention: this.hasCo2Retention,
      respiratoryQuotientTarget: this.respiratoryQuotientTarget,
      oxygenDeliveryMode: this.oxygenDeliveryMode as OxygenDeliveryMode,
      maxCarbohydrateEnergyRatio: this.maxCarbohydrateEnergyRatio,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
      createdAt: (this as any).createdAt?.getTime?.() ?? Date.now(),
      updatedAt: (this as any).updatedAt?.getTime?.() ?? Date.now(),
    };
  }
}
