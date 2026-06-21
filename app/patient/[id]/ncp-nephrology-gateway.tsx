import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { Q } from '@nozbe/watermelondb';

// Models
import Patient from '../../../src/data/models/Patient';
import RenalAssessment from '../../../src/data/models/RenalAssessment';
import VitalsRecord from '../../../src/data/models/VitalsRecord';

// Engines
import { EgfrCalculatorEngine } from '../../../src/domain/calculators/EgfrCalculatorEngine';
import { RenalMineralRestrictionEngine } from '../../../src/domain/calculators/RenalMineralRestrictionEngine';

// Presentation / Design System
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { HiddenWhenSandbox } from '../../../src/presentation/components/HiddenWhenSandbox';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

export default function NCPNephrologyGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  // Core stream states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestRenal, setLatestRenal] = useState<RenalAssessment | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states - Renal indicators
  const [serumCreatinine, setSerumCreatinine] = useState('1.5');
  const [bun, setBun] = useState('25');
  const [serumPotassium, setSerumPotassium] = useState('4.2');
  const [serumPhosphorus, setSerumPhosphorus] = useState('3.8');
  const [serumSodium, setSerumSodium] = useState('138');
  const [dialysisStatus, setDialysisStatus] = useState<'none' | 'hemodialysis' | 'peritoneal'>('none');
  const [measuredUrineOutput, setMeasuredUrineOutput] = useState('1500');

  // Overrides inputs
  const [sodiumOverride, setSodiumOverride] = useState('');
  const [potassiumOverride, setPotassiumOverride] = useState('');
  const [phosphorusOverride, setPhosphorusOverride] = useState('');
  const [proteinOverride, setProteinOverride] = useState('');

  // Save Modal inputs
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [justification, setJustification] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 1.3 Reactive stream utilising combineLatest
  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);
    
    const latestRenal$ = watchQuery<RenalAssessment>((db) => {
      return db.get('renal_assessments').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const vitals$ = watchQuery<VitalsRecord>((db) => {
      return db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const stream = combineLatest([patient$, latestRenal$, vitals$]).subscribe({
      next: ([p, renal, vitals]) => {
        setPatient(p);
        setLatestRenal(renal);
        setLatestVitals(vitals);

        if (renal) {
          setSerumCreatinine(String(renal.serumCreatinine ?? ''));
          setBun(String(renal.bun ?? ''));
          setSerumPotassium(String(renal.serumPotassium ?? ''));
          setSerumPhosphorus(String(renal.serumPhosphorus ?? ''));
          setSerumSodium(String(renal.serumSodium ?? ''));
          setDialysisStatus((renal.dialysisStatus as any) || 'none');
          setMeasuredUrineOutput(String(renal.measuredUrineOutput ?? ''));
        }
        setIsLoading(false);
      },
      error: (err) => {
        console.error('NCP Nephrology Gateway stream error:', err);
        showToast('فشل تحميل البيانات التفاعلية الكلوية', 'error');
        setIsLoading(false);
      }
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  // Derived patient metrics
  const weight = latestVitals?.weightKg ?? latestVitals?.weight ?? 70;
  const age = patient?.age ?? 40;
  const gender = (patient?.gender === 'male' ? 'male' : 'female') as 'male' | 'female';

  // Step A: Calculate eGFR
  const egfrResult = useMemo(() => {
    const scr = parseFloat(serumCreatinine) || 0;
    return EgfrCalculatorEngine.calculateEgfr({
      serumCreatinine: scr,
      age,
      gender,
    });
  }, [serumCreatinine, age, gender]);

  // Step B: Calculate Restrictions
  const restrictionResult = useMemo(() => {
    // If the eGFR calculation fails or CKD stage is unknown, fallback to Stage 1
    const stage = (egfrResult.stage === 'unknown' ? 'stage_1' : egfrResult.stage) as any;
    const urineOutput = measuredUrineOutput ? parseFloat(measuredUrineOutput) : null;
    
    return RenalMineralRestrictionEngine.calculateRestrictions({
      ckdStage: stage,
      dialysisStatus,
      weightKg: weight,
      measuredUrineOutputMl: urineOutput,
    });
  }, [egfrResult, dialysisStatus, weight, measuredUrineOutput]);

  // Staging severity colors
  const severityColor = useMemo(() => {
    const stage = egfrResult.stage;
    if (stage === 'stage_1' || stage === 'stage_2') return colors.success;
    if (stage === 'stage_3a' || stage === 'stage_3b') return colors.warning;
    if (stage === 'stage_4') return '#f97316'; // Orange severity
    if (stage === 'stage_5') return colors.danger;
    return colors.textDisabled;
  }, [egfrResult.stage]);

  // Overridden metrics logic
  const activeTargets = useMemo(() => {
    const r = restrictionResult;
    return {
      sodium: sodiumOverride.trim() ? parseFloat(sodiumOverride) : r.sodiumMaxMg,
      potassium: potassiumOverride.trim() ? parseFloat(potassiumOverride) : r.potassiumMaxMg,
      phosphorus: phosphorusOverride.trim() ? parseFloat(phosphorusOverride) : r.phosphorusMaxMg,
      protein: proteinOverride.trim() ? parseFloat(proteinOverride) : r.totalProteinGrams,
    };
  }, [restrictionResult, sodiumOverride, potassiumOverride, phosphorusOverride, proteinOverride]);

  // 3.2 Secure saving function wrapped inside WatermelonDB write transaction
  const handleSaveAssessment = async () => {
    if (!signature.trim() || !justification.trim()) {
      showToast('يرجى تعبئة التبرير السريري وتوقيع الأخصائي لحفظ السجل', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        const assessmentCollection = db.get<RenalAssessment>('renal_assessments');
        const auditLogCollection = db.get('audit_logs');
        const recommendationCollection = db.get('clinical_recommendations');

        // Create new assessment record
        const newRecord = await assessmentCollection.create((record) => {
          record.patientId = patientId;
          record.serumCreatinine = parseFloat(serumCreatinine) || 0;
          record.bun = parseFloat(bun) || 0;
          record.serumPotassium = parseFloat(serumPotassium) || 0;
          record.serumPhosphorus = parseFloat(serumPhosphorus) || 0;
          record.serumSodium = parseFloat(serumSodium) || 0;
          record.ckdStage = egfrResult.stage;
          record.dialysisStatus = dialysisStatus;
          record.measuredUrineOutput = parseFloat(measuredUrineOutput) || 0;
          record.recordedAt = new Date();
        });

        // CDSS Placeholder: Renal specific recommendations can be added here
        // if (egfrResult.stage === '5' && dialysisStatus === 'none') { ... }

        // Log clinical audit entry
        await auditLogCollection.create((record: any) => {
          record.actionType = 'renal_assessment_audit';
          record.userId = signature.trim();
          record.details = JSON.stringify({
            assessmentId: newRecord.id,
            patientId,
            justification: justification.trim(),
            egfrValue: egfrResult.egfrValue,
            ckdStage: egfrResult.stage,
            originalTargets: {
              sodium: restrictionResult.sodiumMaxMg,
              potassium: restrictionResult.potassiumMaxMg,
              phosphorus: restrictionResult.phosphorusMaxMg,
              protein: restrictionResult.totalProteinGrams,
            },
            overriddenTargets: {
              sodium: sodiumOverride.trim() ? parseFloat(sodiumOverride) : null,
              potassium: potassiumOverride.trim() ? parseFloat(potassiumOverride) : null,
              phosphorus: phosphorusOverride.trim() ? parseFloat(phosphorusOverride) : null,
              protein: proteinOverride.trim() ? parseFloat(proteinOverride) : null,
            },
            timestamp: new Date().toISOString(),
          });
        });
      });

      showToast('تم حفظ الجلسة الكلوية وتوثيق التوقيع الأمني بنجاح', 'success');
      setIsSaveModalOpen(false);
      setJustification('');
    } catch (e) {
      console.error('Failed to save renal assessment:', e);
      showToast('فشل في حفظ سجل الجلسة الكلوية بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ArabicText bold style={styles.headerTitle}>لوحة مراقبة وتجاوز حصص المعادن لمرضى الكلى (NCP)</ArabicText>
            <ArabicText style={styles.headerSubtitle}>
              المريض: {patient?.fullName} | السن: {age} سنة | وزن: {weight} كغم
            </ArabicText>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

          {/* Laboratory Inputs Card */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>المؤشرات والقياسات المخبرية الكلوية</ArabicText>
            
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="كرياتينين المصل (Serum Cr)"
                  value={serumCreatinine}
                  onChangeText={setSerumCreatinine}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="نيتروجين يوريا الدم (BUN)"
                  value={bun}
                  onChangeText={setBun}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="بوتاسيوم المصل (Potassium)"
                  value={serumPotassium}
                  onChangeText={setSerumPotassium}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="فوسفور المصل (Phosphorus)"
                  value={serumPhosphorus}
                  onChangeText={setSerumPhosphorus}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="صوديوم المصل (Sodium)"
                  value={serumSodium}
                  onChangeText={setSerumSodium}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="كمية البول المقاسة (مل/يوم)"
                  value={measuredUrineOutput}
                  onChangeText={setMeasuredUrineOutput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Dialysis status segmented row */}
            <ArabicText style={styles.label}>حالة الغسيل الكلوي (Dialysis):</ArabicText>
            <View style={styles.tabRow}>
              {(['none', 'hemodialysis', 'peritoneal'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.tabButton,
                    dialysisStatus === status && styles.tabButtonActive,
                  ]}
                  onPress={() => setDialysisStatus(status)}
                >
                  <ArabicText
                    bold={dialysisStatus === status}
                    style={[
                      styles.tabText,
                      dialysisStatus === status && styles.tabTextActive,
                    ]}
                  >
                    {status === 'none' ? 'بدون غسيل' : status === 'hemodialysis' ? 'دموي (HD)' : 'بريتوني (PD)'}
                  </ArabicText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CARD A: RENAL TELEMETRY & STAGING */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>القياس الأيضي والتدريج الكلوي</ArabicText>

            <View style={styles.stagingRow}>
              <View style={styles.egfrValueContainer}>
                <Text style={styles.egfrText}>{egfrResult.egfrValue || '—'}</Text>
                <ArabicText style={styles.egfrUnit}>مل/دقيقة/1.73م²</ArabicText>
              </View>

              <View style={styles.stageDescriptionContainer}>
                <View style={[styles.badge, { backgroundColor: severityColor }]}>
                  <ArabicText bold style={styles.badgeText}>
                    {dialysisStatus !== 'none' ? 'مريض غسيل كلوي' : egfrResult.stage.toUpperCase().replace('_', ' ')}
                  </ArabicText>
                </View>
                <ArabicText bold style={[styles.stageClassification, { color: severityColor }]}>
                  {dialysisStatus !== 'none' 
                    ? `مستمر على الغسيل ${dialysisStatus === 'hemodialysis' ? 'الدموي' : 'البريتوني'}`
                    : egfrResult.classification}
                </ArabicText>
              </View>
            </View>
          </View>

          {/* CARD B: STRICT CEILING TRACKERS */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>الحدود القصوى والأسقف اليومية للمعادن</ArabicText>

            <View style={styles.mineralCeilingGrid}>
              <View style={styles.mineralCard}>
                <Text style={styles.mineralVal}>{activeTargets.sodium} ملغ</Text>
                <ArabicText style={styles.mineralLabel}>الحد الأقصى للصوديوم</ArabicText>
                {sodiumOverride.trim() && <ArabicText style={styles.overrideIndicator}>تجاوز نشط</ArabicText>}
              </View>

              <View style={styles.mineralCard}>
                <Text style={styles.mineralVal}>{activeTargets.potassium} ملغ</Text>
                <ArabicText style={styles.mineralLabel}>الحد الأقصى للبوتاسيوم</ArabicText>
                {potassiumOverride.trim() && <ArabicText style={styles.overrideIndicator}>تجاوز نشط</ArabicText>}
              </View>

              <View style={styles.mineralCard}>
                <Text style={styles.mineralVal}>{activeTargets.phosphorus} ملغ</Text>
                <ArabicText style={styles.mineralLabel}>الحد الأقصى للفسفور</ArabicText>
                {phosphorusOverride.trim() && <ArabicText style={styles.overrideIndicator}>تجاوز نشط</ArabicText>}
              </View>
            </View>

            {/* Fluid Restriction Indicator */}
            {restrictionResult.isFluidRestricted && (
              <View style={styles.fluidRestrictionContainer}>
                <View style={styles.fluidHeader}>
                  <Ionicons name="warning" size={20} color={colors.warning} />
                  <ArabicText bold style={styles.fluidTitle}>تقييد حرج لحجم السوائل اليومي</ArabicText>
                </View>
                
                <ArabicText style={styles.fluidDescription}>
                  حجم السوائل اليومي المسموح به مقيد بـ {restrictionResult.fluidMaxMl} مل (حجم البول + حصة إضافية).
                </ArabicText>

                {/* Progress Visual Indicator */}
                <View style={styles.fluidBarTrack}>
                  <View style={[styles.fluidBarFill, { width: '100%' }]} />
                </View>
                <View style={styles.fluidBarLabels}>
                  <Text style={styles.fluidBarText}>0 مل</Text>
                  <Text style={[styles.fluidBarText, { fontWeight: 'bold', color: colors.warning }]}>
                    الحد الأقصى: {restrictionResult.fluidMaxMl} مل
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* CARD C: PROTEIN TARGET & NCP DIRECTIONS */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>مستهدف البروتين والتوجيهات السريرية (KDOQI)</ArabicText>

            <View style={styles.proteinTargetsRow}>
              <View style={styles.proteinMetric}>
                <Text style={styles.proteinMetricValue}>{restrictionResult.proteinTargetGramsPerKg} غ</Text>
                <ArabicText style={styles.proteinMetricLabel}>لكل كيلوغرام / يوم</ArabicText>
              </View>
              <View style={[styles.proteinMetric, styles.proteinMetricHighlight]}>
                <Text style={[styles.proteinMetricValue, { color: colors.success }]}>{activeTargets.protein} غ</Text>
                <ArabicText bold style={[styles.proteinMetricLabel, { color: colors.success }]}>إجمالي البروتين المستهدف</ArabicText>
              </View>
            </View>

            {/* Localized Arabic directives configuration */}
            <ArabicText bold style={styles.directivesTitle}>التوجيهات والمسارات السريرية الموصى بها:</ArabicText>
            <View style={styles.bulletListContainer}>
              {restrictionResult.clinicalDirectives.map((dir, i) => (
                <View key={i} style={styles.bulletItem}>
                  <ArabicText style={styles.bulletText}>{dir}</ArabicText>
                  <Text style={styles.bulletDot}>•</Text>
                </View>
              ))}
              {dialysisStatus !== 'none' && (
                <View style={styles.bulletItem}>
                  <ArabicText style={styles.bulletText}>يجب تعويض الخسائر المستمرة من البروتين خلال جلسات الغسيل برفع كفاءة التغذية.</ArabicText>
                  <Text style={styles.bulletDot}>•</Text>
                </View>
              )}
            </View>
          </View>

          {/* SECURE OVERRIDE CONTROL LAYER */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>تجاوز السقوف الغذائية وحصص المعادن (Clinical Overrides)</ArabicText>
            
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز الصوديوم (ملغ)"
                  value={sodiumOverride}
                  onChangeText={setSodiumOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز البوتاسيوم (ملغ)"
                  value={potassiumOverride}
                  onChangeText={setPotassiumOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز الفسفور (ملغ)"
                  value={phosphorusOverride}
                  onChangeText={setPhosphorusOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
              <View style={styles.gridItem}>
                <TextInputField
                  label="تجاوز البروتين الإجمالي (غ)"
                  value={proteinOverride}
                  onChangeText={setProteinOverride}
                  keyboardType="numeric"
                  placeholder="تلقائي"
                />
              </View>
            </View>

            <HiddenWhenSandbox>
              <Button
                title="حفظ السجل الكلوي وتوقيع التبرير السريري"
                onPress={() => setIsSaveModalOpen(true)}
                variant="primary"
              />
            </HiddenWhenSandbox>
          </View>

        </ScrollView>

        {/* Auditing Save Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isSaveModalOpen}
          onRequestClose={() => setIsSaveModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ArabicText bold style={styles.modalTitle}>إقرار التعديل والتجاوز الأيضي الكلوي</ArabicText>
              <ArabicText style={styles.modalDescription}>
                يتطلب حفظ نتائج تقييم الكلى أو تعديل قياساتها تبريراً سريرياً معتمداً وتوقيع الأخصائي.
              </ArabicText>

              <TextInputField
                label="التبرير السريري للتجاوز أو الفحص"
                value={justification}
                onChangeText={setJustification}
                placeholder="أدخل مبررات التدخل السريري الكلوية..."
                multiline
              />

              <TextInputField
                label="اسم الأخصائي المعالج (التوقيع الإلكتروني)"
                value={signature}
                onChangeText={setSignature}
                placeholder="اسم الأخصائي..."
              />

              <View style={styles.modalActions}>
                <Button
                  title="إلغاء"
                  onPress={() => {
                    setIsSaveModalOpen(false);
                    setJustification('');
                  }}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <HiddenWhenSandbox>
                  <Button
                    title="توقيع وحفظ السجل"
                    onPress={handleSaveAssessment}
                    variant="primary"
                    loading={isSaving}
                    style={{ flex: 2 }}
                  />
                </HiddenWhenSandbox>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: safeHeaderPaddingTop + spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryContrast,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: spacing.xs,
  },
  stagingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  egfrValueContainer: {
    alignItems: 'center',
  },
  egfrText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  egfrUnit: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stageDescriptionContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primaryContrast,
  },
  stageClassification: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
  mineralCeilingGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mineralCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  mineralVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  mineralLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  overrideIndicator: {
    fontSize: 8,
    color: colors.success,
    marginTop: 2,
    fontWeight: 'bold',
  },
  fluidRestrictionContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  fluidHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  fluidTitle: {
    fontSize: 13,
    color: colors.warning,
  },
  fluidDescription: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  fluidBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  fluidBarFill: {
    height: '100%',
    backgroundColor: colors.warning,
  },
  fluidBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fluidBarText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  proteinTargetsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  proteinMetric: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  proteinMetricHighlight: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  proteinMetricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  proteinMetricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  directivesTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  bulletListContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulletItem: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bulletText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.xs,
    lineHeight: 18,
    flex: 1,
    textAlign: 'right',
  },
  bulletDot: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  modalDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
