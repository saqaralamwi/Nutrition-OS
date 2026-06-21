import { Observable, of } from 'rxjs';
import { map, debounceTime, catchError } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import PatientModel from '../models/Patient';
import VitalsRecordModel from '../models/VitalsRecord';
import LaboratoryRecordModel from '../models/LaboratoryRecord';
import MedicationModel from '../models/Medication';
import ICUAdmissionModel from '../models/ICUAdmission';
import { watchQuery, watchRecord } from '../database/observe';

function handleError<T>(fallback: T) {
  return catchError<T, Observable<T>>((err) => {
    console.error('[ReactiveQuery] Stream error:', err);
    return of(fallback);
  });
}

/**
 * Watch all patients with optional filtering, sorted by creation date (newest first).
 */
export function observePatients(whereClause?: any): Observable<PatientModel[]> {
  return watchQuery<PatientModel>((db) => {
    let q = db.get('patients').query(Q.sortBy('created_at', Q.desc));
    if (whereClause) {
      const conditions: any[] = [Q.sortBy('created_at', Q.desc)];
      Object.keys(whereClause).forEach((key) => {
        conditions.push(Q.where(key, whereClause[key]));
      });
      if (conditions.length > 1) {
        q = db.get('patients').query(...conditions);
      }
    }
    return q;
  }).pipe(
    handleError([] as PatientModel[])
  );
}

/**
 * Watch a single patient record by ID.
 */
export function observePatientById(patientId: string): Observable<PatientModel | null> {
  return watchRecord<PatientModel>('patients', patientId).pipe(
    handleError(null as PatientModel | null)
  );
}

/**
 * Watch the vitals record history for a patient, sorted newest first.
 */
export function observeVitalsHistory(patientId: string, limit: number = 100): Observable<VitalsRecordModel[]> {
  return watchQuery<VitalsRecordModel>((db) => {
    return db.get('vitals_records').query(
      Q.where('patient_id', patientId),
      Q.sortBy('created_at', Q.desc),
    );
  }).pipe(
    map((records) => records.slice(0, limit)),
    handleError([] as VitalsRecordModel[])
  );
}

/**
 * Watch lab results history for a patient, sorted newest first.
 */
/**
 * Watch laboratory results (unified laboratory_results table), sorted newest first.
 */
export function observeLabResults(patientId: string, limit: number = 100): Observable<LaboratoryRecordModel[]> {
  return watchQuery<LaboratoryRecordModel>((db) => {
    return db.get('laboratory_results').query(
      Q.where('patient_id', patientId),
      Q.sortBy('created_at', Q.desc),
    );
  }).pipe(
    map((records) => records.slice(0, limit)),
    handleError([] as LaboratoryRecordModel[])
  );
}

/**
 * @deprecated Use observeLabResults instead — identical query.
 */
export const observeLaboratoryRecords = observeLabResults;

/**
 * Watch active medications for a patient.
 */
export function observeActiveMedications(patientId: string): Observable<MedicationModel[]> {
  return watchQuery<MedicationModel>((db) => {
    return db
      .get('medications')
      .query(Q.where('patient_id', patientId), Q.where('is_active', true));
  }).pipe(
    handleError([] as MedicationModel[])
  );
}

/**
 * Watch ICU admissions history for a patient.
 */
export function observeIcuAdmissions(patientId: string): Observable<ICUAdmissionModel[]> {
  return watchQuery<ICUAdmissionModel>((db) => {
    return db.get('icu_admissions').query(
      Q.where('patient_id', patientId),
      Q.sortBy('created_at', Q.desc),
    );
  }).pipe(
    handleError([] as ICUAdmissionModel[])
  );
}

/**
 * Watch patients list with a debounce window (to suppress excessive UI re-draws during rapid writes).
 */
export function observePatientsDebounce(whereClause?: any, debounceMs: number = 100): Observable<PatientModel[]> {
  return observePatients(whereClause).pipe(debounceTime(debounceMs));
}
