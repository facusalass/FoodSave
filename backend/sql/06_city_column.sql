-- Agrega columna city a businesses
-- Ejecutar en Supabase Dashboard > SQL Editor

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Resistencia, Chaco';

-- Actualizar las ciudades de los negocios seed
UPDATE businesses SET city = 'Resistencia, Chaco' WHERE id = 'business-espiga';
UPDATE businesses SET city = 'Resistencia, Chaco' WHERE id = 'business-delicias';
UPDATE businesses SET city = 'Resistencia, Chaco' WHERE id = 'business-rotiseria';
UPDATE businesses SET city = 'Resistencia, Chaco' WHERE id = 'business-verde';
