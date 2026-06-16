import { View, StyleSheet, ScrollView } from 'react-native';
import { useMemo } from 'react';
import ArabicText from './ArabicText';
import { LabTestParameter, LAB_TEST_PARAMETERS } from '../../domain/constants/labTestParameters';
import { LabResultRecord } from '../../domain/repositories/ILabResultRepository';
import { InterpretationResult } from '../../domain/entities/LabResult';
import { formatSafeDate } from '../../utils/date';

const COLORS = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  green: '#10B981',
  greenBg: '#064E3B',
  yellow: '#F59E0B',
  yellowBg: '#78350F',
  red: '#F43F5E',
  redBg: '#881337',
  blue: '#3B82F6',
  blueBg: '#1E3A5F',
  rangeBand: '#1E293B',
};

function getInterpretation(
  value: number,
  low: number,
  high: number,
  critLow: number | null,
  critHigh: number | null,
): InterpretationResult {
  if (critLow !== null && value < critLow) return 'critically_low';
  if (critHigh !== null && value > critHigh) return 'critically_high';
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'normal';
}

function getPointColor(interp: InterpretationResult): string {
  switch (interp) {
    case 'normal': return COLORS.green;
    case 'low': return COLORS.blue;
    case 'high': return COLORS.yellow;
    case 'critically_low': return COLORS.red;
    case 'critically_high': return COLORS.red;
  }
}

function getPointBg(interp: InterpretationResult): string {
  switch (interp) {
    case 'normal': return COLORS.greenBg;
    case 'low': return COLORS.blueBg;
    case 'high': return COLORS.yellowBg;
    case 'critically_low': return COLORS.redBg;
    case 'critically_high': return COLORS.redBg;
  }
}

interface ChartDataPoint {
  date: string;
  value: number;
  interpretation: InterpretationResult;
}

interface ChartSeries {
  param: LabTestParameter;
  points: ChartDataPoint[];
}

interface LabTrendChartProps {
  results: LabResultRecord[];
  parameterCodes: string[];
  showOnlyAbnormal: boolean;
}

export default function LabTrendChart({ results, parameterCodes, showOnlyAbnormal }: LabTrendChartProps) {
  const series = useMemo(() => {
    const filtered = showOnlyAbnormal
      ? results.filter((r) => r.interpretation !== 'normal')
      : results;
    return parameterCodes.map((code) => {
      const param = LAB_TEST_PARAMETERS[code];
      if (!param) return null;
      const matching = filtered
        .filter((r) => r.testName.toLowerCase().includes(param.name.toLowerCase()))
        .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
        .map((r) => ({
          date: r.testDate,
          value: r.resultValue,
          interpretation: getInterpretation(
            r.resultValue,
            param.referenceRangeLow ?? 0,
            param.referenceRangeHigh ?? 999,
            param.criticalLow,
            param.criticalHigh,
          ),
        }));
      if (matching.length === 0) return null;
      return { param, points: matching } as ChartSeries;
    }).filter(Boolean) as ChartSeries[];
  }, [results, parameterCodes, showOnlyAbnormal]);

  if (series.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ArabicText style={styles.emptyText}>
          لا توجد نتائج مختبرية مطابقة. أضف نتائج أولاً.
        </ArabicText>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chartArea}>
        {series.map((s) => (
          <SingleChart key={s.param.code} series={s} />
        ))}
      </View>
    </ScrollView>
  );
}

function SingleChart({ series }: { series: ChartSeries }) {
  const { param, points } = series;
  const chartHeight = 180;
  const barWidth = 36;
  const chartWidth = Math.max(points.length * (barWidth + 8) + 20, 200);

  const allValues = points.map((p) => p.value);
  const minVal = Math.min(...allValues, param.referenceRangeLow ?? 0);
  const maxVal = Math.max(...allValues, param.referenceRangeHigh ?? 100);
  const range = maxVal - minVal || 1;

  const yPos = (value: number) => {
    return chartHeight - ((value - minVal) / range) * (chartHeight - 20) - 10;
  };

  const refLowY = yPos(param.referenceRangeLow ?? minVal);
  const refHighY = yPos(param.referenceRangeHigh ?? maxVal);

  return (
    <View style={styles.chartCard}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>
          <ArabicText bold style={styles.chartTitle}>{param.nameAr}</ArabicText>
          <ArabicText style={styles.chartSubtitle}>{param.name} ({param.unit})</ArabicText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
          <ArabicText style={styles.legendText}>طبيعي</ArabicText>
          <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
          <ArabicText style={styles.legendText}>حرج</ArabicText>
        </View>
      </View>

      {/* Chart Canvas */}
      <View style={[styles.canvas, { height: chartHeight, width: chartWidth }]}>
        {/* Reference range band */}
        <View
          style={[
            styles.refBand,
            { top: Math.min(refLowY, refHighY), height: Math.abs(refHighY - refLowY) || 4 },
          ]}
        />
        {/* Reference range lines */}
        <View style={[styles.refLine, { top: refLowY }]} />
        <View style={[styles.refLine, { top: refHighY }]} />

        {/* Data points */}
        {points.map((pt, i) => {
          const x = 10 + i * (barWidth + 8);
          const y = yPos(pt.value);
          const color = getPointColor(pt.interpretation);
          const bg = getPointBg(pt.interpretation);
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  left: x,
                  height: chartHeight - y - 10,
                  top: y,
                  width: barWidth,
                  backgroundColor: bg,
                  borderColor: color,
                },
              ]}
            >
              <View style={[styles.barDot, { backgroundColor: color }]} />
              <ArabicText style={[styles.barValue, { color }]}>
                {pt.value}
              </ArabicText>
            </View>
          );
        })}

        {/* X-axis labels */}
        {points.map((pt, i) => (
          <ArabicText key={`xl-${i}`} style={[styles.xLabel, { left: 10 + i * (barWidth + 8), width: barWidth + 8 }]}>
            {formatDateLabel(pt.date)}
          </ArabicText>
        ))}
      </View>

      {/* Reference range note */}
      <ArabicText style={styles.refNote}>
        النطاق المرجعي: {param.referenceRangeLow ?? '—'} - {param.referenceRangeHigh ?? '∞'} {param.unit}
      </ArabicText>
    </View>
  );
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return '—';
  }
}

const styles = StyleSheet.create({
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  chartArea: { gap: 16, padding: 8 },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 8,
    minWidth: 300,
  },
  chartHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 15, color: COLORS.textPrimary, textAlign: 'right' },
  chartSubtitle: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.textSecondary, marginRight: 4 },
  canvas: { position: 'relative', overflow: 'hidden' },
  refBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.rangeBand,
    opacity: 0.6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  refLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.textDisabled,
    opacity: 0.5,
  },
  bar: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  barDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  barValue: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  xLabel: {
    position: 'absolute',
    bottom: -16,
    fontSize: 8,
    color: COLORS.textDisabled,
    textAlign: 'center',
  },
  refNote: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'right', marginTop: 4 },
});
