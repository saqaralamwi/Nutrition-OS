import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import type { IRenalAssessment } from '../../data/types/nephrology';

export default class RenalAssessment extends Model {
  static table = 'renal_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('serum_creatinine') serumCreatinine!: number;
  @field('bun') bun!: number;
  @field('serum_potassium') serumPotassium!: number;
  @field('serum_phosphorus') serumPhosphorus!: number;
  @field('serum_sodium') serumSodium!: number;
  @field('ckd_stage') ckdStage!: string;
  @field('dialysis_status') dialysisStatus!: string;
  @field('measured_urine_output') measuredUrineOutput!: number;
  @date('recorded_at') recordedAt!: Date;

  toDomain(): IRenalAssessment {
    return {
      patientId: this.patientId,
      serumCreatinine: this.serumCreatinine,
      bun: this.bun,
      serumPotassium: this.serumPotassium,
      serumPhosphorus: this.serumPhosphorus,
      serumSodium: this.serumSodium,
      ckdStage: this.ckdStage as IRenalAssessment['ckdStage'],
      dialysisStatus: this.dialysisStatus as IRenalAssessment['dialysisStatus'],
      measuredUrineOutput: this.measuredUrineOutput,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
    };
  }
}
