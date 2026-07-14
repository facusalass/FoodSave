# FoodSave — Contexto del Backend

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js + Express 5 |
| Lenguaje | TypeScript (todo tipado estricto) |
| Base de datos | PostgreSQL vía Supabase (plan gratuito) |
| Autenticación | Supabase Auth (JWT) + Google OAuth |
| Imágenes | Supabase Storage (`offers` bucket) |
| Deploy | Render (`https://foodsave-unti.onrender.com`) |
| Build | `tsc` compila a `dist/` — pre-compilado y commiteado |

---

## Arquitectura

```
routes/  →  controllers/  →  services/  →  repository.ts  →  Supabase
```

**Capas:**

1. **`routes/`** — Solo definen verbo HTTP + path + middlewares + controller. No tienen lógica.
2. **`controllers/`** — Validan el request body/params/query, llaman al service, formatean la respuesta con `fail()` o `handleRegisterResult()`.
3. **`services/`** — Contienen la lógica de negocio real. Llaman al repository.
4. **`repository.ts`** — ÚNICO archivo que hace queries a Supabase. 209 líneas. Ningún otro archivo toca `supabase.from()`.
5. **Supabase** — PostgreSQL + Auth + Storage en la nube.

**Estructura de carpetas (`backend/src/`):**

```
config/         env.ts, supabase.ts                    (variables de entorno, clientes Supabase)
controllers/    auth, offerPublic, offerBusiness,       (handlers de Express)
                reservation, statistics, favorite,
                notification, upload, clientProfile
middlewares/    guards.ts, apiKey.ts, errorHandler.ts   (autenticación, API key, errores)
routes/         auth, offer, offerBusiness,             (definiciones de rutas)
                reservation, statistics, favorite,
                notification, upload, cities,
                clientProfile
services/       repository.ts, authService,             (lógica de negocio)
                authStrategy, offerService,
                reservationService, statisticsService,
                favoriteService, notificationService,
                clientProfileService
types/          auth.ts, offer.ts, reservation.ts,      (tipos TypeScript)
                statistics.ts, express.ts
utils/          pagination.ts, publicUser.ts            (helpers)
sql/            01_schema.sql, 02_seed.sql,             (migraciones)
                03_rls.sql, 04_auth_trigger.sql,
                05_storage.sql
```

---

## Endpoints — Tabla completa (actualizada)

### Auth

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Registro de cliente. Body: `{ email, password, name, phone }` |
| `POST` | `/auth/login` | ❌ | Login. Body: `{ email, password }` |
| `POST` | `/auth/google` | ❌ | Login con Google. Body: `{ idToken }` |
| `POST` | `/auth/reset-password` | ❌ | Recuperar contraseña. Body: `{ email }` |
| `POST` | `/auth/register-business` | `X-API-Key` | Registro de comercio (desde .NET). Body: `{ email, password, businessName, businessAddress, businessCategory, ownerName, businessCity?, ownerPhone? }` |
| `PATCH` | `/auth/register-business/toggle-active` | `X-API-Key` | Suspender/activar comercio. Body: `{ email, isActive }` |
| `GET` | `/auth/me` | `isAuth` | Perfil del usuario autenticado |

### Ofertas públicas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/offers` | ❌ | Lista paginada. Query: `?category=&type=&city=&page=1&limit=20`. Filtra: `isVisible=true`, `stock>0`, `isActive=true`. Devuelve DTO con `storeName`, `storeAddress`, `logoUrl`. |
| `GET` | `/offers/:id` | ❌ | Detalle de una oferta con datos del comercio |

### Ofertas del comercio (admin)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/business/offers` | `isBusinessOwner` | Lista solo las ofertas del comercio logueado |
| `POST` | `/business/offers` | `isBusinessOwner` | Crear oferta. Body: `{ title, description, category, type, oldPrice, newPrice, stock }` + opcionales |
| `PUT` | `/business/offers/:id` | `isBusinessOwner` | Editar oferta (doble condición: `offer.id` + `businessId`) |
| `PATCH` | `/business/offers/:id/visibility` | `isBusinessOwner` | Ocultar/mostrar. Body: `{ isVisible }` |
| `DELETE` | `/business/offers/:id` | `isBusinessOwner` | Eliminar oferta (doble condición) |
| `GET` | `/business/profile` | `isBusinessOwner` | Datos completos del comercio |
| `PUT` | `/business/profile` | `isBusinessOwner` | Editar perfil + `paymentInfo`. Body: `{ name?, category?, description?, city?, address?, closingTime?, logoUrl?, paymentInfo? }` |
| `GET` | `/business/stats` | `isBusinessOwner` | Dashboard: `totalRevenue`, `totalSavedKg`, `totalBoxesSold`, `totalCancelled`, `salesByWeek`, `topPublications` |

### Reservas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/reservations` | `isAuth` | Lista según rol. Cliente → sus reservas. Comercio → reservas de su negocio. `?page=&limit=`. Expira automáticamente las `pending` vencidas (>25 min). |
| `POST` | `/reservations` | `isAuth` | Crear reserva. Body: `{ offerId, quantity }`. Decrementa stock y setea `expiresAt = now + 25min`. |
| `PATCH` | `/reservations/:id/status` | `isAuth` | Cambiar estado. Cliente solo puede cancelar su `pending`. Comercio puede cualquier transición. Restaura stock al cancelar. |

### Perfil cliente

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/client/profile` | `isClient` | Perfil del cliente |
| `PUT` | `/client/profile` | `isClient` | Editar. Body: `{ name, phone?, city?, address? }`. No permite editar `email`, `role`, `id`, `password`. |

### Favoritos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/favorites` | `isClient` | Lista de ofertas favoritas (DTO enriquecido) |
| `POST` | `/favorites/:offerId` | `isClient` | Agregar favorito. No duplica |
| `DELETE` | `/favorites/:offerId` | `isClient` | Quitar favorito |

### Notificaciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/notifications` | `isAuth` | Lista todas las del usuario |
| `DELETE` | `/notifications` | `isAuth` | Elimina todas |
| `PATCH` | `/notifications/read-all` | `isAuth` | Marca todas como leídas |
| `PATCH` | `/notifications/:id/read` | `isAuth` | Marcar una como leída |
| `DELETE` | `/notifications/:id` | `isAuth` | Eliminar una notificación |

### Upload

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/upload/image` | `isBusinessOwner` | Subir imagen. `multipart/form-data`, campo `file`. Devuelve `{ url }`. Usa `supabaseAdmin.storage` (service_role) para bypassear RLS. |

### Ciudades

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/cities` | ❌ | Lista de ciudades únicas donde hay comercios registrados |

### Health

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/` | ❌ | `{ success: true, data: { message, version } }` |
| `GET` | `/health` | ❌ | `{ success: true, data: { status: "ok", service } }` |

---

## Formato de respuesta

Todo sigue este contrato exacto:

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "Descripción del error" } }
```

---

## Modelo de datos

### Tablas (6)

#### `users`
```
id, name, email (UNIQUE), password, role (client | business),
businessId?, phone?, city?, address?, createdAt
```
- Se sincroniza desde `auth.users` vía trigger (`04_auth_trigger.sql`).
- El trigger copia `id`, `email`, y `raw_user_meta_data` (name, role, phone, businessId).
- Usa `supabaseAdmin` para escrituras protegidas (perfil cliente).

#### `businesses`
```
id, name, ownerId → users.id, category, description, city, address,
closingTime, logoUrl?, isActive (default true),
paymentInfo JSONB { ownerName, cvu, alias }, createdAt
```
- `isActive`: permite suspender comercios desde el panel .NET.
- `paymentInfo`: datos bancarios del dueño para transferencias.

#### `offers`
```
id, businessId → businesses.id (CASCADE), title, description, category,
type (mystery_box | standard), oldPrice, newPrice, stock (default 0),
pickupWindow, pickupLimit, allergens TEXT[],
imageUrl, isVisible (default true), estimatedWeightInKg?, createdAt
```
- `isVisible`: oculta/muestra la oferta sin borrarla.
- `stock`: al llegar a 0 la oferta deja de aparecer en `GET /offers` público.
- `type`: `mystery_box` (caja sorpresa) o `standard`.

#### `reservations`
```
id, offerId → offers.id, businessId → businesses.id, userId → users.id,
quantity, totalPrice, code?, confirmationCode, expiresAt?,
status (pending | confirmed_paid | picked_up | cancelled), createdAt
```
- `expiresAt`: se setea a `now + 25 min` al crear. Si vence en estado `pending`, se cancela automáticamente al listar.
- `confirmationCode`: código con `#` (ej: `#FS-A4B`).

#### `favorites`
```
id (BIGSERIAL), userId → users.id (CASCADE), offerId → offers.id (CASCADE),
createdAt, UNIQUE(userId, offerId)
```
- Relación muchos a muchos con constraint de unicidad.

#### `notifications`
```
id, userId → users.id (CASCADE), type, title, message, reservationId,
read (default false), createdAt
```
- IDs estables: `${reservationId}-${type}` para no duplicar.
- Tipos: `reservation_created`, `payment_confirmed`, `pickup_reminder`, `reservation_expired`, `business_payment_received`.

---

## Autenticación (flujo completo)

### Registro (`POST /auth/register`)

```
authController.registerController  (valida email, password, name, phone)
  → authService.registerClient()
    1. Verifica si el email ya existe en public.users (findUserByEmail)
    2. Llama a supabase.auth.signUp() con user_metadata { name, phone, role: "client" }
    3. Supabase Auth inserta en auth.users
    4. El trigger on_auth_user_created copia a public.users
    5. Si Supabase tiene email confirmation activado → data.session será null
       → el controller responde { emailConfirmationRequired: true }
    6. Si NO tiene confirmación → devuelve { token: JWT, user }
```

### Login (`POST /auth/login`)

```
authController.loginController  (valida email, password)
  → authService.login()
    1. Intenta supabase.auth.signInWithPassword() → JWT real
    2. Si falla por "email not confirmed" → error 403
    3. Si falla por otras razones → fallback mock:
       busca en public.users por email + password
       → devuelve { token: "mock-token-{id}", user }
```

### Google Login (`POST /auth/google`)

```
authController.googleLoginController
  → authService.googleLogin()
    1. Valida el idToken con google-auth-library
    2. Si el email ya existe → login mock
    3. Si no existe → supabase.auth.signUp() con contraseña aleatoria
```

### Register Business (`POST /auth/register-business`)

```
authController.registerBusinessController  (requiere X-API-Key)
  → authService.registerBusiness()
    1. Genera businessId = "business-{timestamp}"
    2. supabaseAdmin.auth.admin.createUser() con email_confirm: true
       y user_metadata { businessId } → el trigger copia a public.users
    3. Inserta el comercio en businesses con createBusinessRepo()
    4. Actualiza users.businessId con el id real
    5. Login inmediato para obtener token JWT
```

### Validación de token en cada request

```
middleware isAuth / isClient / isBusinessOwner
  → guards.ts: authenticate()
    1. Extrae "Bearer <token>" del header Authorization
    2. Llama a validateToken(token) del authStrategy
       - Primero: supabase.auth.getUser(token) → JWT real
       - Fallback: mock-token-{id} → busca en public.users
    3. Si requiredRole → verifica role + businessId
    4. Guarda request.user y request.token
    5. next()
```

---

## Lógica de negocio clave

### Publicaciones (GET /offers)

- Filtros encadenados en `repository.ts:listOffersRepo()`:
  1. `isVisible = true`
  2. `stock > 0`
  3. Solo comercios con `isActive = true`
  4. Si `?city=`: filtra por `businesses.city`
  5. Si `?category=`: búsqueda parcial (`ilike`)
  6. Si `?type=`: exacta (`mystery_box` o `standard`)
- Paginación: `page` (default 1), `limit` (default 20, max 100).
- DTO enriquecido: cada oferta incluye `storeName`, `storeAddress`, `logoUrl` del comercio.

### Reservas (ciclo de vida)

```
POST /reservations
  → decrementa stock
  → crea reserva con status: "pending", expiresAt: now + 25min
  → genera notificaciones (cliente + comercio)

GET /reservations (al listar)
  → cancela automáticamente las pending vencidas (>25 min)
  → restaura stock de las canceladas
  → notifica expiración

PATCH /reservations/:id/status
  Cliente:
    → solo puede cancelar SU reserva en estado "pending"
    → restaura stock
  Comercio:
    → puede transicionar a cualquier estado
    → si confirmed_paid → notifica pago confirmado + recordatorio pickup
```

### Transiciones de estado

```
pending ──→ confirmed_paid ──→ picked_up
   │              │
   └── cancelled ←┘
```

### Expiración (no usa cron)

La expiración se evalúa **on-demand** cada vez que se listan reservas. Si hay `pending` con `expiresAt < now`, se cancelan automáticamente una por una:
1. Cambia `status = "cancelled"`
2. Restaura `stock += quantity`
3. Dispara notificación `reservation_expired`

---

## Upload de imágenes (`POST /upload/image`)

```
POST /upload/image  (isBusinessOwner + multer)
  → uploadController.uploadImageController()
    1. Recibe archivo como multipart/form-data (campo "file")
    2. Guarda en Supabase Storage bajo path: {businessId}/{timestamp}-{filename}
    3. Usa supabaseAdmin.storage (service_role → bypassea RLS)
    4. Devuelve URL pública generada por supabase.storage.getPublicUrl()
```

**Importante:** La política RLS del bucket `offers` exige `auth.role() = 'authenticated'` para INSERT. El backend usa el admin client para bypassear esto, ya que la validación de que es un comercio se hace antes en el middleware `isBusinessOwner`. Los SELECT (lectura de imágenes) son públicos sin restricción.

---

## Middlewares

### `guards.ts` — 3 middlewares en 1 archivo

| Middleware | Requisito | Error |
|---|---|---|
| `isAuth` | Token Bearer válido | 401 |
| `isClient` | Token válido + `role === "client"` | 403 |
| `isBusinessOwner` | Token válido + `role === "business"` + `businessId` no vacío | 403 |

### `apiKey.ts` — Protección para .NET

| Middleware | Requisito | Header |
|---|---|---|
| `requireApiKey` | `X-API-Key` coincide con `env.apiKey` | `X-API-Key: <key>` |

Usado en: `POST /auth/register-business` y `PATCH /auth/register-business/toggle-active`.

---

## API Key para .NET

El panel .NET se comunica con dos endpoints protegidos por `X-API-Key`:

1. **Crear comercio:** `POST /auth/register-business` — crea usuario auth + comercio en una sola llamada.
2. **Suspender/activar:** `PATCH /auth/register-business/toggle-active` — cambia `isActive` del comercio por email.

La API Key se configura en `.env` como `API_KEY` (por defecto: `foodsave-api-key-dev`).

---

## Migraciones SQL (5 archivos secuenciales)

| # | Archivo | Contenido |
|---|---|---|
| 01 | `01_schema.sql` | Enums (`user_role`, `offer_type`, `reservation_status`), 6 tablas con todas las columnas, índices |
| 02 | `02_seed.sql` | Datos demo: 5 usuarios, 9 comercios, 10 ofertas, 15 reservas, 2 favoritos |
| 03 | `03_rls.sql` | Políticas RLS: SELECT público en todas las tablas, INSERT/UPDATE/DELETE sin restricción |
| 04 | `04_auth_trigger.sql` | Trigger `on_auth_user_created`: sincroniza `auth.users` → `public.users` |
| 05 | `05_storage.sql` | Bucket `offers` público, políticas SELECT público + INSERT solo authenticated |

---

## Variables de entorno (`.env`)

```env
PORT=4000
SUPABASE_URL=https://lmmkszyrhjgbxzxtjwbm.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
API_KEY=FsXk9mP2vL7nQ4wR8yT1bD6cJ3aH5gE0
FRONTEND_ORIGIN=http://localhost:8081
```

- `SUPABASE_ANON_KEY`: cliente público para `supabase` (lecturas, signUp, signIn, getPublicUrl).
- `SUPABASE_SERVICE_ROLE_KEY`: cliente admin para `supabaseAdmin` (bypassea RLS — usado en upload, perfil cliente, registerBusiness).
- `GOOGLE_CLIENT_ID`: IDs separados por coma (Android + iOS + Web).
- `API_KEY`: clave compartida con el panel .NET.

---

## Usuarios de prueba (seed)

| Email | Password | Rol | businessId |
|---|---|---|---|
| `cliente@foodsave.com` | `123456` | client | — |
| `comercio@foodsave.com` | `123456` | business | `business-espiga` |
| `sabor.casero@foodsave.com` | `123456` | business | `business-sabor-casero` |
| `mercado.fresco@foodsave.com` | `123456` | business | `business-mercado-fresco` |
| `dulce.corrientes@foodsave.com` | `123456` | business | `business-dulce-corrientes` |

**Nota:** Como estos usuarios no existen en Supabase Auth (solo en `public.users`), el login usa el fallback mock-token. Para usuarios registrados desde la app, se usa JWT real.

---

## Referencia rápida de archivos

| Archivo | Línea clave | Qué hace |
|---|---|---|
| `app.ts:42-51` | Montaje de rutas | Conecta 10 módulos de rutas a Express |
| `config/env.ts:5-14` | `env` object | Variables de entorno tipadas con defaults |
| `config/supabase.ts:4-5` | `supabase`, `supabaseAdmin` | Clientes Supabase (anon + admin) |
| `controllers/authController.ts:24-37` | `loginController` | Maneja login: llama service, maneja email_not_confirmed |
| `controllers/authController.ts:39-50` | `registerController` | Maneja registro: valida campos, delega a service |
| `controllers/authController.ts:60-77` | `registerBusinessController` | Registro de comercio: valida API Key, delega a service |
| `controllers/authController.ts:79-94` | `toggleBusinessActiveController` | Suspender/activar: busca usuario por email, cambia isActive |
| `controllers/offerPublicController.ts:5-20` | `listOffersController` | GET /offers con filtros y paginación |
| `controllers/offerBusinessController.ts:6-73` | `createOfferController` | POST /business/offers con validación de type |
| `controllers/offerBusinessController.ts:75-115` | `updateOfferController` | PUT con doble condición de seguridad |
| `controllers/offerBusinessController.ts:168-180` | `toggleOfferVisibilityController` | PATCH isVisible |
| `controllers/reservationController.ts:69-105` | `createReservationController` | POST con decremento de stock |
| `controllers/reservationController.ts:26-67` | `updateReservationStatusController` | PATCH con reglas por rol |
| `controllers/uploadController.ts:6-39` | `uploadImageController` | Subida con supabaseAdmin (bypassea RLS) |
| `controllers/statisticsController.ts` | `getBusinessStatsController` | Dashboard con revenue semanal real |
| `middlewares/guards.ts:5-10` | `extractToken` | Extrae Bearer del header |
| `middlewares/guards.ts:16-22` | `isAuth` | Autenticación sin rol requerido |
| `middlewares/guards.ts:24-30` | `isClient` | Requiere role=client |
| `middlewares/guards.ts:32-38` | `isBusinessOwner` | Requiere role=business + businessId |
| `middlewares/guards.ts:40-73` | `authenticate` | Lógica central: extractToken → validateToken → checkRole |
| `middlewares/apiKey.ts:4-16` | `requireApiKey` | Valida header X-API-Key |
| `services/authService.ts:44-83` | `registerClient` | Registro con supabase.auth.signUp() |
| `services/authService.ts:94-118` | `login` | 3 intentos: JWT real → email_not_confirmed → mock |
| `services/authService.ts:144-163` | `googleLogin` | Google OAuth → signUp o login existente |
| `services/authService.ts:235-311` | `registerBusiness` | Admin API: createUser → createBusiness → update → login |
| `services/authStrategy.ts:6-33` | `validateToken` | JWT real (supabase.auth.getUser) + fallback mock-token |
| `services/repository.ts:71-97` | `listOffersRepo` | Filtros: isVisible + stock>0 + isActive + city + category + type + paginación |
| `services/repository.ts:99-119` | CRUD ofertas | findById, create, update (doble eq), delete (doble eq) |
| `services/repository.ts:18-39` | CRUD usuarios | findByEmail, findById, updateClientProfile (con supabaseAdmin) |
| `services/repository.ts:43-67` | CRUD comercios | findById, create, update, setActive |
| `services/repository.ts:128-158` | CRUD reservas | listar por user/business (paginated), findById, create, updateStatus |
| `services/offerService.ts:23-34` | `enrichOfferWithBusiness` | Junta oferta con datos del comercio |
| `services/offerService.ts:36-46` | `listOffers` | Llama listOffersRepo + enriquece cada oferta |
| `services/reservationService.ts:35-49` | `cancelReservationAndRestoreStock` | Cancela reserva y devuelve stock |
| `services/reservationService.ts:78-95` | `listReservationsForUser` | Cancela pending vencidas on-demand |
| `services/reservationService.ts:97-132` | `updateReservationStatus` | Reglas de transición por rol |
| `services/reservationService.ts:134-161` | `createReservation` | Valida stock, decrementa, crea con expiresAt, notifica |
| `services/notificationService.ts` | Templates | 6 tipos de notificaciones automáticas |
| `services/statisticsService.ts:4-52` | `getBusinessDashboardStats` | Revenue semanal real desde createdAt |
| `sql/01_schema.sql` | Schema | 6 tablas + 3 enums + 9 índices |
| `sql/02_seed.sql` | Seed | 5 usuarios + 9 comercios + 10 ofertas + 15 reservas |
| `sql/03_rls.sql` | RLS | Políticas permisivas para desarrollo |
| `sql/04_auth_trigger.sql` | Trigger | auth.users → public.users |
| `sql/05_storage.sql` | Storage | Bucket offers + políticas |
