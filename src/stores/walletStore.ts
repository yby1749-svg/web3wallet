/**
 * Wallet Store - Zustand 상태 관리
 */

import { create } from 'zustand';
import { Wallet, Token, NativeToken, NFT } from '../types';
import { walletService } from '../services/wallet/WalletService';
import { tokenService } from '../services/blockchain/TokenService';
import { nftService } from '../services/blockchain/NFTService';
import { keyManager } from '../services/wallet/KeyManager';
import { providerService } from '../services/blockchain/ProviderService';
import EncryptedStorage from 'react-native-encrypted-storage';

const CUSTOM_TOKENS_KEY = 'custom_tokens';

interface WalletState {
  // 상태
  wallets: Wallet[];
  activeWallet: Wallet | null;
  nativeBalance: NativeToken | null;
  tokens: Token[];
  customTokens: Token[];
  nfts: NFT[];
  totalValueUSD: number;
  isLoading: boolean;
  isLoadingNFTs: boolean;
  isUnlocked: boolean;
  error: string | null;

  // 액션
  setWallets: (wallets: Wallet[]) => void;
  setActiveWallet: (wallet: Wallet | null) => void;
  setUnlocked: (unlocked: boolean) => void;
  loadWallets: () => Promise<void>;
  createWallet: (pin: string) => Promise<boolean>;
  importWallet: (mnemonic: string, pin: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  loadNFTs: () => Promise<void>;
  addCustomToken: (token: Token) => Promise<boolean>;
  removeCustomToken: (tokenAddress: string) => Promise<void>;
  loadCustomTokens: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // 초기 상태
  wallets: [],
  activeWallet: null,
  nativeBalance: null,
  tokens: [],
  customTokens: [],
  nfts: [],
  totalValueUSD: 0,
  isLoading: false,
  isLoadingNFTs: false,
  isUnlocked: false,
  error: null,

  // 액션
  setWallets: (wallets) => set({ wallets }),

  setActiveWallet: (wallet) => set({ activeWallet: wallet }),

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),

  loadWallets: async () => {
    try {
      set({ isLoading: true, error: null });

      const walletList = await keyManager.getWalletList();
      const wallets: Wallet[] = walletList.map((w) => ({
        address: w.address,
        name: `Wallet ${walletList.indexOf(w) + 1}`,
        createdAt: w.createdAt,
      }));

      set({
        wallets,
        activeWallet: wallets.length > 0 ? wallets[0] : null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to load wallets',
        isLoading: false,
      });
    }
  },

  createWallet: async (pin: string) => {
    try {
      set({ isLoading: true, error: null });

      const wallet = await walletService.createNewWallet(pin);
      if (!wallet) {
        throw new Error('Failed to create wallet');
      }

      const newWallet: Wallet = {
        address: wallet.address,
        name: 'Wallet 1',
        createdAt: Date.now(),
      };

      set((state) => ({
        wallets: [...state.wallets, newWallet],
        activeWallet: newWallet,
        isUnlocked: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error: 'Failed to create wallet',
        isLoading: false,
      });
      return false;
    }
  },

  importWallet: async (mnemonic: string, pin: string) => {
    try {
      set({ isLoading: true, error: null });

      const wallet = await walletService.importWalletFromMnemonic(mnemonic, pin);
      if (!wallet) {
        throw new Error('Failed to import wallet');
      }

      const newWallet: Wallet = {
        address: wallet.address,
        name: 'Imported Wallet',
        createdAt: Date.now(),
      };

      set((state) => ({
        wallets: [...state.wallets, newWallet],
        activeWallet: newWallet,
        isUnlocked: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error: 'Failed to import wallet',
        isLoading: false,
      });
      return false;
    }
  },

  refreshBalance: async () => {
    const { activeWallet, isUnlocked } = get();
    if (!activeWallet || !isUnlocked) return;

    try {
      set({ isLoading: true });

      const { native, tokens } = await tokenService.getAllAssets(
        activeWallet.address
      );

      const totalValue = await tokenService.getTotalValueUSD(
        activeWallet.address
      );

      set({
        nativeBalance: native,
        tokens,
        totalValueUSD: totalValue,
        isLoading: false,
      });

      // Also load NFTs in background
      get().loadNFTs();
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to refresh balance:', error);
    }
  },

  loadNFTs: async () => {
    const { activeWallet, isUnlocked } = get();
    if (!activeWallet || !isUnlocked) return;

    try {
      set({ isLoadingNFTs: true });

      const chainId = providerService.getCurrentChainId();
      const nfts = await nftService.getNFTsForOwner(activeWallet.address, chainId);

      set({
        nfts,
        isLoadingNFTs: false,
      });
    } catch (error) {
      set({ isLoadingNFTs: false });
      console.error('Failed to load NFTs:', error);
    }
  },

  clearError: () => set({ error: null }),

  addCustomToken: async (token: Token) => {
    try {
      const { customTokens } = get();

      // 중복 체크
      if (customTokens.some((t) => t.address.toLowerCase() === token.address.toLowerCase())) {
        return false;
      }

      const updatedTokens = [...customTokens, token];
      await EncryptedStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updatedTokens));
      set({ customTokens: updatedTokens });

      // 잔액 새로고침
      get().refreshBalance();
      return true;
    } catch (error) {
      console.error('Failed to add custom token:', error);
      return false;
    }
  },

  removeCustomToken: async (tokenAddress: string) => {
    try {
      const { customTokens } = get();
      const updatedTokens = customTokens.filter(
        (t) => t.address.toLowerCase() !== tokenAddress.toLowerCase()
      );

      await EncryptedStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updatedTokens));
      set({ customTokens: updatedTokens });

      // 잔액 새로고침
      get().refreshBalance();
    } catch (error) {
      console.error('Failed to remove custom token:', error);
    }
  },

  loadCustomTokens: async () => {
    try {
      const stored = await EncryptedStorage.getItem(CUSTOM_TOKENS_KEY);
      if (stored) {
        const tokens = JSON.parse(stored);
        set({ customTokens: tokens });
      }
    } catch (error) {
      console.error('Failed to load custom tokens:', error);
    }
  },

  reset: () =>
    set({
      wallets: [],
      activeWallet: null,
      nativeBalance: null,
      tokens: [],
      customTokens: [],
      nfts: [],
      totalValueUSD: 0,
      isLoading: false,
      isLoadingNFTs: false,
      isUnlocked: false,
      error: null,
    }),
}));
