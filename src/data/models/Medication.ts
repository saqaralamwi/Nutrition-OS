import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class Medication extends Model {
  static table = 'medications';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('drug_name') drugName?: string;
  @field('dosage') dosage?: string;
  @field('frequency') frequency?: string;
  @field('route') route?: string;
  @date('start_date') startDate?: Date;
  @date('end_date') endDate?: Date;
  @field('prescribing_physician') prescribingPhysician?: string;
  @field('dni_risk') dniRisk?: string;
  @field('dni_notes') dniNotes?: string;

  @field('name') name?: string;
  @field('name_ar') nameAr?: string;
  @field('type') type?: string;
  @field('ml_per_hour') mlPerHour?: number;
  @field('total_ml_per_day') totalMlPerDay?: number;
  @field('percent') percent?: number;
  @field('duration_hours') durationHours?: number;
  @field('is_active') isActive?: boolean;
  @field('notes') notes?: string;
  @field('notes_ar') notesAr?: string;
  @date('recorded_at') recordedAt?: Date;

  get hiddenCalories(): number {
    const nameStr = (this.name || this.drugName || '').toLowerCase().trim();
    if (nameStr.includes('propofol') || nameStr.includes('diprivan') || nameStr.includes('بروبوفول')) {
      const mlPerHourVal = this.mlPerHour || 0;
      return mlPerHourVal * 24 * 1.1;
    }
    if (nameStr.includes('dextrose') || nameStr.includes('d5w') || nameStr.includes('دكستروز')) {
      const vol = this.totalMlPerDay || 0;
      const pct = this.percent || 5;
      return vol * (pct / 100) * 3.4;
    }
    if (nameStr.includes('midazolam') || nameStr.includes('versed') || nameStr.includes('midol') || nameStr.includes('ميدازولام')) {
      const mlPerHourVal = this.mlPerHour || 0;
      return mlPerHourVal * 24 * 0.78;
    }
    if (nameStr.includes('lipid emulsion') || nameStr.includes('smoflipid') || nameStr.includes('دهون') || nameStr.includes('ليبتيد')) {
      const vol = this.totalMlPerDay || 0;
      const pct = this.percent || 10;
      const factor = pct === 10 ? 1.1 : 2.0;
      return vol * factor;
    }
    return 0;
  }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
