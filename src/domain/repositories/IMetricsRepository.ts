import { PatientMetrics } from '../entities/PatientMetrics';

export interface IMetricsRepository {
  save(metrics: PatientMetrics): Promise<string>;
  getByPatientId(patientId: string): Promise<PatientMetrics | null>;
  getLatestByPatientId(patientId: string): Promise<PatientMetrics | null>;
}
