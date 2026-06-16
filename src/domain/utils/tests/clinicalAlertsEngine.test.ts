import { describe, test, expect } from 'vitest';
import { checkOverfeedingRisk } from '../../../utils/clinicalAlertsEngine';

describe('Clinical Alerts Engine - Overfeeding Risk', () => {
  test('checkOverfeedingRisk - no overfeeding', () => {
    const requirements = {
      calories: 2000,
      hiddenCalories: { total: 0 }
    };
    const alert = checkOverfeedingRisk(requirements, 1800, 0);
    expect(alert).toBeNull();
  });

  test('checkOverfeedingRisk - overfeeding detected (>10%)', () => {
    const requirements = {
      calories: 2000,
      hiddenCalories: {
        total: 500,
        propofol: 500,
        dextrose: 0,
        midol: 0,
        lipids: 0
      }
    };
    // actual calories = 1800 (enteral) + 500 (hidden) = 2300.
    // target = 2000. excess = (2300-2000)/2000 = 15% > 10%.
    const alert = checkOverfeedingRisk(requirements, 1800, 0);
    expect(alert).not.toBeNull();
    expect(alert?.category).toBe('overfeeding');
    expect(alert?.type).toBe('danger');
    expect(alert?.title).toBe('🚨 خطر فرط التغذية (Overfeeding Risk)');
    expect(alert?.message).toContain('• البروفوفول: 500 سعرة/يوم');
    expect(alert?.action).toContain('السعرات الصافية المطلوبة: 1500');
  });

  test('checkOverfeedingRisk - overfeeding within bounds (<10%)', () => {
    const requirements = {
      calories: 2000,
      hiddenCalories: {
        total: 100,
        propofol: 100,
        dextrose: 0
      }
    };
    // actual calories = 2000 (enteral) + 100 (hidden) = 2100.
    // target = 2000. excess = 5% < 10%.
    const alert = checkOverfeedingRisk(requirements, 2000, 0);
    expect(alert).toBeNull();
  });
});
