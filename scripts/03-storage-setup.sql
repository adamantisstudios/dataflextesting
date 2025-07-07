-- Create storage bucket for proof of work images
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);

-- Set up RLS policies for the proofs bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'proofs');

CREATE POLICY "Allow admin upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'proofs');

CREATE POLICY "Allow admin delete" ON storage.objects
FOR DELETE USING (bucket_id = 'proofs');
