/**
 * WalletConnectService - WalletConnect v2 Core Service
 *
 * Manages WalletConnect sessions and handles protocol communication
 */

import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { SessionTypes, ProposalTypes } from '@walletconnect/types';
import { SUPPORTED_CHAIN_IDS } from '../../constants/chains';
import { WCSession, WCPendingProposal, WCSignRequest, WCPeerMetadata } from '../../types/walletconnect';

// WalletConnect Cloud Project ID - Replace with your own
const PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID';

// Supported signing methods
const SUPPORTED_METHODS = [
  'personal_sign',
  'eth_sign',
  'eth_signTransaction',
  'eth_sendTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v4',
];

// Supported events
const SUPPORTED_EVENTS = ['chainChanged', 'accountsChanged'];

// Event callbacks
type SessionProposalCallback = (proposal: WCPendingProposal) => void;
type SessionRequestCallback = (request: WCSignRequest) => void;
type SessionDeleteCallback = (topic: string) => void;

class WalletConnectService {
  private web3wallet: IWeb3Wallet | null = null;
  private isInitialized: boolean = false;

  // Event callbacks
  private onSessionProposal: SessionProposalCallback | null = null;
  private onSessionRequest: SessionRequestCallback | null = null;
  private onSessionDelete: SessionDeleteCallback | null = null;

  /**
   * Initialize WalletConnect client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const core = new Core({
        projectId: PROJECT_ID,
      });

      this.web3wallet = await Web3Wallet.init({
        // @ts-ignore - Core type mismatch between packages
        core,
        metadata: {
          name: 'Web3Wallet',
          description: 'React Native Web3 Wallet',
          url: 'https://web3wallet.app',
          icons: ['https://avatars.githubusercontent.com/u/37784886'],
        },
      });

      this.setupEventListeners();
      this.isInitialized = true;

      console.log('WalletConnect initialized');
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Set event callbacks
   */
  setCallbacks(
    onProposal: SessionProposalCallback,
    onRequest: SessionRequestCallback,
    onDelete: SessionDeleteCallback
  ): void {
    this.onSessionProposal = onProposal;
    this.onSessionRequest = onRequest;
    this.onSessionDelete = onDelete;
  }

  /**
   * Setup WalletConnect event listeners
   */
  private setupEventListeners(): void {
    if (!this.web3wallet) return;

    // Session proposal (new connection request)
    this.web3wallet.on('session_proposal', async (proposal: Web3WalletTypes.SessionProposal) => {
      console.log('Session proposal received:', proposal.id);

      const pendingProposal: WCPendingProposal = {
        id: proposal.id,
        params: proposal.params,
      };

      this.onSessionProposal?.(pendingProposal);
    });

    // Session request (signing request)
    this.web3wallet.on('session_request', async (event: Web3WalletTypes.SessionRequest) => {
      console.log('Session request received:', event.id, event.params.request.method);

      const session = this.getSession(event.topic);
      if (!session) {
        console.error('Session not found for request');
        return;
      }

      // Parse chain ID from request
      const chainId = parseInt(event.params.chainId.split(':')[1], 10);

      const signRequest: WCSignRequest = {
        id: event.id,
        topic: event.topic,
        method: event.params.request.method as WCSignRequest['method'],
        params: event.params.request.params,
        chainId,
        peerMetadata: session.peerMetadata,
      };

      this.onSessionRequest?.(signRequest);
    });

    // Session delete (disconnection)
    this.web3wallet.on('session_delete', (event: { topic: string }) => {
      console.log('Session deleted:', event.topic);
      this.onSessionDelete?.(event.topic);
    });
  }

  /**
   * Pair with a dApp using WalletConnect URI
   */
  async pair(uri: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.pair({ uri });
    } catch (error) {
      console.error('Pairing failed:', error);
      throw error;
    }
  }

  /**
   * Approve a session proposal
   */
  async approveSession(
    proposalId: number,
    address: string,
    proposalParams: ProposalTypes.Struct
  ): Promise<WCSession> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    // Build accounts array for all supported chains
    const accounts = SUPPORTED_CHAIN_IDS.map((chainId) => `eip155:${chainId}:${address}`);
    const chains = SUPPORTED_CHAIN_IDS.map((chainId) => `eip155:${chainId}`);

    // Build approved namespaces
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: proposalParams,
      supportedNamespaces: {
        eip155: {
          chains,
          methods: SUPPORTED_METHODS,
          events: SUPPORTED_EVENTS,
          accounts,
        },
      },
    });

    const session = await this.web3wallet.approveSession({
      id: proposalId,
      namespaces: approvedNamespaces,
    });

    return this.formatSession(session);
  }

  /**
   * Reject a session proposal
   */
  async rejectSession(proposalId: number): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.web3wallet.rejectSession({
      id: proposalId,
      reason: getSdkError('USER_REJECTED'),
    });
  }

  /**
   * Respond to a signing request with success
   */
  async approveRequest(topic: string, requestId: number, result: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.web3wallet.respondSessionRequest({
      topic,
      response: {
        id: requestId,
        jsonrpc: '2.0',
        result,
      },
    });
  }

  /**
   * Respond to a signing request with rejection
   */
  async rejectRequest(topic: string, requestId: number): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.web3wallet.respondSessionRequest({
      topic,
      response: {
        id: requestId,
        jsonrpc: '2.0',
        error: getSdkError('USER_REJECTED'),
      },
    });
  }

  /**
   * Disconnect a session
   */
  async disconnectSession(topic: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    await this.web3wallet.disconnectSession({
      topic,
      reason: getSdkError('USER_DISCONNECTED'),
    });
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WCSession[] {
    if (!this.web3wallet) return [];

    const sessions = this.web3wallet.getActiveSessions();
    return Object.values(sessions).map((session) => this.formatSession(session));
  }

  /**
   * Get a specific session by topic
   */
  getSession(topic: string): WCSession | null {
    if (!this.web3wallet) return null;

    const sessions = this.web3wallet.getActiveSessions();
    const session = sessions[topic];

    return session ? this.formatSession(session) : null;
  }

  /**
   * Format session to our internal type
   */
  private formatSession(session: SessionTypes.Struct): WCSession {
    return {
      topic: session.topic,
      peerMetadata: session.peer.metadata as WCPeerMetadata,
      namespaces: session.namespaces,
      expiry: session.expiry,
      acknowledged: session.acknowledged,
    };
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.web3wallet !== null;
  }
}

export const walletConnectService = new WalletConnectService();
export default WalletConnectService;
