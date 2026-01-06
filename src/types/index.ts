// Blockchain Types
export type BlockchainType = 'evm' | 'solana';

// Wallet Types
export interface Wallet {
  address: string;
  name: string;
  createdAt: number;
  blockchain?: BlockchainType; // Default: 'evm'
}

// Multi-chain wallet - stores addresses for all chains derived from same mnemonic
export interface MultiChainWallet {
  id: string;
  name: string;
  createdAt: number;
  evmAddress: string;      // Ethereum/EVM chains address (0x...)
  solanaAddress: string;   // Solana address (base58)
}

export interface WalletAccount {
  address: string;
  privateKey: string;
  mnemonic?: string;
  blockchain?: BlockchainType;
}

// Token Types
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  balanceUSD?: number;
}

export interface NativeToken {
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  balanceUSD?: number;
}

// Network/Chain Types
export interface Chain {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
  data?: string;
  chainId: number;
  timestamp?: number;
  status?: 'pending' | 'confirmed' | 'failed';
}

// Transaction History Types
export interface TransactionHistory {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  isError: boolean;
  txType: 'send' | 'receive' | 'contract';
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: number;
  tokenValue?: string;
}

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface GasFee {
  slow: {
    gasPrice: string;
    estimatedTime: string;
  };
  normal: {
    gasPrice: string;
    estimatedTime: string;
  };
  fast: {
    gasPrice: string;
    estimatedTime: string;
  };
}

// NFT Types
export interface NFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  collectionName?: string;
  chainId: number;
  tokenType: 'ERC721' | 'ERC1155';
  balance?: string; // For ERC1155 (can own multiple of same token)
}

export interface NFTCollection {
  contractAddress: string;
  name: string;
  symbol?: string;
  imageUrl?: string;
  description?: string;
  chainId: number;
  nftCount: number;
}

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: NFTAttribute[];
  external_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

// Settings Types
export interface AppSettings {
  currency: string;
  language: string;
  biometricEnabled: boolean;
  autoLockTimeout: number; // in minutes
  hasSetupPin: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  WalletSetup: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  BackupMnemonic: { mnemonic: string };
  VerifyMnemonic: { mnemonic: string };
  SetupPin: { isNewWallet: boolean; mnemonic?: string };
  Main: undefined;
  Home: undefined;
  Send: { token?: Token; scannedAddress?: string };
  Receive: undefined;
  ConfirmTransaction: { transaction: TransactionRequest; token?: Token };
  TransactionHistory: undefined;
  AddToken: undefined;
  QRScanner: { onScan?: (address: string) => void };
  AssetDetail: { token: Token };
  Settings: undefined;
  Security: undefined;
  Legal: undefined;
  UnlockScreen: undefined;
  // WalletConnect screens
  WalletConnect: undefined;
  SessionApproval: undefined;
  SignRequest: undefined;
  // NFT screens
  NFTGallery: undefined;
  NFTDetail: { nft: NFT };
  MintNFT: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

// WalletConnect Types
export interface DAppRequest {
  id: number;
  method: string;
  params: unknown[];
  dappName: string;
  dappUrl: string;
  dappIcon?: string;
}

// Price Types
export interface PriceData {
  [symbol: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

// Solana Types
export interface SolanaToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  balanceUSD?: number;
}

export interface SolanaTransaction {
  signature: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'finalized' | 'failed';
  fee: number;
  type: 'sol' | 'spl-token';
  tokenMint?: string;
  tokenSymbol?: string;
}
