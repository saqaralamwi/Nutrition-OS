import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, G, Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing, fontFamilies, fontSizes } from '../../theme';

interface ReferenceDataPoint {
  ageMonthsOrCm: number;
  minus3: number;
  minus2: number;
  median: number;
  plus2: number;
  plus3: number;
}

interface PatientPoint {
  x: number;
  y: number;
}

interface IGrowthChartProps {
  gender: 'male' | 'female';
  indicatorType: 'wfa' | 'lhfa' | 'wfh' | 'bmifa';
  referenceDataPoints: ReferenceDataPoint[];
  currentPatientPoint: PatientPoint;
}

const CANVAS_HEIGHT = 300;
const PADDING_LEFT = 40;
const PADDING_BOTTOM = 40;
const PADDING_TOP = 20;
const PADDING_RIGHT = 20;

function buildSvgPath(
  data: ReferenceDataPoint[],
  accessor: (d: ReferenceDataPoint) => number,
  scaleX: (v: number) => number,
  scaleY: (v: number) => number,
): string {
  return data
    .map((d, i) => {
      const x = scaleX(d.ageMonthsOrCm);
      const y = scaleY(accessor(d));
      return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    })
    .join(' ');
}

function generateYLabels(minY: number, maxY: number, count: number): number[] {
  const step = (maxY - minY) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round((minY + step * i) * 10) / 10);
}

export const GrowthChartComponent: React.FC<IGrowthChartProps> = ({
  referenceDataPoints,
  currentPatientPoint,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const canvasWidth = screenWidth - spacing.md * 2;
  const chartWidth = canvasWidth - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = CANVAS_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  if (!referenceDataPoints || referenceDataPoints.length < 2) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>لا توجد بيانات مرجعية كافية لعرض مخطط النمو</Text>
      </View>
    );
  }

  const minX = referenceDataPoints[0].ageMonthsOrCm;
  const maxX = referenceDataPoints[referenceDataPoints.length - 1].ageMonthsOrCm;
  const xRange = maxX - minX || 1;

  const allValues = referenceDataPoints.flatMap(d => [
    d.minus3, d.minus2, d.median, d.plus2, d.plus3,
  ]);
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const yRange = maxY - minY || 1;

  const scaleX = (val: number): number =>
    PADDING_LEFT + ((val - minX) / xRange) * chartWidth;

  const scaleY = (val: number): number =>
    CANVAS_HEIGHT - PADDING_BOTTOM - ((val - minY) / yRange) * chartHeight;

  const curves: { accessor: (d: ReferenceDataPoint) => number; color: string; label: string }[] = [
    { accessor: d => d.minus3, color: '#DC2626', label: '-3 SD' },
    { accessor: d => d.minus2, color: '#D97706', label: '-2 SD' },
    { accessor: d => d.median, color: '#10B981', label: 'Median' },
    { accessor: d => d.plus2, color: '#D97706', label: '+2 SD' },
    { accessor: d => d.plus3, color: '#DC2626', label: '+3 SD' },
  ];

  const yLabels = generateYLabels(minY, maxY, 6);
  const xLabelStep = Math.max(1, Math.floor((maxX - minX) / 6));
  const xLabels: number[] = [];
  for (let i = minX; i <= maxX; i += xLabelStep) {
    xLabels.push(i);
  }

  const px = scaleX(currentPatientPoint.x);
  const py = scaleY(currentPatientPoint.y);

  return (
    <View style={styles.container}>
      <Svg width={canvasWidth} height={CANVAS_HEIGHT} viewBox={`0 0 ${canvasWidth} ${CANVAS_HEIGHT}`}>
        <Rect x={0} y={0} width={canvasWidth} height={CANVAS_HEIGHT} fill={colors.surface} />

        {yLabels.map(val => {
          const y = scaleY(val);
          return (
            <G key={`y-${val}`}>
              <Line
                x1={PADDING_LEFT}
                y1={y}
                x2={canvasWidth - PADDING_RIGHT}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
              />
              <SvgText
                x={PADDING_LEFT - 6}
                y={y + 4}
                fill={colors.textSecondary}
                fontSize={10}
                textAnchor="end"
                fontFamily={fontFamilies?.regular || 'System'}
              >
                {val}
              </SvgText>
            </G>
          );
        })}

        {xLabels.map(val => {
          const x = scaleX(val);
          return (
            <G key={`x-${val}`}>
              <Line
                x1={x}
                y1={PADDING_TOP}
                x2={x}
                y2={CANVAS_HEIGHT - PADDING_BOTTOM}
                stroke={colors.border}
                strokeWidth={0.5}
              />
              <SvgText
                x={x}
                y={CANVAS_HEIGHT - PADDING_BOTTOM + 16}
                fill={colors.textSecondary}
                fontSize={10}
                textAnchor="middle"
                fontFamily={fontFamilies?.regular || 'System'}
              >
                {val}
              </SvgText>
            </G>
          );
        })}

        {curves.map(curve => (
          <Path
            key={curve.label}
            d={buildSvgPath(referenceDataPoints, curve.accessor, scaleX, scaleY)}
            stroke={curve.color}
            strokeWidth={2}
            fill="none"
          />
        ))}

        <Circle cx={px} cy={py} r={6} fill="#22D3EE" />
        <Circle cx={px} cy={py} r={10} fill="none" stroke="#22D3EE" strokeWidth={2} opacity={0.4} />
        <Circle cx={px} cy={py} r={14} fill="none" stroke="#22D3EE" strokeWidth={1} opacity={0.2} />
      </Svg>

      <View style={styles.legendRow}>
        {curves.map(curve => (
          <View key={curve.label} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: curve.color }]} />
            <Text style={styles.legendText}>{curve.label}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#22D3EE' }]} />
          <Text style={styles.legendText}>المريض</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  fallbackContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: spacing.md,
  },
  fallbackText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fontFamilies?.regular || 'System',
  },
  legendRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.regular || 'System',
  },
});
