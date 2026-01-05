/**
 * Create Wallet Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { walletService } from '../../services/wallet/WalletService';
import { Button } from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateWallet'>;

export const CreateWalletScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWallet = async () => {
    setIsLoading(true);

    try {
      // 새 니모닉 생성
      const mnemonic = walletService.generateMnemonic();

      // 백업 화면으로 이동
      navigation.navigate('BackupMnemonic', { mnemonic });
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.title}>Create New Wallet</Text>
          <Text style={styles.subtitle}>
            Your new wallet will be secured with a 12-word recovery phrase
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>⚠️ Important</Text>
          <Text style={styles.infoText}>
            • You will receive a 12-word recovery phrase{'\n'}
            • Write it down and store it safely{'\n'}
            • Never share it with anyone{'\n'}
            • We cannot recover your wallet if you lose it
          </Text>
        </View>

        <View style={styles.securityBox}>
          <Text style={styles.securityTitle}>🔒 Security Reminder</Text>
          <Text style={styles.securityText}>
            Your recovery phrase is the only way to restore your wallet.
            If you lose it, you will lose access to your funds forever.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Generate Recovery Phrase"
          onPress={handleCreateWallet}
          loading={isLoading}
          size="large"
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
  content: {
    flex: 1,
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
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 22,
  },
  securityBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default CreateWalletScreen;
