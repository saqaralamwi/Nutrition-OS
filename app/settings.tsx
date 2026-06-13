import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../src/presentation/theme';
import ArabicText from '../src/presentation/components/ArabicText';
import TextInputField from '../src/presentation/components/TextInputField';
import DropdownField from '../src/presentation/components/DropdownField';
import { useSettingsStore } from '../src/presentation/stores/settingsStore';
import { useSecurityStore } from '../src/presentation/stores/securityStore';
import { usePatientStore } from '../src/presentation/stores/patientStore';
import Toast from '../src/presentation/components/Toast';

const FORMULA_OPTIONS = [
  { label: 'Mifflin-St Jeor', value: 'Mifflin' },
  { label: 'Harris-Benedict', value: 'Harris-Benedict' },
  { label: 'Quick Rule (25-30 kcal/kg)', value: 'Weight-Based' },
];

export default function SettingsScreen() {
  const router = useRouter();

  // Settings store
  const {
    profiles,
    activeProfileId,
    username,
    professionalTitle,
    hospitalName,
    addProfile,
    switchProfile,
    updateProfile,
    thresholdUrea,
    thresholdCreatinine,
    thresholdPotassium,
    thresholdSodium,
    defaultEnergyFormula,
    updateClinicalSettings,
  } = useSettingsStore();

  // Security store
  const {
    hasPIN,
    biometricsEnabled,
    isBiometricsSupported,
    setPIN,
    enableBiometrics,
    clearSecurity,
    initSecurity,
  } = useSecurityStore();

  // Toast controls
  const toast = usePatientStore((s) => s.toast);
  const showToast = usePatientStore((s) => s.showToast);
  const hideToast = usePatientStore((s) => s.hideToast);

  // Form states (Active Profile Identity)
  const [formUsername, setFormUsername] = useState(username);
  const [formTitle, setFormTitle] = useState(professionalTitle);
  const [formHospital, setFormHospital] = useState(hospitalName);

  // Clinical Calibration States
  const [ureaVal, setUreaVal] = useState(String(thresholdUrea));
  const [creatinineVal, setCreatinineVal] = useState(String(thresholdCreatinine));
  const [potassiumVal, setPotassiumVal] = useState(String(thresholdPotassium));
  const [sodiumVal, setSodiumVal] = useState(String(thresholdSodium));
  const [energyFormula, setEnergyFormula] = useState(defaultEnergyFormula);

  // Security states
  const [newPin, setNewPin] = useState('');
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);

  // New Profile Form states
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileTitle, setNewProfileTitle] = useState('');
  const [newProfileHospital, setNewProfileHospital] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('');

  // Synchronize state with store when loading hydrates settings
  useEffect(() => {
    setFormUsername(username);
    setFormTitle(professionalTitle);
    setFormHospital(hospitalName);
    setUreaVal(String(thresholdUrea));
    setCreatinineVal(String(thresholdCreatinine));
    setPotassiumVal(String(thresholdPotassium));
    setSodiumVal(String(thresholdSodium));
    setEnergyFormula(defaultEnergyFormula);
    initSecurity(activeProfileId);
  }, [
    username,
    professionalTitle,
    hospitalName,
    activeProfileId,
    thresholdUrea,
    thresholdCreatinine,
    thresholdPotassium,
    thresholdSodium,
    defaultEnergyFormula,
  ]);

  const handleSaveIdentity = () => {
    if (!formUsername.trim()) {
      showToast('يرجى إدخال اسم الأخصائي بالكامل', 'error');
      return;
    }
    if (!formTitle.trim()) {
      showToast('يرجى إدخال اللقب المهني والدرجة العلمية', 'error');
      return;
    }
    if (!formHospital.trim()) {
      showToast('يرجى إدخال اسم المنشأة الطبية', 'error');
      return;
    }

    updateProfile(formUsername.trim(), formTitle.trim(), formHospital.trim());
    showToast('💾 تم حفظ وتحديث الهوية الطبية بنجاح', 'success');
  };

  const handleSaveClinicalSettings = () => {
    const u = parseFloat(ureaVal);
    const cr = parseFloat(creatinineVal);
    const k = parseFloat(potassiumVal);
    const na = parseFloat(sodiumVal);

    if (isNaN(u) || u <= 0) {
      showToast('يرجى إدخال حد يوريا صحيح أكبر من صفر', 'error');
      return;
    }
    if (isNaN(cr) || cr <= 0) {
      showToast('يرجى إدخال حد كرياتينين صحيح أكبر من صفر', 'error');
      return;
    }
    if (isNaN(k) || k <= 0) {
      showToast('يرجى إدخال حد بوتاسيوم صحيح أكبر من صفر', 'error');
      return;
    }
    if (isNaN(na) || na <= 0) {
      showToast('يرجى إدخال حد صوديوم صحيح أكبر من صفر', 'error');
      return;
    }

    updateClinicalSettings({
      thresholdUrea: u,
      thresholdCreatinine: cr,
      thresholdPotassium: k,
      thresholdSodium: na,
      defaultEnergyFormula: energyFormula,
    });
    showToast('💾 تم حفظ المعايير الطبية والحساسية بنجاح', 'success');
  };

  const handleConfigurePin = async () => {
    if (newPin.trim().length !== 4 || isNaN(Number(newPin))) {
      showToast('يرجى إدخال رمز PIN مكون من 4 أرقام', 'error');
      return;
    }
    await setPIN(activeProfileId, newPin.trim());
    setNewPin('');
    showToast('🔐 تم تنشيط رمز القفل بنجاح', 'success');
  };

  const handleRemovePin = async () => {
    await clearSecurity(activeProfileId);
    showToast('🔓 تم إزالة رمز القفل بنجاح', 'info');
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!hasPIN) {
      showToast('يرجى إعداد رمز PIN أولاً قبل تفعيل البصمة', 'error');
      return;
    }
    await enableBiometrics(activeProfileId, value);
    showToast(value ? '👁️ تم تفعيل البصمة بنجاح' : '❌ تم إيقاف البصمة', 'success');
  };

  const handleAddNewProfile = async () => {
    if (!newProfileName.trim() || !newProfileTitle.trim() || !newProfileHospital.trim()) {
      showToast('يرجى ملء جميع حقول الهوية الطبية', 'error');
      return;
    }
    if (newProfilePin.trim().length !== 4 || isNaN(Number(newProfilePin))) {
      showToast('يرجى إدخال رمز PIN مكون من 4 أرقام للملف الجديد', 'error');
      return;
    }

    // 1. Create Profile
    const newId = addProfile(
      newProfileName.trim(),
      newProfileTitle.trim(),
      newProfileHospital.trim()
    );

    // 2. Setup PIN for new Profile
    await setPIN(newId, newProfilePin.trim());

    // Clean states
    setNewProfileName('');
    setNewProfileTitle('');
    setNewProfileHospital('');
    setNewProfilePin('');
    setShowAddProfileModal(false);

    showToast('👤 تم إنشاء ملف الطبيب الجديد بنجاح', 'success');

    // 3. Auto-switch to new Profile & Lock
    setTimeout(async () => {
      await switchProfile(newId);
    }, 800);
  };

  const handleSwitch = async (profileId: string) => {
    await switchProfile(profileId);
    showToast('🔄 تم تبديل الحساب وتهيئة النظام الآمن', 'info');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Toast toast={toast} onDismiss={hideToast} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtnRow} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
            <ArabicText style={styles.backBtnText}>العودة للرئيسية</ArabicText>
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>غرفة التحكم والإعدادات</ArabicText>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          {/* Section 1: Active Identity card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={22} color={colors.success} />
              <ArabicText bold style={styles.cardTitle}>الهوية المهنية الحالية</ArabicText>
            </View>
            <ArabicText style={styles.cardSubtitle}>
              تعديل بيانات الحساب النشط حالياً في النظام.
            </ArabicText>

            <TextInputField
              label="اسم الأخصائي بالكامل"
              value={formUsername}
              onChangeText={setFormUsername}
              placeholder="مثال: أنس منصور الأموي"
              autoCorrect={false}
              required
            />

            <TextInputField
              label="اللقب المهني والدرجة العلمية"
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="مثال: أخصائي تغذية علاجية أول"
              required
            />

            <TextInputField
              label="اسم المنشأة الطبية / المستشفى"
              value={formHospital}
              onChangeText={setFormHospital}
              placeholder="مثال: مستشفى الثورة العام"
              required
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveIdentity} activeOpacity={0.8}>
              <Ionicons name="save-outline" size={20} color={colors.primaryContrast} />
              <ArabicText bold style={styles.saveBtnText}>حفظ وتحديث الهوية الطبية</ArabicText>
            </TouchableOpacity>
          </View>

          {/* Section: Clinical Calibration card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="options-outline" size={22} color={colors.success} />
              <ArabicText bold style={styles.cardTitle}>🚨 ضبط الحساسية والمعايير السريرية</ArabicText>
            </View>
            <ArabicText style={styles.cardSubtitle}>
              تعديل حدود تنبيهات التحاليل المخبرية للمرضى والمعادلة الافتراضية لحساب الطاقة.
            </ArabicText>

            <TextInputField
              label="حد إنذار اليوريا (mg/dL) - Urea Alert Limit"
              value={ureaVal}
              onChangeText={setUreaVal}
              keyboardType="numeric"
              required
            />

            <TextInputField
              label="حد إنذار الكرياتينين (mg/dL) - Creatinine Alert Limit"
              value={creatinineVal}
              onChangeText={setCreatinineVal}
              keyboardType="numeric"
              required
            />

            <TextInputField
              label="حد إنذار البوتاسيوم (mEq/L) - Potassium Alert Limit"
              value={potassiumVal}
              onChangeText={setPotassiumVal}
              keyboardType="numeric"
              required
            />

            <TextInputField
              label="حد إنذار الصوديوم (mEq/L) - Sodium Alert Limit"
              value={sodiumVal}
              onChangeText={setSodiumVal}
              keyboardType="numeric"
              required
            />

            <DropdownField
              label="🧮 معادلة حساب الطاقة الافتراضية"
              options={FORMULA_OPTIONS}
              selectedValue={energyFormula}
              onValueChange={setEnergyFormula}
              required
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveClinicalSettings} activeOpacity={0.8}>
              <Ionicons name="save-outline" size={20} color={colors.primaryContrast} />
              <ArabicText bold style={styles.saveBtnText}>حفظ وتحديث الإعدادات الطبية</ArabicText>
            </TouchableOpacity>
          </View>

          {/* Section 2: Security & Forensic Audit card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.success} />
              <ArabicText bold style={styles.cardTitle}>الأمان وسجل العمليات</ArabicText>
            </View>
            <ArabicText style={styles.cardSubtitle}>
              حماية قاعدة البيانات بـ PIN وتفعيل نظام البصمة البيومتري.
            </ArabicText>

            {/* PIN Lock Management */}
            {hasPIN ? (
              <View style={styles.securityRowContainer}>
                <View style={styles.securityTextColumn}>
                  <ArabicText bold style={styles.securityLabel}>قفل الدخول (PIN Code) نشط 🔐</ArabicText>
                  <ArabicText style={styles.securitySubLabel}>النظام محمي ومقفل بالكامل في الخلفية.</ArabicText>
                </View>
                <TouchableOpacity style={styles.removePinBtn} onPress={handleRemovePin} activeOpacity={0.8}>
                  <ArabicText bold style={styles.removePinBtnText}>إزالة القفل</ArabicText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pinSetupContainer}>
                <ArabicText bold style={styles.securityLabel}>رمز القفل (PIN) غير مفعل 🔓</ArabicText>
                <ArabicText style={styles.securitySubLabel}>يرجى إدخال 4 أرقام لتنشيط الحماية.</ArabicText>
                
                <View style={styles.pinInputRow}>
                  <TextInput
                    style={styles.pinInput}
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="PIN"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                  <TouchableOpacity style={styles.activatePinBtn} onPress={handleConfigurePin} activeOpacity={0.8}>
                    <ArabicText bold style={styles.activatePinBtnText}>تنشيط القفل</ArabicText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Biometric Configuration */}
            <View style={styles.divider} />

            <View style={styles.securityRowContainer}>
              <View style={styles.securityTextColumn}>
                <ArabicText bold style={styles.securityLabel}>
                  تسجيل الدخول بالبصمة (FaceID / Fingerprint)
                </ArabicText>
                <ArabicText style={styles.securitySubLabel}>
                  {isBiometricsSupported
                    ? 'تسريع الدخول الآمن باستخدام البصمة البيومترية.'
                    : 'البصمة غير مدعومة أو غير مسجلة في هذا الجهاز.'}
                </ArabicText>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!isBiometricsSupported}
                trackColor={{ false: '#334155', true: '#1B6B4A' }}
                thumbColor={biometricsEnabled ? '#10B981' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Section 3: Profile Switcher card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={22} color={colors.success} />
              <ArabicText bold style={styles.cardTitle}>مبدل الحسابات الآمن</ArabicText>
            </View>
            <ArabicText style={styles.cardSubtitle}>
              التبديل بين ملفات الأخصائيين المعتمدين في هذه المنظومة.
            </ArabicText>

            {/* List of clinical profiles */}
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              return (
                <View
                  key={profile.id}
                  style={[styles.profileItem, isActive && styles.profileItemActive]}
                >
                  <View style={styles.profileItemInfo}>
                    <ArabicText bold style={styles.profileItemName}>{profile.username}</ArabicText>
                    <ArabicText style={styles.profileItemDesc}>{profile.professionalTitle}</ArabicText>
                    <ArabicText style={styles.profileItemDesc}>{profile.hospitalName}</ArabicText>
                  </View>
                  
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <ArabicText style={styles.activeBadgeText}>نشط</ArabicText>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.switchProfileBtn}
                      onPress={() => handleSwitch(profile.id)}
                      activeOpacity={0.8}
                    >
                      <ArabicText bold style={styles.switchProfileBtnText}>دخول</ArabicText>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addProfileBtn}
              onPress={() => setShowAddProfileModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={18} color="#1B6B4A" />
              <ArabicText bold style={styles.addProfileBtnText}>إضافة ملف طبيب جديد</ArabicText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal: Add Profile Form */}
        <Modal
          visible={showAddProfileModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ArabicText bold style={styles.modalTitle}>إضافة طبيب جديد مع رمز PIN</ArabicText>
                <TouchableOpacity onPress={() => setShowAddProfileModal(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                <TextInputField
                  label="اسم الأخصائي بالكامل"
                  value={newProfileName}
                  onChangeText={setNewProfileName}
                  placeholder="مثال: د. أنس منصور"
                  required
                />

                <TextInputField
                  label="اللقب المهني والدرجة العلمية"
                  value={newProfileTitle}
                  onChangeText={setNewProfileTitle}
                  placeholder="مثال: أخصائي تغذية وريدية"
                  required
                />

                <TextInputField
                  label="المنشأة الطبية / المستشفى"
                  value={newProfileHospital}
                  onChangeText={setNewProfileHospital}
                  placeholder="مثال: مستشفى الثورة العام"
                  required
                />

                <TextInputField
                  label="إعداد رمز PIN الخاص بالملف (4 أرقام)"
                  value={newProfilePin}
                  onChangeText={setNewProfilePin}
                  placeholder="PIN"
                  keyboardType="numeric"
                  secureTextEntry
                  required
                />

                <TouchableOpacity
                  style={styles.saveNewProfileBtn}
                  onPress={handleAddNewProfile}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primaryContrast} />
                  <ArabicText bold style={styles.saveNewProfileBtnText}>إنشاء وتنشيط الحساب</ArabicText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtnRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fontFamilies.medium,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: fontFamilies.bold,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fontFamilies.bold,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    lineHeight: 18,
    marginBottom: spacing.lg,
    textAlign: 'right',
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B6B4A',
    borderRadius: 8,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: 48,
  },
  saveBtnText: {
    color: colors.primaryContrast,
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: spacing.md,
  },
  securityRowContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  securityTextColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  securityLabel: {
    fontSize: 14,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  securitySubLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamilies.medium,
    marginTop: 2,
    textAlign: 'right',
  },
  removePinBtn: {
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF444435',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removePinBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  pinSetupContainer: {
    alignItems: 'flex-end',
  },
  pinInputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    width: '100%',
  },
  pinInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 6,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fontFamilies.bold,
  },
  activatePinBtn: {
    backgroundColor: '#1B6B4A',
    borderRadius: 6,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activatePinBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  profileItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  profileItemActive: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  profileItemInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileItemName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  profileItemDesc: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98115',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: fontFamilies.bold,
  },
  switchProfileBtn: {
    backgroundColor: '#1B6B4A20',
    borderWidth: 1,
    borderColor: '#1B6B4A40',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  switchProfileBtnText: {
    color: '#1B6B4A',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  addProfileBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1B6B4A',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  addProfileBtnText: {
    color: '#1B6B4A',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#475569',
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontFamily: fontFamilies.bold,
  },
  modalScroll: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  saveNewProfileBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B6B4A',
    borderRadius: 8,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: 48,
  },
  saveNewProfileBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
});
