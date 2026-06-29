-- FoodSave Seed Data
-- Ejecutar después de migration.sql

INSERT INTO users (id, name, email, password, role, "businessId", phone) VALUES
('user-client-1', 'Mateo Cliente', 'cliente@foodsave.com', '123456', 'client', NULL, '+54 9 362 1234567'),
('user-business-1', 'Carlos (Dueño)', 'comercio@foodsave.com', '123456', 'business', 'business-espiga', '+54 9 362 4567890');

INSERT INTO businesses (id, name, "ownerId", category, description, address, "closingTime", "paymentInfo") VALUES
('business-espiga', 'Panadería La Espiga', 'user-business-1', 'Panadería / Pastelería', 'Especialistas en facturas y panificados.', 'Av. San Martín 123', '22:00', '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456789","alias":"PANADERIA.ESPIGA"}'),
('business-delicias', 'Café & Delicias', 'user-business-1', 'Panadería / Pastelería', 'Café de especialidad y pastelería artesanal.', 'Av. Alberdi 456', '21:00', '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456790","alias":"CAFE.DELICIAS"}'),
('business-rotiseria', 'Pizzería Napolitana', 'user-business-1', 'Rotisería', 'Pizzas artesanales y cocina al horno de barro.', 'Av. Italia 860', '22:30', '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456791","alias":"PIZZA.NAPOLITANA"}'),
('business-verde', 'Verde Mercado', 'user-business-1', 'Verdulería / Dietética', 'Productos orgánicos y vegetarianos.', 'French 340', '20:30', '{"ownerName":"Carlos Dueño","cvu":"0000003100010123456792","alias":"VERDE.MERCADO"}');

INSERT INTO offers (id, "businessId", title, description, category, type, "oldPrice", "newPrice", stock, "pickupWindow", "pickupLimit", allergens, "imageUrl", "estimatedWeightInKg") VALUES
('offer-1', 'business-espiga', 'Mystery Box Panadería', 'Mystery Box de productos de panadería', 'Panadería', 'mystery_box', 3000, 1500, 5, '18:00 - 22:00', '22:00 hs', ARRAY['TACC','Lácteos'], 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 1.5),
('offer-2', 'business-delicias', 'Productos próximos a vencer', 'Productos del día', 'SuperMercado', 'standard', 2500, 1200, 3, '19:00 - 21:00', '21:00 hs', ARRAY['Lácteos'], 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 0.8),
('offer-3', 'business-rotiseria', 'Pizza del día + bebida', 'Pizza del día + bebida', 'Rotisería', 'standard', 4000, 2000, 4, '20:00 - 22:30', '22:30 hs', ARRAY['Consultar en local'], 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80', 1.2),
('offer-4', 'business-verde', 'Combo vegetariano', 'Combo vegetariano de excedentes frescos', 'Mystery Box', 'mystery_box', 4800, 2600, 2, '17:30 - 20:30', '20:30 hs', ARRAY['Frutos secos'], 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 1.0);

INSERT INTO reservations (id, "offerId", "businessId", "userId", quantity, "totalPrice", code, "confirmationCode", status, "createdAt") VALUES
('reservation-1', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-A4B', '#FS-A4B', 'pending', '2026-05-03T18:00:00.000Z'),
('reservation-2', 'offer-2', 'business-delicias', 'user-client-1', 1, 1200, 'FS-C2D', '#FS-C2D', 'confirmed_paid', '2026-05-02T16:30:00.000Z'),
('reservation-3', 'offer-3', 'business-rotiseria', 'user-client-1', 2, 4000, 'FS-E8F', '#FS-E8F', 'picked_up', '2026-04-15T19:00:00.000Z'),
('reservation-4', 'offer-1', 'business-espiga', 'user-client-1', 1, 1500, 'FS-K9M', '#FS-K9M', 'cancelled', '2026-05-01T10:15:00.000Z');

INSERT INTO favorites ("userId", "offerId") VALUES
('user-client-1', 'offer-1'),
('user-client-1', 'offer-3');
