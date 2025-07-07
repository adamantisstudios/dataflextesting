-- Add password field to agents table
ALTER TABLE agents ADD COLUMN password_hash TEXT;

-- Create data_bundles table
CREATE TABLE data_bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('MTN', 'AirtelTigo', 'Telecel')),
    size_gb INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    validity_months INTEGER DEFAULT 3,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_orders table
CREATE TABLE data_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES data_bundles(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(15) NOT NULL,
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'canceled')),
    admin_notes TEXT,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    commission_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_order_status_history table
CREATE TABLE data_order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES data_orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES admin_users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_order_notes table for admin-agent communication
CREATE TABLE data_order_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES data_orders(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    original_note TEXT, -- Store original version when edited
    is_edited BOOLEAN DEFAULT false,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Add commission rates for data bundles
ALTER TABLE services ADD COLUMN service_type VARCHAR(20) DEFAULT 'referral' CHECK (service_type IN ('referral', 'data_bundle'));
ALTER TABLE services ADD COLUMN product_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE services ADD COLUMN image_url TEXT;

-- Insert sample data bundles
INSERT INTO data_bundles (name, provider, size_gb, price) VALUES
-- MTN Bundles
('1GB MTN', 'MTN', 1, 6.00),
('2GB MTN', 'MTN', 2, 12.00),
('3GB MTN', 'MTN', 3, 16.00),
('4GB MTN', 'MTN', 4, 21.00),
('5GB MTN', 'MTN', 5, 27.00),
('10GB MTN', 'MTN', 10, 46.00),
('15GB MTN', 'MTN', 15, 67.00),
('20GB MTN', 'MTN', 20, 84.00),
('50GB MTN', 'MTN', 50, 201.00),
('100GB MTN', 'MTN', 100, 396.00),

-- AirtelTigo Bundles
('1GB AirtelTigo', 'AirtelTigo', 1, 6.00),
('2GB AirtelTigo', 'AirtelTigo', 2, 10.00),
('3GB AirtelTigo', 'AirtelTigo', 3, 16.00),
('5GB AirtelTigo', 'AirtelTigo', 5, 25.00),
('10GB AirtelTigo', 'AirtelTigo', 10, 44.00),
('15GB AirtelTigo', 'AirtelTigo', 15, 57.00),
('20GB AirtelTigo', 'AirtelTigo', 20, 66.00),
('50GB AirtelTigo', 'AirtelTigo', 50, 116.00),
('100GB AirtelTigo', 'AirtelTigo', 100, 217.00),

-- Telecel Bundles
('5GB Telecel', 'Telecel', 5, 28.00),
('10GB Telecel', 'Telecel', 10, 47.00),
('15GB Telecel', 'Telecel', 15, 68.00),
('20GB Telecel', 'Telecel', 20, 89.00),
('25GB Telecel', 'Telecel', 25, 109.00),
('50GB Telecel', 'Telecel', 50, 207.00),
('100GB Telecel', 'Telecel', 100, 414.00);

-- Create indexes for better performance
CREATE INDEX idx_data_orders_agent_id ON data_orders(agent_id);
CREATE INDEX idx_data_orders_status ON data_orders(status);
CREATE INDEX idx_data_bundles_provider ON data_bundles(provider);
CREATE INDEX idx_data_order_status_history_order_id ON data_order_status_history(order_id);

-- Create trigger to update data_orders.updated_at
CREATE OR REPLACE FUNCTION update_data_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_order_timestamp
    BEFORE UPDATE ON data_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_data_order_timestamp();
