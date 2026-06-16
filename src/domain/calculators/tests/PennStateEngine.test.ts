import { describe, it, expect } from 'vitest';
import { PennStateEngine } from '../PennStateEngine';

describe('PennStateEngine', () => {
  it('non-obese patient: Mifflin=1500, VE=8.5, Temp=38.5 -> Penn State 2003b', () => {
    const result = PennStateEngine.calculatePennState({
      mifflinRee: 1500,
      minuteVentilationLMin: 8.5,
      maxTemperatureCelsius: 38.5,
      isObese: false,
    });

    expect(result.rmrValue).toBe(1921.00);
    expect(result.equationUsed).toBe('Penn_State_2003b');
    expect(result.isSafe).toBe(true);
  });

  it('obese patient: Mifflin=1800, VE=10.0, Temp=39.0 -> Penn State 2010', () => {
    const result = PennStateEngine.calculatePennState({
      mifflinRee: 1800,
      minuteVentilationLMin: 10.0,
      maxTemperatureCelsius: 39.0,
      isObese: true,
    });

    expect(result.rmrValue).toBe(2148.00);
    expect(result.equationUsed).toBe('Penn_State_2010');
    expect(result.isSafe).toBe(true);
  });

  it('unrealistic temperature (25°C) returns safe fallback', () => {
    const result = PennStateEngine.calculatePennState({
      mifflinRee: 1500,
      minuteVentilationLMin: 8.5,
      maxTemperatureCelsius: 25,
      isObese: false,
    });

    expect(result.rmrValue).toBe(0);
    expect(result.isSafe).toBe(false);
    expect(result.clinicalAlerts[0]).toContain('خارج النطاق السريري الآمن');
  });
});
