/**
 * Settings Store - 앱 설정 상태 관리
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';
import { keyManager } from '../services/wallet/KeyManager';

const SETTINGS_KEY = 'app_settings';

interface SettingsState extends AppSettings {
  // 추가 상태
  isBiometricsAvailable: boolean;

  // 액션
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  enableBiometrics: (pin: string) => Promise<boolean>;
  checkBiometricsAvailability: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  currency: 'USD',
  language: 'en',
  biometricEnabled: false,
  autoLockTimeout: 5, // 5분
  hasSetupPin: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 초기 상태
  ...defaultSettings,
  isBiometricsAvailable: false,

  // 액션
  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored) as AppSettings;
        set(settings);
      }

      // PIN 설정 여부 확인
      const hasPin = await keyManager.hasPin();
      set({ hasSetupPin: hasPin });

      // 생체 인증 가능 여부 확인
      await get().checkBiometricsAvailability();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    try {
      const currentSettings = {
        currency: get().currency,
        language: get().language,
        biometricEnabled: get().biometricEnabled,
        autoLockTimeout: get().autoLockTimeout,
        hasSetupPin: get().hasSetupPin,
      };

      const updated = { ...currentSettings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      set(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  },

  enableBiometrics: async (pin: string) => {
    try {
      const success = await keyManager.enableBiometrics(pin);
      if (success) {
        await get().updateSettings({ biometricEnabled: true });
      }
      return success;
    } catch (error) {
      console.error('Failed to enable biometrics:', error);
      return false;
    }
  },

  checkBiometricsAvailability: async () => {
    const isAvailable = await keyManager.isBiometricsAvailable();
    set({ isBiometricsAvailable: isAvailable });
  },

  resetSettings: async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      set(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  },
}));
