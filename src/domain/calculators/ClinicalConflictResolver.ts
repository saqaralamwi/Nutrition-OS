import type { IConflictResolverInput, IConflictResolverOutput } from '../../data/types/conflict';

export class ClinicalConflictResolver {
  public static resolveComorbidConflicts(input: IConflictResolverInput): IConflictResolverOutput {
    const { activeConditions } = input;

    if (!activeConditions || activeConditions.length === 0) {
      return {
        governingConditionCode: '',
        resolvedFluidMl: 0,
        resolvedProteinGrams: 0,
        requiresMultidisciplinarySignOff: false,
        isSafe: false,
        arabicResolutionDirectives: ['لا توجد حالات نشطة للحسم؛ يرجى إدخال حالة مرضية واحدة على الأقل'],
      };
    }

    for (const c of activeConditions) {
      if (c.priorityScore < 0 || c.suggestedFluidMl < 0 || c.suggestedProteinGrams < 0) {
        return {
          governingConditionCode: '',
          resolvedFluidMl: 0,
          resolvedProteinGrams: 0,
          requiresMultidisciplinarySignOff: false,
          isSafe: false,
          arabicResolutionDirectives: ['قيم سالبة غير صالحة في بيانات الحالة المرضية؛ يرجى تصحيح المدخلات'],
        };
      }
    }

    const sorted = [...activeConditions].sort((a, b) => b.priorityScore - a.priorityScore);

    const primary = sorted[0];
    let resolvedFluidMl = ClinicalConflictResolver.round2(primary.suggestedFluidMl);
    let resolvedProteinGrams = ClinicalConflictResolver.round2(primary.suggestedProteinGrams);
    let requiresMultidisciplinarySignOff = false;

    for (let i = 1; i < sorted.length; i++) {
      const other = sorted[i];
      if (!other.isOverrideAllowed) {
        if (other.suggestedFluidMl < resolvedFluidMl) {
          requiresMultidisciplinarySignOff = true;
        }
        if (other.suggestedProteinGrams < resolvedProteinGrams) {
          requiresMultidisciplinarySignOff = true;
        }
      }
    }

    const directives: string[] = [];

    if (requiresMultidisciplinarySignOff) {
      directives.push(
        '🚨 تعارض سريري حاد ومثبت: تم تقديم أولوية الحفاظ على الحياة الفورية (مثل إنعاش السوائل للحروق الحادة) بناءً على مصفوفة الأوزان العليا، ولكن هذا يتجاوز الحدود القصوى الآمنة لعضو آخر مصاب (كالفشل الكلوي أو القلبي). يفرض النظام قفل الأمان ولا يسمح بتمرير الخطة إلا بتوقيع ثلاثي مشترك من أخصائي التغذية العلاجية، أخصائي الكلى، وطبيب العناية المركزة',
      );
    } else {
      directives.push(
        '✅ تجميع وتوافق سريري مستقر: تم دمج وحل قيود الخطة الغذائية للأمراض المصاحبة تلقائياً وفقاً لترتيب الأولويات الآمن للأعضاء الحيوية',
      );
    }

    return {
      governingConditionCode: primary.conditionCode,
      resolvedFluidMl,
      resolvedProteinGrams,
      requiresMultidisciplinarySignOff,
      isSafe: true,
      arabicResolutionDirectives: directives,
    };
  }

  private static round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
