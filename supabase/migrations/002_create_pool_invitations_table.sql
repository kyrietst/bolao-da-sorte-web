-- Migration: Create Pool Invitations Table
-- Description: Add pool_invitations table for managing pool invitations and invitation tracking

-- Create the pool_invitations table
CREATE TABLE IF NOT EXISTS pool_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(id),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  message TEXT, -- Optional invitation message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_pool_invitations_pool_id ON pool_invitations(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_invitations_token ON pool_invitations(token);
CREATE INDEX IF NOT EXISTS idx_pool_invitations_email ON pool_invitations(email);
CREATE INDEX IF NOT EXISTS idx_pool_invitations_status ON pool_invitations(status);
CREATE INDEX IF NOT EXISTS idx_pool_invitations_expires_at ON pool_invitations(expires_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_pool_invitations_updated_at 
    BEFORE UPDATE ON pool_invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE pool_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE pool_invitations IS 'Manages invitations sent to users to join lottery pools';
COMMENT ON COLUMN pool_invitations.pool_id IS 'Reference to the pool being invited to';
COMMENT ON COLUMN pool_invitations.invited_by IS 'User who sent the invitation';
COMMENT ON COLUMN pool_invitations.email IS 'Email address of the invited user';
COMMENT ON COLUMN pool_invitations.token IS 'Unique invitation token for security';
COMMENT ON COLUMN pool_invitations.expires_at IS 'When the invitation expires (default 7 days)';