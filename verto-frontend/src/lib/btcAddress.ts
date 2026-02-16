/**
 * Bitcoin address validation
 * Supports all modern address formats (BIP173, BIP350, Base58Check)
 * Updated for SegWit v0 (bc1q), Taproot v1 (bc1p), and legacy formats
 */

/** Valid Bitcoin address patterns */
const BTC_PATTERNS = {
  // Mainnet — Bech32 SegWit v0 (bc1q) and Bech32m Taproot v1 (bc1p)
  // Charset: lowercase only, excludes 1/b/i/o per BIP173/BIP350
  bech32Mainnet: /^bc1[qp][ac-hj-np-z02-9]{38,58}$/,

  // Mainnet — Legacy P2PKH (1…) and P2SH (3…), Base58Check charset
  legacyMainnet: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,

  // Testnet — Bech32/Bech32m SegWit v0 (tb1q) and Taproot v1 (tb1p)
  bech32Testnet: /^tb1[qp][ac-hj-np-z02-9]{38,58}$/,

  // Testnet — Legacy P2PKH (m/n) and P2SH (2), Base58Check charset
  legacyTestnet: /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
};

/**
 * Check if a string is a valid Bitcoin address (mainnet or testnet)
 */
export function isValidBtcAddress(address: string): boolean {
  if (!address) return false;
  return Object.values(BTC_PATTERNS).some((pattern) => pattern.test(address));
}

export const BTC_ADDRESS_ERROR =
  "Enter a valid Bitcoin address (bc1…, 1…, 3…, tb1…, m…, n…, or 2…)";
