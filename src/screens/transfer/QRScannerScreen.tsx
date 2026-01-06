/**
 * QR Scanner Screen
 *
 * 주소 QR 코드를 스캔하는 화면
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { RootStackParamList } from '../../types';
import { ethers } from 'ethers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>;
type RouteProps = RouteProp<RootStackParamList, 'QRScanner'>;

export default function QRScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { onScan } = route.params || {};

  const [hasScanned, setHasScanned] = useState(false);

  const parseQRData = (data: string): string | null => {
    const trimmedData = data.trim();

    // Handle ethereum: URI scheme (EIP-681)
    // Format: ethereum:0x...?value=...&gas=...
    if (trimmedData.startsWith('ethereum:')) {
      const addressPart = trimmedData.replace('ethereum:', '').split('?')[0].split('@')[0];
      if (ethers.isAddress(addressPart)) {
        return addressPart;
      }
    }

    // Handle plain Ethereum address
    if (ethers.isAddress(trimmedData)) {
      return trimmedData;
    }

    return null;
  };

  const handleScan = (e: { data: string }) => {
    if (hasScanned) return;

    const scannedData = e.data;
    const address = parseQRData(scannedData);

    if (address) {
      setHasScanned(true);

      // Call the callback if provided
      if (onScan) {
        onScan(address);
      }

      // Navigate back to Send screen with the scanned address
      navigation.navigate('Send', { scannedAddress: address });
    } else {
      Alert.alert(
        'Invalid QR Code',
        'The scanned QR code does not contain a valid Ethereum address.',
        [
          {
            text: 'Try Again',
            onPress: () => setHasScanned(false),
          },
        ]
      );
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <QRCodeScanner
          onRead={handleScan}
          flashMode={RNCamera.Constants.FlashMode.auto}
          cameraStyle={styles.camera}
          showMarker={true}
          markerStyle={styles.marker}
          containerStyle={styles.qrContainer}
          cameraContainerStyle={styles.cameraContainer}
          notAuthorizedView={
            <View style={styles.notAuthorized}>
              <Text style={styles.notAuthorizedTitle}>Camera Access Required</Text>
              <Text style={styles.notAuthorizedText}>
                Please allow camera access to scan QR codes.
              </Text>
              <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.instructions}>
              Point your camera at a QR code containing an Ethereum address
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const SCAN_AREA_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 60,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  qrContainer: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  marker: {
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 32,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#007AFF',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  notAuthorized: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  notAuthorizedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  notAuthorizedText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
