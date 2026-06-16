export interface IGastroSurgeryAssessment {
  patientId: string;
  cancerSiteType: 'git' | 'head_neck' | 'hematologic' | 'none';
  oncologyCachexiaStage: 'pre_cachexia' | 'cachexia' | 'refractory_cachexia' | 'none';
  unintentionalWeightLossPercent: number;
  bariatricSurgeryType: 'none' | 'gastric_sleeve' | 'roux_en_y_bypass' | 'mini_bypass';
  postOpDayMilestone: number;
  hasDumpingSyndromeSymptoms: boolean;
  stomaOrFistulaOutputMl24h: number;
  recordedAt: number;
}
