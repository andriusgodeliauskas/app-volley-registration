-- Migration: Add registration_cutoff_hours column to events table
-- Date: 2026-01-31
-- Description: Adds a column to limit when regular users can register/cancel registration
--              NULL = 1 hour default (current behavior)
--              Value = number of hours before event when registration closes

ALTER TABLE events
ADD COLUMN registration_cutoff_hours INT UNSIGNED NULL DEFAULT NULL
COMMENT 'Hours before event when registration closes for regular users. NULL = 1 hour default';

-- Example usage:
-- UPDATE events SET registration_cutoff_hours = 10 WHERE id = 1;
-- This means users cannot register/cancel when less than 10 hours remain before event
