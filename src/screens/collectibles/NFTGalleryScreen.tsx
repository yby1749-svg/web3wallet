/**
 * NFT Gallery Screen - 2-column grid display of NFTs
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, NFT } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { NFTItem } from '../../components/NFTItem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NFTGallery'>;

export const NFTGalleryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { nfts, isLoadingNFTs, loadNFTs } = useWalletStore();

  // Refresh NFTs when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadNFTs();
    }, [loadNFTs])
  );

  const handleNFTPress = (nft: NFT) => {
    navigation.navigate('NFTDetail', { nft });
  };

  const handleRefresh = () => {
    loadNFTs();
  };

  const handleMintNFT = () => {
    navigation.navigate('MintNFT');
  };

  const renderNFT = ({ item }: { item: NFT }) => (
    <NFTItem nft={item} onPress={() => handleNFTPress(item)} />
  );

  const renderEmpty = () => {
    if (isLoadingNFTs) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Loading NFTs...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🖼️</Text>
        <Text style={styles.emptyTitle}>No NFTs Found</Text>
        <Text style={styles.emptyText}>
          Your NFT collection will appear here when you receive NFTs.
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>Collectibles</Text>
          <Text style={styles.subtitle}>
            {nfts.length} {nfts.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity style={styles.mintButton} onPress={handleMintNFT}>
          <Text style={styles.mintButtonText}>+ Mint NFT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={nfts}
        renderItem={renderNFT}
        keyExtractor={(item) => `${item.contractAddress}-${item.tokenId}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingNFTs}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mintButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mintButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NFTGalleryScreen;
