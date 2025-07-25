-- Migration: Extend Participants Table for Multiple Shares
-- Description: Add support for multiple shares per participant and improved contribution tracking

-- Add new columns for multiple shares support
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 1 CHECK (shares_count > 0),
ADD COLUMN IF NOT EXISTS total_contribution DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS contribution_per_share DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS join_method TEXT DEFAULT 'manual' CHECK (join_method IN ('manual', 'invitation', 'public_link')),
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to set proper values
UPDATE participants 
SET shares_count = 1,
    updated_at = NOW()
WHERE shares_count IS NULL;

-- Set total_contribution and contribution_per_share based on pool data
UPDATE participants 
SET total_contribution = pools.contribution_amount,
    contribution_per_share = pools.contribution_amount
FROM pools 
WHERE participants.pool_id = pools.id 
AND participants.total_contribution IS NULL;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_participants_updated_at 
    BEFORE UPDATE ON participants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically calculate total_contribution
CREATE OR REPLACE FUNCTION calculate_participant_contribution()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total contribution based on shares and per-share amount
    IF NEW.shares_count IS NOT NULL AND NEW.contribution_per_share IS NOT NULL THEN
        NEW.total_contribution = NEW.shares_count * NEW.contribution_per_share;
    END IF;
    
    -- Set updated_at
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_participant_contribution_trigger
    BEFORE INSERT OR UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION calculate_participant_contribution();

-- Function to add shares to a participant
CREATE OR REPLACE FUNCTION add_participant_shares(
    participant_id UUID,
    additional_shares INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE participants
    SET shares_count = shares_count + additional_shares,
        updated_at = NOW()
    WHERE id = participant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get total pool shares
CREATE OR REPLACE FUNCTION get_pool_total_shares(pool_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_shares INTEGER;
BEGIN
    SELECT COALESCE(SUM(shares_count), 0)
    INTO total_shares
    FROM participants
    WHERE pool_id = get_pool_total_shares.pool_id
    AND status IN ('paid', 'confirmed');
    
    RETURN total_shares;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate participant share percentage
CREATE OR REPLACE FUNCTION get_participant_share_percentage(participant_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    participant_shares INTEGER;
    total_shares INTEGER;
    pool_id UUID;
BEGIN
    -- Get participant shares and pool_id
    SELECT shares_count, participants.pool_id
    INTO participant_shares, pool_id
    FROM participants
    WHERE id = participant_id;
    
    -- Get total pool shares
    SELECT get_pool_total_shares(pool_id) INTO total_shares;
    
    -- Calculate percentage
    IF total_shares > 0 THEN
        RETURN (participant_shares::DECIMAL / total_shares::DECIMAL) * 100;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add performance indexes for new columns
CREATE INDEX IF NOT EXISTS idx_participants_shares_count ON participants(shares_count);
CREATE INDEX IF NOT EXISTS idx_participants_join_method ON participants(join_method);
CREATE INDEX IF NOT EXISTS idx_participants_invited_by ON participants(invited_by);
CREATE INDEX IF NOT EXISTS idx_participants_invitation_token ON participants(invitation_token);

-- Add comments for documentation
COMMENT ON COLUMN participants.shares_count IS 'Number of shares this participant owns in the pool';
COMMENT ON COLUMN participants.total_contribution IS 'Total amount contributed by this participant (shares_count * contribution_per_share)';
COMMENT ON COLUMN participants.contribution_per_share IS 'Amount contributed per share';
COMMENT ON COLUMN participants.join_method IS 'How the participant joined: manual, invitation, or public_link';
COMMENT ON COLUMN participants.invited_by IS 'User who invited this participant (if applicable)';
COMMENT ON COLUMN participants.invitation_token IS 'Token used for invitation tracking';