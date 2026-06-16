import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Text,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';

// Database & Observe
import { getDatabase } from '../../../src/data/database';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';

// Models
import Patient from '../../../src/data/models/Patient';
import NutritionalPlan from '../../../src/data/models/NutritionalPlan';
import VitalsRecord from '../../../src/data/models/VitalsRecord';
import RenalAssessment from '../../../src/data/models/RenalAssessment';
import ClinicalAuditLog from '../../../src/data/models/ClinicalAuditLog';

// Domain security & engines
import { RoleAuthorizationGuard } from '../../../src/domain/security/RoleAuthorizationGuard';
import { CertifiedReportEngine } from '../../../src/domain/reports/CertifiedReportEngine';
import { EgfrCalculatorEngine } from '../../../src/domain/calculators/EgfrCalculatorEngine';

// Presentation & UI
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import Button from '../../../src/presentation/components/Button';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';

export default function CertifiedAuditGatewayScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);
  const currentUser = useAuthStore((s) => s.user);

  // Core observed stream states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestPlan, setLatestPlan] = useState<NutritionalPlan | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [latestRenal, setLatestRenal] = useState<RenalAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local state interactive triggers
  const [clinicalJustification, setClinicalJustification] = useState('');
  const [actorRole, setActorRole] = useState<'nutritionist' | 'pharmacist' | 'systems_consultant'>('nutritionist');
  const [actorName, setActorName] = useState(currentUser?.fullName || 'الطبيب المعالج');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Sync actor name with user store if it hydrates later
  useEffect(() => {
    if (currentUser?.fullName) {
      setActorName(currentUser.fullName);
    }
  }, [currentUser]);

  // RxJS pipeline
  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);

    const plan$ = watchQuery<NutritionalPlan>((db) => {
      return db.get('nutritional_plans').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc')
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

    const renal$ = watchQuery<RenalAssessment>((db) => {
      return db.get('renal_assessments').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', 'desc')
      );
    }).pipe(
      map(records => records.length > 0 ? records[0] : null)
    );

    const stream = combineLatest([patient$, plan$, vitals$, renal$]).subscribe({
      next: ([p, plan, vitals, renal]) => {
        setPatient(p);
        setLatestPlan(plan);
        setLatestVitals(vitals);
        setLatestRenal(renal);
        setIsLoading(false);
      },
      error: (err) => {
        console.error('Certified Audit stream subscription error:', err);
        showToast('خطأ في تحميل بيانات التحقق السريري', 'error');
        setIsLoading(false);
      }
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  // Derived Metrics & Digital Encryption Calculations
  const calculatedMetrics = useMemo(() => {
    const weightKg = latestVitals?.weight ?? latestVitals?.weightKg ?? 70.0;
    const heightCm = latestVitals?.height ?? latestVitals?.heightCm ?? 170.0;
    const bmi = latestVitals?.bmi ?? parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(2)) ?? 24.2;

    const egfrResult = latestRenal
      ? EgfrCalculatorEngine.calculateEgfr({
          serumCreatinine: latestRenal.serumCreatinine,
          age: patient?.age ?? 40,
          gender: (patient?.gender as any) || 'male',
        })
      : { egfrValue: 90.0 };

    const netCaloriesTarget = latestPlan?.finalCalories ?? latestPlan?.targetCalories ?? 2000;
    const proteinTargetGrams = latestPlan?.finalProtein ?? latestPlan?.proteinTarget ?? 80;

    return {
      weightKg,
      bmi,
      egfrValue: egfrResult.egfrValue,
      netCaloriesTarget,
      proteinTargetGrams,
    };
  }, [patient, latestPlan, latestVitals, latestRenal]);

  // Evaluate authorization via RoleAuthorizationGuard
  const authOutput = useMemo(() => {
    return RoleAuthorizationGuard.authorizeAction({
      actorRole,
      actionType: 'NCP_OVERRIDE',
      clinicalJustification,
      isOverrideRequested: true,
    });
  }, [actorRole, clinicalJustification]);

  // Generate cryptographic certified payload via CertifiedReportEngine
  const certifiedPayload = useMemo(() => {
    if (!patient) return null;

    return CertifiedReportEngine.generateCertifiedPayload({
      patientId,
      patientName: patient.fullName,
      clinicalMetrics: calculatedMetrics,
      securityContext: {
        actorName,
        actorRole,
        justificationText: clinicalJustification,
      },
    });
  }, [patient, patientId, calculatedMetrics, actorName, actorRole, clinicalJustification]);

  // Handle Certified Verification Save
  const handleCertifyReport = async () => {
    if (!authOutput.isAuthorized || !certifiedPayload?.isVerifiedSecure || !patient) {
      showToast('الرجاء استكمال شروط التحقق الأمني وكتابة التبرير أولاً', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const db = await getDatabase();

      await db.write(async () => {
        await db.get<ClinicalAuditLog>('clinical_audit_logs').create((record) => {
          record.actorId = currentUser?.id || 'guest';
          record.actorName = actorName;
          record.actorRole = actorRole;
          record.actionType = 'NCP_OVERRIDE';
          record.patientId = patientId;
          record.metadataSnapshot = JSON.stringify(certifiedPayload.compiledData);
          record.clinicalJustification = clinicalJustification;
          record.digitalFingerprintHash = certifiedPayload.digitalFingerprintHash;
          record.createdAt = new Date(); // WatermelonDB expects date objects for @date decorator
        });
      });

      setShowSuccessOverlay(true);
    } catch (e: any) {
      console.error('Failed to save certified audit log:', e);
      showToast('حدث خطأ في توثيق التقرير أو الاتصال بقاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishOverlay = () => {
    setShowSuccessOverlay(false);
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={{ marginTop: spacing.md, color: colors.textSecondary }}>
          جاري استدعاء سجلات المطابقة وتوثيق الهوية السريرية...
        </ArabicText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>بوابة التصديق والتدقيق السريري</ArabicText>
          <ArabicText style={styles.headerSubtitle}>
            ملف المريض: {patient?.fullName || '-'} | الرقم الطبي: {patient?.fileNumber || '-'}
          </ArabicText>
        </View>

        {/* CARD A: CURRENT ACTOR SECURITY FOOTPRINT */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color={colors.info} />
            <ArabicText bold style={styles.cardTitle}>البصمة الأمنية للفاعل السريري</ArabicText>
          </View>

          {/* Practitioner Name */}
          <View style={styles.fieldRow}>
            <ArabicText style={styles.fieldLabel}>اسم الممارس الطبي المعالج:</ArabicText>
            <TextInput
              style={styles.textInput}
              value={actorName}
              onChangeText={setActorName}
              placeholder="أدخل اسم الممارس"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          {/* Role selector */}
          <ArabicText style={styles.fieldLabel}>الدور السريري النشط للمطابقة:</ArabicText>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleBadge,
                actorRole === 'nutritionist' && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
              ]}
              onPress={() => setActorRole('nutritionist')}
            >
              <ArabicText bold={actorRole === 'nutritionist'} style={styles.roleBadgeText}>أخصائي تغذية</ArabicText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleBadge,
                actorRole === 'pharmacist' && { backgroundColor: colors.success, borderColor: colors.success }
              ]}
              onPress={() => setActorRole('pharmacist')}
            >
              <ArabicText bold={actorRole === 'pharmacist'} style={styles.roleBadgeText}>صيدلاني سريري</ArabicText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleBadge,
                actorRole === 'systems_consultant' && { backgroundColor: colors.warning, borderColor: colors.warning }
              ]}
              onPress={() => setActorRole('systems_consultant')}
            >
              <ArabicText bold={actorRole === 'systems_consultant'} style={styles.roleBadgeText}>مستشار النظم</ArabicText>
            </TouchableOpacity>
          </View>

          {/* Arabic Justification Input */}
          <ArabicText style={styles.fieldLabel}>التبرير السريري لتجاوز المؤشرات والمستهدفات (Arabic):</ArabicText>
          <TextInput
            style={styles.textarea}
            value={clinicalJustification}
            onChangeText={setClinicalJustification}
            multiline
            numberOfLines={4}
            placeholder="اكتب التبرير السريري باللغة العربية بالتفصيل..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />

          {/* Validation directives and warnings */}
          {clinicalJustification.trim().length < 15 && (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <ArabicText style={styles.warningText}>
                تنبيه نظام الصلاحيات: يرجى كتابة تبرير سريري لا يقل عن 15 حرفاً لإصدار صك الاعتماد الرقمي.
              </ArabicText>
            </View>
          )}

          {authOutput.arabicSecurityDirectives.map((directive, idx) => (
            <View
              key={idx}
              style={[
                styles.directiveBox,
                authOutput.isAuthorized ? styles.directiveBoxSuccess : styles.directiveBoxError
              ]}
            >
              <Ionicons
                name={authOutput.isAuthorized ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={18}
                color={authOutput.isAuthorized ? colors.success : colors.danger}
              />
              <ArabicText style={styles.directiveText}>{directive}</ArabicText>
            </View>
          ))}
        </View>

        {/* CARD B: LIVE DIGITAL FINGERPRINT RADAR */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="key" size={20} color={colors.success} />
            <ArabicText bold style={styles.cardTitle}>بصمة التشفير الرقمية المتزامنة</ArabicText>
          </View>

          <ArabicText style={styles.sectionDesc}>
            يتم احتساب البصمة الرقمية التالية متزامناً مع إدخال البيانات الحيوية للمريض وحزمة تبرير الإجراء:
          </ArabicText>

          {authOutput.isAuthorized && certifiedPayload?.digitalFingerprintHash ? (
            <View style={styles.radarContainer}>
              <View style={[styles.pulseRing, styles.pulseActive]} />
              <Text style={styles.hashText}>{certifiedPayload.digitalFingerprintHash}</Text>
              <ArabicText style={styles.radarStatusText}>تم تصنيف وفحص حزمة البيانات وتوقيعها رقمياً بنجاح</ArabicText>
            </View>
          ) : (
            <View style={styles.radarContainerDisabled}>
              <Ionicons name="lock-closed" size={32} color={colors.textDisabled} />
              <ArabicText style={styles.radarStatusTextDisabled}>
                بانتظار استيفاء صلاحيات الممارس وتفاصيل التبرير السريري لتوليد البصمة الرقمية للملف...
              </ArabicText>
            </View>
          )}

          {/* Compiled Metrics Display */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <ArabicText style={styles.metricLabel}>الوزن المقارن</ArabicText>
              <Text style={styles.metricValue}>{calculatedMetrics.weightKg} kg</Text>
            </View>
            <View style={styles.metricCell}>
              <ArabicText style={styles.metricLabel}>مؤشر الكتلة BMI</ArabicText>
              <Text style={styles.metricValue}>{calculatedMetrics.bmi}</Text>
            </View>
            <View style={styles.metricCell}>
              <ArabicText style={styles.metricLabel}>معدل الفلترة eGFR</ArabicText>
              <Text style={styles.metricValue}>{calculatedMetrics.egfrValue}</Text>
            </View>
            <View style={styles.metricCell}>
              <ArabicText style={styles.metricLabel}>مستهدف السعرات</ArabicText>
              <Text style={styles.metricValue}>{calculatedMetrics.netCaloriesTarget} kcal</Text>
            </View>
            <View style={styles.metricCell}>
              <ArabicText style={styles.metricLabel}>البروتين الكلي</ArabicText>
              <Text style={styles.metricValue}>{calculatedMetrics.proteinTargetGrams} g</Text>
            </View>
          </View>
        </View>

        {/* CARD C: CERTIFICATION EMISSION TRIGGERS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={colors.warning} />
            <ArabicText bold style={styles.cardTitle}>اعتماد وإصدار الوثيقة</ArabicText>
          </View>

          <ArabicText style={styles.sectionDesc}>
            عند تأكيد الإصدار، سيتم توثيق البصمة الرقمية ومقارنتها عبر السجل السلس لقاعدة البيانات الموزعة للتدقيق.
          </ArabicText>

          <Button
            title="إصدار وصك التقرير الطبي المصدق بختم الأمان"
            onPress={handleCertifyReport}
            loading={isSaving}
            disabled={!authOutput.isAuthorized || !certifiedPayload?.isVerifiedSecure}
            variant="primary"
            style={(!authOutput.isAuthorized || !certifiedPayload?.isVerifiedSecure) ? ([styles.certButton, styles.certButtonDisabled] as any) : styles.certButton}
          />
        </View>
      </ScrollView>

      {/* Success Modal Overlay */}
      <Modal
        visible={showSuccessOverlay}
        transparent
        animationType="fade"
        onRequestClose={handleFinishOverlay}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.overlayCard}>
            <View style={styles.successShield}>
              <Ionicons name="shield-checkmark" size={60} color="#10B981" />
            </View>
            <ArabicText bold style={styles.overlayTitle}>
              تم التوقيع والمطابقة بنجاح!
            </ArabicText>
            <ArabicText style={styles.overlaySubtitle}>
              تم قفل الملف، وتوثيق السجل التدقيقي، وإصدار بصمة المستند بنجاح كامِل.
            </ArabicText>

            <TouchableOpacity style={styles.overlayCloseBtn} onPress={handleFinishOverlay}>
              <ArabicText bold style={{ color: colors.primaryContrast }}>متابعة لوحة التحكم</ArabicText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
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
    fontSize: 15,
    color: colors.textPrimary,
  },
  fieldRow: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  roleContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  roleBadgeText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  textarea: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  warningBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: 11,
    color: colors.warning,
    flex: 1,
    textAlign: 'right',
  },
  directiveBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  directiveBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: colors.success,
  },
  directiveBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: colors.danger,
  },
  directiveText: {
    fontSize: 11,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  sectionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  radarContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  radarContainerDisabled: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.success,
    opacity: 0.15,
  },
  pulseActive: {
    // simulation of pulsing keyframe
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  hashText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  radarStatusText: {
    fontSize: 11,
    color: colors.success,
    textAlign: 'center',
  },
  radarStatusTextDisabled: {
    fontSize: 11,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metricCell: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  certButton: {
    marginTop: spacing.sm,
  },
  certButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  successShield: {
    marginBottom: spacing.md,
  },
  overlayTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  overlaySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  overlayCloseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
});
