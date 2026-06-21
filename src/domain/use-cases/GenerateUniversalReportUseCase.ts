import { Database, Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../data/database';
import { Patient } from '../entities/Patient';
import PatientModel from '../../data/models/Patient';
import VitalsRecordModel from '../../data/models/VitalsRecord';
import CalculationModel from '../../data/models/Calculation';
import DrugNutrientInteractionModel from '../../data/models/DrugNutrientInteraction';
import ICUAdmissionModel from '../../data/models/ICUAdmission';
import RenalAssessmentModel from '../../data/models/RenalAssessment';
import StampPediatricScreeningModel from '../../data/models/StampPediatricScreening';
import { EgfrCalculatorEngine } from '../calculators/EgfrCalculatorEngine';
import { RenalMineralRestrictionEngine } from '../calculators/RenalMineralRestrictionEngine';

export interface IUniversalReportPayload {
  header: {
    generatedAt: string;
    protocolVersion: string;
    clinicianName: string;
  };
  patientProfile: {
    fullName: string;
    fileNumber: string;
    age: number;
    gender: string;
    diagnosis: string;
    caseType: 'ICU' | 'RENAL' | 'PEDIATRIC' | 'ADULT_GENERAL';
  };
  screening: {
    toolName: string;
    score: number;
    riskLevel: string;
    riskLevelAr: string;
    date: string;
  } | null;
  anthropometrics: {
    current: {
      weight: number | null;
      height: number | null;
      bmi: number | null;
      bmiCategory: string;
    };
    trends: {
      date: string;
      weight: number;
      bmi: number;
    }[];
  };
  clinicalCalculations: {
    label: string;
    labelAr: string;
    value: string;
  }[];
  specializedMetrics: {
    icu?: {
      admissionDate: string;
      apacheScore: string;
      enPnTargets: string;
      fluidBalance24h: string;
    };
    renal?: {
      egfr: number;
      potassiumLimit: string;
      phosphorusLimit: string;
      sodiumLimit: string;
    };
    pediatric?: {
      wfaZScore: number | null;
      hfaZScore: number | null;
      bfaZScore: number | null;
      classification: string;
    };
  };
  alerts: {
    severity: string;
    messageAr: string;
    messageEn: string;
  }[];
  interventionSummary: {
    calorieTarget: number;
    proteinTarget: number;
    actualIntake?: number;
    deficit: number;
  };
}

export class GenerateUniversalReportUseCase {
  async execute(patientId: string): Promise<IUniversalReportPayload> {
    const db = await getDatabase();
    
    // Optimized Pre-fetching
    const [patient, vitals, calculations, dnis, intervention, meals] = await Promise.all([
      db.get<PatientModel>('patients').find(patientId),
      db.get<VitalsRecordModel>('vitals_records')
        .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', Q.desc), Q.take(10))
        .fetch(),
      db.get<CalculationModel>('calculations')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc))
        .fetch(),
      db.get<DrugNutrientInteractionModel>('drug_nutrient_interactions')
        .query(Q.where('patient_id', patientId))
        .fetch(),
      db.get('interventions')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch() as Promise<any[]>,
      db.get('meal_plans')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(5))
        .fetch() as Promise<any[]>
    ]);

    const activeIntervention = intervention.length > 0 ? intervention[0] : null;
    const latestMeal = meals.length > 0 ? meals[0] : null;

    const age = patient.age;
    const isPediatric = age < 18;
    const diag = patient.primaryDiagnosis?.toLowerCase() || '';
    const dept = patient.department?.toLowerCase() || '';
    
    let caseType: 'ICU' | 'RENAL' | 'PEDIATRIC' | 'ADULT_GENERAL' = 'ADULT_GENERAL';
    if (isPediatric) caseType = 'PEDIATRIC';
    if (dept.includes('icu') || diag.includes('icu')) caseType = 'ICU';
    if (diag.includes('renal') || diag.includes('kidney')) caseType = 'RENAL';

    // Fetch Specialized Data
    let specializedData: any = {};
    if (caseType === 'ICU') {
      const icuAdmissions = await db.get<ICUAdmissionModel>('icu_admissions')
        .query(Q.where('patient_id', patientId), Q.sortBy('admission_date', Q.desc), Q.take(1))
        .fetch();
      
      if (icuAdmissions.length > 0) {
        const adm = icuAdmissions[0];
        const icuPrescriptions = await db.get('icu_prescriptions')
          .query(Q.where('icu_admission_id', adm.id), Q.sortBy('created_at', Q.desc), Q.take(1))
          .fetch() as any[];
        
        const presc = icuPrescriptions[0];
        specializedData.icu = {
          admissionDate: new Date(adm.admissionDate).toLocaleDateString(),
          apacheScore: (adm as any).apacheTwoScore || 'N/A',
          enPnTargets: presc ? `${presc.formulaName} @ ${presc.rateMlHr} ml/hr` : "Targeting 25-30 kcal/kg",
          fluidBalance24h: "Monitoring Active"
        };
      }
    } else if (caseType === 'RENAL') {
      const renalAssms = await db.get<RenalAssessmentModel>('renal_assessments')
        .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', Q.desc), Q.take(1))
        .fetch();
      if (renalAssms.length > 0) {
        const ra = renalAssms[0];
        const egfrResult = EgfrCalculatorEngine.calculateEgfr({
          serumCreatinine: ra.serumCreatinine,
          age: patient.age,
          gender: patient.gender === 'female' ? 'female' : 'male',
        });
        const latestWeight = vitals[0]?.weightKg || 70;
        const restrictionResult = RenalMineralRestrictionEngine.calculateRestrictions({
          ckdStage: egfrResult.stage === 'unknown' ? 'stage_1' : egfrResult.stage,
          dialysisStatus: (ra.dialysisStatus === 'hemodialysis' || ra.dialysisStatus === 'peritoneal' || ra.dialysisStatus === 'none') ? ra.dialysisStatus : 'none',
          weightKg: latestWeight,
          measuredUrineOutputMl: ra.measuredUrineOutput || null,
        });

        specializedData.renal = {
          egfr: egfrResult.egfrValue,
          potassiumLimit: restrictionResult.potassiumMaxMg ? `< ${restrictionResult.potassiumMaxMg}mg/day` : "< 2000mg/day",
          phosphorusLimit: restrictionResult.phosphorusMaxMg ? `${restrictionResult.phosphorusMaxMg}mg/day` : "800-1000mg/day",
          sodiumLimit: restrictionResult.sodiumMaxMg ? `< ${restrictionResult.sodiumMaxMg}mg/day` : "< 2300mg/day"
        };
      }
    } else if (isPediatric) {
      const stampScreenings = await db.get<StampPediatricScreeningModel>('stamp_pediatric_screenings')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();
      if (stampScreenings.length > 0) {
        const s = stampScreenings[0];
        specializedData.pediatric = {
          wfaZScore: null,
          hfaZScore: null,
          bfaZScore: null,
          classification: s.riskLevelLabelAr || 'تقييم غير مكتمل'
        };
      }
    }

    // Build Screening Info
    let screening: IUniversalReportPayload['screening'] = null;
    if (isPediatric) {
      const s = await db.get<StampPediatricScreeningModel>('stamp_pediatric_screenings')
        .query(Q.where('patient_id', patientId), Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();
      if (s.length > 0) {
        screening = {
          toolName: 'STAMP',
          score: s[0].totalScore,
          riskLevel: s[0].riskLevelLabel || 'Unknown',
          riskLevelAr: s[0].riskLevelLabelAr || 'غير معروف',
          date: s[0].createdAt ? new Date(s[0].createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
      }
    } else {
      const s = calculations.find(c => c.formulaName.includes('NRS-2002'));
      if (s) {
        screening = {
          toolName: 'NRS-2002',
          score: s.resultValue,
          riskLevel: s.resultValue >= 3 ? 'At Risk' : 'Low Risk',
          riskLevelAr: s.resultValue >= 3 ? 'معرض للخطر' : 'خطر منخفض',
          date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
      }
    }

    // Build Trends
    const trends = vitals.map(v => ({
      date: new Date(v.recordDate || v.createdAt || new Date()).toLocaleDateString(),
      weight: v.weightKg || 0,
      bmi: v.bmi || 0
    })).reverse();

    // Map Alerts
    const alerts = dnis.map(d => ({
      severity: d.clinicalSeverity,
      messageAr: d.mechanismAr || 'تنبيه سريري',
      messageEn: d.mechanismEn || 'Clinical Alert'
    }));

    // Intake Analysis
    const calorieTarget = activeIntervention?.targetCalories || 2000;
    const proteinTarget = activeIntervention?.targetProtein || 80;
    const actualCalories = latestMeal?.totalCalories || 0;

    return {
      header: {
        generatedAt: new Date().toISOString(),
        protocolVersion: "3.0-Universal",
        clinicianName: "Dr. Anas Al-Umawi"
      },
      patientProfile: {
        fullName: patient.fullName,
        fileNumber: patient.fileNumber,
        age: patient.age,
        gender: patient.gender,
        diagnosis: patient.primaryDiagnosis || 'N/A',
        caseType
      },
      screening,
      anthropometrics: {
        current: {
          weight: vitals[0]?.weightKg || null,
          height: vitals[0]?.heightCm || null,
          bmi: vitals[0]?.bmi || null,
          bmiCategory: (vitals[0]?.bmiCategory === 'underweight' ? 'نقص وزن' :
                        vitals[0]?.bmiCategory === 'normal' ? 'وزن طبيعي' :
                        vitals[0]?.bmiCategory === 'overweight' ? 'وزن زائد' :
                        vitals[0]?.bmiCategory === 'obese' ? 'سمنة' : 'غير معروف')
        },
        trends
      },
      clinicalCalculations: calculations.slice(0, 5).map(c => ({
        label: c.formulaName,
        labelAr: c.formulaName,
        value: String(c.resultValue)
      })),
      specializedMetrics: specializedData,
      alerts,
      interventionSummary: {
        calorieTarget,
        proteinTarget,
        actualIntake: actualCalories,
        deficit: calorieTarget - actualCalories
      }
    };
  }
}
