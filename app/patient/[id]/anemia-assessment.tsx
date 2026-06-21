import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useBeforeRemoveGuard } from '../../../src/presentation/hooks/useBeforeRemoveGuard';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import {
  useAnemiaAssessmentPersister,
} from '../../../src/presentation/hooks/useAnemiaAssessmentPersister';
import type { AnemiaFormState } from '../../../src/presentation/hooks/useAnemiaAssessmentPersister';

const severityLabels: Record<string, string> = {
  none: 'طبيعي (لا يوجد فقر دم)',
  mild: 'فقر دم خفيف (Mild)',
  moderate: 'فقر دم متوسط (Moderate)',
  severe: 'فقر دم شديد (Severe)',
  critical: 'حرج جداً (Critical)',
};

const typeLabels: Record<string, string> = {
  iron_deficiency: 'نقص الحديد (IDA)',
  b12_deficiency: 'نقص B12',
  folate_deficiency: 'نقص الفوليك',
  mixed_deficiency: 'فقر دم مختلط (نقص متعدد)',
  hemolytic: 'تحللي',
  sickle_cell: 'منجلي',
  chronic_disease: 'أمراض مزمنة',
  unknown: 'غير محدد',
};

export default function AnemiaAssessmentScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  const {
    formState,
    setField,
    computed,
    isDirty,
    isSaving,
    isLoading,
    saveImmediate,
  } = useAnemiaAssessmentPersister(patientId);

  const handleSave = useCallback(async () => {
    try {
      await saveImmediate();
      Alert.alert('نجاح', 'تم حفظ تقييم فقر الدم والدمويات بنجاح ✅');
      router.back();
    } catch {
      Alert.alert('خطأ', 'فشل حفظ بيانات التقييم.');
    }
  }, [saveImmediate, router]);

  useBeforeRemoveGuard(navigation, isDirty, saveImmediate);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.danger} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.danger }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تقييم فقر الدم والدمويات</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Lab Panel */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>التحاليل المخبرية والدمويات</Text>

          <View style={styles.formGrid}>
            <View style={styles.formItemFull}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>الهيموجلوبين (Hb):</Text>
              <View style={styles.inputWithToggle}>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, flex: 1 }]}
                  value={formState.hemoglobin}
                  onChangeText={(v) => setField('hemoglobin', v)}
                  keyboardType="numeric"
                  placeholder="مثال: 11.2"
                />
                <View style={styles.toggleGroup}>
                  {(['g/dL', 'g/L'] as const).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.toggleBtn,
                        { borderColor: theme.border },
                        formState.hemoglobinUnit === unit && {
                          backgroundColor: colors.danger,
                          borderColor: colors.danger,
                        },
                      ]}
                      onPress={() => setField('hemoglobinUnit', unit)}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          { color: theme.text },
                          formState.hemoglobinUnit === unit && { color: '#FFF' },
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>حديد المصل (Serum Iron):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.serumIron}
                onChangeText={(v) => setField('serumIron', v)}
                keyboardType="numeric"
                placeholder="µg/dL"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>TIBC:</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.tibc}
                onChangeText={(v) => setField('tibc', v)}
                keyboardType="numeric"
                placeholder="µg/dL"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>الفيريتين (Ferritin):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.ferritin}
                onChangeText={(v) => setField('ferritin', v)}
                keyboardType="numeric"
                placeholder="ng/mL"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>فيتامين B12:</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.vitaminB12}
                onChangeText={(v) => setField('vitaminB12', v)}
                keyboardType="numeric"
                placeholder="pg/mL"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>فوليك المصل (Folate):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.serumFolate}
                onChangeText={(v) => setField('serumFolate', v)}
                keyboardType="numeric"
                placeholder="ng/mL"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>الحجم الكروي (MCV):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.mcv}
                onChangeText={(v) => setField('mcv', v)}
                keyboardType="numeric"
                placeholder="fL"
              />
            </View>
          </View>
        </View>

        {/* RBC Indices */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>فهرس الكريات الحمراء (RBC Indices)</Text>
          <View style={styles.formGrid}>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>MCH (pg):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.mch}
                onChangeText={(v) => setField('mch', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>MCHC (g/dL):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.mchc}
                onChangeText={(v) => setField('mchc', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>RDW (%):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.rdw}
                onChangeText={(v) => setField('rdw', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>خلايا شبكية (%):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.reticulocyteCount}
                onChangeText={(v) => setField('reticulocyteCount', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>كريات بيض (WBC):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.leukocyteCount}
                onChangeText={(v) => setField('leukocyteCount', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>صفائح (Platelets):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.plateletCount}
                onChangeText={(v) => setField('plateletCount', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Symptoms Panel */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>الأعراض السريرية الظاهرة</Text>

          <View style={styles.switchGrid}>
            {([
              ['hasFatigue', 'التعب والإرهاق المستمر (Fatigue)'],
              ['hasWeakness', 'الضعف العام (Weakness)'],
              ['hasDyspnea', 'ضيق التنفس عند الجهد (Dyspnea)'],
              ['hasPalpitations', 'خفقان القلب السريع (Palpitations)'],
              ['hasHeadache', 'الصداع المستمر (Headache)'],
              ['hasDizziness', 'الدوار/الدوخة (Dizziness)'],
              ['hasColdIntolerance', 'عدم تحمل البرودة (Cold Intolerance)'],
              ['hasPallor', 'شحوب الجلد/الملتحمة (Pallor)'],
              ['hasKoilonychia', 'تأثر الأظافر - تقعر الأظافر (Koilonychia)'],
              ['hasGlossitis', 'التهاب لسان المريض (Glossitis)'],
            ] as const).map(([key, label]) => (
              <View key={key} style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>{label}</Text>
                <Switch
                  value={formState[key] as boolean}
                  onValueChange={(v) => setField(key as keyof AnemiaFormState, v)}
                  trackColor={{ true: colors.danger }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Risk factors and diet panel */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>عوامل الخطورة والنمط الغذائي</Text>

          <View style={styles.switchGrid}>
            {([
              ['hasMenstruation', 'مريضة في سن الحيض (Menstruation)'],
              ['isPregnant', 'حامل (Pregnant)'],
              ['isLactating', 'مرضعة (Lactating)'],
              ['hasGIBleeding', 'وجود نزيف معوي/داخلي (GI Bleeding)'],
              ['hasChronicDisease', 'أمراض مزمنة (فشل كلوي/أورام)'],
              ['isVegetarian', 'نباتي (Vegetarian)'],
              ['isVegan', 'نباتي صرف (Vegan)'],
              ['hasMalnutrition', 'وجود مؤشرات سوء تغذية عامة'],
            ] as const).map(([key, label]) => (
              <View key={key} style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>{label}</Text>
                <Switch
                  value={formState[key] as boolean}
                  onValueChange={(v) => setField(key as keyof AnemiaFormState, v)}
                  trackColor={{ true: colors.danger }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Dietary intakes */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>المدخول الغذائي التقديري</Text>
          <View style={styles.formGrid}>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>متوسط الحديد (ملغ/يوم):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.avgIronIntake}
                onChangeText={(v) => setField('avgIronIntake', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>متوسط B12 (مكغ/يوم):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.avgB12Intake}
                onChangeText={(v) => setField('avgB12Intake', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formItem}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>متوسط الفوليك (مكغ/يوم):</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={formState.avgFolateIntake}
                onChangeText={(v) => setField('avgFolateIntake', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.inputLabel, { color: theme.text, textAlign: 'right', marginBottom: spacing.sm }]}>
              النمط الغذائي:
            </Text>
            <View style={styles.toggleGroup}>
              {([
                ['regular', 'عادي'],
                ['vegetarian', 'نباتي'],
                ['vegan', 'نباتي صرف'],
                ['restricted', 'مقيد'],
              ] as const).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.patternToggle,
                    formState.dietaryPattern === value && {
                      backgroundColor: colors.danger,
                    },
                  ]}
                  onPress={() => setField('dietaryPattern', value)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: theme.text },
                      formState.dietaryPattern === value && { color: '#FFF' },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* CDSS clinical guidance box */}
        <View
          style={[styles.cdssBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger }]}
        >
          <Text style={[styles.cdssTitle, { color: colors.danger }]}>
            <Ionicons name="medical-outline" size={16} /> الدعم السريري التلقائي (CDSS)
          </Text>
          <View style={styles.cdssContent}>
            <Text style={[styles.cdssText, { color: theme.text }]}>
              تصنيف شدة فقر الدم:{' '}
              <Text style={{ fontWeight: 'bold' }}>{severityLabels[computed.severity]}</Text>
            </Text>
            <Text style={[styles.cdssText, { color: theme.text }]}>
              المسار الدموي المرجح:{' '}
              <Text style={{ fontWeight: 'bold' }}>{typeLabels[computed.anemiaType]}</Text>
            </Text>
            <Text style={[styles.cdssText, { color: theme.text }]}>
              نسبة تشبع الترانسفيرين:{' '}
              <Text style={{ fontWeight: 'bold' }}>{computed.transferrinSaturation}%</Text>
            </Text>
          </View>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.danger }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>حفظ واعتماد التقييم السريري</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 70,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  backButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.bold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  formGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  formItem: {
    width: '46%',
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  formItemFull: {
    width: '100%',
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: fontSizes.md,
    textAlign: 'right',
    width: '100%',
  },
  inputWithToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
    gap: spacing.sm,
  },
  toggleGroup: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternToggle: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  switchGrid: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  switchLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  cdssBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  cdssTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  cdssContent: {
    gap: 4,
    alignItems: 'flex-end',
  },
  cdssText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
