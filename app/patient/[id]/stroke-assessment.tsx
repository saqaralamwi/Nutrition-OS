import React, { useState, useEffect, useMemo } from 'react';
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
  Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import { colors, spacing, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import { useStrokeAssessment } from '../../../src/presentation/hooks/useStrokeAssessment';
import type { 
  StrokeType, 
  StrokeLocation, 
  StrokeSeverity, 
  DysphagiaSeverity, 
  FeedingRoute, 
  FoodConsistency 
} from '../../../src/domain/types/stroke';

export default function StrokeAssessmentScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  
  // Load patient
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  const { assessment, isLoading, createAssessment } = useStrokeAssessment(patientId);

  // Form states
  const [strokeType, setStrokeType] = useState<StrokeType>('ischemic');
  const [strokeLocation, setStrokeLocation] = useState<StrokeLocation>('left_hemisphere');
  const [severity, setSeverity] = useState<StrokeSeverity>('moderate');
  const [hoursSinceStrokeText, setHoursSinceStrokeText] = useState('12');
  const [gcsText, setGcsText] = useState('15');
  const [nseText, setNseText] = useState('0');
  const [hasDysphagia, setHasDysphagia] = useState(false);
  const [dysphagiaSeverity, setDysphagiaSeverity] = useState<DysphagiaSeverity>('none');
  const [waterSwallowTest, setWaterSwallowTest] = useState<'pass' | 'fail' | 'inconclusive'>('pass');
  const [coughReflex, setCoughReflex] = useState<'normal' | 'diminished' | 'absent'>('normal');
  const [feedingRoute, setFeedingRoute] = useState<FeedingRoute>('oral');
  const [foodConsistency, setFoodConsistency] = useState<FoodConsistency>('regular');
  const [needsEnteral, setNeedsEnteral] = useState(false);
  const [needsParenteral, setNeedsParenteral] = useState(false);
  const [oralIntakePercentText, setOralIntakePercentText] = useState('100');
  const [strokeDate, setStrokeDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync state once assessment is loaded
  useEffect(() => {
    if (assessment) {
      setStrokeType(assessment.strokeType);
      setStrokeLocation(assessment.strokeLocation);
      setSeverity(assessment.severity);
      setHoursSinceStrokeText(String(assessment.hoursSinceStroke));
      setGcsText(String(assessment.gcs));
      setNseText(String(assessment.nse));
      setHasDysphagia(assessment.hasDysphagia);
      setDysphagiaSeverity(assessment.dysphagiaSeverity);
      setWaterSwallowTest(assessment.waterSwallowTestResult);
      setCoughReflex(assessment.coughReflex);
      setFeedingRoute(assessment.feedingRoute);
      setFoodConsistency(assessment.foodConsistency);
      setNeedsEnteral(assessment.needsEnteralNutrition);
      setNeedsParenteral(assessment.needsParenteralNutrition);
      setOralIntakePercentText(String(assessment.oralIntakePercentage));
      setStrokeDate(assessment.strokeDate || new Date().toISOString().split('T')[0]);
    }
  }, [assessment]);

  const handleSave = async () => {
    try {
      const data = {
        patientId,
        strokeDate,
        strokeType,
        strokeLocation,
        severity,
        hoursSinceStroke: parseInt(hoursSinceStrokeText, 10) || 12,
        gcs: parseInt(gcsText, 10) || 15,
        nse: parseInt(nseText, 10) || 0,
        hasDysphagia,
        dysphagiaSeverity: hasDysphagia ? dysphagiaSeverity : 'none',
        waterSwallowTestResult: hasDysphagia ? waterSwallowTest : 'pass',
        coughReflex: hasDysphagia ? coughReflex : 'normal',
        feedingRoute,
        foodConsistency,
        needsEnteralNutrition: needsEnteral,
        needsParenteralNutrition: needsParenteral,
        oralIntakePercentage: parseInt(oralIntakePercentText, 10) || 100,
        createdAt: assessment?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createAssessment(data);
      Alert.alert('نجاح', 'تم حفظ تقييم السكتة الدماغية بنجاح');
      router.back();
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ تقييم السكتة الدماغية.');
    }
  };

  if (isLoading || !patient) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🧠 تقييم السكتة الدماغية</Text>
          <Text style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</Text>
        </View>

        <View style={styles.content}>
          {/* Section 1: Details */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>تفاصيل الإصابة الدماغية</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>تاريخ السكتة الدماغية:</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={strokeDate}
                onChangeText={setStrokeDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.subtext}
                textAlign="right"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>نوع السكتة الدماغية:</Text>
              <View style={styles.optionRow}>
                {(['ischemic', 'hemorrhagic', 'subarachnoid_hemorrhage', 'unknown'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      strokeType === type && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setStrokeType(type)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, strokeType === type && { color: '#FFF' }]}>
                      {type === 'ischemic' ? 'انسدادية' :
                       type === 'hemorrhagic' ? 'نزيفية' :
                       type === 'subarachnoid_hemorrhage' ? 'تحت العنكبوتية' : 'غير محدد'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>موقع الإصابة الدماغية:</Text>
              <View style={styles.optionRow}>
                {(['left_hemisphere', 'right_hemisphere', 'brainstem', 'cerebellum'] as const).map(loc => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      strokeLocation === loc && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setStrokeLocation(loc)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, strokeLocation === loc && { color: '#FFF' }]}>
                      {loc === 'left_hemisphere' ? 'نصف أيسر' :
                       loc === 'right_hemisphere' ? 'نصف أيمن' :
                       loc === 'brainstem' ? 'جذع الدماغ' : 'المخيخ'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>درجة شدة السكتة:</Text>
              <View style={styles.optionRow}>
                {(['mild', 'moderate', 'severe', 'massive'] as const).map(sev => (
                  <TouchableOpacity
                    key={sev}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      severity === sev && { 
                        backgroundColor: sev === 'mild' ? colors.success : sev === 'moderate' ? colors.warning : colors.danger,
                        borderColor: sev === 'mild' ? colors.success : sev === 'moderate' ? colors.warning : colors.danger
                      }
                    ]}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, severity === sev && { color: '#FFF' }]}>
                      {sev === 'mild' ? 'خفيف' :
                       sev === 'moderate' ? 'متوسط' :
                       sev === 'severe' ? 'شديد' : 'واسع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>عمر الإصابة (ساعات):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={hoursSinceStrokeText}
                  onChangeText={setHoursSinceStrokeText}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>مقياس NIHSS:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={nseText}
                  onChangeText={setNseText}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>وعي GCS:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={gcsText}
                  onChangeText={setGcsText}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>
          </View>

          {/* Section 2: Dysphagia */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.toggleRow}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>تقييم عسر وصعوبة البلع</Text>
              <TouchableOpacity
                style={[styles.toggleButton, hasDysphagia && { backgroundColor: colors.accentRose }]}
                onPress={() => setHasDysphagia(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {hasDysphagia ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            {hasDysphagia && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>درجة شدة عسر البلع:</Text>
                <View style={styles.optionRow}>
                  {(['none', 'mild', 'moderate', 'severe', 'cannot_eat'] as const).map(ds => (
                    <TouchableOpacity
                      key={ds}
                      style={[
                        styles.optionButton,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        dysphagiaSeverity === ds && { backgroundColor: colors.accentViolet, borderColor: colors.accentViolet }
                      ]}
                      onPress={() => setDysphagiaSeverity(ds)}
                    >
                      <Text style={[styles.optionText, { color: theme.text }, dysphagiaSeverity === ds && { color: '#FFF' }]}>
                        {ds === 'none' ? 'لا يوجد' :
                         ds === 'mild' ? 'خفيف' :
                         ds === 'moderate' ? 'متوسط' :
                         ds === 'severe' ? 'شديد' : 'لا يبتلع'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.gridRow, { marginTop: spacing.md }]}>
                  <View style={styles.gridCol}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>اختبار رشفة الماء:</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                      {(['pass', 'fail', 'inconclusive'] as const).map(wst => (
                        <TouchableOpacity
                          key={wst}
                          style={[
                            styles.smallOptionBtn,
                            { backgroundColor: theme.background, borderColor: theme.border },
                            waterSwallowTest === wst && {
                              backgroundColor: wst === 'pass' ? colors.success : wst === 'fail' ? colors.danger : colors.warning,
                              borderColor: wst === 'pass' ? colors.success : wst === 'fail' ? colors.danger : colors.warning,
                            }
                          ]}
                          onPress={() => setWaterSwallowTest(wst)}
                        >
                          <Text style={[styles.smallOptionText, { color: theme.text }, waterSwallowTest === wst && { color: '#FFF' }]}>
                            {wst === 'pass' ? 'نجاح' : wst === 'fail' ? 'فشل' : 'حائر'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>منعكس السعال:</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                      {(['normal', 'diminished', 'absent'] as const).map(cr => (
                        <TouchableOpacity
                          key={cr}
                          style={[
                            styles.smallOptionBtn,
                            { backgroundColor: theme.background, borderColor: theme.border },
                            coughReflex === cr && {
                              backgroundColor: cr === 'normal' ? colors.success : cr === 'diminished' ? colors.warning : colors.danger,
                              borderColor: cr === 'normal' ? colors.success : cr === 'diminished' ? colors.warning : colors.danger,
                            }
                          ]}
                          onPress={() => setCoughReflex(cr)}
                        >
                          <Text style={[styles.smallOptionText, { color: theme.text }, coughReflex === cr && { color: '#FFF' }]}>
                            {cr === 'normal' ? 'طبيعي' : cr === 'diminished' ? 'ضعيف' : 'غائب'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Section 3: Feeding Status */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>الحالة التغذوية ومسار التغذية</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>مسار التغذية الحالي (Route):</Text>
              <View style={styles.optionRow}>
                {(['oral', 'enteral_nasogastric', 'enteral_percutaneous', 'mixed'] as const).map(route => (
                  <TouchableOpacity
                    key={route}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      feedingRoute === route && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setFeedingRoute(route)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, feedingRoute === route && { color: '#FFF' }]}>
                      {route === 'oral' ? 'فموي' :
                       route === 'enteral_nasogastric' ? 'أنبوب أنفي NG' :
                       route === 'enteral_percutaneous' ? 'أنبوب معدي PEG' : 'مختلط'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>قوام الغذاء الموصى به (Consistency):</Text>
              <View style={styles.optionRow}>
                {(['regular', 'soft', 'pureed', 'npo'] as const).map(cons => (
                  <TouchableOpacity
                    key={cons}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      foodConsistency === cons && { backgroundColor: colors.accentTeal, borderColor: colors.accentTeal }
                    ]}
                    onPress={() => setFoodConsistency(cons)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, foodConsistency === cons && { color: '#FFF' }]}>
                      {cons === 'regular' ? 'طبيعي' :
                       cons === 'soft' ? 'لين' :
                       cons === 'pureed' ? 'مهروس' : 'NPO صيام'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>نسبة التغذية الفموية الفعلية (%):</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={oralIntakePercentText}
                onChangeText={setOralIntakePercentText}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={theme.subtext}
                textAlign="center"
              />
            </View>

            <View style={[styles.toggleRow, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>بحاجة لتغذية أنبوبية (Enteral)؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, needsEnteral && { backgroundColor: colors.primary }]}
                onPress={() => setNeedsEnteral(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {needsEnteral ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.toggleRow, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>بحاجة لتغذية وريدية (Parenteral)؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, needsParenteral && { backgroundColor: colors.primary }]}
                onPress={() => setNeedsParenteral(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {needsParenteral ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>حفظ تقييم السكتة الدماغية</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 48,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    start: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
    opacity: 0.85,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.md + 2,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
    marginBottom: 6,
  },
  inputField: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.regular,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  gridCol: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#94A3B8',
    width: 60,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.bold,
  },
  smallOptionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallOptionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.medium,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: colors.primaryContrast,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
  },
});
