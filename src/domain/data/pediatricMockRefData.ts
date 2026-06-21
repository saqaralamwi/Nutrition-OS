import type { WhoLmsPoint } from './whoGrowthReference';

// Head Circumference-for-Age (HCFA) reference points for age 0 to 60 months
export const HCFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 0, l: 1.0, m: 34.5, s: 0.035 },
  { ageMonths: 3, l: 1.0, m: 40.5, s: 0.033 },
  { ageMonths: 6, l: 1.0, m: 43.5, s: 0.032 },
  { ageMonths: 12, l: 1.0, m: 46.0, s: 0.031 },
  { ageMonths: 24, l: 1.0, m: 49.0, s: 0.030 },
  { ageMonths: 36, l: 1.0, m: 50.0, s: 0.029 },
  { ageMonths: 60, l: 1.0, m: 51.2, s: 0.028 }
];

export const HCFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 0, l: 1.0, m: 34.0, s: 0.035 },
  { ageMonths: 3, l: 1.0, m: 39.5, s: 0.033 },
  { ageMonths: 6, l: 1.0, m: 42.2, s: 0.032 },
  { ageMonths: 12, l: 1.0, m: 45.0, s: 0.031 },
  { ageMonths: 24, l: 1.0, m: 48.0, s: 0.030 },
  { ageMonths: 36, l: 1.0, m: 49.0, s: 0.029 },
  { ageMonths: 60, l: 1.0, m: 50.4, s: 0.028 }
];

// Weight-for-Length/Height (WFL/WFH) reference points (ageMonths represents height/length in cm)
export const WFL_WFH_BOYS: WhoLmsPoint[] = [
  { ageMonths: 45, l: -0.35, m: 2.5, s: 0.085 },
  { ageMonths: 55, l: -0.35, m: 4.5, s: 0.084 },
  { ageMonths: 65, l: -0.35, m: 7.2, s: 0.083 },
  { ageMonths: 75, l: -0.35, m: 9.8, s: 0.082 },
  { ageMonths: 85, l: -0.35, m: 12.0, s: 0.081 },
  { ageMonths: 95, l: -0.35, m: 14.5, s: 0.080 },
  { ageMonths: 105, l: -0.35, m: 17.2, s: 0.079 },
  { ageMonths: 115, l: -0.35, m: 20.8, s: 0.078 },
  { ageMonths: 120, l: -0.35, m: 22.4, s: 0.077 }
];

export const WFL_WFH_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 45, l: -0.38, m: 2.4, s: 0.088 },
  { ageMonths: 55, l: -0.38, m: 4.2, s: 0.087 },
  { ageMonths: 65, l: -0.38, m: 6.8, s: 0.086 },
  { ageMonths: 75, l: -0.38, m: 9.3, s: 0.085 },
  { ageMonths: 85, l: -0.38, m: 11.5, s: 0.084 },
  { ageMonths: 95, l: -0.38, m: 13.8, s: 0.083 },
  { ageMonths: 105, l: -0.38, m: 16.5, s: 0.082 },
  { ageMonths: 115, l: -0.38, m: 20.2, s: 0.081 },
  { ageMonths: 120, l: -0.38, m: 21.8, s: 0.080 }
];
