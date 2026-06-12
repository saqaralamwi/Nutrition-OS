export interface SocialHistoryRecord {
  id?: string;
  patientId: string;
  maritalStatus?: string;
  educationLevel?: string;
  occupation?: string;
  livingArea?: string;
  familyStructure?: string;
  incomeLevel?: string;
  smoking: string;
  cigarettesPerDay?: number;
  yearsSmoked?: number;
  alcoholSubstanceUse: string;
  physicalActivity: string;
  activityDescription?: string;
  dietaryHistory?: string;
  foodAllergies?: string;
  specialDietBeforeAdmission: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISocialHistoryRepository {
  getByPatientId(patientId: string): Promise<SocialHistoryRecord | null>;
  save(record: SocialHistoryRecord): Promise<string>;
  delete(id: string): Promise<void>;
}
