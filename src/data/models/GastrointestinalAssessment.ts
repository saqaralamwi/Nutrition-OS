import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import type { IGastrointestinalAssessment, DiarrheaGrading } from '../../data/types/gastrointestinal';

export default class GastrointestinalAssessment extends Model {
  static table = 'gastrointestinal_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('stool_frequency_per_24h') stoolFrequencyPer24h!: number;
  @field('diarrhea_grading') diarrheaGrading!: string;
  @field('has_intestinal_bleeding') hasIntestinalBleeding!: boolean;
  @field('has_malabsorption_signs') hasMalabsorptionSigns!: boolean;
  @field('fecal_fat_g24h') fecalFatG24h!: number;
  @field('steatorrhea_present') steatorrheaPresent!: boolean;
  @date('recorded_at') recordedAt!: Date;

  toDomain(): IGastrointestinalAssessment {
    return {
      patientId: this.patientId,
      stoolFrequencyPer24h: this.stoolFrequencyPer24h,
      diarrheaGrading: this.diarrheaGrading as DiarrheaGrading,
      hasIntestinalBleeding: this.hasIntestinalBleeding,
      hasMalabsorptionSigns: this.hasMalabsorptionSigns,
      fecalFatG24h: this.fecalFatG24h,
      steatorrheaPresent: this.steatorrheaPresent,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
      createdAt: (this as any).createdAt?.getTime?.() ?? Date.now(),
      updatedAt: (this as any).updatedAt?.getTime?.() ?? Date.now(),
    };
  }
}
