import { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../../src/presentation/theme';
import ArabicText from '../../src/presentation/components/ArabicText';
import Button from '../../src/presentation/components/Button';
import { useAuthStore } from '../../src/presentation/stores/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleRegister = async () => {
    setValidationError('');
    clearError();

    if (!fullName.trim()) {
      setValidationError('يرجى إدخال الاسم الكامل.');
      return;
    }
    if (!email.trim()) {
      setValidationError('يرجى إدخال البريد الإلكتروني.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('صيغة البريد الإلكتروني غير صحيحة.');
      return;
    }
    if (!password) {
      setValidationError('يرجى إدخال كلمة المرور.');
      return;
    }
    if (password.length < 6) {
      setValidationError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    const success = await register({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      clinicName: clinicName.trim() || undefined,
    });

    if (success) {
      router.replace('/');
    }
  };

  const displayError = validationError || error;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={48} color={colors.primary} />
          </View>
          <ArabicText bold style={styles.title}>
            إنشاء حساب جديد
          </ArabicText>
          <ArabicText style={styles.subtitle}>
            اشترك للاستفادة من المزامنة السحابية والميزات المتقدمة
          </ArabicText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ArabicText style={styles.label}>الاسم الكامل</ArabicText>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(t) => { setFullName(t); setValidationError(''); clearError(); }}
                placeholder="د. أحمد السعودي"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="words"
                textAlign="right"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ArabicText style={styles.label}>البريد الإلكتروني</ArabicText>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => { setEmail(t); setValidationError(''); clearError(); }}
                placeholder="doctor@hospital.com"
                placeholderTextColor={colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ArabicText style={styles.label}>كلمة المرور</ArabicText>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={(t) => { setPassword(t); setValidationError(''); clearError(); }}
                placeholder="6 أحرف على الأقل"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textAlign="right"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ArabicText style={styles.label}>تأكيد كلمة المرور</ArabicText>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setValidationError(''); clearError(); }}
                placeholder="أعد إدخال كلمة المرور"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textAlign="right"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ArabicText style={styles.label}>اسم العيادة (اختياري)</ArabicText>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={clinicName}
                onChangeText={setClinicName}
                placeholder="مستشفى الملك فيصل التخصصي"
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                editable={!isLoading}
              />
            </View>
          </View>

          {displayError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <ArabicText style={styles.errorText}>{displayError}</ArabicText>
            </View>
          ) : null}

          <Button
            title={isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginRow}>
            <ArabicText style={styles.loginText}>لديك حساب بالفعل؟</ArabicText>
            <TouchableOpacity onPress={() => router.push('/auth/login')} disabled={isLoading}>
              <ArabicText bold style={styles.loginLink}>تسجيل الدخول</ArabicText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceSecondary },
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: fontFamilies.black,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.medium,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputIcon: {
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    paddingVertical: spacing.sm,
  },
  passwordInput: {
    paddingLeft: spacing.sm,
  },
  passwordToggle: {
    padding: spacing.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontFamily: fontFamilies.medium,
    flex: 1,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  loginLink: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
});
