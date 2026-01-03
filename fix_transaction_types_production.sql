-- =====================================================
-- Fix Transaction Types Migration - PRODUCTION
-- =====================================================
-- Created: 2026-01-03
-- Purpose: Fix missing transaction types and correct
--          admin-created deposit amounts in PRODUCTION DB
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
-- These deposits were stored with empty/NULL type and positive amount
-- Need to change to type='deposit_payment' and negative amount
-- PRODUCTION version - handles NULL/empty type values

UPDATE transactions
SET
    type = 'deposit_payment',
    amount = -amount
WHERE
    description = 'Deposit payment (admin created)'
    AND amount > 0;

-- Step 3: Verify the changes
-- -----------------------------------------------------
-- Run this to check that deposits now have negative amounts
-- SELECT id, user_id, type, amount, description, created_at
-- FROM transactions
-- WHERE description LIKE '%admin created%'
-- ORDER BY created_at DESC;

-- Expected result:
-- All admin-created deposits should show:
-- - type = 'deposit_payment'
-- - amount = negative value (e.g., -45.00 or -50.00)
