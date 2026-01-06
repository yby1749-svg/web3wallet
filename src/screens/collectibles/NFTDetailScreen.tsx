/**
 * NFT Detail Screen - Full NFT information display
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
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, NFT } from '../../types';
import { nftService } from '../../services/blockchain/NFTService';
import { CHAINS } from '../../constants/chains';

type RouteParams = RouteProp<RootStackParamList, 'NFTDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const NFTDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { nft } = route.params;

  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);

  const chainName = CHAINS[nft.chainId]?.name || `Chain ${nft.chainId}`;
  const explorerUrl = nftService.getExplorerUrl(nft);
  const openSeaUrl = nftService.getOpenSeaUrl(nft);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const handleOpenExplorer = () => {
    if (explorerUrl) {
      Linking.openURL(explorerUrl);
    }
  };

  const handleOpenOpenSea = () => {
    if (openSeaUrl) {
      Linking.openURL(openSeaUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {!hasImageError && nft.imageUrl ? (
            <>
              <Image
                source={{ uri: nft.imageUrl }}
                style={styles.image}
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => {
                  setHasImageError(true);
                  setIsImageLoading(false);
                }}
                resizeMode="contain"
              />
              {isImageLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>NFT</Text>
            </View>
          )}
        </View>

        {/* NFT Info */}
        <View style={styles.infoSection}>
          <Text style={styles.collectionName}>{nft.collectionName || 'Unknown Collection'}</Text>
          <Text style={styles.nftName}>{nft.name || `Token #${nft.tokenId}`}</Text>

          {/* Network Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{chainName}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{nft.tokenType}</Text>
            </View>
            {nft.tokenType === 'ERC1155' && nft.balance && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Owned: {nft.balance}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {nft.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.description}>{nft.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contract Address</Text>
            <TouchableOpacity onPress={handleOpenExplorer}>
              <Text style={styles.detailValueLink}>{formatAddress(nft.contractAddress)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Token ID</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {nft.tokenId.length > 20 ? `${nft.tokenId.slice(0, 20)}...` : nft.tokenId}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Token Standard</Text>
            <Text style={styles.detailValue}>{nft.tokenType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>{chainName}</Text>
          </View>
        </View>

        {/* External Links */}
        <View style={styles.linksSection}>
          {explorerUrl && (
            <TouchableOpacity style={styles.linkButton} onPress={handleOpenExplorer}>
              <Text style={styles.linkButtonText}>View on Explorer</Text>
            </TouchableOpacity>
          )}
          {openSeaUrl && (
            <TouchableOpacity style={styles.linkButton} onPress={handleOpenOpenSea}>
              <Text style={styles.linkButtonText}>View on OpenSea</Text>
            </TouchableOpacity>
          )}
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
  content: {
    paddingBottom: 32,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#000000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#8E8E93',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  collectionName: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  nftName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  detailValueLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  linksSection: {
    padding: 16,
    gap: 12,
  },
  linkButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default NFTDetailScreen;
