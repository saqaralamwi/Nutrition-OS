import { describe, test, expect } from 'vitest';
import { GestationalMetabolicTracker } from '../GestationalMetabolicTracker';

describe('GestationalMetabolicTracker', () => {
  test('morning ketones trigger danger status and immediate carb adjustment', () => {
    const result = GestationalMetabolicTracker.evaluatePregnancyMetabolism({
      fastingBloodGlucose: 90,
      twoHourPostPrandial: 115,
      hba1c: 5.4,
      morningUrineKetonesPresent: true,
    });

    expect(result.ketosisStatus).toBe('danger');
    expect(result.requiresImmediateCarbAdjustment).toBe(true);
    expect(result.glycemicControlRating).toBe('critical');
    expect(result.clinicalAlerts).toHaveLength(1);
    expect(result.clinicalAlerts[0]).toContain('كيتونية');
  });

  test('perfect metrics return excellent control with no alerts', () => {
    const result = GestationalMetabolicTracker.evaluatePregnancyMetabolism({
      fastingBloodGlucose: 90,
      twoHourPostPrandial: 115,
      hba1c: 5.4,
      morningUrineKetonesPresent: false,
    });

    expect(result.ketosisStatus).toBe('safe');
    expect(result.isFastingTargetAchieved).toBe(true);
    expect(result.isPostPrandialTargetAchieved).toBe(true);
    expect(result.glycemicControlRating).toBe('excellent');
    expect(result.requiresImmediateCarbAdjustment).toBe(false);
    expect(result.clinicalAlerts).toHaveLength(0);
  });

  test('fasting glucose of 98 drops target achievement flag to false', () => {
    const result = GestationalMetabolicTracker.evaluatePregnancyMetabolism({
      fastingBloodGlucose: 98,
      twoHourPostPrandial: 115,
      hba1c: 5.4,
      morningUrineKetonesPresent: false,
    });

    expect(result.isFastingTargetAchieved).toBe(false);
    expect(result.isPostPrandialTargetAchieved).toBe(true);
    expect(result.glycemicControlRating).toBe('suboptimal');
    expect(result.clinicalAlerts.length).toBeGreaterThanOrEqual(1);
    expect(result.clinicalAlerts[0]).toContain('سكر الصيام');
  });
});
