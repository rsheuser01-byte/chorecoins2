-- Create storage bucket for generated sound effects
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sound-effects',
  'sound-effects',
  true,
  5242880, -- 5MB limit per file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav']
);

-- RLS Policies for sound-effects bucket
-- Allow public read access to generated sounds
CREATE POLICY "Public read access to sound effects"
ON storage.objects FOR SELECT
USING (bucket_id = 'sound-effects');

-- Allow authenticated users to upload sounds
CREATE POLICY "Authenticated users can upload sound effects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sound-effects' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their sounds
CREATE POLICY "Authenticated users can update sound effects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sound-effects' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete sounds
CREATE POLICY "Authenticated users can delete sound effects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sound-effects' 
  AND auth.role() = 'authenticated'
);