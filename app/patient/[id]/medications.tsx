import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies, fontSizes } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import SearchableDropdownField from '../../../src/presentation/components/SearchableDropdownField';
import DatePickerField from '../../../src/presentation/components/DatePickerField';
import Button from '../../../src/presentation/components/Button';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { useToastStore } from '../../../src/presentation/stores/toastStore';
import { formatSafeDate } from '../../../src/utils/date';
import { DrugNutrientInteractionRepository } from '../../../src/data/repositories/DrugNutrientInteractionRepository';
import { DrugNutrientEngine, IDNIInteractionMatch } from '../../../src/domain/services/DrugNutrientEngine';
import useClinicalAlerts from '../../../src/presentation/hooks/useClinicalAlerts';
import ClinicalAlertsBanner from '../../../src/presentation/components/ClinicalAlertsBanner';

const ROUTE_OPTIONS = [
  { label: 'فموي', value: 'oral' },
  { label: 'وريدي', value: 'iv' },
  { label: 'عضلي', value: 'im' },
  { label: 'تحت الجلد', value: 'sc' },
  { label: 'موضعي', value: 'topical' },
  { label: 'استنشاقي', value: 'inhaled' },
  { label: 'شرجي', value: 'rectal' },
] as const;

const FREQUENCY_OPTIONS = [
  { label: 'مرة يومياً', value: 'once_daily' },
  { label: 'مرتين يومياً', value: 'twice_daily' },
  { label: 'ثلاث مرات يومياً', value: 'three_times_daily' },
  { label: 'أربع مرات يومياً', value: 'four_times_daily' },
  { label: 'عند الحاجة', value: 'prn' },
  { label: 'أسبوعياً', value: 'weekly' },
  { label: 'شهرياً', value: 'monthly' },
] as const;

const medicationSchema = z.object({
  drugName: z.string().min(1, 'اسم الدواء مطلوب'),
  dosage: z.string(),
  frequency: z.string(),
  route: z.string().min(1, 'طريقة الإعطاء مطلوبة'),
  prescribingPhysician: z.string(),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

interface MedicationItemData {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  unit: string;
  dniRisk?: string;
  startDate?: string;
  endDate?: string;
}

const DNI_COLORS: Record<string, string> = {
  none: colors.textDisabled,
  low: colors.success,
  moderate: colors.warning,
  high: '#E67E22',
  severe: colors.danger,
  critical: colors.danger,
};

const DNI_LABELS: Record<string, string> = {
  none: 'لا يوجد',
  low: 'منخفض',
  moderate: 'متوسط',
  high: 'مرتفع',
  severe: 'شديد',
  critical: 'حرج',
};

const ROUTE_LABELS: Record<string, string> = {
  oral: 'فموي',
  iv: 'وريدي',
  im: 'عضلي',
  sc: 'تحت الجلد',
  topical: 'موضعي',
  inhaled: 'استنشاقي',
  rectal: 'شرجي',
};

const FREQUENCY_LABELS: Record<string, string> = {
  once_daily: 'مرة يومياً',
  twice_daily: 'مرتين يومياً',
  three_times_daily: 'ثلاث مرات يومياً',
  four_times_daily: 'أربع مرات يومياً',
  prn: 'عند الحاجة',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
};

/**
 * Defensive definition to satisfy compiler for any stale remnants.
 * Note: Supplements should be handled in a separate module.
 */
const SUPPLEMENT_TYPE_OPTIONS: any[] = [];

export default function MedicationsScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { alerts } = useClinicalAlerts(patientId);
  const showToast = useToastStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<MedicationItemData[]>([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [isSavingMed, setIsSavingMed] = useState(false);

  const [referenceDrugs, setReferenceDrugs] = useState<{ label: string, value: string }[]>([]);
  const [selectedDni, setSelectedDni] = useState<{ mechanism: string, severity: string, actionReq: boolean } | null>(null);

  const medForm = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      drugName: '',
      dosage: '',
      frequency: 'once_daily',
      route: 'oral',
      prescribingPhysician: '',
    },
  });

  useEffect(() => {
    loadData();
    fetchReferenceMeds();
  }, [patientId]);

  async function fetchReferenceMeds() {
    try {
      const repo = new DrugNutrientInteractionRepository();
      const all = await repo.getAll();
      setReferenceDrugs(all.map(d => ({ label: d.activeIngredient, value: d.activeIngredient })));
    } catch (e) {
      console.error('[Medications] Failed to fetch reference meds:', e);
    }
  }

  const handleDrugSelect = async (drugName: string) => {
    medForm.setValue('drugName', drugName, { shouldValidate: true });
    
    // Auto-fetch DNI details for preview
    try {
      const repo = new DrugNutrientInteractionRepository();
      const matches = await repo.getByIngredient(drugName);
      if (matches.length > 0) {
        const m = matches[0];
        setSelectedDni({
          mechanism: m.mechanismAr ?? m.mechanismEn ?? 'تفاعل محتمل مع الغذاء',
          severity: m.clinicalSeverity,
          actionReq: !!(m.dietaryActionAr || m.dietaryActionEn),
        });
      } else {
        setSelectedDni(null);
      }
    } catch (e) {
      setSelectedDni(null);
    }
  };

  const handleSave = useCallback(async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    return patientId;
  }, [patientId]);

  async function loadData() {
    try {
      setIsLoading(true);
      const medsResult = await loadMedications();
      setMedications(medsResult);
    } catch {
      showToast('فشل تحميل البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMedications(): Promise<MedicationItemData[]> {
    const { GetMedicationsUseCase } = await import('../../../src/domain/use-cases/GetMedicationsUseCase');
    const uc = new GetMedicationsUseCase();
    const records = await uc.execute(patientId);
    return records.map((r) => ({
      id: r.id!,
      drugName: r.drugName || '',
      dosage: r.dosage || '',
      frequency: r.frequency || '',
      route: r.route || '',
      unit: '',
      dniRisk: r.dniRisk,
      startDate: r.startDate,
      endDate: r.endDate,
    }));
  }

  const handleDeleteMedication = useCallback((id: string, name: string) => {
    Alert.alert('حذف دواء', `هل أنت متأكد من حذف \"${name}\"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const { DeleteMedicationUseCase } = await import('../../../src/domain/use-cases/DeleteMedicationUseCase');
            const uc = new DeleteMedicationUseCase();
            await uc.execute(id);
            setMedications((prev) => prev.filter((m) => m.id !== id));
            showToast('تم حذف الدواء', 'success');
          } catch {
            showToast('فشل الحذف', 'error');
          }
        },
      },
    ]);
  }, [showToast]);

  const [medRecordedAt, setMedRecordedAt] = useState<Date | null>(null);
  const [medStartDate, setMedStartDate] = useState<Date | null>(null);
  const [medEndDate, setMedEndDate] = useState<Date | null>(null);

  const handleAddMedication = useCallback(async (values: MedicationFormValues) => {
    try {
      setIsSavingMed(true);
      const { AddMedicationUseCase } = await import('../../../src/domain/use-cases/AddMedicationUseCase');
      const uc = new AddMedicationUseCase();
      await uc.execute({
        patientId,
        drugName: values.drugName,
        dosage: values.dosage || undefined,
        frequency: values.frequency || undefined,
        route: values.route,
        startDate: medStartDate?.toISOString() || undefined,
        endDate: medEndDate?.toISOString() || undefined,
        recordedAt: medRecordedAt?.toISOString() || new Date().toISOString(),
        prescribingPhysician: values.prescribingPhysician || undefined,
        dniRisk: selectedDni?.severity || 'none',
        dniNotes: selectedDni?.mechanism || undefined,
      });
      const fresh = await loadMedications();
      setMedications(fresh);
      setShowMedModal(false);
      medForm.reset();
      setMedRecordedAt(null);
      setMedStartDate(null);
      setMedEndDate(null);
      setSelectedDni(null);
      showToast('تم إضافة الدواء وتفعيل مراقبة DNI ✓', 'success');
    } catch (error) {
      console.error(error);
      showToast('فشل إضافة الدواء', 'error');
    } finally {
      setIsSavingMed(false);
    }
  }, [patientId, medStartDate, medEndDate, medForm, selectedDni, showToast]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="medical-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>إدارة الأدوية وDNI</ArabicText>
          </View>
        </View>

        <ClinicalAlertsBanner alerts={alerts} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArabicText bold style={styles.sectionTitle}>قائمة الأدوية النشطة</ArabicText>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowMedModal(true)}>
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <ArabicText style={styles.addButtonText}>إضافة دواء</ArabicText>
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <ArabicText style={styles.emptyText}>لا توجد أدوية مسجلة لهذه الحالة</ArabicText>
          ) : (
            medications.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={styles.card}
                onLongPress={() => handleDeleteMedication(med.id, med.drugName)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <ArabicText bold style={styles.cardTitle}>{med.drugName}</ArabicText>
                  <View style={[styles.dniBadge, { backgroundColor: DNI_COLORS[med.dniRisk ?? ''] || colors.textDisabled }]}>
                    <ArabicText style={styles.dniBadgeText}>{DNI_LABELS[med.dniRisk ?? ''] || med.dniRisk}</ArabicText>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  {(med.dosage || med.frequency) && (
                    <ArabicText style={styles.cardDetail}>
                      {med.dosage && `${med.dosage}`}
                      {med.dosage && med.frequency && ' - '}
                      {med.frequency && (FREQUENCY_LABELS[med.frequency] || med.frequency)}
                    </ArabicText>
                  )}
                  <ArabicText style={styles.cardDetail}>{ROUTE_LABELS[med.route] || med.route}</ArabicText>
                  {med.startDate && (
                    <ArabicText style={styles.cardDetail}>
                      من: {formatSafeDate(med.startDate)}
                      {med.endDate ? ` إلى: ${formatSafeDate(med.endDate)}` : ''}
                    </ArabicText>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TripleActionFooter patientId={patientId} screenKey="medications" onSave={handleSave} isSaving={false} isValid={true} />
        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal visible={showMedModal} animationType="slide" onRequestClose={() => setShowMedModal(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ArabicText bold style={styles.modalTitle}>إضافة دواء جديد</ArabicText>
              <TouchableOpacity onPress={() => { setShowMedModal(false); medForm.reset(); setMedRecordedAt(null); setMedStartDate(null); setMedEndDate(null); setSelectedDni(null); }}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <SearchableDropdownField
                label="اسم الدواء (المادة الفعالة)"
                options={referenceDrugs}
                selectedValue={medForm.watch('drugName')}
                onValueChange={handleDrugSelect}
                error={medForm.formState.errors.drugName?.message}
                placeholder="ابحث عن المادة الفعالة..."
                required
              />

              <View style={styles.row}>
                <View style={styles.flex}>
                  <TextInputField label="الجرعة" value={medForm.watch('dosage')} onChangeText={(v) => medForm.setValue('dosage', v)} />
                </View>
                <View style={[styles.flex, { marginRight: spacing.sm }]}>
                  <DropdownField label="طريقة الإعطاء" options={ROUTE_OPTIONS} selectedValue={medForm.watch('route')} onValueChange={(v) => medForm.setValue('route', v, { shouldValidate: true })} error={medForm.formState.errors.route?.message} required />
                </View>
              </View>

              <DropdownField label="التكرار" options={FREQUENCY_OPTIONS} selectedValue={medForm.watch('frequency')} onValueChange={(v) => medForm.setValue('frequency', v)} />
              
              <View style={styles.row}>
                <View style={styles.flex}>
                  <DatePickerField label="تاريخ البدء" value={medStartDate} onChange={(d) => setMedStartDate(d)} />
                </View>
                <View style={[styles.flex, { marginRight: spacing.sm }]}>
                  <DatePickerField label="تاريخ الانتهاء" value={medEndDate} onChange={(d) => setMedEndDate(d)} />
                </View>
              </View>

              <DatePickerField
                label="تاريخ التسجيل (وقت الإعطاء الفعلي)"
                value={medRecordedAt}
                onChange={(d) => setMedRecordedAt(d)}
                disableFuture
              />

              <TextInputField label="الطبيب المصرح" value={medForm.watch('prescribingPhysician')} onChangeText={(v) => medForm.setValue('prescribingPhysician', v)} />

              {/* AUTOMATED DNI PREVIEW CARD */}
              {selectedDni && (
                <View style={[styles.dniPreviewCard, { borderColor: DNI_COLORS[selectedDni.severity] || colors.border }]}>
                  <View style={styles.dniPreviewHeader}>
                    <Ionicons name="shield-checkmark" size={18} color={DNI_COLORS[selectedDni.severity]} />
                    <ArabicText bold style={[styles.dniPreviewTitle, { color: DNI_COLORS[selectedDni.severity] }]}>
                      تقييم التفاعل التلقائي (Automated DNI)
                    </ArabicText>
                  </View>
                  <ArabicText style={styles.dniPreviewText}>{selectedDni.mechanism}</ArabicText>
                  {selectedDni.actionReq && (
                    <View style={styles.actionBadge}>
                      <Ionicons name="flash" size={12} color="#FFF" />
                      <ArabicText style={styles.actionBadgeText}>مطلوب تعديل الحمية الغذائية</ArabicText>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button title="إضافة الدواء وتفعيل المراقبة" onPress={medForm.handleSubmit(handleAddMedication)} loading={isSavingMed} disabled={isSavingMed} />
                <Button title="إلغاء" variant="secondary" onPress={() => { setShowMedModal(false); medForm.reset(); setMedRecordedAt(null); setMedStartDate(null); setMedEndDate(null); setSelectedDni(null); }} disabled={isSavingMed} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  loadingText: { fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.primaryDark, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.lg, paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: 22, color: colors.primaryContrast, flex: 1, textAlign: 'right' },
  section: { backgroundColor: colors.surface, margin: spacing.md, marginBottom: 0, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceSecondary, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontFamily: fontFamilies.bold },
  addButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
  addButtonText: { fontSize: 13, color: colors.success, fontWeight: '600' },
  emptyText: { fontSize: 14, color: colors.textDisabled, textAlign: 'center', paddingVertical: spacing.lg },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: spacing.sm + 2, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  cardBody: { gap: 2 },
  cardDetail: { fontSize: 13, color: colors.textSecondary, textAlign: 'right' },
  dniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dniBadgeText: { fontSize: 10, color: colors.primaryContrast, fontWeight: '700' },
  spacer: { height: 80 },
  modalContainer: { flex: 1, backgroundColor: colors.surfaceSecondary },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryDark, paddingTop: safeHeaderPaddingTop, paddingBottom: spacing.md, paddingHorizontal: spacing.md },
  modalTitle: { fontSize: 20, color: colors.primaryContrast, fontFamily: fontFamilies.bold },
  modalContent: { padding: spacing.md },
  modalActions: { gap: spacing.sm, marginTop: spacing.lg },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  dniPreviewCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginTop: spacing.md, borderWidth: 1.5, borderStyle: 'dashed' },
  dniPreviewHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 },
  dniPreviewTitle: { fontSize: 13, color: colors.textPrimary },
  dniPreviewText: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', lineHeight: 18 },
  actionBadge: { backgroundColor: colors.danger, alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  actionBadgeText: { color: '#FFF', fontSize: 11, fontFamily: fontFamilies.bold },
});
