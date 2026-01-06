/**
 * WalletConnect v2 Types
 */

import type { SessionTypes, ProposalTypes } from '@walletconnect/types';

// Session metadata from dApp
export interface WCPeerMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

// Active WalletConnect session
export interface WCSession {
  topic: string;
  peerMetadata: WCPeerMetadata;
  namespaces: SessionTypes.Namespaces;
  expiry: number;
  acknowledged: boolean;
}

// Pending session proposal
export interface WCPendingProposal {
  id: number;
  params: ProposalTypes.Struct;
}

// Supported request methods
export type WCRequestMethod =
  | 'personal_sign'
  | 'eth_sign'
  | 'eth_signTransaction'
  | 'eth_sendTransaction'
  | 'eth_signTypedData'
  | 'eth_signTypedData_v4';

// Pending sign request
export interface WCSignRequest {
  id: number;
  topic: string;
  method: WCRequestMethod;
  params: unknown[];
  chainId: number;
  peerMetadata: WCPeerMetadata;
}

// Formatted request for UI display
export interface WCFormattedRequest {
  type: 'message' | 'transaction' | 'typedData';
  message?: string;
  transaction?: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  };
  typedData?: {
    domain: Record<string, unknown>;
    types: Record<string, unknown[]>;
    message: Record<string, unknown>;
  };
}
