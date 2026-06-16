export type ActorRole = 'nutritionist' | 'pharmacist' | 'systems_consultant';
export type ActionType = 'NCP_OVERRIDE' | 'MEDICATION_BYPASS' | 'SYSTEM_SCHEMA_MUTATION';
export type FailureReason = 'unauthorized_role' | 'insufficient_justification' | 'none';

export interface IRbacInput {
  actorRole: ActorRole;
  actionType: ActionType;
  clinicalJustification: string;
  isOverrideRequested: boolean;
}

export interface IRbacOutput {
  isAuthorized: boolean;
  failureReason: FailureReason;
  requiresSecurityEscalation: boolean;
  arabicSecurityDirectives: string[];
}

export class RoleAuthorizationGuard {
  private static readonly MIN_JUSTIFICATION_LENGTH = 15;

  public static authorizeAction(input: IRbacInput): IRbacOutput {
    const { actorRole, actionType, clinicalJustification, isOverrideRequested } = input;

    if (!actorRole || !actionType || clinicalJustification == null || isOverrideRequested == null) {
      return {
        isAuthorized: false,
        failureReason: 'unauthorized_role',
        requiresSecurityEscalation: false,
        arabicSecurityDirectives: ['خطأ في النظام: مدخلات التحقق من الصلاحية غير صالحة أو تالفة'],
      };
    }

    const directives: string[] = [];

    const roleCheck = RoleAuthorizationGuard.checkRolePermission(actorRole, actionType);
    if (!roleCheck.allowed) {
      const requiresSecurityEscalation = actionType === 'SYSTEM_SCHEMA_MUTATION';
      return {
        isAuthorized: false,
        failureReason: 'unauthorized_role',
        requiresSecurityEscalation,
        arabicSecurityDirectives: [roleCheck.message],
      };
    }

    if (isOverrideRequested) {
      const trimmed = clinicalJustification.trim();
      if (trimmed.length < RoleAuthorizationGuard.MIN_JUSTIFICATION_LENGTH) {
        return {
          isAuthorized: false,
          failureReason: 'insufficient_justification',
          requiresSecurityEscalation: false,
          arabicSecurityDirectives: [
            'التجاوز مرفوض: يجب كتابة تبرير سريري واضح ومفصل باللغة العربية لا يقل عن 15 حرفاً لتبرير هذا التعديل الحرج في ملف المريض',
          ],
        };
      }
      directives.push('تم منح الإذن للتجاوز مع التبرير السريري المقدم');
    }

    directives.push(`تم التحقق من الصلاحية: ${actorRole} مصرح له بتنفيذ ${actionType}`);

    return {
      isAuthorized: true,
      failureReason: 'none',
      requiresSecurityEscalation: false,
      arabicSecurityDirectives: directives,
    };
  }

  private static checkRolePermission(
    role: ActorRole,
    action: ActionType,
  ): { allowed: boolean; message: string } {
    switch (action) {
      case 'NCP_OVERRIDE':
        if (role === 'pharmacist') {
          return {
            allowed: false,
            message: 'خطأ في الصلاحية: لا يملك الصيدلاني صلاحية تجاوز أو تعديل مسارات الرعاية التغذوية (NCP Overrides)',
          };
        }
        return { allowed: true, message: '' };

      case 'MEDICATION_BYPASS':
        if (role === 'nutritionist') {
          return {
            allowed: false,
            message: 'خطأ في الصلاحية: لا يملك أخصائي التغذية صلاحية تجاوز قيود أو تدخلات الأدوية المخبرية الحركية',
          };
        }
        return { allowed: true, message: '' };

      case 'SYSTEM_SCHEMA_MUTATION':
        if (role !== 'systems_consultant') {
          return {
            allowed: false,
            message: `خرق أمني: دور "${role}" لا يملك صلاحية تعديل بنية النظام الأساسية. فقط مستشار النظم (systems_consultant) مصرح له بذلك`,
          };
        }
        return { allowed: true, message: '' };
    }
  }
}
