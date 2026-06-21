import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const getPinKey = (profileId: string) => `clinical_nutrition_pin_${profileId}`;
const getBiometricKey = (profileId: string) => `clinical_nutrition_bio_${profileId}`;

interface SecurityState {
  isLocked: boolean;
  hasPIN: boolean;
  biometricsEnabled: boolean;
  isBiometricsSupported: boolean;
  lastActiveTime: number;
  isLoading: boolean;
  error: string | null;

  initSecurity: (profileId: string) => Promise<void>;
  hashPin: (pin: string) => Promise<string>;
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
  isLoading: false,
  error: null,

  initSecurity: async (profileId: string) => {
    set({ isLoading: true, error: null });
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
        isLocked: pinExists,
        isLoading: false,
      });
    } catch (e) {
      console.error('Security initialization failed:', e);
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Security initialization failed' });
    }
  },

  hashPin: async (pin: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
  },

  setPIN: async (profileId: string, pin: string) => {
    set({ isLoading: true, error: null });
    try {
      const pinKey = getPinKey(profileId);
      const hashed = await get().hashPin(pin);
      if (Platform.OS === 'web') {
        localStorage.setItem(pinKey, hashed);
      } else {
        await SecureStore.setItemAsync(pinKey, hashed);
      }
      set({ hasPIN: true, isLocked: false, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Failed to set PIN' });
    }
  },

  verifyPIN: async (profileId: string, pin: string) => {
    const pinKey = getPinKey(profileId);
    let storedHash: string | null = null;
    if (Platform.OS === 'web') {
      storedHash = localStorage.getItem(pinKey);
    } else {
      storedHash = await SecureStore.getItemAsync(pinKey);
    }
    if (!storedHash) return false;

    const inputHash = await get().hashPin(pin);
    if (storedHash === inputHash) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  enableBiometrics: async (profileId: string, enabled: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const bioKey = getBiometricKey(profileId);
      if (Platform.OS === 'web') {
        localStorage.setItem(bioKey, String(enabled));
      } else {
        await SecureStore.setItemAsync(bioKey, String(enabled));
      }
      set({ biometricsEnabled: enabled, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Failed to update biometrics' });
    }
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
    set({ isLoading: true, error: null });
    try {
      const pinKey = getPinKey(profileId);
      const bioKey = getBiometricKey(profileId);

      if (Platform.OS === 'web') {
        localStorage.removeItem(pinKey);
        localStorage.removeItem(bioKey);
      } else {
        await SecureStore.deleteItemAsync(pinKey);
        await SecureStore.deleteItemAsync(bioKey);
      }
      set({ hasPIN: false, biometricsEnabled: false, isLocked: false, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Failed to clear security' });
    }
  },
}));
