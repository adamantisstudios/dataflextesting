-- Add payment_method column to data_orders table
ALTER TABLE data_orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) DEFAULT 'manual' CHECK (payment_method IN ('manual', 'wallet'));

-- Update existing records to have 'manual' as default
UPDATE data_orders SET payment_method = 'manual' WHERE payment_method IS NULL;
