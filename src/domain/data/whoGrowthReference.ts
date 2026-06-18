export interface WhoLmsPoint {
  ageMonths: number;
  l: number;
  m: number;
  s: number;
}

function computeSd(l: number, m: number, s: number, z: number): number {
  if (l === 0) return m * Math.exp(s * z);
  const base = 1 + l * s * z;
  if (base <= 0) return m;
  return m * Math.pow(base, 1 / l);
}

export interface ReferenceDataPoint {
  ageMonthsOrCm: number;
  minus3: number;
  minus2: number;
  median: number;
  plus2: number;
  plus3: number;
}

export function generateReferenceCurve(lmsData: WhoLmsPoint[]): ReferenceDataPoint[] {
  return lmsData.map((p) => ({
    ageMonthsOrCm: p.ageMonths,
    minus3: Math.round(computeSd(p.l, p.m, p.s, -3) * 100) / 100,
    minus2: Math.round(computeSd(p.l, p.m, p.s, -2) * 100) / 100,
    median: Math.round(p.m * 100) / 100,
    plus2: Math.round(computeSd(p.l, p.m, p.s, 2) * 100) / 100,
    plus3: Math.round(computeSd(p.l, p.m, p.s, 3) * 100) / 100,
  }));
}

export const WFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 0, l: 0.3487, m: 3.3464, s: 0.14602 },
  { ageMonths: 1, l: 0.2297, m: 4.4709, s: 0.13395 },
  { ageMonths: 2, l: 0.1252, m: 5.5675, s: 0.12335 },
  { ageMonths: 3, l: 0.0747, m: 5.7510, s: 0.11820 },
  { ageMonths: 4, l: 0.0201, m: 6.4732, s: 0.11510 },
  { ageMonths: 5, l: -0.0356, m: 7.0325, s: 0.11276 },
  { ageMonths: 6, l: -0.1140, m: 7.2770, s: 0.10774 },
  { ageMonths: 7, l: -0.1321, m: 7.6772, s: 0.10704 },
  { ageMonths: 8, l: -0.1527, m: 8.0431, s: 0.10659 },
  { ageMonths: 9, l: -0.1677, m: 8.4675, s: 0.10819 },
  { ageMonths: 10, l: -0.1794, m: 8.8071, s: 0.10822 },
  { ageMonths: 11, l: -0.1884, m: 9.1374, s: 0.10808 },
  { ageMonths: 12, l: -0.1925, m: 9.4425, s: 0.10785 },
  { ageMonths: 15, l: -0.1655, m: 10.1393, s: 0.10975 },
  { ageMonths: 18, l: -0.0861, m: 10.5602, s: 0.11033 },
  { ageMonths: 24, l: 0.0637, m: 11.9400, s: 0.11152 },
  { ageMonths: 30, l: 0.1387, m: 12.8094, s: 0.11319 },
  { ageMonths: 36, l: 0.1962, m: 13.5808, s: 0.11390 },
  { ageMonths: 42, l: 0.2260, m: 14.3994, s: 0.11459 },
  { ageMonths: 48, l: 0.2234, m: 15.4536, s: 0.11427 },
  { ageMonths: 54, l: 0.2547, m: 16.3587, s: 0.11449 },
  { ageMonths: 60, l: 0.2839, m: 17.2093, s: 0.11528 },
];

export const WFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 0, l: 0.3809, m: 3.2322, s: 0.14171 },
  { ageMonths: 1, l: 0.2211, m: 4.1693, s: 0.13087 },
  { ageMonths: 2, l: 0.1063, m: 5.1586, s: 0.12238 },
  { ageMonths: 3, l: 0.0896, m: 5.4260, s: 0.11850 },
  { ageMonths: 4, l: 0.0225, m: 6.0741, s: 0.11486 },
  { ageMonths: 5, l: -0.0303, m: 6.5715, s: 0.11199 },
  { ageMonths: 6, l: -0.0793, m: 6.9100, s: 0.10983 },
  { ageMonths: 7, l: -0.1033, m: 7.1808, s: 0.10917 },
  { ageMonths: 8, l: -0.1256, m: 7.4210, s: 0.10870 },
  { ageMonths: 9, l: -0.1419, m: 8.0317, s: 0.10857 },
  { ageMonths: 10, l: -0.1495, m: 8.3479, s: 0.10788 },
  { ageMonths: 11, l: -0.1503, m: 8.6608, s: 0.10727 },
  { ageMonths: 12, l: -0.1494, m: 8.9753, s: 0.10660 },
  { ageMonths: 15, l: -0.1129, m: 9.7246, s: 0.10933 },
  { ageMonths: 18, l: -0.0412, m: 10.0635, s: 0.11313 },
  { ageMonths: 24, l: 0.1174, m: 11.5533, s: 0.11045 },
  { ageMonths: 30, l: 0.1890, m: 12.5065, s: 0.11157 },
  { ageMonths: 36, l: 0.2275, m: 13.2949, s: 0.11179 },
  { ageMonths: 42, l: 0.2527, m: 14.1225, s: 0.11164 },
  { ageMonths: 48, l: 0.2642, m: 15.1234, s: 0.11030 },
  { ageMonths: 54, l: 0.2914, m: 16.0150, s: 0.11023 },
  { ageMonths: 60, l: 0.3137, m: 16.8917, s: 0.11134 },
];

export const LHFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 0, l: 1.0, m: 49.8842, s: 0.03795 },
  { ageMonths: 1, l: 1.0, m: 54.7244, s: 0.03577 },
  { ageMonths: 2, l: 1.0, m: 58.4249, s: 0.03437 },
  { ageMonths: 3, l: 1.0, m: 60.9192, s: 0.03295 },
  { ageMonths: 4, l: 1.0, m: 63.0958, s: 0.03197 },
  { ageMonths: 5, l: 1.0, m: 65.0348, s: 0.03122 },
  { ageMonths: 6, l: 1.0, m: 66.7811, s: 0.03055 },
  { ageMonths: 7, l: 1.0, m: 68.4231, s: 0.03015 },
  { ageMonths: 8, l: 1.0, m: 69.9540, s: 0.02980 },
  { ageMonths: 9, l: 1.0, m: 71.4117, s: 0.02951 },
  { ageMonths: 10, l: 1.0, m: 72.8118, s: 0.02927 },
  { ageMonths: 11, l: 1.0, m: 74.1234, s: 0.02908 },
  { ageMonths: 12, l: 1.0, m: 75.3764, s: 0.02889 },
  { ageMonths: 15, l: 1.0, m: 78.9523, s: 0.02832 },
  { ageMonths: 18, l: 1.0, m: 82.1767, s: 0.02825 },
  { ageMonths: 24, l: 1.0, m: 87.5047, s: 0.02808 },
  { ageMonths: 30, l: 1.0, m: 92.2658, s: 0.02850 },
  { ageMonths: 36, l: 1.0, m: 96.4423, s: 0.02893 },
  { ageMonths: 42, l: 1.0, m: 100.2808, s: 0.02900 },
  { ageMonths: 48, l: 1.0, m: 103.9471, s: 0.02889 },
  { ageMonths: 54, l: 1.0, m: 107.3892, s: 0.02883 },
  { ageMonths: 60, l: 1.0, m: 110.5684, s: 0.02883 },
];

export const LHFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 0, l: 1.0, m: 49.1477, s: 0.03790 },
  { ageMonths: 1, l: 1.0, m: 53.7222, s: 0.03640 },
  { ageMonths: 2, l: 1.0, m: 57.4497, s: 0.03464 },
  { ageMonths: 3, l: 1.0, m: 59.9693, s: 0.03334 },
  { ageMonths: 4, l: 1.0, m: 62.2055, s: 0.03227 },
  { ageMonths: 5, l: 1.0, m: 64.0994, s: 0.03155 },
  { ageMonths: 6, l: 1.0, m: 65.7836, s: 0.03076 },
  { ageMonths: 7, l: 1.0, m: 67.3752, s: 0.03047 },
  { ageMonths: 8, l: 1.0, m: 68.8581, s: 0.03020 },
  { ageMonths: 9, l: 1.0, m: 70.3053, s: 0.02996 },
  { ageMonths: 10, l: 1.0, m: 71.6785, s: 0.02975 },
  { ageMonths: 11, l: 1.0, m: 72.9696, s: 0.02955 },
  { ageMonths: 12, l: 1.0, m: 74.2200, s: 0.02936 },
  { ageMonths: 15, l: 1.0, m: 77.6207, s: 0.02882 },
  { ageMonths: 18, l: 1.0, m: 80.8240, s: 0.02863 },
  { ageMonths: 24, l: 1.0, m: 86.3895, s: 0.02862 },
  { ageMonths: 30, l: 1.0, m: 91.3384, s: 0.02906 },
  { ageMonths: 36, l: 1.0, m: 95.6636, s: 0.02942 },
  { ageMonths: 42, l: 1.0, m: 99.5671, s: 0.02950 },
  { ageMonths: 48, l: 1.0, m: 103.1921, s: 0.02946 },
  { ageMonths: 54, l: 1.0, m: 106.6131, s: 0.02945 },
  { ageMonths: 60, l: 1.0, m: 109.7778, s: 0.02947 },
];

export const BMIFA_BOYS: WhoLmsPoint[] = [
  { ageMonths: 0, l: -0.3394, m: 13.4117, s: 0.09076 },
  { ageMonths: 1, l: -0.0918, m: 14.8916, s: 0.08857 },
  { ageMonths: 3, l: -0.0440, m: 16.2012, s: 0.08801 },
  { ageMonths: 6, l: -0.0492, m: 16.8191, s: 0.08683 },
  { ageMonths: 9, l: -0.1086, m: 16.9463, s: 0.08568 },
  { ageMonths: 12, l: -0.1406, m: 16.7288, s: 0.08472 },
  { ageMonths: 15, l: -0.1381, m: 16.3791, s: 0.08396 },
  { ageMonths: 18, l: -0.1041, m: 16.0368, s: 0.08322 },
  { ageMonths: 24, l: -0.0102, m: 15.6060, s: 0.08208 },
  { ageMonths: 30, l: 0.0771, m: 15.4042, s: 0.08144 },
  { ageMonths: 36, l: 0.1409, m: 15.2682, s: 0.08107 },
  { ageMonths: 42, l: 0.1837, m: 15.1467, s: 0.08083 },
  { ageMonths: 48, l: 0.2072, m: 15.0782, s: 0.08062 },
  { ageMonths: 54, l: 0.2187, m: 15.0488, s: 0.08044 },
  { ageMonths: 60, l: 0.2206, m: 15.0055, s: 0.08025 },
];

export const BMIFA_GIRLS: WhoLmsPoint[] = [
  { ageMonths: 0, l: -0.4106, m: 13.3738, s: 0.09033 },
  { ageMonths: 1, l: -0.1056, m: 14.4412, s: 0.09057 },
  { ageMonths: 3, l: -0.0555, m: 15.7225, s: 0.08821 },
  { ageMonths: 6, l: -0.0646, m: 16.3320, s: 0.08661 },
  { ageMonths: 9, l: -0.1407, m: 16.3854, s: 0.08484 },
  { ageMonths: 12, l: -0.1579, m: 16.2118, s: 0.08360 },
  { ageMonths: 15, l: -0.1264, m: 15.9524, s: 0.08279 },
  { ageMonths: 18, l: -0.0665, m: 15.6872, s: 0.08199 },
  { ageMonths: 24, l: 0.0657, m: 15.3307, s: 0.08098 },
  { ageMonths: 30, l: 0.1553, m: 15.1789, s: 0.08063 },
  { ageMonths: 36, l: 0.2060, m: 15.0925, s: 0.08028 },
  { ageMonths: 42, l: 0.2325, m: 14.9818, s: 0.07971 },
  { ageMonths: 48, l: 0.2420, m: 14.9083, s: 0.07906 },
  { ageMonths: 54, l: 0.2403, m: 14.8492, s: 0.07850 },
  { ageMonths: 60, l: 0.2315, m: 14.7853, s: 0.07797 },
];

export function getReferenceData(
  gender: 'male' | 'female',
  indicator: 'wfa' | 'lhfa' | 'bmifa',
): ReferenceDataPoint[] {
  let lms: WhoLmsPoint[];
  if (indicator === 'wfa') {
    lms = gender === 'male' ? WFA_BOYS : WFA_GIRLS;
  } else if (indicator === 'lhfa') {
    lms = gender === 'male' ? LHFA_BOYS : LHFA_GIRLS;
  } else {
    lms = gender === 'male' ? BMIFA_BOYS : BMIFA_GIRLS;
  }
  return generateReferenceCurve(lms);
}

export function classifyZScore(z: number): 'severely_low' | 'low' | 'normal' | 'high' | 'severely_high' {
  if (z < -3) return 'severely_low';
  if (z < -2) return 'low';
  if (z <= 2) return 'normal';
  if (z <= 3) return 'high';
  return 'severely_high';
}

export function zScoreLabelAr(z: number): string {
  if (z < -3) return 'منخفض حاد (Severely Low)';
  if (z < -2) return 'منخفض (Low)';
  if (z <= 2) return 'طبيعي (Normal)';
  if (z <= 3) return 'مرتفع (High)';
  return 'مرتفع حاد (Severely High)';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function findClosestRefIndex(refData: ReferenceDataPoint[], targetAge: number): number {
  let idx = 0;
  let minDist = Infinity;
  for (let i = 0; i < refData.length; i++) {
    const dist = Math.abs(refData[i].ageMonthsOrCm - targetAge);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

export function computeZScoreFromReference(
  measurementValue: number,
  ageMonths: number,
  gender: 'male' | 'female',
  indicator: 'wfa' | 'lhfa' | 'bmifa',
): { zScore: number; classification: ReturnType<typeof classifyZScore> } {
  if (!measurementValue || measurementValue <= 0 || ageMonths < 0) {
    return { zScore: 0, classification: 'normal' };
  }
  const refData = getReferenceData(gender, indicator);
  if (refData.length < 2) {
    return { zScore: 0, classification: 'normal' };
  }
  const idx = findClosestRefIndex(refData, ageMonths);
  const point = refData[idx];
  if (idx > 0 && idx < refData.length - 1) {
    const prev = refData[idx - 1];
    const next = refData[idx + 1];
    const range = next.ageMonthsOrCm - prev.ageMonthsOrCm;
    if (range > 0) {
      const t = (ageMonths - prev.ageMonthsOrCm) / range;
      const m = lerp(prev.median, next.median, t);
      const sd2neg = lerp(prev.minus2, next.minus2, t);
      const sd2pos = lerp(prev.plus2, next.plus2, t);
      const sdScale = (sd2pos - sd2neg) / 4;
      if (sdScale === 0) return { zScore: 0, classification: 'normal' };
      let z = (measurementValue - m) / sdScale;
      if (z > 3) {
        const sd3neg = lerp(prev.minus3, next.minus3, t);
        const sd3pos = lerp(prev.plus3, next.plus3, t);
        const upperScale = sd3pos - sd2pos;
        if (upperScale > 0) z = 2 + (measurementValue - sd2pos) / (upperScale / 1);
      } else if (z < -3) {
        const sd3neg = lerp(prev.minus3, next.minus3, t);
        const lowerScale = sd2neg - sd3neg;
        if (lowerScale > 0) z = -2 + (measurementValue - sd2neg) / (lowerScale / 1);
      }
      return {
        zScore: Math.round(z * 100) / 100,
        classification: classifyZScore(z),
      };
    }
  }
  const sdScale = (point.plus2 - point.minus2) / 4;
  if (sdScale === 0) return { zScore: 0, classification: 'normal' };
  const z = (measurementValue - point.median) / sdScale;
  return {
    zScore: Math.round(z * 100) / 100,
    classification: classifyZScore(z),
  };
}
