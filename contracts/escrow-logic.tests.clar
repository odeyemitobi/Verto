;; ============================================
;; VERTO ESCROW LOGIC - RENDEZVOUS FUZZ TESTS
;; ============================================
;; Property-based tests and invariant tests for
;; the escrow-logic contract, to be run with:
;;   npx rv . escrow-logic test --runs=200
;;   npx rv . escrow-logic invariant --runs=200
;; ============================================
;; NOTE: Rendezvous merges this file INTO escrow-logic,
;; so we call internal functions directly.
;; ============================================

;; ============================================
;; INVARIANTS (read-only, checked between random calls)
;; ============================================

;; Escrow count is always >= 0 (nonce never overflows).
(define-read-only (invariant-escrow-count-non-negative)
  (>= (get-escrow-count) u0)
)

;; If escrow 0 exists, its status is one of the six valid states.
(define-read-only (invariant-escrow-0-valid-status)
  (match (get-escrow u0)
    escrow
      (let ((status (get status escrow)))
        (or
          (is-eq status "created")
          (is-eq status "funded")
          (is-eq status "delivered")
          (is-eq status "disputed")
          (is-eq status "completed")
          (is-eq status "cancelled")
        )
      )
    true
  )
)

;; Funded escrow always has funded-at set.
(define-read-only (invariant-funded-has-timestamp)
  (match (get-escrow u0)
    escrow
      (if (is-eq (get status escrow) "funded")
        (is-some (get funded-at escrow))
        true
      )
    true
  )
)

;; Delivered escrow always has review-deadline set.
(define-read-only (invariant-delivered-has-deadline)
  (match (get-escrow u0)
    escrow
      (if (is-eq (get status escrow) "delivered")
        (is-some (get review-deadline escrow))
        true
      )
    true
  )
)

;; Completed escrow always has completed-at set.
(define-read-only (invariant-completed-has-timestamp)
  (match (get-escrow u0)
    escrow
      (if (is-eq (get status escrow) "completed")
        (is-some (get completed-at escrow))
        true
      )
    true
  )
)

;; Every existing escrow has amount > 0.
(define-read-only (invariant-amount-always-positive)
  (match (get-escrow u0)
    escrow (> (get amount escrow) u0)
    true
  )
)

;; Cancelled escrow was never funded (funded-at is none).
(define-read-only (invariant-cancelled-never-funded)
  (match (get-escrow u0)
    escrow
      (if (is-eq (get status escrow) "cancelled")
        (is-none (get funded-at escrow))
        true
      )
    true
  )
)

;; Treasury is always a standard principal.
(define-read-only (invariant-treasury-is-set)
  (is-standard (get-treasury))
)

;; ============================================
;; PROPERTY-BASED TESTS
;; ============================================

;; Zero-amount escrow creation always fails with ERR_INVALID_AMOUNT.
(define-public (test-create-zero-amount-fails)
  (let
    (
      (freelancer 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
      (result (create-escrow freelancer u0 none))
    )
    (begin
      (asserts! (is-err result) (err u900))
      (ok true)
    )
  )
)

;; Self-escrow always fails (client == freelancer).
(define-public (test-self-escrow-always-fails)
  (begin
    (asserts!
      (is-err (create-escrow tx-sender u1000000 none))
      (err u910)
    )
    (ok true)
  )
)

;; Funding non-existent escrow always fails.
(define-public (test-fund-nonexistent-fails (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (fund-escrow escrow-id))
      )
    )
  )
)

;; Cancelling non-existent escrow always fails.
(define-public (test-cancel-nonexistent-fails (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (cancel-escrow escrow-id))
      )
    )
  )
)

;; get-escrow returns none for IDs >= escrow-count.
(define-public (test-get-escrow-none-for-invalid-id (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-none (get-escrow escrow-id))
      )
    )
  )
)

;; Delivering non-existent escrow always fails.
(define-public (test-deliver-nonexistent-fails (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (mark-delivered escrow-id))
      )
    )
  )
)

;; Disputing non-existent escrow always fails.
(define-public (test-dispute-nonexistent-fails (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (initiate-dispute escrow-id))
      )
    )
  )
)

;; Review period is never expired for non-existent escrow.
(define-public (test-review-false-for-nonexistent (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (not (is-review-period-expired escrow-id))
      )
    )
  )
)

;; Resolving dispute on non-existent escrow always fails.
(define-public (test-resolve-nonexistent-fails (escrow-id uint) (favor bool))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (resolve-dispute escrow-id favor))
      )
    )
  )
)

;; Release payment on non-existent escrow always fails.
(define-public (test-release-nonexistent-fails (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (release-payment escrow-id))
      )
    )
  )
)

;; Revision request on non-existent escrow always fails.
(define-public (test-revision-nonexistent-fails (escrow-id uint))
  (let
    (
      (count (get-escrow-count))
    )
    (ok
      (if (< escrow-id count)
        false
        (is-err (request-revision escrow-id))
      )
    )
  )
)
