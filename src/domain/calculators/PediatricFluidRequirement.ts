export interface PediatricFluidInput {
  weightKg: number;
  ageInMonths: number;
  hasDehydration: boolean;
  isOnIVFluids: boolean;
}

export interface PediatricFluidOutput {
  dailyFluidMl: number;
  mlPerKg: number;
  isSafe: boolean;
  source: string;
}

export class PediatricFluidRequirement {
  private static readonly HOLLIDAY_SEGAR = [
    { minKg: 0, maxKg: 10, factor: 100 },
    { minKg: 10, maxKg: 20, factor: 50 },
    { minKg: 20, maxKg: Infinity, factor: 20 },
  ];

  public static calculate(input: PediatricFluidInput): PediatricFluidOutput {
    const { weightKg, ageInMonths, hasDehydration, isOnIVFluids } = input;

    if (isNaN(weightKg) || weightKg <= 0) {
      return { dailyFluidMl: 0, mlPerKg: 0, isSafe: false, source: 'الوزن غير صالح' };
    }

    if (isNaN(ageInMonths) || ageInMonths < 0) {
      return { dailyFluidMl: 0, mlPerKg: 0, isSafe: false, source: 'العمر غير صالح' };
    }

    let totalMl = 0;
    let remainingKg = weightKg;

    for (const segment of PediatricFluidRequirement.HOLLIDAY_SEGAR) {
      if (remainingKg <= 0) break;
      const segmentKg = Math.min(remainingKg, segment.maxKg - (segment.minKg === 0 ? 0 : segment.minKg));
      if (segmentKg > 0) {
        totalMl += segmentKg * segment.factor;
        remainingKg -= segmentKg;
      }
    }

    const mlPerKg = parseFloat((totalMl / weightKg).toFixed(2));

    let source = 'إرشادات هوليداي-سيغار للتسريب الوريدي للأطفال';
    let finalFluid = totalMl;

    if (isOnIVFluids) {
      source = 'إرشادات هوليداي-سيغار للتسريب الوريدي للأطفال';
    }

    if (hasDehydration) {
      finalFluid = Math.round(totalMl * 1.5);
      source += ' - مع زيادة معالجة الجفاف (×1.5)';
    }

    return {
      dailyFluidMl: Math.round(finalFluid),
      mlPerKg,
      isSafe: true,
      source,
    };
  }
}
