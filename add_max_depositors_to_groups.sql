-- =====================================================
-- ADD max_depositors COLUMN TO groups TABLE
-- =====================================================
-- This migration adds the ability for super admin to set
-- a maximum number of depositors per group.
-- Default is NULL (unlimited).
-- =====================================================

ALTER TABLE `groups`
ADD COLUMN `max_depositors` INT UNSIGNED NULL DEFAULT NULL
COMMENT 'Maximum number of depositors allowed in this group (NULL = unlimited)'
AFTER `is_active`;

-- Note: NULL means unlimited depositors
-- Setting a number will limit how many users can have active deposits in this group
