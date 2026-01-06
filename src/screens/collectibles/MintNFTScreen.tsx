/**
 * Mint NFT Screen - Create and mint NFTs on Sepolia testnet
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import Clipboard from '@react-native-clipboard/clipboard';
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

// Progress step definitions
const MINT_STEPS = [
  { id: 1, label: 'Uploading Image', description: 'Uploading to IPFS...' },
  { id: 2, label: 'Creating Metadata', description: 'Generating NFT metadata...' },
  { id: 3, label: 'Uploading Metadata', description: 'Storing on IPFS...' },
  { id: 4, label: 'Sending Transaction', description: 'Minting on blockchain...' },
  { id: 5, label: 'Confirming', description: 'Waiting for confirmation...' },
];

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
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

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
      setCurrentProgressStep(1);
      setStatusMessage('Verifying PIN...');

      const isValidPin = await keyManager.verifyPin(pin);
      if (!isValidPin) {
        setPinError('Incorrect PIN');
        setStep('input');
        setCurrentProgressStep(0);
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
        setCurrentProgressStep(0);
        return;
      }

      // Step 1: Upload image to IPFS
      setCurrentProgressStep(1);
      setStatusMessage('Uploading image to IPFS...');

      // Step 2: Create metadata (happens inside uploadNFTData)
      setCurrentProgressStep(2);
      setStatusMessage('Creating NFT metadata...');

      // Step 3: Upload metadata to IPFS
      setCurrentProgressStep(3);
      setStatusMessage('Uploading metadata to IPFS...');

      const { tokenURI } = await pinataService.uploadNFTData(
        selectedImage.uri,
        nftName.trim(),
        nftDescription.trim() || `NFT minted from TempWallet`,
        [
          { trait_type: 'Created By', value: 'TempWallet' },
          { trait_type: 'Chain', value: 'Sepolia' },
        ]
      );

      // Step 4: Mint NFT on blockchain
      setStep('minting');
      setCurrentProgressStep(4);
      setStatusMessage('Sending mint transaction...');

      const result = await nftMintService.mint(
        privateKey,
        activeWallet.address,
        tokenURI
      );

      setTxHash(result.txHash);

      // Step 5: Wait for confirmation
      setCurrentProgressStep(5);
      setStatusMessage('Waiting for blockchain confirmation...');

      const mintedTokenId = await nftMintService.waitForMintConfirmation(
        result.txHash
      );
      setTokenId(mintedTokenId);

      // Success
      setStep('complete');
      setCurrentProgressStep(6); // All steps complete
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
    setCurrentProgressStep(0);
    setStatusMessage('');
    setTxHash('');
    setTokenId(null);
    setPin('');
    setCopiedHash(false);
  };

  const handleCopyTxHash = () => {
    if (txHash) {
      Clipboard.setString(txHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleOpenExplorer = () => {
    if (txHash) {
      const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
      Linking.openURL(explorerUrl);
    }
  };

  // Render step indicator
  const renderStepIndicator = (stepId: number, label: string) => {
    const isComplete = currentProgressStep > stepId;
    const isCurrent = currentProgressStep === stepId;
    const isPending = currentProgressStep < stepId;

    return (
      <View key={stepId} style={styles.stepRow}>
        <View
          style={[
            styles.stepCircle,
            isComplete && styles.stepCircleComplete,
            isCurrent && styles.stepCircleCurrent,
            isPending && styles.stepCirclePending,
          ]}
        >
          {isComplete ? (
            <Text style={styles.stepCheckmark}>✓</Text>
          ) : isCurrent ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.stepNumber}>{stepId}</Text>
          )}
        </View>
        <Text
          style={[
            styles.stepLabel,
            isComplete && styles.stepLabelComplete,
            isCurrent && styles.stepLabelCurrent,
            isPending && styles.stepLabelPending,
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  // Render progress screen
  if (step !== 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.progressScrollContent}>
          <View style={styles.progressContainer}>
            {/* Header Icon */}
            {step === 'complete' ? (
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
            ) : step === 'error' ? (
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorIcon}>✕</Text>
              </View>
            ) : null}

            {/* Title */}
            <Text style={styles.progressTitle}>
              {step === 'uploading' && 'Minting Your NFT'}
              {step === 'minting' && 'Minting Your NFT'}
              {step === 'complete' && 'Minting Complete!'}
              {step === 'error' && 'Minting Failed'}
            </Text>

            {/* Step Progress */}
            {step !== 'error' && (
              <View style={styles.stepsContainer}>
                {MINT_STEPS.map((s) => renderStepIndicator(s.id, s.label))}
              </View>
            )}

            {/* Current Status */}
            {step !== 'complete' && step !== 'error' && (
              <Text style={styles.progressMessage}>{statusMessage}</Text>
            )}

            {/* Error Message */}
            {step === 'error' && (
              <View style={styles.errorMessageContainer}>
                <Text style={styles.errorMessage}>{statusMessage}</Text>
              </View>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <View style={styles.txHashContainer}>
                <Text style={styles.txHashLabel}>Transaction Hash</Text>
                <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">
                  {txHash}
                </Text>
                <View style={styles.txHashActions}>
                  <TouchableOpacity
                    style={styles.txHashButton}
                    onPress={handleCopyTxHash}
                  >
                    <Text style={styles.txHashButtonText}>
                      {copiedHash ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.txHashButton}
                    onPress={handleOpenExplorer}
                  >
                    <Text style={styles.txHashButtonText}>View on Explorer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Token ID */}
            {tokenId && (
              <View style={styles.tokenIdContainer}>
                <Text style={styles.tokenIdLabel}>Token ID</Text>
                <Text style={styles.tokenId}>#{tokenId}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.progressButtons}>
              {step === 'complete' && (
                <>
                  <Button title="Done" onPress={handleDone} style={styles.doneButton} />
                  {txHash && (
                    <Button
                      title="View on Etherscan"
                      onPress={handleOpenExplorer}
                      variant="outline"
                      style={styles.explorerButton}
                    />
                  )}
                </>
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render input form
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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
    paddingBottom: 24,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  progressScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 24,
    textAlign: 'center',
  },
  // Step indicator styles
  stepsContainer: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCircleComplete: {
    backgroundColor: '#34C759',
  },
  stepCircleCurrent: {
    backgroundColor: '#007AFF',
  },
  stepCirclePending: {
    backgroundColor: '#E5E5EA',
  },
  stepCheckmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepLabel: {
    fontSize: 15,
    flex: 1,
  },
  stepLabelComplete: {
    color: '#34C759',
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: '#007AFF',
    fontWeight: '600',
  },
  stepLabelPending: {
    color: '#8E8E93',
  },
  progressMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorMessageContainer: {
    backgroundColor: '#FFEBEB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
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
    marginBottom: 8,
  },
  txHash: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  txHashActions: {
    flexDirection: 'row',
    gap: 12,
  },
  txHashButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  txHashButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  tokenIdContainer: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  tokenIdLabel: {
    fontSize: 12,
    color: '#0066CC',
    marginBottom: 4,
  },
  tokenId: {
    fontSize: 28,
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
  explorerButton: {
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
