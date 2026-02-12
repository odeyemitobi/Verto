/**
 * BTC/USD price conversion service
 * Uses CoinGecko free API (no key needed)
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION_MS = 60_000; // Cache price for 60 seconds

let cachedPrice: { usd: number; timestamp: number } | null = null;

/**
 * Fetch current BTC price in USD from CoinGecko
 */
export async function fetchBtcPrice(): Promise<number> {
  // Return cached price if still fresh
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION_MS) {
    return cachedPrice.usd;
  }

  try {
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`,
      { next: { revalidate: 60 } },
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();
    const price = data.bitcoin?.usd;

    if (typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid price data');
    }

    cachedPrice = { usd: price, timestamp: Date.now() };
    return price;
  } catch (error) {
    // Fallback: return cached price even if stale, or a reasonable default
    if (cachedPrice) {
      return cachedPrice.usd;
    }
    console.error('Failed to fetch BTC price:', error);
    // Return 0 to indicate price unavailable
    return 0;
  }
}

/**
 * Convert USD amount to BTC
 */
export async function usdToBtc(usdAmount: number): Promise<number> {
  const price = await fetchBtcPrice();
  if (price <= 0) return 0;
  return usdAmount / price;
}

/**
 * Convert BTC amount to USD
 */
export async function btcToUsd(btcAmount: number): Promise<number> {
  const price = await fetchBtcPrice();
  return btcAmount * price;
}

/**
 * Format BTC amount with proper precision
 */
export function formatBtcAmount(btc: number): string {
  if (btc === 0) return '0.00000000';
  if (btc < 0.00001) return btc.toExponential(2);
  return btc.toFixed(8);
}

/**
 * React hook-compatible price fetcher
 * Returns a function that can be called to get price
 */
export function createPriceFetcher() {
  let lastPrice = 0;
  let fetching = false;

  return async (): Promise<number> => {
    if (fetching) return lastPrice;
    fetching = true;
    try {
      lastPrice = await fetchBtcPrice();
      return lastPrice;
    } finally {
      fetching = false;
    }
  };
}
