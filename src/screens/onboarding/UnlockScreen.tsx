/**
 * Unlock Screen - PIN/생체 인증으로 잠금 해제
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { keyManager } from '../../services/wallet/KeyManager';
import { useWalletStore } from '../../stores/walletStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UnlockScreen'>;

export const UnlockScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setUnlocked } = useWalletStore();
  const { biometricEnabled, isBiometricsAvailable } = useSettingsStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // 생체 인증이 활성화되어 있으면 자동 시도
    if (biometricEnabled && isBiometricsAvailable) {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    const success = await keyManager.authenticateWithBiometrics();
    if (success) {
      setUnlocked(true);
      navigation.replace('Main');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = async (inputPin: string) => {
    const isValid = await keyManager.verifyPin(inputPin);

    if (isValid) {
      setUnlocked(true);
      navigation.replace('Main');
    } else {
      setPin('');
      setAttempts(attempts + 1);
      setError('Incorrect PIN');

      if (attempts >= 4) {
        Alert.alert(
          'Too Many Attempts',
          'Please wait a moment before trying again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDots}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled,
              error && styles.pinDotError,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

    return (
      <View style={styles.keypad}>
        {keys.map((key, index) => {
          if (key === '') {
            return <View key={index} style={styles.keyEmpty} />;
          }

          return (
            <TouchableOpacity
              key={index}
              style={styles.key}
              onPress={() => {
                if (key === 'del') {
                  handleDelete();
                } else {
                  handlePinInput(key);
                }
              }}
            >
              <Text style={styles.keyText}>
                {key === 'del' ? '⌫' : key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔐</Text>
          </View>
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>
            Enter your 6-digit PIN to unlock
          </Text>
        </View>

        {renderPinDots()}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {renderKeypad()}

        {biometricEnabled && isBiometricsAvailable && (
          <Button
            title="Use Biometrics"
            onPress={handleBiometricAuth}
            variant="outline"
            style={styles.biometricButton}
          />
        )}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
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
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pinDotError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B30',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
  },
  key: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  keyEmpty: {
    width: 75,
    height: 75,
    margin: 8,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  biometricButton: {
    marginTop: 24,
  },
});

export default UnlockScreen;
