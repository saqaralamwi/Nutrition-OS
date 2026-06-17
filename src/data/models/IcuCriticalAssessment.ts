import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import type { IIcuCriticalAssessment } from '../../data/types/critical_care';

export default class IcuCriticalAssessment extends Model {
  static table = 'icu_critical_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('is_mechanically_ventilated') isMechanicallyVentilated!: boolean;
  @field('is_on_vasopressors') isOnVasopressors!: boolean;
  @field('propofol_infusion_rate_ml_hr') propofolInfusionRateMlHr!: number;
  @field('dexmedetomidine_infusion_rate_ml_hr') dexmedetomidineInfusionRateMlHr!: number;
  @field('gastric_residual_volume_ml') gastricResidualVolumeMl!: number;
  @field('crp_level') crpLevel!: number;
  @field('nitrogen_balance_g') nitrogenBalanceG!: number;
  @date('recorded_at') recordedAt!: Date;

  toDomain(): IIcuCriticalAssessment {
    return {
      patientId: this.patientId,
      isMechanicallyVentilated: this.isMechanicallyVentilated,
      isOnVasopressors: this.isOnVasopressors,
      propofolInfusionRateMlHr: this.propofolInfusionRateMlHr,
      dexmedetomidineInfusionRateMlHr: this.dexmedetomidineInfusionRateMlHr,
      gastricResidualVolumeMl: this.gastricResidualVolumeMl,
      crpLevel: this.crpLevel,
      nitrogenBalanceG: this.nitrogenBalanceG,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
    };
  }
}
