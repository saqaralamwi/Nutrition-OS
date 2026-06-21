import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import VitalsRecordModel from '../models/VitalsRecord';

export interface VitalsRecord {
  id: string;
  patientId: string;
  recordDate: string;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  temperature?: number;
  heartRate?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  respiratoryRate?: number;
  o2Sat?: number;
  painScore?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  waistHipRatio?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  weightChange1m?: number;
  weightChange3m?: number;
  weightChange6m?: number;
  dietaryIntake?: string;
  eatingDifficulty?: string;
  npoStatus?: boolean;
  npoDuration?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface CreateVitalInput {
  patientId: string;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  temperature?: number;
  heartRate?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  respiratoryRate?: number;
  o2Sat?: number;
  painScore?: number;
  recordedAt?: Date;
}

function toRecord(model: VitalsRecordModel): VitalsRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    recordDate: model.recordDate?.toISOString() || '',
    weightKg: model.weightKg,
    heightCm: model.heightCm,
    bmi: model.bmi,
    temperature: model.temperature,
    heartRate: model.heartRate,
    bpSystolic: model.bpSystolic,
    bpDiastolic: model.bpDiastolic,
    respiratoryRate: model.respiratoryRate,
    o2Sat: model.o2Sat,
    painScore: model.painScore,
    waistCircumference: model.waistCircumference,
    hipCircumference: model.hipCircumference,
    waistHipRatio: model.waistHipRatio,
    bodyFatPercent: model.bodyFatPercent,
    muscleMass: model.muscleMass,
    weightChange1m: model.weightChange1m,
    weightChange3m: model.weightChange3m,
    weightChange6m: model.weightChange6m,
    dietaryIntake: model.dietaryIntake,
    eatingDifficulty: model.eatingDifficulty,
    npoStatus: model.npoStatus,
    npoDuration: model.npoDuration,
    recordedBy: model.recordedBy,
    recordedAt: model.recordedAt?.toISOString(),
  };
}

export class VitalsRepository {
  async create(data: CreateVitalInput): Promise<string> {
    const db = await getDatabase();
    const result = await db.write(async () => {
      const collection = db.get<VitalsRecordModel>('vitals_records');
      return collection.create((r) => {
        r.patientId = data.patientId;
        r.recordDate = data.recordedAt || new Date();
        r.recordedAt = data.recordedAt || new Date();
        if (data.weightKg != null) r.weightKg = data.weightKg;
        if (data.heightCm != null) r.heightCm = data.heightCm;
        if (data.bmi != null) r.bmi = data.bmi;
        if (data.temperature != null) r.temperature = data.temperature;
        if (data.heartRate != null) r.heartRate = data.heartRate;
        if (data.bpSystolic != null) r.bpSystolic = data.bpSystolic;
        if (data.bpDiastolic != null) r.bpDiastolic = data.bpDiastolic;
        if (data.respiratoryRate != null) r.respiratoryRate = data.respiratoryRate;
        if (data.o2Sat != null) r.o2Sat = data.o2Sat;
        if (data.painScore != null) r.painScore = data.painScore;
      });
    });
    return result.id;
  }

  async getLatestByPatientId(patientId: string): Promise<VitalsRecord | null> {
    const db = await getDatabase();
    const results = await db.get<VitalsRecordModel>('vitals_records')
      .query(Q.where('patient_id', patientId), Q.sortBy('record_date', Q.desc), Q.take(1))
      .fetch();
    return results.length > 0 ? toRecord(results[0]) : null;
  }

  async getAllByPatientId(patientId: string): Promise<VitalsRecord[]> {
    const db = await getDatabase();
    const results = await db.get<VitalsRecordModel>('vitals_records')
      .query(Q.where('patient_id', patientId), Q.sortBy('record_date', Q.desc))
      .fetch();
    return results.map(toRecord);
  }
}
