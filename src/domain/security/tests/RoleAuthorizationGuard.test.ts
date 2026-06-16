import { describe, it, expect } from 'vitest';
import { RoleAuthorizationGuard } from '../RoleAuthorizationGuard';

describe('RoleAuthorizationGuard', () => {
  it('nutritionist NCP_OVERRIDE with 20-char justification is authorized', () => {
    const result = RoleAuthorizationGuard.authorizeAction({
      actorRole: 'nutritionist',
      actionType: 'NCP_OVERRIDE',
      clinicalJustification: 'تعديل السعرات الحرارية بسبب نقص الوزن الحاد',
      isOverrideRequested: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.failureReason).toBe('none');
    expect(result.requiresSecurityEscalation).toBe(false);
  });

  it('pharmacist NCP_OVERRIDE is blocked with unauthorized_role', () => {
    const result = RoleAuthorizationGuard.authorizeAction({
      actorRole: 'pharmacist',
      actionType: 'NCP_OVERRIDE',
      clinicalJustification: 'تبرير طويل كاف لتجاوز الحد الأدنى',
      isOverrideRequested: true,
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.failureReason).toBe('unauthorized_role');
    expect(result.requiresSecurityEscalation).toBe(false);
  });

  it('override with short justification (10 chars) is rejected', () => {
    const result = RoleAuthorizationGuard.authorizeAction({
      actorRole: 'nutritionist',
      actionType: 'NCP_OVERRIDE',
      clinicalJustification: 'تم التعديل',
      isOverrideRequested: true,
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.failureReason).toBe('insufficient_justification');
    expect(result.arabicSecurityDirectives[0]).toContain('15 حرفاً');
  });

  it('pharmacist SYSTEM_SCHEMA_MUTATION triggers security escalation', () => {
    const result = RoleAuthorizationGuard.authorizeAction({
      actorRole: 'pharmacist',
      actionType: 'SYSTEM_SCHEMA_MUTATION',
      clinicalJustification: 'محاولة غير مصرح بها',
      isOverrideRequested: false,
    });

    expect(result.isAuthorized).toBe(false);
    expect(result.failureReason).toBe('unauthorized_role');
    expect(result.requiresSecurityEscalation).toBe(true);
  });
});
