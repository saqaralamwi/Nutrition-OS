import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import PatientModel from '../models/Patient';
import FileNumberCounterModel from '../models/FileNumberCounter';
import { Patient, CreatePatientInput, PatientGender, PatientStatus, PatientType } from '../../domain/entities/Patient';
import { IPatientRepository, PatientSearchQuery, SortOrder } from '../../domain/repositories/IPatientRepository';

function toDomain(model: PatientModel): Patient {
  let incompleteArr: string[] = [];
  if (model.incompleteSections) {
    try {
      incompleteArr = JSON.parse(model.incompleteSections);
    } catch {
      incompleteArr = [];
    }
  }
  return {
    id: model.id,
    fileNumber: model.fileNumber,
    fullName: model.fullName,
    age: model.age,
    dateOfBirth: model.dateOfBirth || null,
    gender: model.gender as PatientGender,
    nationalId: model.nationalId || null,
    nationality: model.nationality || null,
    phoneNumber: model.phoneNumber || null,
    department: model.department,
    bedNumber: model.bedNumber || null,
    admissionDate: model.admissionDate?.toISOString() || new Date().toISOString(),
    referringPhysician: model.referringPhysician || null,
    primaryDiagnosis: model.primaryDiagnosis,
    patientType: model.patientType as PatientType,
    status: model.status as PatientStatus,
    notes: model.notes || null,
    incompleteSections: incompleteArr,
    createdAt: model.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: model.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export class PatientRepository implements IPatientRepository {
  async findById(id: string): Promise<Patient | null> {
    const db = await getDatabase();
    const patient = await db.get<PatientModel>('patients').find(id);
    return patient ? toDomain(patient) : null;
  }

  async findByFileNumber(fileNumber: string): Promise<Patient | null> {
    const db = await getDatabase();
    const results = await db.get<PatientModel>('patients').query(
      Q.where('file_number', fileNumber),
    ).fetch();
    return results.length > 0 ? toDomain(results[0]) : null;
  }

  async search(query: PatientSearchQuery): Promise<Patient[]> {
    const db = await getDatabase();
    const conditions: any[] = [];

    if (query.name) {
      conditions.push(
        Q.or(
          Q.where('full_name', Q.like(`%${query.name}%`)),
          Q.where('file_number', Q.like(`%${query.name}%`)),
          Q.where('primary_diagnosis', Q.like(`%${query.name}%`))
        )
      );
    }
    if (query.department) conditions.push(Q.where('department', query.department));
    if (query.status) conditions.push(Q.where('status', query.status));
    if (query.diagnosis) conditions.push(Q.where('primary_diagnosis', Q.like(`%${query.diagnosis}%`)));

    const all = conditions.length > 0
      ? await db.get<PatientModel>('patients').query(...conditions).fetch()
      : await db.get<PatientModel>('patients').query().fetch();

    const sorted = all.sort((a, b) => {
      const dateA = a.admissionDate?.getTime() || 0;
      const dateB = b.admissionDate?.getTime() || 0;
      return query.sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return sorted.map(toDomain);
  }

  async findAll(sortOrder?: SortOrder): Promise<Patient[]> {
    const db = await getDatabase();
    const all = await db.get<PatientModel>('patients').query().fetch();
    const sorted = all.sort((a, b) => {
      const dateA = a.admissionDate?.getTime() || 0;
      const dateB = b.admissionDate?.getTime() || 0;
      return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });
    return sorted.map(toDomain);
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const db = await getDatabase();
    const result = await db.write(async () => {
      let fileNumber = await this.generateFileNumberInternal(db);

      // Check for duplicate
      let duplicatePatients = await db.get<PatientModel>('patients').query(
        Q.where('file_number', fileNumber)
      ).fetch();

      if (duplicatePatients.length > 0) {
        console.warn(`[PatientRepository] Duplicate file number detected: ${fileNumber}. Retrying...`);
        fileNumber = await this.generateFileNumberInternal(db);
        duplicatePatients = await db.get<PatientModel>('patients').query(
          Q.where('file_number', fileNumber)
        ).fetch();
        if (duplicatePatients.length > 0) {
          throw new Error('الرقم التعريفي للمريض مكرر، يرجى المحاولة مرة أخرى.');
        }
      }

      const collection = db.get<PatientModel>('patients');
      return collection.create((record) => {
        record.fileNumber = fileNumber;
        record.fullName = input.fullName;
        record.age = input.age;
        if (input.dateOfBirth !== undefined) record.dateOfBirth = input.dateOfBirth ?? '';
        record.gender = input.gender;
        if (input.nationalId !== undefined) record.nationalId = input.nationalId ?? '';
        if (input.nationality !== undefined) record.nationality = input.nationality ?? '';
        if (input.phoneNumber !== undefined) record.phoneNumber = input.phoneNumber ?? '';
        record.department = input.department;
        if (input.bedNumber !== undefined) record.bedNumber = input.bedNumber ?? '';
        if (input.admissionDate !== undefined) record.admissionDate = new Date(input.admissionDate);
        if (input.referringPhysician !== undefined) record.referringPhysician = input.referringPhysician ?? '';
        record.primaryDiagnosis = input.primaryDiagnosis;
        record.patientType = input.patientType;
        record.status = input.status || 'active';
        if (input.notes !== undefined) record.notes = input.notes ?? '';
        if (input.incompleteSections !== undefined) {
          record.incompleteSections = input.incompleteSections ? JSON.stringify(input.incompleteSections) : '';
        }
      });
    });
    return toDomain(result);
  }

  async update(patient: Patient): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const existing = await db.get<PatientModel>('patients').find(patient.id);
      await existing.update((record) => {
        record.fullName = patient.fullName;
        record.age = patient.age;
        if (patient.dateOfBirth !== undefined) record.dateOfBirth = patient.dateOfBirth ?? '';
        record.gender = patient.gender;
        if (patient.nationalId !== undefined) record.nationalId = patient.nationalId ?? '';
        if (patient.nationality !== undefined) record.nationality = patient.nationality ?? '';
        if (patient.phoneNumber !== undefined) record.phoneNumber = patient.phoneNumber ?? '';
        record.department = patient.department;
        if (patient.bedNumber !== undefined) record.bedNumber = patient.bedNumber ?? '';
        if (patient.admissionDate !== undefined) record.admissionDate = new Date(patient.admissionDate);
        if (patient.referringPhysician !== undefined) record.referringPhysician = patient.referringPhysician ?? '';
        record.primaryDiagnosis = patient.primaryDiagnosis;
        record.patientType = patient.patientType;
        record.status = patient.status;
        if (patient.notes !== undefined) record.notes = patient.notes ?? '';
        if (patient.incompleteSections !== undefined) {
          record.incompleteSections = patient.incompleteSections ? JSON.stringify(patient.incompleteSections) : '';
        }
      });
    });
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const patient = await db.get<PatientModel>('patients').find(id);
      await patient.markAsDeleted();
    });
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    return db.get<PatientModel>('patients').query().fetchCount();
  }

  async isFileNumberDuplicate(fileNumber: string): Promise<boolean> {
    const db = await getDatabase();
    const results = await db.get<PatientModel>('patients').query(
      Q.where('file_number', fileNumber)
    ).fetch();
    return results.length > 0;
  }

  async generateFileNumber(): Promise<string> {
    const db = await getDatabase();
    return db.write(async () => {
      return this.generateFileNumberInternal(db);
    });
  }

  private async generateFileNumberInternal(db: any): Promise<string> {
    const year = new Date().getFullYear();
    const countersCollection = db.get<FileNumberCounterModel>('file_number_counters');
    
    // Find counter for current year
    const existingCounters = await countersCollection.query(
      Q.where('year', year)
    ).fetch();
    
    let count = 0;
    if (existingCounters.length > 0) {
      const counter = existingCounters[0];
      await counter.update((record) => {
        const currentCount = Number(record._raw.count || 0);
        record._raw.count = currentCount + 1;
        record._raw.last_incremented_at = new Date().getTime();
      });
      count = Number(counter._raw.count);
    } else {
      const counter = await countersCollection.create((record) => {
        record._raw.year = year;
        record._raw.count = 1;
        record._raw.last_incremented_at = new Date().getTime();
      });
      count = Number(counter._raw.count);
    }
    
    const padded = String(count).padStart(5, '0');
    return `CN-${year}-${padded}`;
  }
}
