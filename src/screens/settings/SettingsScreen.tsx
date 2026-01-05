/**
 * Settings Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { keyManager } from '../../services/wallet/KeyManager';
import { shortenAddress } from '../../utils/format';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <Text style={styles.settingIcon}>{icon}</Text>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.dangerText]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { activeWallet, reset } = useWalletStore();
  const { currentChain, availableChains, setChain } = useNetworkStore();

  const handleNetworkChange = () => {
    Alert.alert(
      'Select Network',
      'Choose a blockchain network',
      availableChains.map((chain) => ({
        text: chain.name,
        onPress: () => setChain(chain.chainId),
      }))
    );
  };

  const handleResetWallet = () => {
    Alert.alert(
      'Reset Wallet',
      'This will delete all wallet data from this device. Make sure you have your recovery phrase backed up.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await keyManager.clearAll();
            reset();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="👛"
              title="Active Wallet"
              subtitle={activeWallet ? shortenAddress(activeWallet.address) : 'No wallet'}
              onPress={() => {}}
            />
            <SettingItem
              icon="🔗"
              title="Network"
              subtitle={currentChain.name}
              onPress={handleNetworkChange}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔒"
              title="Security Settings"
              subtitle="PIN, Biometrics, Auto-lock"
              onPress={() => navigation.navigate('Security')}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📄"
              title="Terms & Privacy"
              subtitle="Terms of Service, Privacy Policy"
              onPress={() => navigation.navigate('Legal')}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="ℹ️"
              title="App Version"
              subtitle="1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🗑️"
              title="Reset Wallet"
              subtitle="Delete all wallet data"
              onPress={handleResetWallet}
              danger
            />
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Self-Custodial Wallet</Text>
          <Text style={styles.disclaimerText}>
            This wallet is non-custodial. We do not store, manage, or have access
            to your private keys or funds. You are solely responsible for the
            security of your wallet and recovery phrase.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  dangerTitle: {
    color: '#FF3B30',
  },
  dangerText: {
    color: '#FF3B30',
  },
  disclaimer: {
    margin: 16,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});

export default SettingsScreen;
