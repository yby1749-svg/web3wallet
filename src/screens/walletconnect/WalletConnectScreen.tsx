/**
 * WalletConnect Screen - Main WC Management
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletConnectStore } from '../../stores/walletConnectStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { WCSession } from '../../types/walletconnect';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'WalletConnect'>;

export const WalletConnectScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [uri, setUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    sessions,
    isConnecting,
    pair,
    disconnectSession,
    refreshSessions,
    error,
    clearError,
  } = useWalletConnectStore();

  // Refresh sessions when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshSessions();
    }, [refreshSessions])
  );

  // Handle QR scan
  const handleScanQR = () => {
    navigation.navigate('QRScanner', {
      onScan: (scannedUri: string) => {
        if (scannedUri.startsWith('wc:')) {
          handleConnect(scannedUri);
        } else {
          Alert.alert('Invalid QR Code', 'This is not a valid WalletConnect QR code.');
        }
      },
    });
  };

  // Handle URI connect
  const handleConnect = async (connectUri?: string) => {
    const uriToConnect = connectUri || uri.trim();

    if (!uriToConnect) {
      Alert.alert('Error', 'Please enter a WalletConnect URI or scan a QR code.');
      return;
    }

    if (!uriToConnect.startsWith('wc:')) {
      Alert.alert('Invalid URI', 'Please enter a valid WalletConnect URI starting with "wc:"');
      return;
    }

    setIsLoading(true);
    try {
      await pair(uriToConnect);
      setUri('');
    } catch (err) {
      Alert.alert('Connection Failed', 'Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = (session: WCSession) => {
    Alert.alert(
      'Disconnect',
      `Are you sure you want to disconnect from ${session.peerMetadata.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectSession(session.topic);
            } catch (err) {
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Show error if any
  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const renderSessionItem = (session: WCSession) => (
    <TouchableOpacity
      key={session.topic}
      style={styles.sessionItem}
      onPress={() => handleDisconnect(session)}
    >
      <View style={styles.sessionIcon}>
        {session.peerMetadata.icons?.[0] ? (
          <Image
            source={{ uri: session.peerMetadata.icons[0] }}
            style={styles.sessionImage}
          />
        ) : (
          <Text style={styles.sessionIconText}>
            {session.peerMetadata.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionName}>{session.peerMetadata.name}</Text>
        <Text style={styles.sessionUrl} numberOfLines={1}>
          {session.peerMetadata.url}
        </Text>
      </View>
      <Text style={styles.sessionStatus}>Connected</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Connect Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONNECT TO DAPP</Text>
          <View style={styles.card}>
            <Button
              title="Scan QR Code"
              onPress={handleScanQR}
              variant="primary"
              disabled={isConnecting || isLoading}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Input
              label="WalletConnect URI"
              value={uri}
              onChangeText={setUri}
              placeholder="wc:..."
              autoCapitalize="none"
            />

            <Button
              title="Connect"
              onPress={() => handleConnect()}
              variant="secondary"
              loading={isLoading || isConnecting}
              disabled={!uri.trim() || isConnecting || isLoading}
              style={styles.connectButton}
            />
          </View>
        </View>

        {/* Active Sessions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONNECTED APPS ({sessions.length})</Text>
          <View style={styles.card}>
            {sessions.length === 0 ? (
              <Text style={styles.emptyText}>No connected apps</Text>
            ) : (
              sessions.map(renderSessionItem)
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            WalletConnect allows you to connect your wallet to decentralized applications (dApps) securely.
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    color: '#8E8E93',
    fontSize: 12,
    marginHorizontal: 12,
  },
  connectButton: {
    marginTop: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sessionIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sessionUrl: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  sessionStatus: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 15,
    paddingVertical: 20,
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WalletConnectScreen;
