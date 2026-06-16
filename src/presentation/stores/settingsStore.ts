import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePatientStore } from './patientStore';
import { useSecurityStore } from './securityStore';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface ClinicianProfile {
  id: string;
  username: string;
  professionalTitle: string;
  hospitalName: string;
}

export interface SettingsState {
  profiles: ClinicianProfile[];
  activeProfileId: string;
  username: string;
  professionalTitle: string;
  hospitalName: string;
  
  // Clinical Calibration Thresholds & Formulas
  thresholdUrea: number;
  thresholdCreatinine: number;
  thresholdPotassium: number;
  thresholdSodium: number;
  defaultEnergyFormula: string;

  addProfile: (username: string, professionalTitle: string, hospitalName: string) => string;
  switchProfile: (profileId: string) => Promise<void>;
  updateProfile: (username: string, professionalTitle: string, hospitalName: string) => void;
  deleteProfile: (profileId: string) => void;
  themeMode: 'night' | 'morning';
  setThemeMode: (mode: 'night' | 'morning') => void;
  updateClinicalSettings: (settings: Partial<Pick<SettingsState, 'thresholdUrea' | 'thresholdCreatinine' | 'thresholdPotassium' | 'thresholdSodium' | 'defaultEnergyFormula'>>) => void;
}

const DEFAULT_PROFILE: ClinicianProfile = {
  id: 'primary',
  username: 'Anas Mansoor Al-Umawi',
  professionalTitle: 'Clinical Nutritionist & Dietitian',
  hospitalName: 'Ibb Revolutionary General Hospital',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: 'primary',
      username: DEFAULT_PROFILE.username,
      professionalTitle: DEFAULT_PROFILE.professionalTitle,
      hospitalName: DEFAULT_PROFILE.hospitalName,

      // Default clinical settings
      thresholdUrea: 40,
      thresholdCreatinine: 1.2,
      thresholdPotassium: 5.0,
      thresholdSodium: 145,
      defaultEnergyFormula: 'Mifflin',
      themeMode: 'night',

      addProfile: (username, professionalTitle, hospitalName) => {
        const id = 'profile_' + Date.now();
        const newProfile = { id, username, professionalTitle, hospitalName };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
        }));
        return id;
      },

      switchProfile: async (profileId) => {
        const target = get().profiles.find((p) => p.id === profileId);
        if (!target) return;

        // --- Safe-Switch Logic ---
        
        // 1. Flush transient memory / search / sort states
        const patientStore = usePatientStore.getState();
        patientStore.searchQuery = '';
        patientStore.sortOrder = 'newest';
        
        // Reload patients list to flush/sync
        await patientStore.loadPatients();

        // 2. Clear current OCR cropping cache (temporary image picker files)
        if (Platform.OS !== 'web') {
          try {
            const cacheDir = (FileSystem as any).cacheDirectory;
            if (cacheDir) {
              const files = await FileSystem.readDirectoryAsync(cacheDir);
              for (const file of files) {
                if (file.includes('ImagePicker') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
                  await FileSystem.deleteAsync(cacheDir + file, { idempotent: true });
                }
              }
            }
          } catch (e) {
            console.error('Failed to clear OCR files cache on switch:', e);
          }
        }

        // 3. Switch active profile details
        set({
          activeProfileId: profileId,
          username: target.username,
          professionalTitle: target.professionalTitle,
          hospitalName: target.hospitalName,
        });

        // 4. Force PIN re-verification
        const securityStore = useSecurityStore.getState();
        await securityStore.initSecurity(profileId);
      },

      updateProfile: (username, professionalTitle, hospitalName) => {
        const activeId = get().activeProfileId;
        set((state) => {
          const updatedProfiles = state.profiles.map((p) =>
            p.id === activeId ? { ...p, username, professionalTitle, hospitalName } : p
          );
          return {
            profiles: updatedProfiles,
            username,
            professionalTitle,
            hospitalName,
          };
        });
      },

      deleteProfile: (profileId) => {
        if (profileId === 'primary' || profileId === get().activeProfileId) return;
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== profileId),
        }));
      },

      setThemeMode: (mode) => {
        set({ themeMode: mode });
      },

      updateClinicalSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings,
        }));
      },
    }),
    {
      name: 'clinical-nutrition-settings-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
