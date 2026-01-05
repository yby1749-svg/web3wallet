/**
 * Import Wallet Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { walletService } from '../../services/wallet/WalletService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ImportWallet'>;

export const ImportWalletScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [mnemonic, setMnemonic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setError('');

    // 유효성 검사
    if (!mnemonic.trim()) {
      setError('Please enter your recovery phrase');
      return;
    }

    if (!walletService.validateMnemonic(mnemonic)) {
      setError('Invalid recovery phrase. Please check and try again.');
      return;
    }

    // PIN 설정 화면으로 이동
    navigation.navigate('SetupPin', {
      isNewWallet: false,
      mnemonic: mnemonic.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.icon}>📥</Text>
          <Text style={styles.title}>Import Wallet</Text>
          <Text style={styles.subtitle}>
            Enter your 12 or 24-word recovery phrase
          </Text>
        </View>

        <Input
          label="Recovery Phrase"
          value={mnemonic}
          onChangeText={setMnemonic}
          placeholder="Enter your recovery phrase..."
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          error={error}
        />

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <Text style={styles.tipsText}>
            • Enter words separated by spaces{'\n'}
            • Make sure to enter words in correct order{'\n'}
            • Check for typos
          </Text>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your recovery phrase is never sent to our servers.
            All data is stored locally on your device.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Import Wallet"
          onPress={handleImport}
          loading={isLoading}
          size="large"
          disabled={!mnemonic.trim()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
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
    textAlign: 'center',
  },
  tips: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
  },
  securityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default ImportWalletScreen;
