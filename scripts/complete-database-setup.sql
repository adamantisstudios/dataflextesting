-- Complete DataFlex Database Setup Script
-- Run this script to set up the entire database from scratch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    registration_fee_paid BOOLEAN DEFAULT FALSE,
    registration_fee_amount DECIMAL(10,2) DEFAULT 35.00,
    registration_expires_at TIMESTAMP,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES agents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_bundles table
CREATE TABLE IF NOT EXISTS data_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('MTN', 'Vodafone', 'AirtelTigo', 'Telecel')),
    size_gb DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    validity_months INTEGER NOT NULL DEFAULT 1,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_orders table
CREATE TABLE IF NOT EXISTS data_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    bundle_id UUID NOT NULL REFERENCES data_bundles(id),
    customer_phone VARCHAR(20) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50) DEFAULT 'momo',
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES agents(id),
    referred_id UUID NOT NULL REFERENCES agents(id),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
    commission_rate DECIMAL(5,2) NOT NULL,
    total_commission DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_id, referred_id)
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    amount DECIMAL(10,2) NOT NULL,
    momo_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    admin_notes TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES referrals(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('agent', 'admin')),
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_phone ON agents(phone);
CREATE INDEX IF NOT EXISTS idx_agents_referral_code ON agents(referral_code);
CREATE INDEX IF NOT EXISTS idx_agents_referred_by ON agents(referred_by);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

CREATE INDEX IF NOT EXISTS idx_data_bundles_provider ON data_bundles(provider);
CREATE INDEX IF NOT EXISTS idx_data_bundles_is_active ON data_bundles(is_active);

CREATE INDEX IF NOT EXISTS idx_data_orders_agent_id ON data_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_status ON data_orders(status);
CREATE INDEX IF NOT EXISTS idx_data_orders_created_at ON data_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_withdrawals_agent_id ON withdrawals(agent_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

CREATE INDEX IF NOT EXISTS idx_chat_messages_referral_id ON chat_messages(referral_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash, role)
VALUES ('admin', 'admin@dataflex.com', '$2b$10$rQZ9QmjKjKjKjKjKjKjKjOeJ9QmjKjKjKjKjKjKjKjKjKjKjKjKjK', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample data bundles
INSERT INTO data_bundles (name, provider, size_gb, price, validity_months, commission_rate, is_active)
VALUES 
    ('1GB MTN', 'MTN', 1, 4.50, 1, 8.00, true),
    ('5GB MTN', 'MTN', 5, 18.00, 1, 7.00, true),
    ('10GB MTN', 'MTN', 10, 32.00, 1, 6.00, true),
    ('20GB MTN', 'MTN', 20, 58.00, 1, 5.50, true),
    ('1GB AirtelTigo', 'AirtelTigo', 1, 4.20, 1, 8.50, true),
    ('5GB AirtelTigo', 'AirtelTigo', 5, 17.50, 1, 7.50, true),
    ('10GB AirtelTigo', 'AirtelTigo', 10, 30.00, 1, 6.50, true),
    ('20GB AirtelTigo', 'AirtelTigo', 20, 55.00, 1, 6.00, true),
    ('1GB Telecel', 'Telecel', 1, 4.00, 1, 9.00, true),
    ('5GB Telecel', 'Telecel', 5, 16.50, 1, 8.00, true),
    ('10GB Telecel', 'Telecel', 10, 28.00, 1, 7.00, true),
    ('20GB Telecel', 'Telecel', 20, 52.00, 1, 6.50, true)
ON CONFLICT DO NOTHING;

-- Create function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    LOOP
        code := 'DF' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM agents WHERE referral_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral codes
CREATE OR REPLACE FUNCTION set_referral_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
    BEFORE INSERT ON agents
    FOR EACH ROW
    EXECUTE FUNCTION set_referral_code();

-- Create function to handle referral commissions
CREATE OR REPLACE FUNCTION create_referral_chain(referred_agent_id UUID, referrer_agent_id UUID) RETURNS VOID AS $$
DECLARE
    level1_referrer UUID := referrer_agent_id;
    level2_referrer UUID;
    level3_referrer UUID;
BEGIN
    -- Level 1 referral (direct)
    IF level1_referrer IS NOT NULL THEN
        INSERT INTO referrals (referrer_id, referred_id, level, commission_rate)
        VALUES (level1_referrer, referred_agent_id, 1, 15.00);
        
        -- Get level 2 referrer
        SELECT referred_by INTO level2_referrer FROM agents WHERE id = level1_referrer;
        
        -- Level 2 referral
        IF level2_referrer IS NOT NULL THEN
            INSERT INTO referrals (referrer_id, referred_id, level, commission_rate)
            VALUES (level2_referrer, referred_agent_id, 2, 8.00);
            
            -- Get level 3 referrer
            SELECT referred_by INTO level3_referrer FROM agents WHERE id = level2_referrer;
            
            -- Level 3 referral
            IF level3_referrer IS NOT NULL THEN
                INSERT INTO referrals (referrer_id, referred_id, level, commission_rate)
                VALUES (level3_referrer, referred_agent_id, 3, 5.00);
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create referral chain
CREATE OR REPLACE FUNCTION handle_new_agent_referral() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referred_by IS NOT NULL THEN
        PERFORM create_referral_chain(NEW.id, NEW.referred_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_new_agent_referral
    AFTER INSERT ON agents
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_agent_referral();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_data_bundles_updated_at BEFORE UPDATE ON data_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_data_orders_updated_at BEFORE UPDATE ON data_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents
CREATE POLICY "Agents can view their own data" ON agents FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Agents can update their own data" ON agents FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for data_orders
CREATE POLICY "Agents can view their own orders" ON data_orders FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can create their own orders" ON data_orders FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Create RLS policies for referrals
CREATE POLICY "Agents can view their referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Create RLS policies for withdrawals
CREATE POLICY "Agents can view their own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can create their own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in their referral chats" ON chat_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM referrals r 
        WHERE r.id = referral_id 
        AND (r.referrer_id = auth.uid() OR r.referred_id = auth.uid())
    )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create view for agent statistics
CREATE OR REPLACE VIEW agent_stats AS
SELECT 
    a.id,
    a.full_name,
    a.email,
    a.phone,
    a.status,
    a.balance,
    a.total_earnings,
    a.created_at,
    COALESCE(order_stats.total_orders, 0) as total_orders,
    COALESCE(order_stats.total_sales, 0) as total_sales,
    COALESCE(referral_stats.direct_referrals, 0) as direct_referrals,
    COALESCE(referral_stats.total_referral_commission, 0) as total_referral_commission
FROM agents a
LEFT JOIN (
    SELECT 
        agent_id,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales
    FROM data_orders 
    WHERE status = 'completed'
    GROUP BY agent_id
) order_stats ON a.id = order_stats.agent_id
LEFT JOIN (
    SELECT 
        referrer_id,
        COUNT(*) as direct_referrals,
        SUM(total_commission) as total_referral_commission
    FROM referrals 
    WHERE level = 1 AND status = 'active'
    GROUP BY referrer_id
) referral_stats ON a.id = referral_stats.referrer_id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'DataFlex database setup completed successfully!';
    RAISE NOTICE 'Default admin credentials: username=admin, password=admin123';
    RAISE NOTICE 'Payment details: 0551999901 (Adamantis Solutions)';
END $$;
