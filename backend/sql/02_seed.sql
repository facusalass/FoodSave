-- FoodSave Seed Data
-- Ejecutar despues de 01_schema.sql, 03_rls.sql, 04_auth_trigger.sql

-- ── Cliente de prueba ───────────────────────────

INSERT INTO users (id, name, email, password, role, "businessId", phone, city) VALUES
('user-client-1', 'Mateo Cliente', 'cliente@foodsave.com', '123456', 'client', NULL, '+54 9 362 1234567', 'Resistencia, Chaco');

-- ── Comercios demo (mismo dueño para testing) ──

INSERT INTO users (id, name, email, password, role, "businessId", phone, city) VALUES
('user-business-1', 'Carlos (Dueño)', 'comercio@foodsave.com', '123456', 'business', 'business-espiga', '+54 9 362 4567890', 'Resistencia, Chaco');

INSERT INTO businesses (id, name, "ownerId", category, description, city, address, "closingTime", "logoUrl", "isActive", "paymentInfo") VALUES
('business-espiga', 'Panadería La Espiga', 'user-business-1', 'Panadería', 'Especialistas en facturas y panificados.', 'Resistencia, Chaco', 'Av. San Martín 123', '22:00', 'https://ui-avatars.com/api/?name=Panaderia+La+Espiga&background=FF6B35&color=fff&bold=true&format=png', true, '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456789","alias":"PANADERIA.ESPIGA"}'),
('business-delicias', 'Café & Delicias', 'user-business-1', 'Cafetería', 'Café de especialidad y pastelería artesanal.', 'Resistencia, Chaco', 'Av. Alberdi 456', '21:00', 'https://ui-avatars.com/api/?name=Cafe+Delicias&background=14B8A6&color=fff&bold=true&format=png', true, '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456790","alias":"CAFE.DELICIAS"}'),
('business-rotiseria', 'Pizzería Napolitana', 'user-business-1', 'Rotisería', 'Pizzas artesanales y cocina al horno de barro.', 'Resistencia, Chaco', 'Av. Italia 860', '22:30', 'https://ui-avatars.com/api/?name=Pizzeria+Napolitana&background=E64A19&color=fff&bold=true&format=png', true, '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456791","alias":"PIZZA.NAPOLITANA"}'),
('business-verde', 'Verde Mercado', 'user-business-1', 'Verdulería', 'Productos orgánicos y vegetarianos.', 'Resistencia, Chaco', 'French 340', '20:30', 'https://ui-avatars.com/api/?name=Verde+Mercado&background=0F766E&color=fff&bold=true&format=png', true, '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456792","alias":"VERDE.MERCADO"}'),
('business-corrientes-1', 'Heladería El Polo', 'user-business-1', 'Heladería', 'Helados artesanales.', 'Corrientes, Corrientes', 'Av. Costanera 450', '23:00', 'https://ui-avatars.com/api/?name=Heladeria+El+Polo&background=60A5FA&color=fff&bold=true&format=png', true, '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456793","alias":"HELADERIA.POLO"}'),
('business-corrientes-2', 'Parrilla Don Julio', 'user-business-1', 'Restaurante', 'Carnes a la leña.', 'Corrientes, Corrientes', 'Calle Junín 890', '00:00', 'https://ui-avatars.com/api/?name=Parrilla+Don+Julio&background=1F2937&color=fff&bold=true&format=png', true, '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456794","alias":"PARRILLA.JULIO"}');

-- ── Ofertas demo ────────────────────────────────

INSERT INTO offers (id, "businessId", title, description, category, type, "oldPrice", "newPrice", stock, "pickupWindow", "pickupLimit", allergens, "imageUrl", "isVisible", "estimatedWeightInKg") VALUES
('offer-1', 'business-espiga', 'Mystery Box Panadería', 'Mystery Box de productos de panadería', 'Panadería', 'mystery_box', 3000, 1500, 5, '18:00 - 22:00', '22:00 hs', ARRAY['TACC','Lácteos'], 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', true, 1.5),
('offer-2', 'business-delicias', 'Productos próximos a vencer', 'Productos del día próximos a vencer', 'Supermercado', 'standard', 2500, 1200, 3, '19:00 - 21:00', '21:00 hs', ARRAY['Lácteos'], 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', true, 0.8),
('offer-3', 'business-rotiseria', 'Pizza del día + bebida', 'Pizza del día + bebida', 'Rotisería', 'standard', 4000, 2000, 4, '20:00 - 22:30', '22:30 hs', ARRAY['Consultar en local'], 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', true, 1.2),
('offer-4', 'business-verde', 'Combo vegetariano', 'Combo vegetariano de excedentes frescos', 'Verdulería', 'mystery_box', 4800, 2600, 2, '17:30 - 20:30', '20:30 hs', ARRAY['Frutos secos'], 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', false, 1.0);

-- ── Reservas demo ───────────────────────────────

INSERT INTO reservations (id, "offerId", "businessId", "userId", quantity, "totalPrice", code, "confirmationCode", status, "createdAt") VALUES
('reservation-1', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-A4B', '#FS-A4B', 'pending', '2026-05-03T18:00:00.000Z'),
('reservation-2', 'offer-2', 'business-delicias', 'user-client-1', 1, 1200, 'FS-C2D', '#FS-C2D', 'confirmed_paid', '2026-05-02T16:30:00.000Z'),
('reservation-3', 'offer-3', 'business-rotiseria', 'user-client-1', 2, 4000, 'FS-E8F', '#FS-E8F', 'picked_up', '2026-04-15T19:00:00.000Z'),
('reservation-4', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-K9M', '#FS-K9M', 'cancelled', '2026-05-01T10:15:00.000Z'),
-- Dashboard: ventas 4 semanas atras
('res-espiga-w3-1', 'offer-1', 'business-espiga', 'user-client-1', 2, 3000, 'FS-W3A', '#FS-W3A', 'picked_up', '2026-06-14T14:00:00.000Z'),
('res-espiga-w3-2', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-W3B', '#FS-W3B', 'confirmed_paid', '2026-06-15T10:00:00.000Z'),
('res-espiga-w3-3', 'offer-1', 'business-espiga', 'user-client-1', 3, 4500, 'FS-W3C', '#FS-W3C', 'cancelled', '2026-06-16T09:00:00.000Z'),
('res-espiga-w2-1', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-W2A', '#FS-W2A', 'picked_up', '2026-06-19T18:30:00.000Z'),
('res-espiga-w2-2', 'offer-1', 'business-espiga', 'user-client-1', 2, 3000, 'FS-W2B', '#FS-W2B', 'picked_up', '2026-06-20T11:00:00.000Z'),
('res-espiga-w2-3', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-W2C', '#FS-W2C', 'picked_up', '2026-06-20T15:00:00.000Z'),
('res-espiga-w2-4', 'offer-1', 'business-espiga', 'user-client-1', 2, 3000, 'FS-W2D', '#FS-W2D', 'confirmed_paid', '2026-06-21T08:00:00.000Z'),
('res-espiga-w1-1', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-W1A', '#FS-W1A', 'picked_up', '2026-06-26T12:00:00.000Z'),
('res-espiga-w1-2', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-W1B', '#FS-W1B', 'confirmed_paid', '2026-06-27T17:00:00.000Z'),
('res-espiga-w0-1', 'offer-1', 'business-espiga', 'user-client-1', 3, 4500, 'FS-W0A', '#FS-W0A', 'picked_up', '2026-06-29T20:00:00.000Z');

-- ── Favoritos demo ──────────────────────────────

INSERT INTO favorites ("userId", "offerId") VALUES
('user-client-1', 'offer-1'),
('user-client-1', 'offer-3');

-- ── Mas comercios y ofertas demo ────────────────

INSERT INTO users (id, name, email, password, role, "businessId", phone, city) VALUES
('user-business-sabor-casero', 'Ana Gomez', 'sabor.casero@foodsave.com', '123456', 'business', 'business-sabor-casero', '+54 9 362 5011234', 'Resistencia, Chaco'),
('user-business-mercado-fresco', 'Luis Benitez', 'mercado.fresco@foodsave.com', '123456', 'business', 'business-mercado-fresco', '+54 9 362 5025678', 'Resistencia, Chaco'),
('user-business-dulce-corrientes', 'Marina Silva', 'dulce.corrientes@foodsave.com', '123456', 'business', 'business-dulce-corrientes', '+54 9 379 5039012', 'Corrientes, Corrientes')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role, "businessId" = EXCLUDED."businessId", phone = EXCLUDED.phone, city = EXCLUDED.city;

INSERT INTO businesses (id, name, "ownerId", category, description, city, address, "closingTime", "logoUrl", "isActive", "paymentInfo") VALUES
('business-sabor-casero', 'Sabor Casero Rotiseria', 'user-business-sabor-casero', 'Rotisería', 'Comidas caseras, viandas y platos listos para retirar al cierre.', 'Resistencia, Chaco', 'Av. 9 de Julio 1440', '22:30', 'https://ui-avatars.com/api/?name=Sabor+Casero&background=EF4444&color=fff&bold=true&format=png', true, '{"ownerName":"Ana Gomez","cvu":"0000003100010123456810","alias":"SABOR.CASERO"}'),
('business-mercado-fresco', 'Mercado Fresco Chaco', 'user-business-mercado-fresco', 'Supermercado', 'Almacen de barrio con frutas, verduras y productos frescos.', 'Resistencia, Chaco', 'Av. Sarmiento 980', '21:00', 'https://ui-avatars.com/api/?name=Mercado+Fresco&background=16A34A&color=fff&bold=true&format=png', true, '{"ownerName":"Luis Benitez","cvu":"0000003100010123456811","alias":"MERCADO.FRESCO"}'),
('business-dulce-corrientes', 'Dulce Corrientes', 'user-business-dulce-corrientes', 'Cafetería', 'Café, tortas y panificados artesanales cerca del centro correntino.', 'Corrientes, Corrientes', 'Junin 1125', '21:30', 'https://ui-avatars.com/api/?name=Dulce+Corrientes&background=F59E0B&color=fff&bold=true&format=png', true, '{"ownerName":"Marina Silva","cvu":"0000003100010123456812","alias":"DULCE.CTES"}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "ownerId" = EXCLUDED."ownerId", category = EXCLUDED.category, description = EXCLUDED.description, city = EXCLUDED.city, address = EXCLUDED.address, "closingTime" = EXCLUDED."closingTime", "logoUrl" = EXCLUDED."logoUrl", "isActive" = EXCLUDED."isActive", "paymentInfo" = EXCLUDED."paymentInfo";

INSERT INTO offers (id, "businessId", title, description, category, type, "oldPrice", "newPrice", stock, "pickupWindow", "pickupLimit", allergens, "imageUrl", "isVisible", "estimatedWeightInKg", "createdAt") VALUES
('offer-sabor-casero-1', 'business-sabor-casero', 'Vianda casera del dia', 'Porcion abundante de plato caliente del dia con guarnicion.', 'Rotisería', 'standard', 6200, 3300, 6, '20:00 - 22:30', '22:30 hs', ARRAY['Consultar en local'], 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80', true, 0.9, now() - interval '9 minutes'),
('offer-sabor-casero-2', 'business-sabor-casero', 'Mystery Box rotiseria', 'Caja sorpresa con empanadas, tartas o porciones listas.', 'Mystery Box', 'mystery_box', 7200, 3900, 4, '20:30 - 22:30', '22:30 hs', ARRAY['TACC', 'Huevo', 'Lacteos'], 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', true, 1.2, now() - interval '8 minutes'),
('offer-mercado-fresco-1', 'business-mercado-fresco', 'Bolson de frutas y verduras', 'Seleccion de frutas y verduras frescas con detalles esteticos.', 'Verdulería', 'standard', 5500, 2800, 8, '18:00 - 21:00', '21:00 hs', ARRAY['Sin TACC'], 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=80', true, 2.5, now() - interval '7 minutes'),
('offer-mercado-fresco-2', 'business-mercado-fresco', 'Combo lacteos y almacen', 'Productos de almacen y refrigerados con fecha corta.', 'Supermercado', 'standard', 6800, 3500, 5, '19:00 - 21:00', '21:00 hs', ARRAY['Lacteos'], 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', true, 1.8, now() - interval '6 minutes'),
('offer-dulce-corrientes-1', 'business-dulce-corrientes', 'Pack merienda correntina', 'Cafe frio embotellado, medialunas y porciones dulces del dia.', 'Cafetería', 'standard', 5200, 2700, 6, '18:30 - 21:30', '21:30 hs', ARRAY['TACC', 'Lacteos'], 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', true, 0.7, now() - interval '5 minutes'),
('offer-dulce-corrientes-2', 'business-dulce-corrientes', 'Mystery Box panaderia dulce', 'Caja sorpresa con facturas, budines o tortas cortadas.', 'Panadería', 'mystery_box', 6400, 3200, 3, '19:00 - 21:30', '21:30 hs', ARRAY['TACC', 'Huevo', 'Lacteos'], 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=80', true, 1.1, now() - interval '4 minutes')
ON CONFLICT (id) DO UPDATE SET "businessId" = EXCLUDED."businessId", title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category, type = EXCLUDED.type, "oldPrice" = EXCLUDED."oldPrice", "newPrice" = EXCLUDED."newPrice", stock = EXCLUDED.stock, "pickupWindow" = EXCLUDED."pickupWindow", "pickupLimit" = EXCLUDED."pickupLimit", allergens = EXCLUDED.allergens, "imageUrl" = EXCLUDED."imageUrl", "isVisible" = EXCLUDED."isVisible", "estimatedWeightInKg" = EXCLUDED."estimatedWeightInKg", "createdAt" = EXCLUDED."createdAt";
