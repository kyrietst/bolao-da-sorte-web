-- Migration: Create Payments Table
-- Description: Add payments table for comprehensive payment tracking and management

-- Create the payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit', 'debit', 'cash', 'bank_transfer')),
  transaction_id TEXT,
  external_payment_id TEXT, -- For payment gateway integration
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  gateway_response JSONB, -- Store gateway response data
  failure_reason TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_payments_participant_id ON payments(participant_id);
CREATE INDEX IF NOT EXISTS idx_payments_pool_id ON payments(pool_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Add GIN index for JSONB gateway_response queries
CREATE INDEX IF NOT EXISTS idx_payments_gateway_response_gin ON payments USING GIN (gateway_response);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to process payment completion
CREATE OR REPLACE FUNCTION complete_payment(payment_id UUID, transaction_ref TEXT)
RETURNS void AS $$
BEGIN
    UPDATE payments
    SET status = 'completed',
        transaction_id = transaction_ref,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = payment_id AND status IN ('pending', 'processing');
    
    -- Update participant payment status if payment is completed
    IF FOUND THEN
        UPDATE participants
        SET status = 'paid',
            updated_at = NOW()
        WHERE id = (SELECT participant_id FROM payments WHERE id = payment_id)
        AND status = 'pending_payment';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to process payment failure
CREATE OR REPLACE FUNCTION fail_payment(payment_id UUID, reason TEXT)
RETURNS void AS $$
BEGIN
    UPDATE payments
    SET status = 'failed',
        failure_reason = reason,
        updated_at = NOW()
    WHERE id = payment_id AND status IN ('pending', 'processing');
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(payment_id UUID, refund_amt DECIMAL, reason TEXT)
RETURNS void AS $$
BEGIN
    UPDATE payments
    SET status = 'refunded',
        refund_amount = refund_amt,
        refund_reason = reason,
        refunded_at = NOW(),
        updated_at = NOW()
    WHERE id = payment_id AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Comprehensive payment tracking for pool participations';
COMMENT ON COLUMN payments.participant_id IS 'Reference to the participant making the payment';
COMMENT ON COLUMN payments.pool_id IS 'Reference to the pool being paid for';
COMMENT ON COLUMN payments.amount IS 'Payment amount in Brazilian Reais';
COMMENT ON COLUMN payments.payment_method IS 'Method used for payment (PIX, credit card, etc.)';
COMMENT ON COLUMN payments.transaction_id IS 'Internal transaction identifier';
COMMENT ON COLUMN payments.external_payment_id IS 'External payment gateway transaction ID';
COMMENT ON COLUMN payments.gateway_response IS 'JSON response from payment gateway';