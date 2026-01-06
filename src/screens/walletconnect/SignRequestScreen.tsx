/**
 * Sign Request Screen - Handle WalletConnect Signing Requests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletConnectStore } from '../../stores/walletConnectStore';
import { useWalletStore } from '../../stores/walletStore';
import { Button } from '../../components/Button';
import { CHAINS } from '../../constants/chains';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignRequest'>;

export const SignRequestScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [error, setError] = useState('');

  const { pendingRequest, formattedRequest, approveRequest, rejectRequest, clearPendingRequest } =
    useWalletConnectStore();
  const { activeWallet } = useWalletStore();

  // If no pending request, go back
  React.useEffect(() => {
    if (!pendingRequest) {
      navigation.goBack();
    }
  }, [pendingRequest, navigation]);

  if (!pendingRequest || !formattedRequest || !activeWallet) {
    return null;
  }

  const chainName = CHAINS[pendingRequest.chainId]?.name || `Chain ${pendingRequest.chainId}`;

  const handleApprove = () => {
    setShowPinEntry(true);
    setError('');
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 6) {
        submitWithPin(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const submitWithPin = async (enteredPin: string) => {
    setIsLoading(true);
    try {
      await approveRequest(activeWallet.address, enteredPin);
      navigation.goBack();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign';
      if (message.includes('Invalid PIN')) {
        setError('Incorrect PIN');
        setPin('');
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectRequest();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    clearPendingRequest();
    navigation.goBack();
  };

  const getRequestTitle = () => {
    switch (pendingRequest.method) {
      case 'personal_sign':
      case 'eth_sign':
        return 'Sign Message';
      case 'eth_signTransaction':
        return 'Sign Transaction';
      case 'eth_sendTransaction':
        return 'Send Transaction';
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        return 'Sign Typed Data';
      default:
        return 'Sign Request';
    }
  };

  const renderRequestContent = () => {
    if (formattedRequest.type === 'message') {
      return (
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>Message</Text>
          <ScrollView style={styles.messageScroll}>
            <Text style={styles.messageText}>{formattedRequest.message}</Text>
          </ScrollView>
        </View>
      );
    }

    if (formattedRequest.type === 'transaction') {
      const tx = formattedRequest.transaction!;
      return (
        <View style={styles.transactionCard}>
          <View style={styles.txRow}>
            <Text style={styles.txLabel}>To</Text>
            <Text style={styles.txValue} numberOfLines={1}>
              {tx.to ? `${tx.to.slice(0, 10)}...${tx.to.slice(-8)}` : 'Contract Creation'}
            </Text>
          </View>
          <View style={styles.txRow}>
            <Text style={styles.txLabel}>Value</Text>
            <Text style={styles.txValue}>{tx.value} ETH</Text>
          </View>
          {tx.data && tx.data !== '0x' && (
            <View style={styles.txRow}>
              <Text style={styles.txLabel}>Data</Text>
              <Text style={styles.txValue} numberOfLines={1}>
                {tx.data.slice(0, 20)}...
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (formattedRequest.type === 'typedData') {
      const typedData = formattedRequest.typedData!;
      return (
        <View style={styles.typedDataCard}>
          <Text style={styles.messageLabel}>Typed Data</Text>
          <ScrollView style={styles.messageScroll}>
            <Text style={styles.typedDataText}>
              {JSON.stringify(typedData.message, null, 2)}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return null;
  };

  const renderPinDots = () => (
    <View style={styles.pinDots}>
      {[...Array(6)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.pinDot,
            index < pin.length && styles.pinDotFilled,
            error ? styles.pinDotError : undefined,
          ]}
        />
      ))}
    </View>
  );

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
                  handlePinDelete();
                } else {
                  handlePinInput(key);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.keyText}>{key === 'del' ? '⌫' : key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (showPinEntry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pinContainer}>
          <View style={styles.pinHeader}>
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Text style={styles.pinSubtitle}>Enter your PIN to sign this request</Text>
          </View>

          {renderPinDots()}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {renderKeypad()}

          <Button
            title="Cancel"
            onPress={() => {
              setShowPinEntry(false);
              setPin('');
              setError('');
            }}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getRequestTitle()}</Text>
          <Text style={styles.subtitle}>
            Review and sign this request
          </Text>
        </View>

        {/* dApp Info */}
        <View style={styles.dappCard}>
          <View style={styles.dappIcon}>
            {pendingRequest.peerMetadata.icons?.[0] ? (
              <Image
                source={{ uri: pendingRequest.peerMetadata.icons[0] }}
                style={styles.dappImage}
              />
            ) : (
              <Text style={styles.dappIconText}>
                {pendingRequest.peerMetadata.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.dappName}>{pendingRequest.peerMetadata.name}</Text>
          <Text style={styles.dappUrl}>{pendingRequest.peerMetadata.url}</Text>
        </View>

        {/* Network */}
        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>{chainName}</Text>
        </View>

        {/* Request Content */}
        {renderRequestContent()}

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Make sure you trust this site. Signing malicious requests can result in loss of funds.
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Reject"
          onPress={handleReject}
          variant="outline"
          disabled={isLoading}
          style={styles.rejectButton}
        />
        <Button
          title="Sign"
          onPress={handleApprove}
          variant="primary"
          loading={isLoading}
          style={styles.approveButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  dappCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  dappIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dappImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  dappIconText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dappName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  dappUrl: {
    fontSize: 13,
    color: '#007AFF',
  },
  networkBadge: {
    alignSelf: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  networkText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  messageScroll: {
    maxHeight: 200,
  },
  messageText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  txLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  txValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  typedDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  typedDataText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontFamily: 'Courier',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  rejectButton: {
    flex: 1,
    marginRight: 8,
  },
  approveButton: {
    flex: 1,
    marginLeft: 8,
  },
  // PIN Entry styles
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  pinHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pinTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  pinSubtitle: {
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
  },
  errorText: {
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
  cancelButton: {
    marginTop: 24,
  },
});

export default SignRequestScreen;
