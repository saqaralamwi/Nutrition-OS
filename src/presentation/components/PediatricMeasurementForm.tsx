import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '../../data/database';
import { PediatricZScoreEngine } from '../../domain/calculators/PediatricZScoreEngine';
import type { GrowthStandard } from '../../domain/calculators/PediatricZScoreEngine';
import { computeZScoreFromReference, generateReferenceCurve, zScoreLabelAr } from '../../domain/data/whoGrowthReference';
import type { ReferenceDataPoint } from '../../domain/data/whoGrowthReference';
import { getAdolescentRefData } from '../../domain/data/adolescentRefData';
import { Cdc2022ExtendedBmiEngine, BMI_EXTENDED_COLORS } from '../../domain/calculators/Cdc2022ExtendedBmiEngine';
import type { IExtendedBmiResult } from '../../domain/calculators/Cdc2022ExtendedBmiEngine';
import { colors, spacing, fontFamilies } from '../theme';
import ArabicText from './ArabicText';
import TextInputField from './TextInputField';
import Button from './Button';
import { useToastStore } from '../stores/toastStore';

interface IZScoreDisplay {
  indicator: string;
  indicatorAr: string;
  zScore: number;
  classification: string;
  label: string;
  color: string;
}

interface PediatricMeasurementFormProps {
  patientId: string;
  gender: 'male' | 'female';
  ageMonths: number;
  onSave: () => void;
  standard?: GrowthStandard;
}

function computeZScoreFromAdolescentRef(
  value: number,
  ageMonths: number,
  gender: 'male' | 'female',
  indicator: 'lhfa' | 'bmifa',
): { zScore: number; classification: ReturnType<typeof zScoreLabelAr> } {
  const lmsData = getAdolescentRefData(gender, indicator);
  const refData = generateReferenceCurve(lmsData);
  const idx = refData.reduce((best, p, i) =>
    Math.abs(p.ageMonthsOrCm - ageMonths) < Math.abs(refData[best].ageMonthsOrCm - ageMonths) ? i : best, 0);
  const point = refData[idx];
  const sdScale = (point.plus2 - point.minus2) / 4;
  const z = sdScale > 0 ? (value - point.median) / sdScale : 0;
  const clamped = Math.max(-5, Math.min(5, z));
  return { zScore: Math.round(clamped * 100) / 100, classification: zScoreLabelAr(clamped) };
}

export default function PediatricMeasurementForm({
  patientId,
  gender,
  ageMonths,
  onSave,
  standard: standardProp,
}: PediatricMeasurementFormProps) {
  const showToast = useToastStore((s) => s.showToast);

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [zResults, setZResults] = useState<IZScoreDisplay[]>([]);
  const [extendedBmi, setExtendedBmi] = useState<IExtendedBmiResult | null>(null);
  const [standard] = useState<GrowthStandard>(() => {
    if (standardProp) return standardProp;
    if (ageMonths > 60) return 'WHO_2007_Adolescent';
    if (ageMonths >= 24) return 'CDC';
    return 'WHO';
  });

  const resetForm = useCallback(() => {
    setWeightKg('');
    setHeightCm('');
    setHeadCircumference('');
    setZResults([]);
    setExtendedBmi(null);
  }, []);

  async function computeZScore(
    value: number,
    indicator: 'wfa' | 'lhfa' | 'bmifa',
  ): Promise<IZScoreDisplay | null> {
    const labels: Record<string, { indicator: string; indicatorAr: string }> = {
      wfa: { indicator: 'wfa', indicatorAr: 'الوزن حسب العمر' },
      lhfa: { indicator: 'lhfa', indicatorAr: 'الطول حسب العمر' },
      bmifa: { indicator: 'bmifa', indicatorAr: 'مؤشر كتلة الجسم' },
    };

    try {
      const engine = await PediatricZScoreEngine.calculateZScore({
        gender,
        indicatorType: indicator,
        measurementValue: value,
        ageMonths,
        lengthHeightCm: heightCm ? parseFloat(heightCm) : undefined,
        standard,
      });

      if (!engine || typeof engine.zScore !== 'number') {
        throw new Error('Engine returned invalid result');
      }

      let zScore: number;
      let classification: string;

      if (engine.isSafe) {
        zScore = engine.zScore;
        classification = engine.classification;
      } else {
        const fallback = ageMonths > 60 && indicator !== 'wfa'
          ? computeZScoreFromAdolescentRef(value, ageMonths, gender, indicator)
          : computeZScoreFromReference(value, ageMonths, gender, indicator);
        zScore = fallback.zScore;
        classification = fallback.classification;
      }

      const abs = Math.abs(zScore);
      const color = abs >= 3 ? '#EF4444' : abs >= 2 ? '#F59E0B' : '#34D399';

      return {
        ...labels[indicator],
        zScore,
        classification,
        label: zScoreLabelAr(zScore),
        color,
      };
    } catch (err) {
      console.error(`computeZScore error for ${indicator}:`, err);
      const fallback = ageMonths > 60 && indicator !== 'wfa'
        ? computeZScoreFromAdolescentRef(value, ageMonths, gender, indicator)
        : computeZScoreFromReference(value, ageMonths, gender, indicator);
      const abs = Math.abs(fallback.zScore);
      const color = abs >= 3 ? '#EF4444' : abs >= 2 ? '#F59E0B' : '#34D399';
      return {
        ...labels[indicator],
        zScore: fallback.zScore,
        classification: fallback.classification,
        label: zScoreLabelAr(fallback.zScore),
        color,
      };
    }
  }

  const handleSubmit = useCallback(async () => {
    const w = parseFloat(weightKg);
    const h = heightCm ? parseFloat(heightCm) : 0;
    const hc = headCircumference ? parseFloat(headCircumference) : 0;

    if (!w || w <= 0) {
      showToast('الرجاء إدخال الوزن', 'error');
      return;
    }
    if (ageMonths < 0) {
      showToast('عمر المريض غير صحيح', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const results: IZScoreDisplay[] = [];

      const wfaResult = await computeZScore(w, 'wfa');
      if (wfaResult) results.push(wfaResult);

      if (h > 0) {
        const lhfaResult = await computeZScore(h, 'lhfa');
        if (lhfaResult) results.push(lhfaResult);

        const bmi = w / ((h / 100) * (h / 100));
        const bmifaResult = await computeZScore(bmi, 'bmifa');
        if (bmifaResult) results.push(bmifaResult);

        const extended = Cdc2022ExtendedBmiEngine.calculateExtendedBmiMetrics(bmi, ageMonths, gender);
        setExtendedBmi(extended);
      }

      setZResults(results);

      if (!results || results.length === 0) {
        showToast('تعذر حساب نتائج النمو — جميع الحسابات فشلت', 'error');
        setIsSaving(false);
        return;
      }

      const db = await getDatabase();
      if (!db) {
        showToast('خطأ في قاعدة البيانات', 'error');
        setIsSaving(false);
        return;
      }

      await db.write(async () => {
        const collection = db.get('pediatric_growth_charts');
        await collection.create((record: any) => {
          record.patientId = patientId;
          record.recordDate = new Date();
          record.ageMonths = ageMonths;
          record.weightKg = w;
          if (h > 0) record.heightCm = h;
          if (hc > 0) record.headCircumferenceCm = hc;
          record.gender = gender;
          record.chartType = standard === 'CDC' ? 'cdc' : 'who';
          record.standardUsed = standard;
          record.source = 'manual_entry';

          const safeFind = (indicator: string) =>
            Array.isArray(results) ? results.find((r) => r.indicator === indicator) : undefined;

          const wfa = safeFind('wfa');
          if (wfa) record.weightZScore = wfa.zScore;

          const lhfa = safeFind('lhfa');
          if (lhfa) record.heightZScore = lhfa.zScore;

          if (h > 0 && w > 0) {
            const bmifa = safeFind('bmifa');
            if (bmifa) record.bmiZScore = bmifa.zScore;

            if (extendedBmi && extendedBmi.classification !== 'unknown') {
              record.bmiP95Percent = extendedBmi.bmiP95Percent;
              record.bmiExtendedClassification = extendedBmi.classification;
            }
          }
        });
      });

      showToast('تم تسجيل قياسات النمو بنجاح', 'success');
      resetForm();
      onSave();
    } catch (error) {
      console.error('Save pediatric measurement error:', error);
      showToast('فشل في حفظ قياسات النمو', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [weightKg, heightCm, headCircumference, ageMonths, gender, patientId, onSave, resetForm, showToast, standard]);

  return (
    <View style={styles.container}>
      <ArabicText bold style={styles.title}>➕ إضافة قياسات نمو جديدة</ArabicText>

      <View style={styles.standardHint}>
        <Ionicons
          name="information-circle"
          size={14}
          color={colors.textDisabled}
        />
        <ArabicText style={styles.standardHintText}>
          {standard === 'WHO_2007_Adolescent'
            ? 'مرجع WHO 2007 للمراهقين (5–19 سنة) — BMI-for-age'
            : standard === 'CDC'
              ? 'مرجع CDC 2022 — موصى به للأطفال 24–60 شهراً'
              : 'مرجع WHO 2006 — موصى به للأطفال أقل من 24 شهراً'}
        </ArabicText>
      </View>

      <TextInputField
        label="الوزن (كجم)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="decimal-pad"
        placeholder="مثال: 12.5"
        required
      />

      <TextInputField
        label="الطول/الارتفاع (سم)"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="decimal-pad"
        placeholder="مثال: 86.0"
      />

      <TextInputField
        label="محيط الرأس (سم) - اختياري"
        value={headCircumference}
        onChangeText={setHeadCircumference}
        keyboardType="decimal-pad"
        placeholder="مثال: 48.0"
      />

      <Button
        title="💾 حساب Z-Score وحفظ القياسات"
        onPress={handleSubmit}
        loading={isSaving}
        variant="primary"
        style={{ marginTop: spacing.sm }}
      />

      {zResults.length > 0 && (
        <View style={styles.resultsCard}>
          <ArabicText bold style={styles.resultsTitle}>نتائج تحليل Z-Score</ArabicText>
          {zResults.map((r) => (
            <View key={r.indicator} style={styles.resultRow}>
              <View style={styles.resultHeader}>
                <View style={[styles.colorDot, { backgroundColor: r.color }]} />
                <ArabicText style={styles.resultIndicator}>{r.indicatorAr}</ArabicText>
              </View>
              <View style={styles.resultValues}>
                <ArabicText style={[styles.zScoreValue, { color: r.color }]}>
                  Z-Score: {r.zScore.toFixed(2)}
                </ArabicText>
                <ArabicText style={styles.classLabel}>{r.label}</ArabicText>
              </View>
            </View>
          ))}
        </View>
      )}

      {extendedBmi && extendedBmi.classification !== 'normal' && extendedBmi.classification !== 'unknown' && (
        <View style={styles.extendedBmiCard}>
          <View style={styles.extendedBmiHeader}>
            <View style={[styles.extendedBmiDot, { backgroundColor: BMI_EXTENDED_COLORS[extendedBmi.classification] }]} />
            <ArabicText bold style={styles.extendedBmiTitle}>
              CDC 2022 التصنيف الموسع (Extended BMI Classification)
            </ArabicText>
          </View>
          <View style={styles.extendedBmiRow}>
            <ArabicText style={styles.extendedBmiLabel}>BMI: {extendedBmi.bmi.toFixed(1)}</ArabicText>
            <ArabicText style={styles.extendedBmiLabel}>
              {extendedBmi.bmiP95Percent.toFixed(1)}% من percentile 95
            </ArabicText>
          </View>
          <View style={[styles.extendedBmiBadge, { borderColor: BMI_EXTENDED_COLORS[extendedBmi.classification] }]}>
            <ArabicText bold style={[styles.extendedBmiClassification, { color: BMI_EXTENDED_COLORS[extendedBmi.classification] }]}>
              {extendedBmi.classificationLabelAr}
            </ArabicText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  resultsCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  resultRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultIndicator: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  resultValues: {
    alignItems: 'flex-end',
  },
  zScoreValue: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  classLabel: {
    fontSize: 10,
    color: colors.textDisabled,
    fontFamily: fontFamilies.regular,
    marginTop: 1,
  },
  standardHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  standardHintText: {
    fontSize: 10,
    color: colors.textDisabled,
    fontFamily: fontFamilies.regular,
    flex: 1,
  },
  extendedBmiCard: {
    marginTop: spacing.md,
    backgroundColor: '#1C1917',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#78350F',
  },
  extendedBmiHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  extendedBmiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  extendedBmiTitle: {
    fontSize: 12,
    color: '#FBBF24',
    flex: 1,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  extendedBmiRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  extendedBmiLabel: {
    fontSize: 13,
    color: '#E2E8F0',
    fontFamily: fontFamilies.regular,
  },
  extendedBmiBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  extendedBmiClassification: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
});
