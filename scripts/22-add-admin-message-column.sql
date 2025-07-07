-- Add admin_message column to data_orders table if it doesn't exist
ALTER TABLE data_orders ADD COLUMN IF NOT EXISTS admin_message TEXT;

-- Create index for better performance when querying orders with messages
CREATE INDEX IF NOT EXISTS idx_data_orders_admin_message ON data_orders(admin_message) WHERE admin_message IS NOT NULL;

-- Update RLS policies to ensure admins can update data orders
DROP POLICY IF EXISTS "Admins can update data orders" ON data_orders;
CREATE POLICY "Admins can update data orders" ON data_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Ensure agents can view their own data orders (including admin messages)
DROP POLICY IF EXISTS "Agents can view their own data orders" ON data_orders;
CREATE POLICY "Agents can view their own data orders" ON data_orders
  FOR SELECT USING (agent_id = auth.uid());

-- Add comment to document the admin_message column
COMMENT ON COLUMN data_orders.admin_message IS 'Optional message from admin to agent regarding this specific order';
