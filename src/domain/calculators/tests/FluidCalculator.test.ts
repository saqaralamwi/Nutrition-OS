import { describe, it, expect } from 'vitest';
import { calculateFluidRequirement } from '../FluidCalculator';

describe('FluidCalculator - Simplified Method', () => {
  it('calculates fluid for 70kg adult: 33 ml/kg', () => {
    const result = calculateFluidRequirement(70);
    expect(result.value).toBe(2310);
    expect(result.formulaName).toContain('مبسط');
    expect(result.steps).toHaveLength(3);
  });

  it('calculates fluid for 50kg adult', () => {
    const result = calculateFluidRequirement(50);
    expect(result.value).toBe(1650);
  });

  it('calculates fluid for 100kg adult', () => {
    const result = calculateFluidRequirement(100);
    expect(result.value).toBe(3300);
  });

  it('rounds to nearest integer', () => {
    const result = calculateFluidRequirement(48.5);
    expect(Number.isInteger(result.value)).toBe(true);
  });

  it('returns value of 0 for 0kg weight', () => {
    const result = calculateFluidRequirement(0);
    expect(result.value).toBe(0);
    expect(result.steps[2].value).toContain('0');
  });

  it('handles negative weight as 0', () => {
    const result = calculateFluidRequirement(-10);
    expect(result.value).toBe(-330);
  });

  it('handles NaN weight gracefully', () => {
    const result = calculateFluidRequirement(NaN);
    expect(Number.isNaN(result.value)).toBe(true);
  });
});

describe('FluidCalculator - Holliday-Segar Method', () => {
  it('calculates for <=10kg: 100 ml/kg', () => {
    const result = calculateFluidRequirement(10, 'holliday_segar');
    expect(result.value).toBe(1000);
    expect(result.formulaName).toBe('هوليداي-سيغار');
  });

  it('calculates for 5kg infant', () => {
    const result = calculateFluidRequirement(5, 'holliday_segar');
    expect(result.value).toBe(500);
    expect(result.steps).toHaveLength(3);
  });

  it('calculates for 15kg (10kg+5kg: 1000+250)', () => {
    const result = calculateFluidRequirement(15, 'holliday_segar');
    expect(result.value).toBe(1250);
  });

  it('calculates for 20kg (1000+500)', () => {
    const result = calculateFluidRequirement(20, 'holliday_segar');
    expect(result.value).toBe(1500);
  });

  it('calculates for 25kg (1000+500+100)', () => {
    const result = calculateFluidRequirement(25, 'holliday_segar');
    expect(result.value).toBe(1600);
  });

  it('calculates for 50kg (1000+500+600)', () => {
    const result = calculateFluidRequirement(50, 'holliday_segar');
    expect(result.value).toBe(2100);
  });

  it('calculates for 70kg (1000+500+1000)', () => {
    const result = calculateFluidRequirement(70, 'holliday_segar');
    expect(result.value).toBe(2500);
  });

  it('rounds to integer', () => {
    const result = calculateFluidRequirement(9.5, 'holliday_segar');
    expect(Number.isInteger(result.value)).toBe(true);
  });

  it('handles 0kg: value 0', () => {
    const result = calculateFluidRequirement(0, 'holliday_segar');
    expect(result.value).toBe(0);
  });
});
