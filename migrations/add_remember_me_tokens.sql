-- Migration: Add Remember Me Token Support
-- Date: 2026-01-13
-- Description: Adds columns to support "Remember Me" functionality with long-lived tokens

-- Add remember_me_token and remember_me_expiry columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS remember_me_token VARCHAR(64) NULL,
ADD COLUMN IF NOT EXISTS remember_me_expiry DATETIME NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_remember_me_token ON users(remember_me_token);

-- Add comment for documentation
COMMENT ON COLUMN users.remember_me_token IS 'Long-lived token for "Remember Me" functionality (30 days)';
COMMENT ON COLUMN users.remember_me_expiry IS 'Expiry timestamp for remember_me_token';
