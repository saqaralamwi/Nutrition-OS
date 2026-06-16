export type AlertLevel = 'critical' | 'warning' | 'info';

export interface ClinicalAlert {
  id: string;
  level: AlertLevel;
  titleAr: string;
  messageAr: string;
}

export interface NutritionPlanSummary {
  patientId: string;
  alerts: ClinicalAlert[];
  educationalNotesAr: string[];
  suggestedActionPlanAr: string;
}
