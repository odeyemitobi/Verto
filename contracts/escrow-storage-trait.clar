;; ============================================
;; ESCROW STORAGE TRAIT
;; ============================================
;; Defines interface for escrow storage contracts
;; Enables swapping storage implementations
;; ============================================

(define-trait escrow-storage-trait
  (
    ;; Read operations
    (get-escrow (uint) (response (optional {
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
    }) uint))
    
    (get-escrow-count () (response uint uint))
    
    (get-escrow-status (uint) (response (optional (string-ascii 20)) uint))
    
    ;; Write operations
    (insert-escrow 
      (principal principal uint (optional (buff 32))) 
      (response uint uint))
    
    (update-escrow-status (uint (string-ascii 20)) (response bool uint))
    
    (set-escrow-funded (uint uint) (response bool uint))
    
    (set-escrow-delivered (uint uint uint) (response bool uint))
    
    (set-escrow-completed (uint uint) (response bool uint))
    
    (reset-escrow-to-funded (uint) (response bool uint))
  )
)
