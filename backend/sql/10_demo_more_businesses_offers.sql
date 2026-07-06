-- FoodSave demo data: mas comercios y ofertas activas
-- Ejecutar en Supabase Dashboard > SQL Editor despues de 01_schema.sql y migraciones.
-- Es idempotente: se puede correr mas de una vez sin duplicar registros.
-- Nota: SQL no puede generar/subir imagenes a Storage. Estas ofertas usan imagenes
-- publicas de comida real y logos de ui-avatars para que la demo no quede vacia.

INSERT INTO users (id, name, email, password, role, "businessId", phone, city)
VALUES
  (
    'user-business-sabor-casero',
    'Ana Gomez',
    'sabor.casero@foodsave.com',
    '123456',
    'business',
    'business-sabor-casero',
    '+54 9 362 5011234',
    'Resistencia, Chaco'
  ),
  (
    'user-business-mercado-fresco',
    'Luis Benitez',
    'mercado.fresco@foodsave.com',
    '123456',
    'business',
    'business-mercado-fresco',
    '+54 9 362 5025678',
    'Resistencia, Chaco'
  ),
  (
    'user-business-dulce-corrientes',
    'Marina Silva',
    'dulce.corrientes@foodsave.com',
    '123456',
    'business',
    'business-dulce-corrientes',
    '+54 9 379 5039012',
    'Corrientes, Corrientes'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "businessId" = EXCLUDED."businessId",
  phone = EXCLUDED.phone,
  city = EXCLUDED.city;

INSERT INTO businesses (
  id,
  name,
  "ownerId",
  category,
  description,
  city,
  address,
  "closingTime",
  "logoUrl",
  "isActive",
  "paymentInfo"
)
VALUES
  (
    'business-sabor-casero',
    'Sabor Casero Rotiseria',
    'user-business-sabor-casero',
    'Rotiseria / Restaurante',
    'Comidas caseras, viandas y platos listos para retirar al cierre.',
    'Resistencia, Chaco',
    'Av. 9 de Julio 1440',
    '22:30',
    'https://ui-avatars.com/api/?name=Sabor+Casero&background=EF4444&color=fff&bold=true&format=png',
    true,
    '{"ownerName":"Ana Gomez","cvu":"0000003100010123456810","alias":"SABOR.CASERO"}'
  ),
  (
    'business-mercado-fresco',
    'Mercado Fresco Chaco',
    'user-business-mercado-fresco',
    'Supermercado / Verduleria',
    'Almacen de barrio con frutas, verduras y productos frescos de rotacion diaria.',
    'Resistencia, Chaco',
    'Av. Sarmiento 980',
    '21:00',
    'https://ui-avatars.com/api/?name=Mercado+Fresco&background=16A34A&color=fff&bold=true&format=png',
    true,
    '{"ownerName":"Luis Benitez","cvu":"0000003100010123456811","alias":"MERCADO.FRESCO"}'
  ),
  (
    'business-dulce-corrientes',
    'Dulce Corrientes',
    'user-business-dulce-corrientes',
    'Cafeteria / Panaderia',
    'Cafe, tortas y panificados artesanales cerca del centro correntino.',
    'Corrientes, Corrientes',
    'Junin 1125',
    '21:30',
    'https://ui-avatars.com/api/?name=Dulce+Corrientes&background=F59E0B&color=fff&bold=true&format=png',
    true,
    '{"ownerName":"Marina Silva","cvu":"0000003100010123456812","alias":"DULCE.CTES"}'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "ownerId" = EXCLUDED."ownerId",
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  "closingTime" = EXCLUDED."closingTime",
  "logoUrl" = EXCLUDED."logoUrl",
  "isActive" = EXCLUDED."isActive",
  "paymentInfo" = EXCLUDED."paymentInfo";

INSERT INTO offers (
  id,
  "businessId",
  title,
  description,
  category,
  type,
  "oldPrice",
  "newPrice",
  stock,
  "pickupWindow",
  "pickupLimit",
  allergens,
  "imageUrl",
  "isVisible",
  "estimatedWeightInKg",
  "createdAt"
)
VALUES
  (
    'offer-sabor-casero-1',
    'business-sabor-casero',
    'Vianda casera del dia',
    'Porcion abundante de plato caliente del dia con guarnicion, lista para retirar.',
    'Rotiseria',
    'standard',
    6200,
    3300,
    6,
    '20:00 - 22:30',
    '22:30 hs',
    ARRAY['Consultar en local'],
    'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80',
    true,
    0.9,
    now() - interval '9 minutes'
  ),
  (
    'offer-sabor-casero-2',
    'business-sabor-casero',
    'Mystery Box rotiseria',
    'Caja sorpresa con empanadas, tartas o porciones listas segun disponibilidad del cierre.',
    'Mystery Box',
    'mystery_box',
    7200,
    3900,
    4,
    '20:30 - 22:30',
    '22:30 hs',
    ARRAY['TACC', 'Huevo', 'Lacteos'],
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    true,
    1.2,
    now() - interval '8 minutes'
  ),
  (
    'offer-mercado-fresco-1',
    'business-mercado-fresco',
    'Bolson de frutas y verduras',
    'Seleccion de frutas y verduras frescas con pequenos detalles esteticos.',
    'Verduleria',
    'standard',
    5500,
    2800,
    8,
    '18:00 - 21:00',
    '21:00 hs',
    ARRAY['Sin TACC'],
    'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=80',
    true,
    2.5,
    now() - interval '7 minutes'
  ),
  (
    'offer-mercado-fresco-2',
    'business-mercado-fresco',
    'Combo lacteos y almacen',
    'Productos de almacen y refrigerados con fecha corta, ideales para consumo inmediato.',
    'Supermercado',
    'standard',
    6800,
    3500,
    5,
    '19:00 - 21:00',
    '21:00 hs',
    ARRAY['Lacteos'],
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    true,
    1.8,
    now() - interval '6 minutes'
  ),
  (
    'offer-dulce-corrientes-1',
    'business-dulce-corrientes',
    'Pack merienda correntina',
    'Cafe frio embotellado, medialunas y porciones dulces del dia.',
    'Cafeteria',
    'standard',
    5200,
    2700,
    6,
    '18:30 - 21:30',
    '21:30 hs',
    ARRAY['TACC', 'Lacteos'],
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    true,
    0.7,
    now() - interval '5 minutes'
  ),
  (
    'offer-dulce-corrientes-2',
    'business-dulce-corrientes',
    'Mystery Box panaderia dulce',
    'Caja sorpresa con facturas, budines o tortas cortadas segun excedente disponible.',
    'Panaderia',
    'mystery_box',
    6400,
    3200,
    3,
    '19:00 - 21:30',
    '21:30 hs',
    ARRAY['TACC', 'Huevo', 'Lacteos'],
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=80',
    true,
    1.1,
    now() - interval '4 minutes'
  )
ON CONFLICT (id) DO UPDATE SET
  "businessId" = EXCLUDED."businessId",
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  "oldPrice" = EXCLUDED."oldPrice",
  "newPrice" = EXCLUDED."newPrice",
  stock = EXCLUDED.stock,
  "pickupWindow" = EXCLUDED."pickupWindow",
  "pickupLimit" = EXCLUDED."pickupLimit",
  allergens = EXCLUDED.allergens,
  "imageUrl" = EXCLUDED."imageUrl",
  "isVisible" = EXCLUDED."isVisible",
  "estimatedWeightInKg" = EXCLUDED."estimatedWeightInKg",
  "createdAt" = EXCLUDED."createdAt";
