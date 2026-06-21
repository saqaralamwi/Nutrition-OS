import type { WhoLmsPoint } from './whoGrowthReference';

// CDC 2000 Weight-for-Age (WFA) lightweight reference data (60 to 240 months)
export const CDC2000_WFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 60, l: -0.05, m: 17.8, s: 0.12 },
  { ageMonths: 120, l: -0.08, m: 32.5, s: 0.15 },
  { ageMonths: 180, l: -0.12, m: 54.0, s: 0.16 },
  { ageMonths: 240, l: -0.15, m: 70.2, s: 0.17 }
];

export const CDC2000_WFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 60, l: -0.07, m: 17.2, s: 0.13 },
  { ageMonths: 120, l: -0.10, m: 32.1, s: 0.16 },
  { ageMonths: 180, l: -0.14, m: 52.5, s: 0.17 },
  { ageMonths: 240, l: -0.18, m: 68.5, s: 0.18 }
];

// CDC 2000 Stature-for-Age (SFA) lightweight reference data (60 to 240 months)
export const CDC2000_SFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 60, l: 1.0, m: 110.0, s: 0.042 },
  { ageMonths: 120, l: 1.0, m: 138.5, s: 0.045 },
  { ageMonths: 180, l: 1.0, m: 170.0, s: 0.041 },
  { ageMonths: 240, l: 1.0, m: 176.5, s: 0.038 }
];

export const CDC2000_SFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 60, l: 1.0, m: 109.5, s: 0.043 },
  { ageMonths: 120, l: 1.0, m: 138.0, s: 0.046 },
  { ageMonths: 180, l: 1.0, m: 163.0, s: 0.042 },
  { ageMonths: 240, l: 1.0, m: 163.5, s: 0.039 }
];

// CDC 2000 BMI-for-Age (BMIFA) lightweight reference data (60 to 240 months)
export const CDC2000_BMIFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 60, l: -2.1, m: 15.2, s: 0.075 },
  { ageMonths: 120, l: -1.7, m: 16.6, s: 0.098 },
  { ageMonths: 180, l: -0.9, m: 19.8, s: 0.125 },
  { ageMonths: 240, l: 0.2, m: 22.8, s: 0.145 }
];

export const CDC2000_BMIFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 60, l: -2.3, m: 15.0, s: 0.078 },
  { ageMonths: 120, l: -1.9, m: 16.8, s: 0.102 },
  { ageMonths: 180, l: -1.1, m: 20.2, s: 0.132 },
  { ageMonths: 240, l: 0.1, m: 22.5, s: 0.148 }
];
