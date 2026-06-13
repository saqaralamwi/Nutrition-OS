import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../theme';
import ArabicText from './ArabicText';
import { useSecurityStore } from '../stores/securityStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function LockScreen() {
  const { isLocked, verifyPIN, authenticateBiometrics, biometricsEnabled, isBiometricsSupported, initSecurity } = useSecurityStore();
  const { username, professionalTitle, hospitalName, activeProfileId } = useSettingsStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Animation for incorrect passcode shake effect
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Initialize and auto-trigger biometrics on mount
  useEffect(() => {
    async function setupAndTriggerBio() {
      await initSecurity(activeProfileId);
      if (biometricsEnabled && isBiometricsSupported) {
        // Delay slightly for smoother transition/render
        setTimeout(async () => {
          await authenticateBiometrics(activeProfileId);
        }, 500);
      }
    }
    if (isLocked) {
      setPin('');
      setErrorMsg('');
      setupAndTriggerBio();
    }
  }, [isLocked, activeProfileId, biometricsEnabled, isBiometricsSupported]);

  if (!isLocked) return null;

  const triggerShake = () => {
    Vibration.vibrate(100);
    setErrorMsg('رمز PIN غير صحيح. يرجى المحاولة مجدداً.');
    setPin('');

    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = async (num: string) => {
    setErrorMsg('');
    const newPin = pin + num;
    if (newPin.length <= 4) {
      setPin(newPin);
    }

    if (newPin.length === 4) {
      const isValid = await verifyPIN(activeProfileId, newPin);
      if (!isValid) {
        triggerShake();
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleBiometricPress = async () => {
    setErrorMsg('');
    const success = await authenticateBiometrics(activeProfileId);
    if (!success && biometricsEnabled) {
      setErrorMsg('فشل التحقق من البصمة.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Profile Card / Identity Block */}
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={44} color="#1B6B4A" />
          </View>
          <ArabicText bold style={styles.usernameText}>
            {username}
          </ArabicText>
          <ArabicText style={styles.titleText}>
            {professionalTitle}
          </ArabicText>
          <ArabicText style={styles.hospitalText}>
            {hospitalName}
          </ArabicText>
        </View>

        {/* Lock Instructions */}
        <ArabicText bold style={styles.lockTitle}>
          🔐 دخول آمن للنظام التغذوي
        </ArabicText>
        <ArabicText style={styles.lockSubtitle}>
          يرجى إدخال رمز PIN المكون من 4 أرقام للمتابعة
        </ArabicText>

        {/* Bullet Indicators with Shake animation */}
        <Animated.View
          style={[
            styles.bulletContainer,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.bullet,
                pin.length > index ? styles.bulletActive : null,
                errorMsg ? styles.bulletError : null,
              ]}
            />
          ))}
        </Animated.View>

        {/* Error message */}
        {errorMsg ? (
          <ArabicText style={styles.errorText}>{errorMsg}</ArabicText>
        ) : null}

        {/* Custom Numeric Keypad */}
        <View style={styles.keypad}>
          {/* Row 1 */}
          <View style={styles.row}>
            {['1', '2', '3'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.8}
              >
                <ArabicText bold style={styles.keyText}>{num}</ArabicText>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 2 */}
          <View style={styles.row}>
            {['4', '5', '6'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.8}
              >
                <ArabicText bold style={styles.keyText}>{num}</ArabicText>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 3 */}
          <View style={styles.row}>
            {['7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.8}
              >
                <ArabicText bold style={styles.keyText}>{num}</ArabicText>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 4 (Biometrics, 0, Backspace) */}
          <View style={styles.row}>
            {/* Biometric trigger */}
            <TouchableOpacity
              style={[styles.key, styles.utilityKey]}
              onPress={handleBiometricPress}
              disabled={!isBiometricsSupported || !biometricsEnabled}
              activeOpacity={0.8}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'finger-print' : 'finger-print-outline'}
                size={26}
                color={
                  isBiometricsSupported && biometricsEnabled
                    ? '#1B6B4A'
                    : '#475569'
                }
              />
            </TouchableOpacity>

            {/* Zero Key */}
            <TouchableOpacity
              style={styles.key}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.8}
            >
              <ArabicText bold style={styles.keyText}>0</ArabicText>
            </TouchableOpacity>

            {/* Backspace */}
            <TouchableOpacity
              style={[styles.key, styles.utilityKey]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="backspace-outline" size={26} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    zIndex: 99999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  profileContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: spacing.xl,
    elevation: 4,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1B6B4A15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#1B6B4A30',
  },
  usernameText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  titleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  hospitalText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  lockTitle: {
    fontSize: 18,
    color: '#F8FAFC',
    textAlign: 'center',
    fontFamily: fontFamilies.bold,
    marginBottom: spacing.xs,
  },
  lockSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: fontFamilies.medium,
    marginBottom: spacing.lg,
  },
  bulletContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    width: 160,
  },
  bullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  bulletActive: {
    backgroundColor: '#1B6B4A',
    borderColor: '#1B6B4A',
  },
  bulletError: {
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  key: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  utilityKey: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyText: {
    fontSize: 22,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
  },
});
