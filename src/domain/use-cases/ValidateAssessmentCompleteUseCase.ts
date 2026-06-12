import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';

export interface AssessmentCheckResult {
  complete: boolean;
  missingModules: string[];
}

export class ValidateAssessmentCompleteUseCase {
  async execute(patientId: string): Promise<AssessmentCheckResult> {
    const db = await getDatabase();
    const missingModules: string[] = [];

    const m2 = await db.get('social_histories').query(Q.where('patient_id', patientId)).fetchCount();
    if (m2 === 0) missingModules.push('التاريخ الاجتماعي (M2)');

    const m3 = await db.get('medical_histories').query(Q.where('patient_id', patientId)).fetchCount();
    if (m3 === 0) missingModules.push('التاريخ الطبي (M3)');

    const m4Med = await db.get('medications').query(Q.where('patient_id', patientId)).fetchCount();
    const m4Sup = await db.get('supplements').query(Q.where('patient_id', patientId)).fetchCount();
    if (m4Med === 0 && m4Sup === 0) missingModules.push('الأدوية والمكملات (M4)');

    const m5 = await db.get('lab_results').query(Q.where('patient_id', patientId)).fetchCount();
    if (m5 === 0) missingModules.push('الفحوصات المخبرية (M5)');

    const m6 = await db.get('physical_exam_items').query(Q.where('patient_id', patientId)).fetchCount();
    if (m6 === 0) missingModules.push('الفحص السريري (M6)');

    return {
      complete: missingModules.length === 0,
      missingModules,
    };
  }
}
