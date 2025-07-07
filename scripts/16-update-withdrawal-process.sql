-- Update withdrawal process to properly handle commission marking
-- This script ensures that when withdrawals are marked as paid, 
-- the corresponding referrals and data orders are marked as commission paid

-- Create a function to mark commissions as paid when withdrawal is processed
CREATE OR REPLACE FUNCTION mark_commissions_as_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Mark referral commissions as paid
    UPDATE referrals 
    SET "commissionPaid" = true, updated_at = NOW()
    WHERE id IN (
      SELECT (item->>'id')::uuid 
      FROM jsonb_array_elements(NEW.commission_items) AS item
      WHERE item->>'type' = 'referral'
    );
    
    -- Mark data order commissions as paid
    UPDATE data_orders 
    SET commission_paid = true, updated_at = NOW()
    WHERE id IN (
      SELECT (item->>'id')::uuid 
      FROM jsonb_array_elements(NEW.commission_items) AS item
      WHERE item->>'type' = 'data_order'
    );
    
    -- Set paid_at timestamp
    NEW.paid_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal status updates
DROP TRIGGER IF EXISTS trigger_mark_commissions_paid ON withdrawals;
CREATE TRIGGER trigger_mark_commissions_paid
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION mark_commissions_as_paid();

-- Add updated_at column to referrals and data_orders if not exists
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE data_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create triggers to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_orders_updated_at ON data_orders;
CREATE TRIGGER update_data_orders_updated_at
  BEFORE UPDATE ON data_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
