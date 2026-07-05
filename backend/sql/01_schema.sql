-- FoodSave Migration v2 (camelCase)
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- Enums
CREATE TYPE user_role AS ENUM ('client', 'business');
CREATE TYPE offer_type AS ENUM ('mystery_box', 'standard');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed_paid', 'picked_up', 'cancelled');

-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  "businessId" TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Businesses
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "ownerId" TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  "closingTime" TEXT NOT NULL DEFAULT '22:00',
  "logoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "paymentInfo" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Offers
CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type offer_type NOT NULL DEFAULT 'standard',
  "oldPrice" INTEGER NOT NULL,
  "newPrice" INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  "pickupWindow" TEXT NOT NULL DEFAULT '',
  "pickupLimit" TEXT NOT NULL DEFAULT '',
  allergens TEXT[] NOT NULL DEFAULT '{}',
  "imageUrl" TEXT NOT NULL DEFAULT '',
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "estimatedWeightInKg" REAL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservations
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  "offerId" TEXT NOT NULL REFERENCES offers(id),
  "businessId" TEXT NOT NULL REFERENCES businesses(id),
  "userId" TEXT NOT NULL REFERENCES users(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  "totalPrice" INTEGER NOT NULL,
  code TEXT,
  "confirmationCode" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ,
  status reservation_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Favorites
CREATE TABLE favorites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "offerId" TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "offerId")
);

-- Notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_businesses_owner ON businesses("ownerId");
CREATE INDEX idx_offers_business ON offers("businessId");
CREATE INDEX idx_offers_category ON offers(category);
CREATE INDEX idx_offers_type ON offers(type);
CREATE INDEX idx_reservations_user ON reservations("userId");
CREATE INDEX idx_reservations_business ON reservations("businessId");
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_favorites_user ON favorites("userId");
CREATE INDEX idx_notifications_user ON notifications("userId");
