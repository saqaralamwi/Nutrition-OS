import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { Patient } from '../../../src/domain/entities/Patient';
import { spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import { SaveInterventionUseCase } from '../../../src/domain/use-cases/SaveInterventionUseCase';
import useClinicalAlerts from '../../../src/presentation/hooks/useClinicalAlerts';

// Theme local color palette (slate dark theme)
const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  accent: '#10B981', // Emerald green
  accentDark: '#059669',
  accentLight: '#E6F4EA',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  white: '#FFFFFF',
  danger: '#F43F5E',
  dangerBg: '#881337',
  forestGreen: '#1B6B4A', // Required solid save color
  forestGreenDark: '#145237',
};

// Form selector options
const ENERGY_OPTIONS = [
  { label: '25 kcal/kg (صيانة - Maintenance)', value: '25' },
  { label: '30 kcal/kg (مرض حرج - Critical Illness)', value: '30' },
  { label: '35 kcal/kg (تسمم دم شديد/حروق - Severe Sepsis)', value: '35' },
] as const;

const PROTEIN_OPTIONS = [
  { label: '1.2 g/kg (إجهاد طبيعي - Normal Stress)', value: '1.2' },
  { label: '1.5 g/kg (إجهاد مرتفع - High Stress)', value: '1.5' },
  { label: '2.0 g/kg (نشاط أيضي مفرط - Hypermetabolic)', value: '2.0' },
] as const;

const FORMULA_OPTIONS = [
  { label: 'Standard 1.0 kcal/ml (قياسي)', value: '1.0' },
  { label: 'High Protein 1.2 kcal/ml (عالي البروتين)', value: '1.2' },
  { label: 'Concentrated 1.5 kcal/ml (مكثف)', value: '1.5' },
] as const;

export default function NutritionCalculatorScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s) => s.showToast);
  const { alerts, loading: alertsLoading } = useClinicalAlerts(patientId);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // States
  const [route, setRoute] = useState<'enteral' | 'parenteral'>('enteral');
  const [weightKg, setWeightKg] = useState('70');
  const [energyMultiplier, setEnergyMultiplier] = useState('25');
  const [proteinMultiplier, setProteinMultiplier] = useState('1.2');
  const [cycleHours, setCycleHours] = useState('24');
  const [formulaDensity, setFormulaDensity] = useState('1.0');

  // Dropdown open states
  const [openEnergy, setOpenEnergy] = useState(false);
  const [openProtein, setOpenProtein] = useState(false);
  const [openFormula, setOpenFormula] = useState(false);

  // Load patient and baseline weight
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const { GetPatientUseCase } = await import('../../../src/domain/use-cases/GetPatientUseCase');
        const patientUC = new GetPatientUseCase();
        const p = await patientUC.execute(patientId);
        setPatient(p);

        // Prepopulate weight from calculations if available
        const { CalculationRepository } = await import('../../../src/data/repositories/CalculationRepository');
        const calcRepo = new CalculationRepository();
        const calcs = await calcRepo.getByPatientId(patientId);
        if (calcs.length > 0) {
          const w = calcs[0].inputValues?.weightKg;
          if (w) {
            setWeightKg(String(w));
            return;
          }
        }

        // Fallback to latest follow-up visit weight
        const { FollowUpVisitRepository } = await import('../../../src/data/repositories/FollowUpVisitRepository');
        const visitRepo = new FollowUpVisitRepository();
        const visits = await visitRepo.getByPatientId(patientId);
        if (visits.length > 0) {
          const w = visits[0].currentWeight;
          if (w) {
            setWeightKg(String(w));
            return;
          }
        }
      } catch (e) {
        console.error('Error loading calculator requirements:', e);
        showToast('فشل في تحميل البيانات الأساسية للمريض', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  // Reactive calculations
  const w = parseFloat(weightKg) || 0;
  const eMult = parseFloat(energyMultiplier) || 25;
  const pMult = parseFloat(proteinMultiplier) || 1.2;
  const cycle = parseFloat(cycleHours) || 24;
  const density = parseFloat(formulaDensity) || 1.0;

  const totalCalories = useMemo(() => w * eMult, [w, eMult]);
  const totalProtein = useMemo(() => w * pMult, [w, pMult]);
  const totalFluid = useMemo(() => w * 30, [w]); // 30 ml/kg standard fluid target

  // Enteral outputs
  const enteralVolume = useMemo(() => (density > 0 ? totalCalories / density : 0), [totalCalories, density]);
  const flowRate = useMemo(() => (cycle > 0 ? enteralVolume / cycle : 0), [enteralVolume, cycle]);
  const freeWaterFlush = useMemo(() => Math.max(0, totalFluid - enteralVolume), [totalFluid, enteralVolume]);

  // Parenteral outputs
  const proteinCalories = useMemo(() => totalProtein * 4, [totalProtein]);
  const isProteinOverCalories = useMemo(() => totalCalories < proteinCalories, [totalCalories, proteinCalories]);

  const nonProteinCalories = useMemo(() => Math.max(0, totalCalories - proteinCalories), [totalCalories, proteinCalories]);
  const dextroseCalories = useMemo(() => nonProteinCalories * 0.70, [nonProteinCalories]);
  const lipidCalories = useMemo(() => nonProteinCalories * 0.30, [nonProteinCalories]);

  const dextroseGrams = useMemo(() => dextroseCalories / 3.4, [dextroseCalories]); // 3.4 kcal/g for IV Dextrose
  const lipidGrams = useMemo(() => lipidCalories / 9.0, [lipidCalories]); // 9.0 kcal/g of Lipids

  // Holliday-Segar water calculation for comparison
  const hollidaySegarFluid = useMemo(() => {
    if (w <= 10) return w * 100;
    if (w <= 20) return 1000 + (w - 10) * 50;
    return 1500 + (w - 20) * 20;
  }, [w]);

  // Save plan handler
  const handleSavePlan = useCallback(async () => {
    if (w <= 0) {
      showToast('الرجاء إدخال وزن صحيح للمريض أولاً', 'error');
      return;
    }
    if (cycle <= 0 || cycle > 24) {
      showToast('مدة دورة التغذية يجب أن تكون بين 1 و 24 ساعة', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const comments = route === 'enteral'
        ? `طريقة التغذية: أنبوبية (Enteral Nutrition)\nالصيغة المغذية: ${FORMULA_OPTIONS.find((o) => o.value === formulaDensity)?.label || formulaDensity}\nحجم الصيغة المقدر: ${Math.round(enteralVolume)} مل/يوم\nمعدل سرعة التدفق: ${flowRate.toFixed(1)} مل/ساعة\nمدة الدورة: ${cycle} ساعة\nالماء الإضافي المطلوب (Free Water flushes): ${Math.round(freeWaterFlush)} مل/يوم\n(مقارنة Holliday-Segar للسوائل: ${hollidaySegarFluid} مل/يوم)`
        : `طريقة التغذية: وريدية كلية (Parenteral Nutrition)\nتفصيل المغذيات الكبرى في المحلول:\n- أحماض أمينية (بروتين): ${totalProtein.toFixed(1)} غرام (${proteinCalories.toFixed(0)} سعرة)\n- دكستروز (كربوهيدرات 70%): ${dextroseGrams.toFixed(1)} غرام (${dextroseCalories.toFixed(0)} سعرة)\n- ليبتيدات (دهون 30%): ${lipidGrams.toFixed(1)} غرام (${lipidCalories.toFixed(0)} سعرة)\n- السوائل الوريدية الإجمالية: ${Math.round(totalFluid)} مل/يوم\n(مقارنة Holliday-Segar للسوائل: ${hollidaySegarFluid} مل/يوم)`;

      const uc = new SaveInterventionUseCase();
      await uc.execute({
        patientId,
        nutritionDiagnosis: `خطة تغذية ${route === 'enteral' ? 'أنبوبية (EN)' : 'وريدية (PN)'} محسوبة سريرياً`,
        mainGoal: `تأمين الاحتياجات للحالة بضرب: ${eMult} kcal/kg و ${pMult} g/kg`,
        dietType: route === 'enteral' ? 'enteral_formula' : 'parenteral_nutrition',
        foodTexture: 'liquid',
        routeOfFeeding: route === 'enteral' ? 'ng_tube' : 'tpn',
        targetCalories: Math.round(totalCalories),
        targetProtein: Math.round(totalProtein),
        targetCarbohydrates: route === 'parenteral' ? Math.round(dextroseGrams) : 0,
        targetFat: route === 'parenteral' ? Math.round(lipidGrams) : 0,
        fluidAllowance: Math.round(totalFluid),
        dietModifications: route === 'enteral' ? `Enteral Volume: ${Math.round(enteralVolume)}ml` : `Dextrose: ${Math.round(dextroseGrams)}g, Lipids: ${Math.round(lipidGrams)}g`,
        dietRecommendations: route === 'enteral' ? `Flow Rate: ${flowRate.toFixed(1)} ml/hr` : 'Parenteral Nutrition Infusion Plan',
        followUpInterval: 'weekly',
        status: 'active',
        comments,
      });

      showToast('تم حفظ الخطة التغذوية للحالة وتحديث الملف الطبي بنجاح', 'success');
      router.back();
    } catch (error) {
      console.error('Save plan error:', error);
      showToast('فشل في حفظ الخطة التغذوية للحالة في قاعدة البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    patientId,
    route,
    w,
    eMult,
    pMult,
    cycle,
    formulaDensity,
    totalCalories,
    totalProtein,
    totalFluid,
    enteralVolume,
    flowRate,
    freeWaterFlush,
    dextroseGrams,
    dextroseCalories,
    lipidGrams,
    lipidCalories,
    proteinCalories,
    hollidaySegarFluid,
    showToast,
    router,
  ]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkTheme.accent} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات الأساسية للمريض...</ArabicText>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centered}>
        <ArabicText style={styles.errorText}>المريض غير موجود أو تم حذفه</ArabicText>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArabicText style={styles.backBtnText}>عودة</ArabicText>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedEnergyLabel = ENERGY_OPTIONS.find((o) => o.value === energyMultiplier)?.label || energyMultiplier;
  const selectedProteinLabel = PROTEIN_OPTIONS.find((o) => o.value === proteinMultiplier)?.label || proteinMultiplier;
  const selectedFormulaLabel = FORMULA_OPTIONS.find((o) => o.value === formulaDensity)?.label || formulaDensity;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-forward" size={24} color={darkTheme.textPrimary} />
            </TouchableOpacity>
            <ArabicText bold style={styles.headerTitle}>حاسبة التغذية الأنبوبية والوريدية المتقدمة</ArabicText>
          </View>
          <ArabicText style={styles.headerSubtitle}>
            الملف: {patient.fullName} | رقم الملف: {patient.fileNumber}
          </ArabicText>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Clinical Alerts Banners */}
          {!alertsLoading && alerts.length > 0 && (
            <View style={styles.alertsContainer}>
              {alerts.map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    alert.type === 'danger' ? styles.dangerAlert : styles.warningAlert,
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <Ionicons name="alert-circle" size={20} color={darkTheme.white} style={styles.alertIcon} />
                    <ArabicText bold style={styles.alertTitle}>
                      {alert.title}
                    </ArabicText>
                  </View>
                  <ArabicText style={styles.alertMessage}>
                    {alert.message}
                  </ArabicText>
                </View>
              ))}
            </View>
          )}

          {/* 1. Route Selector Toggle */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentButton, route === 'enteral' && styles.segmentButtonActive]}
              onPress={() => setRoute('enteral')}
              activeOpacity={0.8}
            >
              <ArabicText bold style={[styles.segmentLabel, route === 'enteral' && styles.segmentLabelActive]}>
                التغذية الأنبوبية (EN)
              </ArabicText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, route === 'parenteral' && styles.segmentButtonActive]}
              onPress={() => setRoute('parenteral')}
              activeOpacity={0.8}
            >
              <ArabicText bold style={[styles.segmentLabel, route === 'parenteral' && styles.segmentLabelActive]}>
                التغذية الوريدية (PN)
              </ArabicText>
            </TouchableOpacity>
          </View>

          {/* 2. Clinical Inputs Card */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>المدخلات والمؤشرات التقديرية</ArabicText>

            {/* Weight Input */}
            <View style={styles.inputGroup}>
              <ArabicText style={styles.inputLabel}>الوزن الحالي للمريض (كجم)</ArabicText>
              <View style={styles.inputTextRow}>
                <TextInput
                  style={styles.textInput}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="decimal-pad"
                  placeholder="أدخل الوزن..."
                  placeholderTextColor={darkTheme.textDisabled}
                />
                <ArabicText style={styles.inputUnit}>كجم</ArabicText>
              </View>
            </View>

            {/* Energy Multiplier Dropdown */}
            <View style={styles.inputGroup}>
              <ArabicText style={styles.inputLabel}>مضاعف احتياج الطاقة اليومية (kcal/kg)</ArabicText>
              <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenEnergy(true)} activeOpacity={0.8}>
                <ArabicText style={styles.dropdownText}>{selectedEnergyLabel}</ArabicText>
                <Ionicons name="chevron-down" size={18} color={darkTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Protein Target Dropdown */}
            <View style={styles.inputGroup}>
              <ArabicText style={styles.inputLabel}>مستهدف البروتين اليومي (g/kg)</ArabicText>
              <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenProtein(true)} activeOpacity={0.8}>
                <ArabicText style={styles.dropdownText}>{selectedProteinLabel}</ArabicText>
                <Ionicons name="chevron-down" size={18} color={darkTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Feeding Duration Input */}
            <View style={styles.inputGroup}>
              <ArabicText style={styles.inputLabel}>مدة دورة التغذية اليومية (ساعة)</ArabicText>
              <View style={styles.inputTextRow}>
                <TextInput
                  style={styles.textInput}
                  value={cycleHours}
                  onChangeText={setCycleHours}
                  keyboardType="numeric"
                  placeholder="مثال: 24"
                  placeholderTextColor={darkTheme.textDisabled}
                />
                <ArabicText style={styles.inputUnit}>ساعة</ArabicText>
              </View>
            </View>

            {/* Enteral-only inputs: Formula Picker */}
            {route === 'enteral' && (
              <View style={[styles.inputGroup, styles.borderTop]}>
                <ArabicText style={styles.inputLabel}>اختر نوع الصيغة التغذوية (Enteral Formula)</ArabicText>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpenFormula(true)} activeOpacity={0.8}>
                  <ArabicText style={styles.dropdownText}>{selectedFormulaLabel}</ArabicText>
                  <Ionicons name="chevron-down" size={18} color={darkTheme.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 3. Real-Time General Targets Card */}
          <View style={styles.card}>
            <ArabicText bold style={styles.cardTitle}>مستهدفات الطاقة والسوائل اليومية</ArabicText>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <ArabicText style={styles.metricLabel}>السعرات المستهدفة</ArabicText>
                <ArabicText bold style={[styles.metricValue, { color: darkTheme.accent }]}>
                  {Math.round(totalCalories)} <ArabicText style={styles.metricUnit}>سعرة/يوم</ArabicText>
                </ArabicText>
              </View>

              <View style={styles.metricItem}>
                <ArabicText style={styles.metricLabel}>البروتين المستهدف</ArabicText>
                <ArabicText bold style={[styles.metricValue, { color: darkTheme.accent }]}>
                  {totalProtein.toFixed(1)} <ArabicText style={styles.metricUnit}>غرام/يوم</ArabicText>
                </ArabicText>
              </View>

              <View style={styles.metricItem}>
                <ArabicText style={styles.metricLabel}>احتياج السوائل (30ml/kg)</ArabicText>
                <ArabicText bold style={[styles.metricValue, { color: darkTheme.textPrimary }]}>
                  {Math.round(totalFluid)} <ArabicText style={styles.metricUnit}>مل/يوم</ArabicText>
                </ArabicText>
                <ArabicText style={styles.comparisonLabel}>Holliday-Segar: {hollidaySegarFluid} مل</ArabicText>
              </View>
            </View>
          </View>

          {/* 4. Route Specific Output Card */}
          {route === 'enteral' ? (
            /* ENTERAL OUTPUTS */
            <View style={[styles.card, { borderColor: darkTheme.accent }]}>
              <ArabicText bold style={[styles.cardTitle, { color: darkTheme.accent }]}>حسابات التغذية الأنبوبية المقدرة (Enteral)</ArabicText>

              <View style={styles.outputRow}>
                <ArabicText style={styles.outputLabel}>حجم المغذي الأنبوبي اليومي المطلوب:</ArabicText>
                <ArabicText bold style={styles.outputValue}>
                  {Math.round(enteralVolume)} <ArabicText style={styles.outputUnit}>مل/يوم</ArabicText>
                </ArabicText>
              </View>

              <View style={styles.highlightOutputBox}>
                <ArabicText style={styles.highlightLabel}>معدل سرعة التدفق المستهدف (Flow Rate):</ArabicText>
                <ArabicText bold style={styles.highlightValue}>
                  {flowRate.toFixed(1)} <ArabicText style={styles.highlightUnit}>مل/ساعة</ArabicText>
                </ArabicText>
              </View>

              <View style={styles.outputRow}>
                <ArabicText style={styles.outputLabel}>كمية المياه الإضافية المطلوبة (Free Water):</ArabicText>
                <ArabicText bold style={styles.outputValue}>
                  {Math.round(freeWaterFlush)} <ArabicText style={styles.outputUnit}>مل/يوم</ArabicText>
                </ArabicText>
              </View>
              <ArabicText style={styles.infoNote}>
                * يتم إعطاء الماء الإضافي كدفعات (Flushes) لتجنب الجفاف والملوحة المفرطة.
              </ArabicText>
            </View>
          ) : (
            /* PARENTERAL OUTPUTS */
            <View style={[styles.card, { borderColor: darkTheme.accent }]}>
              <ArabicText bold style={[styles.cardTitle, { color: darkTheme.accent }]}>مكونات المحلول التغذوي الوريدي (Parenteral)</ArabicText>

              {isProteinOverCalories ? (
                <View style={styles.warningCard}>
                  <Ionicons name="alert-circle" size={20} color={darkTheme.danger} />
                  <ArabicText bold style={styles.warningText}>
                    تحذير: السعرات الكلية المقدرة لا تكفي لتغطية كمية البروتين المطلوبة!
                  </ArabicText>
                </View>
              ) : (
                <View style={styles.pnMacronutrientsList}>
                  {/* Amino Acids */}
                  <View style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                      <ArabicText bold style={styles.macroName}>أحماض أمينية (Amino Acids - Protein)</ArabicText>
                      <ArabicText style={styles.macroSub}>{proteinCalories.toFixed(0)} سعرة حرارية</ArabicText>
                    </View>
                    <ArabicText bold style={styles.macroValue}>
                      {totalProtein.toFixed(1)} <ArabicText style={styles.macroUnit}>غرام</ArabicText>
                    </ArabicText>
                  </View>

                  {/* Dextrose */}
                  <View style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                      <ArabicText bold style={styles.macroName}>دكستروز (Dextrose - Carbs 70%)</ArabicText>
                      <ArabicText style={styles.macroSub}>{dextroseCalories.toFixed(0)} سعرة حرارية</ArabicText>
                    </View>
                    <ArabicText bold style={styles.macroValue}>
                      {dextroseGrams.toFixed(1)} <ArabicText style={styles.macroUnit}>غرام</ArabicText>
                    </ArabicText>
                  </View>

                  {/* Lipids */}
                  <View style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                      <ArabicText bold style={styles.macroName}>ليبتيدات (Lipids - Fat 30%)</ArabicText>
                      <ArabicText style={styles.macroSub}>{lipidCalories.toFixed(0)} سعرة حرارية</ArabicText>
                    </View>
                    <ArabicText bold style={styles.macroValue}>
                      {lipidGrams.toFixed(1)} <ArabicText style={styles.macroUnit}>غرام</ArabicText>
                    </ArabicText>
                  </View>

                  <View style={[styles.outputRow, styles.borderTop, { marginTop: 12, paddingTop: 12 }]}>
                    <ArabicText style={styles.outputLabel}>حجم السوائل الوريدية الإجمالية:</ArabicText>
                    <ArabicText bold style={styles.outputValue}>
                      {Math.round(totalFluid)} <ArabicText style={styles.outputUnit}>مل/يوم</ArabicText>
                    </ArabicText>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 5. Save Button (Forest Green) */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSavePlan}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={darkTheme.white} />
            ) : (
              <ArabicText bold style={styles.saveButtonText}>💾 حفظ الخطة التغذوية للحالة</ArabicText>
            )}
          </TouchableOpacity>

          <View style={styles.footerSpacer} />
        </ScrollView>

        {/* --- Dropdown Modals --- */}
        {/* Energy Modal */}
        <Modal visible={openEnergy} transparent animationType="fade" onRequestClose={() => setOpenEnergy(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpenEnergy(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ArabicText bold style={styles.modalTitle}>احتياج الطاقة اليومية</ArabicText>
                <TouchableOpacity onPress={() => setOpenEnergy(false)}>
                  <Ionicons name="close" size={24} color={darkTheme.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={ENERGY_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, item.value === energyMultiplier && styles.modalItemActive]}
                    onPress={() => {
                      setEnergyMultiplier(item.value);
                      setOpenEnergy(false);
                    }}
                  >
                    <ArabicText style={[styles.modalItemText, item.value === energyMultiplier && styles.modalItemTextActive]}>
                      {item.label}
                    </ArabicText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Protein Modal */}
        <Modal visible={openProtein} transparent animationType="fade" onRequestClose={() => setOpenProtein(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpenProtein(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ArabicText bold style={styles.modalTitle}>مستهدف البروتين اليومي</ArabicText>
                <TouchableOpacity onPress={() => setOpenProtein(false)}>
                  <Ionicons name="close" size={24} color={darkTheme.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={PROTEIN_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, item.value === proteinMultiplier && styles.modalItemActive]}
                    onPress={() => {
                      setProteinMultiplier(item.value);
                      setOpenProtein(false);
                    }}
                  >
                    <ArabicText style={[styles.modalItemText, item.value === proteinMultiplier && styles.modalItemTextActive]}>
                      {item.label}
                    </ArabicText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Formula Modal */}
        <Modal visible={openFormula} transparent animationType="fade" onRequestClose={() => setOpenFormula(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpenFormula(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ArabicText bold style={styles.modalTitle}>نوع الصيغة التغذوية</ArabicText>
                <TouchableOpacity onPress={() => setOpenFormula(false)}>
                  <Ionicons name="close" size={24} color={darkTheme.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={FORMULA_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, item.value === formulaDensity && styles.modalItemActive]}
                    onPress={() => {
                      setFormulaDensity(item.value);
                      setOpenFormula(false);
                    }}
                  >
                    <ArabicText style={[styles.modalItemText, item.value === formulaDensity && styles.modalItemTextActive]}>
                      {item.label}
                    </ArabicText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: darkTheme.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
  },
  errorText: {
    fontSize: 16,
    color: darkTheme.danger,
    fontFamily: 'ThmanyahSans-Medium',
  },
  backBtnText: {
    color: darkTheme.textPrimary,
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
  },
  header: {
    backgroundColor: darkTheme.forestGreen,
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    color: darkTheme.textPrimary,
    flex: 1,
    fontFamily: 'ThmanyahSans-Bold',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontFamily: 'ThmanyahSans-Medium',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  segmentedContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: darkTheme.surface,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: darkTheme.accent,
  },
  segmentLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
  },
  segmentLabelActive: {
    color: darkTheme.white,
    fontFamily: 'ThmanyahSans-Bold',
  },
  card: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  cardTitle: {
    fontSize: 15,
    color: darkTheme.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: 'ThmanyahSans-Bold',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    fontFamily: 'ThmanyahSans-Medium',
  },
  inputTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 8,
    backgroundColor: darkTheme.background,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    padding: spacing.sm,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Medium',
    fontSize: 15,
    textAlign: 'right',
  },
  inputUnit: {
    paddingHorizontal: spacing.sm,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    fontSize: 13,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: darkTheme.background,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 14,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'right',
    flex: 1,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    gap: spacing.sm,
  },
  metricItem: {
    backgroundColor: darkTheme.background,
    padding: spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: 'ThmanyahSans-Bold',
  },
  metricUnit: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Medium',
  },
  comparisonLabel: {
    fontSize: 10,
    color: darkTheme.textDisabled,
    marginTop: 4,
    fontFamily: 'ThmanyahSans-Medium',
  },
  outputRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  outputLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
  },
  outputValue: {
    fontSize: 15,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Bold',
  },
  outputUnit: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Medium',
  },
  highlightOutputBox: {
    backgroundColor: darkTheme.background,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.accent,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 26,
    color: darkTheme.accent,
    fontFamily: 'ThmanyahSans-Bold',
  },
  highlightUnit: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
  },
  infoNote: {
    fontSize: 10,
    color: darkTheme.textDisabled,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontFamily: 'ThmanyahSans-Medium',
  },
  warningCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: darkTheme.dangerBg,
    borderColor: darkTheme.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  warningText: {
    color: darkTheme.white,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'ThmanyahSans-Medium',
  },
  pnMacronutrientsList: {
    gap: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  macroInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  macroName: {
    fontSize: 13,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Bold',
  },
  macroSub: {
    fontSize: 11,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    marginTop: 2,
  },
  macroValue: {
    fontSize: 16,
    color: darkTheme.accent,
    fontFamily: 'ThmanyahSans-Bold',
  },
  macroUnit: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Medium',
  },
  saveButton: {
    backgroundColor: darkTheme.forestGreen,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  saveButtonDisabled: {
    backgroundColor: darkTheme.forestGreenDark,
    opacity: 0.6,
  },
  saveButtonText: {
    color: darkTheme.white,
    fontSize: 15,
    fontFamily: 'ThmanyahSans-Bold',
  },
  footerSpacer: {
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: darkTheme.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  modalTitle: {
    fontSize: 16,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Bold',
  },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border + '30',
  },
  modalItemActive: {
    backgroundColor: darkTheme.surfaceSecondary,
  },
  modalItemText: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'right',
  },
  modalItemTextActive: {
    color: darkTheme.accent,
    fontFamily: 'ThmanyahSans-Bold',
  },
  alertsContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  alertCard: {
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  dangerAlert: {
    backgroundColor: '#7F1D1D',
    borderColor: '#B91C1C',
  },
  warningAlert: {
    backgroundColor: '#78350F',
    borderColor: '#B45309',
  },
  alertHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  alertIcon: {
    marginLeft: spacing.xs,
  },
  alertTitle: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: darkTheme.white,
    textAlign: 'right',
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
    color: darkTheme.white,
    textAlign: 'right',
    lineHeight: 20,
  },
});
