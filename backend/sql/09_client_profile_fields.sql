-- Agrega campos editables del perfil cliente
-- Ejecutar en Supabase Dashboard > SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
