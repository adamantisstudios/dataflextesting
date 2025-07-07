-- Add client contact preference to referrals table
ALTER TABLE referrals 
ADD COLUMN allow_direct_contact BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN referrals.allow_direct_contact IS 'Whether admin can contact the client directly. If false, agent prefers to handle all client communication.';

-- Update existing referrals to default to true (allow contact)
UPDATE referrals SET allow_direct_contact = true WHERE allow_direct_contact IS NULL;
