/**
 * PriceService - Cryptocurrency Price Fetching
 *
 * Uses CoinGecko API to fetch real-time prices
 * Supports ETH, MATIC, SOL, BNB, AVAX and more
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const CACHE_KEY = 'price_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Coin ID mapping for CoinGecko
const COIN_IDS: Record<string, string> = {
  ETH: 'ethereum',
  MATIC: 'matic-network',
  SOL: 'solana',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  ARB: 'arbitrum',
  OP: 'optimism',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
};

// Supported fiat currencies
type FiatCurrency = 'usd' | 'krw' | 'eur' | 'jpy';

export interface PriceData {
  [symbol: string]: {
    usd: number;
    krw?: number;
    usd_24h_change?: number;
    last_updated?: number;
  };
}

interface CacheData {
  prices: PriceData;
  timestamp: number;
}

class PriceService {
  private cache: PriceData = {};
  private lastFetch: number = 0;

  /**
   * Get prices for multiple coins
   */
  async getPrices(symbols: string[]): Promise<PriceData> {
    // Check cache first
    const cached = await this.getCachedPrices();
    if (cached && Date.now() - this.lastFetch < CACHE_DURATION) {
      return this.filterPrices(cached, symbols);
    }

    try {
      // Map symbols to CoinGecko IDs
      const ids = symbols
        .map((s) => COIN_IDS[s.toUpperCase()] || s.toLowerCase())
        .filter(Boolean)
        .join(',');

      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd,krw&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform to our format
      const prices: PriceData = {};
      for (const symbol of symbols) {
        const coinId = COIN_IDS[symbol.toUpperCase()] || symbol.toLowerCase();
        if (data[coinId]) {
          prices[symbol.toUpperCase()] = {
            usd: data[coinId].usd || 0,
            krw: data[coinId].krw || 0,
            usd_24h_change: data[coinId].usd_24h_change || 0,
            last_updated: Date.now(),
          };
        }
      }

      // Update cache
      this.cache = { ...this.cache, ...prices };
      this.lastFetch = Date.now();
      await this.saveCachedPrices(this.cache);

      return prices;
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      // Return cached data if available
      return cached || {};
    }
  }

  /**
   * Get price for a single coin
   */
  async getPrice(symbol: string): Promise<number> {
    const prices = await this.getPrices([symbol]);
    return prices[symbol.toUpperCase()]?.usd || 0;
  }

  /**
   * Convert crypto amount to fiat
   */
  async convertToFiat(
    amount: number,
    symbol: string,
    currency: FiatCurrency = 'usd'
  ): Promise<number> {
    const prices = await this.getPrices([symbol]);
    const priceData = prices[symbol.toUpperCase()];

    if (!priceData) return 0;

    const price = currency === 'krw' ? priceData.krw || 0 : priceData.usd;
    return amount * price;
  }

  /**
   * Get 24h price change percentage
   */
  async get24hChange(symbol: string): Promise<number> {
    const prices = await this.getPrices([symbol]);
    return prices[symbol.toUpperCase()]?.usd_24h_change || 0;
  }

  /**
   * Format price with currency symbol
   */
  formatPrice(amount: number, currency: FiatCurrency = 'usd'): string {
    const formatters: Record<FiatCurrency, Intl.NumberFormat> = {
      usd: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      krw: new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      eur: new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      jpy: new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    };

    return formatters[currency].format(amount);
  }

  /**
   * Format change percentage
   */
  formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * Get all supported coin symbols
   */
  getSupportedCoins(): string[] {
    return Object.keys(COIN_IDS);
  }

  // Private methods

  private async getCachedPrices(): Promise<PriceData | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CacheData = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          this.cache = data.prices;
          this.lastFetch = data.timestamp;
          return data.prices;
        }
      }
    } catch (error) {
      console.error('Failed to get cached prices:', error);
    }
    return null;
  }

  private async saveCachedPrices(prices: PriceData): Promise<void> {
    try {
      const data: CacheData = {
        prices,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cached prices:', error);
    }
  }

  private filterPrices(prices: PriceData, symbols: string[]): PriceData {
    const filtered: PriceData = {};
    for (const symbol of symbols) {
      const key = symbol.toUpperCase();
      if (prices[key]) {
        filtered[key] = prices[key];
      }
    }
    return filtered;
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.cache = {};
    this.lastFetch = 0;
    await AsyncStorage.removeItem(CACHE_KEY);
  }
}

export const priceService = new PriceService();
export default PriceService;
