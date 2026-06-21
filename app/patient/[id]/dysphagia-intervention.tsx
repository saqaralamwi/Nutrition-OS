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
import { useDysphagiaIntervention } from '../../../src/presentation/hooks/useDysphagiaIntervention';
import { useStrokeAssessment } from '../../../src/presentation/hooks/useStrokeAssessment';

export default function DysphagiaInterventionScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  // Load patient
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  const { intervention, isLoading, createIntervention } = useDysphagiaIntervention(patientId);
  const { assessment } = useStrokeAssessment(patientId);

  // States
  const [swallowTherapyType, setSwallowTherapyType] = useState<'none' | 'oral_motor' | 'compensatory' | 'rehabilitative'>('none');
  const [therapyFrequency, setTherapyFrequency] = useState('0');
  const [feedingPosition, setFeedingPosition] = useState<'supine' | 'semi_fowler' | 'fowler' | 'upright_90'>('semi_fowler');
  const [chinTuck, setChinTuck] = useState(false);
  const [headRotation, setHeadRotation] = useState(false);
  const [foodTemperature, setFoodTemperature] = useState<'cold' | 'room_temp' | 'warm'>('room_temp');
  const [foodTexture, setFoodTexture] = useState<'liquid' | 'pureed' | 'minced' | 'regular'>('liquid');
  const [suctionAvailable, setSuctionAvailable] = useState(false);
  const [emergencyProtocol, setEmergencyProtocol] = useState<'none' | 'fast_response' | 'full_support'>('none');

  // Load defaults from assessment if dysphagia is present
  useEffect(() => {
    if (assessment && assessment.hasDysphagia) {
      setSwallowTherapyType('compensatory');
      setTherapyFrequency('3');
      setFeedingPosition('upright_90');
      setChinTuck(true);
      setSuctionAvailable(true);
      setEmergencyProtocol('fast_response');
    }
  }, [assessment]);

  // Sync state once intervention is loaded
  useEffect(() => {
    if (intervention) {
      setSwallowTherapyType(intervention.swallowTherapyType);
      setTherapyFrequency(String(intervention.therapyFrequency));
      setFeedingPosition(intervention.feedingPosition);
      setChinTuck(intervention.chinTuck);
      setHeadRotation(intervention.headRotation);
      setFoodTemperature(intervention.foodTemperature);
      setFoodTexture(intervention.foodTexture);
      setSuctionAvailable(intervention.suctionAvailable);
      setEmergencyProtocol(intervention.emergencyProtocol);
    }
  }, [intervention]);

  const handleSave = async () => {
    try {
      const data = {
        patientId,
        assessmentId: assessment?.createdAt || new Date().toISOString(),
        swallowTherapyType,
        therapyFrequency: parseInt(therapyFrequency, 10) || 0,
        feedingPosition,
        chinTuck,
        headRotation,
        foodTemperature,
        foodTexture,
        suctionAvailable,
        emergencyProtocol,
        createdAt: intervention?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createIntervention(data);
      Alert.alert('نجاح', 'تم حفظ إرشادات البلع الآمن وعلاج عسر البلع بنجاح');
      router.back();
    } catch (err) {
      Alert.alert('خطأ', 'فشل حفظ الإرشادات السريرية.');
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
          <Text style={styles.headerTitle}>🥣 بروتوكول البلع الآمن</Text>
          <Text style={styles.headerSubtitle}>{patient.fullName} | {patient.fileNumber}</Text>
        </View>

        <View style={styles.content}>
          {/* Swallowing Therapy */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>علاج صعوبات البلع (Swallow Therapy)</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>نوع الجلسات العلاجية:</Text>
              <View style={styles.optionRow}>
                {(['none', 'oral_motor', 'compensatory', 'rehabilitative'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      swallowTherapyType === type && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSwallowTherapyType(type)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, swallowTherapyType === type && { color: '#FFF' }]}>
                      {type === 'none' ? 'لا يوجد' :
                       type === 'oral_motor' ? 'حركي فموي' :
                       type === 'compensatory' ? 'تعويضي' : 'إعادة تأهيل'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>عدد الجلسات الأسبوعية:</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={therapyFrequency}
                onChangeText={setTherapyFrequency}
                keyboardType="numeric"
                textAlign="center"
              />
            </View>
          </View>

          {/* Positioning & Feeding Guides */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>الوضعيات والتموضع أثناء إطعام المريض</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>وضعية جلوس المريض:</Text>
              <View style={styles.optionRow}>
                {(['supine', 'semi_fowler', 'fowler', 'upright_90'] as const).map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      feedingPosition === pos && { backgroundColor: colors.accentSky, borderColor: colors.accentSky }
                    ]}
                    onPress={() => setFeedingPosition(pos)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, feedingPosition === pos && { color: '#FFF' }]}>
                      {pos === 'supine' ? 'مستلقي' :
                       pos === 'semi_fowler' ? 'شبه مائل' :
                       pos === 'fowler' ? 'مائل (Fowler)' : 'قائم 90 درجة'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>إمالة الذقن للصدر (Chin-tuckPosture)؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, chinTuck && { backgroundColor: colors.success }]}
                onPress={() => setChinTuck(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {chinTuck ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.toggleRow, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>تدوير الرأس للجهة الضعيفة (Head Rotation)؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, headRotation && { backgroundColor: colors.success }]}
                onPress={() => setHeadRotation(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {headRotation ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sensory Adjustments */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>تعديلات الحرارة والقوام الحسية</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>درجة حرارة الطعام الموصى بها:</Text>
              <View style={styles.optionRow}>
                {(['cold', 'room_temp', 'warm'] as const).map(temp => (
                  <TouchableOpacity
                    key={temp}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      foodTemperature === temp && { backgroundColor: colors.accentTeal, borderColor: colors.accentTeal }
                    ]}
                    onPress={() => setFoodTemperature(temp)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, foodTemperature === temp && { color: '#FFF' }]}>
                      {temp === 'cold' ? 'بارد' :
                       temp === 'room_temp' ? 'حرارة الغرفة' : 'دافئ'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>ملمس الغذاء (Texture):</Text>
              <View style={styles.optionRow}>
                {(['liquid', 'pureed', 'minced', 'regular'] as const).map(text => (
                  <TouchableOpacity
                    key={text}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      foodTexture === text && { backgroundColor: colors.accentTeal, borderColor: colors.accentTeal }
                    ]}
                    onPress={() => setFoodTexture(text)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, foodTexture === text && { color: '#FFF' }]}>
                      {text === 'liquid' ? 'سائل' :
                       text === 'pureed' ? 'مهروس' :
                       text === 'minced' ? 'مفروم' : 'طبيعي'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Safety & Emergency */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>السلامة والتدابير الطارئة</Text>

            <View style={styles.toggleRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>توفر جهاز شفط الإفرازات (Suction) بالسرير؟</Text>
              <TouchableOpacity
                style={[styles.toggleButton, suctionAvailable && { backgroundColor: colors.danger }]}
                onPress={() => setSuctionAvailable(prev => !prev)}
              >
                <Text style={styles.toggleButtonText}>
                  {suctionAvailable ? 'نعم' : 'لا'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, { marginTop: spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>بروتوكول الطوارئ المفعل:</Text>
              <View style={styles.optionRow}>
                {(['none', 'fast_response', 'full_support'] as const).map(prot => (
                  <TouchableOpacity
                    key={prot}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.background, borderColor: theme.border },
                      emergencyProtocol === prot && { 
                        backgroundColor: prot === 'none' ? '#94A3B8' : colors.danger,
                        borderColor: prot === 'none' ? '#94A3B8' : colors.danger
                      }
                    ]}
                    onPress={() => setEmergencyProtocol(prot)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }, emergencyProtocol === prot && { color: '#FFF' }]}>
                      {prot === 'none' ? 'لا يوجد' :
                       prot === 'fast_response' ? 'استجابة سريعة' : 'دعم كامل'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>حفظ وتحديث خطة التدخل</Text>
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
