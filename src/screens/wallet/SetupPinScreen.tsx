/**
 * Setup PIN Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { walletService } from '../../services/wallet/WalletService';
import { useWalletStore } from '../../stores/walletStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SetupPin'>;
type RouteProps = RouteProp<RootStackParamList, 'SetupPin'>;

export const SetupPinScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { isNewWallet, mnemonic } = route.params;

  const { createWallet, importWallet, setUnlocked } = useWalletStore();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinInput = (digit: string) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    if (currentPin.length < 6) {
      const newPin = currentPin + digit;

      if (step === 'create') {
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep('confirm'), 300);
        }
      } else {
        setConfirmPin(newPin);
        if (newPin.length === 6) {
          verifyAndCreate(pin, newPin);
        }
      }
      setError('');
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const verifyAndCreate = async (firstPin: string, secondPin: string) => {
    if (firstPin !== secondPin) {
      setError('PINs do not match');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);

    try {
      let success = false;

      if (isNewWallet && mnemonic) {
        // 새 지갑 생성 (니모닉으로부터)
        success = await importWallet(mnemonic, firstPin);
      } else if (mnemonic) {
        // 기존 지갑 복구
        success = await importWallet(mnemonic, firstPin);
      }

      if (success) {
        setUnlocked(true);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('Error', 'Failed to create wallet. Please try again.');
        setPin('');
        setConfirmPin('');
        setStep('create');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPinDots = () => {
    const currentPin = step === 'create' ? pin : confirmPin;

    return (
      <View style={styles.pinDots}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < currentPin.length && styles.pinDotFilled,
              !!error && styles.pinDotError,
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
              disabled={isLoading}
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
            <Text style={styles.icon}>🔒</Text>
          </View>
          <Text style={styles.title}>
            {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'create'
              ? 'Create a 6-digit PIN to secure your wallet'
              : 'Enter your PIN again to confirm'}
          </Text>
        </View>

        {renderPinDots()}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {renderKeypad()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your PIN is stored securely on this device
        </Text>
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
    textAlign: 'center',
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default SetupPinScreen;
