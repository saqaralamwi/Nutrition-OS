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
import { useAuthStore } from '../src/presentation/stores/authStore';
import { usePatientStore } from '../src/presentation/stores/patientStore';
import Toast from '../src/presentation/components/Toast';
import Animated from 'react-native-reanimated';
import { useAppTheme } from '../src/presentation/hooks/useAppTheme';

const AnimatedArabicText = Animated.createAnimatedComponent(ArabicText);

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
    themeMode,
    setThemeMode,
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

  const { theme, animatedContainer, animatedCard, animatedText, animatedSubtext } = useAppTheme();

  return (
    <Animated.View style={[{ flex: 1 }, animatedContainer]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Toast toast={toast} onDismiss={hideToast} />

          {/* Header */}
          <Animated.View style={[styles.header, animatedCard]}>
            <TouchableOpacity style={styles.backBtnRow} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
              <AnimatedArabicText style={[styles.backBtnText, animatedSubtext]}>العودة للرئيسية</AnimatedArabicText>
            </TouchableOpacity>
            <AnimatedArabicText bold style={[styles.headerTitle, animatedText]}>غرفة التحكم والإعدادات</AnimatedArabicText>
          </Animated.View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          {/* Section 1: Active Identity card */}
          <Animated.View style={[styles.card, animatedCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={22} color={colors.success} />
              <AnimatedArabicText bold style={[styles.cardTitle, animatedText]}>الهوية المهنية الحالية</AnimatedArabicText>
            </View>
            <AnimatedArabicText style={[styles.cardSubtitle, animatedSubtext]}>
              تعديل بيانات الحساب النشط حالياً في النظام.
            </AnimatedArabicText>

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
          </Animated.View>

          {/* Section: Clinical Calibration card */}
          <Animated.View style={[styles.card, animatedCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="options-outline" size={22} color={colors.success} />
              <AnimatedArabicText bold style={[styles.cardTitle, animatedText]}>🚨 ضبط الحساسية والمعايير السريرية</AnimatedArabicText>
            </View>
            <AnimatedArabicText style={[styles.cardSubtitle, animatedSubtext]}>
              تعديل حدود تنبيهات التحاليل المخبرية للمرضى والمعادلة الافتراضية لحساب الطاقة.
            </AnimatedArabicText>

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
          </Animated.View>

          {/* Section: Universal Theme Mode card */}
          <Animated.View style={[styles.card, animatedCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="color-palette-outline" size={22} color={colors.success} />
              <AnimatedArabicText bold style={[styles.cardTitle, animatedText]}>🎨 مظهر التطبيق (Theme Settings)</AnimatedArabicText>
            </View>
            <AnimatedArabicText style={[styles.cardSubtitle, animatedSubtext]}>
              التبديل بين المظهر الصباحي المضيء والمظهر المسائي الهادئ.
            </AnimatedArabicText>

            <View style={styles.securityRowContainer}>
              <View style={styles.securityTextColumn}>
                <AnimatedArabicText bold style={[styles.securityLabel, animatedText]}>المظهر الفعال حالياً</AnimatedArabicText>
                <AnimatedArabicText style={[styles.securitySubLabel, animatedSubtext]}>
                  {themeMode === 'night' ? 'المظهر المسائي الهادئ (Dark Mode)' : 'المظهر الصباحي المضيء (Light Mode)'}
                </AnimatedArabicText>
              </View>
              <Switch
                value={themeMode === 'night'}
                onValueChange={(value) => setThemeMode(value ? 'night' : 'morning')}
                trackColor={{ false: '#E2E8F0', true: '#1B6B4A' }}
                thumbColor={themeMode === 'night' ? '#10B981' : '#64748B'}
              />
            </View>
          </Animated.View>

          {/* Section 2: Security & Forensic Audit card */}
          <Animated.View style={[styles.card, animatedCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.success} />
              <AnimatedArabicText bold style={[styles.cardTitle, animatedText]}>الأمان وسجل العمليات</AnimatedArabicText>
            </View>
            <AnimatedArabicText style={[styles.cardSubtitle, animatedSubtext]}>
              حماية قاعدة البيانات بـ PIN وتفعيل نظام البصمة البيومتري.
            </AnimatedArabicText>

            {/* PIN Lock Management */}
            {hasPIN ? (
              <View style={styles.securityRowContainer}>
                <View style={styles.securityTextColumn}>
                  <AnimatedArabicText bold style={[styles.securityLabel, animatedText]}>قفل الدخول (PIN Code) نشط 🔐</AnimatedArabicText>
                  <AnimatedArabicText style={[styles.securitySubLabel, animatedSubtext]}>النظام محمي ومقفل بالكامل في الخلفية.</AnimatedArabicText>
                </View>
                <TouchableOpacity style={styles.removePinBtn} onPress={handleRemovePin} activeOpacity={0.8}>
                  <ArabicText bold style={styles.removePinBtnText}>إزالة القفل</ArabicText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pinSetupContainer}>
                <AnimatedArabicText bold style={[styles.securityLabel, animatedText]}>رمز القفل (PIN) غير مفعل 🔓</AnimatedArabicText>
                <AnimatedArabicText style={[styles.securitySubLabel, animatedSubtext]}>يرجى إدخال 4 أرقام لتنشيط الحماية.</AnimatedArabicText>
                
                <View style={styles.pinInputRow}>
                  <TextInput
                    style={[styles.pinInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="PIN"
                    placeholderTextColor={theme.subtext}
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
                <AnimatedArabicText bold style={[styles.securityLabel, animatedText]}>
                  تسجيل الدخول بالبصمة (FaceID / Fingerprint)
                </AnimatedArabicText>
                <AnimatedArabicText style={[styles.securitySubLabel, animatedSubtext]}>
                  {isBiometricsSupported
                    ? 'تسريع الدخول الآمن باستخدام البصمة البيومترية.'
                    : 'البصمة غير مدعومة أو غير مسجلة في هذا الجهاز.'}
                </AnimatedArabicText>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!isBiometricsSupported}
                trackColor={{ false: '#334155', true: '#1B6B4A' }}
                thumbColor={biometricsEnabled ? '#10B981' : '#94A3B8'}
              />
            </View>
          </Animated.View>

          {/* Section 3: Profile Switcher card */}
          <Animated.View style={[styles.card, animatedCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={22} color={colors.success} />
              <AnimatedArabicText bold style={[styles.cardTitle, animatedText]}>مبدل الحسابات الآمن</AnimatedArabicText>
            </View>
            <AnimatedArabicText style={[styles.cardSubtitle, animatedSubtext]}>
              التبديل بين ملفات الأخصائيين المعتمدين في هذه المنظومة.
            </AnimatedArabicText>

            {/* List of clinical profiles */}
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              return (
                <Animated.View
                  key={profile.id}
                  style={[styles.profileItem, animatedContainer, isActive && styles.profileItemActive]}
                >
                  <View style={styles.profileItemInfo}>
                    <AnimatedArabicText bold style={[styles.profileItemName, animatedText]}>{profile.username}</AnimatedArabicText>
                    <AnimatedArabicText style={[styles.profileItemDesc, animatedSubtext]}>{profile.professionalTitle}</AnimatedArabicText>
                    <AnimatedArabicText style={[styles.profileItemDesc, animatedSubtext]}>{profile.hospitalName}</AnimatedArabicText>
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
                </Animated.View>
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
          </Animated.View>

          {/* Section 4: Cloud Account card */}
          <Animated.View style={[styles.card, animatedCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cloud-outline" size={22} color={colors.info} />
              <AnimatedArabicText bold style={[styles.cardTitle, animatedText]}>الحساب السحابي</AnimatedArabicText>
            </View>
            <AnimatedArabicText style={[styles.cardSubtitle, animatedSubtext]}>
              المزامنة السحابية عبر Supabase. قم بتسجيل الدخول لمزامنة البيانات مع الخادم.
            </AnimatedArabicText>

            <CloudAccountSection />
          </Animated.View>
        </ScrollView>

        {/* Modal: Add Profile Form */}
        <Modal
          visible={showAddProfileModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContent, animatedCard]}>
              <Animated.View style={[styles.modalHeader, animatedCard, { borderBottomWidth: 1, backgroundColor: 'transparent' }]}>
                <AnimatedArabicText bold style={[styles.modalTitle, animatedText]}>إضافة طبيب جديد مع رمز PIN</AnimatedArabicText>
                <TouchableOpacity onPress={() => setShowAddProfileModal(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </Animated.View>

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
            </Animated.View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
    </Animated.View>
  );
}

function CloudAccountSection() {
  const router = useRouter();
  const { user, isCloudConfigured, isLoading, logout } = useAuthStore();

  if (!isCloudConfigured) {
    return (
      <View style={cloudStyles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
        <ArabicText style={cloudStyles.infoText}>
          لم يتم تهيئة الخدمة السحابية. قم بتعيين متغيرات EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY للتفعيل.
        </ArabicText>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={cloudStyles.gap}>
        <ArabicText style={cloudStyles.detailText}>
          غير مسجل الدخول. قم بتسجيل الدخول للمزامنة مع الخادم السحابي.
        </ArabicText>
        <TouchableOpacity
          style={cloudStyles.loginBtn}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.8}
        >
          <Ionicons name="log-in-outline" size={18} color={colors.primaryContrast} />
          <ArabicText bold style={cloudStyles.loginBtnText}>تسجيل الدخول</ArabicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={cloudStyles.registerBtn}
          onPress={() => router.push('/auth/register')}
          activeOpacity={0.8}
        >
          <ArabicText bold style={cloudStyles.registerBtnText}>إنشاء حساب جديد</ArabicText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={cloudStyles.gap}>
      <View style={cloudStyles.userRow}>
        <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
        <View style={cloudStyles.userInfo}>
          <ArabicText bold style={cloudStyles.userName}>{user.fullName}</ArabicText>
          <ArabicText style={cloudStyles.userEmail}>{user.email}</ArabicText>
          {user.clinicName ? (
            <ArabicText style={cloudStyles.userClinic}>{user.clinicName}</ArabicText>
          ) : null}
        </View>
      </View>

      <View style={cloudStyles.badgeRow}>
        <View style={cloudStyles.planBadge}>
          <ArabicText bold style={cloudStyles.planText}>
            {user.subscriptionPlan === 'free' ? 'مجاني' : user.subscriptionPlan === 'pro' ? 'احترافي' : 'عيادة'}
          </ArabicText>
        </View>
        <ArabicText style={cloudStyles.planLimit}>
          {user.patientLimit === Infinity ? 'غير محدود' : `${user.patientLimit} مريض`}
        </ArabicText>
      </View>

      <TouchableOpacity
        style={cloudStyles.logoutBtn}
        onPress={logout}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <ArabicText bold style={cloudStyles.logoutBtnText}>
          {isLoading ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج من الحساب السحابي'}
        </ArabicText>
      </TouchableOpacity>
    </View>
  );
}

const cloudStyles = StyleSheet.create({
  gap: { gap: spacing.sm },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 8,
    padding: spacing.sm,
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fontFamilies.medium,
    flex: 1,
    textAlign: 'right',
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
  },
  loginBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: 44,
  },
  loginBtnText: {
    color: colors.primaryContrast,
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  registerBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: 44,
  },
  registerBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  userRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fontFamilies.bold,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  userClinic: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planBadge: {
    backgroundColor: 'rgba(27, 107, 74, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fontFamilies.bold,
  },
  planLimit: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
  },
  logoutBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: 44,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
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
