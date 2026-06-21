import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export type PatientMetric =
  | 'weightKg'
  | 'heightCm'
  | 'age'
  | 'gender'
  | 'fever'
  | 'bmi';

export interface PatientMetricChangedEvent {
  type: 'PATIENT_METRIC_CHANGED';
  patientId: string;
  metric: PatientMetric;
  value: number | boolean | string;
  timestamp: number;
}

export type ClinicalBusEvent = PatientMetricChangedEvent;

class ClinicalEventBusService {
  private subject = new Subject<ClinicalBusEvent>();

  publish(event: Omit<PatientMetricChangedEvent, 'timestamp'>): void {
    this.subject.next({ ...event, timestamp: Date.now() });
  }

  onMetric(
    patientId: string,
    metric: PatientMetric,
  ): Observable<PatientMetricChangedEvent> {
    return this.subject.pipe(
      filter(
        (e): e is PatientMetricChangedEvent =>
          e.type === 'PATIENT_METRIC_CHANGED' &&
          e.patientId === patientId &&
          e.metric === metric,
      ),
    );
  }

  onAnyMetric(patientId: string): Observable<PatientMetricChangedEvent> {
    return this.subject.pipe(
      filter(
        (e): e is PatientMetricChangedEvent =>
          e.type === 'PATIENT_METRIC_CHANGED' && e.patientId === patientId,
      ),
    );
  }

  onMetricType(metric: PatientMetric): Observable<PatientMetricChangedEvent> {
    return this.subject.pipe(
      filter(
        (e): e is PatientMetricChangedEvent =>
          e.type === 'PATIENT_METRIC_CHANGED' && e.metric === metric,
      ),
    );
  }

  get observable(): Observable<ClinicalBusEvent> {
    return this.subject.asObservable();
  }
}

export const clinicalEventBus = new ClinicalEventBusService();
