-- Agrega columna isVisible a offers
-- Ejecutar en Supabase Dashboard > SQL Editor

ALTER TABLE offers ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;
