/**
 * Home Screen - 메인 지갑 화면
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { Button } from '../../components/Button';
import { TokenItem } from '../../components/TokenItem';
import { formatCurrency, shortenAddress } from '../../utils/format';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    activeWallet,
    nativeBalance,
    tokens,
    totalValueUSD,
    isLoading,
    refreshBalance,
  } = useWalletStore();
  const { currentChain } = useNetworkStore();

  useEffect(() => {
    if (activeWallet) {
      refreshBalance();
    }
  }, [activeWallet]);

  const onRefresh = useCallback(() => {
    refreshBalance();
  }, []);

  if (!activeWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No wallet found</Text>
          <Button
            title="Create Wallet"
            onPress={() => navigation.navigate('WalletSetup')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.networkBadge}>
            <Text style={styles.networkText}>{currentChain.name}</Text>
          </View>
          <TouchableOpacity style={styles.addressContainer}>
            <Text style={styles.address}>
              {shortenAddress(activeWallet.address)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(totalValueUSD)}
          </Text>
          <Text style={styles.balanceSubtext}>
            ≈ {nativeBalance?.balance || '0'} {currentChain.symbol}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Send', {})}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>↑</Text>
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Receive')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>↓</Text>
            </View>
            <Text style={styles.actionLabel}>Receive</Text>
          </TouchableOpacity>
        </View>

        {/* Assets */}
        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Assets</Text>

          {/* Native Token */}
          {nativeBalance && (
            <TokenItem
              token={nativeBalance}
              onPress={() => {}}
            />
          )}

          {/* ERC20 Tokens */}
          {tokens.map((token, index) => (
            <TokenItem
              key={token.address || index}
              token={token}
              onPress={() => {}}
            />
          ))}

          {tokens.length === 0 && !isLoading && (
            <View style={styles.noTokens}>
              <Text style={styles.noTokensText}>
                No tokens found
              </Text>
            </View>
          )}
        </View>

        {/* Legal Notice */}
        <View style={styles.legalNotice}>
          <Text style={styles.legalText}>
            This is a self-custodial wallet.{'\n'}
            We do not store or control your funds.
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  networkBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  address: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 32,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  actionLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  assetsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  noTokens: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noTokensText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 24,
  },
  legalNotice: {
    marginTop: 32,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
  },
  legalText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default HomeScreen;
