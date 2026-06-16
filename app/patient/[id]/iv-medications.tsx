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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, safeHeaderPaddingTop } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import Button from '../../../src/presentation/components/Button';
import { getDatabase } from '../../../src/data/database';
import { Q } from '@nozbe/watermelondb';
import {
  calculatePropofolCalories,
  calculateDextroseCalories,
  calculateMidolCalories,
  calculateLipidEmulsionCalories,
} from '../../../src/domain/utils/kauRequirementsEngine';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';

const MED_OPTIONS = [
  { label: 'بروبوفول (Propofol / Diprivan)', value: 'Propofol' },
  { label: 'دكستروز وريدي (Dextrose IV Flush)', value: 'Dextrose' },
  { label: 'ميدازولام (Midazolam / Versed)', value: 'Midazolam' },
  { label: 'مستحلب دهون (Lipid Emulsion / Smoflipid)', value: 'Lipid Emulsion' },
];

const DEXTROSE_CONCENTRATIONS = [
  { label: '5% (D5W)', value: '5' },
  { label: '10% (D10W)', value: '10' },
  { label: '25% (D25W)', value: '25' },
  { label: '50% (D50W)', value: '50' },
];

const LIPID_CONCENTRATIONS = [
  { label: '10% Lipid Emulsion', value: '10' },
  { label: '20% Lipid Emulsion', value: '20' },
];

export default function IVMedicationsScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);

  // Form states
  const [medName, setMedName] = useState('Propofol');
  const [mlPerHour, setMlPerHour] = useState('');
  const [totalMlPerDay, setTotalMlPerDay] = useState('');
  const [concentration, setConcentration] = useState('5'); // percent
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Dropdown open states
  const [openMed, setOpenMed] = useState(false);
  const [openConc, setOpenConc] = useState(false);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const p = await db.get('patients').find(patientId);
      setPatient(p);

      const meds = await db.get('medications')
        .query(Q.where('patient_id', patientId), Q.where('is_active', true))
        .fetch();
      setMedications(meds);
    } catch (e) {
      console.error(e);
      showToast('فشل في تحميل بيانات الأدوية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMedChange = (val: string) => {
    setMedName(val);
    setMlPerHour('');
    setTotalMlPerDay('');
    if (val === 'Propofol') {
      setConcentration('10');
    } else if (val === 'Dextrose') {
      setConcentration('5');
    } else if (val === 'Lipid Emulsion') {
      setConcentration('10');
    }
  };

  // Real-time hidden calories calculations
  const currentCalculatedCalories = useMemo(() => {
    const rate = parseFloat(mlPerHour) || 0;
    const vol = parseFloat(totalMlPerDay) || 0;
    const pct = parseFloat(concentration) || 0;

    if (medName === 'Propofol') {
      return calculatePropofolCalories(rate);
    } else if (medName === 'Dextrose') {
      return calculateDextroseCalories(vol, pct);
    } else if (medName === 'Midazolam') {
      return calculateMidolCalories(rate);
    } else if (medName === 'Lipid Emulsion') {
      return calculateLipidEmulsionCalories(vol, pct);
    }
    return 0;
  }, [medName, mlPerHour, totalMlPerDay, concentration]);

  // Total daily hidden calories
  const totalHiddenCalories = useMemo(() => {
    return medications.reduce((sum, med) => sum + (med.hiddenCalories || 0), 0);
  }, [medications]);

  const handleAddMedication = async () => {
    const rate = parseFloat(mlPerHour) || 0;
    const vol = parseFloat(totalMlPerDay) || 0;
    const pct = parseFloat(concentration) || 0;

    if (medName === 'Propofol' || medName === 'Midazolam') {
      if (rate <= 0) {
        showToast('يرجى إدخال معدل تدفق صحيح مل/ساعة', 'error');
        return;
      }
    } else {
      if (vol <= 0) {
        showToast('يرجى إدخال حجم كلي صحيح مل/يوم', 'error');
        return;
      }
    }

    try {
      setIsAdding(true);
      const db = await getDatabase();
      const now = new Date();

      const medNameAr =
        medName === 'Propofol'
          ? 'بروبوفول (Propofol)'
          : medName === 'Dextrose'
          ? `دكستروز وريدي ${pct}%`
          : medName === 'Midazolam'
          ? 'ميدازولام (Midazolam)'
          : `مستحلب دهون ${pct}%`;

      const medType =
        medName === 'Propofol' || medName === 'Midazolam'
          ? 'sedation'
          : medName === 'Dextrose'
          ? 'diluent'
          : 'lipid';

      await db.write(async () => {
        await db.get('medications').create((r: any) => {
          r.patientId = patientId;
          r.drugName = medName;
          r.name = medName;
          r.nameAr = medNameAr;
          r.type = medType;
          r.mlPerHour = rate;
          r.totalMlPerDay = vol;
          r.percent = pct;
          r.isActive = true;
          r.notes = notes;
          r.createdAt = now;
          r.updatedAt = now;
        });
      });

      showToast('تمت إضافة دواء السعرات بنجاح', 'success');
      setNotes('');
      setMlPerHour('');
      setTotalMlPerDay('');
      loadData();
    } catch (e: any) {
      console.error(e);
      showToast('حدث خطأ أثناء إضافة الدواء: ' + e.message, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMedication = async (medId: string, medNameAr: string) => {
    Alert.alert(
      'تأكيد إزالة الدواء',
      `هل أنت متأكد من إزالة ${medNameAr}؟ سيتم إلغاء تأثير السعرات المخفية الخاصة به على خطة التغذية.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              const record = await db.get('medications').find(medId);
              await db.write(async () => {
                await record.markAsDeleted();
              });
              showToast('تم إزالة الدواء', 'success');
              loadData();
            } catch (e: any) {
              showToast('فشل إزالة الدواء: ' + e.message, 'error');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
        </TouchableOpacity>
        <ArabicText style={styles.headerTitle}>الأدوية والمحاليل (السعرات المخفية)</ArabicText>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Total Hidden Calories Summary */}
        {medications.length > 0 && (
          <View style={styles.summaryCard}>
            <ArabicText style={styles.summaryTitle}>ملخص السعرات الحرارية المخفية</ArabicText>
            <ArabicText style={styles.summaryValue}>{totalHiddenCalories.toFixed(0)} سعرة/يوم</ArabicText>
            <ArabicText style={styles.summaryDesc}>
              سيتم طرح هذا المقدار تلقائياً من إجمالي الاحتياجات المستهدفة للمريض في حاسبة التغذية لمنع خطر Overfeeding.
            </ArabicText>
          </View>
        )}

        {/* Add Medication Card */}
        <View style={styles.card}>
          <ArabicText style={styles.cardTitle}>إضافة دواء / محلول وريدي نشط</ArabicText>

          <DropdownField
            label="نوع الدواء / المحلول"
            value={medName}
            options={MED_OPTIONS}
            onSelect={handleMedChange}
            open={openMed}
            setOpen={setOpenMed}
            zIndex={2000}
          />

          {(medName === 'Propofol' || medName === 'Midazolam') && (
            <TextInputField
              label="سرعة ضخ الدواء (مل/ساعة)"
              value={mlPerHour}
              onChangeText={setMlPerHour}
              placeholder="مثال: 20"
              keyboardType="numeric"
            />
          )}

          {(medName === 'Dextrose' || medName === 'Lipid Emulsion') && (
            <View style={{ gap: spacing.md }}>
              <TextInputField
                label="الحجم الإجمالي اليومي للمحلول (مل/يوم)"
                value={totalMlPerDay}
                onChangeText={setTotalMlPerDay}
                placeholder="مثال: 500"
                keyboardType="numeric"
              />

              <DropdownField
                label="التركيز (%)"
                value={concentration}
                options={medName === 'Dextrose' ? DEXTROSE_CONCENTRATIONS : LIPID_CONCENTRATIONS}
                onSelect={setConcentration}
                open={openConc}
                setOpen={setOpenConc}
                zIndex={1000}
              />
            </View>
          )}

          {/* Real-time calories feedback */}
          {currentCalculatedCalories > 0 && (
            <View style={styles.feedbackContainer}>
              <Ionicons name="warning-outline" size={20} color="#E65100" />
              <ArabicText style={styles.feedbackText}>
                السعرات المخفية المتولدة: {currentCalculatedCalories} سعرة/يوم
              </ArabicText>
            </View>
          )}

          <TextInputField
            label="ملاحظات إضافية"
            value={notes}
            onChangeText={setNotes}
            placeholder="أضف أي ملاحظات سريرية هنا..."
          />

          <Button
            title={isAdding ? 'جاري الإضافة...' : 'إضافة دواء وريدي'}
            onPress={handleAddMedication}
            disabled={isAdding}
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* Active Medications List */}
        <View style={styles.card}>
          <ArabicText style={styles.cardTitle}>الأدوية والمحاليل النشطة حالياً</ArabicText>

          {medications.length === 0 ? (
            <ArabicText style={styles.emptyText}>لا توجد محاليل أو أدوية نشطة تسبب سعرات حرارية مخفية مسجلة حالياً.</ArabicText>
          ) : (
            medications.map((med) => (
              <View key={med.id} style={styles.medRow}>
                <View style={styles.medInfo}>
                  <ArabicText style={styles.medName}>{med.nameAr}</ArabicText>
                  <ArabicText style={styles.medMeta}>
                    {med.mlPerHour > 0 ? `السرعة: ${med.mlPerHour} مل/ساعة` : `الحجم: ${med.totalMlPerDay} مل/يوم`}
                    {med.notes ? ` • ${med.notes}` : ''}
                  </ArabicText>
                </View>
                <View style={styles.medAction}>
                  <ArabicText style={styles.medCalories}>+{med.hiddenCalories?.toFixed(0)} سعرة</ArabicText>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteMedication(med.id, med.nameAr)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: colors.surfaceSecondary },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary },
  header: {
    paddingTop: safeHeaderPaddingTop + 12,
    paddingBottom: 16,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryContrast,
    flex: 1,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  summaryTitle: { fontSize: 13, color: '#E65100', fontWeight: 'bold' },
  summaryValue: { fontSize: 26, fontWeight: 'bold', color: '#E65100', marginVertical: spacing.xs },
  summaryDesc: { fontSize: 11, color: '#F57C00', textAlign: 'right', lineHeight: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  feedbackContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFE0B2',
    borderColor: '#FFB74D',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedbackText: { fontSize: 12, color: '#E65100', fontWeight: 'bold', flex: 1, textAlign: 'right' },
  medRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  medInfo: { flex: 1, alignItems: 'flex-end', gap: spacing.xs },
  medName: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  medMeta: { fontSize: 11, color: colors.textSecondary },
  medAction: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  medCalories: { fontSize: 13, fontWeight: 'bold', color: colors.danger },
  deleteBtn: { padding: spacing.xs },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});
