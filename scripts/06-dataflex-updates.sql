-- Update data_bundles table to include commission rates
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00;

-- Update existing bundles with default 5% commission
UPDATE data_bundles SET commission_rate = 5.00 WHERE commission_rate IS NULL;

-- Add registration fee tracking for agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS registration_fee_reference TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS registration_expires_at TIMESTAMP WITH TIME ZONE;

-- Create agent_payments table for tracking registration fees
CREATE TABLE IF NOT EXISTS agent_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    payment_type TEXT CHECK (payment_type IN ('registration', 'renewal')) DEFAULT 'registration',
    amount DECIMAL(10,2) NOT NULL,
    payment_reference TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update data_orders to use 5-character payment references
-- Note: This will be handled in the application code

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_payments_agent_id ON agent_payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_payments_status ON agent_payments(status);
CREATE INDEX IF NOT EXISTS idx_data_bundles_commission_rate ON data_bundles(commission_rate);

-- Update commission calculation for data orders
-- This will be handled in the application code when creating orders
