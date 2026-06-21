import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import Button from '../../../src/presentation/components/Button';
import { getDatabase } from '../../../src/data/database';
import { Q } from '@nozbe/watermelondb';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

export default function ElectrolyteMonitoringScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('');

  // Form states
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [magnesium, setMagnesium] = useState('');
  const [glucose, setGlucose] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');

  // History list
  const [history, setHistory] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const p = await db.get('patients').find(patientId) as any;
      if (p) {
        setPatientName(p.fullName);
        setPatientMrn(p.fileNumber);
      }

      const records = await db.get('electrolyte_monitorings')
        .query(
          Q.where('patient_id', patientId),
          Q.sortBy('monitoring_date', Q.desc)
        ).fetch();
      setHistory(records);
    } catch (e) {
      console.error('Failed to load electrolyte monitoring data:', e);
      showToast('خطأ في تحميل بيانات التحليل المرجعية', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time safety validation checks
  const phosNum = parseFloat(phosphorus) || 0;
  const potNum = parseFloat(potassium) || 0;
  const magNum = parseFloat(magnesium) || 0;
  const glucNum = parseFloat(glucose) || 0;

  const isPhosCritical = phosphorus !== '' && phosNum < 0.8;
  const isPotCritical = potassium !== '' && (potNum < 3.5 || potNum > 5.0);
  const isMagCritical = magnesium !== '' && magNum < 0.7;
  const isGlucCritical = glucose !== '' && (glucNum < 70 || glucNum > 180);

  const handleSave = async () => {
    if (!phosphorus || !potassium || !magnesium || !glucose) {
      showToast('الرجاء إدخال جميع نتائج التحاليل للإلكتروليتات والسكري', 'error');
      return;
    }

    const isSafe = !isPhosCritical && !isPotCritical && !isMagCritical && !isGlucCritical;

    try {
      setIsSaving(true);
      const db = await getDatabase();

      await db.write(async () => {
        await db.get('electrolyte_monitorings').create((record: any) => {
          record.patientId = patientId;
          record.monitoringDate = new Date();
          record.phosphorus = phosNum;
          record.potassium = potNum;
          record.magnesium = magNum;
          record.glucose = glucNum;
          record.isSafe = isSafe;
          record.needsCorrection = !isSafe;
          record.correctionNotes = correctionNotes.trim() || undefined;
        });
      });

      showToast(isSafe ? 'تم حفظ فحص الإلكتروليتات بنجاح - القراءات آمنة' : '⚠️ تم حفظ الفحص! تنبيه: توجد قراءات حرجة تتطلب تصحيحاً فورياً', isSafe ? 'success' : 'error');
      
      // Reset form
      setPhosphorus('');
      setPotassium('');
      setMagnesium('');
      setGlucose('');
      setCorrectionNotes('');

      // Reload history
      const records = await db.get('electrolyte_monitorings')
        .query(
          Q.where('patient_id', patientId),
          Q.sortBy('monitoring_date', Q.desc)
        ).fetch();
      setHistory(records);
    } catch (error) {
      console.error('Save monitoring error:', error);
      showToast('فشل في حفظ فحص الإلكتروليتات بقاعدة البيانات', 'error');
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
          <View style={{ flex: 1 }}>
            <ArabicText bold style={styles.headerTitle}>المراقبة اليومية للإلكتروليتات والسكري</ArabicText>
            <ArabicText style={styles.headerSubtitle}>الملف: {patientName} | رقم الملف: {patientMrn}</ArabicText>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Safety Warnings Banner */}
          {(isPhosCritical || isPotCritical || isMagCritical || isGlucCritical) && (
            <View style={styles.criticalAlertCard}>
              <View style={styles.alertHeader}>
                <Ionicons name="warning" size={22} color={colors.primaryContrast} />
                <ArabicText bold style={styles.alertTitle}>تحذير سريري حرج - قراءات خارج الحدود الآمنة</ArabicText>
              </View>
              <ArabicText style={styles.alertMessage}>
                {isPhosCritical && '⚠️ انخفاض الفوسفور (< 0.8 mmol/L): مؤشر حرج لخطر متلازمة إعادة التغذية (Cardiac Arrest).\n'}
                {isPotCritical && '⚠️ خلل البوتاسيوم (< 3.5 أو > 5.0 mEq/L): خطر حدوث اختلال كهربائي مميت في عضلة القلب.\n'}
                {isMagCritical && '⚠️ انخفاض المغنيسيوم (< 0.7 mEq/L): يعيق تصحيح نقص البوتاسيوم ويزيد خطر النوبات.\n'}
                {isGlucCritical && '⚠️ خلل سكر الدم (< 70 أو > 180 mg/dL): يتطلب تعديل الأنسولين أو ضخ الجلوكوز فوراً.'}
              </ArabicText>
              <ArabicText style={styles.alertAction}>
                الإجراء المطلوب: قم بتصحيح القراءات وريدياً وتجميد زيادات السعرات الحرارية لحين استقرار الإلكتروليتات.
              </ArabicText>
            </View>
          )}

          {/* Intake Form */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>تسجيل فحص جديد اليوم</ArabicText>

            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <TextInputField
                  label="البوتاسيوم (Potassium - mEq/L)"
                  value={potassium}
                  onChangeText={setPotassium}
                  keyboardType="decimal-pad"
                  placeholder="3.5 - 5.0"
                  error={isPotCritical ? 'قيمة حرجة!' : undefined}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInputField
                  label="الفوسفور (Phosphorus - mmol/L)"
                  value={phosphorus}
                  onChangeText={setPhosphorus}
                  keyboardType="decimal-pad"
                  placeholder=">= 0.8"
                  error={isPhosCritical ? 'قيمة حرجة!' : undefined}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <TextInputField
                  label="السكري (Glucose - mg/dL)"
                  value={glucose}
                  onChangeText={setGlucose}
                  keyboardType="decimal-pad"
                  placeholder="70 - 180"
                  error={isGlucCritical ? 'قيمة حرجة!' : undefined}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInputField
                  label="المغنيسيوم (Magnesium - mEq/L)"
                  value={magnesium}
                  onChangeText={setMagnesium}
                  keyboardType="decimal-pad"
                  placeholder=">= 0.7"
                  error={isMagCritical ? 'قيمة حرجة!' : undefined}
                />
              </View>
            </View>

            <TextInputField
              label="ملاحظات وتدابير التصحيح السريرية"
              value={correctionNotes}
              onChangeText={setCorrectionNotes}
              placeholder="مثال: تم تعويض البوتاسيوم بـ 40 mEq KCl وتجميد السعرات عند 10 kcal/kg..."
              multiline
            />

            <Button
              title="💾 حفظ الفحص وتحديث سجل المراقبة"
              onPress={handleSave}
              loading={isSaving}
              variant="primary"
              style={{ marginTop: spacing.md }}
            />
          </View>

          {/* History Trend List */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>سجل الفحوصات اليومية السابقة</ArabicText>
            {history.length === 0 ? (
              <ArabicText style={styles.emptyText}>لا توجد فحوصات مسجلة للمريض بعد.</ArabicText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {history.map((item) => {
                  const dateStr = new Date(item.monitoringDate).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={item.id} style={[styles.historyItem, { borderColor: item.isSafe ? colors.success : colors.danger }]}>
                      <View style={styles.historyHeader}>
                        <View style={styles.statusBadge}>
                          <Ionicons
                            name={item.isSafe ? 'checkmark-circle' : 'alert-circle'}
                            size={16}
                            color={item.isSafe ? colors.success : colors.danger}
                          />
                          <ArabicText bold style={{ color: item.isSafe ? colors.success : colors.danger, fontSize: 12 }}>
                            {item.isSafe ? 'قراءات آمنة' : 'قراءات حرجة!'}
                          </ArabicText>
                        </View>
                        <ArabicText style={styles.historyDate}>{dateStr}</ArabicText>
                      </View>

                      <View style={styles.historyGrid}>
                        <View style={styles.gridItem}>
                          <ArabicText style={styles.gridLabel}>فسفور</ArabicText>
                          <ArabicText bold style={[styles.gridValue, item.phosphorus < 0.8 && { color: colors.danger }]}>
                            {item.phosphorus} <ArabicText style={styles.gridUnit}>mmol/L</ArabicText>
                          </ArabicText>
                        </View>
                        <View style={styles.gridItem}>
                          <ArabicText style={styles.gridLabel}>بوتاسيوم</ArabicText>
                          <ArabicText bold style={[styles.gridValue, (item.potassium < 3.5 || item.potassium > 5) && { color: colors.danger }]}>
                            {item.potassium} <ArabicText style={styles.gridUnit}>mEq/L</ArabicText>
                          </ArabicText>
                        </View>
                        <View style={styles.gridItem}>
                          <ArabicText style={styles.gridLabel}>مغنيسيوم</ArabicText>
                          <ArabicText bold style={[styles.gridValue, item.magnesium < 0.7 && { color: colors.danger }]}>
                            {item.magnesium} <ArabicText style={styles.gridUnit}>mEq/L</ArabicText>
                          </ArabicText>
                        </View>
                        <View style={styles.gridItem}>
                          <ArabicText style={styles.gridLabel}>سكري</ArabicText>
                          <ArabicText bold style={[styles.gridValue, (item.glucose < 70 || item.glucose > 180) && { color: colors.danger }]}>
                            {item.glucose} <ArabicText style={styles.gridUnit}>mg/dL</ArabicText>
                          </ArabicText>
                        </View>
                      </View>

                      {item.correctionNotes && (
                        <View style={styles.notesBox}>
                          <ArabicText style={styles.notesText} numberOfLines={2}>
                            📝 {item.correctionNotes}
                          </ArabicText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
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
  headerTitle: { fontSize: 18, color: colors.primaryContrast, textAlign: 'right', fontFamily: 'ThmanyahSans-Bold' },
  headerSubtitle: { fontSize: 12, color: colors.primaryContrast + 'AA', textAlign: 'right', marginTop: 2, fontFamily: 'ThmanyahSans-Medium' },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  criticalAlertCard: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  alertHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  alertTitle: { color: colors.primaryContrast, fontSize: 14, fontFamily: 'ThmanyahSans-Bold', flex: 1, textAlign: 'right' },
  alertMessage: { color: colors.primaryContrast + 'DD', fontSize: 12, lineHeight: 18, textAlign: 'right', fontFamily: 'ThmanyahSans-Medium', marginVertical: 4 },
  alertAction: { color: colors.primaryContrast, fontSize: 12, fontWeight: 'bold', textAlign: 'right', fontFamily: 'ThmanyahSans-Bold', borderTopWidth: 1, borderTopColor: colors.danger + '44', paddingTop: 6, marginTop: 4 },
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
    fontFamily: 'ThmanyahSans-Bold',
  },
  inputRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  halfInput: { flex: 1 },
  emptyText: { textAlign: 'center', color: colors.textDisabled, fontSize: 13, paddingVertical: spacing.lg, fontFamily: 'ThmanyahSans-Medium' },
  historyItem: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.2,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.sm,
  },
  historyHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  historyDate: { fontSize: 11, color: colors.textSecondary, fontFamily: 'ThmanyahSans-Medium' },
  historyGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  gridItem: { flex: 1, minWidth: 70, alignItems: 'flex-end', backgroundColor: colors.surface, padding: 8, borderRadius: 8 },
  gridLabel: { fontSize: 10, color: colors.textSecondary, fontFamily: 'ThmanyahSans-Medium', marginBottom: 2 },
  gridValue: { fontSize: 13, color: colors.textPrimary, fontFamily: 'ThmanyahSans-Bold' },
  gridUnit: { fontSize: 9, fontFamily: 'ThmanyahSans-Medium' },
  notesBox: { backgroundColor: colors.surface, padding: 8, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: colors.primary },
  notesText: { fontSize: 11, color: colors.textSecondary, fontFamily: 'ThmanyahSans-Medium', textAlign: 'right' },
});
