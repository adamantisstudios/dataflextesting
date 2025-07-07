-- Debug Data Orders - Check what's actually in the database
-- This script is SAFE to run - it only reads data, doesn't modify anything

-- Check if data_orders table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'data_orders' 
ORDER BY ordinal_position;

-- Check how many orders exist
SELECT COUNT(*) as total_orders FROM data_orders;

-- Check sample orders data
SELECT 
    id,
    agent_id,
    bundle_id,
    recipient_phone,
    payment_reference,
    status,
    commission_amount,
    created_at
FROM data_orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if agents table has the expected structure
SELECT COUNT(*) as total_agents FROM agents;
SELECT id, full_name, phone_number FROM agents LIMIT 3;

-- Check if data_bundles table exists and has data
SELECT COUNT(*) as total_bundles FROM data_bundles;
SELECT id, name, provider, size_gb, price FROM data_bundles LIMIT 3;

-- Check for foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'data_orders';

-- Test the exact query that the admin panel uses
SELECT 
    do.*,
    a.full_name as agent_name,
    a.phone_number as agent_phone,
    db.name as bundle_name,
    db.provider,
    db.size_gb,
    db.price as bundle_price,
    db.commission_rate
FROM data_orders do
LEFT JOIN agents a ON do.agent_id = a.id
LEFT JOIN data_bundles db ON do.bundle_id = db.id
ORDER BY do.created_at DESC
LIMIT 5;

-- Show any potential issues
SELECT 'Orders with missing agent' as issue, COUNT(*) as count
FROM data_orders do
LEFT JOIN agents a ON do.agent_id = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 'Orders with missing bundle' as issue, COUNT(*) as count
FROM data_orders do
LEFT JOIN data_bundles db ON do.bundle_id = db.id
WHERE db.id IS NULL;
