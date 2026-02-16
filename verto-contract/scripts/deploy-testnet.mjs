/**
 * Verto — Testnet Contract Deployment Script
 *
 * Deploys all three contracts to Stacks testnet in the correct order:
 *   1. escrow-storage    (data layer)
 *   2. escrow-logic      (business rules)
 *   3. set-contract-owner call (transfer storage ownership to logic contract)
 *
 * Usage:
 *   node --env-file=.env scripts/deploy-testnet.mjs
 *
 * Required .env vars:
 *   DEPLOYER_PRIVATE_KEY  — your testnet private key (hex, 64 chars)
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import txPkg from '@stacks/transactions';
const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  makeContractCall,
  principalCV,
  PostConditionMode,
  ClarityVersion,
  fetchNonce,
  getAddressFromPrivateKey,
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_TESTNET, TransactionVersion } = netPkg;

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = resolve(__dirname, '..', 'contracts');

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('❌ Missing DEPLOYER_PRIVATE_KEY in environment.');
  console.error('   Create verto-contract/.env with: DEPLOYER_PRIVATE_KEY=your_hex_key');
  process.exit(1);
}

const network = STACKS_TESTNET;

// Contracts in deployment order (storage first, then logic)
// escrow-storage-trait is not deployed separately — it's just a local dev artefact
const CONTRACTS = [
  { name: 'escrow-storage', file: 'escrow-storage.clar' },
  { name: 'escrow-logic', file: 'escrow-logic.clar' },
];

const DEPLOY_FEE = 50_000;   // 0.05 STX — safe for testnet
const CALL_FEE = 10_000;     // 0.01 STX for the ownership transfer call

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait for a tx to be confirmed (or at least anchored in a microblock) */
async function waitForTx(txId, label) {
  const url = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;
  const maxAttempts = 60; // ~5 minutes at 5s intervals
  console.log(`   ⏳ Waiting for ${label} (${txId})...`);

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5_000);
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.tx_status === 'success') {
        console.log(`   ✅ ${label} confirmed in block ${data.block_height}`);
        return data;
      }
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.error(`   ❌ ${label} failed: ${data.tx_status}`);
        console.error(`      Reason: ${JSON.stringify(data.tx_result)}`);
        process.exit(1);
      }
      // Still pending — keep waiting
      if (i % 6 === 0 && i > 0) {
        console.log(`   … still pending (${Math.round((i * 5) / 60)}min elapsed)`);
      }
    } catch {
      // Network hiccup — just retry
    }
  }
  console.error(`   ⚠️  Timed out waiting for ${label}. Check explorer:`);
  console.error(`      https://explorer.hiro.so/txid/${txId}?chain=testnet`);
  process.exit(1);
}

// ─── Deploy ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🚀 Verto Testnet Deployment');
  console.log('═══════════════════════════════════════════════════════');

  // Derive sender address for logging
  const senderAddress = getAddressFromPrivateKey(PRIVATE_KEY, TransactionVersion.Testnet);
  console.log(`   Deployer: ${senderAddress}`);
  console.log('');

  // Track the nonce manually to avoid conflicts with sequential deploys
  let nonce = await fetchNonce({ address: senderAddress, network });

  // ── Step 1 & 2: Deploy contracts ──────────────────────────────────────────

  const deployedContracts = {};

  for (const contract of CONTRACTS) {
    const source = readFileSync(resolve(CONTRACTS_DIR, contract.file), 'utf-8');
    console.log(`📄 Deploying ${contract.name} (${source.length} bytes)...`);

    const tx = await makeContractDeploy({
      contractName: contract.name,
      codeBody: source,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: DEPLOY_FEE,
      nonce: nonce,
      clarityVersion: ClarityVersion.Clarity3,
      postConditionMode: PostConditionMode.Allow,
    });

    const result = await broadcastTransaction({ transaction: tx, network });

    if (result.error) {
      console.error(`   ❌ Broadcast failed: ${result.error} — ${result.reason}`);
      if (result.reason_data) console.error(`      ${JSON.stringify(result.reason_data)}`);
      process.exit(1);
    }

    const txId = typeof result === 'string' ? result : result.txid;
    console.log(`   📡 Broadcast OK — txid: ${txId}`);
    deployedContracts[contract.name] = txId;
    nonce++;

    // Wait for confirmation before deploying the next contract
    // (escrow-logic depends on escrow-storage being on-chain)
    await waitForTx(txId, contract.name);
    console.log('');
  }

  // ── Step 3: Transfer storage ownership to logic contract ──────────────────

  console.log('🔑 Transferring escrow-storage ownership to escrow-logic...');
  const logicPrincipal = `${senderAddress}.escrow-logic`;

  const callTx = await makeContractCall({
    contractAddress: senderAddress,
    contractName: 'escrow-storage',
    functionName: 'set-contract-owner',
    functionArgs: [principalCV(logicPrincipal)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: CALL_FEE,
    nonce: nonce,
    postConditionMode: PostConditionMode.Allow,
  });

  const callResult = await broadcastTransaction({ transaction: callTx, network });
  const callTxId = typeof callResult === 'string' ? callResult : callResult.txid;

  if (callResult.error) {
    console.error(`   ❌ Broadcast failed: ${callResult.error} — ${callResult.reason}`);
    process.exit(1);
  }

  console.log(`   📡 Broadcast OK — txid: ${callTxId}`);
  await waitForTx(callTxId, 'set-contract-owner');

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Deployment complete!');
  console.log('');
  console.log('Contract addresses:');
  console.log(`   escrow-storage:  ${senderAddress}.escrow-storage`);
  console.log(`   escrow-logic:    ${senderAddress}.escrow-logic`);
  console.log('');
  console.log('Add this to your frontend .env.local:');
  console.log('');
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${senderAddress}`);
  console.log('   NEXT_PUBLIC_CONTRACT_NAME=escrow-logic');
  console.log('   NEXT_PUBLIC_STACKS_NETWORK=testnet');
  console.log('');
  console.log('Explorer links:');
  for (const [name, txId] of Object.entries(deployedContracts)) {
    console.log(`   ${name}: https://explorer.hiro.so/txid/${txId}?chain=testnet`);
  }
  console.log(`   set-owner: https://explorer.hiro.so/txid/${callTxId}?chain=testnet`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
