-- Ensure Admin Panel Works - Final Fix

-- First, let's check what tables and columns actually exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tables and columns...';
END $$;

-- Add missing columns safely
DO $$
BEGIN
    -- Add recipient_phone to data_orders if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_orders' AND column_name = 'recipient_phone'
    ) THEN
        ALTER TABLE data_orders ADD COLUMN recipient_phone VARCHAR(20);
        RAISE NOTICE 'Added recipient_phone to data_orders';
    END IF;
    
    -- Add payment_reference to data_orders if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_orders' AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE data_orders ADD COLUMN payment_reference VARCHAR(100);
        RAISE NOTICE 'Added payment_reference to data_orders';
    END IF;
    
    -- Add client_name to referrals if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'client_name'
    ) THEN
        ALTER TABLE referrals ADD COLUMN client_name VARCHAR(255);
        RAISE NOTICE 'Added client_name to referrals';
    END IF;
    
    -- Add client_phone to referrals if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'client_phone'
    ) THEN
        ALTER TABLE referrals ADD COLUMN client_phone VARCHAR(20);
        RAISE NOTICE 'Added client_phone to referrals';
    END IF;
    
    -- Add description to referrals if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'description'
    ) THEN
        ALTER TABLE referrals ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description to referrals';
    END IF;
    
    -- Add requested_at to withdrawals if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'requested_at'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added requested_at to withdrawals';
    END IF;
END $$;

-- Create services table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    product_cost DECIMAL(10,2) DEFAULT 0,
    service_type VARCHAR(50) DEFAULT 'referral',
    materials_link TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample services if none exist
INSERT INTO services (title, description, commission_amount, product_cost, service_type)
SELECT * FROM (VALUES 
    ('Website Development', 'Professional website design and development', 500.00, 2000.00, 'referral'),
    ('Mobile App Development', 'Custom mobile application development', 800.00, 3500.00, 'referral'),
    ('Digital Marketing', 'Complete digital marketing package', 300.00, 1200.00, 'referral'),
    ('Logo Design', 'Professional logo and branding design', 150.00, 500.00, 'referral'),
    ('E-commerce Store', 'Complete online store setup', 600.00, 2500.00, 'referral')
) AS v(title, description, commission_amount, product_cost, service_type)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

-- Update existing data with sample values
UPDATE data_orders 
SET 
    recipient_phone = COALESCE(recipient_phone, '0556355330'),
    payment_reference = COALESCE(payment_reference, 'TR' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0') || 'K6N')
WHERE recipient_phone IS NULL OR payment_reference IS NULL;

UPDATE referrals 
SET 
    client_name = COALESCE(client_name, 'Sample Client'),
    client_phone = COALESCE(client_phone, '0556355330'),
    description = COALESCE(description, 'Sample referral description')
WHERE client_name IS NULL OR client_phone IS NULL OR description IS NULL;

-- Update referrals to have valid service_id
UPDATE referrals 
SET service_id = (SELECT id FROM services LIMIT 1)
WHERE service_id IS NULL OR service_id NOT IN (SELECT id FROM services);

-- Update withdrawals requested_at
UPDATE withdrawals 
SET requested_at = COALESCE(requested_at, created_at, CURRENT_TIMESTAMP)
WHERE requested_at IS NULL;

-- Create sample data if tables are empty
DO $$
DECLARE
    agent_count INTEGER;
    bundle_count INTEGER;
    order_count INTEGER;
    referral_count INTEGER;
BEGIN
    -- Check if we have agents
    SELECT COUNT(*) INTO agent_count FROM agents;
    
    IF agent_count = 0 THEN
        INSERT INTO agents (full_name, phone_number, momo_number, region, isapproved)
        VALUES ('AMPONSAH HARRIET', '0556355330', '0556355330', 'Greater Accra', true);
        RAISE NOTICE 'Created sample agent';
    END IF;
    
    -- Check if we have data bundles
    SELECT COUNT(*) INTO bundle_count FROM data_bundles;
    
    IF bundle_count = 0 THEN
        INSERT INTO data_bundles (name, provider, size_gb, price, validity_months, commission_rate, is_active)
        VALUES 
            ('1GB MTN', 'MTN', 1, 6.00, 3, 5.0, true),
            ('2GB MTN', 'MTN', 2, 12.00, 3, 5.0, true),
            ('5GB MTN', 'MTN', 5, 25.00, 3, 5.0, true);
        RAISE NOTICE 'Created sample data bundles';
    END IF;
    
    -- Check if we have orders
    SELECT COUNT(*) INTO order_count FROM data_orders;
    
    IF order_count = 0 THEN
        INSERT INTO data_orders (
            agent_id, 
            bundle_id, 
            recipient_phone, 
            payment_reference, 
            status, 
            commission_amount,
            commission_paid
        )
        SELECT 
            (SELECT id FROM agents LIMIT 1),
            (SELECT id FROM data_bundles WHERE provider = 'MTN' AND size_gb = 1 LIMIT 1),
            '0556355330',
            'TR278832602K6N',
            'completed',
            0.30,
            false;
        RAISE NOTICE 'Created sample data order';
    END IF;
    
    -- Check if we have referrals
    SELECT COUNT(*) INTO referral_count FROM referrals;
    
    IF referral_count = 0 THEN
        INSERT INTO referrals (
            agent_id,
            service_id,
            client_name,
            client_phone,
            description,
            status,
            commissionPaid
        )
        SELECT 
            (SELECT id FROM agents LIMIT 1),
            (SELECT id FROM services LIMIT 1),
            'John Doe',
            '0244123456',
            'Website development for small business',
            'pending',
            false;
        RAISE NOTICE 'Created sample referral';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_orders_agent_id ON data_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_status ON data_orders(status);
CREATE INDEX IF NOT EXISTS idx_referrals_agent_id ON referrals(agent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_agent_id ON withdrawals(agent_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Final verification
DO $$
DECLARE
    agent_count INTEGER;
    service_count INTEGER;
    bundle_count INTEGER;
    order_count INTEGER;
    referral_count INTEGER;
    withdrawal_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agent_count FROM agents;
    SELECT COUNT(*) INTO service_count FROM services;
    SELECT COUNT(*) INTO bundle_count FROM data_bundles;
    SELECT COUNT(*) INTO order_count FROM data_orders;
    SELECT COUNT(*) INTO referral_count FROM referrals;
    SELECT COUNT(*) INTO withdrawal_count FROM withdrawals;
    
    RAISE NOTICE 'Final counts - Agents: %, Services: %, Bundles: %, Orders: %, Referrals: %, Withdrawals: %', 
        agent_count, service_count, bundle_count, order_count, referral_count, withdrawal_count;
END $$;

SELECT 'Admin panel setup completed successfully!' as result;
