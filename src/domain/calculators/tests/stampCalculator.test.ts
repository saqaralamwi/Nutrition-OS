import { describe, it, expect } from 'vitest';
import { calculateStampScreening } from '../stampCalculator';
import type { StampInput } from '../stampCalculator';

describe('stampCalculator - Risk Level Determination', () => {
  it('totalScore 0 => low risk', () => {
    const input: StampInput = {
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 10,
      currentWeightKg: 10,
    };
    const result = calculateStampScreening(input);
    expect(result.totalScore).toBe(0);
    expect(result.riskLevel).toBe('low');
    expect(result.recommendedActions).toContain('Routine');
    expect(result.recommendedActionsAr).toContain('روتينية');
  });

  it('totalScore 1 => medium risk', () => {
    const input: StampInput = {
      medicalConditionRisk: 1,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 10,
      currentWeightKg: 9.5,
    };
    const result = calculateStampScreening(input);
    expect(result.totalScore).toBe(1);
    expect(result.riskLevel).toBe('medium');
    expect(result.recommendedActions).toContain('dietitian');
    expect(result.recommendedActionsAr).toContain('أخصائي');
  });

  it('totalScore 2 => medium risk', () => {
    const input: StampInput = {
      medicalConditionRisk: 1,
      nutritionalStatus: 1,
      weightLoss: 0,
      previousWeightKg: 10,
      currentWeightKg: 10,
    };
    const result = calculateStampScreening(input);
    expect(result.totalScore).toBe(2);
    expect(result.riskLevel).toBe('medium');
  });

  it('totalScore 3 => high risk', () => {
    const input: StampInput = {
      medicalConditionRisk: 1,
      nutritionalStatus: 1,
      weightLoss: 1,
      previousWeightKg: 10,
      currentWeightKg: 9,
    };
    const result = calculateStampScreening(input);
    expect(result.totalScore).toBe(3);
    expect(result.riskLevel).toBe('high');
    expect(result.recommendedActions).toContain('IMMEDIATE');
    expect(result.recommendedActionsAr).toContain('فوري');
  });

  it('totalScore 4 => high risk', () => {
    const input: StampInput = {
      medicalConditionRisk: 2,
      nutritionalStatus: 1,
      weightLoss: 1,
      previousWeightKg: 10,
      currentWeightKg: 8,
    };
    const result = calculateStampScreening(input);
    expect(result.totalScore).toBe(4);
    expect(result.riskLevel).toBe('high');
  });

  it('totalScore 6 => high risk (max)', () => {
    const input: StampInput = {
      medicalConditionRisk: 2,
      nutritionalStatus: 2,
      weightLoss: 2,
      previousWeightKg: 10,
      currentWeightKg: 7,
    };
    const result = calculateStampScreening(input);
    expect(result.totalScore).toBe(6);
    expect(result.riskLevel).toBe('high');
  });
});

describe('stampCalculator - Weight Loss %', () => {
  it('calculates 10% weight loss', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 1,
      previousWeightKg: 10,
      currentWeightKg: 9,
    });
    expect(result.weightLossPercent).toBe(10);
  });

  it('calculates 5% weight loss', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 100,
      currentWeightKg: 95,
    });
    expect(result.weightLossPercent).toBe(5);
  });

  it('returns null for weight gain (no loss)', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 10,
      currentWeightKg: 11,
    });
    expect(result.weightLossPercent).toBe(-10);
  });

  it('returns null when previousWeightKg is null', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: null,
      currentWeightKg: 10,
    });
    expect(result.weightLossPercent).toBeNull();
  });

  it('returns null when currentWeightKg is null', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 10,
      currentWeightKg: null,
    });
    expect(result.weightLossPercent).toBeNull();
  });

  it('returns null when previous <= 0', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 0,
      currentWeightKg: 5,
    });
    expect(result.weightLossPercent).toBeNull();
  });
});

describe('stampCalculator - Edge Cases', () => {
  it('handles zero previous weight safely', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 0,
      currentWeightKg: 5,
    });
    expect(result.riskLevel).toBe('low');
  });

  it('handles negative weight loss (weight gain)', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: 10,
      currentWeightKg: 12,
    });
    expect(result.weightLossPercent).toBe(-20);
  });

  it('handles all null weight fields', () => {
    const result = calculateStampScreening({
      medicalConditionRisk: 0,
      nutritionalStatus: 0,
      weightLoss: 0,
      previousWeightKg: null,
      currentWeightKg: null,
    });
    expect(result.weightLossPercent).toBeNull();
    expect(result.totalScore).toBe(0);
  });
});
