/**
 * Mempool.space API integration for payment detection
 * Auto-detects testnet vs mainnet based on address format
 */

const MEMPOOL_MAINNET = "https://mempool.space/api";
const MEMPOOL_TESTNET = "https://mempool.space/testnet/api";

/**
 * Detect if an address is a Bitcoin testnet address
 * Testnet addresses start with: tb1 (bech32), m/n (P2PKH), 2 (P2SH)
 */
function isTestnetAddress(address: string): boolean {
  return (
    address.startsWith("tb1") ||
    address.startsWith("m") ||
    address.startsWith("n") ||
    address.startsWith("2")
  );
}

function getMempoolApi(address: string): string {
  return isTestnetAddress(address) ? MEMPOOL_TESTNET : MEMPOOL_MAINNET;
}

export interface AddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

export interface Transaction {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  vout: Array<{
    scriptpubkey_address?: string;
    value: number;
  }>;
}

/**
 * Get address balance info from mempool.space
 */
export async function getAddressInfo(
  address: string,
): Promise<AddressInfo | null> {
  try {
    const res = await fetch(`${getMempoolApi(address)}/address/${address}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get transactions for an address
 */
export async function getAddressTransactions(
  address: string,
): Promise<Transaction[]> {
  try {
    const res = await fetch(`${getMempoolApi(address)}/address/${address}/txs`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Check if a specific amount (in satoshis) has been received at an address
 * Returns the transaction hash if found, null otherwise
 */
export async function checkPaymentReceived(
  address: string,
  expectedAmountSats: number,
  tolerance = 0.01, // 1% tolerance for network fees
): Promise<{ txHash: string; amountSats: number; confirmed: boolean } | null> {
  const txs = await getAddressTransactions(address);

  for (const tx of txs) {
    // Sum all outputs to this address
    const receivedSats = tx.vout
      .filter((out) => out.scriptpubkey_address === address)
      .reduce((sum, out) => sum + out.value, 0);

    // Check if received amount matches expected (within tolerance)
    const minAccepted = expectedAmountSats * (1 - tolerance);
    if (receivedSats >= minAccepted) {
      return {
        txHash: tx.txid,
        amountSats: receivedSats,
        confirmed: tx.status.confirmed,
      };
    }
  }

  return null;
}

/**
 * Get total received balance for an address (in satoshis)
 */
export async function getAddressBalance(address: string): Promise<{
  confirmed: number;
  unconfirmed: number;
  total: number;
} | null> {
  const info = await getAddressInfo(address);
  if (!info) return null;

  const confirmed =
    info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum;
  const unconfirmed =
    info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum;

  return {
    confirmed,
    unconfirmed,
    total: confirmed + unconfirmed,
  };
}

/**
 * Convert satoshis to BTC
 */
export function satsToBtc(sats: number): number {
  return sats / 100_000_000;
}

/**
 * Convert BTC to satoshis
 */
export function btcToSats(btc: number): number {
  return Math.round(btc * 100_000_000);
}

/**
 * Get explorer URL for a transaction
 */
export function getMempoolTxUrl(txHash: string): string {
  return `https://mempool.space/tx/${txHash}`;
}
