/**
 * WalletService - 지갑 생성, 복구, 관리
 *
 * 중요: Non-custodial 지갑
 * - 니모닉과 프라이빗 키는 사용자 디바이스에만 저장
 * - 서버로 절대 전송하지 않음
 */

import { ethers, HDNodeWallet, Mnemonic } from 'ethers';
import { WalletAccount } from '../../types';
import { keyManager } from './KeyManager';
import 'react-native-get-random-values';

// BIP44 경로: m/44'/60'/0'/0/index
const DERIVATION_PATH = "m/44'/60'/0'/0/0";

class WalletService {
  /**
   * 새로운 니모닉 생성 (12단어)
   */
  generateMnemonic(): string {
    // Use crypto.getRandomValues directly via polyfill
    // 16 bytes of entropy = 12 word mnemonic (128 bits)
    const entropy = new Uint8Array(16);
    crypto.getRandomValues(entropy);
    const mnemonic = Mnemonic.fromEntropy(entropy);
    return mnemonic.phrase;
  }

  /**
   * 니모닉 유효성 검사
   */
  validateMnemonic(mnemonic: string): boolean {
    try {
      Mnemonic.fromPhrase(mnemonic.trim());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 니모닉으로부터 지갑 생성
   */
  createWalletFromMnemonic(mnemonic: string, index: number = 0): WalletAccount {
    const mnemonicObj = Mnemonic.fromPhrase(mnemonic.trim());
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = HDNodeWallet.fromMnemonic(mnemonicObj, path);

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: mnemonic.trim(),
    };
  }

  /**
   * 프라이빗 키로부터 지갑 복구
   */
  createWalletFromPrivateKey(privateKey: string): WalletAccount {
    const wallet = new ethers.Wallet(privateKey);

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  /**
   * 새 지갑 생성 및 저장
   */
  async createNewWallet(pin: string): Promise<WalletAccount | null> {
    try {
      // 1. 니모닉 생성
      const mnemonic = this.generateMnemonic();

      // 2. 지갑 생성
      const wallet = this.createWalletFromMnemonic(mnemonic);

      // 3. 니모닉 저장
      await keyManager.storeMnemonic(mnemonic, pin);

      // 4. 프라이빗 키 저장
      await keyManager.storePrivateKey(wallet.address, wallet.privateKey, pin);

      // 5. PIN 설정
      await keyManager.setPin(pin);

      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      return null;
    }
  }

  /**
   * 니모닉으로 지갑 복구 및 저장
   */
  async importWalletFromMnemonic(
    mnemonic: string,
    pin: string
  ): Promise<WalletAccount | null> {
    try {
      // 1. 유효성 검사
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic');
      }

      // 2. 지갑 생성
      const wallet = this.createWalletFromMnemonic(mnemonic);

      // 3. 니모닉 저장
      await keyManager.storeMnemonic(mnemonic, pin);

      // 4. 프라이빗 키 저장
      await keyManager.storePrivateKey(wallet.address, wallet.privateKey, pin);

      // 5. PIN 설정
      await keyManager.setPin(pin);

      return wallet;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      return null;
    }
  }

  /**
   * 프라이빗 키로 지갑 복구 및 저장
   */
  async importWalletFromPrivateKey(
    privateKey: string,
    pin: string
  ): Promise<WalletAccount | null> {
    try {
      // 1. 지갑 생성
      const wallet = this.createWalletFromPrivateKey(privateKey);

      // 2. 프라이빗 키 저장
      await keyManager.storePrivateKey(wallet.address, wallet.privateKey, pin);

      // 3. PIN 설정 (기존 PIN이 없는 경우에만)
      const hasPin = await keyManager.hasPin();
      if (!hasPin) {
        await keyManager.setPin(pin);
      }

      return wallet;
    } catch (error) {
      console.error('Failed to import wallet from private key:', error);
      return null;
    }
  }

  /**
   * 저장된 지갑 불러오기
   */
  async loadWallet(address: string, pin: string): Promise<WalletAccount | null> {
    try {
      const privateKey = await keyManager.retrievePrivateKey(address, pin);
      if (!privateKey) return null;

      return {
        address,
        privateKey,
      };
    } catch (error) {
      console.error('Failed to load wallet:', error);
      return null;
    }
  }

  /**
   * 저장된 모든 지갑 주소 가져오기
   */
  async getWalletAddresses(): Promise<string[]> {
    const wallets = await keyManager.getWalletList();
    return wallets.map((w) => w.address);
  }

  /**
   * 지갑 존재 여부 확인
   */
  async hasWallet(): Promise<boolean> {
    const wallets = await keyManager.getWalletList();
    return wallets.length > 0;
  }

  /**
   * 니모닉 표시용 단어 배열로 변환
   */
  mnemonicToWords(mnemonic: string): string[] {
    return mnemonic.trim().split(' ');
  }

  /**
   * 단어 배열을 니모닉으로 변환
   */
  wordsToMnemonic(words: string[]): string {
    return words.join(' ').trim();
  }

  /**
   * 주소 짧게 표시 (0x1234...5678)
   */
  shortenAddress(address: string, chars: number = 4): string {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }

  /**
   * 체크섬 주소로 변환
   */
  toChecksumAddress(address: string): string {
    return ethers.getAddress(address);
  }

  /**
   * 주소 유효성 검사
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}

export const walletService = new WalletService();
export default WalletService;
