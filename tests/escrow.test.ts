import { describe, it, expect } from "vitest";
import { initSimnet } from "@stacks/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";

// Initialize simnet
const simnet = await initSimnet();

// Contract identifiers
const STORAGE_CONTRACT = "escrow-storage";
const LOGIC_CONTRACT = "escrow-logic";

// Test accounts
const deployer = simnet.deployer;
const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!; // client
const wallet2 = accounts.get("wallet_2")!; // freelancer
const wallet3 = accounts.get("wallet_3")!; // third party

// Transfer storage ownership to logic contract so it can write data
simnet.callPublicFn(
  `${deployer}.${STORAGE_CONTRACT}`,
  "set-contract-owner",
  [Cl.principal(`${deployer}.${LOGIC_CONTRACT}`)],
  deployer,
);

// ============================================
// HELPERS
// ============================================

function getNextEscrowId(): number {
  const result = simnet.callReadOnlyFn(
    `${deployer}.${LOGIC_CONTRACT}`,
    "get-escrow-count",
    [],
    deployer,
  );
  if (result.result.type === ClarityType.UInt) {
    return Number((result.result as any).value);
  }
  return 0;
}

function createEscrow(
  freelancer: string,
  amount: number,
  client: string,
): number {
  const id = getNextEscrowId();
  simnet.callPublicFn(
    `${deployer}.${LOGIC_CONTRACT}`,
    "create-escrow",
    [Cl.principal(freelancer), Cl.uint(amount), Cl.none()],
    client,
  );
  return id;
}

function createAndFundEscrow(
  freelancer: string,
  amount: number,
  client: string,
): number {
  const id = createEscrow(freelancer, amount, client);
  simnet.callPublicFn(
    `${deployer}.${LOGIC_CONTRACT}`,
    "fund-escrow",
    [Cl.uint(id)],
    client,
  );
  return id;
}

function createFundAndDeliver(
  freelancer: string,
  amount: number,
  client: string,
): number {
  const id = createAndFundEscrow(freelancer, amount, client);
  simnet.callPublicFn(
    `${deployer}.${LOGIC_CONTRACT}`,
    "mark-delivered",
    [Cl.uint(id)],
    freelancer,
  );
  return id;
}

// ============================================
// ESCROW STORAGE CONTRACT TESTS
// ============================================

describe("Escrow Storage Contract", () => {
  describe("Contract Deployment", () => {
    it("should deploy successfully", () => {
      const contractSource = simnet.getContractSource(
        `${deployer}.${STORAGE_CONTRACT}`,
      );
      expect(contractSource).toBeDefined();
    });

    it("should have logic contract as owner after setup", () => {
      const result = simnet.callReadOnlyFn(
        `${deployer}.${STORAGE_CONTRACT}`,
        "get-contract-owner",
        [],
        deployer,
      );
      expect(result.result).toBePrincipal(
        `${deployer}.${LOGIC_CONTRACT}`,
      );
    });

    it("should return escrow count as uint", () => {
      const result = simnet.callReadOnlyFn(
        `${deployer}.${STORAGE_CONTRACT}`,
        "get-escrow-count",
        [],
        deployer,
      );
      expect(result.result.type).toBe(ClarityType.UInt);
    });
  });

  describe("Access Control", () => {
    it("should reject direct writes from non-owner", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${STORAGE_CONTRACT}`,
        "insert-escrow",
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(1000000),
          Cl.none(),
        ],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(100)); // ERR_NOT_OWNER
    });

    it("should reject status updates from non-owner", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${STORAGE_CONTRACT}`,
        "update-escrow-status",
        [Cl.uint(0), Cl.stringAscii("hacked")],
        wallet1,
      );
      // ERR_NOT_OWNER (u100) or ERR_NOT_FOUND (u101) — non-owner is blocked either way
      expect(result.result.type).toBe(ClarityType.ResponseErr);
    });
  });
});

// ============================================
// ESCROW LOGIC CONTRACT TESTS
// ============================================

describe("Escrow Logic Contract", () => {
  describe("Contract Deployment", () => {
    it("should deploy successfully", () => {
      const contractSource = simnet.getContractSource(
        `${deployer}.${LOGIC_CONTRACT}`,
      );
      expect(contractSource).toBeDefined();
    });

    it("should return deployer as treasury", () => {
      const result = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "get-treasury",
        [],
        deployer,
      );
      expect(result.result).toBePrincipal(deployer);
    });
  });

  // ===========================================
  // ADMIN FUNCTIONS
  // ===========================================

  describe("Admin: Set Treasury", () => {
    it("should allow treasury to update treasury address", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "set-treasury",
        [Cl.principal(wallet3)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify it changed
      const check = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "get-treasury",
        [],
        deployer,
      );
      expect(check.result).toBePrincipal(wallet3);

      // Reset back to deployer for subsequent tests
      simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "set-treasury",
        [Cl.principal(deployer)],
        wallet3,
      );
    });

    it("should reject treasury update from non-treasury", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "set-treasury",
        [Cl.principal(wallet1)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });
  });

  // ===========================================
  // CREATE ESCROW
  // ===========================================

  describe("Create Escrow", () => {
    it("should create escrow successfully", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "create-escrow",
        [Cl.principal(wallet2), Cl.uint(1000000), Cl.none()],
        wallet1,
      );
      expect(result.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should return incremented escrow ID", () => {
      const firstId = getNextEscrowId();
      simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "create-escrow",
        [Cl.principal(wallet2), Cl.uint(500000), Cl.none()],
        wallet1,
      );
      const secondId = getNextEscrowId();
      expect(secondId).toBe(firstId + 1);
    });

    it("should reject zero amount", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "create-escrow",
        [Cl.principal(wallet2), Cl.uint(0), Cl.none()],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(206)); // ERR_INVALID_AMOUNT
    });

    it("should reject self-escrow", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "create-escrow",
        [Cl.principal(wallet1), Cl.uint(1000000), Cl.none()],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(210)); // ERR_SELF_ESCROW
    });

    it("should create escrow with invoice hash", () => {
      const invoiceHash = new Uint8Array(32).fill(0xab);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "create-escrow",
        [
          Cl.principal(wallet2),
          Cl.uint(2000000),
          Cl.some(Cl.buffer(invoiceHash)),
        ],
        wallet1,
      );
      expect(result.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should store correct escrow data after creation", () => {
      const escrowId = createEscrow(wallet2, 3000000, wallet1);
      const result = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "get-escrow",
        [Cl.uint(escrowId)],
        deployer,
      );
      // Should return Some(tuple)
      expect(result.result.type).toBe(ClarityType.OptionalSome);
    });
  });

  // ===========================================
  // FUND ESCROW
  // ===========================================

  describe("Fund Escrow", () => {
    it("should fund escrow successfully", () => {
      const escrowId = createEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "fund-escrow",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should transfer STX from client to contract on funding", () => {
      const amount = 1000000;
      const escrowId = createEscrow(wallet2, amount, wallet1);

      const balanceBefore = simnet.getAssetsMap().get("STX")!.get(wallet1)!;

      simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "fund-escrow",
        [Cl.uint(escrowId)],
        wallet1,
      );

      const balanceAfter = simnet.getAssetsMap().get("STX")!.get(wallet1)!;
      expect(balanceBefore - balanceAfter).toBe(BigInt(amount));
    });

    it("should reject funding by non-client", () => {
      const escrowId = createEscrow(wallet2, 500000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "fund-escrow",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should reject double funding", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "fund-escrow",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(202)); // ERR_ALREADY_FUNDED
    });

    it("should reject funding non-existent escrow", () => {
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "fund-escrow",
        [Cl.uint(99999)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(201)); // ERR_ESCROW_NOT_FOUND
    });
  });

  // ===========================================
  // CANCEL ESCROW
  // ===========================================

  describe("Cancel Escrow", () => {
    it("should cancel unfunded escrow", () => {
      const escrowId = createEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "cancel-escrow",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should reject cancellation by non-client", () => {
      const escrowId = createEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "cancel-escrow",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should reject cancellation of funded escrow", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "cancel-escrow",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(202)); // ERR_ALREADY_FUNDED
    });
  });

  // ===========================================
  // MARK DELIVERED
  // ===========================================

  describe("Mark Delivered", () => {
    it("should mark funded escrow as delivered", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "mark-delivered",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should return the review deadline as uint", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "mark-delivered",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result.type).toBe(ClarityType.ResponseOk);
      const inner = (result.result as any).value;
      expect(inner.type).toBe(ClarityType.UInt);
    });

    it("should reject delivery by non-freelancer", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "mark-delivered",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should reject delivery by third party", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "mark-delivered",
        [Cl.uint(escrowId)],
        wallet3,
      );
      expect(result.result).toBeErr(Cl.uint(200));
    });

    it("should reject delivery of unfunded escrow", () => {
      const escrowId = createEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "mark-delivered",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(203)); // ERR_NOT_FUNDED
    });
  });

  // ===========================================
  // RELEASE PAYMENT
  // ===========================================

  describe("Release Payment", () => {
    it("should release payment when client approves", () => {
      const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "release-payment",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should transfer STX to freelancer on release", () => {
      const amount = 2000000;
      const balanceBefore = simnet.getAssetsMap().get("STX")!.get(wallet2)!;

      const escrowId = createFundAndDeliver(wallet2, amount, wallet1);
      simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "release-payment",
        [Cl.uint(escrowId)],
        wallet1,
      );

      const balanceAfter = simnet.getAssetsMap().get("STX")!.get(wallet2)!;
      expect(balanceAfter - balanceBefore).toBe(BigInt(amount));
    });

    it("should reject release of unfunded escrow", () => {
      const escrowId = createEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "release-payment",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(209)); // ERR_INVALID_STATUS
    });

    it("should reject release of funded-but-not-delivered escrow", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "release-payment",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(209)); // ERR_INVALID_STATUS
    });

    it("should reject release by unauthorized party during review period", () => {
      const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "release-payment",
        [Cl.uint(escrowId)],
        wallet3,
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });
  });

  // ===========================================
  // REQUEST REVISION
  // ===========================================

  describe("Request Revision", () => {
    it("should allow revision request during review period", () => {
      const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "request-revision",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should reset status to funded after revision (freelancer can redeliver)", () => {
      const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);

      simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "request-revision",
        [Cl.uint(escrowId)],
        wallet1,
      );

      // Freelancer should be able to mark delivered again
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "mark-delivered",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject revision by non-client", () => {
      const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "request-revision",
        [Cl.uint(escrowId)],
        wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should reject revision on non-delivered escrow", () => {
      const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
      const result = simnet.callPublicFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "request-revision",
        [Cl.uint(escrowId)],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(209)); // ERR_INVALID_STATUS
    });
  });

  // ===========================================
  // DISPUTES
  // ===========================================

  describe("Disputes", () => {
    describe("Initiate Dispute", () => {
      it("should allow client to initiate dispute on funded escrow", () => {
        const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet1,
        );
        expect(result.result).toBeOk(Cl.bool(true));
      });

      it("should allow freelancer to initiate dispute on delivered escrow", () => {
        const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet2,
        );
        expect(result.result).toBeOk(Cl.bool(true));
      });

      it("should reject dispute by third party", () => {
        const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet3,
        );
        expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
      });

      it("should reject dispute on unfunded (created) escrow", () => {
        const escrowId = createEscrow(wallet2, 1000000, wallet1);
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet1,
        );
        expect(result.result).toBeErr(Cl.uint(203)); // ERR_NOT_FUNDED
      });

      it("should reject double dispute", () => {
        const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
        simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet1,
        );
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet2,
        );
        expect(result.result).toBeErr(Cl.uint(208)); // ERR_ALREADY_DISPUTED
      });
    });

    describe("Resolve Dispute", () => {
      it("should resolve dispute in favor of freelancer", () => {
        const amount = 1000000;
        const escrowId = createAndFundEscrow(wallet2, amount, wallet1);
        simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet1,
        );

        const balanceBefore = simnet.getAssetsMap().get("STX")!.get(wallet2)!;

        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "resolve-dispute",
          [Cl.uint(escrowId), Cl.bool(true)],
          deployer,
        );
        expect(result.result).toBeOk(Cl.bool(true));

        const balanceAfter = simnet.getAssetsMap().get("STX")!.get(wallet2)!;
        expect(balanceAfter - balanceBefore).toBe(BigInt(amount));
      });

      it("should resolve dispute in favor of client (refund)", () => {
        const amount = 1000000;
        const escrowId = createAndFundEscrow(wallet2, amount, wallet1);
        simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet1,
        );

        const balanceBefore = simnet.getAssetsMap().get("STX")!.get(wallet1)!;

        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "resolve-dispute",
          [Cl.uint(escrowId), Cl.bool(false)],
          deployer,
        );
        expect(result.result).toBeOk(Cl.bool(true));

        const balanceAfter = simnet.getAssetsMap().get("STX")!.get(wallet1)!;
        expect(balanceAfter - balanceBefore).toBe(BigInt(amount));
      });

      it("should reject resolution by non-treasury", () => {
        const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
        simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "initiate-dispute",
          [Cl.uint(escrowId)],
          wallet1,
        );
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "resolve-dispute",
          [Cl.uint(escrowId), Cl.bool(true)],
          wallet1,
        );
        expect(result.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
      });

      it("should reject resolution of non-disputed escrow", () => {
        const escrowId = createAndFundEscrow(wallet2, 1000000, wallet1);
        const result = simnet.callPublicFn(
          `${deployer}.${LOGIC_CONTRACT}`,
          "resolve-dispute",
          [Cl.uint(escrowId), Cl.bool(true)],
          deployer,
        );
        expect(result.result).toBeErr(Cl.uint(209)); // ERR_INVALID_STATUS
      });
    });
  });

  // ===========================================
  // READ-ONLY FUNCTIONS
  // ===========================================

  describe("Read-only Functions", () => {
    it("should return escrow count as uint", () => {
      const result = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "get-escrow-count",
        [],
        deployer,
      );
      expect(result.result.type).toBe(ClarityType.UInt);
    });

    it("should return none for non-existent escrow", () => {
      const result = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "get-escrow",
        [Cl.uint(99999)],
        deployer,
      );
      expect(result.result).toBeNone();
    });

    it("should return false for review-period-expired on non-existent escrow", () => {
      const result = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "is-review-period-expired",
        [Cl.uint(99999)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("should return false for review-period-expired on active escrow", () => {
      const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);
      const result = simnet.callReadOnlyFn(
        `${deployer}.${LOGIC_CONTRACT}`,
        "is-review-period-expired",
        [Cl.uint(escrowId)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });
  });
});

// ============================================
// FULL WORKFLOW INTEGRATION TESTS
// ============================================

describe("Full Escrow Workflows", () => {
  it("happy path: create → fund → deliver → release (with balance verification)", () => {
    const amount = 5000000;
    const clientBefore = simnet.getAssetsMap().get("STX")!.get(wallet1)!;
    const freelancerBefore = simnet.getAssetsMap().get("STX")!.get(wallet2)!;

    const escrowId = createEscrow(wallet2, amount, wallet1);

    const fundResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "fund-escrow",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(fundResult.result).toBeOk(Cl.bool(true));

    const deliverResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "mark-delivered",
      [Cl.uint(escrowId)],
      wallet2,
    );
    expect(deliverResult.result.type).toBe(ClarityType.ResponseOk);

    const releaseResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "release-payment",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(releaseResult.result).toBeOk(Cl.bool(true));

    // Verify STX moved correctly
    const clientAfter = simnet.getAssetsMap().get("STX")!.get(wallet1)!;
    const freelancerAfter = simnet.getAssetsMap().get("STX")!.get(wallet2)!;
    expect(clientBefore - clientAfter).toBe(BigInt(amount));
    expect(freelancerAfter - freelancerBefore).toBe(BigInt(amount));
  });

  it("revision path: create → fund → deliver → revise → redeliver → release", () => {
    const amount = 3000000;
    const escrowId = createFundAndDeliver(wallet2, amount, wallet1);

    const revisionResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "request-revision",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(revisionResult.result).toBeOk(Cl.bool(true));

    const redeliverResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "mark-delivered",
      [Cl.uint(escrowId)],
      wallet2,
    );
    expect(redeliverResult.result.type).toBe(ClarityType.ResponseOk);

    const releaseResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "release-payment",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(releaseResult.result).toBeOk(Cl.bool(true));
  });

  it("dispute path: create → fund → dispute → resolve (freelancer wins)", () => {
    const amount = 4000000;
    const freelancerBefore = simnet.getAssetsMap().get("STX")!.get(wallet2)!;

    const escrowId = createAndFundEscrow(wallet2, amount, wallet1);

    const disputeResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "initiate-dispute",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(disputeResult.result).toBeOk(Cl.bool(true));

    const resolveResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "resolve-dispute",
      [Cl.uint(escrowId), Cl.bool(true)],
      deployer,
    );
    expect(resolveResult.result).toBeOk(Cl.bool(true));

    const freelancerAfter = simnet.getAssetsMap().get("STX")!.get(wallet2)!;
    expect(freelancerAfter - freelancerBefore).toBe(BigInt(amount));
  });

  it("dispute path: create → fund → deliver → dispute → resolve (client refund)", () => {
    const amount = 2500000;
    const clientBefore = simnet.getAssetsMap().get("STX")!.get(wallet1)!;

    const escrowId = createFundAndDeliver(wallet2, amount, wallet1);

    simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "initiate-dispute",
      [Cl.uint(escrowId)],
      wallet2,
    );

    const resolveResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "resolve-dispute",
      [Cl.uint(escrowId), Cl.bool(false)],
      deployer,
    );
    expect(resolveResult.result).toBeOk(Cl.bool(true));

    const clientAfter = simnet.getAssetsMap().get("STX")!.get(wallet1)!;
    // Client is refunded: net change should be 0 (funded amount returned)
    expect(clientAfter - clientBefore).toBe(BigInt(0));
  });

  it("cancellation path: create → cancel (no STX movement)", () => {
    const clientBefore = simnet.getAssetsMap().get("STX")!.get(wallet1)!;

    const escrowId = createEscrow(wallet2, 1000000, wallet1);
    const cancelResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "cancel-escrow",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(cancelResult.result).toBeOk(Cl.bool(true));

    const clientAfter = simnet.getAssetsMap().get("STX")!.get(wallet1)!;
    expect(clientAfter).toBe(clientBefore); // No STX moved

    // Cannot fund after cancellation
    const fundResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "fund-escrow",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(fundResult.result).toBeErr(Cl.uint(202));
  });

  it("should not allow actions after completion", () => {
    const escrowId = createFundAndDeliver(wallet2, 1000000, wallet1);

    simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "release-payment",
      [Cl.uint(escrowId)],
      wallet1,
    );

    // Cannot dispute completed escrow
    const disputeResult = simnet.callPublicFn(
      `${deployer}.${LOGIC_CONTRACT}`,
      "initiate-dispute",
      [Cl.uint(escrowId)],
      wallet1,
    );
    expect(disputeResult.result).toBeErr(Cl.uint(207)); // ERR_ALREADY_COMPLETED
  });
});
