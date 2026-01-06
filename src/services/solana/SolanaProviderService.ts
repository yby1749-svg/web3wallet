/**
 * SolanaProviderService - Solana RPC Connection Management
 *
 * Manages connections to Solana RPC endpoints
 */

import { Connection, clusterApiUrl, Commitment } from '@solana/web3.js';

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet';

interface SolanaNetworkConfig {
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// Solana network configurations
export const SOLANA_NETWORKS: Record<SolanaNetwork, SolanaNetworkConfig> = {
  'mainnet-beta': {
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    isTestnet: false,
  },
  devnet: {
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io/?cluster=devnet',
    isTestnet: true,
  },
  testnet: {
    name: 'Solana Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://solscan.io/?cluster=testnet',
    isTestnet: true,
  },
};

// Alternative RPC endpoints (faster/more reliable)
const ALTERNATIVE_RPC: Record<SolanaNetwork, string[]> = {
  'mainnet-beta': [
    'https://solana-mainnet.g.alchemy.com/v2/demo',
    'https://rpc.ankr.com/solana',
    'https://solana.public-rpc.com',
  ],
  devnet: [
    'https://rpc.ankr.com/solana_devnet',
  ],
  testnet: [],
};

class SolanaProviderService {
  private connections: Map<SolanaNetwork, Connection> = new Map();
  private currentNetwork: SolanaNetwork = 'mainnet-beta';
  private commitment: Commitment = 'confirmed';

  /**
   * Get connection for a specific network
   */
  getConnection(network?: SolanaNetwork): Connection {
    const net = network || this.currentNetwork;

    if (!this.connections.has(net)) {
      const config = SOLANA_NETWORKS[net];
      const connection = new Connection(config.rpcUrl, this.commitment);
      this.connections.set(net, connection);
    }

    return this.connections.get(net)!;
  }

  /**
   * Set current network
   */
  setNetwork(network: SolanaNetwork): void {
    this.currentNetwork = network;
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): SolanaNetwork {
    return this.currentNetwork;
  }

  /**
   * Get network config
   */
  getNetworkConfig(network?: SolanaNetwork): SolanaNetworkConfig {
    return SOLANA_NETWORKS[network || this.currentNetwork];
  }

  /**
   * Get all available networks
   */
  getAvailableNetworks(includeTestnets: boolean = false): SolanaNetworkConfig[] {
    return Object.values(SOLANA_NETWORKS).filter(
      (n) => includeTestnets || !n.isTestnet
    );
  }

  /**
   * Check if connected to network
   */
  async isConnected(network?: SolanaNetwork): Promise<boolean> {
    try {
      const connection = this.getConnection(network);
      const version = await connection.getVersion();
      return !!version;
    } catch {
      return false;
    }
  }

  /**
   * Get SOL balance for address
   */
  async getBalance(address: string, network?: SolanaNetwork): Promise<number> {
    try {
      const connection = this.getConnection(network);
      const { PublicKey } = await import('@solana/web3.js');
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      // Convert lamports to SOL (1 SOL = 1e9 lamports)
      return balance / 1e9;
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      return 0;
    }
  }

  /**
   * Get recent blockhash for transactions
   */
  async getRecentBlockhash(network?: SolanaNetwork): Promise<string> {
    const connection = this.getConnection(network);
    const { blockhash } = await connection.getLatestBlockhash();
    return blockhash;
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string, network?: SolanaNetwork) {
    const connection = this.getConnection(network);
    return connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(
    type: 'tx' | 'address' | 'token',
    value: string,
    network?: SolanaNetwork
  ): string {
    const config = this.getNetworkConfig(network);
    const baseUrl = config.explorerUrl;
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;

    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${value}${cluster}`;
      case 'address':
        return `${baseUrl}/account/${value}${cluster}`;
      case 'token':
        return `${baseUrl}/token/${value}${cluster}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Request airdrop (devnet/testnet only)
   */
  async requestAirdrop(
    address: string,
    amount: number = 1,
    network: SolanaNetwork = 'devnet'
  ): Promise<string | null> {
    if (network === 'mainnet-beta') {
      throw new Error('Airdrop not available on mainnet');
    }

    try {
      const connection = this.getConnection(network);
      const { PublicKey } = await import('@solana/web3.js');
      const publicKey = new PublicKey(address);

      // Amount in lamports (1 SOL = 1e9 lamports)
      const lamports = amount * 1e9;
      const signature = await connection.requestAirdrop(publicKey, lamports);

      // Wait for confirmation
      await connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      console.error('Airdrop failed:', error);
      return null;
    }
  }
}

export const solanaProviderService = new SolanaProviderService();
export default SolanaProviderService;
