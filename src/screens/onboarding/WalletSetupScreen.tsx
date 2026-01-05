/**
 * Wallet Setup Screen - 지갑 생성/복구 선택
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Button } from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'WalletSetup'>;

export const WalletSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💼</Text>
          </View>
          <Text style={styles.title}>Set Up Your Wallet</Text>
          <Text style={styles.subtitle}>
            Create a new wallet or import an existing one
          </Text>
        </View>

        <View style={styles.options}>
          <View style={styles.optionCard}>
            <Text style={styles.optionIcon}>✨</Text>
            <Text style={styles.optionTitle}>Create New Wallet</Text>
            <Text style={styles.optionDescription}>
              Generate a new wallet with a secure recovery phrase
            </Text>
            <Button
              title="Create Wallet"
              onPress={() => navigation.navigate('CreateWallet')}
              style={styles.optionButton}
            />
          </View>

          <View style={styles.optionCard}>
            <Text style={styles.optionIcon}>📥</Text>
            <Text style={styles.optionTitle}>Import Wallet</Text>
            <Text style={styles.optionDescription}>
              Restore your wallet using a recovery phrase
            </Text>
            <Button
              title="Import Wallet"
              onPress={() => navigation.navigate('ImportWallet')}
              variant="outline"
              style={styles.optionButton}
            />
          </View>
        </View>
      </View>

      <Text style={styles.securityNote}>
        🔒 Your keys are stored locally on this device only.{'\n'}
        We never have access to your funds.
      </Text>
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
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
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
  options: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionButton: {
    marginTop: 8,
  },
  securityNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    lineHeight: 18,
  },
});

export default WalletSetupScreen;
