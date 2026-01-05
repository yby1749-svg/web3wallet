/**
 * Network Store - 체인/네트워크 상태 관리
 */

import { create } from 'zustand';
import { Chain } from '../types';
import { CHAINS, DEFAULT_CHAIN_ID } from '../constants/chains';
import { providerService } from '../services/blockchain/ProviderService';

interface NetworkState {
  // 상태
  currentChainId: number;
  currentChain: Chain;
  availableChains: Chain[];
  isConnected: boolean;
  isTestnetEnabled: boolean;

  // 액션
  setChain: (chainId: number) => void;
  toggleTestnet: (enabled: boolean) => void;
  checkConnection: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  // 초기 상태
  currentChainId: DEFAULT_CHAIN_ID,
  currentChain: CHAINS[DEFAULT_CHAIN_ID],
  availableChains: Object.values(CHAINS).filter((c) => !c.isTestnet),
  isConnected: false,
  isTestnetEnabled: false,

  // 액션
  setChain: (chainId: number) => {
    const chain = CHAINS[chainId];
    if (!chain) return;

    providerService.setCurrentChain(chainId);

    set({
      currentChainId: chainId,
      currentChain: chain,
    });
  },

  toggleTestnet: (enabled: boolean) => {
    set({
      isTestnetEnabled: enabled,
      availableChains: Object.values(CHAINS).filter(
        (c) => enabled || !c.isTestnet
      ),
    });
  },

  checkConnection: async () => {
    const { currentChainId } = get();
    const isConnected = await providerService.isConnected(currentChainId);
    set({ isConnected });
  },
}));
