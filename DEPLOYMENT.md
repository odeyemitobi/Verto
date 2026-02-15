# Verto — Testnet Deployment Walkthrough

This guide walks you through deploying Verto's Clarity smart contracts to the **Stacks testnet** using a Node.js deploy script (built on `@stacks/transactions`).

---

## Step 1: Install the Leather Wallet

If you don't already have one:

1. Install the [Leather Wallet](https://leather.io) browser extension
2. Create a new wallet (save your seed phrase!)
3. Open Leather → click the **network toggle** (bottom-left) → switch to **Testnet**
4. Copy your **STX testnet address** (starts with `ST...`)

---

## Step 2: Get Testnet STX

You need testnet STX to pay deployment fees (~0.15 STX total for all three transactions).

1. Go to the **Stacks Testnet Faucet**: https://explorer.hiro.so/sandbox/faucet?chain=testnet
2. Connect your Leather wallet (or paste your testnet address)
3. Request STX — you'll receive 500 testnet STX
4. Wait 1-2 minutes for the faucet transaction to confirm

To verify your balance, search your address on the [Stacks Explorer (testnet)](https://explorer.hiro.so/?chain=testnet).

---

## Step 3: Get Your Private Key

The deploy script needs your testnet private key to sign transactions.

**Option A — From Leather:**
1. Open Leather → Settings → click your account
2. You'll see your Secret Key / seed phrase
3. You can derive the private key from the seed using the Stacks CLI:
   ```bash
   npx @stacks/cli make_keychain -t
   ```
   This generates a brand new testnet keychain. Or to use your existing seed:
   ```bash
   npx @stacks/cli make_keychain -t -m "your twelve word seed phrase here ..."
   ```
4. Copy the `privateKey` value (64-character hex string)

**Option B — Generate a fresh deploy key:**
```bash
cd verto-contract
npx @stacks/cli make_keychain -t
```
This prints JSON with `privateKey` and `address`. Fund this address from the faucet instead.

---

## Step 4: Configure the Deploy Script

```bash
cd verto-contract

# Copy the example env file
cp .env.example .env
```

Edit `verto-contract/.env` and paste your private key:

```dotenv
DEPLOYER_PRIVATE_KEY=abc123def456...your_64_char_hex_key_here
```

> **IMPORTANT:** Never commit this file. It's already in `.gitignore`.

---

## Step 5: Verify Contracts Locally

Before deploying, make sure everything passes:

```bash
cd verto-contract

# Syntax check
clarinet check

# Run the full test suite (58 tests)
npm test
```

All tests should pass.

---

## Step 6: Deploy to Testnet

Run the deploy script:

```bash
cd verto-contract
node --env-file=.env scripts/deploy-testnet.mjs
```

The script will:

1. **Deploy `escrow-storage`** — the data layer contract
2. **Wait for confirmation** (~1-2 minutes)
3. **Deploy `escrow-logic`** — the business logic contract
4. **Wait for confirmation** (~1-2 minutes)
5. **Call `set-contract-owner`** — transfers storage ownership to the logic contract so it can write data
6. **Wait for confirmation**
7. **Print your contract addresses and the `.env.local` values you need for the frontend**

Example output:
```
🚀 Verto Testnet Deployment
═══════════════════════════════════════════════════════
   Deployer: ST2ABC123...

📄 Deploying escrow-storage (4521 bytes)...
   📡 Broadcast OK — txid: 0xabc123...
   ⏳ Waiting for escrow-storage...
   ✅ escrow-storage confirmed in block 12345

📄 Deploying escrow-logic (6204 bytes)...
   📡 Broadcast OK — txid: 0xdef456...
   ⏳ Waiting for escrow-logic...
   ✅ escrow-logic confirmed in block 12346

🔑 Transferring escrow-storage ownership to escrow-logic...
   📡 Broadcast OK — txid: 0x789abc...
   ✅ set-contract-owner confirmed

═══════════════════════════════════════════════════════
🎉 Deployment complete!

Add this to your frontend .env.local:

   NEXT_PUBLIC_CONTRACT_ADDRESS=ST2ABC123...
   NEXT_PUBLIC_CONTRACT_NAME=escrow-logic
   NEXT_PUBLIC_STACKS_NETWORK=testnet
```

---

## Step 7: Verify on Explorer

Once deployed, verify your contracts on the Stacks Explorer:

1. Go to https://explorer.hiro.so/?chain=testnet
2. Search for your deployer address
3. You should see three transactions:
   - `escrow-storage` deploy
   - `escrow-logic` deploy
   - `set-contract-owner` contract call
4. Click into each contract to verify the source code is visible

---

## Step 8: Connect the Frontend

```bash
cd verto-frontend

# Copy env template
cp .env.example .env.local
```

Edit `.env.local` with the values the deploy script printed:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=ST_YOUR_DEPLOYER_ADDRESS
NEXT_PUBLIC_CONTRACT_NAME=escrow-logic
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

Then run:
```bash
npm run dev
```

Open http://localhost:3000, connect Leather (on testnet), and test the full escrow flow.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `BroadcastError: ConflictingNonceInMempool` | A previous tx is still pending. Wait a few minutes and retry. |
| `BroadcastError: NotEnoughFunds` | Fund your deployer address from the faucet again. |
| `BroadcastError: ContractAlreadyExists` | Contracts are already deployed at that address. They're immutable — just use the existing ones. |
| Script hangs at "Waiting..." | Testnet can be slow. Give it up to 5 minutes per tx. If it times out, check the explorer link printed. |
| `node --env-file` not supported | Requires Node 20.6+. Upgrade Node or use `dotenv`: `npm i -D dotenv` and add `import 'dotenv/config'` at the top of the script. |

---

## Switching to Mainnet Later

When you're ready for production:

1. Create a copy of the deploy script or update the network import to use `StacksMainnet`
2. Update your `.env` private key to your mainnet key
3. Run the deploy script
4. Update your frontend `.env.local`:
   ```dotenv
   NEXT_PUBLIC_CONTRACT_ADDRESS=SP_YOUR_MAINNET_ADDRESS
   NEXT_PUBLIC_STACKS_NETWORK=mainnet
   ```
5. Redeploy frontend
