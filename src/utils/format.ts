/**
 * 포맷팅 유틸리티
 */

/**
 * 주소 짧게 표시
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 숫자 포맷팅 (천 단위 구분)
 */
export function formatNumber(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 통화 포맷팅
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'USD'
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
}

/**
 * 토큰 잔액 포맷팅 (큰 숫자는 축약)
 */
export function formatBalance(
  balance: string | number,
  decimals: number = 4
): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0';

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  if (num < 0.0001 && num > 0) {
    return '<0.0001';
  }

  return num.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Gas price 포맷팅 (Gwei)
 */
export function formatGwei(gwei: string | number): string {
  const num = typeof gwei === 'string' ? parseFloat(gwei) : gwei;
  return `${num.toFixed(2)} Gwei`;
}

/**
 * 날짜 포맷팅
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 시간 포맷팅
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * 트랜잭션 해시 짧게 표시
 */
export function shortenTxHash(hash: string, chars: number = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}
