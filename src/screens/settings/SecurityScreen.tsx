/**
 * Security Settings Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { keyManager } from '../../services/wallet/KeyManager';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const SecurityScreen: React.FC = () => {
  const {
    biometricEnabled,
    isBiometricsAvailable,
    autoLockTimeout,
    enableBiometrics,
    updateSettings,
  } = useSettingsStore();

  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      setShowPinInput(true);
    } else {
      await updateSettings({ biometricEnabled: false });
    }
  };

  const handleEnableBiometrics = async () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'Please enter your 6-digit PIN');
      return;
    }

    const success = await enableBiometrics(pin);
    if (success) {
      Alert.alert('Success', 'Biometric authentication enabled');
      setShowPinInput(false);
      setPin('');
    } else {
      Alert.alert('Error', 'Incorrect PIN or failed to enable biometrics');
    }
  };

  const handleAutoLockChange = (minutes: number) => {
    updateSettings({ autoLockTimeout: minutes });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Biometrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Face ID / Touch ID</Text>
                <Text style={styles.settingSubtitle}>
                  {isBiometricsAvailable
                    ? 'Use biometrics to unlock wallet'
                    : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!isBiometricsAvailable}
              />
            </View>
          </View>
        </View>

        {showPinInput && (
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>Enter PIN to enable biometrics</Text>
            <Input
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter 6-digit PIN"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
            <Button
              title="Enable Biometrics"
              onPress={handleEnableBiometrics}
              disabled={pin.length !== 6}
            />
          </View>
        )}

        {/* Auto-lock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Lock</Text>
          <View style={styles.sectionContent}>
            {[1, 5, 15, 30].map((minutes) => (
              <View key={minutes} style={styles.settingRow}>
                <Text style={styles.settingTitle}>
                  {minutes === 1 ? '1 minute' : `${minutes} minutes`}
                </Text>
                <Switch
                  value={autoLockTimeout === minutes}
                  onValueChange={() => handleAutoLockChange(minutes)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Security Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Security Tips</Text>
          <Text style={styles.tipsText}>
            • Never share your recovery phrase{'\n'}
            • Store your recovery phrase offline{'\n'}
            • Be cautious of phishing websites{'\n'}
            • Always verify transaction details{'\n'}
            • Keep your device updated
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
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
  pinSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  tipsSection: {
    margin: 16,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 22,
  },
});

export default SecurityScreen;
