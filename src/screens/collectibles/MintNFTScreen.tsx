/**
 * Mint NFT Screen - Create and mint NFTs on Sepolia testnet
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { RootStackParamList } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { keyManager } from '../../services/wallet/KeyManager';
import { pinataService } from '../../services/ipfs/PinataService';
import { nftMintService } from '../../services/blockchain/NFTMintService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MintNFT'>;

type MintStep = 'input' | 'uploading' | 'minting' | 'complete' | 'error';

export const MintNFTScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { activeWallet, loadNFTs } = useWalletStore();
  const { currentChain, setChain, availableChains } = useNetworkStore();

  // Form state
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Minting state
  const [step, setStep] = useState<MintStep>('input');
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [tokenId, setTokenId] = useState<string | null>(null);

  // Check if on Sepolia
  const isOnSepolia = currentChain.chainId === 11155111;

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSwitchToSepolia = () => {
    const sepoliaChain = availableChains.find((c) => c.chainId === 11155111);
    if (sepoliaChain) {
      setChain(sepoliaChain.chainId);
      Alert.alert('Network Changed', 'Switched to Sepolia Testnet');
    }
  };

  const handleMint = async () => {
    // Validation
    if (!selectedImage?.uri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    if (!nftName.trim()) {
      Alert.alert('Error', 'Please enter NFT name');
      return;
    }
    if (!pin || pin.length !== 6) {
      setPinError('Please enter your 6-digit PIN');
      return;
    }
    if (!activeWallet) {
      Alert.alert('Error', 'No wallet connected');
      return;
    }

    // Check Pinata configuration
    if (!pinataService.isConfigured()) {
      Alert.alert(
        'Pinata Not Configured',
        'Please configure Pinata API keys in PinataService.ts to upload images to IPFS.'
      );
      return;
    }

    // Check minting support
    if (!nftMintService.canMint()) {
      Alert.alert(
        'Minting Not Available',
        'NFT minting contract is not configured for this network. Please deploy a contract first.'
      );
      return;
    }

    try {
      // Verify PIN
      setStep('uploading');
      setStatusMessage('Verifying PIN...');

      const isValidPin = await keyManager.verifyPin(pin);
      if (!isValidPin) {
        setPinError('Incorrect PIN');
        setStep('input');
        return;
      }

      // Get private key
      const privateKey = await keyManager.retrievePrivateKey(
        activeWallet.address,
        pin
      );
      if (!privateKey) {
        Alert.alert('Error', 'Failed to retrieve private key');
        setStep('input');
        return;
      }

      // Step 1: Upload to IPFS
      setStatusMessage('Uploading image to IPFS...');
      const { tokenURI } = await pinataService.uploadNFTData(
        selectedImage.uri,
        nftName.trim(),
        nftDescription.trim() || `NFT minted from TempWallet`,
        [
          { trait_type: 'Created By', value: 'TempWallet' },
          { trait_type: 'Chain', value: 'Sepolia' },
        ]
      );

      // Step 2: Mint NFT
      setStep('minting');
      setStatusMessage('Minting NFT on blockchain...');

      const result = await nftMintService.mint(
        privateKey,
        activeWallet.address,
        tokenURI
      );

      setTxHash(result.txHash);
      setStatusMessage('Waiting for confirmation...');

      // Wait for confirmation and get token ID
      const mintedTokenId = await nftMintService.waitForMintConfirmation(
        result.txHash
      );
      setTokenId(mintedTokenId);

      // Success
      setStep('complete');
      setStatusMessage('NFT minted successfully!');

      // Refresh NFT list
      loadNFTs();
    } catch (error: any) {
      console.error('Minting error:', error);
      setStep('error');
      setStatusMessage(error.message || 'Failed to mint NFT');
    }
  };

  const handleDone = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    setStep('input');
    setStatusMessage('');
    setTxHash('');
    setTokenId(null);
    setPin('');
  };

  // Render progress screen
  if (step !== 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.progressContainer}>
          {step === 'complete' ? (
            <Text style={styles.progressIcon}>✅</Text>
          ) : step === 'error' ? (
            <Text style={styles.progressIcon}>❌</Text>
          ) : (
            <ActivityIndicator size="large" color="#007AFF" />
          )}

          <Text style={styles.progressTitle}>
            {step === 'uploading' && 'Uploading to IPFS'}
            {step === 'minting' && 'Minting NFT'}
            {step === 'complete' && 'Minting Complete!'}
            {step === 'error' && 'Minting Failed'}
          </Text>

          <Text style={styles.progressMessage}>{statusMessage}</Text>

          {txHash && (
            <View style={styles.txHashContainer}>
              <Text style={styles.txHashLabel}>Transaction Hash</Text>
              <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">
                {txHash}
              </Text>
            </View>
          )}

          {tokenId && (
            <View style={styles.tokenIdContainer}>
              <Text style={styles.tokenIdLabel}>Token ID</Text>
              <Text style={styles.tokenId}>{tokenId}</Text>
            </View>
          )}

          <View style={styles.progressButtons}>
            {step === 'complete' && (
              <Button title="Done" onPress={handleDone} style={styles.doneButton} />
            )}
            {step === 'error' && (
              <>
                <Button
                  title="Retry"
                  onPress={handleRetry}
                  style={styles.retryButton}
                />
                <Button
                  title="Cancel"
                  onPress={handleDone}
                  variant="outline"
                  style={styles.cancelButton}
                />
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render input form
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mint NFT</Text>
          <Text style={styles.subtitle}>
            Create your own NFT on Sepolia testnet
          </Text>
        </View>

        {/* Network Warning */}
        {!isOnSepolia && (
          <TouchableOpacity
            style={styles.networkWarning}
            onPress={handleSwitchToSepolia}
          >
            <Text style={styles.networkWarningText}>
              Switch to Sepolia testnet to mint NFTs
            </Text>
            <Text style={styles.networkWarningAction}>Tap to switch</Text>
          </TouchableOpacity>
        )}

        {/* Image Selection */}
        <Text style={styles.sectionTitle}>NFT Image</Text>
        <TouchableOpacity
          style={styles.imageSelector}
          onPress={handleSelectImage}
        >
          {selectedImage?.uri ? (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.selectedImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
              <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* NFT Details */}
        <Text style={styles.sectionTitle}>NFT Details</Text>
        <Input
          label="Name"
          value={nftName}
          onChangeText={setNftName}
          placeholder="Enter NFT name"
          maxLength={50}
        />

        <Input
          label="Description (Optional)"
          value={nftDescription}
          onChangeText={setNftDescription}
          placeholder="Enter description"
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        {/* PIN Entry */}
        <Text style={styles.sectionTitle}>Confirm with PIN</Text>
        <Input
          value={pin}
          onChangeText={(text) => {
            setPin(text.replace(/[^0-9]/g, '').slice(0, 6));
            setPinError('');
          }}
          placeholder="Enter 6-digit PIN"
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          error={pinError}
        />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Your image is uploaded to IPFS (decentralized storage){'\n'}
            2. Metadata is created with your NFT details{'\n'}
            3. NFT is minted on Sepolia testnet{'\n'}
            4. You'll own the newly created NFT
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.footerCancelButton}
        />
        <Button
          title="Mint NFT"
          onPress={handleMint}
          disabled={!selectedImage || !nftName.trim() || pin.length !== 6 || !isOnSepolia}
          style={styles.mintButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  networkWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  networkWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  networkWarningAction: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    marginTop: 8,
  },
  imageSelector: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    marginBottom: 24,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0066CC',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  footerCancelButton: {
    flex: 1,
  },
  mintButton: {
    flex: 2,
  },
  // Progress screen styles
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  progressIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  txHashContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  txHashLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  txHash: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  tokenIdContainer: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  tokenIdLabel: {
    fontSize: 12,
    color: '#0066CC',
    marginBottom: 4,
  },
  tokenId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0066CC',
  },
  progressButtons: {
    width: '100%',
    gap: 12,
  },
  doneButton: {
    width: '100%',
  },
  retryButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

export default MintNFTScreen;
