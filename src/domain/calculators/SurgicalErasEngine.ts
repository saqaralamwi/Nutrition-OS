import type { ISurgicalErasInput, ISurgicalErasOutput } from '../../data/types/surgical_life';

export class SurgicalErasEngine {
  public static evaluateErasProtocol(input: ISurgicalErasInput): ISurgicalErasOutput {
    const { surgeryScheduledAt: surgeryAt, lastSolidFoodIntakeAt: solidAt, lastClearFluidIntakeAt: fluidAt, isErasProtocolEnforced } = input;

    if (surgeryAt <= 0 || solidAt <= 0 || fluidAt <= 0 || solidAt > surgeryAt || fluidAt > surgeryAt) {
      return {
        solidFastingHours: 0,
        fluidFastingHours: 0,
        isPreOpSafe: false,
        clinicalAction: 'delay_surgery',
        recommendPreOpCarbLoading: false,
        carbSolutionPrescription: 'none',
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال تواريخ صحيحة للجراحة وآخر وجبة صلبة وسوائل شفافة'],
      };
    }

    const solidFastingHours = SurgicalErasEngine.round2((surgeryAt - solidAt) / 3600000);
    const fluidFastingHours = SurgicalErasEngine.round2((surgeryAt - fluidAt) / 3600000);

    const alerts: string[] = [];
    let isPreOpSafe = true;
    let clinicalAction: ISurgicalErasOutput['clinicalAction'] = 'advance_to_surgery';

    if (solidFastingHours < 6.0) {
      isPreOpSafe = false;
      clinicalAction = 'delay_surgery';
      alerts.push('🚨 خطر حرج: صيام الوجبات الصلبة غير كافٍ (أقل من 6 ساعات)! خطر حاد لحدوث ارتشاف رئوي اختناقي (Aspiration Pneumonia) أثناء إدخال الأنبوب الحنجري. يجب تأجيل الجراحة فوراً');
    }

    if (fluidFastingHours < 2.0) {
      isPreOpSafe = false;
      clinicalAction = 'delay_surgery';
      alerts.push('🚨 خطر حرج: صيام السوائل الشفافة غير كافٍ (أقل من ساعتين)! خطر حاد لارتجاع العصارة المعدية الحامضة للرئتين تحت التخدير العام. يجب تأجيل الجراحة');
    }

    if (isPreOpSafe) {
      if (solidFastingHours > 12.0 || fluidFastingHours > 6.0) {
        alerts.push('⚠️ تنبيه أيضي: الصيام الطويل المفرط يتسبب في تفعيل الهدم العضلي الحاد ومقاومة الإنسولين بعد الجراحة. يوصى ببدء التغذية المعوية الفورية بعد الإفاقة بـ 6 ساعات');
      }
    }

    let recommendPreOpCarbLoading = false;
    let carbSolutionPrescription = 'none';

    if (isErasProtocolEnforced && isPreOpSafe) {
      if (fluidFastingHours >= 2.0 && fluidFastingHours <= 4.0) {
        recommendPreOpCarbLoading = true;
        carbSolutionPrescription = '400mL of 12.5% clear carbohydrate solution exactly 2 hours before anesthesia induction';
        alerts.push('يوصى بتحميل كربوهيدراتي قبل الجراحة: 400 مل من محلول كربوهيدرات شفاف 12.5% قبل ساعتين من التخدير');
      }
    }

    return {
      solidFastingHours,
      fluidFastingHours,
      isPreOpSafe,
      clinicalAction,
      recommendPreOpCarbLoading,
      carbSolutionPrescription,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
