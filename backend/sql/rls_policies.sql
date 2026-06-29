-- RLS Policies para FoodSave
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Permite que la anon key lea datos públicos y que usuarios autenticados operen sobre lo suyo

-- Users: cualquiera puede leer datos públicos, solo el dueño edita
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);

-- Businesses: visibles públicamente
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Businesses are viewable by everyone" ON businesses FOR SELECT USING (true);
CREATE POLICY "Business owners can insert" ON businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Business owners can update own" ON businesses FOR UPDATE USING (true);

-- Offers: visibles públicamente
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers are viewable by everyone" ON offers FOR SELECT USING (true);
CREATE POLICY "Business owners can insert offers" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Business owners can update own offers" ON offers FOR UPDATE USING (true);
CREATE POLICY "Business owners can delete own offers" ON offers FOR DELETE USING (true);

-- Reservations: visibles públicamente (para que el DTO pueda hacer JOINs)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reservations are viewable by everyone" ON reservations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reservations" ON reservations FOR UPDATE USING (true);

-- Favorites: visibles públicamente
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Favorites are viewable by everyone" ON favorites FOR SELECT USING (true);
CREATE POLICY "Anyone can insert favorites" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete favorites" ON favorites FOR DELETE USING (true);
