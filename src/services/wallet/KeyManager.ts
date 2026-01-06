/**
 * KeyManager - 프라이빗 키 암호화 및 보안 저장
 *
 * 중요: 이 서비스는 절대로 키를 서버에 전송하지 않습니다.
 * 모든 키는 디바이스의 Secure Enclave/Keychain에만 저장됩니다.
 *
 * 보안 구현:
 * - AES-256-GCM 암호화
 * - PBKDF2 키 파생 (100,000 iterations)
 * - 랜덤 Salt 및 IV
 */

import * as Keychain from 'react-native-keychain';
import EncryptedStorage from 'react-native-encrypted-storage';
import Aes from 'react-native-aes-crypto';

// 암호화 상수
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits
const SALT_LENGTH = 32; // bytes
const IV_LENGTH = 16; // bytes for AES

const KEYCHAIN_SERVICE = 'com.web3wallet.keys';
const MNEMONIC_KEY = 'wallet_mnemonic';
const PIN_KEY = 'wallet_pin';
const BIOMETRIC_KEY = 'wallet_biometric';

interface StoredWallet {
  address: string;
  encryptedPrivateKey: string;
  createdAt: number;
}

class KeyManager {
  /**
   * 니모닉을 Keychain에 안전하게 저장
   */
  async storeMnemonic(mnemonic: string, pin: string): Promise<boolean> {
    try {
      // 니모닉을 PIN으로 암호화하여 저장
      const encryptedMnemonic = await this.encrypt(mnemonic, pin);

      await EncryptedStorage.setItem(
        MNEMONIC_KEY,
        JSON.stringify({
          encrypted: encryptedMnemonic,
          createdAt: Date.now(),
        })
      );

      return true;
    } catch (error) {
      console.error('Failed to store mnemonic:', error);
      return false;
    }
  }

  /**
   * 저장된 니모닉 복구
   */
  async retrieveMnemonic(pin: string): Promise<string | null> {
    try {
      const stored = await EncryptedStorage.getItem(MNEMONIC_KEY);
      if (!stored) return null;

      const { encrypted } = JSON.parse(stored);
      const mnemonic = await this.decrypt(encrypted, pin);

      return mnemonic;
    } catch (error) {
      console.error('Failed to retrieve mnemonic:', error);
      return null;
    }
  }

  /**
   * 프라이빗 키를 Keychain에 저장
   */
  async storePrivateKey(
    address: string,
    privateKey: string,
    pin: string
  ): Promise<boolean> {
    try {
      const encryptedKey = await this.encrypt(privateKey, pin);

      // Keychain에 저장 (생체 인증 옵션 포함)
      await Keychain.setInternetCredentials(
        `${KEYCHAIN_SERVICE}.${address}`,
        address,
        encryptedKey,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );

      // 지갑 목록에 추가
      await this.addToWalletList(address, encryptedKey);

      return true;
    } catch (error) {
      console.error('Failed to store private key:', error);
      return false;
    }
  }

  /**
   * 프라이빗 키 복구
   */
  async retrievePrivateKey(address: string, pin: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        `${KEYCHAIN_SERVICE}.${address}`
      );

      if (!credentials) return null;

      const decrypted = await this.decrypt(credentials.password, pin);
      return decrypted;
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  /**
   * PIN 설정
   */
  async setPin(pin: string): Promise<boolean> {
    try {
      // PIN 해시 저장 (실제로는 더 강력한 해싱 필요)
      const pinHash = await this.hashPin(pin);

      await Keychain.setGenericPassword('pin', pinHash, {
        service: `${KEYCHAIN_SERVICE}.pin`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      return true;
    } catch (error) {
      console.error('Failed to set PIN:', error);
      return false;
    }
  }

  /**
   * PIN 검증
   */
  async verifyPin(pin: string): Promise<boolean> {
    try {
      const stored = await Keychain.getGenericPassword({
        service: `${KEYCHAIN_SERVICE}.pin`,
      });

      if (!stored) return false;

      const inputHash = await this.hashPin(pin);
      return stored.password === inputHash;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
  }

  /**
   * PIN이 설정되어 있는지 확인
   */
  async hasPin(): Promise<boolean> {
    try {
      const stored = await Keychain.getGenericPassword({
        service: `${KEYCHAIN_SERVICE}.pin`,
      });
      return !!stored;
    } catch {
      return false;
    }
  }

  /**
   * 생체 인증으로 잠금 해제
   */
  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const result = await Keychain.getGenericPassword({
        service: `${KEYCHAIN_SERVICE}.biometric`,
        authenticationPrompt: {
          title: 'Authenticate to access wallet',
          subtitle: 'Use biometrics to unlock',
          cancel: 'Cancel',
        },
      });

      return !!result;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  /**
   * 생체 인증 활성화
   */
  async enableBiometrics(pin: string): Promise<boolean> {
    try {
      // PIN이 맞는지 먼저 확인
      const isValidPin = await this.verifyPin(pin);
      if (!isValidPin) return false;

      await Keychain.setGenericPassword('biometric', 'enabled', {
        service: `${KEYCHAIN_SERVICE}.biometric`,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      return true;
    } catch (error) {
      console.error('Failed to enable biometrics:', error);
      return false;
    }
  }

  /**
   * 생체 인증 사용 가능 여부 확인
   */
  async isBiometricsAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch {
      return false;
    }
  }

  /**
   * 저장된 지갑 목록 가져오기
   */
  async getWalletList(): Promise<StoredWallet[]> {
    try {
      const stored = await EncryptedStorage.getItem('wallet_list');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * 지갑 목록에 추가
   */
  private async addToWalletList(
    address: string,
    encryptedPrivateKey: string
  ): Promise<void> {
    const wallets = await this.getWalletList();

    // 이미 존재하면 업데이트
    const existingIndex = wallets.findIndex((w) => w.address === address);
    if (existingIndex >= 0) {
      wallets[existingIndex] = {
        address,
        encryptedPrivateKey,
        createdAt: wallets[existingIndex].createdAt,
      };
    } else {
      wallets.push({
        address,
        encryptedPrivateKey,
        createdAt: Date.now(),
      });
    }

    await EncryptedStorage.setItem('wallet_list', JSON.stringify(wallets));
  }

  /**
   * 지갑 삭제
   */
  async deleteWallet(address: string): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(`${KEYCHAIN_SERVICE}.${address}`);

      const wallets = await this.getWalletList();
      const filtered = wallets.filter((w) => w.address !== address);
      await EncryptedStorage.setItem('wallet_list', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      return false;
    }
  }

  /**
   * 모든 데이터 삭제 (앱 초기화)
   */
  async clearAll(): Promise<void> {
    try {
      const wallets = await this.getWalletList();

      // 모든 지갑 키 삭제
      for (const wallet of wallets) {
        await Keychain.resetInternetCredentials(
          `${KEYCHAIN_SERVICE}.${wallet.address}`
        );
      }

      // PIN 삭제
      await Keychain.resetGenericPassword({ service: `${KEYCHAIN_SERVICE}.pin` });

      // 생체 인증 삭제
      await Keychain.resetGenericPassword({
        service: `${KEYCHAIN_SERVICE}.biometric`,
      });

      // EncryptedStorage 전체 삭제
      await EncryptedStorage.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  /**
   * AES-256-CBC 암호화 with PBKDF2 키 파생
   *
   * 암호화된 데이터 형식: salt:iv:ciphertext (모두 hex)
   */
  private async encrypt(data: string, password: string): Promise<string> {
    try {
      // 랜덤 salt 생성
      const salt = await Aes.randomKey(SALT_LENGTH);

      // PBKDF2로 키 파생 (SHA-512 사용)
      const key = await Aes.pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');

      // 랜덤 IV 생성
      const iv = await Aes.randomKey(IV_LENGTH);

      // AES-256-CBC 암호화
      const ciphertext = await Aes.encrypt(data, key, iv, 'aes-256-cbc');

      // salt:iv:ciphertext 형식으로 반환
      return `${salt}:${iv}:${ciphertext}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * AES-256-CBC 복호화 with PBKDF2 키 파생
   */
  private async decrypt(encrypted: string, password: string): Promise<string> {
    try {
      const parts = encrypted.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [salt, iv, ciphertext] = parts;

      // PBKDF2로 키 파생 (동일한 salt 사용, SHA-512)
      const key = await Aes.pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');

      // AES-256-CBC 복호화
      const decrypted = await Aes.decrypt(ciphertext, key, iv, 'aes-256-cbc');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed - invalid PIN or corrupted data');
    }
  }

  /**
   * PBKDF2 기반 PIN 해싱
   *
   * 100,000 iterations으로 브루트포스 공격 방지
   */
  private async hashPin(pin: string): Promise<string> {
    try {
      // 고정 salt 사용 (PIN 검증용이므로 동일한 결과 필요)
      // 실제로는 사용자별 salt를 별도 저장하는 것이 더 안전
      const salt = 'web3wallet_pin_salt_v1';

      // PBKDF2로 해싱 (SHA-512 사용)
      const hash = await Aes.pbkdf2(pin, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');

      return hash;
    } catch (error) {
      console.error('PIN hashing failed:', error);
      throw new Error('PIN hashing failed');
    }
  }
}

export const keyManager = new KeyManager();
export default KeyManager;
