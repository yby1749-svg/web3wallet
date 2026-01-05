/**
 * TransactionService - 트랜잭션 서명 및 전송
 *
 * 중요: 모든 서명은 사용자 디바이스에서만 수행됩니다.
 * 서버로 프라이빗 키나 서명 데이터를 전송하지 않습니다.
 */

import { ethers, Wallet, TransactionRequest as EthersTransactionRequest } from 'ethers';
import { TransactionRequest, Transaction, GasFee } from '../../types';
import { providerService } from '../blockchain/ProviderService';
import { ERC20_ABI } from '../../constants/tokens';

class TransactionService {
  /**
   * 네이티브 토큰 전송 트랜잭션 생성
   */
  async buildNativeTransfer(
    to: string,
    amount: string,
    gasPrice?: string
  ): Promise<EthersTransactionRequest> {
    const chainId = providerService.getCurrentChainId();

    const tx: EthersTransactionRequest = {
      to,
      value: ethers.parseEther(amount),
      chainId,
    };

    if (gasPrice) {
      tx.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
    }

    return tx;
  }

  /**
   * ERC20 토큰 전송 트랜잭션 생성
   */
  async buildTokenTransfer(
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
    gasPrice?: string
  ): Promise<EthersTransactionRequest> {
    const chainId = providerService.getCurrentChainId();
    const provider = providerService.getProvider();

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const data = tokenContract.interface.encodeFunctionData('transfer', [
      to,
      ethers.parseUnits(amount, decimals),
    ]);

    const tx: EthersTransactionRequest = {
      to: tokenAddress,
      data,
      chainId,
    };

    if (gasPrice) {
      tx.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
    }

    return tx;
  }

  /**
   * 트랜잭션 서명 및 전송
   *
   * 중요: privateKey는 메모리에만 존재하며 이 함수 실행 후 삭제됩니다.
   */
  async signAndSend(
    privateKey: string,
    tx: EthersTransactionRequest
  ): Promise<string> {
    const provider = providerService.getProvider();
    const wallet = new Wallet(privateKey, provider);

    // Nonce 설정
    if (!tx.nonce) {
      tx.nonce = await provider.getTransactionCount(wallet.address, 'pending');
    }

    // Gas limit 추정
    if (!tx.gasLimit) {
      tx.gasLimit = await provider.estimateGas({
        ...tx,
        from: wallet.address,
      });
    }

    // Gas price 설정
    if (!tx.gasPrice && !tx.maxFeePerGas) {
      const feeData = await provider.getFeeData();
      tx.gasPrice = feeData.gasPrice;
    }

    // 트랜잭션 서명 및 전송
    const txResponse = await wallet.sendTransaction(tx);

    return txResponse.hash;
  }

  /**
   * 트랜잭션만 서명 (전송하지 않음)
   */
  async signTransaction(
    privateKey: string,
    tx: EthersTransactionRequest
  ): Promise<string> {
    const provider = providerService.getProvider();
    const wallet = new Wallet(privateKey, provider);

    // Nonce 설정
    if (!tx.nonce) {
      tx.nonce = await provider.getTransactionCount(wallet.address, 'pending');
    }

    // Gas limit 추정
    if (!tx.gasLimit) {
      tx.gasLimit = await provider.estimateGas({
        ...tx,
        from: wallet.address,
      });
    }

    // Gas price 설정
    if (!tx.gasPrice && !tx.maxFeePerGas) {
      const feeData = await provider.getFeeData();
      tx.gasPrice = feeData.gasPrice;
    }

    // 트랜잭션 서명
    return await wallet.signTransaction(tx);
  }

  /**
   * 메시지 서명
   */
  async signMessage(privateKey: string, message: string): Promise<string> {
    const wallet = new Wallet(privateKey);
    return await wallet.signMessage(message);
  }

  /**
   * EIP-712 타입 데이터 서명
   */
  async signTypedData(
    privateKey: string,
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, unknown>
  ): Promise<string> {
    const wallet = new Wallet(privateKey);
    return await wallet.signTypedData(domain, types, value);
  }

  /**
   * 가스비 계산 (ETH 단위)
   */
  calculateGasFee(gasLimit: bigint, gasPrice: bigint): string {
    const fee = gasLimit * gasPrice;
    return ethers.formatEther(fee);
  }

  /**
   * 트랜잭션 속도 옵션 (Slow/Normal/Fast)
   */
  async getSpeedOptions(): Promise<GasFee> {
    const options = await providerService.getGasFeeOptions();

    return {
      slow: {
        gasPrice: options.slow.gasPrice,
        estimatedTime: options.slow.label,
      },
      normal: {
        gasPrice: options.normal.gasPrice,
        estimatedTime: options.normal.label,
      },
      fast: {
        gasPrice: options.fast.gasPrice,
        estimatedTime: options.fast.label,
      },
    };
  }

  /**
   * 트랜잭션 상태 확인
   */
  async getTransactionStatus(
    txHash: string
  ): Promise<'pending' | 'confirmed' | 'failed'> {
    const receipt = await providerService.getTransactionReceipt(txHash);

    if (!receipt) {
      return 'pending';
    }

    return receipt.status === 1 ? 'confirmed' : 'failed';
  }

  /**
   * 트랜잭션 확인 대기
   */
  async waitForConfirmation(
    txHash: string,
    confirmations: number = 1
  ): Promise<boolean> {
    const receipt = await providerService.waitForTransaction(txHash, confirmations);
    return receipt?.status === 1;
  }

  /**
   * 트랜잭션 취소 (RBF - Replace By Fee)
   */
  async cancelTransaction(
    privateKey: string,
    nonce: number,
    gasPrice: string
  ): Promise<string> {
    const wallet = new Wallet(privateKey);

    // 자신에게 0 ETH 전송 (같은 nonce로)
    const tx: EthersTransactionRequest = {
      to: wallet.address,
      value: BigInt(0),
      nonce,
      gasPrice: ethers.parseUnits(gasPrice, 'gwei'),
      gasLimit: BigInt(21000),
      chainId: providerService.getCurrentChainId(),
    };

    return await this.signAndSend(privateKey, tx);
  }

  /**
   * 트랜잭션 속도 높이기 (RBF)
   */
  async speedUpTransaction(
    privateKey: string,
    originalTx: EthersTransactionRequest,
    newGasPrice: string
  ): Promise<string> {
    const tx = {
      ...originalTx,
      gasPrice: ethers.parseUnits(newGasPrice, 'gwei'),
    };

    return await this.signAndSend(privateKey, tx);
  }
}

export const transactionService = new TransactionService();
export default TransactionService;
