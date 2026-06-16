import { ClinicalEngineInput, ClinicalEngineOutput, EngineFoodSuggestion, EngineDrugAlert, TherapeuticFoodInfo, DrugInteractionInfo } from '../types';
import { ProtocolSelector } from './ProtocolSelector';
import { PatientStoryBuilder } from './PatientStoryBuilder';
import { ClinicalAssessmentEngine } from './ClinicalAssessmentEngine';
import { DepartmentPlannerRegistry, PlannerPatient } from '../../calculators/DepartmentPlannerRegistry';
import { validateLabMetrics } from '../../../utils/clinicalAlertsEngine';

const CONDITION_BENEFITS: Record<string, string[]> = {
  diabetes: ['blood_sugar_control', 'blood_sugar_lowering'],
  ckd: ['potassium_mg', 'phosphorus_mg'],
  kidney: ['potassium_mg', 'phosphorus_mg'],
  cardiovascular: ['heart_healthy', 'cholesterol_lowering', 'blood_pressure_lowering'],
  hypertension: ['blood_pressure_lowering', 'heart_healthy'],
  icu: ['anti_inflammatory', 'immune_support', 'wound_healing'],
  sepsis: ['anti_inflammatory', 'immune_booster', 'antimicrobial'],
  trauma: ['wound_healing', 'anti_inflammatory', 'high_protein'],
  gastrointestinal: ['digestive_aid', 'probiotic', 'fiber_rich', 'laxative'],
  liver: ['liver_protection', 'antioxidant'],
  respiratory: ['anti_inflammatory', 'immune_support', 'anti_asthmatic'],
  oncology: ['antioxidant', 'immune_booster', 'anti_inflammatory'],
  pregnancy: ['lactation_aid', 'labor_facilitation', 'calcium_source'],
  general: ['antioxidant', 'anti_inflammatory', 'immune_support', 'energy_source'],
};

export class ClinicalDecisionEngine {
  static async process(input: ClinicalEngineInput): Promise<ClinicalEngineOutput> {
    const patientStory = PatientStoryBuilder.build(input);
    const assessment = ClinicalAssessmentEngine.assess(input);
    const protocol = ProtocolSelector.select(input.patient, input.weightKg, input.age);

    const plannerPatient: PlannerPatient = {
      ...input.patient as unknown as PlannerPatient,
      weight_kg: input.weightKg,
      height_cm: input.heightCm,
      age: input.age,
      is_ventilated: input.isVentilated,
      has_diabetes: input.hasDiabetes || input.diagnosis.toLowerCase().includes('diabetes'),
      has_kidney_disease: input.hasKidneyDisease || input.diagnosis.toLowerCase().includes('ckd') || input.diagnosis.toLowerCase().includes('kidney'),
      on_dialysis: input.onDialysis,
    };

    const planner = DepartmentPlannerRegistry.getPlannerByPatient(plannerPatient);
    const calories = Math.round(planner.calculateTEE(plannerPatient));
    const protein = Math.round(planner.calculateProtein(plannerPatient));
    const carbs = Math.round(planner.calculateCarbs(plannerPatient, calories));
    const fat = Math.round(planner.calculateFat(plannerPatient, calories));
    const proteinPerKg = input.weightKg > 0 ? +(protein / input.weightKg).toFixed(1) : 1.2;
    const fluid = Math.round(30 * input.weightKg);

    const treatmentPlan = {
      nutrition: {
        calories,
        protein,
        proteinPerKg,
        carbs,
        carbsPercent: calories > 0 ? Math.round((carbs * 4 / calories) * 100) : 55,
        fat,
        fatPercent: calories > 0 ? Math.round((fat * 9 / calories) * 100) : 30,
        fluid,
      },
      medications: input.medications || [],
      monitoring: {
        frequency: assessment.severity === 'critical' ? 'يومياً' : 'أسبوعياً',
        parameters: [
          'الوزن',
          'سكر الدم',
          'الإلكتروليتات',
          'توازن السوائل',
        ],
        tests: [
          'صورة دم كاملة',
          'وظائف الكلى',
          'وظائف الكبد',
        ],
        followUpSchedule: assessment.severity === 'critical' ? 'كل 24 ساعة' : 'كل أسبوع',
        reassessmentCriteria: [
          'تغير الوزن > 5%',
          'تغير الحالة السريرية',
          'نتائج مختبر غير طبيعية',
        ],
      },
      followUp: [
        'مراجعة أسبوعية للخطة العلاجية',
        'تقييم الالتزام بالحمية',
        'تعديل الخطة حسب الاستجابة السريرية',
      ],
      goals: assessment.goals,
      expectations: `تحسن الحالة الغذائية خلال 7-14 يوماً مع الالتزام بالخطة العلاجية. إعادة تقييم بعد ${assessment.severity === 'critical' ? '7' : '14'} يوماً.`,
    };

    const interventions = {
      immediate: assessment.risks.refeeding.riskLevel === 'high'
        ? [
            'تقييد السعرات إلى 10 ك.ك/كلغ في اليوم الأول (Refeeding Syndrome Protocol)',
            'مراقبة الفوسفور والبوتاسيوم والمغنيسيوم قبل البدء بالتغذية',
            'تعويض الإلكتروليتات حسب النتائج المختبرية',
            'مراقبة سكر الدم كل 6 ساعات',
          ]
        : ['البدء بالتغذية حسب الخطة العلاجية المقررة'],
      shortTerm: [
        'زيادة السعرات تدريجياً حسب التحمل',
        'مراقبة تحمل التغذية (غثيان، إقياء، إسهال)',
        'تعديل الماكرو مغذيات حسب الاستجابة',
        ...(assessment.risks.refeeding.riskLevel === 'high' ? ['تدرج سعري: يوم 2 -> 12 ك.ك/كلغ، يوم 3 -> 15 ك.ك/كلغ'] : []),
      ],
      longTerm: protocol.specialConsiderations.slice(0, 3),
      education: [
        'توعية المريض بالحمية الغذائية المطلوبة',
        'تعليم المريض قراءة الملصقات الغذائية',
        'تقديم نصائح عملية للالتزام بالخطة',
      ],
    };

    const recommendations = [
      {
        priority: 'high' as const,
        category: 'Nutrition',
        title: 'Personalized Nutrition Plan',
        titleAr: `خطة تغذية مخصصة لـ ${assessment.nutritionalDiagnosis}`,
        description: `TEE: ${calories} kcal/day, Protein: ${protein} g/day (${proteinPerKg.toFixed(1)} g/kg)`,
        descriptionAr: `السعرات الحرارية: ${calories} ك.ك/يوم، البروتين: ${protein} غ/يوم (${proteinPerKg.toFixed(1)} غ/كلغ)`,
        evidenceLevel: 'A',
      },
      ...(assessment.risks.refeeding.riskLevel === 'high'
        ? [{
            priority: 'critical' as const,
            category: 'Nutrition',
            title: 'Refeeding Syndrome Caloric Restriction',
            titleAr: 'تقييد السعرات للوقاية من متلازمة إعادة التغذية',
            description: 'Day 1: 10 kcal/kg, Day 2: 12 kcal/kg, Day 3: 15 kcal/kg',
            descriptionAr: 'اليوم 1: 10 ك.ك/كلغ، اليوم 2: 12 ك.ك/كلغ، اليوم 3: 15 ك.ك/كلغ',
            evidenceLevel: 'A',
          }]
        : []),
      ...protocol.specialConsiderations.slice(0, 3).map((s) => ({
        priority: 'medium' as const,
        category: 'General',
        title: s,
        titleAr: s,
        description: s,
        descriptionAr: s,
      })),
    ];

    const monitoringPlan = {
      frequency: protocol.phase === 'critical_care' ? 'يومياً' : 'أسبوعياً',
      parameters: protocol.monitoringRequirements,
      tests: assessment.risks.malnutrition.riskLevel === 'high'
        ? ['ألبومين', 'بري-ألبومين', 'فيتامين د', 'فيتامين ب12']
        : ['صورة دم كاملة'],
      followUpSchedule: protocol.phase === 'critical_care' ? 'كل 24-48 ساعة' : 'كل أسبوع إلى أسبوعين',
      reassessmentCriteria: [
        'تغير الوزن بأكثر من 5%',
        'تغير الحالة السريرية',
        'ظهور مضاعفات جديدة',
      ],
    };

    const therapeuticFoodSuggestions = ClinicalDecisionEngine.matchTherapeuticFoods(input, protocol.phase);
    const drugInteractionAlerts = ClinicalDecisionEngine.matchDrugInteractions(input);

    let alerts: string[] = [];
    try {
      const clinicalAlerts = validateLabMetrics(
        {
          phosphorus: input.phosphorus,
          potassium: input.potassium,
          magnesium: input.magnesium,
          albumin: input.albumin,
          bloodGlucose: input.glucoseMgDl,
          creatinine: input.creatinine,
          urea: input.urea,
        },
        undefined,
        {
          weightKg: input.weightKg,
          bmi: PatientStoryBuilder.calcBmi(input.weightKg, input.heightCm),
          weightLossPercent: input.weightChangePercent,
          npoDays: input.npoDays,
          hasMalnutrition: input.hasMalnutrition || false,
        },
      );
      alerts = clinicalAlerts.map((a) => a.title);
    } catch {
      alerts = [];
    }

    if (drugInteractionAlerts.length > 0) {
      alerts.push('⚠️ تفاعلات دوائية-غذائية محتملة — راجع قسم التفاعلات');
      drugInteractionAlerts.forEach((d) => {
        alerts.push(`💊 ${d.ingredient} (${d.severity === 'high' ? 'شديد' : d.severity === 'moderate' ? 'متوسط' : 'بسيط'})`);
      });
    }

    const educationItems = [...interventions.education];
    if (therapeuticFoodSuggestions.length > 0) {
      educationItems.push(`الأغذية العلاجية المقترحة: ${therapeuticFoodSuggestions.map((f) => f.nameAr).join('، ')}`);
    }
    interventions.education = educationItems;

    const report = {
      patientInfo: {
        name: input.patient.fullName,
        age: input.age,
        gender: input.isMale ? 'ذكر' : 'أنثى',
        weight: input.weightKg,
        height: input.heightCm,
        bmi: PatientStoryBuilder.calcBmi(input.weightKg, input.heightCm),
        department: input.department,
        diagnosis: input.diagnosis,
      },
      patientStory,
      clinicalAssessment: assessment,
      protocol,
      treatmentPlan,
      interventions,
      recommendations,
      monitoringPlan,
      executiveSummary: this.buildExecutiveSummary(input, assessment, treatmentPlan, protocol),
      alerts,
      conclusion: [
        `تم إنشاء خطة تغذية علاجية شاملة للمريض "${input.patient.fullName}" وفق بروتوكول "${protocol.nameAr}".`,
        `الشدة السريرية: ${assessment.severity}.`,
        assessment.risks.refeeding.riskLevel === 'high'
          ? `⚠️ خطر إعادة التغذية عالٍ - تم تطبيق بروتوكول التقييد السعري.`
          : '',
        assessment.risks.hyperglycemia.riskLevel === 'high'
          ? `⚠️ خطر فرط سكر الدم - تم تقليل الكربوهيدرات في الخطة.`
          : '',
        assessment.risks.muscleWasting.riskLevel === 'high'
          ? `⚠️ خطر هزال العضلات - تم رفع البروتين في الخطة.`
          : '',
        `يجب إعادة التقييم خلال ${assessment.severity === 'critical' ? '7' : '14'} يوماً.`,
      ]
        .filter(Boolean)
        .join('\n'),
      generatedAt: new Date().toISOString(),
      therapeuticFoods: therapeuticFoodSuggestions,
      drugInteractions: drugInteractionAlerts,
    };

    return {
      patientStory,
      assessment,
      protocol,
      treatmentPlan,
      interventions,
      recommendations,
      monitoringPlan,
      report,
      therapeuticFoods: therapeuticFoodSuggestions,
      drugInteractions: drugInteractionAlerts,
    };
  }

  private static matchTherapeuticFoods(input: ClinicalEngineInput, protocolPhase: string): EngineFoodSuggestion[] {
    if (!input.therapeuticFoods || input.therapeuticFoods.length === 0) return [];

    const lowerDiag = input.diagnosis.toLowerCase();
    const conditionKeys = Object.keys(CONDITION_BENEFITS).filter((key) =>
      lowerDiag.includes(key) || protocolPhase.includes(key),
    );
    const benefitKeys = new Set(conditionKeys.flatMap((key) => CONDITION_BENEFITS[key]));

    if (benefitKeys.size === 0) {
      conditionKeys.push('general');
      Object.keys(CONDITION_BENEFITS).filter((key) => key === 'general').forEach((k) =>
        CONDITION_BENEFITS[k].forEach((b) => benefitKeys.add(b)),
      );
    }

    const suggestions: EngineFoodSuggestion[] = [];
    for (const food of input.therapeuticFoods) {
      let parsed: Record<string, boolean>;
      try {
        parsed = JSON.parse(food.therapeuticBenefits);
      } catch {
        continue;
      }
      const matchedBenefit = Object.keys(parsed).find((b) => benefitKeys.has(b));
      if (matchedBenefit) {
        suggestions.push({
          nameAr: food.nameAr,
          nameEn: food.nameEn,
          benefit: matchedBenefit,
          caloriesPer100g: food.caloriesPer100g,
          proteinPer100g: food.proteinPer100g,
        });
      }
    }
    return suggestions.slice(0, 5);
  }

  private static matchDrugInteractions(input: ClinicalEngineInput): EngineDrugAlert[] {
    if (!input.drugInteractions || input.drugInteractions.length === 0) return [];
    if (!input.medications || input.medications.length === 0) return [];

    const alerts: EngineDrugAlert[] = [];
    const medsLower = input.medications.map((m) => m.toLowerCase());

    for (const interaction of input.drugInteractions) {
      const ingredientLower = interaction.activeIngredient.toLowerCase();
      const ingredientWords = ingredientLower.split(/[\s(]/);
      const match = medsLower.some((med) =>
        ingredientWords.some((word) => word.length > 2 && med.includes(word)),
      );
      if (match) {
        alerts.push({
          ingredient: interaction.activeIngredient,
          severity: interaction.clinicalSeverity,
          action: interaction.dietaryActionRequired || '',
          mechanism: interaction.mechanismDescription || '',
        });
      }
    }
    return alerts;
  }

  private static buildExecutiveSummary(
    input: ClinicalEngineInput,
    assessment: any,
    plan: any,
    protocol: any,
  ): string {
    const bmi = PatientStoryBuilder.calcBmi(input.weightKg, input.heightCm);
    return [
      `مريض: ${input.patient.fullName}، ${input.age} سنة`,
      `BMI: ${bmi.toFixed(1)} | التشخيص: ${assessment.nutritionalDiagnosis}`,
      `البروتوكول: ${protocol.nameAr} | الشدة: ${assessment.severity}`,
      `الخطة: ${plan.nutrition.calories} ك.ك/يوم، بروتين ${plan.nutrition.protein} غ/يوم`,
      `المراقبة: ${plan.monitoring.frequency}`,
    ].join(' | ');
  }
}
