export interface IMalnutritionInput {
  ageMonths: number;
  wfhZScore: number;
  muacCm: number | null;
  bilateralPittingEdema: boolean;
}

export interface IMalnutritionOutput {
  status: 'SAM' | 'MAM' | 'normal';
  riskTier: 'critical' | 'moderate' | 'low';
  recommendedRoute: 'stabilization_or_ot_program' | 'supplementary_feeding_program' | 'routine_monitoring';
  diagnosticReasons: string[];
}

export class MalnutritionClassifier {
  public static classifyAcuteMalnutrition(input: IMalnutritionInput): IMalnutritionOutput {
    const reasons: string[] = [];

    if (input.bilateralPittingEdema) {
      reasons.push('الحالة تعاني من وذمة غذائية ثنائية الجانب - تصنيف تلقائي كحالة سوء تغذية حاد وخيم');
      return {
        status: 'SAM',
        riskTier: 'critical',
        recommendedRoute: 'stabilization_or_ot_program',
        diagnosticReasons: reasons,
      };
    }

    if (input.wfhZScore < -3) {
      reasons.push(`مؤشر Z للوزن مقابل الطول أقل من -3 (${input.wfhZScore.toFixed(2)}) - يشير إلى سوء تغذية حاد وخيم`);
      return {
        status: 'SAM',
        riskTier: 'critical',
        recommendedRoute: 'stabilization_or_ot_program',
        diagnosticReasons: reasons,
      };
    }

    if (input.ageMonths >= 6 && input.muacCm !== null && input.muacCm < 11.5) {
      reasons.push(`محيط منتصف الذراع (MUAC) أقل من 11.5 سم (${input.muacCm.toFixed(1)} سم) - تصنيف سوء تغذية حاد وخيم`);
      return {
        status: 'SAM',
        riskTier: 'critical',
        recommendedRoute: 'stabilization_or_ot_program',
        diagnosticReasons: reasons,
      };
    }

    if (input.wfhZScore >= -3 && input.wfhZScore < -2) {
      reasons.push(`مؤشر Z للوزن مقابل الطول بين -3 و -2 (${input.wfhZScore.toFixed(2)}) - يشير إلى سوء تغذية معتدل`);
      return {
        status: 'MAM',
        riskTier: 'moderate',
        recommendedRoute: 'supplementary_feeding_program',
        diagnosticReasons: reasons,
      };
    }

    if (input.ageMonths >= 6 && input.muacCm !== null && input.muacCm >= 11.5 && input.muacCm < 12.5) {
      reasons.push(`محيط منتصف الذراع (MUAC) بين 11.5 و 12.5 سم (${input.muacCm.toFixed(1)} سم) - تصنيف سوء تغذية معتدل`);
      return {
        status: 'MAM',
        riskTier: 'moderate',
        recommendedRoute: 'supplementary_feeding_program',
        diagnosticReasons: reasons,
      };
    }

    return {
      status: 'normal',
      riskTier: 'low',
      recommendedRoute: 'routine_monitoring',
      diagnosticReasons: ['المؤشرات الأنثروبومترية ضمن الحدود الطبيعية - لا توجد علامات سوء تغذية حاد أو معتدل'],
    };
  }
}
