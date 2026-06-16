import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from 'react-native-svg';

// Database & Observe
import { watchQuery, watchRecord } from '../../../src/data/database/observe';

// Models
import Patient from '../../../src/data/models/Patient';
import CardiovascularAssessment from '../../../src/data/models/CardiovascularAssessment';
import PatientWeightLog from '../../../src/data/models/PatientWeightLog';

// Presentation & UI
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';

export default function CardioChartsScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  // Core stream states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [cardioData, setCardioData] = useState<CardiovascularAssessment[]>([]);
  const [weightLogs, setWeightLogs] = useState<PatientWeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tooltip selection states
  const [selectedPointA, setSelectedPointA] = useState<number | null>(null);
  const [selectedPointB, setSelectedPointB] = useState<number | null>(null);

  // Flashing alarm animation trigger
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setFlash((f) => !f);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // RxJS pipeline
  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);

    const cardio$ = watchQuery<CardiovascularAssessment>((db) => {
      return db.get('cardiovascular_assessments').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', 'desc')
      );
    }).pipe(
      map((records) => {
        // Grab the last 10 sequential entries, then sort them chronologically (ascending)
        const sliced = records.slice(0, 10);
        sliced.reverse();
        return sliced;
      })
    );

    const weightLogs$ = watchQuery<PatientWeightLog>((db) => {
      return db.get('patient_weight_logs').query(
        Q.where('patient_id', patientId),
        Q.sortBy('log_date', 'desc')
      );
    }).pipe(
      map((records) => {
        // Grab the last 10 sequential entries, then sort chronologically
        const sliced = records.slice(0, 10);
        sliced.reverse();
        return sliced;
      })
    );

    const stream = combineLatest([patient$, cardio$, weightLogs$]).subscribe({
      next: ([p, cardio, weights]) => {
        setPatient(p);
        setCardioData(cardio);
        setWeightLogs(weights);
        setIsLoading(false);
      },
      error: (err) => {
        console.error('Cardio charts stream subscription error:', err);
        showToast('خطأ في تحميل المنحنيات البيانية للقلب', 'error');
        setIsLoading(false);
      },
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  // Layout Dimensions and Viewport Calculations
  const chartWidth = 340;
  const chartHeight = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Formatting date/time helper for X-Axis labels
  const formatXLabel = (timestampMs: number) => {
    const d = new Date(timestampMs);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  // ==========================================
  // GRAPH A: BLOOD PRESSURE TREND calculations
  // ==========================================
  const bpPlotData = useMemo(() => {
    if (cardioData.length < 2) return null;

    const N = cardioData.length;
    const xCoords = cardioData.map((_, idx) => paddingLeft + innerWidth * (idx / (N - 1)));

    // BP range fixed from 40 to 200 mmHg
    const getBPY = (val: number) => {
      const clamped = Math.max(40, Math.min(200, val));
      return paddingTop + innerHeight * (1 - (clamped - 40) / (200 - 40));
    };

    const sysCoords = cardioData.map((c) => getBPY(c.systolicBloodPressure));
    const diaCoords = cardioData.map((c) => getBPY(c.diastolicBloodPressure));

    // Construct SVG Polyline/Path points
    const sysPoints = xCoords.map((x, i) => `${x},${sysCoords[i]}`).join(' ');
    const diaPoints = xCoords.map((x, i) => `${x},${diaCoords[i]}`).join(' ');

    // Gradient shadow paths
    const yBottom = chartHeight - paddingBottom;
    const sysAreaPath = `M ${xCoords[0]} ${sysCoords[0]} ` +
      xCoords.slice(1).map((x, i) => `L ${x} ${sysCoords[i + 1]}`).join(' ') +
      ` L ${xCoords[N - 1]} ${yBottom} L ${xCoords[0]} ${yBottom} Z`;

    const diaAreaPath = `M ${xCoords[0]} ${diaCoords[0]} ` +
      xCoords.slice(1).map((x, i) => `L ${x} ${diaCoords[i + 1]}`).join(' ') +
      ` L ${xCoords[N - 1]} ${yBottom} L ${xCoords[0]} ${yBottom} Z`;

    return {
      xCoords,
      sysCoords,
      diaCoords,
      sysPoints,
      diaPoints,
      sysAreaPath,
      diaAreaPath,
    };
  }, [cardioData]);

  // ==========================================
  // GRAPH B: WEIGHT SHIFT FLUID MATRIX calculations
  // ==========================================
  const weightPlotData = useMemo(() => {
    // We plot morning weights from logs compared to dry weights from cardio assessments.
    // To align them, we'll map logs or fall back. If we don't have enough weight logs,
    // we use the dry weights as morning weights to keep the screen stable.
    const N = cardioData.length;
    if (N < 2) return null;

    const dryWeights = cardioData.map((c) => c.measuredDryWeightKg);
    const morningWeights = cardioData.map((c, idx) => {
      const matchingLog = weightLogs[idx];
      return matchingLog ? matchingLog.weightKg : c.measuredDryWeightKg;
    });

    const allWeights = [...dryWeights, ...morningWeights].filter((w) => w != null && !isNaN(w));
    const minW = allWeights.length > 0 ? Math.min(...allWeights) - 2.0 : 60.0;
    const maxW = allWeights.length > 0 ? Math.max(...allWeights) + 2.0 : 80.0;
    const wRange = maxW - minW > 0 ? maxW - minW : 10.0;

    const getWeightY = (w: number) => {
      return paddingTop + innerHeight * (1 - (w - minW) / wRange);
    };

    const xCoords = cardioData.map((_, idx) => paddingLeft + innerWidth * (idx / (N - 1)));
    const dryCoords = dryWeights.map((w) => getWeightY(w));
    const morningCoords = morningWeights.map((w) => getWeightY(w));

    const dryPoints = xCoords.map((x, i) => `${x},${dryCoords[i]}`).join(' ');
    const morningPoints = xCoords.map((x, i) => `${x},${morningCoords[i]}`).join(' ');

    // Acute fluid gain detection (weight gain >= 1.0 kg within sequential logs, e.g., ~24-36 hrs)
    const isAcuteGain = (idx: number) => {
      if (idx <= 0) return false;
      const weightDiff = morningWeights[idx] - morningWeights[idx - 1];

      const currentLog = weightLogs[idx];
      const prevLog = weightLogs[idx - 1];

      if (currentLog && prevLog) {
        const timeDiffMs = new Date(currentLog.logDate).getTime() - new Date(prevLog.logDate).getTime();
        const hrs = timeDiffMs / (1000 * 60 * 60);
        return weightDiff >= 1.0 && hrs <= 36;
      }
      return weightDiff >= 1.0;
    };

    return {
      xCoords,
      dryCoords,
      morningCoords,
      dryPoints,
      morningPoints,
      minW,
      maxW,
      dryWeights,
      morningWeights,
      isAcuteGain,
    };
  }, [cardioData, weightLogs]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={{ marginTop: spacing.md, color: colors.textSecondary }}>
          جاري جلب بيانات القياسات القلبية وتقلبات الوزن...
        </ArabicText>
      </View>
    );
  }

  // Intercept if there's insufficient data to draw curves
  if (cardioData.length < 2) {
    return (
      <View style={styles.fallbackContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>بيانات القلب وتقلبات الوزن</ArabicText>
        </View>
        <View style={styles.emptyStateBox}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
          <ArabicText bold style={styles.emptyStateTitle}>⚠️ قراءات غير كافية لرسم المنحنيات البيانية لملف القلب</ArabicText>
          <ArabicText style={styles.emptyStateSubtitle}>
            يرجى إضافة قراءتين طبيتين على الأقل في السجل القلبي والوزن الجاف للمريض لتوليد التقارير البيانية.
          </ArabicText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <ArabicText bold style={styles.headerTitle}>القياسات البيانية للقلب والسوائل</ArabicText>
        <ArabicText style={styles.headerSubtitle}>
          الملف الطبي: {patient?.fullName || '-'} | السرير: {patient?.bedNumber || '-'}
        </ArabicText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CHART 1: BLOOD PRESSURE TRENDS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pulse" size={20} color="#FF3B30" />
            <ArabicText bold style={styles.cardTitle}>📈 منحنى ضغط الدم الشرياني (انقباضي/انبساطي)</ArabicText>
          </View>

          {/* SVG BP Plot */}
          {bpPlotData && (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#FF3B30" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#FF3B30" stopOpacity="0.0" />
                  </LinearGradient>
                  <LinearGradient id="diaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#007AFF" stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>

                {/* Horizontal Gridlines */}
                {[40, 80, 120, 160, 200].map((val) => {
                  const y = paddingTop + innerHeight * (1 - (val - 40) / 160);
                  return (
                    <React.Fragment key={val}>
                      <Line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke={colors.border}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <SvgText
                        x={paddingLeft - 8}
                        y={y + 4}
                        fill={colors.textSecondary}
                        fontSize="9"
                        textAnchor="end"
                      >
                        {val}
                      </SvgText>
                    </React.Fragment>
                  );
                })}

                {/* Area fills */}
                <Path d={bpPlotData.sysAreaPath} fill="url(#sysGrad)" />
                <Path d={bpPlotData.diaAreaPath} fill="url(#diaGrad)" />

                {/* Trendlines */}
                <Path
                  d={`M ${bpPlotData.sysPoints.split(' ').map((p) => p.replace(',', ' ')).join(' L ')}`}
                  fill="none"
                  stroke="#FF3B30"
                  strokeWidth="3"
                />
                <Path
                  d={`M ${bpPlotData.diaPoints.split(' ').map((p) => p.replace(',', ' ')).join(' L ')}`}
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="3"
                />

                {/* Data Points / Interactive Circles */}
                {bpPlotData.xCoords.map((x, idx) => (
                  <React.Fragment key={idx}>
                    {/* Systolic Circle */}
                    <Circle
                      cx={x}
                      cy={bpPlotData.sysCoords[idx]}
                      r={selectedPointA === idx ? '6' : '4'}
                      fill="#FF3B30"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      onPress={() => setSelectedPointA(selectedPointA === idx ? null : idx)}
                    />
                    {/* Diastolic Circle */}
                    <Circle
                      cx={x}
                      cy={bpPlotData.diaCoords[idx]}
                      r={selectedPointA === idx ? '6' : '4'}
                      fill="#007AFF"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      onPress={() => setSelectedPointA(selectedPointA === idx ? null : idx)}
                    />
                    {/* X-Axis labels */}
                    <SvgText
                      x={x}
                      y={chartHeight - 12}
                      fill={colors.textSecondary}
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {formatXLabel(cardioData[idx].recordedAt.getTime())}
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>

              {/* BP Tooltip Overlay */}
              {selectedPointA !== null && cardioData[selectedPointA] && (
                <View
                  style={[
                    styles.tooltip,
                    {
                      left: Math.max(10, Math.min(chartWidth - 130, bpPlotData.xCoords[selectedPointA] - 60)),
                      top: Math.max(5, bpPlotData.sysCoords[selectedPointA] - 65),
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>
                    الانقباضي: {cardioData[selectedPointA].systolicBloodPressure} mmHg
                  </Text>
                  <Text style={styles.tooltipText}>
                    الانبساطي: {cardioData[selectedPointA].diastolicBloodPressure} mmHg
                  </Text>
                  <Text style={styles.tooltipSubText}>
                    التاريخ: {new Date(cardioData[selectedPointA].recordedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#FF3B30' }]} />
              <ArabicText style={styles.legendText}>الانقباضي (Systolic)</ArabicText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#007AFF' }]} />
              <ArabicText style={styles.legendText}>الانبساطي (Diastolic)</ArabicText>
            </View>
          </View>
        </View>

        {/* CHART 2: DAILY WEIGHT & FLUID FLUCUATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="scale" size={20} color="#34C759" />
            <ArabicText bold style={styles.cardTitle}>⚖️ تتبع تقلبات الوزن الصباحي ومؤشر السوائل</ArabicText>
          </View>

          {/* SVG Weight Shift Plot */}
          {weightPlotData && (
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {/* Horizontal weight Gridlines */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const val = weightPlotData.minW + (weightPlotData.maxW - weightPlotData.minW) * (i / 4);
                  const y = paddingTop + innerHeight * (1 - i / 4);
                  return (
                    <React.Fragment key={i}>
                      <Line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke={colors.border}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <SvgText
                        x={paddingLeft - 8}
                        y={y + 4}
                        fill={colors.textSecondary}
                        fontSize="9"
                        textAnchor="end"
                      >
                        {val.toFixed(1)}
                      </SvgText>
                    </React.Fragment>
                  );
                })}

                {/* Dry Weight Target Line (Muted dotted baseline representation) */}
                <Path
                  d={`M ${weightPlotData.dryCoords.map((y, idx) => `${weightPlotData.xCoords[idx]} ${y}`).join(' L ')}`}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Morning Weight Trendline */}
                <Path
                  d={`M ${weightPlotData.morningCoords.map((y, idx) => `${weightPlotData.xCoords[idx]} ${y}`).join(' L ')}`}
                  fill="none"
                  stroke="#34C759"
                  strokeWidth="3.5"
                />

                {/* Circles & Flashing Alarm Points */}
                {weightPlotData.xCoords.map((x, idx) => {
                  const isAlarm = weightPlotData.isAcuteGain(idx);
                  const morningY = weightPlotData.morningCoords[idx];
                  const alarmColor = flash ? '#F59E0B' : '#DC2626';

                  return (
                    <React.Fragment key={idx}>
                      {/* Morning weight circle */}
                      <Circle
                        cx={x}
                        cy={morningY}
                        r={isAlarm ? '7' : (selectedPointB === idx ? '6' : '4')}
                        fill={isAlarm ? alarmColor : '#34C759'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        onPress={() => setSelectedPointB(selectedPointB === idx ? null : idx)}
                      />

                      {/* Dry Weight Reference Circle */}
                      <Circle
                        cx={x}
                        cy={weightPlotData.dryCoords[idx]}
                        r="3.5"
                        fill="#64748B"
                        onPress={() => setSelectedPointB(selectedPointB === idx ? null : idx)}
                      />

                      {/* X-Axis labels */}
                      <SvgText
                        x={x}
                        y={chartHeight - 12}
                        fill={colors.textSecondary}
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {formatXLabel(cardioData[idx].recordedAt.getTime())}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
              </Svg>

              {/* Weight Tooltip Overlay */}
              {selectedPointB !== null && weightPlotData && (
                <View
                  style={[
                    styles.tooltip,
                    {
                      left: Math.max(10, Math.min(chartWidth - 135, weightPlotData.xCoords[selectedPointB] - 60)),
                      top: Math.max(5, weightPlotData.morningCoords[selectedPointB] - 70),
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>
                    الوزن الصباحي: {weightPlotData.morningWeights[selectedPointB].toFixed(1)} kg
                  </Text>
                  <Text style={styles.tooltipText}>
                    الوزن الجاف المستهدف: {weightPlotData.dryWeights[selectedPointB].toFixed(1)} kg
                  </Text>
                  {weightPlotData.isAcuteGain(selectedPointB) && (
                    <Text style={[styles.tooltipText, { color: colors.warning, fontWeight: 'bold' }]}>
                      ⚠️ كسب حاد في السوائل (≥ 1 كجم)
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#34C759' }]} />
              <ArabicText style={styles.legendText}>الوزن الصباحي الفعلي (Morning Weight)</ArabicText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#94A3B8', borderStyle: 'dotted', borderWidth: 2 }]} />
              <ArabicText style={styles.legendText}>الوزن الجاف المستهدف (Target Dry Weight)</ArabicText>
            </View>
          </View>
        </View>

        {/* Clinical Note Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <ArabicText bold style={styles.cardTitle}>توجيهات الملاحظة السريرية</ArabicText>
          </View>
          <ArabicText style={styles.clinicalNoteText}>
            • يمثل الخط المنقط الرمادي الوزن الجاف المستقر للمريض. في حالة تجاوز الوزن الصباحي الفعلي للوزن الجاف بأكثر من 1.0 كجم خلال 24 ساعة، ينبه النظام بوجود احتباس حاد للسوائل (Acute Fluid Overload)، مما يستدعي مراجعة جرعة المدرات البولية فوراً بالتنسيق مع الفريق الطبي للقلب.
          </ArabicText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    position: 'absolute',
    top: safeHeaderPaddingTop - 6,
    start: spacing.md,
    zIndex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.primaryContrast,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
    width: 140,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  tooltipText: {
    color: colors.textPrimary,
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'ThmanyahSans-Medium' : 'sans-serif-medium',
  },
  tooltipSubText: {
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: 'right',
  },
  legendContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendIndicator: {
    width: 14,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyStateBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  clinicalNoteText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
  },
});
