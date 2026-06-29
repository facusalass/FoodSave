-- Storage bucket para imágenes de ofertas
-- Ejecutar en Supabase Dashboard > SQL Editor

INSERT INTO storage.buckets (id, name, public) VALUES ('offers', 'offers', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede leer
CREATE POLICY "Images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'offers');

-- Política: solo comercios autenticados pueden subir
CREATE POLICY "Business owners can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offers' AND auth.role() = 'authenticated');
