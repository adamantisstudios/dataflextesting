-- Final Admin Panel Fix - Clean and Simple

-- Add missing columns only if they don't exist (case-sensitive check)
DO $$
BEGIN
    -- Fix data_orders table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_orders' AND column_name = 'recipient_phone') THEN
        ALTER TABLE data_orders ADD COLUMN recipient_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_orders' AND column_name = 'payment_reference') THEN
        ALTER TABLE data_orders ADD COLUMN payment_reference VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'data_orders' AND column_name = 'admin_notes') THEN
        ALTER TABLE data_orders ADD COLUMN admin_notes TEXT;
    END IF;
    
    -- Fix referrals table (check for exact column names)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'referrals' AND column_name = 'client_name') THEN
        ALTER TABLE referrals ADD COLUMN client_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'referrals' AND column_name = 'client_phone') THEN
        ALTER TABLE referrals ADD COLUMN client_phone VARCHAR(20);
    END IF;
    
    -- Fix withdrawals table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'withdrawals' AND column_name = 'requested_at') THEN
        ALTER TABLE withdrawals ADD COLUMN requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    RAISE NOTICE 'Column additions completed successfully!';
END $$;

-- Create services table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Insert sample services (only if table is empty)
INSERT INTO services (title, description, commission_amount, product_cost, service_type)
SELECT * FROM (VALUES 
    ('Website Development', 'Professional website design and development', 500.00, 2000.00, 'referral'),
    ('Mobile App Development', 'Custom mobile application development', 800.00, 3500.00, 'referral'),
    ('Digital Marketing', 'Complete digital marketing package', 300.00, 1200.00, 'referral'),
    ('Logo Design', 'Professional logo and branding design', 150.00, 500.00, 'referral'),
    ('E-commerce Store', 'Complete online store setup', 600.00, 2500.00, 'referral')
) AS v(title, description, commission_amount, product_cost, service_type)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

-- Update existing data with defaults where needed
UPDATE data_orders 
SET payment_reference = 'TR' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0') || 'K6N'
WHERE payment_reference IS NULL OR payment_reference = '';

UPDATE data_orders 
SET recipient_phone = '+233556355330'
WHERE recipient_phone IS NULL OR recipient_phone = '';

UPDATE referrals 
SET client_name = 'Sample Client ' || SUBSTRING(id::text, 1, 8)
WHERE client_name IS NULL OR client_name = '';

UPDATE referrals 
SET client_phone = '+233' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0')
WHERE client_phone IS NULL OR client_phone = '';

UPDATE referrals 
SET description = 'Referral for ' || (SELECT title FROM services ORDER BY RANDOM() LIMIT 1)
WHERE description IS NULL OR description = '';

UPDATE referrals 
SET service_id = (SELECT id FROM services ORDER BY RANDOM() LIMIT 1)
WHERE service_id IS NULL;

UPDATE withdrawals 
SET requested_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE requested_at IS NULL;

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_data_orders_agent_status ON data_orders(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_agent_status ON referrals(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_agent_status ON withdrawals(agent_id, status);

-- Create the exact sample data from your screenshot
DO $$
DECLARE
    sample_agent_id UUID;
    sample_bundle_id UUID;
BEGIN
    -- Get or create sample agent
    SELECT id INTO sample_agent_id FROM agents WHERE full_name ILIKE '%HARRIET%' LIMIT 1;
    
    IF sample_agent_id IS NULL THEN
        INSERT INTO agents (full_name, phone_number, momo_number, region, isapproved)
        VALUES ('AMPONSAH HARRIET', '0556355330', '0556355330', 'Greater Accra', true)
        RETURNING id INTO sample_agent_id;
    END IF;
    
    -- Get or create 1GB MTN bundle
    SELECT id INTO sample_bundle_id FROM data_bundles 
    WHERE (name ILIKE '%1GB%' AND provider = 'MTN') OR (size_gb = 1 AND provider = 'MTN') 
    LIMIT 1;
    
    IF sample_bundle_id IS NULL THEN
        INSERT INTO data_bundles (name, provider, size_gb, price, validity_months, commission_rate, is_active)
        VALUES ('1GB MTN', 'MTN', 1, 6.00, 3, 5.0, true)
        RETURNING id INTO sample_bundle_id;
    END IF;
    
    -- Create the sample order from your screenshot
    INSERT INTO data_orders (
        agent_id, 
        bundle_id, 
        recipient_phone, 
        payment_reference, 
        status, 
        commission_amount,
        created_at
    )
    VALUES (
        sample_agent_id,
        sample_bundle_id,
        '0556355330',
        'TR278832602K6N',
        'completed',
        0.30,
        '2025-06-21 00:00:00'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample data created successfully!';
END $$;

-- Final success message
SELECT 'Admin panel database fixes completed successfully!' as status;
