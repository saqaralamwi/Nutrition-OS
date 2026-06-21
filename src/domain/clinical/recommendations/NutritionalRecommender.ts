import type { BmiCategory } from '../../utils/bmiClassification';
import type { ICardiovascularAssessment } from '../../../data/types/cardiovascular';

export interface RecommenderInput {
  bmiCategory: BmiCategory;
  bmi: number;
  cardioAssessment?: ICardiovascularAssessment | null;
}

export interface RecommenderOutput {
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  alertMessage?: string;
}

function hasCardioRisk(assessment?: ICardiovascularAssessment | null): boolean {
  if (!assessment) return false;
  if (assessment.systolicBloodPressure >= 140) return true;
  if (assessment.diastolicBloodPressure >= 90) return true;
  if (assessment.ldlCholesterol >= 160) return true;
  if (assessment.totalCholesterol >= 240) return true;
  if (assessment.hdlCholesterol < 40) return true;
  if (assessment.hasPeripheralEdema) return true;
  return false;
}

export function getRecommendation(input: RecommenderInput): RecommenderOutput {
  const { bmiCategory, cardioAssessment } = input;
  const cardioRisk = hasCardioRisk(cardioAssessment);

  const isSevereUnderweight =
    bmiCategory === 'نقص حاد في الوزن' || bmiCategory === 'نقص متوسط في الوزن';

  const isMildUnderweight = bmiCategory === 'نقص خفيف في الوزن';

  const isObese =
    bmiCategory === 'سمنة (الدرجة الأولى)' ||
    bmiCategory === 'سمنة (الدرجة الثانية)' ||
    bmiCategory === 'سمنة (الدرجة الثالثة - مفرطة)';

  const isOverweight = bmiCategory === 'زيادة الوزن (مرحلة ما قبل السمنة)';

  const isNormal = bmiCategory === 'الوزن الطبيعي (المثالي)';

  if (isSevereUnderweight) {
    return {
      recommendation: 'بروتوكول زيادة الوزن العاجل — إحالة فورية لأخصائي التغذية العلاجية',
      priority: 'high',
      alertMessage: 'نقص حاد/متوسط في الوزن — يحتاج تدخلاً فورياً',
    };
  }

  if (isMildUnderweight) {
    return {
      recommendation: 'بروتوكول تعزيز الوزن — متابعة أسبوعية مع قياس الوزن',
      priority: 'medium',
    };
  }

  if (isObese) {
    const base = 'بروتوكول التصحيح الأيضي — عجز سعري منتظم (500-1000 سعرة/يوم)';
    const dash = cardioRisk ? ' + حمية DASH الصحية للقلب' : '';
    const alert =
      cardioRisk
        ? 'تنبيه: أولوية قصوى لضبط الوزن (أسباب قلبية)'
        : undefined;
    return {
      recommendation: base + dash,
      priority: cardioRisk ? 'critical' : 'high',
      alertMessage: alert,
    };
  }

  if (isOverweight) {
    const base = 'بروتوكول الوقاية الأيضية — تقليل السعرات مع زيادة النشاط البدني';
    return {
      recommendation: base,
      priority: 'medium',
    };
  }

  if (isNormal) {
    return {
      recommendation: 'بروتوكول الصيانة — تحسين المغذيات الدقيقة والمتابعة الدورية',
      priority: 'low',
    };
  }

  return {
    recommendation: 'استشارة تغذوية عامة — متابعة الحالة',
    priority: 'low',
  };
}
