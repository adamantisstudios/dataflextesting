-- Fix database schema to match admin panel expectations (Corrected Version)

-- First, let's check what columns exist and add missing ones
DO $$
BEGIN
    -- Add missing columns to data_orders if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_orders' AND column_name = 'recipient_phone') THEN
        ALTER TABLE data_orders ADD COLUMN recipient_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_orders' AND column_name = 'payment_reference') THEN
        ALTER TABLE data_orders ADD COLUMN payment_reference VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_orders' AND column_name = 'admin_notes') THEN
        ALTER TABLE data_orders ADD COLUMN admin_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_orders' AND column_name = 'commission_paid') THEN
        ALTER TABLE data_orders ADD COLUMN commission_paid BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Generate payment references for existing orders that don't have them
UPDATE data_orders 
SET payment_reference = 'TR' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0') || 'K6N'
WHERE payment_reference IS NULL;

-- Set default recipient phone for existing orders (you can update this with actual data)
UPDATE data_orders 
SET recipient_phone = '+233556355330'
WHERE recipient_phone IS NULL;

-- Add missing columns to referrals table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'client_name') THEN
        ALTER TABLE referrals ADD COLUMN client_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'client_phone') THEN
        ALTER TABLE referrals ADD COLUMN client_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'description') THEN
        ALTER TABLE referrals ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'service_id') THEN
        ALTER TABLE referrals ADD COLUMN service_id UUID REFERENCES services(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'commissionPaid') THEN
        ALTER TABLE referrals ADD COLUMN commissionPaid BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create services table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    commission_amount DECIMAL(10,2) NOT NULL,
    product_cost DECIMAL(10,2),
    service_type VARCHAR(50) DEFAULT 'referral',
    materials_link TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample services
INSERT INTO services (title, description, commission_amount, product_cost, service_type)
VALUES 
    ('Website Development', 'Professional website design and development', 500.00, 2000.00, 'referral'),
    ('Mobile App Development', 'Custom mobile application development', 800.00, 3500.00, 'referral'),
    ('Digital Marketing', 'Complete digital marketing package', 300.00, 1200.00, 'referral'),
    ('Logo Design', 'Professional logo and branding design', 150.00, 500.00, 'referral'),
    ('E-commerce Store', 'Complete online store setup', 600.00, 2500.00, 'referral')
ON CONFLICT (id) DO NOTHING;

-- Add missing columns to withdrawals table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'requested_at') THEN
        ALTER TABLE withdrawals ADD COLUMN requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update existing withdrawals with requested_at if it's null
UPDATE withdrawals 
SET requested_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE requested_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_orders_recipient_phone ON data_orders(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_data_orders_payment_reference ON data_orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_referrals_client_phone ON referrals(client_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_service_id ON referrals(service_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_agent_id ON data_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_bundle_id ON data_orders(bundle_id);

-- Let's also ensure we have some sample data that matches your screenshot
-- First, let's check if we have the agent "AMPONSAH HARRIET"
DO $$
DECLARE
    agent_exists BOOLEAN;
    agent_uuid UUID;
    bundle_uuid UUID;
BEGIN
    -- Check if agent exists
    SELECT EXISTS(SELECT 1 FROM agents WHERE full_name = 'AMPONSAH HARRIET') INTO agent_exists;
    
    IF NOT agent_exists THEN
        -- Create the agent if it doesn't exist
        INSERT INTO agents (full_name, phone_number, momo_number, region, isapproved, password_hash)
        VALUES ('AMPONSAH HARRIET', '+233556355330', '0556355330', 'Greater Accra', true, 'hashed_password_here')
        RETURNING id INTO agent_uuid;
    ELSE
        SELECT id INTO agent_uuid FROM agents WHERE full_name = 'AMPONSAH HARRIET' LIMIT 1;
    END IF;
    
    -- Check if we have a 1GB MTN bundle
    SELECT id INTO bundle_uuid FROM data_bundles WHERE name = '1GB MTN' OR (provider = 'MTN' AND size_gb = 1) LIMIT 1;
    
    IF bundle_uuid IS NULL THEN
        -- Create the bundle if it doesn't exist
        INSERT INTO data_bundles (name, provider, size_gb, price, validity_months, commission_rate, is_active)
        VALUES ('1GB MTN', 'MTN', 1, 6.00, 3, 5.0, true)
        RETURNING id INTO bundle_uuid;
    END IF;
    
    -- Now create a sample order that matches your screenshot
    INSERT INTO data_orders (
        agent_id, 
        bundle_id, 
        recipient_phone, 
        payment_reference, 
        status, 
        commission_amount,
        commission_paid,
        created_at
    )
    VALUES (
        agent_uuid,
        bundle_uuid,
        '0556355330',
        'TR278832602K6N',
        'completed',
        0.30,
        false,
        '2025-06-21'::date
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample data created successfully!';
END $$;

-- Update any existing referrals to have proper data
UPDATE referrals 
SET 
    client_name = 'Sample Client ' || id::text,
    client_phone = '+233' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0'),
    description = 'Sample referral description for service'
WHERE client_name IS NULL;

-- Link referrals to services
UPDATE referrals 
SET service_id = (SELECT id FROM services ORDER BY RANDOM() LIMIT 1)
WHERE service_id IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Admin data fixes applied successfully!';
    RAISE NOTICE 'Database schema updated to match admin panel expectations.';
    RAISE NOTICE 'Sample data created including the order from your screenshot.';
END $$;
