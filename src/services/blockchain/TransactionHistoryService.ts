/**
 * Transaction History Service
 *
 * Etherscan API를 사용하여 트랜잭션 히스토리를 조회합니다.
 */

import { TransactionHistory } from '../../types';
import { useNetworkStore } from '../../stores/networkStore';

// Etherscan API URLs (무료 티어는 rate limit 있음)
const ETHERSCAN_API_URLS: { [chainId: number]: string } = {
  1: 'https://api.etherscan.io/api',
  137: 'https://api.polygonscan.com/api',
  11155111: 'https://api-sepolia.etherscan.io/api',
  80002: 'https://api-amoy.polygonscan.com/api',
};

// 무료 API key (프로덕션에서는 환경변수로 관리)
const ETHERSCAN_API_KEY = 'YourApiKeyToken';

class TransactionHistoryService {
  /**
   * 일반 트랜잭션 히스토리 조회
   */
  async getTransactionHistory(
    address: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<TransactionHistory[]> {
    try {
      const { currentChain } = useNetworkStore.getState();
      const apiUrl = ETHERSCAN_API_URLS[currentChain.chainId];

      if (!apiUrl) {
        console.warn('Unsupported chain for transaction history');
        return [];
      }

      const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== '1' || !Array.isArray(data.result)) {
        return [];
      }

      return data.result.map((tx: any) => this.mapTransaction(tx, address));
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }

  /**
   * ERC20 토큰 전송 히스토리 조회
   */
  async getTokenTransferHistory(
    address: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<TransactionHistory[]> {
    try {
      const { currentChain } = useNetworkStore.getState();
      const apiUrl = ETHERSCAN_API_URLS[currentChain.chainId];

      if (!apiUrl) {
        return [];
      }

      const url = `${apiUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== '1' || !Array.isArray(data.result)) {
        return [];
      }

      return data.result.map((tx: any) => this.mapTokenTransaction(tx, address));
    } catch (error) {
      console.error('Failed to fetch token transfer history:', error);
      return [];
    }
  }

  /**
   * 전체 트랜잭션 히스토리 조회 (일반 + 토큰)
   */
  async getAllTransactionHistory(
    address: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<TransactionHistory[]> {
    try {
      const [normalTxs, tokenTxs] = await Promise.all([
        this.getTransactionHistory(address, page, pageSize),
        this.getTokenTransferHistory(address, page, pageSize),
      ]);

      // 두 배열을 합치고 timestamp로 정렬
      const allTxs = [...normalTxs, ...tokenTxs];
      allTxs.sort((a, b) => b.timestamp - a.timestamp);

      // 중복 제거 (같은 hash)
      const uniqueTxs = allTxs.filter(
        (tx, index, self) => index === self.findIndex((t) => t.hash === tx.hash)
      );

      return uniqueTxs.slice(0, pageSize);
    } catch (error) {
      console.error('Failed to fetch all transaction history:', error);
      return [];
    }
  }

  /**
   * 일반 트랜잭션 매핑
   */
  private mapTransaction(tx: any, userAddress: string): TransactionHistory {
    const isSend = tx.from.toLowerCase() === userAddress.toLowerCase();

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: parseInt(tx.timeStamp) * 1000,
      blockNumber: parseInt(tx.blockNumber),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      isError: tx.isError === '1',
      txType: tx.to === '' ? 'contract' : isSend ? 'send' : 'receive',
    };
  }

  /**
   * 토큰 트랜잭션 매핑
   */
  private mapTokenTransaction(tx: any, userAddress: string): TransactionHistory {
    const isSend = tx.from.toLowerCase() === userAddress.toLowerCase();

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: '0', // 네이티브 토큰 아님
      timestamp: parseInt(tx.timeStamp) * 1000,
      blockNumber: parseInt(tx.blockNumber),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      isError: false,
      txType: isSend ? 'send' : 'receive',
      tokenSymbol: tx.tokenSymbol,
      tokenName: tx.tokenName,
      tokenDecimal: parseInt(tx.tokenDecimal),
      tokenValue: tx.value,
    };
  }

  /**
   * 트랜잭션 값 포맷팅
   */
  formatValue(value: string, decimals: number = 18): string {
    const num = parseFloat(value) / Math.pow(10, decimals);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  }

  /**
   * 타임스탬프 포맷팅
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 1시간 이내
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }

    // 24시간 이내
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }

    // 7일 이내
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }

    // 그 이상
    return date.toLocaleDateString();
  }
}

export const transactionHistoryService = new TransactionHistoryService();
export default TransactionHistoryService;
