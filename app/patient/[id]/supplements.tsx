import React, { useState, useEffect, useCallback } from 'react';
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
import Patient from '../../../src/data/models/Patient';
import SupplementModel from '../../../src/data/models/Supplement';
import { SupplementRepository } from '../../../src/data/repositories/SupplementRepository';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import { useAppTheme } from '../../../src/presentation/hooks/useAppTheme';
import SearchableDropdownField from '../../../src/presentation/components/SearchableDropdownField';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import Button from '../../../src/presentation/components/Button';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

const SUPPLEMENT_TYPE_OPTIONS = [
  { label: 'فيتامين', value: 'vitamin' },
  { label: 'معدن', value: 'mineral' },
  { label: 'بروتين', value: 'protein' },
  { label: 'أحماض أمينية', value: 'amino_acid' },
  { label: 'أعشاب', value: 'herbal' },
  { label: 'زيوت', value: 'oil' },
  { label: 'أخرى', value: 'other' },
];

const COMMON_SUPPLEMENTS = [
  { label: 'فيتامين د3 (Vitamin D3)', value: 'Vitamin D3' },
  { label: 'كالسيوم (Calcium)', value: 'Calcium' },
  { label: 'حديد (Iron)', value: 'Iron' },
  { label: 'زنك (Zinc)', value: 'Zinc' },
  { label: 'أوميغا 3 (Omega-3)', value: 'Omega-3' },
  { label: 'فيتامين ب12 (Vitamin B12)', value: 'Vitamin B12' },
  { label: 'مجموعة فيتامينات ب (B-Complex)', value: 'B-Complex' },
  { label: 'فيتامينات متعددة (Multivitamin)', value: 'Multivitamin' },
  { label: 'حمض الفوليك (Folic Acid)', value: 'Folic Acid' },
  { label: 'بروتين (Protein)', value: 'Protein' },
  { label: 'بوتاسيوم (Potassium)', value: 'Potassium' },
  { label: 'مغنيسيوم (Magnesium)', value: 'Magnesium' },
  { label: 'فيتامين ج (Vitamin C)', value: 'Vitamin C' },
  { label: 'أخرى / مكمل مخصص (Other)', value: 'other' },
];

export default function SupplementsScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const { theme } = useAppTheme();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [supplements, setSupplements] = useState<SupplementModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [customSupplementName, setCustomSupplementName] = useState('');
  const [dosage, setDosage] = useState('');
  const [supplementType, setSupplementType] = useState('');

  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);

    const supplements$ = watchQuery<SupplementModel>((db) => {
      return db.get('supplements').query(
        Q.where('patient_id', patientId),
        Q.sortBy('created_at', 'desc'),
      );
    }).pipe(
      map((records) => records.slice(0, 50)),
    );

    const stream = combineLatest([patient$, supplements$]).subscribe({
      next: ([p, records]) => {
        setPatient(p);
        setSupplements(records);
        setIsLoading(false);
      },
      error: (err) => {
        console.error('Supplements stream error:', err);
        showToast('خطأ في تحميل بيانات المكملات', 'error');
        setIsLoading(false);
      },
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  const resetForm = useCallback(() => {
    setSelectedSupplement('');
    setCustomSupplementName('');
    setDosage('');
    setSupplementType('');
  }, []);

  const handleSave = useCallback(async () => {
    const nameToSave = selectedSupplement === 'other' ? customSupplementName : selectedSupplement;

    if (!nameToSave.trim()) {
      showToast('الرجاء إدخال اسم المكمل الغذائي', 'error');
      return;
    }
    if (!supplementType) {
      showToast('الرجاء اختيار نوع المكمل الغذائي', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const repo = new SupplementRepository();
      await repo.save({
        patientId,
        supplementName: nameToSave.trim(),
        dosage: dosage.trim() || undefined,
        supplementType,
      });

      showToast('تم إضافة المكمل الغذائي بنجاح', 'success');
      resetForm();
    } catch (error) {
      console.error('Save supplement error:', error);
      showToast('فشل في حفظ المكمل الغذائي', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedSupplement, customSupplementName, dosage, supplementType, patientId, resetForm, showToast]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    Alert.alert(
      'حذف المكمل',
      `هل أنت متأكد من حذف "${name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const repo = new SupplementRepository();
              await repo.delete(id);
              showToast('تم حذف المكمل', 'success');
            } catch (error) {
              console.error('Delete supplement error:', error);
              showToast('فشل في حذف المكمل', 'error');
            }
          },
        },
      ],
    );
  }, [showToast]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={[styles.loadingText, { color: theme.subtext }]}>جاري تحميل بيانات المكملات الغذائية...</ArabicText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ArabicText bold style={styles.headerTitle}>المكملات الغذائية</ArabicText>
            {patient && (
              <ArabicText style={styles.headerSubtitle}>
                {patient.fullName} | {patient.fileNumber}
              </ArabicText>
            )}
          </View>
        </View>

        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ArabicText bold style={[styles.cardTitle, { color: theme.text }]}>➕ إضافة مكمل غذائي</ArabicText>

            <SearchableDropdownField
              label="اسم المكمل"
              options={COMMON_SUPPLEMENTS}
              selectedValue={selectedSupplement}
              onValueChange={(val) => {
                setSelectedSupplement(val);
                // Auto-detect type based on selected supplement
                if (val === 'Vitamin D3' || val === 'Vitamin B12' || val === 'Vitamin C' || val === 'B-Complex') {
                  setSupplementType('vitamin');
                } else if (val === 'Calcium' || val === 'Iron' || val === 'Zinc' || val === 'Potassium' || val === 'Magnesium') {
                  setSupplementType('mineral');
                } else if (val === 'Protein') {
                  setSupplementType('protein');
                } else if (val === 'Omega-3') {
                  setSupplementType('oil');
                }
              }}
              placeholder="اختر اسم المكمل..."
              searchPlaceholder="ابحث عن المكمل..."
              required
            />

            {selectedSupplement === 'other' && (
              <TextInputField
                label="اسم المكمل المخصص"
                value={customSupplementName}
                onChangeText={setCustomSupplementName}
                placeholder="أدخل اسم المكمل..."
                required
              />
            )}

            <DropdownField
              label="نوع المكمل"
              options={SUPPLEMENT_TYPE_OPTIONS}
              selectedValue={supplementType}
              onValueChange={setSupplementType}
              placeholder="اختر نوع المكمل..."
              required
            />

            <TextInputField
              label="الجرعة والتعليمات"
              value={dosage}
              onChangeText={setDosage}
              placeholder="مثال: 5000 IU يومياً عن طريق الفم"
            />

            <Button
              title="💾 حفظ المكمل"
              onPress={handleSave}
              loading={isSaving}
              variant="primary"
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ArabicText bold style={[styles.cardTitle, { color: theme.text }]}>📋 المكملات الحالية</ArabicText>
            <ArabicText style={[styles.cardSubtitle, { color: theme.subtext }]}>
              إجمالي المكملات المسجلة: {supplements.length}
            </ArabicText>

            {supplements.length === 0 ? (
              <ArabicText style={[styles.emptyText, { color: theme.subtext }]}>
                لا توجد مكملات غذائية مسجلة لهذا المريض. استخدم النموذج أعلاه لإضافة المكملات.
              </ArabicText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {supplements.map((item) => {
                  const typeLabel = SUPPLEMENT_TYPE_OPTIONS.find(
                    (o) => o.value === item.supplementType,
                  )?.label || item.supplementType;

                  return (
                    <View key={item.id} style={[styles.supplementItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <View style={styles.supplementHeader}>
                        <View style={styles.typeBadge}>
                          <ArabicText style={styles.typeBadgeText}>{typeLabel}</ArabicText>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id, item.supplementName)}
                          style={styles.deleteBtn}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </View>

                      <ArabicText bold style={[styles.supplementName, { color: theme.text }]}>
                        {item.supplementName}
                      </ArabicText>

                      {item.dosage ? (
                        <ArabicText style={[styles.supplementDosage, { color: theme.subtext }]}>{item.dosage}</ArabicText>
                      ) : null}

                      <ArabicText style={[styles.supplementDate, { color: theme.subtext }]}>
                        أضيف في: {new Date(item.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </ArabicText>
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
  flex: { flex: 1 },
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
    fontFamily: fontFamilies.regular,
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: spacing.md,
    fontFamily: fontFamilies.regular,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: spacing.lg,
    fontFamily: fontFamilies.regular,
  },
  supplementItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  supplementHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: colors.primary + '22',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  supplementName: {
    fontSize: 15,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  supplementDosage: {
    fontSize: 13,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  supplementDate: {
    fontSize: 11,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
});
