-- Check if we have any data orders at all
SELECT 'Total data orders' as info, COUNT(*) as count FROM data_orders;

-- Check if we have agents
SELECT 'Total agents' as info, COUNT(*) as count FROM agents;

-- Check if we have data bundles
SELECT 'Total data bundles' as info, COUNT(*) as count FROM data_bundles;

-- Show existing data bundles
SELECT 'Existing bundles:' as info;
SELECT id, name, provider, size_gb, price FROM data_bundles LIMIT 5;

-- Show existing agents
SELECT 'Existing agents:' as info;
SELECT id, full_name, phone_number FROM agents WHERE isapproved = true LIMIT 3;

-- Add the missing commission_rate column if it doesn't exist
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00;

-- Update existing bundles with commission rates
UPDATE data_bundles SET commission_rate = 5.00 WHERE commission_rate IS NULL;

-- Insert some sample data orders for testing (only if we have agents and bundles)
DO $$
DECLARE
    sample_agent_id UUID;
    sample_bundle_id UUID;
BEGIN
    -- Get a sample agent
    SELECT id INTO sample_agent_id FROM agents WHERE isapproved = true LIMIT 1;
    
    -- Get a sample bundle
    SELECT id INTO sample_bundle_id FROM data_bundles LIMIT 1;
    
    -- Only insert if we have both agent and bundle
    IF sample_agent_id IS NOT NULL AND sample_bundle_id IS NOT NULL THEN
        INSERT INTO data_orders (
            id,
            agent_id,
            bundle_id,
            recipient_phone,
            payment_reference,
            status,
            commission_amount,
            commission_paid,
            created_at,
            updated_at
        ) VALUES 
        (
            gen_random_uuid(),
            sample_agent_id,
            sample_bundle_id,
            '0241234567',
            'PAY' || LPAD(floor(random() * 10000)::text, 4, '0'),
            'pending',
            2.50,
            false,
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        ),
        (
            gen_random_uuid(),
            sample_agent_id,
            sample_bundle_id,
            '0551234567',
            'PAY' || LPAD(floor(random() * 10000)::text, 4, '0'),
            'completed',
            2.50,
            true,
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
        );
        
        RAISE NOTICE 'Sample orders created successfully';
    ELSE
        RAISE NOTICE 'Cannot create sample orders - missing agents or bundles';
    END IF;
END $$;

-- Final check
SELECT 'Final count - data orders' as info, COUNT(*) as count FROM data_orders;
