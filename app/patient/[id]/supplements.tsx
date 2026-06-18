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

export default function SupplementsScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [supplements, setSupplements] = useState<SupplementModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [supplementName, setSupplementName] = useState('');
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
    setSupplementName('');
    setDosage('');
    setSupplementType('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!supplementName.trim()) {
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
        supplementName: supplementName.trim(),
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
  }, [supplementName, dosage, supplementType, patientId, resetForm, showToast]);

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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل بيانات المكملات الغذائية...</ArabicText>
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
            <ArabicText bold style={styles.headerTitle}>المكملات الغذائية</ArabicText>
            {patient && (
              <ArabicText style={styles.headerSubtitle}>
                {patient.fullName} | {patient.fileNumber}
              </ArabicText>
            )}
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>➕ إضافة مكمل غذائي</ArabicText>

            <TextInputField
              label="اسم المكمل"
              value={supplementName}
              onChangeText={setSupplementName}
              placeholder="مثال: Vitamin D3, حديد, أوميغا 3"
              required
            />

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

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>📋 المكملات الحالية</ArabicText>
            <ArabicText style={styles.cardSubtitle}>
              إجمالي المكملات المسجلة: {supplements.length}
            </ArabicText>

            {supplements.length === 0 ? (
              <ArabicText style={styles.emptyText}>
                لا توجد مكملات غذائية مسجلة لهذا المريض. استخدم النموذج أعلاه لإضافة المكملات.
              </ArabicText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {supplements.map((item) => {
                  const typeLabel = SUPPLEMENT_TYPE_OPTIONS.find(
                    (o) => o.value === item.supplementType,
                  )?.label || item.supplementType;

                  return (
                    <View key={item.id} style={styles.supplementItem}>
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

                      <ArabicText bold style={styles.supplementName}>
                        {item.supplementName}
                      </ArabicText>

                      {item.dosage ? (
                        <ArabicText style={styles.supplementDosage}>{item.dosage}</ArabicText>
                      ) : null}

                      <ArabicText style={styles.supplementDate}>
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
    marginBottom: spacing.md,
    fontFamily: fontFamilies.regular,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textDisabled,
    fontSize: 13,
    paddingVertical: spacing.lg,
    fontFamily: fontFamilies.regular,
  },
  supplementItem: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  supplementDosage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
  },
  supplementDate: {
    fontSize: 11,
    color: colors.textDisabled,
    textAlign: 'right',
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
});
