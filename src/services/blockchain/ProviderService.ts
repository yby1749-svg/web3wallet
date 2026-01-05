/**
 * ProviderService - 블록체인 RPC 연결 관리
 */

import { ethers, JsonRpcProvider, Network } from 'ethers';
import { CHAINS, DEFAULT_CHAIN_ID } from '../../constants/chains';
import { Chain } from '../../types';

class ProviderService {
  private providers: Map<number, JsonRpcProvider> = new Map();
  private currentChainId: number = DEFAULT_CHAIN_ID;

  /**
   * 특정 체인의 provider 가져오기
   */
  getProvider(chainId?: number): JsonRpcProvider {
    const targetChainId = chainId || this.currentChainId;

    if (!this.providers.has(targetChainId)) {
      const chain = CHAINS[targetChainId];
      if (!chain) {
        throw new Error(`Unsupported chain: ${targetChainId}`);
      }

      const provider = new JsonRpcProvider(chain.rpcUrl, {
        chainId: targetChainId,
        name: chain.name,
      });

      this.providers.set(targetChainId, provider);
    }

    return this.providers.get(targetChainId)!;
  }

  /**
   * 현재 체인 변경
   */
  setCurrentChain(chainId: number): void {
    if (!CHAINS[chainId]) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    this.currentChainId = chainId;
  }

  /**
   * 현재 체인 ID 가져오기
   */
  getCurrentChainId(): number {
    return this.currentChainId;
  }

  /**
   * 현재 체인 정보 가져오기
   */
  getCurrentChain(): Chain {
    return CHAINS[this.currentChainId];
  }

  /**
   * 네이티브 토큰 잔액 조회
   */
  async getBalance(address: string, chainId?: number): Promise<string> {
    const provider = this.getProvider(chainId);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * 가스 가격 조회
   */
  async getGasPrice(chainId?: number): Promise<bigint> {
    const provider = this.getProvider(chainId);
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  /**
   * 가스 추정
   */
  async estimateGas(
    from: string,
    to: string,
    value: string,
    data?: string,
    chainId?: number
  ): Promise<bigint> {
    const provider = this.getProvider(chainId);

    const tx: ethers.TransactionRequest = {
      from,
      to,
      value: ethers.parseEther(value),
      data,
    };

    return await provider.estimateGas(tx);
  }

  /**
   * 가스비 옵션 조회 (Low/Normal/High)
   */
  async getGasFeeOptions(chainId?: number): Promise<{
    slow: { gasPrice: string; label: string };
    normal: { gasPrice: string; label: string };
    fast: { gasPrice: string; label: string };
  }> {
    const provider = this.getProvider(chainId);
    const feeData = await provider.getFeeData();
    const baseGasPrice = feeData.gasPrice || BigInt(0);

    return {
      slow: {
        gasPrice: ethers.formatUnits(baseGasPrice * BigInt(80) / BigInt(100), 'gwei'),
        label: '~5 min',
      },
      normal: {
        gasPrice: ethers.formatUnits(baseGasPrice, 'gwei'),
        label: '~2 min',
      },
      fast: {
        gasPrice: ethers.formatUnits(baseGasPrice * BigInt(120) / BigInt(100), 'gwei'),
        label: '~30 sec',
      },
    };
  }

  /**
   * 트랜잭션 조회
   */
  async getTransaction(txHash: string, chainId?: number) {
    const provider = this.getProvider(chainId);
    return await provider.getTransaction(txHash);
  }

  /**
   * 트랜잭션 영수증 조회
   */
  async getTransactionReceipt(txHash: string, chainId?: number) {
    const provider = this.getProvider(chainId);
    return await provider.getTransactionReceipt(txHash);
  }

  /**
   * 트랜잭션 대기
   */
  async waitForTransaction(txHash: string, confirmations: number = 1, chainId?: number) {
    const provider = this.getProvider(chainId);
    return await provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * 현재 블록 번호 조회
   */
  async getBlockNumber(chainId?: number): Promise<number> {
    const provider = this.getProvider(chainId);
    return await provider.getBlockNumber();
  }

  /**
   * 네트워크 연결 상태 확인
   */
  async isConnected(chainId?: number): Promise<boolean> {
    try {
      const provider = this.getProvider(chainId);
      await provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Nonce 조회
   */
  async getNonce(address: string, chainId?: number): Promise<number> {
    const provider = this.getProvider(chainId);
    return await provider.getTransactionCount(address, 'pending');
  }

  /**
   * 커스텀 RPC 추가
   */
  addCustomRpc(chainId: number, rpcUrl: string): void {
    const provider = new JsonRpcProvider(rpcUrl, chainId);
    this.providers.set(chainId, provider);
  }

  /**
   * Provider 캐시 초기화
   */
  clearProviders(): void {
    this.providers.clear();
  }
}

export const providerService = new ProviderService();
export default ProviderService;
