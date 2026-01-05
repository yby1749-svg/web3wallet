/**
 * 유효성 검사 유틸리티
 */

import { ethers } from 'ethers';

/**
 * 이더리움 주소 유효성 검사
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * 니모닉 유효성 검사
 */
export function isValidMnemonic(mnemonic: string): boolean {
  try {
    ethers.Mnemonic.fromPhrase(mnemonic.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * 프라이빗 키 유효성 검사
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 금액 유효성 검사
 */
export function isValidAmount(amount: string): boolean {
  if (!amount || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * PIN 유효성 검사 (6자리 숫자)
 */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * 충분한 잔액 확인
 */
export function hasEnoughBalance(
  balance: string,
  amount: string,
  gasFee: string = '0'
): boolean {
  const balanceNum = parseFloat(balance);
  const amountNum = parseFloat(amount);
  const gasNum = parseFloat(gasFee);

  return balanceNum >= amountNum + gasNum;
}

/**
 * 입력값 sanitize
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * 주소 체크섬 변환
 */
export function toChecksumAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch {
    return address;
  }
}
