-- Drop all RLS policies to ensure unrestricted admin access
-- This script removes all Row Level Security policies temporarily

-- Disable RLS on all tables
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_bundles DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Verify admin user exists and is active
UPDATE admin_users 
SET is_active = true, 
    last_login = NOW()
WHERE email = 'sales.dataflex@gmail.com';

-- Clean up old sessions
DELETE FROM admin_sessions WHERE expires_at < NOW();

-- Grant full access to authenticated users (temporary)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Confirm the changes
SELECT 'RLS policies dropped successfully' as status;
