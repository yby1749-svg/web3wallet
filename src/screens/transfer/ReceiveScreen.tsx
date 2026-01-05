/**
 * Receive Screen - 토큰 수신
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { shortenAddress } from '../../utils/format';
import { Button } from '../../components/Button';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';

export const ReceiveScreen: React.FC = () => {
  const { activeWallet } = useWalletStore();
  const { currentChain } = useNetworkStore();

  const address = activeWallet?.address || '';

  const handleCopyAddress = () => {
    Clipboard.setString(address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: address,
        title: 'My Wallet Address',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Receive {currentChain.symbol}</Text>
          <Text style={styles.subtitle}>
            Scan QR code or copy address to receive funds
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={address}
              size={200}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>
        </View>

        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>{currentChain.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.addressContainer}
          onPress={handleCopyAddress}
          activeOpacity={0.7}
        >
          <Text style={styles.addressLabel}>Your Address</Text>
          <Text style={styles.address}>{address}</Text>
          <Text style={styles.tapToCopy}>Tap to copy</Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Important</Text>
          <Text style={styles.warningText}>
            Only send {currentChain.symbol} and tokens on {currentChain.name} to this address.
            Sending other assets may result in permanent loss.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Copy Address"
          onPress={handleCopyAddress}
          style={styles.copyButton}
        />
        <Button
          title="Share"
          onPress={handleShare}
          variant="outline"
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
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  networkBadge: {
    alignSelf: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  tapToCopy: {
    fontSize: 12,
    color: '#007AFF',
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  copyButton: {
    marginBottom: 8,
  },
});

export default ReceiveScreen;
