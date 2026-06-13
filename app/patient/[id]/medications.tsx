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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import DatePickerField from '../../../src/presentation/components/DatePickerField';
import Button from '../../../src/presentation/components/Button';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { formatSafeDate } from '../../../src/utils/date';

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

const DNI_RISK_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: 'منخفض', value: 'low' },
  { label: 'متوسط', value: 'moderate' },
  { label: 'مرتفع', value: 'high' },
  { label: 'شديد', value: 'severe' },
] as const;

const SUPPLEMENT_TYPE_OPTIONS = [
  { label: 'فيتامين', value: 'vitamin' },
  { label: 'معدن', value: 'mineral' },
  { label: 'بروتين', value: 'protein' },
  { label: 'أحماض أمينية', value: 'amino_acid' },
  { label: 'أعشاب', value: 'herbal' },
  { label: 'زيوت', value: 'oil' },
  { label: 'أخرى', value: 'other' },
] as const;

const medicationSchema = z.object({
  drugName: z.string().min(1, 'اسم الدواء مطلوب'),
  dosage: z.string(),
  frequency: z.string(),
  route: z.string().min(1, 'طريقة الإعطاء مطلوبة'),
  startDate: z.string(),
  endDate: z.string(),
  prescribingPhysician: z.string(),
  dniRisk: z.string().min(1, 'تقييم التفاعل الدوائي الغذائي مطلوب'),
  dniNotes: z.string(),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

const supplementSchema = z.object({
  supplementName: z.string().min(1, 'اسم المكمل مطلوب'),
  dosage: z.string(),
  supplementType: z.string().min(1, 'نوع المكمل مطلوب'),
});

type SupplementFormValues = z.infer<typeof supplementSchema>;

interface MedicationItemData {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  unit: string;
  dniRisk: string;
  startDate?: string;
  endDate?: string;
}

interface SupplementItemData {
  id: string;
  supplementName: string;
  dosage: string;
  supplementType: string;
}

const DNI_COLORS: Record<string, string> = {
  none: colors.textDisabled,
  low: colors.success,
  moderate: colors.warning,
  high: '#E67E22',
  severe: colors.danger,
};

const DNI_LABELS: Record<string, string> = {
  none: 'لا يوجد',
  low: 'منخفض',
  moderate: 'متوسط',
  high: 'مرتفع',
  severe: 'شديد',
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

const SUPPLEMENT_TYPE_LABELS: Record<string, string> = {
  vitamin: 'فيتامين',
  mineral: 'معدن',
  protein: 'بروتين',
  amino_acid: 'أحماض أمينية',
  herbal: 'أعشاب',
  oil: 'زيوت',
  other: 'أخرى',
};

export default function MedicationsScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<MedicationItemData[]>([]);
  const [supplements, setSupplements] = useState<SupplementItemData[]>([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);
  const [isSavingMed, setIsSavingMed] = useState(false);
  const [isSavingSup, setIsSavingSup] = useState(false);

  const medForm = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      drugName: '',
      dosage: '',
      frequency: '',
      route: '',
      startDate: '',
      endDate: '',
      prescribingPhysician: '',
      dniRisk: '',
      dniNotes: '',
    },
  });

  const supForm = useForm<SupplementFormValues>({
    resolver: zodResolver(supplementSchema),
    defaultValues: {
      supplementName: '',
      dosage: '',
      supplementType: '',
    },
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleSave = useCallback(async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    return patientId;
  }, [patientId]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [medsResult, supsResult] = await Promise.all([
        loadMedications(),
        loadSupplements(),
      ]);
      setMedications(medsResult);
      setSupplements(supsResult);
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
      drugName: r.drugName,
      dosage: r.dosage || '',
      frequency: r.frequency || '',
      route: r.route,
      unit: '',
      dniRisk: r.dniRisk,
      startDate: r.startDate,
      endDate: r.endDate,
    }));
  }

  async function loadSupplements(): Promise<SupplementItemData[]> {
    const { GetSupplementsUseCase } = await import('../../../src/domain/use-cases/GetSupplementsUseCase');
    const uc = new GetSupplementsUseCase();
    const records = await uc.execute(patientId);
    return records.map((r) => ({
      id: r.id!,
      supplementName: r.supplementName,
      dosage: r.dosage || '',
      supplementType: r.supplementType,
    }));
  }

  const handleDeleteMedication = useCallback((id: string, name: string) => {
    Alert.alert('حذف دواء', `هل أنت متأكد من حذف "${name}"؟`, [
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

  const handleDeleteSupplement = useCallback((id: string, name: string) => {
    Alert.alert('حذف مكمل', `هل أنت متأكد من حذف "${name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const { DeleteSupplementUseCase } = await import('../../../src/domain/use-cases/DeleteSupplementUseCase');
            const uc = new DeleteSupplementUseCase();
            await uc.execute(id);
            setSupplements((prev) => prev.filter((s) => s.id !== id));
            showToast('تم حذف المكمل', 'success');
          } catch {
            showToast('فشل الحذف', 'error');
          }
        },
      },
    ]);
  }, [showToast]);

  const [medStartDate, setMedStartDate] = useState<Date | null>(null);
  const [medEndDate, setMedEndDate] = useState<Date | null>(null);

  const handleAddMedication = useCallback(async (values: MedicationFormValues) => {
    try {
      setIsSavingMed(true);
      const { AddMedicationUseCase } = await import('../../../src/domain/use-cases/AddMedicationUseCase');
      const uc = new AddMedicationUseCase();
      const newId = await uc.execute({
        patientId,
        drugName: values.drugName,
        dosage: values.dosage || undefined,
        frequency: values.frequency || undefined,
        route: values.route,
        startDate: medStartDate?.toISOString() || undefined,
        endDate: medEndDate?.toISOString() || undefined,
        prescribingPhysician: values.prescribingPhysician || undefined,
        dniRisk: values.dniRisk,
        dniNotes: values.dniNotes || undefined,
      });
      const fresh = await loadMedications();
      setMedications(fresh);
      setShowMedModal(false);
      medForm.reset();
      setMedStartDate(null);
      setMedEndDate(null);
      showToast('تم إضافة الدواء', 'success');
    } catch {
      showToast('فشل إضافة الدواء', 'error');
    } finally {
      setIsSavingMed(false);
    }
  }, [patientId, medStartDate, medEndDate, medForm, showToast]);

  const handleAddSupplement = useCallback(async (values: SupplementFormValues) => {
    try {
      setIsSavingSup(true);
      const { AddSupplementUseCase } = await import('../../../src/domain/use-cases/AddSupplementUseCase');
      const uc = new AddSupplementUseCase();
      await uc.execute({
        patientId,
        supplementName: values.supplementName,
        dosage: values.dosage || undefined,
        supplementType: values.supplementType,
      });
      const fresh = await loadSupplements();
      setSupplements(fresh);
      setShowSupModal(false);
      supForm.reset();
      showToast('تم إضافة المكمل', 'success');
    } catch {
      showToast('فشل إضافة المكمل', 'error');
    } finally {
      setIsSavingSup(false);
    }
  }, [patientId, supForm, showToast]);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="medical-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>الأدوية والمكملات</ArabicText>
          </View>
        </View>

        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArabicText bold style={styles.sectionTitle}>الأدوية</ArabicText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowMedModal(true)}
            >
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <ArabicText style={styles.addButtonText}>إضافة دواء</ArabicText>
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <ArabicText style={styles.emptyText}>لا توجد أدوية مسجلة</ArabicText>
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
                  <View style={[styles.dniBadge, { backgroundColor: DNI_COLORS[med.dniRisk] || colors.textDisabled }]}>
                    <ArabicText style={styles.dniBadgeText}>
                      {DNI_LABELS[med.dniRisk] || med.dniRisk}
                    </ArabicText>
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
                  <ArabicText style={styles.cardDetail}>
                    {ROUTE_LABELS[med.route] || med.route}
                  </ArabicText>
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

        {/* Supplements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArabicText bold style={styles.sectionTitle}>المكملات الغذائية</ArabicText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowSupModal(true)}
            >
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <ArabicText style={styles.addButtonText}>إضافة مكمل</ArabicText>
            </TouchableOpacity>
          </View>

          {supplements.length === 0 ? (
            <ArabicText style={styles.emptyText}>لا توجد مكملات مسجلة</ArabicText>
          ) : (
            supplements.map((sup) => (
              <TouchableOpacity
                key={sup.id}
                style={styles.card}
                onLongPress={() => handleDeleteSupplement(sup.id, sup.supplementName)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <ArabicText bold style={styles.cardTitle}>{sup.supplementName}</ArabicText>
                  <View style={styles.typeBadge}>
                    <ArabicText style={styles.typeBadgeText}>
                      {SUPPLEMENT_TYPE_LABELS[sup.supplementType] || sup.supplementType}
                    </ArabicText>
                  </View>
                </View>
                {sup.dosage && (
                  <ArabicText style={styles.cardDetail}>الجرعة: {sup.dosage}</ArabicText>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <TripleActionFooter
          patientId={patientId}
          screenKey="medications"
          onSave={handleSave}
          isSaving={false}
          isValid={true}
        />

        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal visible={showMedModal} animationType="slide" onRequestClose={() => setShowMedModal(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ArabicText bold style={styles.modalTitle}>إضافة دواء جديد</ArabicText>
              <TouchableOpacity onPress={() => { setShowMedModal(false); medForm.reset(); setMedStartDate(null); setMedEndDate(null); }}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInputField
                label="اسم الدواء"
                value={medForm.watch('drugName')}
                onChangeText={(v) => medForm.setValue('drugName', v, { shouldValidate: true })}
                error={medForm.formState.errors.drugName?.message}
                required
              />
              <TextInputField
                label="الجرعة"
                value={medForm.watch('dosage')}
                onChangeText={(v) => medForm.setValue('dosage', v)}
              />
              <DropdownField
                label="عدد مرات الإعطاء"
                options={FREQUENCY_OPTIONS}
                selectedValue={medForm.watch('frequency')}
                onValueChange={(v) => medForm.setValue('frequency', v)}
                placeholder="اختر عدد المرات..."
              />
              <DropdownField
                label="طريقة الإعطاء"
                options={ROUTE_OPTIONS}
                selectedValue={medForm.watch('route')}
                onValueChange={(v) => medForm.setValue('route', v, { shouldValidate: true })}
                error={medForm.formState.errors.route?.message}
                placeholder="اختر طريقة الإعطاء..."
                required
              />
              <DatePickerField
                label="تاريخ البدء"
                value={medStartDate}
                onChange={(d) => setMedStartDate(d)}
              />
              <DatePickerField
                label="تاريخ الانتهاء"
                value={medEndDate}
                onChange={(d) => setMedEndDate(d)}
              />
              <TextInputField
                label="الطبيب المصرح"
                value={medForm.watch('prescribingPhysician')}
                onChangeText={(v) => medForm.setValue('prescribingPhysician', v)}
              />
              <DropdownField
                label="تقييم التفاعل الدوائي الغذائي (DNI)"
                options={DNI_RISK_OPTIONS}
                selectedValue={medForm.watch('dniRisk')}
                onValueChange={(v) => medForm.setValue('dniRisk', v, { shouldValidate: true })}
                error={medForm.formState.errors.dniRisk?.message}
                placeholder="اختر مستوى الخطورة..."
                required
              />
              <TextInputField
                label="ملاحظات DNI"
                value={medForm.watch('dniNotes')}
                onChangeText={(v) => medForm.setValue('dniNotes', v)}
                multiline
              />

              <View style={styles.modalActions}>
                <Button
                  title="إضافة"
                  onPress={medForm.handleSubmit(handleAddMedication)}
                  loading={isSavingMed}
                  disabled={isSavingMed}
                />
                <Button
                  title="إلغاء"
                  variant="secondary"
                  onPress={() => { setShowMedModal(false); medForm.reset(); setMedStartDate(null); setMedEndDate(null); }}
                  disabled={isSavingMed}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Supplement Modal */}
      <Modal visible={showSupModal} animationType="slide" onRequestClose={() => setShowSupModal(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ArabicText bold style={styles.modalTitle}>إضافة مكمل غذائي</ArabicText>
              <TouchableOpacity onPress={() => { setShowSupModal(false); supForm.reset(); }}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInputField
                label="اسم المكمل"
                value={supForm.watch('supplementName')}
                onChangeText={(v) => supForm.setValue('supplementName', v, { shouldValidate: true })}
                error={supForm.formState.errors.supplementName?.message}
                required
              />
              <TextInputField
                label="الجرعة"
                value={supForm.watch('dosage')}
                onChangeText={(v) => supForm.setValue('dosage', v)}
              />
              <DropdownField
                label="نوع المكمل"
                options={SUPPLEMENT_TYPE_OPTIONS}
                selectedValue={supForm.watch('supplementType')}
                onValueChange={(v) => supForm.setValue('supplementType', v, { shouldValidate: true })}
                error={supForm.formState.errors.supplementType?.message}
                placeholder="اختر نوع المكمل..."
                required
              />

              <View style={styles.modalActions}>
                <Button
                  title="إضافة"
                  onPress={supForm.handleSubmit(handleAddSupplement)}
                  loading={isSavingSup}
                  disabled={isSavingSup}
                />
                <Button
                  title="إلغاء"
                  variant="secondary"
                  onPress={() => { setShowSupModal(false); supForm.reset(); }}
                  disabled={isSavingSup}
                />
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
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    color: colors.primaryContrast,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  addButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textDisabled,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  cardBody: {
    gap: 2,
  },
  cardDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dniBadgeText: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  spacer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    color: colors.primaryContrast,
  },
  modalContent: {
    padding: spacing.md,
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
