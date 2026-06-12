export interface SocialHistory {
  id: string;
  patientId: string;
  maritalStatus: string | null;
  educationLevel: string | null;
  occupation: string | null;
  livingArea: string | null;
  familyStructure: string | null;
  incomeLevel: string | null;
  smoking: string;
  cigarettesPerDay: number | null;
  yearsSmoked: number | null;
  alcoholSubstanceUse: string;
  physicalActivity: string;
  activityDescription: string | null;
  dietaryHistory: string | null;
  foodAllergies: string | null;
  specialDietBeforeAdmission: string;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}
