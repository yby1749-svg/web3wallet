/**
 * TokenService - 토큰 잔액 및 정보 조회
 */

import { ethers, Contract } from 'ethers';
import { Token, NativeToken, PriceData } from '../../types';
import { providerService } from './ProviderService';
import { ERC20_ABI, DEFAULT_TOKENS, COINGECKO_IDS } from '../../constants/tokens';
import { CHAINS } from '../../constants/chains';

class TokenService {
  private priceCache: PriceData = {};
  private priceCacheTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1분

  /**
   * 네이티브 토큰 잔액 조회
   */
  async getNativeBalance(address: string, chainId?: number): Promise<NativeToken> {
    const chain = CHAINS[chainId || providerService.getCurrentChainId()];
    const balance = await providerService.getBalance(address, chainId);

    // 가격 조회
    const prices = await this.getPrices([chain.symbol]);
    const priceUsd = prices[chain.symbol]?.usd || 0;
    const balanceNum = parseFloat(balance);

    return {
      symbol: chain.symbol,
      name: chain.name,
      decimals: 18,
      balance,
      balanceUSD: balanceNum * priceUsd,
    };
  }

  /**
   * ERC20 토큰 잔액 조회
   */
  async getTokenBalance(
    address: string,
    tokenAddress: string,
    chainId?: number
  ): Promise<string> {
    const provider = providerService.getProvider(chainId);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();

    return ethers.formatUnits(balance, decimals);
  }

  /**
   * 토큰 정보 조회
   */
  async getTokenInfo(tokenAddress: string, chainId?: number): Promise<Token> {
    const provider = providerService.getProvider(chainId);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
    };
  }

  /**
   * 기본 토큰 목록 + 잔액 조회
   */
  async getTokensWithBalance(
    address: string,
    chainId?: number
  ): Promise<Token[]> {
    const currentChainId = chainId || providerService.getCurrentChainId();
    const defaultTokens = DEFAULT_TOKENS[currentChainId] || [];

    const tokensWithBalance = await Promise.all(
      defaultTokens.map(async (token) => {
        try {
          const balance = await this.getTokenBalance(
            address,
            token.address,
            currentChainId
          );

          // 가격 조회
          const prices = await this.getPrices([token.symbol]);
          const priceUsd = prices[token.symbol]?.usd || 0;
          const balanceNum = parseFloat(balance);

          return {
            ...token,
            balance,
            balanceUSD: balanceNum * priceUsd,
          };
        } catch (error) {
          console.warn(`Failed to get balance for ${token.symbol}:`, error);
          return {
            ...token,
            balance: '0',
            balanceUSD: 0,
          };
        }
      })
    );

    // 잔액이 0보다 큰 토큰만 반환 (선택적)
    return tokensWithBalance;
  }

  /**
   * 전체 자산 조회 (네이티브 + 토큰)
   */
  async getAllAssets(
    address: string,
    chainId?: number
  ): Promise<{ native: NativeToken; tokens: Token[] }> {
    const [native, tokens] = await Promise.all([
      this.getNativeBalance(address, chainId),
      this.getTokensWithBalance(address, chainId),
    ]);

    return { native, tokens };
  }

  /**
   * 총 자산 가치 계산 (USD)
   */
  async getTotalValueUSD(address: string, chainId?: number): Promise<number> {
    const { native, tokens } = await this.getAllAssets(address, chainId);

    const nativeValue = native.balanceUSD || 0;
    const tokensValue = tokens.reduce((sum, t) => sum + (t.balanceUSD || 0), 0);

    return nativeValue + tokensValue;
  }

  /**
   * 가격 조회 (CoinGecko API)
   */
  async getPrices(symbols: string[]): Promise<PriceData> {
    // 캐시 확인
    const now = Date.now();
    if (now - this.priceCacheTime < this.CACHE_DURATION) {
      return this.priceCache;
    }

    try {
      const ids = symbols
        .map((s) => COINGECKO_IDS[s])
        .filter(Boolean)
        .join(',');

      if (!ids) return {};

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data = await response.json();

      // 심볼로 매핑
      const prices: PriceData = {};
      for (const symbol of symbols) {
        const id = COINGECKO_IDS[symbol];
        if (id && data[id]) {
          prices[symbol] = {
            usd: data[id].usd,
            usd_24h_change: data[id].usd_24h_change,
          };
        }
      }

      this.priceCache = prices;
      this.priceCacheTime = now;

      return prices;
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      return this.priceCache; // 에러 시 캐시 반환
    }
  }

  /**
   * 토큰 Allowance 조회
   */
  async getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
    chainId?: number
  ): Promise<string> {
    const provider = providerService.getProvider(chainId);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    const allowance = await contract.allowance(owner, spender);
    const decimals = await contract.decimals();

    return ethers.formatUnits(allowance, decimals);
  }

  /**
   * 토큰 Approve 트랜잭션 데이터 생성
   */
  buildApproveData(
    spender: string,
    amount: string,
    decimals: number
  ): string {
    const iface = new ethers.Interface(ERC20_ABI);
    return iface.encodeFunctionData('approve', [
      spender,
      ethers.parseUnits(amount, decimals),
    ]);
  }

  /**
   * 무제한 Approve 트랜잭션 데이터 생성
   */
  buildUnlimitedApproveData(spender: string): string {
    const iface = new ethers.Interface(ERC20_ABI);
    return iface.encodeFunctionData('approve', [
      spender,
      ethers.MaxUint256,
    ]);
  }
}

export const tokenService = new TokenService();
export default TokenService;
