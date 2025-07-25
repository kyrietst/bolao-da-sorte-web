-- Migration: Create Digital Receipts Table
-- Description: Add digital_receipts table for managing digital receipts of pool participation

-- Create the digital_receipts table
CREATE TABLE IF NOT EXISTS digital_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  receipt_data JSONB NOT NULL,
  receipt_type TEXT DEFAULT 'participation' CHECK (receipt_type IN ('participation', 'payment', 'winnings')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_digital_receipts_participant_id ON digital_receipts(participant_id);
CREATE INDEX IF NOT EXISTS idx_digital_receipts_pool_id ON digital_receipts(pool_id);
CREATE INDEX IF NOT EXISTS idx_digital_receipts_receipt_number ON digital_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_digital_receipts_type ON digital_receipts(receipt_type);
CREATE INDEX IF NOT EXISTS idx_digital_receipts_generated_at ON digital_receipts(generated_at);

-- Add GIN index for JSONB receipt_data queries
CREATE INDEX IF NOT EXISTS idx_digital_receipts_data_gin ON digital_receipts USING GIN (receipt_data);

-- Function to generate unique receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    receipt_number TEXT;
    year_part TEXT;
    sequence_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get next sequence number for the year
    SELECT COALESCE(MAX(CAST(SPLIT_PART(receipt_number, '-', 2) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM digital_receipts
    WHERE receipt_number LIKE year_part || '-%';
    
    receipt_number := year_part || '-' || LPAD(sequence_part::TEXT, 8, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_receipt_download(receipt_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE digital_receipts
    SET download_count = download_count + 1,
        last_downloaded_at = NOW()
    WHERE id = receipt_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE digital_receipts IS 'Digital receipts for pool participation, payments, and winnings';
COMMENT ON COLUMN digital_receipts.participant_id IS 'Reference to the participant';
COMMENT ON COLUMN digital_receipts.pool_id IS 'Reference to the pool';
COMMENT ON COLUMN digital_receipts.receipt_number IS 'Unique receipt number in format YYYY-XXXXXXXX';
COMMENT ON COLUMN digital_receipts.receipt_data IS 'JSON data containing receipt details (tickets, amounts, etc.)';
COMMENT ON COLUMN digital_receipts.receipt_type IS 'Type of receipt: participation, payment, or winnings';