-- Create admin_users table for secure admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Insert the admin user with hashed password
-- Password: adamantis382025aB@_%%%%%
INSERT INTO admin_users (email, password_hash, full_name) VALUES 
('sales.dataflex@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LQ4lqe.A9ThzIl3B6thQiuRCy02kooxjZK13m', 'TrustReach Admin');

-- Create admin sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can read their own data" ON admin_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admin sessions are accessible by owner" ON admin_sessions
    FOR ALL USING (auth.uid()::text = admin_id::text);
