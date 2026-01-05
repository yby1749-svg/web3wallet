/**
 * 토큰 아이템 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Token, NativeToken } from '../types';
import { formatBalance, formatCurrency } from '../utils/format';

interface TokenItemProps {
  token: Token | NativeToken;
  onPress?: () => void;
  showBalance?: boolean;
}

export const TokenItem: React.FC<TokenItemProps> = ({
  token,
  onPress,
  showBalance = true,
}) => {
  const isNative = !('address' in token);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        {'logoURI' in token && token.logoURI ? (
          <Image source={{ uri: token.logoURI }} style={styles.icon} />
        ) : (
          <View style={[styles.icon, styles.placeholderIcon]}>
            <Text style={styles.placeholderText}>
              {token.symbol.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.symbol}>{token.symbol}</Text>
        <Text style={styles.name}>{token.name}</Text>
      </View>

      {showBalance && (
        <View style={styles.balanceContainer}>
          <Text style={styles.balance}>
            {formatBalance(token.balance || '0')} {token.symbol}
          </Text>
          {token.balanceUSD !== undefined && (
            <Text style={styles.balanceUSD}>
              {formatCurrency(token.balanceUSD)}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderIcon: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  name: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  balanceUSD: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default TokenItem;
