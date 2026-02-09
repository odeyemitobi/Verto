import { describe, it, expect } from "vitest";
import { Cl, cvToString } from "@stacks/transactions";

// simnet is provided as a global by vitest-environment-clarinet
const deployer = simnet.deployer;
const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

// Transfer storage ownership to logic contract
simnet.callPublicFn(
  `${deployer}.escrow-storage`,
  "set-contract-owner",
  [Cl.principal(`${deployer}.escrow-logic`)],
  deployer,
);

describe("Debug Contract Errors", () => {
  it("should show storage owner", () => {
    const ownerResult = simnet.callReadOnlyFn(
      `${deployer}.escrow-storage`,
      "get-contract-owner",
      [],
      deployer,
    );
    console.log("Storage Owner:", cvToString(ownerResult.result));
    expect(true).toBe(true);
  });

  it("should show create-escrow result", () => {
    const result = simnet.callPublicFn(
      `${deployer}.escrow-logic`,
      "create-escrow",
      [Cl.principal(wallet2), Cl.uint(1000000), Cl.none()],
      wallet1,
    );
    console.log("Create Escrow Result:", cvToString(result.result));
    console.log("Events:", JSON.stringify(result.events, null, 2));
    expect(true).toBe(true);
  });
});
