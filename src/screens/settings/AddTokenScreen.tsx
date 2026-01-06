/**
 * Add Token Screen
 *
 * 커스텀 ERC20 토큰을 추가하는 화면
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ethers } from 'ethers';
import { Token } from '../../types';
import { tokenService } from '../../services/blockchain/TokenService';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';

export default function AddTokenScreen() {
  const navigation = useNavigation();
  const { addCustomToken, activeWallet } = useWalletStore();
  const { currentChain } = useNetworkStore();

  const [contractAddress, setContractAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const isValidAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  const searchToken = async () => {
    if (!contractAddress.trim()) {
      Alert.alert('Error', 'Please enter a contract address');
      return;
    }

    if (!isValidAddress(contractAddress)) {
      Alert.alert('Error', 'Invalid contract address format');
      return;
    }

    setSearching(true);
    setTokenInfo(null);

    try {
      const info = await tokenService.getTokenInfo(contractAddress);

      // 잔액도 가져오기
      if (activeWallet) {
        const balance = await tokenService.getTokenBalance(
          activeWallet.address,
          contractAddress
        );
        info.balance = balance;
      }

      setTokenInfo(info);
    } catch (error) {
      console.error('Failed to fetch token info:', error);
      Alert.alert(
        'Token Not Found',
        'Could not find a valid ERC20 token at this address. Please check the address and network.'
      );
    } finally {
      setSearching(false);
    }
  };

  const handleAddToken = async () => {
    if (!tokenInfo) return;

    setLoading(true);

    try {
      const success = await addCustomToken(tokenInfo);

      if (success) {
        Alert.alert('Success', `${tokenInfo.symbol} has been added to your wallet`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Token already exists in your wallet');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Token</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Network Badge */}
          <View style={styles.networkBadge}>
            <Text style={styles.networkText}>{currentChain.name}</Text>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Enter the contract address of the ERC20 token you want to add.
              Make sure you're on the correct network.
            </Text>
          </View>

          {/* Contract Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Token Contract Address</Text>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor="#8E8E93"
              value={contractAddress}
              onChangeText={setContractAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={[styles.searchButton, searching && styles.searchButtonDisabled]}
            onPress={searchToken}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>Search Token</Text>
            )}
          </TouchableOpacity>

          {/* Token Info */}
          {tokenInfo && (
            <View style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>
                    {tokenInfo.symbol.charAt(0)}
                  </Text>
                </View>
                <View style={styles.tokenDetails}>
                  <Text style={styles.tokenName}>{tokenInfo.name}</Text>
                  <Text style={styles.tokenSymbol}>{tokenInfo.symbol}</Text>
                </View>
              </View>

              <View style={styles.tokenInfo}>
                <View style={styles.tokenInfoRow}>
                  <Text style={styles.tokenInfoLabel}>Contract</Text>
                  <Text style={styles.tokenInfoValue} numberOfLines={1}>
                    {tokenInfo.address.slice(0, 10)}...{tokenInfo.address.slice(-8)}
                  </Text>
                </View>
                <View style={styles.tokenInfoRow}>
                  <Text style={styles.tokenInfoLabel}>Decimals</Text>
                  <Text style={styles.tokenInfoValue}>{tokenInfo.decimals}</Text>
                </View>
                {tokenInfo.balance && (
                  <View style={styles.tokenInfoRow}>
                    <Text style={styles.tokenInfoLabel}>Your Balance</Text>
                    <Text style={styles.tokenInfoValue}>
                      {parseFloat(tokenInfo.balance).toFixed(4)} {tokenInfo.symbol}
                    </Text>
                  </View>
                )}
              </View>

              {/* Add Token Button */}
              <TouchableOpacity
                style={[styles.addButton, loading && styles.addButtonDisabled]}
                onPress={handleAddToken}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Add {tokenInfo.symbol}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Warning */}
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Only add tokens you trust. Anyone can create a token with any name.
              Verify the contract address from official sources.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 60,
  },
  networkBadge: {
    alignSelf: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 16,
  },
  networkText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E5F2FF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  tokenSymbol: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tokenInfo: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  tokenInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tokenInfoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tokenInfoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    maxWidth: '60%',
  },
  addButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
});
