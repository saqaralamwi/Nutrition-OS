export type StampComponentScore = 0 | 1 | 2;
export type StampRiskLevel = 'low' | 'medium' | 'high';

export interface StampInput {
  medicalConditionRisk: StampComponentScore;
  nutritionalStatus: StampComponentScore;
  weightLoss: StampComponentScore;
  previousWeightKg: number | null;
  currentWeightKg: number | null;
  medicalConditionNote?: string | null;
  nutritionalStatusNote?: string | null;
}

export interface StampResult {
  totalScore: number;
  riskLevel: StampRiskLevel;
  weightLossPercent: number | null;
  recommendedActions: string;
  recommendedActionsAr: string;
}

export function calculateStampScreening(input: StampInput): StampResult {
  const totalScore = input.medicalConditionRisk + input.nutritionalStatus + input.weightLoss;
  const riskLevel = determineRiskLevel(totalScore);
  const weightLossPercent = calculateWeightLossPercent(input.previousWeightKg, input.currentWeightKg);
  const { recommendedActions, recommendedActionsAr } = getRecommendedActions(riskLevel);

  return {
    totalScore,
    riskLevel,
    weightLossPercent,
    recommendedActions,
    recommendedActionsAr,
  };
}

function determineRiskLevel(totalScore: number): StampRiskLevel {
  if (totalScore === 0) return 'low';
  if (totalScore <= 2) return 'medium';
  return 'high';
}

function calculateWeightLossPercent(
  previousWeightKg: number | null,
  currentWeightKg: number | null
): number | null {
  if (!previousWeightKg || !currentWeightKg || previousWeightKg <= 0) return null;
  const loss = ((previousWeightKg - currentWeightKg) / previousWeightKg) * 100;
  return Math.round(loss * 10) / 10;
}

function getRecommendedActions(riskLevel: StampRiskLevel): {
  recommendedActions: string;
  recommendedActionsAr: string;
} {
  switch (riskLevel) {
    case 'low':
      return {
        recommendedActions:
          'Routine nutrition care. Standard pediatric diet. Re-screen periodically (e.g., weekly). No immediate dietitian referral needed.',
        recommendedActionsAr:
          'رعاية تغذوية روتينية. نظام غذائي عادي للطفل. إعادة الفحص دورياً (مثلاً كل أسبوع). لا حاجة لإحالة فورية لأخصائي التغذية.',
      };
    case 'medium':
      return {
        recommendedActions:
          'Nutrition assessment by registered dietitian. Monitor intake closely. Consider nutritional supplements if intake inadequate. Re-screen every 2-3 days. Document eating patterns.',
        recommendedActionsAr:
          'تقييم تغذوي من أخصائي تغذية معتمد. مراقبة المدخول بدقة. النظر في المكملات الغذائية إذا كان المدخول غير كافٍ. إعادة الفحص كل 2-3 أيام. توثيق أنماط الأكل.',
      };
    case 'high':
      return {
        recommendedActions:
          'IMMEDIATE nutrition intervention. Comprehensive nutrition assessment. Consider enteral or parenteral nutrition if oral intake insufficient. Daily monitoring of intake and weight. Multidisciplinary team involvement. Parent/caregiver education.',
        recommendedActionsAr:
          'تدخل تغذوي فوري. تقييم تغذوي شامل. النظر في التغذية الأنبوبية أو الوريدية إذا كان المدخول الفموي غير كافٍ. مراقبة يومية للمدخول والوزن. مشاركة فريق متعدد التخصصات. تثقيف الوالدين.',
      };
  }
}
