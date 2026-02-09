;; ============================================
;; VERTO ESCROW STORAGE CONTRACT
;; ============================================
;; Stores escrow data with owner-gated access
;; Follows modular design for upgradability
;; ============================================

;; ============================================
;; CONSTANTS
;; ============================================

(define-constant ERR_NOT_OWNER (err u100))
(define-constant ERR_ESCROW_NOT_FOUND (err u101))

;; ============================================
;; DATA STORAGE
;; ============================================

;; Contract owner (can be updated for upgradability)
(define-data-var contract-owner principal tx-sender)

;; Escrow ID counter
(define-data-var escrow-nonce uint u0)

;; Escrow records
(define-map escrows
  uint
  {
    client: principal,
    freelancer: principal,
    amount: uint,
    status: (string-ascii 20),
    invoice-hash: (optional (buff 32)),
    created-at: uint,
    funded-at: (optional uint),
    delivered-at: (optional uint),
    review-deadline: (optional uint),
    completed-at: (optional uint)
  }
)

;; ============================================
;; AUTHORIZATION
;; ============================================

(define-read-only (is-contract-owner)
  (ok (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_OWNER))
)

(define-read-only (get-contract-owner)
  (var-get contract-owner)
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (try! (is-contract-owner))
    (ok (var-set contract-owner new-owner))
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

(define-read-only (get-escrow (escrow-id uint))
  (map-get? escrows escrow-id)
)

(define-read-only (get-escrow-count)
  (var-get escrow-nonce)
)

(define-read-only (get-escrow-status (escrow-id uint))
  (get status (map-get? escrows escrow-id))
)

;; ============================================
;; DATA MUTATION (OWNER-GATED)
;; ============================================

(define-public (insert-escrow
    (client principal)
    (freelancer principal)
    (amount uint)
    (invoice-hash (optional (buff 32))))
  (let
    ((escrow-id (var-get escrow-nonce)))
    (try! (is-contract-owner))
    (map-set escrows escrow-id
      {
        client: client,
        freelancer: freelancer,
        amount: amount,
        status: "created",
        invoice-hash: invoice-hash,
        created-at: stacks-block-height,
        funded-at: none,
        delivered-at: none,
        review-deadline: none,
        completed-at: none
      }
    )
    (var-set escrow-nonce (+ escrow-id u1))
    (ok escrow-id)
  )
)

(define-public (update-escrow-status
    (escrow-id uint)
    (new-status (string-ascii 20)))
  (let
    ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND)))
    (try! (is-contract-owner))
    (ok (map-set escrows escrow-id (merge escrow { status: new-status })))
  )
)

(define-public (set-escrow-funded
    (escrow-id uint)
    (funded-at uint))
  (let
    ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND)))
    (try! (is-contract-owner))
    (ok (map-set escrows escrow-id
      (merge escrow {
        status: "funded",
        funded-at: (some funded-at)
      })
    ))
  )
)

(define-public (set-escrow-delivered
    (escrow-id uint)
    (delivered-at uint)
    (review-deadline uint))
  (let
    ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND)))
    (try! (is-contract-owner))
    (ok (map-set escrows escrow-id
      (merge escrow {
        status: "delivered",
        delivered-at: (some delivered-at),
        review-deadline: (some review-deadline)
      })
    ))
  )
)

(define-public (set-escrow-completed
    (escrow-id uint)
    (completed-at uint))
  (let
    ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND)))
    (try! (is-contract-owner))
    (ok (map-set escrows escrow-id
      (merge escrow {
        status: "completed",
        completed-at: (some completed-at)
      })
    ))
  )
)

(define-public (reset-escrow-to-funded (escrow-id uint))
  (let
    ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND)))
    (try! (is-contract-owner))
    (ok (map-set escrows escrow-id
      (merge escrow {
        status: "funded",
        delivered-at: none,
        review-deadline: none
      })
    ))
  )
)
