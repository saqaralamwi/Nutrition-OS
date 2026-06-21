import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
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
import { CirrhosisProtocol, CirrhosisPatient, CirrhosisPrescription, AscitesGrade, EdemaGrade, EncephalopathyGrade } from '../../../src/domain/calculators/CirrhosisProtocol';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import Button from '../../../src/presentation/components/Button';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

const ASCITES_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: 'خفيف (Mild)', value: 'mild' },
  { label: 'متوسط (Moderate)', value: 'moderate' },
  { label: 'شديد (Severe)', value: 'severe' },
];

const EDEMA_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: 'خفيف (Mild)', value: 'mild' },
  { label: 'متوسط (Moderate)', value: 'moderate' },
  { label: 'شديد (Severe)', value: 'severe' },
];

const ENCEPHALOPATHY_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: 'الدرجة 1 (Grade 1)', value: 'grade1' },
  { label: 'الدرجة 2 (Grade 2)', value: 'grade2' },
  { label: 'الدرجة 3 (Grade 3)', value: 'grade3' },
  { label: 'الدرجة 4 (Grade 4)', value: 'grade4' },
];

export default function CirrhosisGatewayScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [previousPrescriptions, setPreviousPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [childPughScore, setChildPughScore] = useState('');
  const [ascites, setAscites] = useState<AscitesGrade>('none');
  const [edema, setEdema] = useState<EdemaGrade>('none');
  const [encephalopathy, setEncephalopathy] = useState<EncephalopathyGrade>('none');
  const [albumin, setAlbumin] = useState('');
  const [bilirubin, setBilirubin] = useState('');
  const [inr, setInr] = useState('');
  const [sodium, setSodium] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [medications, setMedications] = useState('');
  const [potassium, setPotassium] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [magnesium, setMagnesium] = useState('');

  const [prescription, setPrescription] = useState<CirrhosisPrescription | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const patient$ = watchRecord<Patient>('patients', patientId);

    const prescriptions$ = watchQuery<any>((db) => {
      return db.get('calculations').query(
        Q.where('patient_id', patientId),
        Q.where('calculation_type', 'cirrhosis_protocol'),
        Q.sortBy('created_at', 'desc'),
      );
    }).pipe(map((records) => records.slice(0, 20)));

    const stream = combineLatest([patient$, prescriptions$]).subscribe({
      next: ([p, records]) => {
        setPatient(p);
        setPreviousPrescriptions(records);

        if (p) {
          setWeight('');
          setHeight('');
          setAge(p.age?.toString() || '');
          setGender((p.gender as 'male' | 'female') || 'male');
        }

        setIsLoading(false);
      },
      error: (err) => {
        console.error('Cirrhosis stream error:', err);
        showToast('خطأ في تحميل بيانات التقييم', 'error');
        setIsLoading(false);
      },
    });

    return () => stream.unsubscribe();
  }, [patientId]);

  const buildPatient = useCallback((): CirrhosisPatient | null => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    const cps = parseInt(childPughScore, 10);
    const alb = parseFloat(albumin);
    const bili = parseFloat(bilirubin);
    const i = parseFloat(inr);
    const s = parseFloat(sodium);
    const cr = parseFloat(creatinine);
    const k = parseFloat(potassium);
    const ph = parseFloat(phosphorus);
    const mg = parseFloat(magnesium);

    if (!weight || isNaN(w) || !height || isNaN(h) || !age || isNaN(a)) {
      showToast('الرجاء إدخال الوزن والطول والعمر', 'error');
      return null;
    }
    if (w <= 0 || h <= 0 || a <= 0) {
      showToast('القيم يجب أن تكون أكبر من صفر', 'error');
      return null;
    }

    const medList = medications
      ? medications.split(',').map((m) => m.trim()).filter(Boolean)
      : [];

    const hasElectrolytes = !isNaN(k) && !isNaN(ph) && !isNaN(mg);

    return {
      weight: w,
      height: h,
      age: a,
      gender,
      childPughScore: isNaN(cps) ? 6 : cps,
      ascites,
      edema,
      encephalopathy,
      albumin: isNaN(alb) ? 3.8 : alb,
      bilirubin: isNaN(bili) ? 1.0 : bili,
      INR: isNaN(i) ? 1.2 : i,
      sodium: isNaN(s) ? 138 : s,
      creatinine: isNaN(cr) ? 0.9 : cr,
      medications: medList,
      electrolytes: hasElectrolytes
        ? { potassium: k, phosphorus: ph, magnesium: mg }
        : null,
    };
  }, [weight, height, age, gender, childPughScore, ascites, edema, encephalopathy, albumin, bilirubin, inr, sodium, creatinine, medications, potassium, phosphorus, magnesium, showToast]);

  const handleAnalyze = useCallback(() => {
    const p = buildPatient();
    if (!p) return;
    const rx = CirrhosisProtocol.generatePrescription(p);
    setPrescription(rx);
  }, [buildPatient]);

  const handleSave = useCallback(async () => {
    const p = buildPatient();
    if (!p) return;

    const rx = CirrhosisProtocol.generatePrescription(p);
    setPrescription(rx);

    setIsSaving(true);
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const calculations = db.get('calculations');
        await calculations.create((record: any) => {
          record.patientId = patientId;
          record.calculationType = 'cirrhosis_protocol';
          record.formulaName = 'CirrhosisProtocol.v1';
          record.resultValue = rx.calories;
          record.inputValues = JSON.stringify({
            patient: p,
            prescription: rx,
          });
          record.resultCalories = rx.calories;
          record.resultProteinG = rx.protein;
          record.resultCarbsG = rx.carbs;
          record.resultFatG = rx.fat;
          record.inputWeightKg = p.weight;
          record.inputHeightCm = p.height;
          record.inputAge = p.age;
          record.inputGender = p.gender;
          record.createdAt = Date.now();
          record.updatedAt = Date.now();
        });
      });

      showToast('تم حفظ تقييم تشمع الكبد بنجاح', 'success');
    } catch (error) {
      console.error('Save cirrhosis assessment error:', error);
      showToast('فشل في حفظ التقييم', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [patientId, buildPatient, showToast]);

  const resetForm = useCallback(() => {
    setWeight('');
    setHeight('');
    setAge('');
    setGender('male');
    setChildPughScore('');
    setAscites('none');
    setEdema('none');
    setEncephalopathy('none');
    setAlbumin('');
    setBilirubin('');
    setInr('');
    setSodium('');
    setCreatinine('');
    setMedications('');
    setPotassium('');
    setPhosphorus('');
    setMagnesium('');
    setPrescription(null);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل بيانات تقييم تشمع الكبد...</ArabicText>
      </View>
    );
  }

  const renderPrescription = () => {
    if (!prescription) return null;

    return (
      <>
        <View style={[styles.card, { borderColor: '#F59E0B', borderWidth: 2 }]}>
          <ArabicText bold style={styles.cardTitle}>📊 الوصفة التغذوية المحسوبة</ArabicText>
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <ArabicText style={styles.resultLabel}>السعرات (Calories)</ArabicText>
              <ArabicText bold style={styles.resultValue}>{prescription.calories} ك.سعرة</ArabicText>
            </View>
            <View style={styles.resultItem}>
              <ArabicText style={styles.resultLabel}>البروتين (Protein)</ArabicText>
              <ArabicText bold style={styles.resultValue}>{prescription.protein} غ</ArabicText>
            </View>
            <View style={styles.resultItem}>
              <ArabicText style={styles.resultLabel}>الكربوهيدرات (Carbs)</ArabicText>
              <ArabicText bold style={styles.resultValue}>{prescription.carbs} غ</ArabicText>
            </View>
            <View style={styles.resultItem}>
              <ArabicText style={styles.resultLabel}>الدهون (Fat)</ArabicText>
              <ArabicText bold style={styles.resultValue}>{prescription.fat} غ</ArabicText>
            </View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.resultItem, { backgroundColor: colors.accentRose + '18' }]}>
              <ArabicText style={styles.resultLabel}>الصوديوم (Sodium)</ArabicText>
              <ArabicText bold style={[styles.resultValue, { color: prescription.sodium <= 2000 ? '#34D399' : '#F59E0B' }]}>
                {prescription.sodium} ملغ
              </ArabicText>
            </View>
            {prescription.meals.fluidRestriction && (
              <View style={[styles.resultItem, { backgroundColor: colors.info + '18' }]}>
                <ArabicText style={styles.resultLabel}>تقييد السوائل</ArabicText>
                <ArabicText bold style={[styles.resultValue, { color: colors.info }]}>
                  {prescription.meals.fluidRestriction} مل
                </ArabicText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <ArabicText bold style={styles.cardTitle}>🍽️ خطة الوجبات</ArabicText>
          {prescription.meals.mainMeals.map((meal, i) => (
            <View key={i} style={styles.mealRow}>
              <View style={styles.mealHeader}>
                <Ionicons name="restaurant-outline" size={14} color={colors.accentTeal} />
                <ArabicText bold style={styles.mealName}>{meal.name}</ArabicText>
              </View>
              <ArabicText style={styles.mealDetail}>
                {meal.calories} ك.سعرة | {meal.protein} غ بروتين | {meal.sodium} ملغ صوديوم
              </ArabicText>
            </View>
          ))}
          <View style={styles.snackSection}>
            <ArabicText bold style={styles.snackTitle}>🥜 الوجبات الخفيفة</ArabicText>
            {prescription.meals.snacks.map((snack, i) => (
              <View key={i} style={styles.mealRow}>
                <ArabicText style={styles.mealDetail}>
                  • {snack.name}: {snack.calories} ك.سعرة | {snack.protein} غ بروتين | {snack.sodium} ملغ صوديوم
                </ArabicText>
              </View>
            ))}
          </View>
        </View>

        {prescription.supplements && (
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>💊 المكملات الغذائية</ArabicText>
            {prescription.supplements.zinc && (
              <ArabicText style={styles.supplementItem}>
                • Zinc: {prescription.supplements.zinc.dose} ملغ، {prescription.supplements.zinc.frequency}
              </ArabicText>
            )}
            {prescription.supplements.vitaminD && (
              <ArabicText style={styles.supplementItem}>
                • Vitamin D: {prescription.supplements.vitaminD.dose} وحدة دولية، {prescription.supplements.vitaminD.frequency}
              </ArabicText>
            )}
            {prescription.supplements.vitaminK && (
              <ArabicText style={styles.supplementItem}>
                • Vitamin K: {prescription.supplements.vitaminK.dose} ملغ، {prescription.supplements.vitaminK.frequency}
              </ArabicText>
            )}
            {prescription.supplements.multivitamin && (
              <ArabicText style={styles.supplementItem}>
                • Multivitamin: {prescription.supplements.multivitamin.dose}، {prescription.supplements.multivitamin.frequency}
              </ArabicText>
            )}
          </View>
        )}

        {prescription.alerts.length > 0 && (
          <View style={[styles.card, { borderColor: '#EF4444', borderWidth: 1 }]}>
            <ArabicText bold style={[styles.cardTitle, { color: '#EF4444' }]}>⚠️ التنبيهات السريرية</ArabicText>
            {prescription.alerts.map((alert, i) => (
              <ArabicText key={i} style={styles.alertItem}>{alert}</ArabicText>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <ArabicText bold style={styles.cardTitle}>🔬 خطة المراقبة</ArabicText>
          <ArabicText bold style={styles.monitoringSubtitle}>التحاليل المخبرية:</ArabicText>
          {prescription.monitoring.labTests.map((lab, i) => (
            <ArabicText key={i} style={styles.monitoringItem}>
              • {lab.test}: {lab.frequency} (هدف: {lab.target})
            </ArabicText>
          ))}
          <ArabicText bold style={[styles.monitoringSubtitle, { marginTop: spacing.sm }]}>المراقبة السريرية:</ArabicText>
          {prescription.monitoring.clinical.map((c, i) => (
            <ArabicText key={i} style={styles.monitoringItem}>
              • {c.parameter}: {c.frequency} (هدف: {c.target})
            </ArabicText>
          ))}
        </View>

        {prescription.titration && (
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>📈 خطة المعايرة (Titration)</ArabicText>
            <ArabicText style={styles.titrationItem}>
              • زيادة {prescription.titration.increaseCalories} ك.سعرة و {prescription.titration.increaseProtein} غ بروتين
            </ArabicText>
            <ArabicText style={styles.titrationItem}>
              • التكرار: {prescription.titration.frequency}
            </ArabicText>
            <ArabicText style={styles.titrationItem}>
              • الهدف: {prescription.titration.target}
            </ArabicText>
            <ArabicText style={styles.titrationItem}>
              • مراقبة: {prescription.titration.monitor}
            </ArabicText>
          </View>
        )}
      </>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ArabicText bold style={styles.headerTitle}>بوابة رعاية تشمع الكبد (Cirrhosis)</ArabicText>
            {patient && (
              <ArabicText style={styles.headerSubtitle}>
                {patient.fullName} | {patient.fileNumber}
              </ArabicText>
            )}
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>👤 البيانات الأساسية</ArabicText>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="الوزن (كجم)"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="مثال: 70"
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="الطول (سم)"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="مثال: 170"
                  keyboardType="numeric"
                  required
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="العمر (سنوات)"
                  value={age}
                  onChangeText={setAge}
                  placeholder="مثال: 50"
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.halfField}>
                <DropdownField
                  label="الجنس"
                  options={[
                    { label: 'ذكر', value: 'male' },
                    { label: 'أنثى', value: 'female' },
                  ]}
                  selectedValue={gender}
                  onValueChange={(v) => setGender(v as 'male' | 'female')}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>🩺 تصنيف تشمع الكبد (Child-Pugh)</ArabicText>
            <TextInputField
              label="درجة Child-Pugh (5-15)"
              value={childPughScore}
              onChangeText={setChildPughScore}
              placeholder="مثال: 9"
              keyboardType="numeric"
            />
            <DropdownField
              label="الاستسقاء (Ascites)"
              options={ASCITES_OPTIONS}
              selectedValue={ascites}
              onValueChange={(v) => setAscites(v as AscitesGrade)}
              placeholder="اختر درجة الاستسقاء..."
            />
            <DropdownField
              label="الوذمة (Edema)"
              options={EDEMA_OPTIONS}
              selectedValue={edema}
              onValueChange={(v) => setEdema(v as EdemaGrade)}
              placeholder="اختر درجة الوذمة..."
            />
            <DropdownField
              label="الاعتلال الدماغي الكبدي"
              options={ENCEPHALOPATHY_OPTIONS}
              selectedValue={encephalopathy}
              onValueChange={(v) => setEncephalopathy(v as EncephalopathyGrade)}
              placeholder="اختر درجة الاعتلال الدماغي..."
            />
          </View>

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>🧪 القيم المخبرية</ArabicText>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="الألبومين (Albumin g/dL)"
                  value={albumin}
                  onChangeText={setAlbumin}
                  placeholder="مثال: 3.2"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="البيليروبين (Bilirubin mg/dL)"
                  value={bilirubin}
                  onChangeText={setBilirubin}
                  placeholder="مثال: 2.5"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="INR"
                  value={inr}
                  onChangeText={setInr}
                  placeholder="مثال: 1.4"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="الصوديوم (Na mmol/L)"
                  value={sodium}
                  onChangeText={setSodium}
                  placeholder="مثال: 138"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="الكرياتينين (Cr mg/dL)"
                  value={creatinine}
                  onChangeText={setCreatinine}
                  placeholder="مثال: 0.9"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="الأدوية (مفصولة بفاصلة)"
                  value={medications}
                  onChangeText={setMedications}
                  placeholder="spironolactone, furosemide"
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>⚡ الشوارد (للكشف عن متلازمة إعادة التغذية)</ArabicText>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInputField
                  label="البوتاسيوم (K mmol/L)"
                  value={potassium}
                  onChangeText={setPotassium}
                  placeholder="مثال: 4.0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <TextInputField
                  label="الفسفور (P mg/dL)"
                  value={phosphorus}
                  onChangeText={setPhosphorus}
                  placeholder="مثال: 3.5"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TextInputField
              label="المغنيسيوم (Mg mg/dL)"
              value={magnesium}
              onChangeText={setMagnesium}
              placeholder="مثال: 2.0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.analysisRow}>
              <Button
                title="🔍 تحليل وإنشاء الوصفة"
                onPress={handleAnalyze}
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
            <TouchableOpacity onPress={resetForm} style={styles.resetBtn} activeOpacity={0.7}>
              <Ionicons name="refresh" size={14} color={colors.textSecondary} />
              <ArabicText style={styles.resetText}>إعادة تعيين النموذج</ArabicText>
            </TouchableOpacity>
          </View>

          {renderPrescription()}

          {previousPrescriptions.length > 0 && (
            <View style={styles.card}>
              <ArabicText bold style={styles.cardTitle}>📋 سجل التقييمات السابقة</ArabicText>
              <View style={styles.tableHeader}>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.2 }]}>التاريخ</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>سعرات</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>بروتين</ArabicText>
                <ArabicText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>صوديوم</ArabicText>
              </View>
              {previousPrescriptions.slice(0, 10).map((record) => {
                const d = new Date(record.createdAt);
                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                return (
                  <View key={record.id} style={styles.tableRow}>
                    <ArabicText style={[styles.tableCell, { flex: 1.2 }]}>{dateStr}</ArabicText>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{record.resultCalories}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{record.resultProteinG}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{record.resultCarbsG}</Text>
                  </View>
                );
              })}
            </View>
          )}
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
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  analysisRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  resetBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resetText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  resultRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
  resultValue: {
    fontSize: 16,
    color: colors.accentTeal,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: fontFamilies.bold,
  },
  mealRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  mealHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mealName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fontFamilies.bold,
  },
  mealDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  snackSection: {
    marginTop: spacing.sm,
  },
  snackTitle: {
    fontSize: 13,
    color: colors.accentAmber,
    marginBottom: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  supplementItem: {
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: fontFamilies.regular,
  },
  alertItem: {
    fontSize: 12,
    color: '#FCA5A5',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: fontFamilies.regular,
  },
  monitoringSubtitle: {
    fontSize: 12,
    color: colors.accentSky,
    marginBottom: spacing.xs,
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
  },
  monitoringItem: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 2,
    fontFamily: fontFamilies.regular,
  },
  titrationItem: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: fontFamilies.regular,
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
});
