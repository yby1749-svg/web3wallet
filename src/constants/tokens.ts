import { Token } from '../types';

// 기본 토큰 목록 (자주 사용되는 토큰)
export const DEFAULT_TOKENS: Record<number, Token[]> = {
  // Ethereum Mainnet
  1: [
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    },
    {
      address: '0x6B175474E89094C44Da98b954EescdeCB5b7Fabc',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    },
  ],
  // Polygon
  137: [
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    },
    {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    },
    {
      address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    },
  ],
};

// ERC20 ABI (토큰 조회에 필요한 최소 ABI)
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// 가격 조회용 코인 ID 매핑 (CoinGecko)
export const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  MATIC: 'matic-network',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
};
