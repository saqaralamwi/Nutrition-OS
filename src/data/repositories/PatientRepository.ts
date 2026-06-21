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
    nameAr: model.nameAr || null,
    mrn: model.mrn || null,
    isPediatric: model.isPediatric ?? (model.age < 19),
    bloodType: model.bloodType || null,
    clinicalTags: model.clinicalTags || null,
    clinicalTagsAr: model.clinicalTagsAr || null,
    address: model.address || null,
    addressAr: model.addressAr || null,
    occupation: model.occupation || null,
    education: model.education || null,
    religion: model.religion || null,
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
      const patient = await collection.create((record) => {
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
        if (input.nameAr !== undefined) record.nameAr = input.nameAr ?? '';
        if (input.mrn !== undefined) record.mrn = input.mrn ?? '';
        if (input.bloodType !== undefined) record.bloodType = input.bloodType ?? '';
        if (input.clinicalTags !== undefined) record.clinicalTags = input.clinicalTags ?? '';
        if (input.clinicalTagsAr !== undefined) record.clinicalTagsAr = input.clinicalTagsAr ?? '';
        if (input.address !== undefined) record.address = input.address ?? '';
        if (input.addressAr !== undefined) record.addressAr = input.addressAr ?? '';
        if (input.occupation !== undefined) record.occupation = input.occupation ?? '';
        if (input.education !== undefined) record.education = input.education ?? '';
        if (input.religion !== undefined) record.religion = input.religion ?? '';
        record.isPediatric = input.isPediatric ?? (input.age < 19);
      });

      if (input.weightKg != null && input.heightCm != null) {
        const vitals = db.get('vitals_records');
        await vitals.create((r: any) => {
          r.patient_id = patient.id;
          r.record_date = Date.now();
          r.weight_kg = input.weightKg!;
          r.height_cm = input.heightCm!;
          const heightM = input.heightCm! / 100;
          r.bmi = Math.round((input.weightKg! / (heightM * heightM)) * 100) / 100;
        });
      }

      return patient;
    });
    return toDomain(result);
  }

  async update(patient: Patient): Promise<{ success: boolean; patient?: Patient }> {
    const db = await getDatabase();
    try {
      const updated = await db.write(async () => {
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
          if (patient.nameAr !== undefined) record.nameAr = patient.nameAr ?? '';
          if (patient.mrn !== undefined) record.mrn = patient.mrn ?? '';
          if (patient.bloodType !== undefined) record.bloodType = patient.bloodType ?? '';
          if (patient.clinicalTags !== undefined) record.clinicalTags = patient.clinicalTags ?? '';
          if (patient.clinicalTagsAr !== undefined) record.clinicalTagsAr = patient.clinicalTagsAr ?? '';
          if (patient.address !== undefined) record.address = patient.address ?? '';
          if (patient.addressAr !== undefined) record.addressAr = patient.addressAr ?? '';
          if (patient.occupation !== undefined) record.occupation = patient.occupation ?? '';
          if (patient.education !== undefined) record.education = patient.education ?? '';
          if (patient.religion !== undefined) record.religion = patient.religion ?? '';
        });
        return existing;
      });
      return { success: true, patient: toDomain(updated) };
    } catch {
      return { success: false };
    }
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const db = await getDatabase();
    try {
      await db.write(async () => {
        const patient = await db.get<PatientModel>('patients').find(id);
        
        // Prepare cascading soft-delete batch
        const batchRecords: any[] = [];
        
        const childTables = [
          'vitals_records', 'laboratory_results', 'interventions', 
          'nutritional_plans', 'medications', 'supplements', 
          'social_histories', 'medical_histories', 'calculations',
          'follow_up_visits', 'attachments', 'discharge_summaries',
          'meal_plans', 'icu_admissions', 'pediatric_growth_charts',
          'pediatric_malnutrition_criteria', 'stamp_pediatric_screenings'
        ];

        for (const tableName of childTables) {
          const children = await db.get(tableName).query(Q.where('patient_id', id)).fetch();
          children.forEach(child => {
            batchRecords.push(child.prepareMarkAsDeleted());
          });
        }

        batchRecords.push(patient.prepareMarkAsDeleted());
        
        await db.batch(...batchRecords);
      });
      return { success: true };
    } catch (error) {
      console.error('[PatientRepository] Delete failed:', error);
      return { success: false };
    }
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

  async sync(id: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    try {
      const patient = await db.get<PatientModel>('patients').find(id);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }
      // Sync via sync engine — currently stubbed, will push/pull when backend is connected
      const { syncEngine } = await import('../../data/sync');
      const result = await syncEngine.fullSync();
      return { success: result.pushedErrors === 0 && result.pulledErrors === 0 };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Sync failed' };
    }
  }

  async syncAll(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    const db = await getDatabase();
    try {
      const all = await db.get<PatientModel>('patients').query().fetch();
      let syncedCount = 0;
      let failedCount = 0;
      for (const patient of all) {
        const result = await this.sync(patient.id);
        if (result.success) syncedCount++;
        else failedCount++;
      }
      return { success: failedCount === 0, syncedCount, failedCount };
    } catch (error: any) {
      return { success: false, syncedCount: 0, failedCount: 0 };
    }
  }

  async generateFileNumber(): Promise<string> {
    const db = await getDatabase();
    return db.write(async () => {
      return this.generateFileNumberInternal(db);
    });
  }

  private async generateFileNumberInternal(db: any): Promise<string> {
    const year = new Date().getFullYear();
    const countersCollection = db.get('file_number_counters') as any;
    
    // Find counter for current year
    const existingCounters = await countersCollection.query(
      Q.where('year', year)
    ).fetch();
    
    let count = 0;
    if (existingCounters.length > 0) {
      const counter = existingCounters[0];
      const currentCount = Number(counter._raw.count || 0);
      count = currentCount + 1;
      counter._raw.count = count;
      counter._raw.last_incremented_at = Date.now();
    } else {
      count = 1;
      const counter = await countersCollection.create((record: any) => {
        record._raw.year = year;
        record._raw.count = count;
        record._raw.last_incremented_at = Date.now();
      });
    }
    
    const padded = String(count).padStart(5, '0');
    return `CN-${year}-${padded}`;
  }
}
