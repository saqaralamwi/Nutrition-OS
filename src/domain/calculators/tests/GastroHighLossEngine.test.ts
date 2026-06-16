import { describe, it, expect } from 'vitest';
import { GastroHighLossEngine } from '../GastroHighLossEngine';

describe('GastroHighLossEngine.calculateLossReplacements', () => {
  it('1500 mL jejunal_ileal -> severe_crisis_loss, Na 195.00, K 16.50', () => {
    const result = GastroHighLossEngine.calculateLossReplacements({
      fistulaOutputMl24h: 1500,
      anatomicalSource: 'jejunal_ileal',
      patientWeightKg: 70,
    });

    expect(result.severityTier).toBe('severe_crisis_loss');
    expect(result.fluidReplacementMl).toBe(1500.00);
    expect(result.totalNaRequiredMeq).toBe(195.00);
    expect(result.totalKRequiredMeq).toBe(16.50);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.length).toBeGreaterThan(0);
    expect(result.arabicClinicalAlerts[0]).toContain('هيدروليكي حاد');
  });

  it('1000 mL colostomy -> high_output, Na 50.00, K 30.00, K+ alert', () => {
    const result = GastroHighLossEngine.calculateLossReplacements({
      fistulaOutputMl24h: 1000,
      anatomicalSource: 'colostomy',
      patientWeightKg: 65,
    });

    expect(result.severityTier).toBe('high_output');
    expect(result.fluidReplacementMl).toBe(1000.00);
    expect(result.totalNaRequiredMeq).toBe(50.00);
    expect(result.totalKRequiredMeq).toBe(30.00);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts.some((a) => a.includes('بوتاسيوم'))).toBe(true);
  });

  it('400 mL gastric -> normal_low, no crisis alerts', () => {
    const result = GastroHighLossEngine.calculateLossReplacements({
      fistulaOutputMl24h: 400,
      anatomicalSource: 'gastric',
      patientWeightKg: 60,
    });

    expect(result.severityTier).toBe('normal_low');
    expect(result.fluidReplacementMl).toBe(400.00);
    expect(result.totalNaRequiredMeq).toBe(24.00);
    expect(result.totalKRequiredMeq).toBe(4.00);
    expect(result.isSafe).toBe(true);
    expect(result.arabicClinicalAlerts).toHaveLength(0);
  });

  it('zero weight -> defensive fallback with isSafe false', () => {
    const result = GastroHighLossEngine.calculateLossReplacements({
      fistulaOutputMl24h: 1000,
      anatomicalSource: 'duodenal',
      patientWeightKg: 0,
    });

    expect(result.isSafe).toBe(false);
    expect(result.fluidReplacementMl).toBe(0);
    expect(result.totalNaRequiredMeq).toBe(0);
    expect(result.totalKRequiredMeq).toBe(0);
    expect(result.severityTier).toBe('normal_low');
  });
});
