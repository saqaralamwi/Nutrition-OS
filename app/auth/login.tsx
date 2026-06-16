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

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleLogin = async () => {
    setValidationError('');
    clearError();

    if (!email.trim()) {
      setValidationError('يرجى إدخال البريد الإلكتروني.');
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

    const success = await login({ email: email.trim(), password });
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
            <Ionicons name="medical" size={48} color={colors.primary} />
          </View>
          <ArabicText bold style={styles.title}>
            نظام إدارة التغذية العلاجية
          </ArabicText>
          <ArabicText style={styles.subtitle}>
            تسجيل الدخول إلى الحساب السحابي
          </ArabicText>
        </View>

        <View style={styles.form}>
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
                placeholder="********"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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
            title={isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.registerRow}>
            <ArabicText style={styles.registerText}>ليس لديك حساب؟</ArabicText>
            <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={isLoading}>
              <ArabicText bold style={styles.registerLink}>إنشاء حساب جديد</ArabicText>
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
  loginButton: {
    marginTop: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  registerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies.regular,
  },
  registerLink: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
});
