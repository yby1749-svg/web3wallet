/**
 * Session Approval Screen - Approve/Reject WalletConnect Session
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletConnectStore } from '../../stores/walletConnectStore';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { Button } from '../../components/Button';
import { CHAINS } from '../../constants/chains';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionApproval'>;

export const SessionApprovalScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  const { pendingProposal, approveSession, rejectSession, clearPendingProposal } =
    useWalletConnectStore();
  const { activeWallet } = useWalletStore();
  const { availableChains } = useNetworkStore();

  // If no pending proposal, go back
  React.useEffect(() => {
    if (!pendingProposal) {
      navigation.goBack();
    }
  }, [pendingProposal, navigation]);

  if (!pendingProposal || !activeWallet) {
    return null;
  }

  const proposer = pendingProposal.params.proposer;
  const metadata = proposer.metadata;

  // Extract requested chains
  const requestedChains =
    pendingProposal.params.requiredNamespaces?.eip155?.chains || [];
  const optionalChains =
    pendingProposal.params.optionalNamespaces?.eip155?.chains || [];
  const allRequestedChains = [...new Set([...requestedChains, ...optionalChains])];

  // Get chain names
  const getChainName = (chainString: string) => {
    const chainId = parseInt(chainString.split(':')[1], 10);
    return CHAINS[chainId]?.name || `Chain ${chainId}`;
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveSession(pendingProposal.id, activeWallet.address);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve connection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectSession(pendingProposal.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    clearPendingProposal();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Connection Request</Text>
          <Text style={styles.subtitle}>
            A dApp wants to connect to your wallet
          </Text>
        </View>

        {/* dApp Info */}
        <View style={styles.dappCard}>
          <View style={styles.dappIcon}>
            {metadata.icons?.[0] ? (
              <Image
                source={{ uri: metadata.icons[0] }}
                style={styles.dappImage}
              />
            ) : (
              <Text style={styles.dappIconText}>
                {metadata.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.dappName}>{metadata.name}</Text>
          <Text style={styles.dappUrl}>{metadata.url}</Text>
          {metadata.description && (
            <Text style={styles.dappDescription}>{metadata.description}</Text>
          )}
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERMISSIONS REQUESTED</Text>
          <View style={styles.permissionCard}>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>👁</Text>
              <Text style={styles.permissionText}>View your wallet address</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>✍️</Text>
              <Text style={styles.permissionText}>Request signatures</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>📤</Text>
              <Text style={styles.permissionText}>Request transactions</Text>
            </View>
          </View>
        </View>

        {/* Networks */}
        {allRequestedChains.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NETWORKS</Text>
            <View style={styles.chainsCard}>
              {allRequestedChains.map((chain) => (
                <View key={chain} style={styles.chainBadge}>
                  <Text style={styles.chainText}>{getChainName(chain)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Your Wallet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR WALLET</Text>
          <View style={styles.walletCard}>
            <Text style={styles.walletAddress}>
              {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
            </Text>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Only connect to sites you trust. This app will be able to request signatures and transactions.
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
          title="Approve"
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
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  dappIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dappImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  dappIconText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dappName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  dappUrl: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  dappDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 8,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  permissionText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  chainsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chainBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  chainText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  walletAddress: {
    fontSize: 15,
    fontFamily: 'Courier',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
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
});

export default SessionApprovalScreen;
