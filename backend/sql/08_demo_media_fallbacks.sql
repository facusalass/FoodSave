-- FoodSave demo media backfill
-- Ejecutar manualmente solo si la base demo/dev ya existe y hay publicaciones sin imagen o negocios demo sin logo.
-- No modifica precios, stock, estados ni isActive.

UPDATE offers
SET "imageUrl" = CASE
  WHEN id = 'offer-1' THEN 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  WHEN id = 'offer-2' THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'
  WHEN id = 'offer-3' THEN 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
  WHEN id = 'offer-4' THEN 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
  ELSE "imageUrl"
END
WHERE id IN ('offer-1', 'offer-2', 'offer-3', 'offer-4')
  AND ("imageUrl" IS NULL OR trim("imageUrl") = '');

UPDATE businesses
SET "logoUrl" = CASE
  WHEN id = 'business-espiga' THEN 'https://ui-avatars.com/api/?name=Panaderia+La+Espiga&background=FF6B35&color=fff&bold=true&format=png'
  WHEN id = 'business-delicias' THEN 'https://ui-avatars.com/api/?name=Cafe+Delicias&background=14B8A6&color=fff&bold=true&format=png'
  WHEN id = 'business-rotiseria' THEN 'https://ui-avatars.com/api/?name=Pizzeria+Napolitana&background=E64A19&color=fff&bold=true&format=png'
  WHEN id = 'business-verde' THEN 'https://ui-avatars.com/api/?name=Verde+Mercado&background=0F766E&color=fff&bold=true&format=png'
  WHEN id = 'business-corrientes-1' THEN 'https://ui-avatars.com/api/?name=Heladeria+El+Polo&background=60A5FA&color=fff&bold=true&format=png'
  WHEN id = 'business-corrientes-2' THEN 'https://ui-avatars.com/api/?name=Parrilla+Don+Julio&background=1F2937&color=fff&bold=true&format=png'
  ELSE "logoUrl"
END
WHERE id IN (
    'business-espiga',
    'business-delicias',
    'business-rotiseria',
    'business-verde',
    'business-corrientes-1',
    'business-corrientes-2'
  )
  AND ("logoUrl" IS NULL OR trim("logoUrl") = '');
