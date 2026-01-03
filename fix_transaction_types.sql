-- =====================================================
-- Fix Transaction Types Migration
-- =====================================================
-- Created: 2026-01-03
-- Purpose: Fix missing transaction types and correct
--          admin-created deposit amounts
-- =====================================================

-- Step 1: Add missing transaction types to ENUM
-- -----------------------------------------------------
ALTER TABLE transactions
MODIFY COLUMN type ENUM(
    'topup',
    'payment',
    'refund',
    'adjustment',
    'deposit_payment',
    'deposit_refund',
    'debit'
) NOT NULL COMMENT 'Transaction type';

-- Step 2: Fix admin-created deposits
-- -----------------------------------------------------
-- These deposits were stored with type='debit' and positive amount
-- Need to change to type='deposit_payment' and negative amount
-- Only update records where amount is POSITIVE (safety check)

UPDATE transactions
SET
    type = 'deposit_payment',
    amount = -amount  -- Simply negate the positive amount
WHERE
    type = 'debit'
    AND description LIKE '%admin created%'
    AND amount > 0;  -- Only process positive amounts

-- Step 3: Verify the changes
-- -----------------------------------------------------
-- Run this to check that deposits now have negative amounts
-- SELECT id, user_id, type, amount, description, created_at
-- FROM transactions
-- WHERE type = 'deposit_payment'
-- ORDER BY created_at DESC;
