import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const getPinKey = (profileId: string) => `clinical_nutrition_pin_${profileId}`;
const getBiometricKey = (profileId: string) => `clinical_nutrition_bio_${profileId}`;

interface SecurityState {
  isLocked: boolean;
  hasPIN: boolean;
  biometricsEnabled: boolean;
  isBiometricsSupported: boolean;
  lastActiveTime: number;

  initSecurity: (profileId: string) => Promise<void>;
  setPIN: (profileId: string, pin: string) => Promise<void>;
  verifyPIN: (profileId: string, pin: string) => Promise<boolean>;
  enableBiometrics: (profileId: string, enabled: boolean) => Promise<void>;
  authenticateBiometrics: (profileId: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
  updateLastActiveTime: () => void;
  clearSecurity: (profileId: string) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isLocked: false,
  hasPIN: false,
  biometricsEnabled: false,
  isBiometricsSupported: false,
  lastActiveTime: Date.now(),

  initSecurity: async (profileId: string) => {
    try {
      const pinKey = getPinKey(profileId);
      const bioKey = getBiometricKey(profileId);

      let pinExists = false;
      if (Platform.OS === 'web') {
        pinExists = !!localStorage.getItem(pinKey);
      } else {
        const pin = await SecureStore.getItemAsync(pinKey);
        pinExists = !!pin;
      }

      let bioEnabled = false;
      if (Platform.OS === 'web') {
        bioEnabled = localStorage.getItem(bioKey) === 'true';
      } else {
        const bio = await SecureStore.getItemAsync(bioKey);
        bioEnabled = bio === 'true';
      }

      let hasHardware = false;
      let isEnrolled = false;
      try {
        hasHardware = await LocalAuthentication.hasHardwareAsync();
        isEnrolled = await LocalAuthentication.isEnrolledAsync();
      } catch (bioError) {
        console.warn('[securityStore] LocalAuthentication check failed:', bioError);
      }

      set({
        hasPIN: pinExists,
        biometricsEnabled: bioEnabled,
        isBiometricsSupported: hasHardware && isEnrolled,
        isLocked: pinExists, // Automatically lock if PIN exists
      });
    } catch (e) {
      console.error('Security initialization failed:', e);
    }
  },

  setPIN: async (profileId: string, pin: string) => {
    const pinKey = getPinKey(profileId);
    if (Platform.OS === 'web') {
      localStorage.setItem(pinKey, pin);
    } else {
      await SecureStore.setItemAsync(pinKey, pin);
    }
    set({ hasPIN: true, isLocked: false });
  },

  verifyPIN: async (profileId: string, pin: string) => {
    const pinKey = getPinKey(profileId);
    let storedPin: string | null = null;
    if (Platform.OS === 'web') {
      storedPin = localStorage.getItem(pinKey);
    } else {
      storedPin = await SecureStore.getItemAsync(pinKey);
    }
    
    if (storedPin === pin) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  enableBiometrics: async (profileId: string, enabled: boolean) => {
    const bioKey = getBiometricKey(profileId);
    if (Platform.OS === 'web') {
      localStorage.setItem(bioKey, String(enabled));
    } else {
      await SecureStore.setItemAsync(bioKey, String(enabled));
    }
    set({ biometricsEnabled: enabled });
  },

  authenticateBiometrics: async (profileId: string) => {
    const { isBiometricsSupported, biometricsEnabled } = get();
    if (!isBiometricsSupported || !biometricsEnabled) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'الدخول الآمن للنظام',
        fallbackLabel: 'استخدم رمز PIN',
        cancelLabel: 'إلغاء',
      });

      if (result.success) {
        set({ isLocked: false });
        return true;
      }
      return false;
    } catch (authErr) {
      console.error('[securityStore] Biometric authentication failed:', authErr);
      return false;
    }
  },

  lockApp: () => {
    if (get().hasPIN) {
      set({ isLocked: true });
    }
  },

  unlockApp: () => {
    set({ isLocked: false });
  },

  updateLastActiveTime: () => {
    set({ lastActiveTime: Date.now() });
  },

  clearSecurity: async (profileId: string) => {
    const pinKey = getPinKey(profileId);
    const bioKey = getBiometricKey(profileId);

    if (Platform.OS === 'web') {
      localStorage.removeItem(pinKey);
      localStorage.removeItem(bioKey);
    } else {
      await SecureStore.deleteItemAsync(pinKey);
      await SecureStore.deleteItemAsync(bioKey);
    }
    set({ hasPIN: false, biometricsEnabled: false, isLocked: false });
  },
}));
