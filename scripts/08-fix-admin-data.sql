-- Fix database schema to match admin panel expectations

-- Update data_orders table to match expected fields
ALTER TABLE data_orders 
ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT FALSE;

-- Update data_orders with missing data if recipient_phone is null
UPDATE data_orders 
SET recipient_phone = customer_phone 
WHERE recipient_phone IS NULL;

-- Update referrals table to match expected fields  
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS commissionPaid BOOLEAN DEFAULT FALSE;

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
ON CONFLICT DO NOTHING;

-- Update withdrawals table to match expected fields
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing withdrawals
UPDATE withdrawals 
SET requested_at = created_at 
WHERE requested_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_orders_recipient_phone ON data_orders(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_data_orders_payment_reference ON data_orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_referrals_client_phone ON referrals(client_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_service_id ON referrals(service_id);

-- Insert sample data orders with proper references
INSERT INTO data_orders (
    agent_id, 
    bundle_id, 
    recipient_phone, 
    payment_reference, 
    status, 
    commission_amount,
    customer_phone,
    quantity,
    unit_price,
    total_amount
)
SELECT 
    a.id as agent_id,
    db.id as bundle_id,
    '+233556355330' as recipient_phone,
    'TR' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0') || 'K6N' as payment_reference,
    'completed' as status,
    (db.price * db.commission_rate / 100) as commission_amount,
    '+233556355330' as customer_phone,
    1 as quantity,
    db.price as unit_price,
    db.price as total_amount
FROM agents a
CROSS JOIN data_bundles db
WHERE a.full_name = 'AMPONSAH HARRIET' 
AND db.name = '1GB MTN'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Admin data fixes applied successfully!';
    RAISE NOTICE 'Orders, referrals, and withdrawals should now work properly.';
END $$;
