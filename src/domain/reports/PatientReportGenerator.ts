import {
  PatientFinalReport, PatientProfileData, ClinicalMetricsData,
  LaboratoryResultItem, DiagnosisData, NutritionPlanData,
  DietitianNotesData, RecommendationsData, RiskAssessmentData, PatientReportOutput
} from './PatientFinalReportTypes';
import { PatientRepository } from '../../data/repositories/PatientRepository';
import { LabResultRecord } from '../repositories/ILabResultRepository';
import { MedicationRecord } from '../repositories/IMedicationRepository';
import { SupplementRecord } from '../repositories/ISupplementRepository';
import { LabResultRepository } from '../../data/repositories/LabResultRepository';
import { MedicationRepository } from '../../data/repositories/MedicationRepository';
import { MedicalHistoryRepository } from '../../data/repositories/MedicalHistoryRepository';
import { InterventionRepository } from '../../data/repositories/InterventionRepository';
import { SupplementRepository } from '../../data/repositories/SupplementRepository';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';

function safeStr(v: unknown, fallback = 'غير متوفر'): string {
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return fallback;
}

function safeNum(v: unknown, fallback: number | null = null): number | null {
  if (typeof v === 'number' && isFinite(v) && v > 0) return Math.round(v * 100) / 100;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n) && n > 0) return Math.round(n * 100) / 100;
  }
  return fallback;
}

export class PatientReportGenerator {
  async execute(patientId: string, clinicianName = 'ADCN Clinical Nutrition AI'): Promise<PatientReportOutput> {
    if (!patientId) throw new Error('Patient ID is required');

    const patientRepo = new PatientRepository();
    const labRepo = new LabResultRepository();
    const medRepo = new MedicationRepository();
    const medHistRepo = new MedicalHistoryRepository();
    const intervRepo = new InterventionRepository();
    const suppRepo = new SupplementRepository();

    const [
      patientRecord,
      labRecords,
      medicationRecords,
      medicalHistory,
      intervention,
      supplementRecords,
      db
    ] = await Promise.all([
      patientRepo.findById(patientId).catch(() => null),
      labRepo.getByPatientId(patientId).catch(() => []),
      medRepo.getByPatientId(patientId).catch(() => []),
      medHistRepo.getByPatientId(patientId).catch(() => null),
      intervRepo.getActiveByPatientId(patientId).catch(() => null),
      suppRepo.getByPatientId(patientId).catch(() => []),
      getDatabase().catch(() => null)
    ]);

    let vitalsRecord: Record<string, unknown> | null = null;
    if (db) {
      try {
        const vitals = await db.get('vitals_records')
          .query(Q.where('patient_id', patientId), Q.sortBy('recorded_at', Q.desc), Q.take(1))
          .fetch();
        if (vitals.length > 0) vitalsRecord = vitals[0] as unknown as Record<string, unknown>;
      } catch { }
    }

    const patientRaw = patientRecord as Record<string, unknown> | null;

    const fullName = safeStr(patientRaw?.fullName);
    const age = safeNum(patientRaw?.age, 0) ?? 0;
    const gender = patientRaw?.gender === 'female' ? 'female' as const : 'male' as const;

    const weight = safeNum(vitalsRecord?.weightKg) ?? safeNum(vitalsRecord?.weight);
    const height = safeNum(vitalsRecord?.heightCm) ?? safeNum(vitalsRecord?.height);

    let bmi: number | null = null;
    let bmiCategory = 'غير متوفر';
    if (weight && height) {
      bmi = Math.round((weight / ((height / 100) ** 2)) * 100) / 100;
      if (bmi < 18.5) bmiCategory = 'نقص وزن (Underweight)';
      else if (bmi < 25) bmiCategory = 'وزن طبيعي (Normal)';
      else if (bmi < 30) bmiCategory = 'وزن زائد (Overweight)';
      else bmiCategory = 'سمنة (Obese)';
    }

    const patientProfile: PatientProfileData = {
      patientId,
      fullName,
      age,
      gender,
      phone: safeStr(patientRaw?.phoneNumber),
      address: {
        governorate: safeStr(patientRaw?.governorate),
        district: safeStr(patientRaw?.district),
        ezla: safeStr(patientRaw?.ezla),
      },
      occupation: safeStr(patientRaw?.occupation),
      maritalStatus: safeStr(patientRaw?.maritalStatus),
      emergencyContact: safeStr(patientRaw?.emergencyContact),
    };

    const clinicalMetrics: ClinicalMetricsData = {
      weight,
      height,
      bmi,
      bmiCategory,
      bmr: null,
      tdee: null,
      bodyFatPercentage: safeNum(vitalsRecord?.bodyFatPercentage),
      waistCircumference: safeNum(vitalsRecord?.waistCircumference),
      hipCircumference: safeNum(vitalsRecord?.hipCircumference),
      waistToHipRatio: null,
      activityLevel: safeStr(patientRaw?.activityLevel),
      activityMultiplier: null,
    };

    if (clinicalMetrics.waistCircumference && clinicalMetrics.hipCircumference) {
      clinicalMetrics.waistToHipRatio = Math.round((clinicalMetrics.waistCircumference / clinicalMetrics.hipCircumference) * 100) / 100;
    }

    const labResults: LaboratoryResultItem[] = labRecords.map((r: LabResultRecord) => {
      const isAbnormal = r.interpretation === 'high' || r.interpretation === 'low' ||
        r.interpretation === 'critically_high' || r.interpretation === 'critically_low';
      const isCritical = r.interpretation === 'critically_high' || r.interpretation === 'critically_low';
      return {
        testName: safeStr(r.testName),
        value: r.resultValue,
        unit: safeStr(r.unit),
        normalLow: r.referenceRangeLow,
        normalHigh: r.referenceRangeHigh,
        isAbnormal,
        isCritical,
        recordedBy: 'Smart_OCR_Engine',
        timestamp: safeStr(r.testDate),
      };
    });

    const abnormalTestsCount = labResults.filter((r: LaboratoryResultItem) => r.isAbnormal).length;
    const criticalTestsCount = labResults.filter((r: LaboratoryResultItem) => r.isCritical).length;

    const chronicConditions: string[] = [];
    const allergies: string[] = [];
    if (medicalHistory) {
      if (medicalHistory.comorbidities) {
        chronicConditions.push(...medicalHistory.comorbidities.split(',').map((s: string) => s.trim()).filter(Boolean));
      }
      if (medicalHistory.medicationAllergies) {
        allergies.push(...medicalHistory.medicationAllergies.split(',').map((s: string) => s.trim()).filter(Boolean));
      }
    }

    const secondaryDiagnoses: string[] = [];
    const primaryDiagnosis = safeStr(patientRaw?.primaryDiagnosis);

    const diagnosis: DiagnosisData = {
      primaryDiagnosis,
      secondaryDiagnoses: secondaryDiagnoses.length > 0 ? secondaryDiagnoses : ['غير متوفر'],
      chronicConditions: chronicConditions.length > 0 ? chronicConditions : ['غير متوفر'],
      allergies: allergies.length > 0 ? allergies : ['غير متوفر'],
      currentMedications: medicationRecords.map((m: MedicationRecord) => ({
        name: safeStr(m.drugName) || safeStr(m.name) || safeStr(m.nameAr),
        dosage: safeStr(m.dosage),
        frequency: safeStr(m.frequency),
      })),
    };

    const nutritionPlan: NutritionPlanData = {
      planId: intervention?.id || 'غير متوفر',
      caloricTarget: intervention?.targetCalories ?? 0,
      macroSplit: {
        proteinGrams: intervention?.targetProtein ?? 0,
        proteinPercentage: 0,
        carbsGrams: intervention?.targetCarbohydrates ?? 0,
        carbsPercentage: 0,
        fatGrams: intervention?.targetFat ?? 0,
        fatPercentage: 0,
      },
      mealTiming: {
        mealsPerDay: 3,
        snacksPerDay: 0,
        breakfastTime: 'غير متوفر',
        lunchTime: 'غير متوفر',
        dinnerTime: 'غير متوفر',
      },
      dietType: safeStr(intervention?.dietType),
      restrictions: intervention?.dietModifications ? intervention.dietModifications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      preferences: [],
      hydrationTarget: (intervention?.fluidAllowance ?? 0) / 1000,
      fiberTarget: 0,
    };

    const calTarget = nutritionPlan.caloricTarget;
    if (calTarget > 0) {
      const proteinCals = nutritionPlan.macroSplit.proteinGrams * 4;
      const carbsCals = nutritionPlan.macroSplit.carbsGrams * 4;
      const fatCals = nutritionPlan.macroSplit.fatGrams * 9;
      nutritionPlan.macroSplit.proteinPercentage = Math.round((proteinCals / calTarget) * 100);
      nutritionPlan.macroSplit.carbsPercentage = Math.round((carbsCals / calTarget) * 100);
      nutritionPlan.macroSplit.fatPercentage = Math.round((fatCals / calTarget) * 100);
    }

    const dietaryRecs: string[] = [];
    if (intervention?.dietRecommendations) {
      dietaryRecs.push(...intervention.dietRecommendations.split('\n').map((s: string) => s.trim()).filter(Boolean));
    }
    if (intervention?.behavioralInstructions) {
      dietaryRecs.push(...intervention.behavioralInstructions.split('\n').map((s: string) => s.trim()).filter(Boolean));
    }

    const dietitianNotes: DietitianNotesData = {
      notes: safeStr(intervention?.nutritionDiagnosis),
      followUpFrequency: safeStr(intervention?.followUpInterval),
      nextFollowUpDate: 'غير متوفر',
      specialInstructions: safeStr(intervention?.comments),
    };

    const recommendations: RecommendationsData = {
      dietaryRecommendations: dietaryRecs.length > 0 ? dietaryRecs : [
        'اتباع النظام الغذائي الموصى به بدقة',
        'تقسيم الوجبات على 3-5 وجبات يومياً',
        'شرب كمية كافية من الماء (2-3 لتر يومياً)',
        'تجنب الأطعمة المصنعة والمشروبات الغازية',
      ],
      lifestyleRecommendations: [
        'ممارسة النشاط البدني المعتدل لمدة 30 دقيقة يومياً (بعد استشارة الطبيب)',
        'النوم لمدة 7-8 ساعات يومياً',
        'إدارة الإجهاد وتجنب التوتر',
        'المتابعة المنتظمة مع أخصائي التغذية',
      ],
      supplementRecommendations: supplementRecords.map((s: SupplementRecord) => ({
        name: safeStr(s.supplementName),
        dosage: safeStr(s.dosage),
        reason: safeStr(s.supplementType),
      })),
      warningFlags: [],
    };

    const riskAssessment: RiskAssessmentData = {
      overallRiskLevel: 'low',
      riskScore: 0,
      icuAdmissionRequired: false,
      samRisk: false,
      stampRisk: false,
      diabetesRisk: false,
      cvdRisk: false,
    };

    const diagLower = primaryDiagnosis.toLowerCase();
    const deptLower = (patientRaw?.department as string || '').toLowerCase();
    const chronicStr = chronicConditions.join(' ').toLowerCase();

    if (diagLower.includes('icu') || deptLower.includes('icu')) riskAssessment.icuAdmissionRequired = true;
    if (diagLower.includes('sugar') || diagLower.includes('diabetes') || diagLower.includes('سكر') || chronicStr.includes('diabetes') || chronicStr.includes('سكر')) {
      riskAssessment.diabetesRisk = true;
    }
    if (diagLower.includes('heart') || diagLower.includes('cvd') || diagLower.includes('قلب') || chronicStr.includes('heart') || chronicStr.includes('hypertension')) {
      riskAssessment.cvdRisk = true;
    }

    let riskScore = 0;
    if (riskAssessment.icuAdmissionRequired) riskScore += 25;
    if (riskAssessment.diabetesRisk) riskScore += 20;
    if (riskAssessment.cvdRisk) riskScore += 15;
    if (criticalTestsCount > 0) riskScore += 20;
    if (abnormalTestsCount > 2) riskScore += 10;
    if (bmi && bmi >= 30) riskScore += 10;
    if (bmi && bmi < 18.5) riskScore += 10;

    riskAssessment.riskScore = Math.min(riskScore, 100);
    if (riskScore >= 70) riskAssessment.overallRiskLevel = 'critical';
    else if (riskScore >= 50) riskAssessment.overallRiskLevel = 'high';
    else if (riskScore >= 25) riskAssessment.overallRiskLevel = 'medium';
    else riskAssessment.overallRiskLevel = 'low';

    if (riskAssessment.icuAdmissionRequired) {
      recommendations.warningFlags.push('⚠️ دخول العناية المركزة مطلوب (ICU Admission Required)');
    }
    if (riskAssessment.diabetesRisk) {
      recommendations.warningFlags.push('⚠️ خطر الإصابة بمرض السكري مرتفع (Diabetes Risk = HIGH)');
    }
    if (riskAssessment.cvdRisk) {
      recommendations.warningFlags.push('⚠️ خطر الإصابة بأمراض القلب والشرايين مرتفع (CVD Risk = HIGH)');
    }
    if (criticalTestsCount > 0) {
      recommendations.warningFlags.push(`⚠️ وجود ${criticalTestsCount} فحص(وصات) مخبري(ة) حرج(ة) يتطلب تدخلاً فورياً`);
    }

    const keyRecommendations: string[] = [];
    if (nutritionPlan.caloricTarget > 0) {
      keyRecommendations.push(`🍽️ السعرات المستهدفة: ${nutritionPlan.caloricTarget.toLocaleString('ar-YE')} كيلو كالوري/يوم`);
    }
    if (dietaryRecs.length > 0) keyRecommendations.push(...dietaryRecs.slice(0, 3));
    if (supplementRecords.length > 0) {
      supplementRecords.slice(0, 2).forEach((s: SupplementRecord) => {
        keyRecommendations.push(`💊 المكمل: ${s.supplementName} (${s.dosage || 'حسب التعليمات'})`);
      });
    }
    if (riskAssessment.overallRiskLevel === 'high' || riskAssessment.overallRiskLevel === 'critical') {
      keyRecommendations.push('🔴 متابعة طبية عاجلة مطلوبة');
    }

    const reportDate = new Date().toISOString();
    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;

    const medicalDisclaimer = 'القرار الطبي النهائي بيد الطبيب المعالج. هذا التقرير لأغراض التوجيه الغذائي فقط ولا يغني عن الاستشارة الطبية المباشرة.';

    const fullReport: PatientFinalReport = {
      patientProfile, clinicalMetrics, laboratoryResults: labResults,
      abnormalTestsCount, criticalTestsCount, diagnosis, nutritionPlan,
      dietitianNotes, recommendations, riskAssessment,
      reportDate, reportId, clinicianName, medicalDisclaimer,
    };

    const reportText = this.buildReportText(fullReport);

    return {
      reportText,
      summary: {
        patientId,
        fullName,
        age,
        gender: gender === 'male' ? 'ذكر' : 'أنثى',
        primaryDiagnosis,
        overallRiskLevel: riskAssessment.overallRiskLevel,
        riskScore: riskAssessment.riskScore,
        caloricTarget: nutritionPlan.caloricTarget,
        abnormalTestsCount,
        icuAdmissionRequired: riskAssessment.icuAdmissionRequired,
      },
      abnormalTests: labResults.filter(r => r.isAbnormal),
      warningFlags: recommendations.warningFlags,
      keyRecommendations,
      reportDate,
      medicalDisclaimer,
      rawData: fullReport,
    };
  }

  private buildReportText(report: PatientFinalReport): string {
    const p = report.patientProfile;
    const m = report.clinicalMetrics;
    const d = report.diagnosis;
    const n = report.nutritionPlan;
    const dn = report.dietitianNotes;
    const rec = report.recommendations;
    const ra = report.riskAssessment;

    const fmtNum = (v: number | null, suffix = ''): string => {
      if (v === null || v === undefined) return 'غير متوفر';
      return `${v.toLocaleString('ar-YE')} ${suffix}`.trim();
    };

    const fmtList = (items: string[], fallback = 'غير متوفر'): string => {
      if (!items || items.length === 0 || items[0] === 'غير متوفر') return fallback;
      return items.map(i => `   ▸ ${i}`).join('\n');
    };

    let text = `📄 تقرير طبي نهائي - ADCN Clinical Nutrition\n${'━'.repeat(46)}\n\n`;

    text += `👤 القسم 1: بيانات المريض الأساسية\n${'─'.repeat(36)}\n`;
    text += `   الاسم: ${p.fullName}\n`;
    text += `   العمر: ${p.age} سنة\n`;
    text += `   الجنس: ${p.gender === 'male' ? 'ذكر' : 'أنثى'}\n`;
    text += `   رقم الملف: ${p.patientId}\n`;
    text += `   رقم الهاتف: ${p.phone}\n`;
    if (p.address.governorate !== 'غير متوفر') {
      text += `   العنوان: ${p.address.governorate} / ${p.address.district}\n`;
    }
    text += '\n';

    text += `📊 القسم 2: المؤشرات الحيوية\n${'─'.repeat(36)}\n`;
    if (m.weight) text += `   ✅ الوزن: ${fmtNum(m.weight, 'كجم')}\n`;
    if (m.height) text += `   ✅ الطول: ${fmtNum(m.height, 'سم')}\n`;
    if (m.bmi) text += `   ✅ BMI: ${fmtNum(m.bmi, 'كجم/م²')} (${m.bmiCategory})\n`;
    if (m.waistCircumference) text += `   محيط الخصر: ${fmtNum(m.waistCircumference, 'سم')}\n`;
    if (m.hipCircumference) text += `   محيط الورك: ${fmtNum(m.hipCircumference, 'سم')}\n`;
    if (m.waistToHipRatio) text += `   نسبة الخصر/الورك: ${m.waistToHipRatio.toFixed(2)}\n`;
    if (m.bodyFatPercentage) text += `   نسبة الدهون: ${fmtNum(m.bodyFatPercentage, '%')}\n`;
    text += `   مستوى النشاط: ${m.activityLevel}\n`;
    text += '\n';

    text += `🔬 القسم 3: الفحوصات المخبرية\n${'─'.repeat(36)}\n`;
    if (report.laboratoryResults.length === 0) {
      text += `   لا توجد فحوصات مسجلة\n`;
    } else {
      for (const lab of report.laboratoryResults) {
        const marker = lab.isCritical ? '❌' : lab.isAbnormal ? '⚠️' : '✅';
        text += `   ${marker} ${lab.testName}: ${lab.value} ${lab.unit}\n`;
        text += `      ▸ الطبيعي: ${lab.normalLow}-${lab.normalHigh} ${lab.unit}\n`;
        if (lab.isAbnormal) {
          text += `      ▸ الحالة: ${lab.value > lab.normalHigh ? 'مرتفع' : 'منخفض'}\n`;
        }
      }
      text += `   ─────────────────\n`;
      text += `   الفحوصات غير الطبيعية: ${report.abnormalTestsCount}\n`;
      text += `   الفحوصات الحرجة: ${report.criticalTestsCount}\n`;
    }
    text += '\n';

    text += `🩺 القسم 4: التشخيص والحالات المزمنة\n${'─'.repeat(36)}\n`;
    text += `   التشخيص الرئيسي: ${d.primaryDiagnosis}\n`;
    text += `   الحالات المزمنة:\n${fmtList(d.chronicConditions)}\n`;
    text += `   الحساسية:\n${fmtList(d.allergies)}\n`;
    if (d.currentMedications.length > 0) {
      text += `   الأدوية الحالية:\n`;
      for (const med of d.currentMedications) {
        text += `      ▸ ${med.name} - ${med.dosage} (${med.frequency})\n`;
      }
    }
    text += '\n';

    text += `🍽️ القسم 5: الخطة العلاجية الغذائية\n${'─'.repeat(36)}\n`;
    text += `   🍽️ السعرات: ${fmtNum(n.caloricTarget, 'كيلو كالوري/يوم')}\n`;
    text += `   🥩 البروتين: ${fmtNum(n.macroSplit.proteinGrams, 'جم')} (${n.macroSplit.proteinPercentage}%)\n`;
    text += `   🌾 الكربوهيدرات: ${fmtNum(n.macroSplit.carbsGrams, 'جم')} (${n.macroSplit.carbsPercentage}%)\n`;
    text += `   🧈 الدهون: ${fmtNum(n.macroSplit.fatGrams, 'جم')} (${n.macroSplit.fatPercentage}%)\n`;
    text += `   💧 السوائل: ${fmtNum(n.hydrationTarget, 'لتر/يوم')}\n`;
    text += `   نوع الحمية: ${n.dietType}\n`;
    if (n.restrictions.length > 0) {
      text += `   القيود الغذائية:\n${fmtList(n.restrictions)}\n`;
    }
    text += '\n';

    text += `📝 القسم 6: ملاحظات أخصائي التغذية\n${'─'.repeat(36)}\n`;
    text += `   ${dn.notes}\n`;
    text += `   تكرار المتابعة: ${dn.followUpFrequency}\n`;
    if (dn.specialInstructions !== 'غير متوفر') {
      text += `   تعليمات خاصة: ${dn.specialInstructions}\n`;
    }
    text += '\n';

    text += `✅ القسم 7: التوصيات الطبية والغذائية\n${'─'.repeat(36)}\n`;
    text += `   توصيات غذائية:\n${fmtList(rec.dietaryRecommendations)}\n`;
    text += `   توصيات نمط حياة:\n${fmtList(rec.lifestyleRecommendations)}\n`;
    if (rec.supplementRecommendations.length > 0) {
      text += `   المكملات الموصى بها:\n`;
      for (const s of rec.supplementRecommendations) {
        text += `      ▸ ${s.name} - ${s.dosage} (${s.reason})\n`;
      }
    }
    text += '\n';

    text += `⚠️ القسم 8: تقييم الخطورة والتحذيرات\n${'─'.repeat(36)}\n`;
    text += `   مستوى الخطورة: ${ra.overallRiskLevel === 'critical' ? 'حرج' : ra.overallRiskLevel === 'high' ? 'عالٍ' : ra.overallRiskLevel === 'medium' ? 'متوسط' : 'منخفض'}\n`;
    text += `   درجة الخطورة: ${ra.riskScore}/100\n`;
    if (rec.warningFlags.length > 0) {
      text += `   التحذيرات:\n`;
      for (const w of rec.warningFlags) {
        text += `      ${w}\n`;
      }
    }
    text += '\n';

    text += `${'━'.repeat(46)}\n`;
    text += `📅 تاريخ التقرير: ${new Date(report.reportDate).toLocaleString('ar-YE')}\n`;
    text += `👨‍⚕️ الخبير الطبي: ${report.clinicianName}\n`;
    text += `⚕️ تنويه: ${report.medicalDisclaimer}\n`;

    return text;
  }
}
