-- Update all existing completed referrals to have commission_paid = false
-- so they become available for withdrawal
UPDATE referrals 
SET commission_paid = false 
WHERE status = 'completed' 
AND (commission_paid IS NULL OR commission_paid IS TRUE);

-- Update all existing completed data orders to have commission_paid = false
-- so they become available for withdrawal
UPDATE data_orders 
SET commission_paid = false 
WHERE status = 'completed' 
AND (commission_paid IS NULL OR commission_paid IS TRUE);

-- Ensure the columns have proper defaults
ALTER TABLE referrals 
ALTER COLUMN commission_paid SET DEFAULT false;

ALTER TABLE data_orders 
ALTER COLUMN commission_paid SET DEFAULT false;

-- Update any NULL values to false
UPDATE referrals 
SET commission_paid = false 
WHERE commission_paid IS NULL;

UPDATE data_orders 
SET commission_paid = false 
WHERE commission_paid IS NULL;

-- Make the columns NOT NULL now that we've cleaned up the data
ALTER TABLE referrals 
ALTER COLUMN commission_paid SET NOT NULL;

ALTER TABLE data_orders 
ALTER COLUMN commission_paid SET NOT NULL;
