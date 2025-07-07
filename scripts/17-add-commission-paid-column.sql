-- Ensure the referrals table has the correctly named column
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT FALSE;

-- Migrate any old data (if you previously had commissionPaid)
DO $$
BEGIN
  IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name='referrals' AND column_name='commissionpaid'
  ) THEN
     UPDATE referrals SET commission_paid = commissionpaid
       WHERE commission_paid IS FALSE;
  END IF;
END;
$$;
