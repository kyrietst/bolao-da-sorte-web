-- Migration: Improve Pool Status Management
-- Description: Enhance pool status constraints and add status transition management

-- Drop existing constraint if it exists
ALTER TABLE pools DROP CONSTRAINT IF EXISTS pools_status_check;

-- Add improved status constraint with more comprehensive statuses
ALTER TABLE pools 
ADD CONSTRAINT pools_status_check CHECK (
    status IN (
        'draft',           -- Pool is being created
        'open',            -- Pool is accepting participants
        'closed',          -- Pool is closed for new participants
        'draw_completed',  -- Lottery draw has occurred
        'finalized',       -- Results calculated and distributed
        'cancelled'        -- Pool was cancelled
    )
);

-- Add status transition tracking
ALTER TABLE pools 
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES profiles(id);

-- Function to update pool status with history tracking
CREATE OR REPLACE FUNCTION update_pool_status(
    pool_id UUID,
    new_status TEXT,
    changed_by_user UUID DEFAULT NULL,
    reason TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    current_status TEXT;
    status_entry JSONB;
BEGIN
    -- Get current status
    SELECT status INTO current_status FROM pools WHERE id = pool_id;
    
    -- Validate status transition
    IF NOT is_valid_status_transition(current_status, new_status) THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', current_status, new_status;
    END IF;
    
    -- Create status history entry
    status_entry := jsonb_build_object(
        'from_status', current_status,
        'to_status', new_status,
        'changed_at', NOW(),
        'changed_by', changed_by_user,
        'reason', reason
    );
    
    -- Update pool with new status and history
    UPDATE pools
    SET status = new_status,
        status_changed_at = NOW(),
        status_changed_by = changed_by_user,
        status_history = status_history || status_entry,
        updated_at = NOW()
    WHERE id = pool_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate status transitions
CREATE OR REPLACE FUNCTION is_valid_status_transition(current_status TEXT, new_status TEXT)
RETURNS boolean AS $$
BEGIN
    -- Define valid transitions
    CASE current_status
        WHEN 'draft' THEN
            RETURN new_status IN ('open', 'cancelled');
        WHEN 'open' THEN
            RETURN new_status IN ('closed', 'cancelled');
        WHEN 'closed' THEN
            RETURN new_status IN ('draw_completed', 'cancelled', 'open');
        WHEN 'draw_completed' THEN
            RETURN new_status IN ('finalized');
        WHEN 'finalized' THEN
            RETURN false; -- No transitions allowed from finalized
        WHEN 'cancelled' THEN
            RETURN false; -- No transitions allowed from cancelled
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically close pools when draw date is reached
CREATE OR REPLACE FUNCTION auto_close_pools_on_draw_date()
RETURNS void AS $$
BEGIN
    UPDATE pools
    SET status = 'closed',
        status_changed_at = NOW(),
        updated_at = NOW(),
        status_history = status_history || jsonb_build_object(
            'from_status', 'open',
            'to_status', 'closed',
            'changed_at', NOW(),
            'reason', 'Automatic closure on draw date'
        )
    WHERE status = 'open'
    AND draw_date <= NOW()
    AND draw_date >= NOW() - INTERVAL '1 day'; -- Only close pools from the last day
END;
$$ LANGUAGE plpgsql;

-- Function to get pools ready for status updates
CREATE OR REPLACE FUNCTION get_pools_by_status(pool_status TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    status TEXT,
    draw_date TIMESTAMP WITH TIME ZONE,
    participant_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.status,
        p.draw_date,
        COUNT(pt.id) as participant_count
    FROM pools p
    LEFT JOIN participants pt ON p.id = pt.pool_id AND pt.status IN ('paid', 'confirmed')
    WHERE p.status = pool_status
    GROUP BY p.id, p.name, p.status, p.draw_date
    ORDER BY p.draw_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for status-related queries
CREATE INDEX IF NOT EXISTS idx_pools_status_draw_date ON pools(status, draw_date);
CREATE INDEX IF NOT EXISTS idx_pools_status_changed_at ON pools(status_changed_at);
CREATE INDEX IF NOT EXISTS idx_pools_status_changed_by ON pools(status_changed_by);

-- Add GIN index for status_history JSONB queries
CREATE INDEX IF NOT EXISTS idx_pools_status_history_gin ON pools USING GIN (status_history);

-- Add comments for documentation
COMMENT ON COLUMN pools.status_history IS 'JSON array tracking all status changes with timestamps and reasons';
COMMENT ON COLUMN pools.status_changed_at IS 'Timestamp of the last status change';
COMMENT ON COLUMN pools.status_changed_by IS 'User who made the last status change';