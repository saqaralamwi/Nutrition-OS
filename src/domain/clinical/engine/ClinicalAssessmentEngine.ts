import { ClinicalAssessment, RiskAssessment, Severity, ClinicalEngineInput } from '../types';

export class ClinicalAssessmentEngine {
  static assess(input: ClinicalEngineInput): ClinicalAssessment {
    const bmi = this.calcBmi(input.weightKg, input.heightCm);
    const severity = this.determineSeverity(input, bmi);
    const nutritionalDiagnosis = this.diagnoseNutrition(bmi, input);
    const risks = this.assessRisks(input, bmi);
    const problems = this.identifyProblems(input, bmi, risks);
    const goals = this.identifyGoals(input, nutritionalDiagnosis);

    return {
      severity,
      nutritionalDiagnosis,
      risks,
      problems,
      goals,
      overallAssessment: this.buildAssessment(input, bmi, severity, nutritionalDiagnosis, risks),
    };
  }

  private static calcBmi(w: number, h: number): number {
    if (h <= 0) return 0;
    return w / Math.pow(h / 100, 2);
  }

  static determineSeverity(input: ClinicalEngineInput, bmi: number): Severity {
    let score = 0;
    if (bmi < 16) score += 3;
    else if (bmi < 18.5) score += 2;
    if ((input.weightChangePercent || 0) > 10) score += 2;
    else if ((input.weightChangePercent || 0) > 5) score += 1;
    if ((input.phosphorus || 1) < 0.8) score += 2;
    else if ((input.phosphorus || 1) < 1.0) score += 1;
    if ((input.potassium || 4) < 3.5) score += 2;
    else if ((input.potassium || 4) < 3.8) score += 1;
    if ((input.glucoseMgDl || 0) > 200) score += 2;
    else if ((input.glucoseMgDl || 0) > 180) score += 1;
    if (input.isVentilated) score += 2;
    const dept = (input.department || '').toLowerCase();
    if (dept === 'icu' || dept === 'critical-care') score += 2;
    if (input.hasDiabetes) score += 1;
    if (input.hasKidneyDisease) score += 1;
    return score >= 8 ? 'critical' : score >= 5 ? 'severe' : score >= 3 ? 'moderate' : 'mild';
  }

  private static diagnoseNutrition(bmi: number, input: ClinicalEngineInput): string {
    if (bmi < 16) return 'سوء تغذية شديد (Severe Malnutrition)';
    if (bmi < 18.5) return 'سوء تغذية (Malnutrition)';
    if (bmi >= 30) return 'سمنة (Obesity)';
    if ((input.weightChangePercent || 0) > 10) return 'فقدان وزن كبير (Significant Weight Loss)';
    if ((input.glucoseMgDl || 0) > 140) return 'اضطراب سكر الدم (Dysglycemia)';
    if (input.hasKidneyDisease) return 'احتياجات خاصة لأمراض الكلى (CKD-Specific Requirements)';
    return 'تغذية طبيعية (Normal Nutrition)';
  }

  static assessRisks(input: ClinicalEngineInput, bmi: number): RiskAssessment {
    const refeedingScore =
      ((input.phosphorus || 1) < 0.8 ? 2 : (input.phosphorus || 1) < 1.0 ? 1 : 0) +
      ((input.potassium || 4) < 3.5 ? 2 : (input.potassium || 4) < 3.8 ? 1 : 0) +
      ((input.magnesium || 1) < 0.7 ? 2 : 0) +
      (bmi < 16 ? 3 : bmi < 18.5 ? 1 : 0) +
      ((input.npoDays || 0) >= 5 ? 1 : 0) +
      ((input.weightChangePercent || 0) > 10 ? 1 : 0);

    const glucoseVal = input.glucoseMgDl || 0;
    const glucoseRisk = glucoseVal > 200 ? 3 : glucoseVal > 140 ? 1 : 0;

    const muscleWastingRisk =
      ((input.weightChangePercent || 0) > 10 ? 2 : (input.weightChangePercent || 0) > 5 ? 1 : 0) +
      (bmi < 18.5 ? 1 : 0);

    return {
      refeeding: {
        riskScore: refeedingScore,
        riskLevel: refeedingScore >= 5 ? 'high' : refeedingScore >= 3 ? 'medium' : 'low',
        recommendations: refeedingScore >= 3
          ? [
              'تقييد السعرات الحرارية في اليوم الأول (10 ك.ك/كلغ)',
              'مراقبة الفوسفور والبوتاسيوم والمغنيسيوم يومياً',
              'تعويض الإلكتروليتات قبل البدء بالتغذية',
              'مراقبة سكر الدم كل 6 ساعات',
            ]
          : [],
      },
      overfeeding: {
        riskScore: input.isVentilated ? 2 : 0,
        riskLevel: 'low',
        hiddenCalories: 0,
      },
      muscleWasting: {
        riskScore: muscleWastingRisk,
        riskLevel: muscleWastingRisk >= 2 ? 'high' : muscleWastingRisk >= 1 ? 'medium' : 'low',
      },
      hyperglycemia: {
        riskScore: glucoseRisk,
        riskLevel: glucoseRisk >= 2 ? 'high' : glucoseRisk >= 1 ? 'medium' : 'low',
      },
      malnutrition: {
        riskScore: bmi < 18.5 ? 3 : bmi < 20 ? 1 : 0,
        riskLevel: bmi < 16 ? 'high' : bmi < 18.5 ? 'medium' : 'low',
        type: bmi < 16 ? 'Severe' : bmi < 18.5 ? 'Moderate' : undefined,
      },
    };
  }

  private static identifyProblems(input: ClinicalEngineInput, bmi: number, risks: RiskAssessment): string[] {
    const problems: string[] = [];
    if (risks.refeeding.riskLevel === 'high') problems.push('خطر متلازمة إعادة التغذية - يحتاج تقييد سعري فوري');
    if (risks.hyperglycemia.riskLevel === 'high') problems.push('فرط سكر الدم غير المسيطر عليه');
    if (risks.muscleWasting.riskLevel === 'high') problems.push('خطر هزال العضلات - يحتاج بروتين عالي');
    if (bmi < 18.5) problems.push('نقص الوزن - يحتاج زيادة سعرات وبروتين');
    if (bmi >= 30) problems.push('السمنة - يحتاج عجز سعري منتظم');
    if (input.hasKidneyDisease) problems.push('مرض كلوي - يحتاج تقييد بروتين/بوتاسيوم/فوسفور حسب المرحلة');
    if (input.isVentilated) problems.push('مريض على جهاز تنفس - يحتاج تقليل الكربوهيدرات لتقليل CO2');
    if (input.onDialysis) problems.push('مريض غسيل كلوي - يحتاج بروتين عالي (1.2 غ/كلغ)');
    if (problems.length === 0) problems.push('لا توجد مشاكل غذائية حرجة');
    return problems;
  }

  private static identifyGoals(input: ClinicalEngineInput, diagnosis: string): string[] {
    const goals: string[] = ['تحقيق التوازن الغذائي', 'منع المزيد من التدهور الغذائي'];
    if (diagnosis.includes('Severe') || diagnosis.includes('سوء تغذية')) {
      goals.push('استعادة الوزن والكتلة العضلية');
    }
    if (diagnosis.includes('Obesity') || diagnosis.includes('سمنة')) {
      goals.push('فقدان الوزن التدريجي (0.5-1 كغم/أسبوع)');
    }
    if ((input.glucoseMgDl || 0) > 140 || input.hasDiabetes) {
      goals.push('السيطرة على سكر الدم (80-140 mg/dL)');
    }
    if (input.isVentilated) {
      goals.push('تقليل إنتاج CO2 من خلال خفض الكربوهيدرات إلى 40%');
    }
    if (input.onDialysis) {
      goals.push('تعويض البروتين المفقود خلال الغسيل الكلوي');
    }
    if (input.hasKidneyDisease && !input.onDialysis) {
      goals.push('إبطاء تقدم المرض الكلوي بتقييد البروتين');
    }
    return goals;
  }

  private static buildAssessment(
    input: ClinicalEngineInput,
    bmi: number,
    severity: Severity,
    diagnosis: string,
    risks: RiskAssessment,
  ): string {
    return [
      `مريض ${input.isMale ? 'ذكر' : 'أنثى'} عمر ${input.age} سنة.`,
      `التشخيص الغذائي: ${diagnosis}.`,
      `الشدة السريرية: ${severity}.`,
      `مؤشر كتلة الجسم: ${bmi.toFixed(1)}.`,
      `خطر إعادة التغذية: ${risks.refeeding.riskLevel} (${risks.refeeding.riskScore}/6).`,
      `خطر فرط السكر: ${risks.hyperglycemia.riskLevel}.`,
      `خطر هزال العضلات: ${risks.muscleWasting.riskLevel}.`,
    ].join(' ');
  }
}
