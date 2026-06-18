import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '../../data/database';
import { PediatricZScoreEngine } from '../../domain/calculators/PediatricZScoreEngine';
import { computeZScoreFromReference, zScoreLabelAr } from '../../domain/data/whoGrowthReference';
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
}

export default function PediatricMeasurementForm({
  patientId,
  gender,
  ageMonths,
  onSave,
}: PediatricMeasurementFormProps) {
  const showToast = useToastStore((s) => s.showToast);

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [zResults, setZResults] = useState<IZScoreDisplay[]>([]);

  const resetForm = useCallback(() => {
    setWeightKg('');
    setHeightCm('');
    setHeadCircumference('');
    setZResults([]);
  }, []);

  async function computeZScore(
    value: number,
    indicator: 'wfa' | 'lhfa' | 'bmifa',
  ): Promise<IZScoreDisplay> {
    const labels: Record<string, { indicator: string; indicatorAr: string }> = {
      wfa: { indicator: 'wfa', indicatorAr: 'الوزن حسب العمر' },
      lhfa: { indicator: 'lhfa', indicatorAr: 'الطول حسب العمر' },
      bmifa: { indicator: 'bmifa', indicatorAr: 'مؤشر كتلة الجسم' },
    };

    const engine = await PediatricZScoreEngine.calculateZScore({
      gender,
      indicatorType: indicator,
      measurementValue: value,
      ageMonths,
      lengthHeightCm: heightCm ? parseFloat(heightCm) : undefined,
    });

    let zScore: number;
    let classification: string;

    if (engine.isSafe) {
      zScore = engine.zScore;
      classification = engine.classification;
    } else {
      const fallback = computeZScoreFromReference(value, ageMonths, gender, indicator);
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
      results.push(wfaResult);

      if (h > 0) {
        const lhfaResult = await computeZScore(h, 'lhfa');
        results.push(lhfaResult);

        const bmi = w / ((h / 100) * (h / 100));
        const bmifaResult = await computeZScore(bmi, 'bmifa');
        results.push(bmifaResult);
      }

      setZResults(results);

      const db = await getDatabase();
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
          record.chartType = 'who';
          record.source = 'manual_entry';

          const wfa = results.find((r) => r.indicator === 'wfa');
          if (wfa) record.weightZScore = wfa.zScore;

          const lhfa = results.find((r) => r.indicator === 'lhfa');
          if (lhfa) record.heightZScore = lhfa.zScore;

          if (h > 0 && w > 0) {
            const bmi = w / ((h / 100) * (h / 100));
            const bmifa = results.find((r) => r.indicator === 'bmifa');
            if (bmifa) record.bmiZScore = bmifa.zScore;
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
  }, [weightKg, heightCm, headCircumference, ageMonths, gender, patientId, onSave, resetForm, showToast]);

  return (
    <View style={styles.container}>
      <ArabicText bold style={styles.title}>➕ إضافة قياسات نمو جديدة</ArabicText>

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
});
