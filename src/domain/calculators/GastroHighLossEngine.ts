import type { IGastroLossInput, IGastroLossOutput, AnatomicalSource } from '../../data/types/gastrointestinal';

export interface IGastroHighLossInput {
  baselineFluidRequirementMl: number;
  stomaOrFistulaOutputMl24h: number;
  lossType: 'jejunostomy' | 'ileostomy' | 'colostomy' | 'fistula';
}

export interface IGastroHighLossOutput {
  excessLossMl: number;
  totalFluidPrescriptionMl: number;
  isHighOutput: boolean;
  electrolyteRiskTier: 'high' | 'low';
  isCriticalDehydrationRisk: boolean;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
}

export class GastroHighLossEngine {
  private static readonly LOSS_PARAMS: Record<string, { normalDailyLoss: number; highOutputThreshold: number }> = {
    jejunostomy: { normalDailyLoss: 600, highOutputThreshold: 1000 },
    ileostomy: { normalDailyLoss: 500, highOutputThreshold: 1000 },
    colostomy: { normalDailyLoss: 200, highOutputThreshold: 500 },
    fistula: { normalDailyLoss: 0, highOutputThreshold: 500 },
  };

  public static calculateHighLossCompensation(input: IGastroHighLossInput): IGastroHighLossOutput {
    const { baselineFluidRequirementMl, stomaOrFistulaOutputMl24h, lossType } = input;

    if (baselineFluidRequirementMl <= 0 || stomaOrFistulaOutputMl24h < 0) {
      return {
        excessLossMl: 0,
        totalFluidPrescriptionMl: 0,
        isHighOutput: false,
        electrolyteRiskTier: 'low',
        isCriticalDehydrationRisk: false,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء التحقق من المدخلات؛ الاحتياج الأساسي للسوائل أو إخراج الفغر غير صالح'],
      };
    }

    const params = GastroHighLossEngine.LOSS_PARAMS[lossType];
    const excessLoss = GastroHighLossEngine.round2(
      Math.max(0, stomaOrFistulaOutputMl24h - params.normalDailyLoss),
    );
    const totalFluidPrescriptionMl = GastroHighLossEngine.round2(
      baselineFluidRequirementMl + excessLoss,
    );

    const isHighOutput = stomaOrFistulaOutputMl24h >= params.highOutputThreshold;
    const isCriticalDehydrationRisk = stomaOrFistulaOutputMl24h > 2000;
    const electrolyteRiskTier = isHighOutput ? 'high' : 'low';

    const alerts: string[] = [];

    if (isHighOutput) {
      if (lossType === 'jejunostomy' || lossType === 'ileostomy') {
        alerts.push(
          'خطر حرج: الفقد المتزايد للفغر المعوي الدقيق يتسبب في خسارة فادحة لعنصري الصوديوم والمغنيسيوم والمياه! يجب التوصية بمحلول إرواء فموي (ORS) عالي الصوديوم وتقييد السوائل منخفضة الأسمولية (الماء الصافي) لمنع زيادة الإخراج الأسموزي',
        );
      }
      if (lossType === 'fistula') {
        alerts.push(
          'تحذير: الناسور الهضمي النشط يتسبب في فقدان قاعدي حاد وصدمات الكتروليتية. مراقبة الفسفور والبيكربونات بشكل لثيق',
        );
      }
    }

    if (isCriticalDehydrationRisk) {
      alerts.push(
        `خطر جفاف شديد: إخراج الفغر يتجاوز 2000 مل/يوم (${stomaOrFistulaOutputMl24h} مل) - تدخل عاجل مطلوب`,
      );
    }

    alerts.push(
      `الفقد الزائد: ${excessLoss} مل/يوم`,
      `وصفة السوائل الكلية: ${totalFluidPrescriptionMl} مل/يوم`,
    );

    return {
      excessLossMl: excessLoss,
      totalFluidPrescriptionMl,
      isHighOutput,
      electrolyteRiskTier,
      isCriticalDehydrationRisk,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static readonly ANATOMICAL_ELECTROLYTES: Record<
    AnatomicalSource,
    { naPerLiter: number; kPerLiter: number }
  > = {
    gastric: { naPerLiter: 60, kPerLiter: 10 },
    duodenal: { naPerLiter: 140, kPerLiter: 5 },
    jejunal_ileal: { naPerLiter: 130, kPerLiter: 11 },
    colostomy: { naPerLiter: 50, kPerLiter: 30 },
  };

  public static calculateLossReplacements(input: IGastroLossInput): IGastroLossOutput {
    const { fistulaOutputMl24h, anatomicalSource, patientWeightKg } = input;

    if (fistulaOutputMl24h < 0 || patientWeightKg <= 0) {
      return {
        severityTier: 'normal_low',
        fluidReplacementMl: 0,
        totalNaRequiredMeq: 0,
        totalKRequiredMeq: 0,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء التحقق من المدخلات؛ حجم التدفق أو وزن المريض غير صالح'],
      };
    }

    const fluidReplacementMl = GastroHighLossEngine.round2(Math.max(0, fistulaOutputMl24h));

    let severityTier: IGastroLossOutput['severityTier'];
    if (fistulaOutputMl24h <= 500) {
      severityTier = 'normal_low';
    } else if (fistulaOutputMl24h <= 1200) {
      severityTier = 'high_output';
    } else {
      severityTier = 'severe_crisis_loss';
    }

    const coeff = GastroHighLossEngine.ANATOMICAL_ELECTROLYTES[anatomicalSource];
    const volumeLiters = fluidReplacementMl / 1000;
    const totalNaRequiredMeq = GastroHighLossEngine.round2(volumeLiters * coeff.naPerLiter);
    const totalKRequiredMeq = GastroHighLossEngine.round2(volumeLiters * coeff.kPerLiter);

    const alerts: string[] = [];

    if (severityTier === 'severe_crisis_loss') {
      alerts.push(
        '🚨 إنذار حرج (فقد هيدروليكي حاد): حجم تدفق الفتحة/الناسور يتجاوز 1200 مل/24 ساعة! خطر صدمة انخفاض الحجم (Hypovolemic Shock) والفشل الكلوي الحاد وشيك. يفرض تعويض السوائل وريدياً بنسبة 1:1 مضافاً إليها الأملاح النوعية المحسوبة فوراً',
      );
    }

    if (anatomicalSource === 'colostomy' && severityTier !== 'normal_low') {
      alerts.push(
        '⚠️ تنبيه فغر القولون: الفقد السفلي غني جداً بأيونات البوتاسيوم. تم رفع مستهدف البوتاسيوم التعويضي لمنع اضطرابات توازن كهربائية القلب (Arrhythmias)',
      );
    }

    return {
      severityTier,
      fluidReplacementMl,
      totalNaRequiredMeq,
      totalKRequiredMeq,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
