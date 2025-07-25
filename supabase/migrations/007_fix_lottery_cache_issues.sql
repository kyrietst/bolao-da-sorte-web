-- Migration: Fix lottery_results_cache data type and add missing indexes
-- Description: This migration addresses critical database issues:
-- 1. Fix data type inconsistency in lottery_results_cache.draw_number (STRING -> INTEGER)
-- 2. Add missing indexes for performance and cache management

-- First, check if there's any data in the cache table that needs to be converted
-- If draw_number values can't be converted to integers, this will help identify issues
DO $$
BEGIN
    -- Test if all existing draw_numbers can be converted to integers
    IF EXISTS (
        SELECT 1 FROM lottery_results_cache 
        WHERE draw_number !~ '^[0-9]+$'
    ) THEN
        RAISE EXCEPTION 'Found non-numeric draw_number values in lottery_results_cache. Please clean data before migration.';
    END IF;
END $$;

-- Fix the data type inconsistency: change draw_number from STRING to INTEGER
-- This is done safely by creating a new column, copying data, dropping old column, and renaming
ALTER TABLE lottery_results_cache 
ADD COLUMN draw_number_new INTEGER;

-- Convert string values to integers
UPDATE lottery_results_cache 
SET draw_number_new = CAST(draw_number AS INTEGER);

-- Make the new column NOT NULL since it should always have a value
ALTER TABLE lottery_results_cache 
ALTER COLUMN draw_number_new SET NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE lottery_results_cache 
DROP COLUMN draw_number;

ALTER TABLE lottery_results_cache 
RENAME COLUMN draw_number_new TO draw_number;

-- Add critical missing indexes for performance and cache management

-- 1. Create unique index on (lottery_type, draw_number) for cache key uniqueness
-- This prevents duplicate cache entries for the same lottery draw
CREATE UNIQUE INDEX IF NOT EXISTS idx_lottery_cache_unique_key 
ON lottery_results_cache(lottery_type, draw_number);

-- 2. Create index on draw_date for date queries
-- This improves performance when querying by date ranges
CREATE INDEX IF NOT EXISTS idx_lottery_cache_draw_date 
ON lottery_results_cache(draw_date);

-- 3. Create index on updated_at for cache cleanup operations
-- This helps with cache expiration and cleanup processes
CREATE INDEX IF NOT EXISTS idx_lottery_cache_updated_at 
ON lottery_results_cache(updated_at);

-- 4. Create index on created_at for cache management
-- This helps with general cache management and analytics
CREATE INDEX IF NOT EXISTS idx_lottery_cache_created_at 
ON lottery_results_cache(created_at);

-- 5. Create composite index for efficient cache lookups by type and date
CREATE INDEX IF NOT EXISTS idx_lottery_cache_type_date 
ON lottery_results_cache(lottery_type, draw_date);

-- Add helpful comments for documentation
COMMENT ON COLUMN lottery_results_cache.draw_number IS 'Draw number as integer, matching lottery_results.draw_number data type';
COMMENT ON INDEX idx_lottery_cache_unique_key IS 'Ensures no duplicate cache entries for the same lottery type and draw number';
COMMENT ON INDEX idx_lottery_cache_draw_date IS 'Optimizes queries filtering by draw date';
COMMENT ON INDEX idx_lottery_cache_updated_at IS 'Supports cache cleanup operations based on last update time';
COMMENT ON INDEX idx_lottery_cache_created_at IS 'Supports cache management and analytics queries';
COMMENT ON INDEX idx_lottery_cache_type_date IS 'Optimizes combined lottery type and date queries';

-- Create or update the trigger for updating updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lottery_results_cache if it doesn't exist
DROP TRIGGER IF EXISTS update_lottery_cache_updated_at ON lottery_results_cache;
CREATE TRIGGER update_lottery_cache_updated_at 
    BEFORE UPDATE ON lottery_results_cache 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment for documentation
COMMENT ON TABLE lottery_results_cache IS 'Cache table for lottery API responses to reduce external API calls and improve performance';