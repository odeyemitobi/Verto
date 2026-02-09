import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl, cvToString } from "@stacks/transactions";

const simnet = await initSimnet();
const deployer = simnet.deployer;
const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

console.log("Deployer:", deployer);
console.log("Wallet1:", wallet1);
console.log("Wallet2:", wallet2);

// Transfer storage ownership to logic contract
simnet.callPublicFn(
  `${deployer}.escrow-storage`,
  "set-contract-owner",
  [Cl.principal(`${deployer}.escrow-logic`)],
  deployer,
);

// Test create-escrow
const result = simnet.callPublicFn(
  `${deployer}.escrow-logic`,
  "create-escrow",
  [Cl.principal(wallet2), Cl.uint(1000000), Cl.none()],
  wallet1,
);

console.log("Create Escrow Result:", cvToString(result.result));
console.log("Events:", result.events);

// Check storage owner
const ownerResult = simnet.callReadOnlyFn(
  `${deployer}.escrow-storage`,
  "get-contract-owner",
  [],
  deployer,
);
console.log("Storage Owner:", cvToString(ownerResult.result));
