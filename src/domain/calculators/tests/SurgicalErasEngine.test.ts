import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SurgicalErasEngine } from '../SurgicalErasEngine';

const HOUR = 3600000;
const MOCK_NOW = 1700000000000; // Fixed reference timestamp

describe('SurgicalErasEngine', () => {
  beforeEach(() => {
    vi.setSystemTime(MOCK_NOW);
  });

  it('compliant fasting: 8h solids, 3h fluids, ERAS active → pre-op safe + carb loading', () => {
    const now = Date.now();
    const surgeryAt = now + HOUR * 8;
    const solidAt = now;
    const fluidAt = now + HOUR * 5;

    const result = SurgicalErasEngine.evaluateErasProtocol({
      surgeryScheduledAt: surgeryAt,
      lastSolidFoodIntakeAt: solidAt,
      lastClearFluidIntakeAt: fluidAt,
      isErasProtocolEnforced: true,
    });

    expect(result.isPreOpSafe).toBe(true);
    expect(result.clinicalAction).toBe('advance_to_surgery');
    expect(result.recommendPreOpCarbLoading).toBe(true);
    expect(result.carbSolutionPrescription).toContain('400mL');
    expect(result.isSafe).toBe(true);
  });

  it('solid fasting violation: 4h solids, 3h fluids → delay_surgery', () => {
    const now = Date.now();
    const surgeryAt = now + HOUR * 4;
    const solidAt = now;
    const fluidAt = now + HOUR * 1;

    const result = SurgicalErasEngine.evaluateErasProtocol({
      surgeryScheduledAt: surgeryAt,
      lastSolidFoodIntakeAt: solidAt,
      lastClearFluidIntakeAt: fluidAt,
      isErasProtocolEnforced: false,
    });

    expect(result.isPreOpSafe).toBe(false);
    expect(result.clinicalAction).toBe('delay_surgery');
    expect(result.solidFastingHours).toBeLessThan(6);
    expect(result.arabicClinicalAlerts.some(a => a.includes('ارتشاف رئوي'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('fluid fasting violation: 8h solids, 1.5h fluids → delay_surgery', () => {
    const now = Date.now();
    const surgeryAt = now + HOUR * 8;
    const solidAt = now;
    const fluidAt = now + HOUR * 6.5;

    const result = SurgicalErasEngine.evaluateErasProtocol({
      surgeryScheduledAt: surgeryAt,
      lastSolidFoodIntakeAt: solidAt,
      lastClearFluidIntakeAt: fluidAt,
      isErasProtocolEnforced: true,
    });

    expect(result.isPreOpSafe).toBe(false);
    expect(result.clinicalAction).toBe('delay_surgery');
    expect(result.fluidFastingHours).toBeLessThan(2);
    expect(result.arabicClinicalAlerts.some(a => a.includes('ارتجاع العصارة'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });

  it('inverted timestamps: solidAt > surgeryAt returns safe fallback', () => {
    const now = Date.now();
    const result = SurgicalErasEngine.evaluateErasProtocol({
      surgeryScheduledAt: now,
      lastSolidFoodIntakeAt: now + HOUR * 10,
      lastClearFluidIntakeAt: now + HOUR * 10,
      isErasProtocolEnforced: true,
    });

    expect(result.isSafe).toBe(false);
    expect(result.isPreOpSafe).toBe(false);
    expect(result.clinicalAction).toBe('delay_surgery');
    expect(result.solidFastingHours).toBe(0);
    expect(result.fluidFastingHours).toBe(0);
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال تواريخ صحيحة للجراحة وآخر وجبة صلبة وسوائل شفافة');
  });

  it('prolonged fasting audit: 14h solids triggers catabolic warning', () => {
    const now = Date.now();
    const surgeryAt = now + HOUR * 14;
    const solidAt = now;
    const fluidAt = now + HOUR * 10;

    const result = SurgicalErasEngine.evaluateErasProtocol({
      surgeryScheduledAt: surgeryAt,
      lastSolidFoodIntakeAt: solidAt,
      lastClearFluidIntakeAt: fluidAt,
      isErasProtocolEnforced: false,
    });

    expect(result.isPreOpSafe).toBe(true);
    expect(result.arabicClinicalAlerts.some(a => a.includes('الهدم العضلي'))).toBe(true);
    expect(result.isSafe).toBe(true);
  });
});
