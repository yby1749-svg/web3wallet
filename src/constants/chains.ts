import { Chain } from '../types';

// Public RPC endpoints (rate-limited but free)
// For production, use your own Alchemy/Infura API key

export const CHAINS: Record<number, Chain> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia (Testnet)',
    symbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy (Testnet)',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    isTestnet: true,
  },
};

export const DEFAULT_CHAIN_ID = 1; // Ethereum Mainnet

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS).map(Number);

export function getChain(chainId: number): Chain | undefined {
  return CHAINS[chainId];
}

export function getChainName(chainId: number): string {
  return CHAINS[chainId]?.name || `Chain ${chainId}`;
}

export function getExplorerUrl(chainId: number, type: 'tx' | 'address', hash: string): string {
  const chain = CHAINS[chainId];
  if (!chain) return '';

  const baseUrl = chain.explorerUrl;
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    default:
      return baseUrl;
  }
}
