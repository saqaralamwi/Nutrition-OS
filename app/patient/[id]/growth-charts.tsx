import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import Patient from '../../../src/data/models/Patient';
import PediatricGrowthChart from '../../../src/data/models/PediatricGrowthChart';
import PediatricMeasurementForm from '../../../src/presentation/components/PediatricMeasurementForm';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import {
  getReferenceData,
  generateReferenceCurve,
  zScoreLabelAr,
  ReferenceDataPoint,
} from '../../../src/domain/data/whoGrowthReference';
import { getAdolescentRefData } from '../../../src/domain/data/adolescentRefData';
import { getCdcRefData } from '../../../src/domain/data/cdcRefData';
import type { GrowthStandard, IStuntingResult } from '../../../src/domain/calculators/PediatricZScoreEngine';
import { PediatricZScoreEngine } from '../../../src/domain/calculators/PediatricZScoreEngine';
import { Cdc2022ExtendedBmiEngine, BMI_EXTENDED_COLORS } from '../../../src/domain/calculators/Cdc2022ExtendedBmiEngine';
import type { IExtendedBmiResult } from '../../../src/domain/calculators/Cdc2022ExtendedBmiEngine';

type ChartIndicator = 'wfa' | 'lhfa' | 'bmifa';

interface ChartDataPoint {
  age: number;
  p3: number | null;
  p15: number | null;
  p50: number | null;
  p85: number | null;
  p97: number | null;
  patient: number | null;
}

function mergeChartData(
  refData: ReferenceDataPoint[],
  records: PediatricGrowthChart[],
  patientAccessor: (r: PediatricGrowthChart) => number | null,
): ChartDataPoint[] {
  const map = new Map<number, ChartDataPoint>();

  for (const r of refData) {
    map.set(r.ageMonthsOrCm, {
      age: r.ageMonthsOrCm,
      p3: r.minus3,
      p15: r.minus2,
      p50: r.median,
      p85: r.plus2,
      p97: r.plus3,
      patient: null,
    });
  }

  for (const r of records) {
    const age = r.ageMonths;
    const val = patientAccessor(r);
    if (val == null) continue;
    if (map.has(age)) {
      map.get(age)!.patient = val;
    } else {
      map.set(age, {
        age,
        p3: null,
        p15: null,
        p50: null,
        p85: null,
        p97: null,
        patient: val,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.age - b.age);
}

const chartColors = {
  p3: '#DC2626',
  p15: '#D97706',
  p50: '#10B981',
  p85: '#D97706',
  p97: '#DC2626',
  patient: '#22D3EE',
};

const CHART_HEIGHT = 280;

function ZScoreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <View style={styles.tooltipContainer}>
      <ArabicText style={styles.tooltipAge}>العمر: {label} شهر</ArabicText>
      {payload.map((entry: any) => {
        if (entry.value == null) return null;
        const names: Record<string, string> = {
          p3: '-3 SD',
          p15: '-2 SD',
          p50: 'Median',
          p85: '+2 SD',
          p97: '+3 SD',
          patient: 'المريض',
        };
        return (
          <View key={entry.dataKey} style={styles.tooltipRow}>
            <View style={[styles.tooltipDot, { backgroundColor: entry.color }]} />
            <Text style={styles.tooltipText}>
              {names[entry.dataKey] || entry.dataKey}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function renderGrowthChart(
  title: string,
  subtitle: string,
  data: ChartDataPoint[],
  yLabel: string,
  domain: [number, number],
  zField: keyof PediatricGrowthChart,
  latestRecord: PediatricGrowthChart | null,
  warningLineKey?: 'p15' | 'p85',
  showTransitionBreak?: boolean,
) {
  return (
    <View style={styles.card} key={title}>
      <ArabicText bold style={styles.cardTitle}>📊 {title}</ArabicText>
      <ArabicText style={styles.cardSubtitle}>{subtitle}</ArabicText>
      {showTransitionBreak && (
        <View style={styles.transitionNote}>
          <Text style={styles.transitionNoteText}>
            ⚠️ انتقال المرجع: WHO 2006 (0–60 شهر) ← WHO 2007 للمراهقين (61–228 شهر)
          </Text>
        </View>
      )}

      {data.length < 3 ? (
        <ArabicText style={styles.noDataText}>بيانات غير كافية لرسم المنحنى البياني</ArabicText>
      ) : (
        <View style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="age"
                type="number"
                domain={[0, 228]}
                ticks={[0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228]}
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: fontFamilies.regular }}
                label={{ value: 'العمر (شهر)', position: 'insideBottom', offset: -4, fill: '#94A3B8', fontSize: 10 }}
              />
              <YAxis
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10 }}
                domain={domain}
              />
              <Tooltip content={<ZScoreTooltip />} />
              <Legend
                wrapperStyle={{ direction: 'rtl', fontSize: 10, color: '#94A3B8' }}
              />
              <Line type="monotone" dataKey="p97" stroke={chartColors.p97} strokeWidth={1} strokeDasharray="4 2" dot={false} name="+3 SD" />
              <Line type="monotone" dataKey="p85" stroke={chartColors.p85} strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="+2 SD" />
              <Line type="monotone" dataKey="p50" stroke={chartColors.p50} strokeWidth={2.5} dot={false} name="Median" />
              <Line
                type="monotone"
                dataKey="p15"
                stroke={warningLineKey === 'p15' ? '#F97316' : chartColors.p15}
                strokeWidth={warningLineKey === 'p15' ? 2.5 : 1.5}
                strokeDasharray={warningLineKey === 'p15' ? '8 2' : '3 2'}
                dot={false}
                name={warningLineKey === 'p15' ? '⚠️ حذر التقزم (-2 SD)' : '-2 SD'}
              />
              <Line type="monotone" dataKey="p3" stroke={chartColors.p3} strokeWidth={1} strokeDasharray="4 2" dot={false} name="-3 SD" />
              <Line
                type="monotone"
                dataKey="patient"
                stroke={chartColors.patient}
                strokeWidth={2.5}
                dot={{ r: 4, fill: chartColors.patient }}
                activeDot={{ r: 6 }}
                name="المريض"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </View>
      )}

      {latestRecord && latestRecord[zField] != null && (
        <View style={styles.zBadgeRow}>
          <View style={styles.zBadge}>
            <ArabicText style={styles.zBadgeLabel}>آخر Z-Score: </ArabicText>
            <Text style={[styles.zBadgeValue, { color: chartColors.patient }]}>
              {(latestRecord[zField] as number).toFixed(2)}
            </Text>
          </View>
          <View style={styles.zBadge}>
            <ArabicText style={styles.zBadgeLabel}>التصنيف: </ArabicText>
            <Text style={[styles.zBadgeValue, { color: '#F59E0B' }]}>
              {zScoreLabelAr(latestRecord[zField] as number)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function GrowthChartsScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [growthRecords, setGrowthRecords] = useState<PediatricGrowthChart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stuntingResult, setStuntingResult] = useState<IStuntingResult | null>(null);
  const [extendedBmiResult, setExtendedBmiResult] = useState<IExtendedBmiResult | null>(null);

  const [selectedStandard, setSelectedStandard] = useState<GrowthStandard | null>(null);

  const gender = patient?.gender === 'female' ? 'female' : 'male';
  const ageMonths = patient ? Math.round(patient.age * 12) : 0;

  const effectiveStandard: GrowthStandard = (() => {
    if (selectedStandard) return selectedStandard;
    if (ageMonths > 60 && ageMonths <= 228) return 'WHO_2007_Adolescent';
    if (ageMonths >= 24) return 'CDC';
    return 'WHO';
  })();

  const standardLabelAr = (() => {
    if (effectiveStandard === 'WHO_2007_Adolescent') return 'WHO 2007 (5-19 سنة)';
    if (effectiveStandard === 'CDC') return 'CDC 2022';
    return 'WHO 2006';
  })();

  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);

    const records$ = watchQuery<PediatricGrowthChart>((db) => {
      return db.get('pediatric_growth_charts').query(
        Q.where('patient_id', patientId),
        Q.sortBy('record_date', 'asc'),
      );
    }).pipe(
      map((records) => records.slice(0, 30)),
    );

    const stream = combineLatest([patient$, records$]).subscribe({
      next: ([p, records]) => {
        setPatient(p);
        setGrowthRecords(records);
        setIsLoading(false);
      },
      error: (err) => {
        console.error('Growth charts stream error:', err);
        showToast('خطأ في تحميل منحنيات النمو', 'error');
        setIsLoading(false);
      },
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  const wfaRef = useMemo(() => {
    if (effectiveStandard === 'WHO_2007_Adolescent') {
      const infant = getReferenceData(gender, 'wfa');
      const adolescent = generateReferenceCurve(getAdolescentRefData(gender, 'wfa'));
      return [...infant, ...adolescent];
    }
    if (effectiveStandard === 'CDC') {
      return generateReferenceCurve(getCdcRefData(gender, 'wfa'));
    }
    return getReferenceData(gender, 'wfa');
  }, [gender, effectiveStandard]);

  const lhfaRef = useMemo(() => {
    if (effectiveStandard === 'WHO_2007_Adolescent') {
      const infant = getReferenceData(gender, 'lhfa');
      const adolescent = generateReferenceCurve(getAdolescentRefData(gender, 'lhfa'));
      return [...infant, ...adolescent];
    }
    if (effectiveStandard === 'CDC') {
      return generateReferenceCurve(getCdcRefData(gender, 'lhfa'));
    }
    return getReferenceData(gender, 'lhfa');
  }, [gender, effectiveStandard]);

  const bmifaRef = useMemo(() => {
    if (effectiveStandard === 'WHO_2007_Adolescent') {
      return generateReferenceCurve(getAdolescentRefData(gender, 'bmifa'));
    }
    if (effectiveStandard === 'CDC') {
      return generateReferenceCurve(getCdcRefData(gender, 'bmifa'));
    }
    return getReferenceData(gender, 'bmifa');
  }, [gender, effectiveStandard]);

  const wfaData = useMemo(
    () => mergeChartData(wfaRef, growthRecords, (r) => r.weightKg ?? null),
    [wfaRef, growthRecords],
  );

  const lhfaData = useMemo(
    () => mergeChartData(lhfaRef, growthRecords, (r) => r.heightCm ?? null),
    [lhfaRef, growthRecords],
  );

  const bmifaData = useMemo(() => {
    return mergeChartData(bmifaRef, growthRecords, (r) => {
      if (r.weightKg != null && r.heightCm != null && r.heightCm > 0) {
        return r.weightKg / ((r.heightCm / 100) * (r.heightCm / 100));
      }
      return null;
    });
  }, [bmifaRef, growthRecords]);

  const latestRecord = useMemo(() => {
    if (growthRecords.length === 0) return null;
    return growthRecords.reduce((latest, r) =>
      r.recordDate.getTime() > latest.recordDate.getTime() ? r : latest,
    );
  }, [growthRecords]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
  }, []);

  useEffect(() => {
    if (!latestRecord || !latestRecord.heightCm || latestRecord.heightCm <= 0) {
      setStuntingResult(null);
      return;
    }
    PediatricZScoreEngine.calculateStuntingIndex(
      ageMonths,
      latestRecord.heightCm,
      gender,
      effectiveStandard,
    ).then(setStuntingResult);
  }, [ageMonths, latestRecord, gender, effectiveStandard]);

  const latestBmi = useMemo(() => {
    if (!latestRecord?.weightKg || !latestRecord?.heightCm || latestRecord.heightCm <= 0) return null;
    return latestRecord.weightKg / ((latestRecord.heightCm / 100) * (latestRecord.heightCm / 100));
  }, [latestRecord]);

  useEffect(() => {
    if (latestBmi == null) {
      setExtendedBmiResult(null);
      return;
    }
    const result = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(latestBmi, ageMonths, gender);
    setExtendedBmiResult(result);
  }, [latestBmi, ageMonths, gender]);

  if (isLoading && growthRecords.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل بيانات منحنيات النمو...</ArabicText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ArabicText bold style={styles.headerTitle}>منحنيات النمو للأطفال</ArabicText>
          {patient && (
            <ArabicText style={styles.headerSubtitle}>
              {patient.fullName} | {patient.fileNumber}
            </ArabicText>
          )}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {patient && (
          <View style={styles.demographicsCard}>
            <ArabicText bold style={styles.cardTitle}>بيانات المريض</ArabicText>
            <View style={styles.demographicsGrid}>
              <ArabicText style={styles.demoText}>العمر: {patient.age} سنة ({ageMonths} شهر)</ArabicText>
              <ArabicText style={styles.demoText}>الجنس: {gender === 'male' ? 'ذكر' : 'أنثى'}</ArabicText>
            </View>
            <ArabicText style={styles.demoText}>المرجع المعتمد: {standardLabelAr}</ArabicText>
            <ArabicText style={styles.demoText}>إجمالي القياسات المسجلة: {growthRecords.length}</ArabicText>
          </View>
        )}

        {patient && (
          <View style={styles.toggleCard}>
            <ArabicText bold style={styles.toggleCardTitle}>اختيار مرجع مخططات النمو</ArabicText>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity
                style={[
                  styles.tabToggleButton,
                  effectiveStandard === 'CDC' && styles.tabToggleButtonActive,
                ]}
                onPress={() => setSelectedStandard('CDC')}
                activeOpacity={0.7}
              >
                <ArabicText
                  bold={effectiveStandard === 'CDC'}
                  style={[
                    styles.tabToggleText,
                    effectiveStandard === 'CDC' && styles.tabToggleTextActive,
                  ]}
                >
                  مخطط CDC (الموسع)
                </ArabicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabToggleButton,
                  (effectiveStandard === 'WHO' || effectiveStandard === 'WHO_2007_Adolescent') && styles.tabToggleButtonActive,
                ]}
                onPress={() => setSelectedStandard(ageMonths > 60 ? 'WHO_2007_Adolescent' : 'WHO')}
                activeOpacity={0.7}
              >
                <ArabicText
                  bold={effectiveStandard !== 'CDC'}
                  style={[
                    styles.tabToggleText,
                    effectiveStandard !== 'CDC' && styles.tabToggleTextActive,
                  ]}
                >
                  مخطط WHO (القياسي)
                </ArabicText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showForm && patient && (
          <PediatricMeasurementForm
            patientId={patientId}
            gender={gender}
            ageMonths={ageMonths}
            onSave={handleRefresh}
            standard={effectiveStandard}
          />
        )}

        {growthRecords.length === 0 && !showForm && (
          <View style={styles.emptyCard}>
            <Ionicons name="trending-up" size={48} color="#94A3B8" />
            <ArabicText style={styles.emptyText}>
              لا توجد قياسات نمو مسجلة. اضغط على زر + أعلاه لإضافة أول قياس.
            </ArabicText>
          </View>
        )}

        {growthRecords.length > 0 && (
          <>
            {renderGrowthChart(
              'الوزن حسب العمر (Weight-for-Age)',
              `منحنيات ${standardLabelAr} - الخطوط: -3SD, -2SD, Median, +2SD, +3SD`,
              wfaData,
              'الوزن (كجم)',
              [0, 30],
              'weightZScore',
              latestRecord,
              undefined,
              effectiveStandard === 'WHO_2007_Adolescent',
            )}

            {lhfaData.some((d) => d.patient != null) && renderGrowthChart(
              'الطول حسب العمر (Length/Height-for-Age)',
              `منحنيات ${standardLabelAr} - تقييم القزامة (Stunting)`,
              lhfaData,
              'الطول (سم)',
              [40, 120],
              'heightZScore',
              latestRecord,
              'p15',
              effectiveStandard === 'WHO_2007_Adolescent',
            )}

            {stuntingResult && (
              <View style={[styles.card, styles.stuntingCard]}>
                <ArabicText bold style={styles.cardTitle}>🧬 مؤشر التقزم (Stunting Index)</ArabicText>
                <View style={styles.stuntingRow}>
                  <View style={styles.stuntingBadge}>
                    <ArabicText style={styles.stuntingLabel}>Z-Score</ArabicText>
                    <Text style={[styles.stuntingValue, {
                      color: stuntingResult.level === 'severe' ? '#DC2626'
                        : stuntingResult.level === 'moderate' ? '#F97316'
                        : stuntingResult.level === 'at_risk' ? '#EAB308'
                        : '#4ADE80',
                    }]}>
                      {stuntingResult.zScore.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.stuntingBadge}>
                    <ArabicText style={styles.stuntingLabel}>التصنيف</ArabicText>
                    <Text style={[styles.stuntingValue, {
                      color: stuntingResult.level === 'severe' ? '#DC2626'
                        : stuntingResult.level === 'moderate' ? '#F97316'
                        : stuntingResult.level === 'at_risk' ? '#EAB308'
                        : '#4ADE80',
                    }]}>
                      {stuntingResult.label}
                    </Text>
                  </View>
                </View>
                {stuntingResult.level !== 'normal' && (
                  <View style={styles.stuntingDirective}>
                    <Ionicons name="warning" size={16} color="#F97316" />
                    <ArabicText style={styles.stuntingDirectiveText}>
                      {stuntingResult.directive}
                    </ArabicText>
                  </View>
                )}
              </View>
            )}

            {extendedBmiResult && extendedBmiResult.classification !== 'normal' && extendedBmiResult.classification !== 'unknown' && (
              <View style={[styles.card, { borderColor: BMI_EXTENDED_COLORS[extendedBmiResult.classification], borderWidth: 1.5 }]}>
                <ArabicText bold style={styles.cardTitle}>
                  🧬 CDC 2022 التصنيف الموسع (Extended BMI)
                </ArabicText>
                <View style={styles.stuntingRow}>
                  <View style={styles.stuntingBadge}>
                    <ArabicText style={styles.stuntingLabel}>BMI: {extendedBmiResult.bmi.toFixed(1)}</ArabicText>
                    <Text style={[styles.stuntingValue, { color: BMI_EXTENDED_COLORS[extendedBmiResult.classification] }]}>
                      {extendedBmiResult.bmiP95Percent.toFixed(1)}% من 95th %ile
                    </Text>
                  </View>
                  <View style={styles.stuntingBadge}>
                    <ArabicText style={styles.stuntingLabel}>التصنيف</ArabicText>
                    <Text style={[styles.stuntingValue, { color: BMI_EXTENDED_COLORS[extendedBmiResult.classification] }]}>
                      {extendedBmiResult.classificationLabelAr}
                    </Text>
                  </View>
                </View>
                <View style={[styles.stuntingDirective, { borderColor: BMI_EXTENDED_COLORS[extendedBmiResult.classification], backgroundColor: '#1C1917' }]}>
                  <Ionicons name="warning" size={16} color={BMI_EXTENDED_COLORS[extendedBmiResult.classification]} />
                  <ArabicText style={[styles.stuntingDirectiveText, { color: BMI_EXTENDED_COLORS[extendedBmiResult.classification] }]}>
                    {extendedBmiResult.classification === 'class_ii_severe_obesity'
                      ? 'سمنة شديدة درجة ثانية — متابعة مكثفة، تقييم مضاعفات السمنة، تحويل لأخصائي غدد صماء أطفال'
                      : extendedBmiResult.classification === 'class_iii_severe_obesity'
                        ? 'سمنة شديدة درجة ثالثة — تدخل عاجل متعدد التخصصات، تقييم السكري/ارتفاع الضغط/الكبد الدهني'
                        : 'متابعة منتظمة مع تقييم نمط الحياة والنظام الغذائي'}
                  </ArabicText>
                </View>
              </View>
            )}

            {bmifaData.some((d) => d.patient != null) && renderGrowthChart(
              'مؤشر كتلة الجسم (BMI-for-Age)',
              `منحنيات ${standardLabelAr} - تقييم السمنة والهزال`,
              bmifaData,
              'BMI (kg/m²)',
              [10, (() => {
                const maxPatient = Math.max(...bmifaData.filter(d => d.patient != null).map(d => d.patient!));
                return Math.max(28, Math.ceil(maxPatient / 5) * 5 + 5);
              })()],
              'bmiZScore',
              latestRecord,
              undefined,
              effectiveStandard === 'WHO_2007_Adolescent',
            )}

            {growthRecords.length > 0 && (
              <View style={styles.card}>
                <ArabicText bold style={styles.cardTitle}>📋 سجل القياسات</ArabicText>
                <View style={styles.tableHeader}>
                  <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.2 }]}>التاريخ</ArabicText>
                  <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>العمر</ArabicText>
                  <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>الوزن</ArabicText>
                  <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>الطول</ArabicText>
                  <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>Z (وزن)</ArabicText>
                </View>
                {[...growthRecords].reverse().map((record) => {
                  const isSelected = selectedRecord === record.id;
                  const d = new Date(record.recordDate);
                  const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                  return (
                    <TouchableOpacity
                      key={record.id}
                      style={[styles.tableRow, isSelected && styles.tableRowSelected]}
                      onPress={() => setSelectedRecord(isSelected ? null : record.id)}
                      activeOpacity={0.7}
                    >
                      <ArabicText style={[styles.tableCell, { flex: 1.2 }]}>{dateStr}</ArabicText>
                      <ArabicText style={[styles.tableCell, { flex: 1 }]}>{record.ageMonths}m</ArabicText>
                      <ArabicText style={[styles.tableCell, { flex: 1 }]}>{record.weightKg?.toFixed(1) ?? '-'}</ArabicText>
                      <ArabicText style={[styles.tableCell, { flex: 1 }]}>{record.heightCm?.toFixed(1) ?? '-'}</ArabicText>
                      <Text style={[
                        styles.tableCell,
                        {
                          flex: 1,
                          color: record.weightZScore != null
                            ? (Math.abs(record.weightZScore) >= 2 ? '#EF4444' : '#34D399')
                            : '#94A3B8',
                          fontWeight: 'bold',
                        },
                      ]}>
                        {record.weightZScore != null ? record.weightZScore.toFixed(2) : '-'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>📘 توجيهات سريرية</ArabicText>
              <ArabicText style={styles.clinicalNote}>
                • المرجع المعتمد: {standardLabelAr}.{'\n'}
                {'\n'}• الأطفال {'<'} 24 شهراً: WHO 2006 (وزن/طول/BMI حسب العمر).{'\n'}
                {'\n'}• الأطفال 24–60 شهراً: CDC 2022 (وزن/طول/BMI حسب العمر).{'\n'}
                {'\n'}• المراهقون 5–19 سنة: WHO 2007 (مؤشر كتلة الجسم فقط).{'\n'}
                {'\n'}• Z-Score {'<'} -2 يشير إلى نقص النمو ويتطلب تقييماً فورياً.{'\n'}
                {'\n'}• Z-Score {'>'} +2 يشير إلى زيادة مفرطة في الوزن/السمنة.{'\n'}
                {'\n'}• المنحنيات: أحمر = ±3SD, برتقالي = ±2SD, أخضر = Median.{'\n'}
                {'\n'}• النقطة الزرقاء تمثل قياسات المريض الفعلية.
              </ArabicText>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: safeHeaderPaddingTop,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  backButton: {
    padding: spacing.xs,
  },
  addButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  loadingText: {
    marginTop: spacing.md,
    color: '#94A3B8',
    fontFamily: fontFamilies.regular,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  demographicsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 15,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
    marginBottom: spacing.md,
    fontFamily: fontFamilies.regular,
  },
  demographicsGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  demoText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartWrapper: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  noDataText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    paddingVertical: spacing.lg,
    fontFamily: fontFamilies.regular,
  },
  zBadgeRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  zBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  zBadgeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fontFamilies.regular,
  },
  zBadgeValue: {
    fontSize: 12,
    fontFamily: fontFamilies.bold,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    alignItems: 'center',
  },
  tableRowSelected: {
    backgroundColor: '#243044',
    borderRadius: 6,
  },
  tableCell: {
    fontSize: 11,
    color: '#E2E8F0',
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    fontFamily: fontFamilies.regular,
  },
  tooltipContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
  },
  tooltipAge: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    fontFamily: fontFamilies.regular,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 1,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontFamily: fontFamilies.regular,
  },
  clinicalNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    lineHeight: 18,
    marginTop: spacing.sm,
    fontFamily: fontFamilies.regular,
  },
  stuntingCard: {
    borderColor: '#F97316',
    borderWidth: 1.5,
  },
  stuntingRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stuntingBadge: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stuntingLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: fontFamilies.regular,
    marginBottom: 4,
  },
  stuntingValue: {
    fontSize: 16,
    fontFamily: fontFamilies.bold,
  },
  stuntingDirective: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: '#1C1917',
    borderRadius: 8,
    padding: spacing.sm,
  },
  stuntingDirectiveText: {
    fontSize: 12,
    color: '#F97316',
    flex: 1,
    fontFamily: fontFamilies.regular,
    textAlign: 'right',
  },
  transitionNote: {
    backgroundColor: '#1E1B2E',
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderStyle: 'dashed' as any,
  },
  transitionNoteText: {
    fontSize: 10,
    color: '#A78BFA',
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
  toggleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleCardTitle: {
    fontSize: 14,
    color: '#F8FAFC',
    textAlign: 'right',
    marginBottom: spacing.sm,
    fontFamily: fontFamilies.bold,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabToggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabToggleButtonActive: {
    backgroundColor: '#1A5276',
  },
  tabToggleText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamilies.regular,
  },
  tabToggleTextActive: {
    color: '#F8FAFC',
  },
});
