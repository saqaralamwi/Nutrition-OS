import { describe, it, expect } from 'vitest';
import { CardiovascularEarlyWarningSystem } from '../CardiovascularEarlyWarningSystem';

describe('CardiovascularEarlyWarningSystem', () => {
  it('hypertensive crisis (SBP=185) triggers EMERGENCY_RED with restrictFluidMl=800', () => {
    const result = CardiovascularEarlyWarningSystem.evaluateWarningStatus({
      systolicBloodPressure: 185,
      diastolicBloodPressure: 95,
      weightDelta24hKg: 0.3,
      edemaGrading: 'none',
      hasDyspneaAtRest: false,
      hasOrthopnea: false,
    });

    expect(result.warningStatus).toBe('EMERGENCY_RED');
    expect(result.isEmergencyAlert).toBe(true);
    expect(result.restrictFluidMl).toBe(800);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBe(2);
  });

  it('dyspnea + 1.2kg weight gain triggers EMERGENCY_RED', () => {
    const result = CardiovascularEarlyWarningSystem.evaluateWarningStatus({
      systolicBloodPressure: 135,
      diastolicBloodPressure: 85,
      weightDelta24hKg: 1.2,
      edemaGrading: '2+',
      hasDyspneaAtRest: true,
      hasOrthopnea: false,
    });

    expect(result.warningStatus).toBe('EMERGENCY_RED');
    expect(result.isEmergencyAlert).toBe(true);
    expect(result.restrictFluidMl).toBe(800);
    expect(result.arabicClinicalAlerts.some(a => a.includes('إنذار أحمر'))).toBe(true);
  });

  it('stage 2 hypertension without distress triggers WARNING_YELLOW with 1200mL', () => {
    const result = CardiovascularEarlyWarningSystem.evaluateWarningStatus({
      systolicBloodPressure: 145,
      diastolicBloodPressure: 92,
      weightDelta24hKg: 0.2,
      edemaGrading: 'none',
      hasDyspneaAtRest: false,
      hasOrthopnea: false,
    });

    expect(result.warningStatus).toBe('WARNING_YELLOW');
    expect(result.isEmergencyAlert).toBe(true);
    expect(result.restrictFluidMl).toBe(1200);
    expect(result.isSafe).toBe(true);
  });

  it('zero BP input returns safe fallback', () => {
    const result = CardiovascularEarlyWarningSystem.evaluateWarningStatus({
      systolicBloodPressure: 0,
      diastolicBloodPressure: 80,
      weightDelta24hKg: 0,
      edemaGrading: 'none',
      hasDyspneaAtRest: false,
      hasOrthopnea: false,
    });

    expect(result.isSafe).toBe(false);
    expect(result.warningStatus).toBe('STABLE_GREEN');
    expect(result.isEmergencyAlert).toBe(false);
    expect(result.restrictFluidMl).toBe(0);
    expect(result.arabicClinicalAlerts).toContain('الرجاء إدخال قيم ضغط دم صحيحة');
  });

  it('stable patient returns STABLE_GREEN', () => {
    const result = CardiovascularEarlyWarningSystem.evaluateWarningStatus({
      systolicBloodPressure: 118,
      diastolicBloodPressure: 75,
      weightDelta24hKg: 0.1,
      edemaGrading: 'none',
      hasDyspneaAtRest: false,
      hasOrthopnea: false,
    });

    expect(result.warningStatus).toBe('STABLE_GREEN');
    expect(result.isEmergencyAlert).toBe(false);
    expect(result.restrictFluidMl).toBe(0);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts).toEqual([]);
  });
});
