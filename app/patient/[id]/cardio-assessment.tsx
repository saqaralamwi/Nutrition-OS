import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';
import { watchQuery, watchRecord } from '../../../src/data/database/observe';
import { getDatabase } from '../../../src/data/database';
import Patient from '../../../src/data/models/Patient';
import CardiovascularAssessment from '../../../src/data/models/CardiovascularAssessment';
import PatientEducationContent from '../../../src/data/models/PatientEducationContent';
import { CardiovascularEarlyWarningSystem } from '../../../src/domain/monitors/CardiovascularEarlyWarningSystem';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import Button from '../../../src/presentation/components/Button';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

const EDEMA_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: '+1 (خفيف)', value: '1+' },
  { label: '+2 (متوسط)', value: '2+' },
  { label: '+3 (شديد)', value: '3+' },
  { label: '+4 (حاد)', value: '4+' },
];

const DASH_CHECKBOXES = [
  { key: 'lowSodium', label: 'تجنب الأطعمة المالحة (< 1500 مجم صوديوم/يوم)' },
  { key: 'lowSaturatedFat', label: 'تقليل الدهون المشبعة والكوليسترول' },
  { key: 'fruitVeg', label: 'تناول 5+ حصص من الفواكه والخضروات يومياً' },
  { key: 'wholeGrains', label: 'استبدال الحبوب المكررة بالحبوب الكاملة' },
  { key: 'leanProtein', label: 'اختيار البروتين الخالي من الدهون والأسماك' },
  { key: 'lowSugar', label: 'تجنب المشروبات المحلاة والسكريات المضافة' },
  { key: 'moderateAlcohol', label: 'الحد من الكحول (إن وجد) بمقدار مشروب واحد/يوم' },
  { key: 'dailyExercise', label: 'نشاط بدني معتدل ≥ 30 دقيقة، 5 أيام/أسبوع' },
];

interface IDashState {
  lowSodium: boolean;
  lowSaturatedFat: boolean;
  fruitVeg: boolean;
  wholeGrains: boolean;
  leanProtein: boolean;
  lowSugar: boolean;
  moderateAlcohol: boolean;
  dailyExercise: boolean;
}

const initialDash: IDashState = {
  lowSodium: false,
  lowSaturatedFat: false,
  fruitVeg: false,
  wholeGrains: false,
  leanProtein: false,
  lowSugar: false,
  moderateAlcohol: false,
  dailyExercise: false,
};

function DashCheckbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
      </View>
      <ArabicText style={styles.checkboxLabel}>{label}</ArabicText>
    </TouchableOpacity>
  );
}

function EducationCard({ item }: { item: PatientEducationContent }) {
  return (
    <View style={styles.educationItem}>
      <View style={styles.educationHeader}>
        <Ionicons
          name={
            item.contentType === 'pdf' || item.contentType === 'document'
              ? 'document-text'
              : item.contentType === 'video'
                ? 'videocam'
                : 'newspaper'
          }
          size={18}
          color={colors.accentTeal}
        />
        <ArabicText bold style={styles.educationTitle}>
          {item.titleAr || item.title}
        </ArabicText>
      </View>
      {item.summaryAr || item.summary ? (
        <ArabicText style={styles.educationSummary}>
          {item.summaryAr || item.summary}
        </ArabicText>
      ) : null}
      <View style={styles.educationMeta}>
        <View style={styles.educationBadge}>
          <ArabicText style={styles.educationBadgeText}>
            {item.categoryAr || item.category}
          </ArabicText>
        </View>
        {item.conditionAr || item.condition ? (
          <ArabicText style={styles.educationCondition}>
            {item.conditionAr || item.condition}
          </ArabicText>
        ) : null}
      </View>
      {item.documentUrl || item.url ? (
        <TouchableOpacity style={styles.educationLink} activeOpacity={0.7}>
          <Ionicons name="open-outline" size={14} color={colors.accentTeal} />
          <ArabicText style={styles.educationLinkText}>فتح المادة التعليمية</ArabicText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function CardioAssessmentScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<CardiovascularAssessment[]>([]);
  const [educationItems, setEducationItems] = useState<PatientEducationContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [ldlCholesterol, setLdlCholesterol] = useState('');
  const [hdlCholesterol, setHdlCholesterol] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [dryWeight, setDryWeight] = useState('');
  const [edemaGrading, setEdemaGrading] = useState('none');
  const [hasDyspnea, setHasDyspnea] = useState(false);
  const [hasOrthopnea, setHasOrthopnea] = useState(false);
  const [dashState, setDashState] = useState<IDashState>(initialDash);

  const [riskResult, setRiskResult] = useState<RiskDisplay | null>(null);
  const [showEducation, setShowEducation] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);

    const assessments$ = watchQuery<CardiovascularAssessment>((db) => {
      return db.get('cardiovascular_assessments').query(
        Q.where('patient_id', patientId),
        Q.sortBy('recorded_at', 'desc'),
      );
    }).pipe(map((records) => records.slice(0, 30)));

    const education$ = watchQuery<PatientEducationContent>((db) => {
      return db.get('patient_education_content').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
      );
    }).pipe(map((records) => records.slice(0, 20)));

    const stream = combineLatest([patient$, assessments$, education$]).subscribe({
      next: ([p, records, educationRecords]) => {
        setPatient(p);
        setAssessments(records);
        setEducationItems(educationRecords);
        setIsLoading(false);
      },
      error: (err) => {
        console.error('Cardio stream error:', err);
        showToast('خطأ في تحميل بيانات القلب والأوعية الدموية', 'error');
        setIsLoading(false);
      },
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  const toggleDash = useCallback((key: keyof IDashState) => {
    setDashState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const dashScore = useMemo(() => {
    return Object.values(dashState).filter(Boolean).length;
  }, [dashState]);

  const resetForm = useCallback(() => {
    setSystolicBp('');
    setDiastolicBp('');
    setHeartRate('');
    setTotalCholesterol('');
    setLdlCholesterol('');
    setHdlCholesterol('');
    setTriglycerides('');
    setDryWeight('');
    setEdemaGrading('none');
    setHasDyspnea(false);
    setHasOrthopnea(false);
    setDashState(initialDash);
    setRiskResult(null);
  }, []);

  type RiskDisplay = {
    status: string;
    color: string;
    alerts: string[];
    fluidRestriction: number;
  };

  const evaluateRisk = useCallback((): RiskDisplay => {
    const sbp = parseFloat(systolicBp);
    const dbp = parseFloat(diastolicBp);
    const tc = parseFloat(totalCholesterol);
    const ldl = parseFloat(ldlCholesterol);
    const hdl = parseFloat(hdlCholesterol);
    const tg = parseFloat(triglycerides);
    const hr = parseFloat(heartRate);

    const warnings: string[] = [];

    if (sbp >= 180 || dbp >= 120) {
      warnings.push('🚨 أزمة فرط ضغط دم (Hypertensive Crisis) — تدخل طبي فوري مطلوب');
    } else if (sbp >= 140 || dbp >= 90) {
      warnings.push('⚠️ المرحلة الثانية من ارتفاع الضغط — يحتاج علاج دوائي');
    } else if (sbp >= 130 || dbp >= 85) {
      warnings.push('⚠️ المرحلة الأولى من ارتفاع الضغط — يستلزم متابعة');
    } else if (sbp >= 120 && sbp < 130) {
      warnings.push('⚠️ ضغط دم مرتفع (Elevated) — يستلزم تغيير نمط الحياة');
    }

    if (tc > 0 && (tc >= 240 || ldl >= 160 || tg >= 200)) {
      warnings.push('🚨 فرط شحوم الدم مرتفع الخطورة (High-Risk Dyslipidemia)');
    } else if (tc > 0 && (tc >= 200 || ldl >= 130 || tg >= 150)) {
      warnings.push('⚠️ فرط شحوم الدم حدودي (Borderline Dyslipidemia)');
    }

    if (hdl > 0 && hdl < 40) {
      warnings.push('⚠️ HDL منخفض — خطر قلبي وعائي مرتفع');
    }

    if (hr > 0 && hr > 100) {
      warnings.push('⚠️ تسرع القلب (Tachycardia) — معدل النبض فوق 100/دقيقة');
    }
    if (hr > 0 && hr < 50) {
      warnings.push('⚠️ بطء القلب (Bradycardia) — معدل النبض أقل من 50/دقيقة');
    }

    if (dashScore < 5) {
      warnings.push('📋 الامتثال لنظام DASH الغذائي منخفض — تحتاج استشارة تغذوية عاجلة');
    }

    let fluidRestriction = 0;
    if (edemaGrading !== 'none' || hasDyspnea || hasOrthopnea) {
      fluidRestriction = 1500;
      if (edemaGrading === '3+' || edemaGrading === '4+' || hasDyspnea || hasOrthopnea) {
        fluidRestriction = 1000;
      }
      warnings.push(`💧 تقييد السوائل: ${fluidRestriction} مل/يوم بناءً على حالة الاحتقان`);
    }

    let status: string;
    let color: string;

    if (warnings.some((w) => w.startsWith('🚨'))) {
      status = 'إنذار أحمر — خطر مرتفع';
      color = '#EF4444';
    } else if (warnings.some((w) => w.startsWith('⚠️'))) {
      status = 'تنبيه أصفر — بحاجة لمتابعة';
      color = '#F59E0B';
    } else {
      status = 'مستقر — أخضر';
      color = '#10B981';
    }

    return { status, color, alerts: warnings, fluidRestriction };
  }, [systolicBp, diastolicBp, totalCholesterol, ldlCholesterol, hdlCholesterol, triglycerides, heartRate, edemaGrading, hasDyspnea, hasOrthopnea, dashScore]);

  const handleSave = useCallback(async () => {
    const sbp = parseFloat(systolicBp);
    const dbp = parseFloat(diastolicBp);
    const tc = totalCholesterol ? parseFloat(totalCholesterol) : 0;
    const ldl = ldlCholesterol ? parseFloat(ldlCholesterol) : 0;
    const hdl = hdlCholesterol ? parseFloat(hdlCholesterol) : 0;
    const tg = triglycerides ? parseFloat(triglycerides) : 0;
    const dw = dryWeight ? parseFloat(dryWeight) : 0;

    if (!systolicBp || isNaN(sbp) || !diastolicBp || isNaN(dbp)) {
      showToast('الرجاء إدخال قيم ضغط الدم (الانقباضي والانبساطي)', 'error');
      return;
    }
    if (sbp <= 0 || dbp <= 0) {
      showToast('قيم ضغط الدم يجب أن تكون أكبر من صفر', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const db = await getDatabase();
      await db.write(async (writer) => {
        await writer.create('cardiovascular_assessments', (record: any) => {
          record.patientId = patientId;
          record.systolicBloodPressure = sbp;
          record.diastolicBloodPressure = dbp;
          record.totalCholesterol = tc;
          record.ldlCholesterol = ldl;
          record.hdlCholesterol = hdl;
          record.triglycerides = tg;
          record.measuredDryWeightKg = dw;
          record.hasPeripheralEdema = edemaGrading !== 'none';
          record.edemaGrading = edemaGrading;
          record.recordedAt = new Date();
        });
      });

      const risk = evaluateRisk();
      setRiskResult(risk);

      showToast('تم حفظ تقييم القلب والأوعية الدموية بنجاح', 'success');
    } catch (error) {
      console.error('Save cardio assessment error:', error);
      showToast('فشل في حفظ التقييم', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, systolicBp, diastolicBp, totalCholesterol, ldlCholesterol, hdlCholesterol, triglycerides, dryWeight, edemaGrading, evaluateRisk, showToast]);

  const handleAnalyzeOnly = useCallback(() => {
    const risk = evaluateRisk();
    setRiskResult(risk);
  }, [evaluateRisk]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل بيانات تقييم القلب...</ArabicText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ArabicText bold style={styles.headerTitle}>تقييم القلب والأوعية الدموية</ArabicText>
            {patient && (
              <ArabicText style={styles.headerSubtitle}>
                {patient.fullName} | {patient.fileNumber}
              </ArabicText>
            )}
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>❤️ ضغط الدم ومعدل النبض</ArabicText>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="الضغط الانقباضي (Systolic)"
                  value={systolicBp}
                  onChangeText={setSystolicBp}
                  placeholder="مثال: 120"
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="الضغط الانبساطي (Diastolic)"
                  value={diastolicBp}
                  onChangeText={setDiastolicBp}
                  placeholder="مثال: 80"
                  keyboardType="numeric"
                  required
                />
              </View>
            </View>
            <TextInputField
              label="معدل ضربات القلب (HR)"
              value={heartRate}
              onChangeText={setHeartRate}
              placeholder="مثال: 72 نبضة/دقيقة"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>🧪 صورة الدهون (Lipid Profile)</ArabicText>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="الكوليسترول الكلي (Total Chol)"
                  value={totalCholesterol}
                  onChangeText={setTotalCholesterol}
                  placeholder="مثال: 200"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="LDL (الضار)"
                  value={ldlCholesterol}
                  onChangeText={setLdlCholesterol}
                  placeholder="مثال: 100"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="HDL (النافع)"
                  value={hdlCholesterol}
                  onChangeText={setHdlCholesterol}
                  placeholder="مثال: 50"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="الدهون الثلاثية (TG)"
                  value={triglycerides}
                  onChangeText={setTriglycerides}
                  placeholder="مثال: 150"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>⚕️ التقييم السريري</ArabicText>
            <TextInputField
              label="الوزن الجاف المقاس (Dry Weight)"
              value={dryWeight}
              onChangeText={setDryWeight}
              placeholder="مثال: 72.5 كجم"
              keyboardType="numeric"
            />
            <DropdownField
              label="تقييم الوذمة المحيطية (Edema)"
              options={EDEMA_OPTIONS}
              selectedValue={edemaGrading}
              onValueChange={setEdemaGrading}
              placeholder="اختر درجة الوذمة..."
            />
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setHasDyspnea(!hasDyspnea)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, hasDyspnea && styles.checkboxChecked]}>
                {hasDyspnea && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <ArabicText style={styles.checkboxLabel}>ضيق تنفس عند الراحة (Dyspnea at Rest)</ArabicText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setHasOrthopnea(!hasOrthopnea)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, hasOrthopnea && styles.checkboxChecked]}>
                {hasOrthopnea && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <ArabicText style={styles.checkboxLabel}>ضيق تنفس عند الاستلقاء (Orthopnea)</ArabicText>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>🥗 الامتثال لنظام DASH الغذائي</ArabicText>
            <ArabicText style={styles.cardSubtitle}>
              عدد العناصر المطبقة: {dashScore} / 8
            </ArabicText>
            <View style={styles.dashList}>
              {DASH_CHECKBOXES.map((item) => (
                <DashCheckbox
                  key={item.key}
                  label={item.label}
                  checked={dashState[item.key as keyof IDashState]}
                  onToggle={() => toggleDash(item.key as keyof IDashState)}
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.analysisRow}>
              <Button
                title="🔍 تحليل المخاطر"
                onPress={handleAnalyzeOnly}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="💾 حفظ التقييم"
                onPress={handleSave}
                loading={isSaving}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          {riskResult && (
            <View style={[styles.card, { borderColor: riskResult.color, borderWidth: 2 }]}>
              <ArabicText bold style={[styles.cardTitle, { color: riskResult.color }]}>
                {riskResult.status}
              </ArabicText>
              {riskResult.alerts.length === 0 ? (
                <ArabicText style={styles.riskSafeText}>
                  ✅ جميع المؤشرات ضمن الحدود الطبيعية — حافظ على نمط الحياة الصحي
                </ArabicText>
              ) : (
                riskResult.alerts.map((alert, i) => (
                  <ArabicText key={i} style={styles.riskAlert}>
                    {alert}
                  </ArabicText>
                ))
              )}
              {riskResult.fluidRestriction > 0 && (
                <View style={styles.fluidRestrictionBadge}>
                  <Ionicons name="water" size={16} color={colors.info} />
                  <ArabicText style={styles.fluidRestrictionText}>
                    تقييد السوائل: {riskResult.fluidRestriction} مل/24 ساعة
                  </ArabicText>
                </View>
              )}
            </View>
          )}

          {assessments.length > 0 && (
            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>📋 سجل التقييمات السابقة</ArabicText>
              <View style={styles.tableHeader}>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.2 }]}>التاريخ</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>انقباضي</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>انبساطي</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>كوليسترول</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>LDL</ArabicText>
              </View>
              {assessments.slice(0, 10).map((record) => {
                const d = new Date(record.recordedAt);
                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                return (
                  <View key={record.id} style={styles.tableRow}>
                    <ArabicText style={[styles.tableCell, { flex: 1.2 }]}>{dateStr}</ArabicText>
                    <Text style={[styles.tableCell, { flex: 1, color: record.systolicBloodPressure >= 140 ? '#EF4444' : '#34D399', fontWeight: 'bold' }]}>
                      {record.systolicBloodPressure}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, color: record.diastolicBloodPressure >= 90 ? '#EF4444' : '#34D399', fontWeight: 'bold' }]}>
                      {record.diastolicBloodPressure}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, color: record.totalCholesterol >= 200 ? '#F59E0B' : '#34D399' }]}>
                      {record.totalCholesterol?.toFixed(0)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, color: record.ldlCholesterol >= 130 ? '#F59E0B' : '#34D399' }]}>
                      {record.ldlCholesterol?.toFixed(0) ?? '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.educationToggle}
              onPress={() => setShowEducation(!showEducation)}
              activeOpacity={0.7}
            >
              <Ionicons name="book" size={20} color={colors.accentTeal} />
              <ArabicText bold style={styles.cardTitle}>
                📚 المواد التعليمية للمريض
              </ArabicText>
              <Ionicons
                name={showEducation ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showEducation && (
              <>
                {educationItems.length === 0 ? (
                  <ArabicText style={styles.emptyText}>
                    لا توجد مواد تعليمية مخصصة لهذا المريض بعد. يمكن إضافة مواد من قسم المحتوى التعليمي.
                  </ArabicText>
                ) : (
                  <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                    {educationItems.map((item) => (
                      <EducationCard key={item.id} item={item} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    color: colors.primaryContrast,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.primaryContrast + 'AA',
    textAlign: 'right',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.sm,
    fontFamily: fontFamilies.regular,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  checkboxLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  dashList: {
    marginTop: spacing.xs,
  },
  analysisRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  riskAlert: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: fontFamilies.regular,
  },
  riskSafeText: {
    fontSize: 13,
    color: '#10B981',
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  fluidRestrictionBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.info + '22',
    borderRadius: 8,
  },
  fluidRestrictionText: {
    fontSize: 13,
    color: colors.info,
    fontFamily: fontFamilies.bold,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: colors.textDisabled,
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
    borderBottomColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textDisabled,
    fontSize: 13,
    paddingVertical: spacing.lg,
    fontFamily: fontFamilies.regular,
  },
  educationToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  educationItem: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  educationHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  educationTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  educationSummary: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
    lineHeight: 16,
  },
  educationMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  educationBadge: {
    backgroundColor: colors.accentTeal + '22',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  educationBadgeText: {
    fontSize: 10,
    color: colors.accentTeal,
    fontFamily: fontFamilies.bold,
  },
  educationCondition: {
    fontSize: 10,
    color: colors.textDisabled,
    fontFamily: fontFamilies.regular,
  },
  educationLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  educationLinkText: {
    fontSize: 11,
    color: colors.accentTeal,
    fontFamily: fontFamilies.regular,
  },
});
