/**
 * Wallet Store - Zustand 상태 관리
 */

import { create } from 'zustand';
import { Wallet, Token, NativeToken } from '../types';
import { walletService } from '../services/wallet/WalletService';
import { tokenService } from '../services/blockchain/TokenService';
import { keyManager } from '../services/wallet/KeyManager';

interface WalletState {
  // 상태
  wallets: Wallet[];
  activeWallet: Wallet | null;
  nativeBalance: NativeToken | null;
  tokens: Token[];
  totalValueUSD: number;
  isLoading: boolean;
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
  clearError: () => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // 초기 상태
  wallets: [],
  activeWallet: null,
  nativeBalance: null,
  tokens: [],
  totalValueUSD: 0,
  isLoading: false,
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
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to refresh balance:', error);
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      wallets: [],
      activeWallet: null,
      nativeBalance: null,
      tokens: [],
      totalValueUSD: 0,
      isLoading: false,
      isUnlocked: false,
      error: null,
    }),
}));
