/**
 * WalletConnect Store - Zustand State Management
 */

import { create } from 'zustand';
import { walletConnectService } from '../services/walletconnect/WalletConnectService';
import { requestHandler } from '../services/walletconnect/RequestHandler';
import {
  WCSession,
  WCPendingProposal,
  WCSignRequest,
  WCFormattedRequest,
} from '../types/walletconnect';

interface WalletConnectState {
  // State
  isInitialized: boolean;
  isConnecting: boolean;
  sessions: WCSession[];
  pendingProposal: WCPendingProposal | null;
  pendingRequest: WCSignRequest | null;
  formattedRequest: WCFormattedRequest | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  pair: (uri: string) => Promise<void>;
  approveSession: (proposalId: number, address: string) => Promise<void>;
  rejectSession: (proposalId: number) => Promise<void>;
  approveRequest: (address: string, pin: string) => Promise<void>;
  rejectRequest: () => Promise<void>;
  disconnectSession: (topic: string) => Promise<void>;
  refreshSessions: () => void;
  clearPendingProposal: () => void;
  clearPendingRequest: () => void;
  clearError: () => void;
}

export const useWalletConnectStore = create<WalletConnectState>((set, get) => ({
  // Initial state
  isInitialized: false,
  isConnecting: false,
  sessions: [],
  pendingProposal: null,
  pendingRequest: null,
  formattedRequest: null,
  error: null,

  // Initialize WalletConnect
  initialize: async () => {
    try {
      // Set up callbacks before initializing
      walletConnectService.setCallbacks(
        // On session proposal
        (proposal: WCPendingProposal) => {
          set({ pendingProposal: proposal, isConnecting: false });
        },
        // On session request
        (request: WCSignRequest) => {
          const formatted = requestHandler.formatRequest(request);
          set({ pendingRequest: request, formattedRequest: formatted });
        },
        // On session delete
        (topic: string) => {
          const sessions = get().sessions.filter((s) => s.topic !== topic);
          set({ sessions });
        }
      );

      await walletConnectService.initialize();

      const sessions = walletConnectService.getActiveSessions();
      set({ isInitialized: true, sessions });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to initialize WalletConnect';
      set({ error: message });
    }
  },

  // Pair with dApp via URI
  pair: async (uri: string) => {
    try {
      set({ isConnecting: true, error: null });
      await walletConnectService.pair(uri);
      // Proposal will come via callback
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      set({ error: message, isConnecting: false });
    }
  },

  // Approve session proposal
  approveSession: async (proposalId: number, address: string) => {
    const { pendingProposal } = get();
    if (!pendingProposal) {
      set({ error: 'No pending proposal' });
      return;
    }

    try {
      const session = await walletConnectService.approveSession(
        proposalId,
        address,
        pendingProposal.params
      );
      const sessions = [...get().sessions, session];
      set({ sessions, pendingProposal: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve session';
      set({ error: message });
    }
  },

  // Reject session proposal
  rejectSession: async (proposalId: number) => {
    try {
      await walletConnectService.rejectSession(proposalId);
      set({ pendingProposal: null, isConnecting: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject session';
      set({ error: message });
    }
  },

  // Approve signing request
  approveRequest: async (address: string, pin: string) => {
    const { pendingRequest } = get();
    if (!pendingRequest) {
      set({ error: 'No pending request' });
      return;
    }

    try {
      const result = await requestHandler.handleRequest(pendingRequest, address, pin);
      await walletConnectService.approveRequest(pendingRequest.topic, pendingRequest.id, result);
      set({ pendingRequest: null, formattedRequest: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign request';
      set({ error: message });
      throw error; // Re-throw for UI to handle
    }
  },

  // Reject signing request
  rejectRequest: async () => {
    const { pendingRequest } = get();
    if (!pendingRequest) return;

    try {
      await walletConnectService.rejectRequest(pendingRequest.topic, pendingRequest.id);
      set({ pendingRequest: null, formattedRequest: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject request';
      set({ error: message });
    }
  },

  // Disconnect session
  disconnectSession: async (topic: string) => {
    try {
      await walletConnectService.disconnectSession(topic);
      const sessions = get().sessions.filter((s) => s.topic !== topic);
      set({ sessions });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      set({ error: message });
    }
  },

  // Refresh sessions from service
  refreshSessions: () => {
    const sessions = walletConnectService.getActiveSessions();
    set({ sessions });
  },

  // Clear pending proposal
  clearPendingProposal: () => {
    set({ pendingProposal: null, isConnecting: false });
  },

  // Clear pending request
  clearPendingRequest: () => {
    set({ pendingRequest: null, formattedRequest: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
