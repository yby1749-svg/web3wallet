/**
 * SolanaTransactionService - Solana Transaction Management
 *
 * Handles sending SOL and SPL tokens on Solana
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { solanaProviderService, SolanaNetwork } from './SolanaProviderService';

export interface SolanaTransferResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface SolanaTransactionFee {
  lamports: number;
  sol: number;
}

class SolanaTransactionService {
  /**
   * Send SOL to another address
   */
  async sendSOL(
    fromKeypair: Keypair,
    toAddress: string,
    amountSOL: number,
    network?: SolanaNetwork
  ): Promise<SolanaTransferResult> {
    try {
      const connection = solanaProviderService.getConnection(network);
      const toPublicKey = new PublicKey(toAddress);

      // Convert SOL to lamports
      const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

      // Create transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair]
      );

      return {
        signature,
        success: true,
      };
    } catch (error: any) {
      console.error('SOL transfer failed:', error);
      return {
        signature: '',
        success: false,
        error: error.message || 'Transfer failed',
      };
    }
  }

  /**
   * Send SPL Token to another address
   */
  async sendSPLToken(
    fromKeypair: Keypair,
    toAddress: string,
    tokenMint: string,
    amount: number,
    decimals: number,
    network?: SolanaNetwork
  ): Promise<SolanaTransferResult> {
    try {
      const connection = solanaProviderService.getConnection(network);
      const toPublicKey = new PublicKey(toAddress);
      const mintPublicKey = new PublicKey(tokenMint);

      // Get source token account
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        fromKeypair.publicKey
      );

      // Get destination token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        toPublicKey
      );

      const transaction = new Transaction();

      // Check if destination token account exists
      try {
        await getAccount(connection, destinationTokenAccount);
      } catch {
        // Create associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromKeypair.publicKey,
            destinationTokenAccount,
            toPublicKey,
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Convert amount to raw units
      const rawAmount = Math.round(amount * Math.pow(10, decimals));

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          sourceTokenAccount,
          destinationTokenAccount,
          fromKeypair.publicKey,
          rawAmount
        )
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair]
      );

      return {
        signature,
        success: true,
      };
    } catch (error: any) {
      console.error('SPL token transfer failed:', error);
      return {
        signature: '',
        success: false,
        error: error.message || 'Transfer failed',
      };
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(network?: SolanaNetwork): Promise<SolanaTransactionFee> {
    try {
      const connection = solanaProviderService.getConnection(network);

      // Get recent blockhash and fee calculator
      const { feeCalculator } = await connection.getRecentBlockhash();

      // Basic transaction fee (usually 5000 lamports)
      const lamports = feeCalculator?.lamportsPerSignature || 5000;

      return {
        lamports,
        sol: lamports / LAMPORTS_PER_SOL,
      };
    } catch {
      // Return default fee if estimation fails
      return {
        lamports: 5000,
        sol: 0.000005,
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    signature: string,
    network?: SolanaNetwork
  ): Promise<'confirmed' | 'finalized' | 'pending' | 'failed'> {
    try {
      const connection = solanaProviderService.getConnection(network);
      const status = await connection.getSignatureStatus(signature);

      if (!status.value) {
        return 'pending';
      }

      if (status.value.err) {
        return 'failed';
      }

      if (status.value.confirmationStatus === 'finalized') {
        return 'finalized';
      }

      if (status.value.confirmationStatus === 'confirmed') {
        return 'confirmed';
      }

      return 'pending';
    } catch {
      return 'pending';
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    signature: string,
    network?: SolanaNetwork,
    timeout: number = 30000
  ): Promise<boolean> {
    const connection = solanaProviderService.getConnection(network);
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getTransactionStatus(signature, network);

      if (status === 'confirmed' || status === 'finalized') {
        return true;
      }

      if (status === 'failed') {
        return false;
      }

      // Wait 1 second before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  }

  /**
   * Build unsigned transaction (for preview)
   */
  async buildTransferTransaction(
    fromAddress: string,
    toAddress: string,
    amountSOL: number,
    network?: SolanaNetwork
  ): Promise<Transaction> {
    const connection = solanaProviderService.getConnection(network);
    const fromPublicKey = new PublicKey(fromAddress);
    const toPublicKey = new PublicKey(toAddress);

    const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    return transaction;
  }
}

export const solanaTransactionService = new SolanaTransactionService();
export default SolanaTransactionService;
