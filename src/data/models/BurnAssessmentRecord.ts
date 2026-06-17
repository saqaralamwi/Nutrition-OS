import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import type { IBurnAssessmentRecord, BurnDegree } from '../../data/types/burn_metabolic';

export default class BurnAssessmentRecord extends Model {
  static table = 'burn_assessment_records';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('tbsa_percentage') tbsaPercentage!: number;
  @field('burn_degree') burnDegree!: string;
  @field('is_intubated') isIntubated!: boolean;
  @field('curreri_energy_target') curreriEnergyTarget!: number;
  @field('parkland_fluid_target') parklandFluidTarget!: number;
  @date('recorded_at') recordedAt!: Date;

  toDomain(): IBurnAssessmentRecord {
    return {
      patientId: this.patientId,
      tbsaPercentage: this.tbsaPercentage,
      burnDegree: this.burnDegree as BurnDegree,
      isIntubated: this.isIntubated,
      curreriEnergyTarget: this.curreriEnergyTarget,
      parklandFluidTarget: this.parklandFluidTarget,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
      createdAt: (this as any).createdAt?.getTime?.() ?? Date.now(),
      updatedAt: (this as any).updatedAt?.getTime?.() ?? Date.now(),
    };
  }
}
