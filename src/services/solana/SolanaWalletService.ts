/**
 * SolanaWalletService - Solana Wallet Management
 *
 * Handles wallet creation and key derivation for Solana
 * Uses Ed25519 curve (different from EVM's secp256k1)
 */

import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import * as bip39 from 'bip39';
import bs58 from 'bs58';

// Solana derivation path (BIP44)
const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'";

export interface SolanaWallet {
  publicKey: string;
  secretKey: Uint8Array;
}

class SolanaWalletService {
  /**
   * Derive Solana keypair from mnemonic
   * Uses Ed25519 HD key derivation
   */
  deriveKeypairFromMnemonic(mnemonic: string, accountIndex: number = 0): Keypair {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    // Derive path for account index
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString('hex')).key;

    // Create keypair from derived seed
    return Keypair.fromSeed(derivedSeed);
  }

  /**
   * Get Solana address (public key) from mnemonic
   */
  getAddressFromMnemonic(mnemonic: string, accountIndex: number = 0): string {
    const keypair = this.deriveKeypairFromMnemonic(mnemonic, accountIndex);
    return keypair.publicKey.toBase58();
  }

  /**
   * Get keypair from secret key (base58 encoded)
   */
  getKeypairFromSecretKey(secretKeyBase58: string): Keypair {
    const secretKey = bs58.decode(secretKeyBase58);
    return Keypair.fromSecretKey(secretKey);
  }

  /**
   * Encode secret key to base58 for storage
   */
  encodeSecretKey(secretKey: Uint8Array): string {
    return bs58.encode(secretKey);
  }

  /**
   * Decode secret key from base58
   */
  decodeSecretKey(secretKeyBase58: string): Uint8Array {
    return bs58.decode(secretKeyBase58);
  }

  /**
   * Validate Solana address format
   */
  isValidAddress(address: string): boolean {
    try {
      // Solana addresses are base58 encoded, 32-44 characters
      if (address.length < 32 || address.length > 44) {
        return false;
      }
      // Try to decode as base58
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Generate a new random keypair (for testing)
   */
  generateRandomKeypair(): Keypair {
    return Keypair.generate();
  }

  /**
   * Get wallet info from mnemonic
   */
  getWalletFromMnemonic(
    mnemonic: string,
    accountIndex: number = 0
  ): SolanaWallet {
    const keypair = this.deriveKeypairFromMnemonic(mnemonic, accountIndex);
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: keypair.secretKey,
    };
  }

  /**
   * Shorten address for display
   */
  shortenAddress(address: string, chars: number = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}

export const solanaWalletService = new SolanaWalletService();
export default SolanaWalletService;
