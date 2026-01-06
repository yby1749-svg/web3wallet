/**
 * NFT Item Component - Grid card for NFT display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { NFT } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - 48 - ITEM_MARGIN) / 2; // 2 columns with padding

interface NFTItemProps {
  nft: NFT;
  onPress?: () => void;
}

export const NFTItem: React.FC<NFTItemProps> = ({ nft, onPress }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {!hasError && nft.imageUrl ? (
          <>
            <Image
              source={{ uri: nft.imageUrl }}
              style={styles.image}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              resizeMode="cover"
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#007AFF" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>NFT</Text>
          </View>
        )}

        {/* ERC1155 balance badge */}
        {nft.tokenType === 'ERC1155' && nft.balance && parseInt(nft.balance, 10) > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>x{nft.balance}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.collectionName} numberOfLines={1}>
          {nft.collectionName || 'Unknown'}
        </Text>
        <Text style={styles.nftName} numberOfLines={1}>
          {nft.name || `#${nft.tokenId}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242, 242, 247, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E5EA',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  info: {
    padding: 12,
  },
  collectionName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default NFTItem;
