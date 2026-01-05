/**
 * Splash Screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useSettingsStore } from '../../stores/settingsStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { loadWallets, wallets } = useWalletStore();
  const { loadSettings, hasSetupPin } = useSettingsStore();

  useEffect(() => {
    const initialize = async () => {
      // 설정 및 지갑 로드
      await loadSettings();
      await loadWallets();

      // 2초 후 다음 화면으로 이동
      setTimeout(() => {
        if (wallets.length > 0 && hasSetupPin) {
          // 기존 지갑이 있으면 잠금 해제 화면으로
          navigation.replace('UnlockScreen');
        } else if (wallets.length > 0) {
          // 지갑은 있지만 PIN이 없으면 메인으로
          navigation.replace('Main');
        } else {
          // 새 사용자는 온보딩으로
          navigation.replace('Onboarding');
        }
      }, 2000);
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>W3</Text>
        </View>
        <Text style={styles.title}>Web3 Wallet</Text>
        <Text style={styles.subtitle}>Self-Custodial Wallet</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color="#007AFF" />
        <Text style={styles.footerText}>
          You control your private keys
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 16,
  },
});

export default SplashScreen;
