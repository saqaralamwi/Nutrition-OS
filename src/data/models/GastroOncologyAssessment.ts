import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class GastroOncologyAssessment extends Model {
  static table = 'gastro_oncology_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  
  // Oncology specific
  @field('tumor_site') tumorSite?: string;
  @field('tnm_stage') tnmStage?: string;
  @field('treatment_modality') treatmentModality?: string; // 'chemo', 'radio', 'surgery'
  
  // Gastro specific
  @field('symptom_score') symptomScore?: number; // e.g., PG-SGA short form
  @field('is_at_risk_of_refeeding') isAtRiskOfRefeeding!: boolean;
  @field('malabsorption_signs') malabsorptionSigns?: string;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
