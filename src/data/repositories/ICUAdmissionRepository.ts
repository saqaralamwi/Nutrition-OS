import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import ICUAdmissionModel from '../models/ICUAdmission';
import { IICUAdmissionRepository, ICUAdmissionRecord } from '../../domain/repositories/IICUAdmissionRepository';

function toRecord(model: ICUAdmissionModel): ICUAdmissionRecord {
  return {
    id: model.id,
    patientId: model.patientId,
    fullName: model.fullName,
    fullNameAr: model.fullNameAr,
    age: model.age,
    gender: model.gender as 'male' | 'female',
    weightKg: model.weightKg,
    heightCm: model.heightCm,
    bmi: model.bmi,
    mrn: model.mrn,
    admissionDate: model.admissionDate?.toISOString() || new Date().toISOString(),
    admissionSource: model.admissionSource,
    icuType: model.icuType,
    primaryDiagnosis: model.primaryDiagnosis,
    primaryDiagnosisAr: model.primaryDiagnosisAr,
    secondaryDiagnoses: model.secondaryDiagnoses || undefined,
    secondaryDiagnosesAr: model.secondaryDiagnosesAr || undefined,
    apacheIIScore: model.apacheIIScore || undefined,
    gcs: model.gcs || undefined,
    severityLevel: model.severityLevel,
    heartRate: model.heartRate || undefined,
    bpSystolic: model.bpSystolic || undefined,
    bpDiastolic: model.bpDiastolic || undefined,
    respiratoryRate: model.respiratoryRate || undefined,
    temperature: model.temperature || undefined,
    o2Sat: model.o2Sat || undefined,
    oxygenTherapy: model.oxygenTherapy,
    ventilatorType: model.ventilatorType || undefined,
    preAdmissionWeightKg: model.preAdmissionWeightKg || undefined,
    weightChangeKg: model.weightChangeKg || undefined,
    weightChangePercent: model.weightChangePercent || undefined,
    appetiteBeforeAdmission: model.appetiteBeforeAdmission,
    eatingDifficulty: model.eatingDifficulty,
    npoStatus: model.npoStatus,
    npoDuration: model.npoDuration || undefined,
    previousNutritionSupport: model.previousNutritionSupport,
    hasDiabetes: model.hasDiabetes,
    diabetesType: model.diabetesType || undefined,
    hasCardiovascular: model.hasCardiovascular,
    hasKidney: model.hasKidney,
    kidneyStage: model.kidneyStage || undefined,
    hasLiver: model.hasLiver,
    hasLung: model.hasLung,
    hasGI: model.hasGI,
    hasCancer: model.hasCancer,
    cancerStage: model.cancerStage || undefined,
    allergies: model.allergies || undefined,
    allergiesAr: model.allergiesAr || undefined,
    previousSurgeries: model.previousSurgeries || undefined,
    previousSurgeriesAr: model.previousSurgeriesAr || undefined,
    medications: model.medications || undefined,
    medicationsAr: model.medicationsAr || undefined,
    hemoglobin: model.hemoglobin || undefined,
    wbc: model.wbc || undefined,
    platelets: model.platelets || undefined,
    creatinine: model.creatinine || undefined,
    bun: model.bun || undefined,
    eGFR: model.eGFR || undefined,
    sodium: model.sodium || undefined,
    potassium: model.potassium || undefined,
    chloride: model.chloride || undefined,
    glucose: model.glucose || undefined,
    hba1c: model.hba1c || undefined,
    totalProtein: model.totalProtein || undefined,
    albumin: model.albumin || undefined,
    totalBilirubin: model.totalBilirubin || undefined,
    alt: model.alt || undefined,
    ast: model.ast || undefined,
    triglycerides: model.triglycerides || undefined,
    cholesterol: model.cholesterol || undefined,
    stampScore: model.stampScore || undefined,
    malnutritionRisk: model.malnutritionRisk || undefined,
    nutritionConcern: model.nutritionConcern,
    admissionReason: model.admissionReason,
    admissionReasonAr: model.admissionReasonAr,
    specialConcerns: model.specialConcerns || undefined,
    specialConcernsAr: model.specialConcernsAr || undefined,
    physicianNotes: model.physicianNotes || undefined,
    physicianNotesAr: model.physicianNotesAr || undefined,
    dietitianNotes: model.dietitianNotes || undefined,
    dietitianNotesAr: model.dietitianNotesAr || undefined,
    nutritionConsent: model.nutritionConsent,
    guardianConsent: model.guardianConsent ?? undefined,
    signedBy: model.signedBy || undefined,
    consentDate: model.consentDate?.toISOString() || undefined,
    createdBy: model.createdBy,
    createdAt: model.createdAt?.toISOString() || undefined,
    updatedAt: model.updatedAt?.toISOString() || undefined,
    isTransferredToICU: model.isTransferredToICU,
    transferredAt: model.transferredAt?.toISOString() || undefined,
  };
}

export class ICUAdmissionRepository implements IICUAdmissionRepository {
  async create(record: ICUAdmissionRecord): Promise<string> {
    const db = await getDatabase();
    const result = await db.write(async () => {
      const collection = db.get<ICUAdmissionModel>('icu_admissions');
      return collection.create((r) => {
        r.patientId = record.patientId;
        r.fullName = record.fullName;
        r.fullNameAr = record.fullNameAr;
        r.age = record.age;
        r.gender = record.gender;
        r.weightKg = record.weightKg;
        r.heightCm = record.heightCm;
        r.bmi = record.bmi;
        r.mrn = record.mrn;
        r.admissionDate = new Date(record.admissionDate);
        r.admissionSource = record.admissionSource;
        r.icuType = record.icuType;
        r.primaryDiagnosis = record.primaryDiagnosis;
        r.primaryDiagnosisAr = record.primaryDiagnosisAr;
        r.secondaryDiagnoses = record.secondaryDiagnoses ?? '';
        r.secondaryDiagnosesAr = record.secondaryDiagnosesAr ?? '';
        if (record.apacheIIScore !== undefined) r.apacheIIScore = record.apacheIIScore;
        if (record.gcs !== undefined) r.gcs = record.gcs;
        r.severityLevel = record.severityLevel;
        if (record.heartRate !== undefined) r.heartRate = record.heartRate;
        if (record.bpSystolic !== undefined) r.bpSystolic = record.bpSystolic;
        if (record.bpDiastolic !== undefined) r.bpDiastolic = record.bpDiastolic;
        if (record.respiratoryRate !== undefined) r.respiratoryRate = record.respiratoryRate;
        if (record.temperature !== undefined) r.temperature = record.temperature;
        if (record.o2Sat !== undefined) r.o2Sat = record.o2Sat;
        r.oxygenTherapy = record.oxygenTherapy;
        r.ventilatorType = record.ventilatorType ?? '';
        if (record.preAdmissionWeightKg !== undefined) r.preAdmissionWeightKg = record.preAdmissionWeightKg;
        if (record.weightChangeKg !== undefined) r.weightChangeKg = record.weightChangeKg;
        if (record.weightChangePercent !== undefined) r.weightChangePercent = record.weightChangePercent;
        r.appetiteBeforeAdmission = record.appetiteBeforeAdmission;
        r.eatingDifficulty = record.eatingDifficulty;
        r.npoStatus = record.npoStatus;
        r.npoDuration = record.npoDuration ?? '';
        r.previousNutritionSupport = record.previousNutritionSupport;
        r.hasDiabetes = record.hasDiabetes;
        r.diabetesType = record.diabetesType ?? '';
        r.hasCardiovascular = record.hasCardiovascular;
        r.hasKidney = record.hasKidney;
        r.kidneyStage = record.kidneyStage ?? '';
        r.hasLiver = record.hasLiver;
        r.hasLung = record.hasLung;
        r.hasGI = record.hasGI;
        r.hasCancer = record.hasCancer;
        r.cancerStage = record.cancerStage ?? '';
        r.allergies = record.allergies ?? '';
        r.allergiesAr = record.allergiesAr ?? '';
        r.previousSurgeries = record.previousSurgeries ?? '';
        r.previousSurgeriesAr = record.previousSurgeriesAr ?? '';
        r.medications = record.medications ?? '';
        r.medicationsAr = record.medicationsAr ?? '';
        if (record.hemoglobin !== undefined) r.hemoglobin = record.hemoglobin;
        if (record.wbc !== undefined) r.wbc = record.wbc;
        if (record.platelets !== undefined) r.platelets = record.platelets;
        if (record.creatinine !== undefined) r.creatinine = record.creatinine;
        if (record.bun !== undefined) r.bun = record.bun;
        if (record.eGFR !== undefined) r.eGFR = record.eGFR;
        if (record.sodium !== undefined) r.sodium = record.sodium;
        if (record.potassium !== undefined) r.potassium = record.potassium;
        if (record.chloride !== undefined) r.chloride = record.chloride;
        if (record.glucose !== undefined) r.glucose = record.glucose;
        if (record.hba1c !== undefined) r.hba1c = record.hba1c;
        if (record.totalProtein !== undefined) r.totalProtein = record.totalProtein;
        if (record.albumin !== undefined) r.albumin = record.albumin;
        if (record.totalBilirubin !== undefined) r.totalBilirubin = record.totalBilirubin;
        if (record.alt !== undefined) r.alt = record.alt;
        if (record.ast !== undefined) r.ast = record.ast;
        if (record.triglycerides !== undefined) r.triglycerides = record.triglycerides;
        if (record.cholesterol !== undefined) r.cholesterol = record.cholesterol;
        if (record.stampScore !== undefined) r.stampScore = record.stampScore;
        r.malnutritionRisk = record.malnutritionRisk ?? '';
        r.nutritionConcern = record.nutritionConcern;
        r.admissionReason = record.admissionReason;
        r.admissionReasonAr = record.admissionReasonAr;
        r.specialConcerns = record.specialConcerns ?? '';
        r.specialConcernsAr = record.specialConcernsAr ?? '';
        r.physicianNotes = record.physicianNotes ?? '';
        r.physicianNotesAr = record.physicianNotesAr ?? '';
        r.dietitianNotes = record.dietitianNotes ?? '';
        r.dietitianNotesAr = record.dietitianNotesAr ?? '';
        r.nutritionConsent = record.nutritionConsent;
        if (record.guardianConsent !== undefined) r.guardianConsent = record.guardianConsent;
        r.signedBy = record.signedBy ?? '';
        if (record.consentDate) r.consentDate = new Date(record.consentDate);
        r.createdBy = record.createdBy;
        r.isTransferredToICU = record.isTransferredToICU;
        if (record.transferredAt) r.transferredAt = new Date(record.transferredAt);
      });
    });
    return result.id;
  }

  async getByPatientId(patientId: string): Promise<ICUAdmissionRecord[]> {
    const db = await getDatabase();
    const results = await db.get<ICUAdmissionModel>('icu_admissions')
      .query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
      )
      .fetch();
    return results.map(toRecord);
  }

  async getById(id: string): Promise<ICUAdmissionRecord | null> {
    const db = await getDatabase();
    try {
      const result = await db.get<ICUAdmissionModel>('icu_admissions').find(id);
      return toRecord(result);
    } catch {
      return null;
    }
  }
}
