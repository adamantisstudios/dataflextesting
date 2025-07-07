-- Fix referrals table and add missing columns
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update data_bundles table to ensure commission_rate column exists
ALTER TABLE data_bundles 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00;

-- Update existing bundles to have default commission rate if null
UPDATE data_bundles 
SET commission_rate = 5.00 
WHERE commission_rate IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_agent_id ON referrals(agent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_data_orders_agent_id ON data_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_status ON data_orders(status);

-- Insert sample data bundles if none exist
INSERT INTO data_bundles (name, provider, size_gb, price, validity_months, commission_rate, is_active)
SELECT * FROM (VALUES
  ('1GB MTN', 'MTN', 1, 4.50, 1, 8.00, true),
  ('5GB MTN', 'MTN', 5, 18.00, 1, 7.00, true),
  ('10GB MTN', 'MTN', 10, 32.00, 1, 6.00, true),
  ('1GB AirtelTigo', 'AirtelTigo', 1, 4.20, 1, 8.50, true),
  ('5GB AirtelTigo', 'AirtelTigo', 5, 17.50, 1, 7.50, true),
  ('10GB AirtelTigo', 'AirtelTigo', 10, 30.00, 1, 6.50, true),
  ('1GB Telecel', 'Telecel', 1, 4.00, 1, 9.00, true),
  ('5GB Telecel', 'Telecel', 5, 16.50, 1, 8.00, true),
  ('10GB Telecel', 'Telecel', 10, 28.00, 1, 7.00, true)
) AS v(name, provider, size_gb, price, validity_months, commission_rate, is_active)
WHERE NOT EXISTS (SELECT 1 FROM data_bundles LIMIT 1);
