import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import PatientModel from '../models/Patient';
import { Patient, CreatePatientInput } from '../../domain/entities/Patient';
import { IPatientRepository, PatientSearchQuery, SortOrder } from '../../domain/repositories/IPatientRepository';

function toDomain(model: PatientModel): Patient {
  return {
    id: model.id,
    fileNumber: model.fileNumber,
    fullName: model.fullName,
    age: model.age,
    dateOfBirth: model.dateOfBirth || null,
    gender: model.gender as any,
    nationalId: model.nationalId || null,
    nationality: model.nationality || null,
    phoneNumber: model.phoneNumber || null,
    department: model.department,
    bedNumber: model.bedNumber || null,
    admissionDate: model.admissionDate?.toISOString() || new Date().toISOString(),
    referringPhysician: model.referringPhysician || null,
    primaryDiagnosis: model.primaryDiagnosis,
    patientType: model.patientType as any,
    status: model.status as any,
    notes: model.notes || null,
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

    if (query.name) conditions.push(Q.where('full_name', Q.like(`%${query.name}%`)));
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
    const fileNumber = await this.generateFileNumber();
    const result = await db.write(async () => {
      const collection = db.get<PatientModel>('patients');
      return collection.create((record) => {
        record.fileNumber = fileNumber;
        record.fullName = input.fullName;
        record.age = input.age;
        if (input.dateOfBirth) record.dateOfBirth = input.dateOfBirth;
        record.gender = input.gender;
        if (input.nationalId) record.nationalId = input.nationalId;
        if (input.nationality) record.nationality = input.nationality;
        if (input.phoneNumber) record.phoneNumber = input.phoneNumber;
        record.department = input.department;
        if (input.bedNumber) record.bedNumber = input.bedNumber;
        if (input.admissionDate) record.admissionDate = new Date(input.admissionDate);
        if (input.referringPhysician) record.referringPhysician = input.referringPhysician;
        record.primaryDiagnosis = input.primaryDiagnosis;
        record.patientType = input.patientType;
        record.status = 'active';
        if (input.notes) record.notes = input.notes;
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
        if (patient.dateOfBirth) record.dateOfBirth = patient.dateOfBirth;
        record.gender = patient.gender;
        if (patient.nationalId) record.nationalId = patient.nationalId;
        if (patient.nationality) record.nationality = patient.nationality;
        if (patient.phoneNumber) record.phoneNumber = patient.phoneNumber;
        record.department = patient.department;
        if (patient.bedNumber) record.bedNumber = patient.bedNumber;
        if (patient.admissionDate) record.admissionDate = new Date(patient.admissionDate);
        if (patient.referringPhysician) record.referringPhysician = patient.referringPhysician;
        record.primaryDiagnosis = patient.primaryDiagnosis;
        record.patientType = patient.patientType;
        record.status = patient.status;
        if (patient.notes) record.notes = patient.notes;
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

  async generateFileNumber(): Promise<string> {
    const db = await getDatabase();
    const count = await db.get<PatientModel>('patients').query().fetchCount();
    const padded = String(count + 1).padStart(5, '0');
    return `CN-${padded}`;
  }
}
