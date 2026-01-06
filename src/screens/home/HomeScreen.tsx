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
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, NFT } from '../../types';
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
    customTokens,
    nfts,
    totalValueUSD,
    isLoading,
    refreshBalance,
    loadCustomTokens,
  } = useWalletStore();
  const { currentChain } = useNetworkStore();

  useEffect(() => {
    loadCustomTokens();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeWallet) {
        refreshBalance();
      }
    }, [activeWallet])
  );

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

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Assets */}
        <View style={styles.assetsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assets</Text>
            <TouchableOpacity
              style={styles.addTokenButton}
              onPress={() => navigation.navigate('AddToken')}
            >
              <Text style={styles.addTokenButtonText}>+ Add Token</Text>
            </TouchableOpacity>
          </View>

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

          {/* Custom Tokens */}
          {customTokens.map((token, index) => (
            <TokenItem
              key={`custom-${token.address || index}`}
              token={token}
              onPress={() => {}}
            />
          ))}

          {tokens.length === 0 && customTokens.length === 0 && !isLoading && (
            <View style={styles.noTokens}>
              <Text style={styles.noTokensText}>
                No tokens found
              </Text>
            </View>
          )}
        </View>

        {/* NFTs Section */}
        <View style={styles.nftsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NFTs</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('NFTGallery')}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>

          {nfts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nftScrollContent}
            >
              {nfts.slice(0, 5).map((nft) => (
                <TouchableOpacity
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  style={styles.nftPreviewItem}
                  onPress={() => navigation.navigate('NFTDetail', { nft })}
                >
                  {nft.imageUrl ? (
                    <Image
                      source={{ uri: nft.imageUrl }}
                      style={styles.nftPreviewImage}
                    />
                  ) : (
                    <View style={styles.nftPreviewPlaceholder}>
                      <Text style={styles.nftPreviewPlaceholderText}>NFT</Text>
                    </View>
                  )}
                  <Text style={styles.nftPreviewName} numberOfLines={1}>
                    {nft.name || `#${nft.tokenId}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noNfts}>
              <Text style={styles.noNftsText}>No NFTs found</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addTokenButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addTokenButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
  nftsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  nftScrollContent: {
    paddingRight: 16,
  },
  nftPreviewItem: {
    width: 100,
    marginRight: 12,
  },
  nftPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  nftPreviewPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nftPreviewPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  nftPreviewName: {
    fontSize: 12,
    color: '#1C1C1E',
    marginTop: 6,
    textAlign: 'center',
  },
  noNfts: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noNftsText: {
    fontSize: 14,
    color: '#8E8E93',
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
