import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import CardiovascularAssessmentModel from '../models/CardiovascularAssessment';
import type { ICardiovascularAssessment } from '../types/cardiovascular';

export interface CardioAssessmentRecord extends ICardiovascularAssessment {
  id: string;
}

export class CardioRepository {
  async getLatestByPatientId(patientId: string): Promise<CardioAssessmentRecord | null> {
    const db = await getDatabase();
    const results = await db.get<CardiovascularAssessmentModel>('cardiovascular_assessments')
      .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', Q.desc), Q.take(1))
      .fetch();
    if (results.length === 0) return null;
    const m = results[0];
    const domain = m.toDomain();
    return { id: m.id, ...domain };
  }

  async getAllByPatientId(patientId: string): Promise<CardioAssessmentRecord[]> {
    const db = await getDatabase();
    const results = await db.get<CardiovascularAssessmentModel>('cardiovascular_assessments')
      .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', Q.desc))
      .fetch();
    return results.map((m) => {
      const domain = m.toDomain();
      return { id: m.id, ...domain };
    });
  }
}
