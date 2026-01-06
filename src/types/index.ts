// Wallet Types
export interface Wallet {
  address: string;
  name: string;
  createdAt: number;
}

export interface WalletAccount {
  address: string;
  privateKey: string;
  mnemonic?: string;
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
  collectionName?: string;
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
