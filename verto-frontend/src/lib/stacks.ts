/**
 * Stacks blockchain integration utilities
 * Handles contract calls for escrow lifecycle
 *
 * All @stacks/* imports are dynamic to prevent Turbopack SSR module-eval failures.
 * These packages contain browser-only code that cannot run during Next.js prerendering.
 */

// ─── Contract Config ─────────────────────────────────────────────────────────

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME =
  process.env.NEXT_PUBLIC_CONTRACT_NAME || 'escrow-logic';

const NETWORK = (process.env.NEXT_PUBLIC_STACKS_NETWORK as 'testnet' | 'mainnet') || 'testnet';

// ─── Lazy module loaders ─────────────────────────────────────────────────────

async function getConnect() {
  return await import('@stacks/connect');
}

async function getTx() {
  return await import('@stacks/transactions');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function stxToMicrostacks(stx: number): number {
  return Math.round(stx * 1_000_000);
}

export function microstacksToStx(micro: number): number {
  return micro / 1_000_000;
}

// ─── Generic contract-call wrapper ───────────────────────────────────────────

async function callContract(
  functionName: string,
  functionArgs: unknown[],
): Promise<string | null> {
  const { openContractCall } = await getConnect();

  return new Promise((resolve, reject) => {
    try {
      openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        onFinish: (data: { txId: string }) => resolve(data.txId),
        onCancel: () => resolve(null),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } catch (e) {
      reject(e);
    }
  });
}

// ─── Contract Write Functions ────────────────────────────────────────────────

export async function contractCreateEscrow(
  freelancerAddress: string,
  amountMicrostacks: number,
  invoiceHash?: string,
): Promise<string | null> {
  const { uintCV, principalCV, noneCV, someCV, bufferCV } = await getTx();

  const functionArgs = [
    principalCV(freelancerAddress),
    uintCV(amountMicrostacks),
    invoiceHash
      ? someCV(bufferCV(Buffer.from(invoiceHash, 'hex')))
      : noneCV(),
  ];

  return callContract('create-escrow', functionArgs);
}

export async function contractFundEscrow(escrowId: number): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract('fund-escrow', [uintCV(escrowId)]);
}

export async function contractMarkDelivered(escrowId: number): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract('mark-delivered', [uintCV(escrowId)]);
}

export async function contractReleasePayment(escrowId: number): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract('release-payment', [uintCV(escrowId)]);
}

export async function contractRequestRevision(escrowId: number): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract('request-revision', [uintCV(escrowId)]);
}

export async function contractInitiateDispute(escrowId: number): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract('initiate-dispute', [uintCV(escrowId)]);
}

export async function contractCancelEscrow(escrowId: number): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract('cancel-escrow', [uintCV(escrowId)]);
}

// ─── Contract Read Functions ─────────────────────────────────────────────────

export async function readEscrow(escrowId: number) {
  try {
    const { fetchCallReadOnlyFunction, cvToValue, uintCV } = await getTx();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-escrow',
      functionArgs: [uintCV(escrowId)],
      senderAddress: CONTRACT_ADDRESS,
    });
    return cvToValue(result);
  } catch {
    return null;
  }
}

export async function readEscrowCount(): Promise<number> {
  try {
    const { fetchCallReadOnlyFunction, cvToValue } = await getTx();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-escrow-count',
      functionArgs: [],
      senderAddress: CONTRACT_ADDRESS,
    });
    const value = cvToValue(result);
    return typeof value === 'bigint' ? Number(value) : Number(value) || 0;
  } catch {
    return 0;
  }
}

export async function readIsReviewExpired(escrowId: number): Promise<boolean> {
  try {
    const { fetchCallReadOnlyFunction, cvToValue, uintCV } = await getTx();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'is-review-period-expired',
      functionArgs: [uintCV(escrowId)],
      senderAddress: CONTRACT_ADDRESS,
    });
    return cvToValue(result) === true;
  } catch {
    return false;
  }
}

// ─── Explorer Links ──────────────────────────────────────────────────────────

export function getExplorerTxUrl(txId: string): string {
  const base = 'https://explorer.stacks.co';
  return `${base}/txid/${txId}?chain=${NETWORK}`;
}

export { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK };
