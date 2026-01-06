/**
 * Send Screen - 토큰 전송
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GasFee } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { transactionService } from '../../services/wallet/TransactionService';
import { isValidAddress, isValidAmount, hasEnoughBalance } from '../../utils/validation';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { GasFeeSelector } from '../../components/GasFeeSelector';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Send'>;
type RouteProps = RouteProp<RootStackParamList, 'Send'>;

export const SendScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { token, scannedAddress } = route.params || {};

  const { activeWallet, nativeBalance } = useWalletStore();
  const { currentChain } = useNetworkStore();

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [gasFees, setGasFees] = useState<GasFee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ address?: string; amount?: string }>({});

  useEffect(() => {
    loadGasFees();
  }, []);

  // Handle scanned address from QR scanner
  useEffect(() => {
    if (scannedAddress) {
      setToAddress(scannedAddress);
      setErrors((prev) => ({ ...prev, address: undefined }));
    }
  }, [scannedAddress]);

  const loadGasFees = async () => {
    try {
      const fees = await transactionService.getSpeedOptions();
      setGasFees(fees);
    } catch (error) {
      console.error('Failed to load gas fees:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: { address?: string; amount?: string } = {};

    if (!toAddress) {
      newErrors.address = 'Address is required';
    } else if (!isValidAddress(toAddress)) {
      newErrors.address = 'Invalid address';
    }

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidAmount(amount)) {
      newErrors.amount = 'Invalid amount';
    } else if (nativeBalance && !hasEnoughBalance(nativeBalance.balance || '0', amount)) {
      newErrors.amount = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReview = () => {
    if (!validate() || !gasFees) return;

    navigation.navigate('ConfirmTransaction', {
      transaction: {
        to: toAddress,
        value: amount,
        gasPrice: gasFees[selectedSpeed].gasPrice,
      },
      token,
    });
  };

  const handleMaxAmount = () => {
    if (nativeBalance?.balance) {
      // Reserve some for gas
      const max = Math.max(0, parseFloat(nativeBalance.balance) - 0.01);
      setAmount(max.toString());
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner', {
      onScan: (address: string) => {
        setToAddress(address);
        setErrors((prev) => ({ ...prev, address: undefined }));
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send {token?.symbol || currentChain.symbol}</Text>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance:</Text>
            <Text style={styles.balanceValue}>
              {token?.balance || nativeBalance?.balance || '0'} {token?.symbol || currentChain.symbol}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.addressInputContainer}>
            <View style={styles.addressInputWrapper}>
              <Input
                label="To Address"
                value={toAddress}
                onChangeText={(text) => {
                  setToAddress(text);
                  setErrors({ ...errors, address: undefined });
                }}
                placeholder="0x..."
                autoCapitalize="none"
                error={errors.address}
              />
            </View>
            <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
              <Text style={styles.qrButtonText}>📷</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Amount"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setErrors({ ...errors, amount: undefined });
            }}
            placeholder="0.0"
            keyboardType="decimal-pad"
            error={errors.amount}
            rightIcon={<Text style={styles.maxButton}>MAX</Text>}
            onRightIconPress={handleMaxAmount}
          />
        </View>

        {gasFees && (
          <View style={styles.section}>
            <GasFeeSelector
              gasFees={gasFees}
              selectedSpeed={selectedSpeed}
              onSelect={setSelectedSpeed}
            />
          </View>
        )}

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Double Check</Text>
          <Text style={styles.warningText}>
            Transactions cannot be reversed. Make sure the address is correct.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Review Transaction"
          onPress={handleReview}
          loading={isLoading}
          size="large"
          disabled={!toAddress || !amount}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  maxButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInputWrapper: {
    flex: 1,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 24,
  },
  qrButtonText: {
    fontSize: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});

export default SendScreen;
