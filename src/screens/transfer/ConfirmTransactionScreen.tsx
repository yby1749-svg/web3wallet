/**
 * Confirm Transaction Screen - 트랜잭션 확인 및 서명
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { walletService } from '../../services/wallet/WalletService';
import { transactionService } from '../../services/wallet/TransactionService';
import { keyManager } from '../../services/wallet/KeyManager';
import { shortenAddress, formatCurrency } from '../../utils/format';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmTransaction'>;
type RouteProps = RouteProp<RootStackParamList, 'ConfirmTransaction'>;

export const ConfirmTransactionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { transaction, token } = route.params;

  const { activeWallet, refreshBalance } = useWalletStore();
  const { currentChain } = useNetworkStore();

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!pin || pin.length !== 6) {
      setError('Please enter your 6-digit PIN');
      return;
    }

    if (!activeWallet) {
      Alert.alert('Error', 'No wallet found');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // PIN 검증
      const isValidPin = await keyManager.verifyPin(pin);
      if (!isValidPin) {
        setError('Incorrect PIN');
        setIsLoading(false);
        return;
      }

      // 프라이빗 키 복구
      const privateKey = await keyManager.retrievePrivateKey(activeWallet.address, pin);
      if (!privateKey) {
        Alert.alert('Error', 'Failed to retrieve private key');
        setIsLoading(false);
        return;
      }

      // 트랜잭션 빌드
      const tx = await transactionService.buildNativeTransfer(
        transaction.to,
        transaction.value,
        transaction.gasPrice
      );

      // 트랜잭션 서명 및 전송
      const txHash = await transactionService.signAndSend(privateKey, tx);

      Alert.alert(
        'Transaction Sent',
        `Transaction submitted successfully!\n\nHash: ${shortenAddress(txHash, 8)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              refreshBalance();
              navigation.navigate('Main');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Transaction</Text>
          <Text style={styles.subtitle}>
            Review the details and enter your PIN to confirm
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>{currentChain.name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From</Text>
            <Text style={styles.detailValue}>
              {shortenAddress(activeWallet?.address || '')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To</Text>
            <Text style={styles.detailValue}>
              {shortenAddress(transaction.to)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValueLarge}>
              {transaction.value} {token?.symbol || currentChain.symbol}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network Fee</Text>
            <Text style={styles.detailValue}>
              ~{transaction.gasPrice} Gwei
            </Text>
          </View>
        </View>

        <View style={styles.pinSection}>
          <Text style={styles.pinLabel}>Enter PIN to Confirm</Text>
          <Input
            value={pin}
            onChangeText={(text) => {
              setPin(text.replace(/[^0-9]/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="******"
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            error={error}
          />
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Final Confirmation</Text>
          <Text style={styles.warningText}>
            This transaction cannot be reversed once submitted.
            Please verify all details before confirming.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title="Confirm & Send"
          onPress={handleConfirm}
          loading={isLoading}
          disabled={pin.length !== 6}
          style={styles.confirmButton}
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
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailsCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  detailValueLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  pinSection: {
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});

export default ConfirmTransactionScreen;
