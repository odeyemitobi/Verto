/**
 * Stacks blockchain integration utilities
 * Handles contract calls for escrow lifecycle
 *
 * All @stacks/* imports are dynamic to prevent Turbopack SSR module-eval failures.
 * These packages contain browser-only code that cannot run during Next.js prerendering.
 */

// ─── Contract Config ─────────────────────────────────────────────────────────

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || "escrow-logic";

const NETWORK =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as "testnet" | "mainnet") ||
  "testnet";

// ─── Lazy module loaders ─────────────────────────────────────────────────────

async function getConnect() {
  return await import("@stacks/connect");
}

async function getTx() {
  return await import("@stacks/transactions");
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
  const { STACKS_TESTNET, STACKS_MAINNET } = await import("@stacks/network");

  const network = NETWORK === "testnet" ? STACKS_TESTNET : STACKS_MAINNET;

  return new Promise((resolve, reject) => {
    try {
      openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        network,
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
    invoiceHash ? someCV(bufferCV(Buffer.from(invoiceHash, "hex"))) : noneCV(),
  ];

  return callContract("create-escrow", functionArgs);
}

export async function contractFundEscrow(
  escrowId: number,
  senderAddress: string,
  amountMicrostacks: number,
): Promise<string | null> {
  const { uintCV, Pc } = await getTx();
  const { openContractCall } = await getConnect();
  const { STACKS_TESTNET, STACKS_MAINNET } = await import("@stacks/network");
  const network = NETWORK === "testnet" ? STACKS_TESTNET : STACKS_MAINNET;

  // Post-condition: the sender WILL send exactly amountMicrostacks in STX
  const postConditions = [
    Pc.principal(senderAddress).willSendEq(amountMicrostacks).ustx(),
  ];

  return new Promise((resolve, reject) => {
    try {
      openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "fund-escrow",
        functionArgs: [uintCV(escrowId)],
        postConditions,
        network,
        onFinish: (data: { txId: string }) => resolve(data.txId),
        onCancel: () => resolve(null),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } catch (e) {
      reject(e);
    }
  });
}

export async function contractMarkDelivered(
  escrowId: number,
): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract("mark-delivered", [uintCV(escrowId)]);
}

export async function contractReleasePayment(
  escrowId: number,
): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract("release-payment", [uintCV(escrowId)]);
}

export async function contractRequestRevision(
  escrowId: number,
): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract("request-revision", [uintCV(escrowId)]);
}

export async function contractInitiateDispute(
  escrowId: number,
): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract("initiate-dispute", [uintCV(escrowId)]);
}

export async function contractCancelEscrow(
  escrowId: number,
): Promise<string | null> {
  const { uintCV } = await getTx();
  return callContract("cancel-escrow", [uintCV(escrowId)]);
}

// ─── Contract Read Functions ─────────────────────────────────────────────────

async function getReadNetwork() {
  return NETWORK === "testnet" ? "testnet" : "mainnet";
}

export async function readEscrow(escrowId: number) {
  try {
    const { fetchCallReadOnlyFunction, cvToValue, uintCV } = await getTx();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-escrow",
      functionArgs: [uintCV(escrowId)],
      senderAddress: CONTRACT_ADDRESS,
      network: await getReadNetwork(),
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
      functionName: "get-escrow-count",
      functionArgs: [],
      senderAddress: CONTRACT_ADDRESS,
      network: await getReadNetwork(),
    });
    const value = cvToValue(result);
    return typeof value === "bigint" ? Number(value) : Number(value) || 0;
  } catch {
    return 0;
  }
}

/**
 * Helper to extract a primitive value from a cvToValue field.
 * cvToValue in stacks v7 returns nested {type, value} objects for tuples.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCV(field: any): string {
  if (field === null || field === undefined) return "";
  if (typeof field === "string") return field;
  if (typeof field === "bigint") return field.toString();
  if (typeof field === "number") return field.toString();
  if (typeof field === "object" && "value" in field)
    return extractCV(field.value);
  return String(field);
}

/**
 * Fetch all on-chain escrows where the given address is client or freelancer.
 */
export async function fetchOnChainEscrows(
  walletAddress: string,
): Promise<import("@/types").Escrow[]> {
  const count = await readEscrowCount();
  console.log(
    "[fetchOnChainEscrows] escrow count:",
    count,
    "wallet:",
    walletAddress,
  );
  if (count === 0) return [];

  const results: import("@/types").Escrow[] = [];

  for (let i = 0; i < count; i++) {
    const raw = await readEscrow(i);
    console.log(
      `[fetchOnChainEscrows] escrow #${i} raw:`,
      JSON.stringify(raw, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    );
    if (!raw) continue;

    // cvToValue returns {type: "(tuple ...)", value: {field: {type, value}, ...}}
    // The actual tuple fields are inside raw.value (if top-level has type/value wrapper)
    const data =
      raw.value &&
      typeof raw.value === "object" &&
      !Array.isArray(raw.value) &&
      raw.type
        ? raw.value // Wrapped: unwrap to get tuple fields
        : raw; // Already unwrapped

    const client = extractCV(data.client);
    const freelancer = extractCV(data.freelancer);
    const rawStatus = extractCV(data.status);
    const rawAmount = data.amount;

    console.log(
      `[fetchOnChainEscrows] escrow #${i} parsed → client: ${client}, freelancer: ${freelancer}, status: ${rawStatus}`,
    );

    if (
      client.toLowerCase() !== walletAddress.toLowerCase() &&
      freelancer.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      console.log(
        `[fetchOnChainEscrows] escrow #${i} skipped — not our wallet`,
      );
      continue;
    }

    const validStatuses = [
      "created",
      "funded",
      "delivered",
      "completed",
      "disputed",
      "cancelled",
    ];
    const status = (
      validStatuses.includes(rawStatus) ? rawStatus : "created"
    ) as import("@/types").EscrowStatus;

    // Amount: could be bigint, number, or {type: "uint", value: "10000000"}
    let amount: number;
    if (typeof rawAmount === "bigint") {
      amount = Number(rawAmount);
    } else if (typeof rawAmount === "number") {
      amount = rawAmount;
    } else {
      amount = Number(extractCV(rawAmount) || 0);
    }

    results.push({
      id: `chain-${i}`,
      escrowId: i,
      clientAddress: client,
      freelancerAddress: freelancer,
      amount: amount / 1_000_000,
      amountUsd: amount / 1_000_000,
      amountStx: amount,
      status,
      projectDescription: `Escrow #${i}`,
      createdAt: new Date().toISOString(),
    });
  }

  console.log("[fetchOnChainEscrows] returning", results.length, "escrows");
  return results;
}

export async function readIsReviewExpired(escrowId: number): Promise<boolean> {
  try {
    const { fetchCallReadOnlyFunction, cvToValue, uintCV } = await getTx();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-review-period-expired",
      functionArgs: [uintCV(escrowId)],
      senderAddress: CONTRACT_ADDRESS,
      network: await getReadNetwork(),
    });
    return cvToValue(result) === true;
  } catch {
    return false;
  }
}

// ─── Explorer Links ──────────────────────────────────────────────────────────

export function getExplorerTxUrl(txId: string): string {
  const base = "https://explorer.stacks.co";
  return `${base}/txid/${txId}?chain=${NETWORK}`;
}

export { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK };
