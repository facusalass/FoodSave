# FoodSave

FoodSave es una app móvil para reducir el desperdicio de comida conectando comercios gastronómicos con clientes que compran excedentes, productos del día o Mystery Boxes con descuento.

---

## Stack Tecnológico

### Frontend (mobile)

| Tecnología | Uso |
|---|---|
| Expo SDK 54 + React Native 0.81 + React 19 | Framework mobile cross-platform |
| Expo Router | Navegación por archivos con grupos de rutas |
| TypeScript | Tipado estricto en todo el frontend |
| `expo-secure-store` | Persistencia de sesión y tema |
| `expo-auth-session` | Google Login |
| `expo-image-picker` | Subir imágenes de ofertas/logos |
| `expo-location` | Detectar ciudad del usuario |
| `lucide-react-native` | Iconos |
| `react-native-reanimated` | Animaciones |

### Backend (API REST)

| Tecnología | Uso |
|---|---|
| Node.js + Express 5 | Servidor HTTP |
| TypeScript | Tipado estricto |
| `@supabase/supabase-js` | Cliente Supabase (anon + admin con service_role) |
| Supabase Auth | Registro, login, JWT, Google OAuth |
| Supabase Storage | Imágenes de ofertas (bucket `offers`) |
| `multer` | Recepción de archivos multipart |
| `google-auth-library` | Validación de Google idToken |

### Base de datos

| Componente | Detalle |
|---|---|
| Motor | PostgreSQL vía Supabase |
| Esquemas | `auth.users` (Supabase Auth) + `public.users`, `public.businesses`, `public.offers`, `public.reservations`, `public.favorites`, `public.notifications` |
| Storage | Bucket público `offers` para imágenes |
| Migraciones | 5 SQL scripts secuenciales en `backend/sql/` |

---

## Estructura del Proyecto

```
FoodSave/
├── docs/                           Documentación interna
│   ├── BACKEND_CONTEXT.md          Explicación completa del backend
│   ├── PROJECT_CONTEXT.md          Contexto funcional del proyecto
│   └── CODEX_RULES.md              Reglas internas de desarrollo
│
├── frontend/                       App mobile Expo
│   ├── app/                        Rutas Expo Router
│   │   ├── (auth)/                 Pantallas de login, registro, recuperación
│   │   ├── (client)/               Pantallas de cliente (home, reservas, perfil, favoritos)
│   │   └── (business)/             Pantallas de comercio (dashboard, publicar, pedidos, local)
│   ├── src/
│   │   ├── components/             Componentes reutilizables UI
│   │   │   └── business/           Subcomponentes de comercio (menú lateral, banner, notificaciones)
│   │   ├── config/                 Configuración (API base URL, Google Auth, links)
│   │   ├── constants/              Temas, categorías de ofertas, tipos
│   │   ├── context/                AuthContext (sesión), ThemeContext (claro/oscuro)
│   │   ├── hooks/                  Hooks de notificaciones (cliente y comercio)
│   │   ├── services/               Clientes API por dominio (auth, offers, reservations, favorites, etc.)
│   │   ├── types/                  Tipos TypeScript (auth, offer, reservation, notification, statistics)
│   │   └── utils/                  Helpers (sesión, tema, formato, validación, WhatsApp, etc.)
│   └── .env                        Variables de entorno (API_URL, Google Client IDs, Landing URL)
│
├── backend/                        API REST
│   ├── src/
│   │   ├── app.ts                  Middlewares globales + montaje de 10 rutas
│   │   ├── server.ts               Entry point
│   │   ├── config/                 env.ts, supabase.ts (client anon + admin)
│   │   ├── controllers/            Handlers HTTP
│   │   ├── routes/                 Definición de endpoints
│   │   ├── services/               Lógica de negocio + repository.ts
│   │   ├── middlewares/            guards.ts (auth/roles), apiKey.ts, errorHandler.ts
│   │   ├── types/                  auth.ts, offer.ts, reservation.ts, statistics.ts, express.ts
│   │   └── utils/                  pagination.ts, publicUser.ts
│   ├── sql/                        Migraciones SQL (5 archivos)
│   ├── dist/                       Código compilado (pre-commiteado para Render)
│   └── .env                        Variables de entorno (no subir)
│
├── package.json                    Monorepo con workspaces: ["frontend", "backend"]
├── .npmrc                          workspace=false (para Render)
└── README.md                       Este archivo
```

---

## Arquitectura del Backend

### Capas

```
Ruta (route) → Middleware → Controller → Service → Repository → Supabase
```

Cada capa tiene una responsabilidad única:

| Capa | Responsabilidad | Archivo ejemplo |
|---|---|---|
| **Route** | Define verbo HTTP + path + middlewares + controller | `routes/offerBusinessRoutes.ts` |
| **Middleware** | Valida token JWT, rol, API Key | `middlewares/guards.ts` |
| **Controller** | Valida request body/params, llama al service, arma response | `controllers/offerBusinessController.ts` |
| **Service** | Lógica de negocio, reglas, armado de DTOs | `services/offerService.ts` |
| **Repository** | Único que hace queries a Supabase (209 líneas, ~30 funciones) | `services/repository.ts` |
| **Supabase** | PostgreSQL + Auth + Storage | — |

### Middlewares de autenticación y roles

Definidos en `backend/src/middlewares/guards.ts`:

| Middleware | Requisito | Error si falla |
|---|---|---|
| `isAuth` | Token Bearer válido (JWT real o mock-token) | 401 |
| `isClient` | `isAuth` + `role === "client"` | 403 |
| `isBusinessOwner` | `isAuth` + `role === "business"` + `businessId !== undefined` | 403 |
| `requireApiKey` | Header `X-API-Key` coincide con `env.apiKey` | 401 |

### Estrategia de validación de tokens

En `services/authStrategy.ts`, función `validateToken()`:

1. **JWT real de Supabase:** llama a `supabase.auth.getUser(token)`. Si el token está firmado por Supabase Auth y es válido, devuelve los datos del usuario.
2. **Fallback mock-token:** si el token tiene formato `mock-token-{userId}`, busca al usuario en `public.users` por ID. Esto existe únicamente para los usuarios del seed de desarrollo que no existen en `auth.users`.

---

## Autenticación (flujo completo)

### Registro de cliente (`POST /auth/register`)

```
registerController (valida campos) → authService.registerClient()
```

1. Verifica que el email no exista en `public.users` mediante `findUserByEmail()` del repositorio.
2. Llama a `supabase.auth.signUp({ email, password, options: { data: { name, phone, role: "client" } } })`.
3. Supabase Auth crea el usuario en `auth.users` (donde se almacena la contraseña hasheada).
4. Un **trigger de base de datos** (`04_auth_trigger.sql`) detecta el INSERT en `auth.users` y copia automáticamente los datos a `public.users`:
   - Toma `id`, `email` y `raw_user_meta_data` (name, phone, role, businessId) del usuario recién creado.
5. Si Supabase tiene **email confirmation** activado, `data.session` será `null` y se responde que el usuario debe revisar su correo.
6. Si no tiene confirmación, se devuelve el JWT (`data.session.access_token`) y los datos del usuario.

### Login (`POST /auth/login`)

```
loginController → authService.login()
```

1. Intenta `supabase.auth.signInWithPassword({ email, password })` — valida contra Supabase Auth.
2. Si funciona → devuelve JWT real + datos del usuario.
3. Si falla por "email not confirmed" → error 403.
4. **Fallback para seed:** busca en `public.users` por email + password (texto plano). Solo funciona con los 5 usuarios del demo que tienen contraseña en la columna `password`. Devuelve `mock-token-{userId}`.

### Google Login (`POST /auth/google`)

```
googleLoginController → authService.googleLogin()
```

1. El frontend envía un `idToken` obtenido de Google Sign-In.
2. El backend valida el token con `google-auth-library` (verifica firma, audiencia, expiración).
3. Si el email ya existe → login inmediato (mock-token).
4. Si no existe → `supabase.auth.signUp()` con contraseña aleatoria y `user_metadata` completo.

### Registro de comercio desde .NET (`POST /auth/register-business`)

```
registerBusinessController (requiere X-API-Key) → authService.registerBusiness()
```

Este endpoint está protegido por el middleware `requireApiKey`. Fue diseñado para que la landing page en .NET pueda dar de alta comercios sin exponer Supabase Auth.

1. Genera un `businessId` con formato `business-{timestamp}`.
2. Crea el usuario en Supabase Auth mediante el admin client: `supabaseAdmin.auth.admin.createUser()` con `email_confirm: true`. Esto evita que el usuario tenga que confirmar su email.
3. El trigger copia el usuario a `public.users`.
4. Inserta el comercio en la tabla `businesses` con `createBusinessRepo()`.
5. Hace login inmediato con `signInWithPassword()` para devolver un JWT real.

### Suspender/activar comercio (`PATCH /auth/register-business/toggle-active`)

```
toggleBusinessActiveController (requiere X-API-Key)
```

1. Recibe `{ email, isActive }`.
2. Busca al usuario por email, verifica que sea `role: "business"` y tenga `businessId`.
3. Llama a `setBusinessActive(businessId, isActive)` del repositorio.
4. Cuando `isActive: false`, el comercio deja de aparecer en `GET /offers` público.

---

## Endpoints completos (30)

### Auth

| Método | Ruta | Auth | Body / Notas |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | `{ email, password, name, phone }`. Crea cliente. |
| `POST` | `/auth/login` | ❌ | `{ email, password }`. Devuelve JWT real o mock-token según el usuario. |
| `POST` | `/auth/google` | ❌ | `{ idToken }`. Google idToken validado con google-auth-library. |
| `POST` | `/auth/reset-password` | ❌ | `{ email }`. Envía mail de recuperación vía Supabase Auth. |
| `POST` | `/auth/register-business` | `X-API-Key` | `{ email, password, businessName, businessAddress, businessCategory, ownerName, businessCity?, ownerPhone? }`. Crea comercio desde .NET. |
| `PATCH` | `/auth/register-business/toggle-active` | `X-API-Key` | `{ email, isActive }`. Suspende o reactiva un comercio. |
| `GET` | `/auth/me` | `isAuth` | Devuelve el perfil del usuario autenticado desde `public.users`. |

### Ofertas públicas

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/offers` | ❌ | `?category=Panadería&type=mystery_box&city=Resistencia, Chaco&page=1&limit=20`. Filtros: `isVisible=true`, `stock>0`, negocio activo. Paginado. DTO incluye `storeName`, `storeAddress`, `logoUrl`. |
| `GET` | `/offers/:id` | ❌ | Detalle de oferta con datos del comercio. 404 si no existe. |
| `GET` | `/cities` | ❌ | Ciudades únicas extraídas de `businesses` (ej: `["Corrientes, Corrientes", "Resistencia, Chaco"]`). |

### Gestión del comercio

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/business/profile` | `isBusinessOwner` | Datos completos del comercio (name, category, city, address, closingTime, logoUrl, isActive, paymentInfo). |
| `PUT` | `/business/profile` | `isBusinessOwner` | Editar perfil. Acepta `{ name?, category?, description?, city?, address?, closingTime?, logoUrl?, paymentInfo? }`. Incluye datos bancarios (CVU + alias). |
| `GET` | `/business/offers` | `isBusinessOwner` | Lista solo las ofertas del comercio autenticado. |
| `POST` | `/business/offers` | `isBusinessOwner` | Crear oferta. Valida campos requeridos y `type` (mystery_box/standard). Genera ID y defaults. |
| `PUT` | `/business/offers/:id` | `isBusinessOwner` | Editar oferta. Usa doble condición: `.eq("id", offerId).eq("businessId", businessId)` para evitar editar ofertas de otro. |
| `PATCH` | `/business/offers/:id/visibility` | `isBusinessOwner` | Ocultar/mostrar oferta. Body: `{ isVisible: boolean }`. |
| `DELETE` | `/business/offers/:id` | `isBusinessOwner` | Eliminar oferta. Misma doble condición. |
| `GET` | `/business/stats` | `isBusinessOwner` | Dashboard con `{ totalRevenue, totalSavedKg, totalBoxesSold, totalCancelled, salesByWeek[4], topPublications[] }`. Revenue semanal calculado desde `createdAt`. |

### Reservas

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/reservations` | `isAuth` | Filtrado por rol: cliente → sus reservas, comercio → las de su negocio. Paginado. Expira automáticamente las `pending` vencidas (>25 min). |
| `POST` | `/reservations` | `isAuth` | `{ offerId, quantity }`. Decrementa stock. Genera código `FS-XXX`. Setea `expiresAt = now + 25 min`. Notifica al cliente y al comercio. |
| `PATCH` | `/reservations/:id/status` | `isAuth` | Transiciones por rol: cliente solo cancela su `pending`; comercio cambia a cualquier estado. Restaura stock al cancelar. |

### Perfil cliente

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/client/profile` | `isClient` | Perfil del cliente autenticado |
| `PUT` | `/client/profile` | `isClient` | Editar. Body: `{ name, phone?, city?, address? }`. Protegido: no permite editar `email`, `role`, `id`, `password`. |

### Favoritos

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/favorites` | `isClient` | Lista de ofertas favoritas con DTO enriquecido |
| `POST` | `/favorites/:offerId` | `isClient` | Agregar. No duplica (UNIQUE userId + offerId) |
| `DELETE` | `/favorites/:offerId` | `isClient` | Quitar |

### Notificaciones

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/notifications` | `isAuth` | Todas las del usuario, ordenadas por fecha descendente |
| `DELETE` | `/notifications` | `isAuth` | Eliminar todas |
| `PATCH` | `/notifications/read-all` | `isAuth` | Marcar todas como leídas |
| `PATCH` | `/notifications/:id/read` | `isAuth` | Marcar una como leída |
| `DELETE` | `/notifications/:id` | `isAuth` | Eliminar una notificación |

Se generan automáticamente al crear reserva, confirmar pago, cancelar o expirar. IDs estables: `${reservationId}-${type}`.

### Upload

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `POST` | `/upload/image` | `isBusinessOwner` | `multipart/form-data`, campo `file`. Usa `supabaseAdmin.storage` (service_role) para bypassear RLS. Devuelve `{ url }` pública en bucket `offers`. |

### Health

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| `GET` | `/` | ❌ | `{ success, data: { message, version } }` |
| `GET` | `/health` | ❌ | `{ success, data: { status: "ok", service: "foodsave-api" } }` |

### Formato de respuesta

Todas las respuestas siguen este contrato exacto:

```json
{ "success": true, "data": { ... } }             // Éxito (2xx)
{ "success": false, "error": { "message": "..." } }  // Error (4xx/5xx)
```

Los endpoints autenticados requieren:

```
Authorization: Bearer <token>
```

---

## Modelo de Datos (6 tablas)

### `users` — Usuarios

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | UUID proporcionado por Supabase Auth |
| `name` | TEXT NOT NULL | Nombre completo |
| `email` | TEXT UNIQUE NOT NULL | En minúsculas |
| `password` | TEXT NOT NULL | Solo usada para seed (trigger la copia como `''`) |
| `role` | ENUM `client` / `business` | Define qué pantallas ve el usuario |
| `businessId` | TEXT | Si es comercio, ID del negocio asociado |
| `phone` | TEXT | |
| `city` | TEXT | |
| `address` | TEXT | |
| `createdAt` | TIMESTAMPTZ | Default `now()` |

**Sincronización:** La tabla `public.users` se llena automáticamente mediante un trigger en `auth.users`. Cuando alguien se registra vía `supabase.auth.signUp()`, el trigger copia `id`, `email` y `user_metadata` a `public.users`. El admin client (`supabaseAdmin.auth.admin.createUser()`) también lo activa.

### `businesses` — Comercios

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | Formato `business-{timestamp}` |
| `name` | TEXT NOT NULL | Nombre comercial |
| `ownerId` | TEXT NOT NULL FK → users.id | Dueño del comercio |
| `category` | TEXT NOT NULL | Ej: "Panadería", "Rotisería" |
| `description` | TEXT | Default `''` |
| `city` | TEXT NOT NULL | Para filtrar ofertas por ciudad |
| `address` | TEXT NOT NULL | |
| `closingTime` | TEXT | Ej: "22:00" |
| `logoUrl` | TEXT | Logo del comercio |
| `isActive` | BOOLEAN | Si `false`, no aparece en ofertas públicas. Usado por toggle-active. |
| `paymentInfo` | JSONB | `{ ownerName, cvu, alias }`. Información bancaria para transferencias. |
| `createdAt` | TIMESTAMPTZ | |

### `offers` — Publicaciones

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | Formato `offer-{timestamp}` |
| `businessId` | TEXT NOT NULL FK → businesses.id ON DELETE CASCADE | Relación con el comercio |
| `title` | TEXT NOT NULL | |
| `description` | TEXT NOT NULL | |
| `category` | TEXT NOT NULL | Puede no coincidir exactamente con las categorías del frontend (se normaliza luego) |
| `type` | ENUM `mystery_box` / `standard` | Tipo de oferta |
| `oldPrice` | INTEGER NOT NULL | Precio original |
| `newPrice` | INTEGER NOT NULL | Precio con descuento |
| `stock` | INTEGER | Default 0. Si llega a 0, se oculta del listado público |
| `pickupWindow` | TEXT | Ventana horaria para retirar |
| `pickupLimit` | TEXT | Hora límite de retiro |
| `allergens` | TEXT[] | Array de alérgenos |
| `imageUrl` | TEXT | URL de la imagen en Supabase Storage |
| `isVisible` | BOOLEAN | Si `false`, no aparece ni en público ni en el listado del comercio (toggle visibility) |
| `estimatedWeightInKg` | REAL | Peso estimado opcional |
| `createdAt` | TIMESTAMPTZ | |

### `reservations` — Reservas

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | Formato `res-{timestamp}` |
| `offerId` | TEXT NOT NULL FK → offers.id | Oferta reservada |
| `businessId` | TEXT NOT NULL FK → businesses.id | Comercio (denormalizado para consultas rápidas) |
| `userId` | TEXT NOT NULL FK → users.id | Cliente que reservó |
| `quantity` | INTEGER | Cantidad de unidades |
| `totalPrice` | INTEGER | Precio total (newPrice * quantity) |
| `code` | TEXT | Código corto ej: "FS-A4B" |
| `confirmationCode` | TEXT NOT NULL | Código con # ej: "#FS-A4B" |
| `expiresAt` | TIMESTAMPTZ | `createdAt + 25 minutos`. Si se vence en pending → cancelación automática |
| `status` | ENUM `pending / confirmed_paid / picked_up / cancelled` | Estado actual |
| `createdAt` | TIMESTAMPTZ | |

**DTO enriquecido** al devolver reservas: incluye `customerName`, `customerPhone`, `storeName`, `address`, `offerTitle`, `pickupTime`, `date`, `month`, `code`, `expiresAt`, `paymentAlias`, `bankAlias`, `whatsappPhone`, `paymentInfo`.

### `favorites` — Favoritos

| Columna | Tipo | Notas |
|---|---|---|
| `id` | BIGINT GENERATED ALWAYS AS IDENTITY PK | Auto-incremental |
| `userId` | TEXT NOT NULL FK → users.id ON DELETE CASCADE | |
| `offerId` | TEXT NOT NULL FK → offers.id ON DELETE CASCADE | |
| `createdAt` | TIMESTAMPTZ | |
| UNIQUE | (userId, offerId) | Evita duplicados |

### `notifications` — Notificaciones

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | |
| `userId` | TEXT NOT NULL FK → users.id ON DELETE CASCADE | Destinatario |
| `type` | TEXT NOT NULL | `reservation_created`, `payment_confirmed`, `pickup_reminder`, `reservation_expired`, `business_payment_received` |
| `title` | TEXT NOT NULL | Título legible |
| `message` | TEXT NOT NULL | Cuerpo de la notificación |
| `reservationId` | TEXT NOT NULL | Reserva asociada |
| `read` | BOOLEAN | Default false |
| `createdAt` | TIMESTAMPTZ | |

---

## Lógica de negocio clave

### Filtros de ofertas públicas (`GET /offers`)

El repositorio (`listOffersRepo`) aplica estos filtros en orden:

1. `isVisible = true` — solo ofertas visibles
2. `stock > 0` — oculta las agotadas
3. `isActive = true` del comercio — solo negocios activos (no suspendidos)
4. Si `?city=`: filtra por comercios en esa ciudad
5. Si `?category=`: búsqueda parcial (`ilike`)
6. Si `?type=`: búsqueda exacta (`mystery_box` o `standard`)

Paginación con `page` (default 1), `limit` (default 20, máximo 100).

### Ciclo de vida de una reserva

```
POST /reservations
  → decrementa stock
  → expiresAt = now + 25 min
  → status = "pending"
  → notifica cliente + comercio

Al listar (on-demand)
  → detecta pending vencidas
  → las cancela automáticamente
  → restaura stock
  → notifica expiración

PATCH /reservations/:id/status
  Cliente: solo puede cancelar SU reserva pending → restaura stock
  Comercio: puede cambiar a cualquier estado
    → confirmed_paid → notifica pago + recordatorio pickup
    → cancelled → restaura stock
```

**Transiciones permitidas:**

```
pending ──→ confirmed_paid ──→ picked_up
   │              │
   └── cancelled ←┘
```

### Upload de imágenes

La ruta `POST /upload/image` está protegida por `isBusinessOwner`. Usa `multer` para recibir el archivo y `supabaseAdmin.storage` (con service_role) para subirlo a Supabase Storage. La política RLS del bucket `offers` exige `auth.role() = 'authenticated'` para INSERT, pero el admin client bypassea RLS. La validación real de que es un comercio se hace antes en el middleware.

---

## API Key para .NET (landing page)

El panel web en .NET se comunica con el backend mediante `X-API-Key`:

| Endpoint | Propósito |
|---|---|
| `POST /auth/register-business` | Crear comercio desde la landing |
| `PATCH /auth/register-business/toggle-active` | Suspender o reactivar un comercio |

La API Key se configura en `.env` como `API_KEY`. Por defecto en desarrollo: `foodsave-api-key-dev`. En producción se usa una clave segura.

---

## Arquitectura del Frontend

### Navegación por rol (Expo Router)

Expo Router organiza las pantallas en **grupos de rutas**:

```
app/
├── _layout.tsx              Root layout: ThemeProvider → AuthProvider → Stack
├── index.tsx                Entry point: redirige según rol o a login
├── (auth)/                  Pantallas sin autenticación
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── check-email.tsx
├── (client)/                Pantallas de cliente (con tabs)
│   ├── _layout.tsx          Guard: si no es cliente → redirige
│   ├── home.tsx             Home con ofertas y filtros
│   ├── reservations.tsx     Mis reservas
│   ├── profile.tsx          Perfil
│   ├── offer/[id].tsx       Detalle de oferta
│   ├── reservation-confirmed.tsx
│   ├── favorites.tsx
│   └── notifications.tsx
└── (business)/              Pantallas de comercio (con tabs)
    ├── _layout.tsx          Guard: si no es business → redirige
    ├── dashboard.tsx        Dashboard con métricas
    ├── publish.tsx          Publicar oferta
    ├── orders.tsx           Pedidos recibidos
    ├── history.tsx          Historial
    ├── stats.tsx            Estadísticas detalladas
    ├── store.tsx            Mi Local (perfil del comercio)
    └── edit-offer/[id].tsx  Editar publicación
```

El flujo de entrada (`app/index.tsx`):
1. Si el usuario **no tiene sesión** → `/(auth)/login`
2. Si es **cliente** (`role === "client"`) → `/(client)/home`
3. Si es **comercio** (`role === "business"`) → `/(business)/dashboard`

Cada layout de grupo tiene un **guard** que verifica el rol y redirige si no coincide.

### Manejo de sesión (`AuthContext`)

Definido en `src/context/AuthContext.tsx`.

| Función | Qué hace |
|---|---|
| `login(email, password)` | Llama a `POST /auth/login`, guarda el token y user en SecureStore, actualiza estado |
| `register(credentials)` | Llama a `POST /auth/register`. Si requiere confirmación de email, redirige a `check-email` |
| `loginWithGoogle(idToken)` | Llama a `POST /auth/google`, misma persistencia |
| `logout()` | Limpia SecureStore y estado |
| `getMe()` | Llama a `GET /auth/me` para refrescar datos del perfil |

**Persistencia de sesión** (`src/utils/sessionStorage.ts`):

- En **Android/iOS**: usa `expo-secure-store` (almacenamiento encriptado con clave `"foodsave.session"`).
- En **Web**: usa `localStorage`.
- Al iniciar la app, AuthContext lee el almacenamiento persistente y restaura la sesión automáticamente (línea 33-49 del AuthContext).
- El objeto guardado contiene: `{ token, user }`.

### Cliente API (`apiClient.ts`)

Definido en `src/services/apiClient.ts`. Es la capa que conecta el frontend con el backend.

**Cómo funciona:**

1. Toma una ruta (ej: `/auth/login`), opciones (method, body, token) y arma el fetch.
2. **Adjunta el token**: si `options.token` está presente, lo manda como `Authorization: Bearer <token>`.
3. **Envía la respuesta**: recibe `{ success, data }` o `{ success, error }`.
4. Si `success === true` → devuelve `data` directamente.
5. Si `success === false` → lanza error con `error.message`.
6. Si el servidor responde con HTTP error (4xx/5xx) → extrae el mensaje y lo lanza.

**Errores comunes traducidos:**
- 401 con "credenciales" → "Correo o contraseña incorrectos."
- Mensajes vacíos, `"{}"`, `"[object Object]"` → filtrados automáticamente.

### Servicios por dominio

Cada servicio usa `apiRequest` de `apiClient.ts` y apunta al endpoint correspondiente:

| Archivo | Endpoints base | Funciones principales |
|---|---|---|
| `services/authService.ts` | `/auth/` | login, googleLogin, getMe, register, resetPassword |
| `services/offerService.ts` | `/offers/`, `/business/offers/` | listOffers, getOffer, createOffer, updateOffer, deleteOffer, toggleVisibility, uploadImage, getBusinessProfile, updateBusinessProfile |
| `services/reservationService.ts` | `/reservations/` | listReservations, createReservation, updateStatus |
| `services/favoriteService.ts` | `/favorites/` | listFavorites, addFavorite, removeFavorite |
| `services/clientProfileService.ts` | `/client/profile` | getProfile, updateProfile |
| `services/cityService.ts` | `/cities` | getCities |
| `services/notificationService.ts` | `/notifications/` | list, markRead, markAllRead, delete, deleteAll |

### Tema claro/oscuro (`ThemeContext`)

Definido en `src/context/ThemeContext.tsx`. Usa `src/constants/theme.ts` con 22 propiedades de color:

- **Tema claro**: fondos blancos/gris claro, texto oscuro, naranja como color primario.
- **Tema oscuro**: fondos oscuros (#0F1724), texto blanco, naranja más vibrante.
- Persiste la preferencia en SecureStore/localStorage con clave `"foodsave.themeMode"`.
- El usuario puede cambiarlo desde Perfil (cliente) o Mi Local (comercio).

### Google Login

**Frontend** (`login.tsx`):
1. Usa `expo-auth-session/providers/google` para abrir el sheet de Google Sign-In.
2. Obtiene un `idToken` de Google.
3. Lo envía a `POST /auth/google` mediante `authService.loginWithGoogle(idToken)`.
4. Si el email ya existe en el backend → login directo.
5. Si no existe → el backend crea el usuario automáticamente.

**Configuración** (`src/config/googleAuth.ts`): lee los client IDs de las variables de entorno (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, etc.).

### Componentes principales

| Componente | Ubicación | Uso |
|---|---|---|
| `PrimaryButton` | `components/PrimaryButton.tsx` | Botón reutilizable con variantes (primary, secondary, outline, danger) y estado de carga |
| `ScreenContainer` | `components/ScreenContainer.tsx` | Wrapper base con SafeAreaView, scroll opcional y RefreshControl |
| `SplashLoading` | `components/SplashLoading.tsx` | Pantalla de carga inicial con logo y branding |
| `Header` | `components/Header.tsx` | Encabezado de pantalla con título y acción opcional |
| `TextInputField` | `components/TextInputField.tsx` | Input estilizado con validación y mensaje de error |
| `OfferCard` | `components/OfferCard.tsx` | Card de oferta con imagen, precio, stock |
| `ReservationCard` | `components/ReservationCard.tsx` | Card de reserva con estado y detalles |
| `StatusBadge` | `components/StatusBadge.tsx` | Badge de color para estados |
| `EmptyState` | `components/EmptyState.tsx` | Placeholder para listas vacías |
| `AdminMetricCard` | `components/AdminMetricCard.tsx` | Card de métrica para dashboard del comercio |

---

## Migraciones SQL (5 archivos secuenciales)

Todos en `backend/sql/`. Ejecutar en orden para una base nueva:

| # | Archivo | Contenido |
|---|---|---|
| 01 | `01_schema.sql` | Enums (`user_role`, `offer_type`, `reservation_status`) + 6 tablas con todas sus columnas + 9 índices |
| 02 | `02_seed.sql` | Datos demo: 5 usuarios (cliente + 4 comercios), 9 comercios, 10 ofertas, 15 reservas (incluye ventas semanales para dashboard), 2 favoritos |
| 03 | `03_rls.sql` | Row Level Security: SELECT público en todas las tablas, INSERT/UPDATE/DELETE sin restricción |
| 04 | `04_auth_trigger.sql` | Función + trigger: copia automáticamente `auth.users` → `public.users` al crear un usuario |
| 05 | `05_storage.sql` | Crea bucket público `offers`, políticas SELECT público + INSERT solo authenticated |

---

## Usuarios de prueba (seed)

| Email | Password | Rol | Comercio asociado |
|---|---|---|---|
| `cliente@foodsave.com` | `123456` | Cliente | — |
| `comercio@foodsave.com` | `123456` | Business | Panadería La Espiga |
| `sabor.casero@foodsave.com` | `123456` | Business | Sabor Casero Rotisería |
| `mercado.fresco@foodsave.com` | `123456` | Business | Mercado Fresco Chaco |
| `dulce.corrientes@foodsave.com` | `123456` | Business | Dulce Corrientes |

Los comercios están ubicados en **Resistencia, Chaco** y **Corrientes, Corrientes** para probar el filtro por ciudad.

---

## Variables de Entorno

### Frontend (`frontend/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_LANDING_URL=...
```

- Para Expo Go en celular, usar IP local: `http://192.168.x.x:4000`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` es necesario para Google Login en Android con development build.

### Backend (`backend/.env`)

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:8081
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
API_KEY=...
```

| Variable | Uso |
|---|---|
| `SUPABASE_ANON_KEY` | Cliente público (`supabase`) — lecturas, signUp, signIn, getPublicUrl. |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente admin (`supabaseAdmin`) — bypassea RLS. Usado en upload, perfil cliente, registerBusiness. |
| `GOOGLE_CLIENT_ID` | Acepta varios IDs separados por coma (Android + iOS + Web). |
| `API_KEY` | Clave compartida con el panel .NET. |

---

## Instalación y Ejecución Local

### Requisitos

- Node.js (compatible con Expo SDK 54)
- npm
- Expo Go (Android/iOS) o emulador Android Studio
- Cuenta/proyecto Supabase configurado

### Pasos

```bash
# 1. Instalar dependencias (raíz del monorepo)
npm install

# 2. Configurar variables de entorno
#    Crear frontend/.env y backend/.env con los valores correspondientes

# 3. Ejecutar migraciones SQL en Supabase Dashboard
#    backend/sql/01_schema.sql → 02_seed.sql → 03_rls.sql → 04_auth_trigger.sql → 05_storage.sql

# 4. Levantar backend
npm run dev:backend

# 5. Verificar health check
curl http://localhost:4000/health

# 6. Levantar frontend
npm run dev:frontend

# 7. Escanear QR con Expo Go o abrir en emulador
```

### Comandos útiles

```bash
npm run dev:backend          # Backend en modo desarrollo
npm run dev:frontend         # Frontend en modo desarrollo
npm run typecheck            # TypeScript check en ambos workspaces
npm run build                # Build de ambos workspaces
```

---

## Checklist de Demo

1. Login cliente (`cliente@foodsave.com`)
2. Ver Home con ofertas disponibles
3. Filtrar por ciudad y categoría
4. Abrir detalle de oferta
5. Agregar/quitar favorito
6. Crear reserva
7. Ver reserva pendiente de pago
8. Entrar a Mis reservas
9. Login comercio (`comercio@foodsave.com`)
10. Ver Dashboard con métricas
11. Publicar excedente con imagen
12. Ver Pedidos
13. Confirmar/cancelar pedido
14. Ver Mi Local y Publicaciones
15. Ocultar/mostrar una publicación
16. Probar dark mode

---

## Documentación Complementaria

- `docs/BACKEND_CONTEXT.md` — Explicación completa del backend con arquitectura, flujos, endpoints y referencias de archivos.
- `docs/PROJECT_CONTEXT.md` — Contexto funcional y decisiones del proyecto.
- `docs/CODEX_RULES.md` — Reglas internas de desarrollo.
