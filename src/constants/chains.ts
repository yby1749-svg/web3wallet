import { Chain } from '../types';

// Public RPC endpoints (rate-limited but free)
// For production, use your own Alchemy/Infura API key

export const CHAINS: Record<number, Chain> = {
  // ============ Mainnet ============
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
    symbol: 'POL',
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://optimism.llamarpc.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://base.llamarpc.com',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
  },
  56: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://binance.llamarpc.com',
    explorerUrl: 'https://bscscan.com',
    isTestnet: false,
  },
  43114: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: 'https://avalanche.public-rpc.com',
    explorerUrl: 'https://snowtrace.io',
    isTestnet: false,
  },

  // ============ Testnet ============
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy',
    symbol: 'POL',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    isTestnet: true,
  },
  421614: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    isTestnet: true,
  },
  11155420: {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    isTestnet: true,
  },
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
  },
  97: {
    chainId: 97,
    name: 'BNB Testnet',
    symbol: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
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
