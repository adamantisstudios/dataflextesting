-- Debug Data Orders - Check what's actually in the database
-- This script is SAFE to run - it only reads data, doesn't modify anything

-- Check if data_orders table exists and its structure
SELECT 'Checking data_orders table structure' as debug_step;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'data_orders' 
ORDER BY ordinal_position;

-- Check how many orders exist
SELECT 'Checking order counts' as debug_step;

SELECT COUNT(*) as total_orders FROM data_orders;

-- Check sample orders data
SELECT 'Sample orders data' as debug_step;

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
SELECT 'Checking agents table' as debug_step;

SELECT COUNT(*) as total_agents FROM agents;

SELECT id, full_name, phone_number FROM agents LIMIT 3;

-- Check if data_bundles table exists and has data
SELECT 'Checking data_bundles table' as debug_step;

SELECT COUNT(*) as total_bundles FROM data_bundles;

SELECT id, name, provider, size_gb, price FROM data_bundles LIMIT 3;

-- Test the exact query that the admin panel uses
SELECT 'Testing admin panel query' as debug_step;

SELECT 
    data_orders.id,
    data_orders.agent_id,
    data_orders.bundle_id,
    data_orders.recipient_phone,
    data_orders.payment_reference,
    data_orders.status,
    data_orders.commission_amount,
    data_orders.created_at,
    agents.full_name as agent_name,
    agents.phone_number as agent_phone,
    data_bundles.name as bundle_name,
    data_bundles.provider,
    data_bundles.size_gb,
    data_bundles.price as bundle_price,
    data_bundles.commission_rate
FROM data_orders
LEFT JOIN agents ON data_orders.agent_id = agents.id
LEFT JOIN data_bundles ON data_orders.bundle_id = data_bundles.id
ORDER BY data_orders.created_at DESC
LIMIT 5;

-- Show any potential issues
SELECT 'Checking for missing relationships' as debug_step;

SELECT 'Orders with missing agent' as issue, COUNT(*) as count
FROM data_orders
LEFT JOIN agents ON data_orders.agent_id = agents.id
WHERE agents.id IS NULL;

SELECT 'Orders with missing bundle' as issue, COUNT(*) as count
FROM data_orders
LEFT JOIN data_bundles ON data_orders.bundle_id = data_bundles.id
WHERE data_bundles.id IS NULL;
