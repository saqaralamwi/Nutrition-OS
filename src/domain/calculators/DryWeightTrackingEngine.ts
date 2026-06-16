import type { IDryWeightInput, IDryWeightOutput } from '../../data/types/cardiovascular';

export class DryWeightTrackingEngine {
  public static evaluateFluidRetention(input: IDryWeightInput): IDryWeightOutput {
    const { measuredDryWeightKg: dryWt, currentMorningWeightKg: curWt, previousWeight24hAgoKg: prevWt, edemaGrading } = input;

    if (!dryWt || dryWt <= 0 || !curWt || curWt <= 0 || !prevWt || prevWt <= 0 || isNaN(dryWt) || isNaN(curWt) || isNaN(prevWt)) {
      return {
        netFluidGainKg: 0,
        estimatedRetainedFluidMl: 0,
        weightDelta24hKg: 0,
        congestionRiskTier: 'low',
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال قيم وزن صحيحة للمريض'],
      };
    }

    const netFluidGainKg = DryWeightTrackingEngine.round2(Math.max(0, curWt - dryWt));
    const estimatedRetainedFluidMl = DryWeightTrackingEngine.round2(netFluidGainKg * 1000);
    const weightDelta24hKg = DryWeightTrackingEngine.round2(curWt - prevWt);

    const congestionRiskTier = DryWeightTrackingEngine.determineRisk(weightDelta24hKg, edemaGrading, netFluidGainKg);

    const alerts: string[] = [];

    if (congestionRiskTier === 'critical') {
      alerts.push('🚨 إنذار حرج: رصد زيادة وزنية حادة ومفاجئة خلال 24 ساعة تفوق الحدود الآمنة! خطر وذمة رئوية حادة وفشل قلب احتقاني وشيك. يوصى بالتدخل الفوري بالمدرات البولية الوريدية وتقييد السوائل الصارم لأقل من 1000 مل');
    } else if (congestionRiskTier === 'moderate') {
      alerts.push('⚠️ تحذير: احتباس سوائل متزايد وتورم طرفي ملحوظ. يجب خفض الصوديوم الغذائي لأقل من 1500 ملغ ومراجعة كفاءة الضخ القلبي');
    }

    return {
      netFluidGainKg,
      estimatedRetainedFluidMl,
      weightDelta24hKg,
      congestionRiskTier,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static determineRisk(
    weightDelta24hKg: number,
    edemaGrading: IDryWeightInput['edemaGrading'],
    netFluidGainKg: number,
  ): IDryWeightOutput['congestionRiskTier'] {
    if (weightDelta24hKg >= 1.0 || edemaGrading === '3+' || edemaGrading === '4+') {
      return 'critical';
    }
    if (
      (weightDelta24hKg >= 0.5 && weightDelta24hKg < 1.0) ||
      edemaGrading === '1+' ||
      edemaGrading === '2+' ||
      netFluidGainKg > 2.0
    ) {
      return 'moderate';
    }
    return 'low';
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
