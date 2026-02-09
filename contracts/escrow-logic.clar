;; ============================================
;; VERTO ESCROW LOGIC CONTRACT
;; ============================================
;; Business logic for trustless freelance escrow
;; Calls into storage contract for data persistence
;; Can be replaced without losing data
;; ============================================

;; ============================================
;; CONSTANTS
;; ============================================

;; Review period: ~48 hours in Stacks blocks
;; In Nakamoto, stacks-block-height increments faster than pre-Nakamoto block-height.
;; Adjust this constant based on observed Nakamoto block production rate.
;; With ~1 block per 10 seconds: 48h * 3600s/h / 10s = 17280 blocks
(define-constant REVIEW_PERIOD_BLOCKS u17280)

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u200))
(define-constant ERR_ESCROW_NOT_FOUND (err u201))
(define-constant ERR_ALREADY_FUNDED (err u202))
(define-constant ERR_NOT_FUNDED (err u203))
(define-constant ERR_NOT_DELIVERED (err u204))
(define-constant ERR_REVIEW_PERIOD_EXPIRED (err u205))
(define-constant ERR_INVALID_AMOUNT (err u206))
(define-constant ERR_ALREADY_COMPLETED (err u207))
(define-constant ERR_ALREADY_DISPUTED (err u208))
(define-constant ERR_INVALID_STATUS (err u209))
(define-constant ERR_SELF_ESCROW (err u210))
(define-constant ERR_REVIEW_PERIOD_ACTIVE (err u211))

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Reference to storage contract (can be updated)
(define-data-var storage-contract principal .escrow-storage)

;; Treasury for dispute resolution (should be multi-sig or DAO in production)
(define-data-var treasury principal tx-sender)

;; ============================================
;; ADMIN FUNCTIONS
;; ============================================

(define-read-only (get-treasury)
  (var-get treasury)
)

(define-public (set-treasury (new-treasury principal))
  (begin
    (asserts! (is-eq contract-caller (var-get treasury)) ERR_UNAUTHORIZED)
    (ok (var-set treasury new-treasury))
  )
)

;; ============================================
;; HELPER FUNCTIONS
;; ============================================

(define-private (get-escrow-data (escrow-id uint))
  (contract-call? .escrow-storage get-escrow escrow-id)
)

(define-private (is-status (escrow-id uint) (expected-status (string-ascii 20)))
  (match (contract-call? .escrow-storage get-escrow-status escrow-id)
    status (is-eq status expected-status)
    false
  )
)

;; ============================================
;; PUBLIC FUNCTIONS: ESCROW LIFECYCLE
;; ============================================

;; Create a new escrow (called by client)
(define-public (create-escrow
    (freelancer principal)
    (amount uint)
    (invoice-hash (optional (buff 32))))
  (begin
    ;; Validations using contract-caller for security
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (is-eq contract-caller freelancer)) ERR_SELF_ESCROW)
    
    ;; Create escrow in storage
    (contract-call? .escrow-storage insert-escrow
      contract-caller
      freelancer
      amount
      invoice-hash
    )
  )
)

;; Fund escrow (client sends STX to this contract)
(define-public (fund-escrow (escrow-id uint))
  (let
    ((escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND)))
    
    ;; Only client can fund
    (asserts! (is-eq contract-caller (get client escrow)) ERR_UNAUTHORIZED)
    ;; Must be in "created" status
    (asserts! (is-eq (get status escrow) "created") ERR_ALREADY_FUNDED)
    
    ;; Transfer STX from client to this contract
    (try! (stx-transfer? (get amount escrow) contract-caller (as-contract tx-sender)))
    
    ;; Update storage
    (contract-call? .escrow-storage set-escrow-funded escrow-id stacks-block-height)
  )
)

;; Cancel escrow (only if not funded)
(define-public (cancel-escrow (escrow-id uint))
  (let
    ((escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND)))
    
    (asserts! (is-eq contract-caller (get client escrow)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status escrow) "created") ERR_ALREADY_FUNDED)
    
    (contract-call? .escrow-storage update-escrow-status escrow-id "cancelled")
  )
)

;; Mark work as delivered (called by freelancer)
(define-public (mark-delivered (escrow-id uint))
  (let
    (
      (escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND))
      (deadline (+ stacks-block-height REVIEW_PERIOD_BLOCKS))
    )
    
    (asserts! (is-eq contract-caller (get freelancer escrow)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status escrow) "funded") ERR_NOT_FUNDED)
    
    (try! (contract-call? .escrow-storage set-escrow-delivered
      escrow-id
      stacks-block-height
      deadline
    ))
    (ok deadline)
  )
)

;; Release payment (client approves OR auto-release after deadline)
(define-public (release-payment (escrow-id uint))
  (let
    ((escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND)))
    
    (asserts! (is-eq (get status escrow) "delivered") ERR_INVALID_STATUS)
    
    ;; Client can release anytime; anyone can trigger after deadline
    (asserts!
      (or
        (is-eq contract-caller (get client escrow))
        (> stacks-block-height (unwrap! (get review-deadline escrow) ERR_NOT_DELIVERED))
      )
      ERR_UNAUTHORIZED
    )
    
    ;; Transfer funds to freelancer
    (try! (as-contract (stx-transfer?
      (get amount escrow)
      tx-sender
      (get freelancer escrow)
    )))
    
    (contract-call? .escrow-storage set-escrow-completed escrow-id stacks-block-height)
  )
)

;; Request revision (client during review period)
(define-public (request-revision (escrow-id uint))
  (let
    ((escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND)))
    
    (asserts! (is-eq contract-caller (get client escrow)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status escrow) "delivered") ERR_INVALID_STATUS)
    (asserts!
      (<= stacks-block-height (unwrap! (get review-deadline escrow) ERR_NOT_DELIVERED))
      ERR_REVIEW_PERIOD_EXPIRED
    )
    
    (contract-call? .escrow-storage reset-escrow-to-funded escrow-id)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS: DISPUTES
;; ============================================

;; Initiate dispute (either party, freezes funds)
(define-public (initiate-dispute (escrow-id uint))
  (let
    ((escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND)))
    
    ;; Only client or freelancer can dispute
    (asserts!
      (or
        (is-eq contract-caller (get client escrow))
        (is-eq contract-caller (get freelancer escrow))
      )
      ERR_UNAUTHORIZED
    )
    
    ;; Check valid dispute states
    (asserts! (not (is-eq (get status escrow) "completed")) ERR_ALREADY_COMPLETED)
    (asserts! (not (is-eq (get status escrow) "disputed")) ERR_ALREADY_DISPUTED)
    (asserts!
      (or
        (is-eq (get status escrow) "funded")
        (is-eq (get status escrow) "delivered")
      )
      ERR_NOT_FUNDED
    )
    
    (contract-call? .escrow-storage update-escrow-status escrow-id "disputed")
  )
)

;; Resolve dispute (treasury/arbitrator only)
(define-public (resolve-dispute
    (escrow-id uint)
    (release-to-freelancer bool))
  (let
    ((escrow (unwrap! (get-escrow-data escrow-id) ERR_ESCROW_NOT_FOUND)))
    
    (asserts! (is-eq contract-caller (var-get treasury)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status escrow) "disputed") ERR_INVALID_STATUS)
    
    ;; Transfer based on resolution
    (try! (as-contract (stx-transfer?
      (get amount escrow)
      tx-sender
      (if release-to-freelancer
        (get freelancer escrow)
        (get client escrow)
      )
    )))
    
    (contract-call? .escrow-storage set-escrow-completed escrow-id stacks-block-height)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

(define-read-only (get-escrow (escrow-id uint))
  (get-escrow-data escrow-id)
)

(define-read-only (get-escrow-count)
  (contract-call? .escrow-storage get-escrow-count)
)

(define-read-only (is-review-period-expired (escrow-id uint))
  (match (get-escrow-data escrow-id)
    escrow
      (match (get review-deadline escrow)
        deadline (> stacks-block-height deadline)
        false
      )
    false
  )
)
