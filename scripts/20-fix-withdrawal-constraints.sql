-- Fix withdrawal status constraint to match application values
-- This script updates the withdrawal status constraint to use the correct values

-- First, update any existing 'pending' status to 'requested' to match the constraint
UPDATE withdrawals 
SET status = 'requested' 
WHERE status = 'pending';

-- Update any existing 'completed' status to 'paid' to match the constraint  
UPDATE withdrawals 
SET status = 'paid' 
WHERE status = 'completed';

-- Drop the existing constraint if it exists
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;

-- Add the correct constraint with proper status values
ALTER TABLE withdrawals 
ADD CONSTRAINT withdrawals_status_check 
CHECK (status IN ('requested', 'processing', 'paid', 'rejected'));

-- Add indexes for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_agent_status ON withdrawals(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON withdrawals(requested_at);

-- Add monthly withdrawal tracking for limits
CREATE INDEX IF NOT EXISTS idx_withdrawals_monthly_limit 
ON withdrawals(agent_id, requested_at) 
WHERE status != 'rejected';

-- Update any referrals or data_orders that might have incorrect commission_paid status
UPDATE referrals 
SET commission_paid = false 
WHERE status = 'completed' AND commission_paid IS NULL;

UPDATE data_orders 
SET commission_paid = false 
WHERE status = 'completed' AND commission_paid IS NULL;

-- Add comments for documentation
COMMENT ON CONSTRAINT withdrawals_status_check ON withdrawals IS 
'Withdrawal status must be one of: requested, processing, paid, rejected';

COMMENT ON COLUMN withdrawals.status IS 
'Status of withdrawal: requested (initial), processing (being processed), paid (completed), rejected (denied)';

-- Verify the changes
SELECT 
    status, 
    COUNT(*) as count,
    MIN(requested_at) as earliest,
    MAX(requested_at) as latest
FROM withdrawals 
GROUP BY status
ORDER BY status;
