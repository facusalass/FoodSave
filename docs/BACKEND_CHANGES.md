# Cambios en el Backend — FoodSave

## Supabase (PRODUCCIÓN)

El backend ya no usa mocks. Todas las consultas van contra Supabase.
Credenciales en `backend/.env`:

```
SUPABASE_URL=https://lmmkszyrhjgbxzxtjwbm.supabase.co
SUPABASE_ANON_KEY=sb_publishable_BlMt3rzIXHTN6zMA0MEQpQ_eEX4dR_5
```

Tablas creadas: `users`, `businesses`, `offers`, `reservations`, `favorites`.

**IMPORTANTE:** Para que la API funcione, ejecutar estos SQL en orden (Supabase Dashboard > SQL Editor):

| # | Archivo | Qué hace |
|---|---|---|
| 1 | `01_schema.sql` | Crea las 5 tablas, enums e índices |
| 2 | `02_seed.sql` | Datos de prueba (usuarios, negocios, ofertas, reservas) |
| 3 | `03_rls.sql` | Permisos de lectura/escritura (RLS) |
| 4 | `04_auth_trigger.sql` | Sincroniza `auth.users` → `public.users` |
| 5 | `05_storage.sql` | Bucket de imágenes `offers` en Storage |
| 6 | `06_city_column.sql` | Agrega columna `city` a la tabla `businesses` |

---

## Autenticación (CAMBIÓ)

**Nuevos usuarios** (registro desde la app):
- `POST /auth/register` usa Supabase Auth (`signUp` real).
- Devuelve JWT real en `data.token` (ya no es `mock-token-xxx`).
- El backend ya no genera tokens, los emite Supabase.

**Usuarios de prueba** (seed, siguen funcionando):
- `cliente@foodsave.com` / `123456`
- `comercio@foodsave.com` / `123456`
- Estos devuelven tokens mock (`mock-token-xxx`) porque no existen en Supabase Auth.
- Funcionan igual que antes, sin cambios para el frontend.

**Google Sign-In:**
- `POST /auth/google` usa `supabase.auth.signUp()` real.
- Si el email no existe, crea el usuario en Supabase Auth y devuelve JWT real.
- Si es `role: "business"`, crea además el negocio en la tabla `businesses`.

**Email verification:** Desactivado por ahora (el frontend no tiene pantalla para ingresar el código). Si se activa, `POST /auth/register` devolverá `data.session = null` y el frontend deberá mostrar "Revisá tu correo".

---

## Middlewares (CAMBIÓ)

Antes había 3 archivos separados. Ahora todo está en `middlewares/guards.ts`:

| Middleware | Qué hace |
|---|---|
| `isAuth` | Cualquier usuario autenticado |
| `isClient` | Solo rol `client` |
| `isBusinessOwner` | Solo rol `business` con `businessId` |

Importar desde: `../middlewares/guards.js`

---

## Arquitectura (novedades técnicas)

- **Todos los controllers y servicios son async/await** — usan Promises nativas.
- **Auth híbrido**: prueba JWT real de Supabase primero, si falla cae en mock-token para los usuarios del seed.
- **Repositorio único**: `services/repository.ts` centraliza todas las consultas a Supabase. Los servicios no importan `data/`.
- **Carpeta `data/`**: obsoleta, no se usa. Se mantiene solo como referencia.

---

## Formato de respuesta (SIN CAMBIOS)

Todos los endpoints siguen devolviendo:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "..." } }
```

---

## Endpoints completos (22)

### Auth
| Método | Ruta | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | ❌ | `{ email, password, name, phone }` |
| POST | `/auth/login` | ❌ | `{ email, password }` |
| POST | `/auth/google` | ❌ | `{ idToken }` |
| POST | `/auth/reset-password` | ❌ | `{ email }` |
| POST | `/auth/register-business` | `X-API-Key` | `{ email, password, businessName, businessAddress, businessCategory, ownerName, businessCity? }` |
| GET | `/auth/me` | ✅ | — |

### Ofertas públicas
| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/offers` | ❌ | `?category=`, `?type=`, `?city=`, `?page=&limit=`. Paginado (`items[]` + `total/page/limit/totalPages`) |
| GET | `/offers/:id` | ❌ | — |

### Ofertas del comercio (admin)
| Método | Ruta | Auth | Body |
|---|---|---|---|
| GET | `/business/offers` | ✅ (business) | Lista solo ofertas del comercio logueado |
| POST | `/business/offers` | ✅ (business) | `{ title, description, category, type, oldPrice, newPrice, stock, ... }` |
| PUT | `/business/offers/:id` | ✅ (business) | `{ title?, description?, imageUrl?, stock?, ... }` |
| PATCH | `/business/offers/:id/visibility` | ✅ (business) | `{ isVisible: true/false }` |
| DELETE | `/business/offers/:id` | ✅ (business) | — |
| GET | `/business/profile` | ✅ (business) | Datos completos del comercio |
| PUT | `/business/profile` | ✅ (business) | `{ name?, category?, description?, city?, address?, closingTime?, logoUrl?, paymentInfo? }` |

### Reservas
| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/reservations` | ✅ | Filtrado por rol. `?page=&limit=`. Paginado |
| POST | `/reservations` | ✅ | `{ offerId, quantity }`. DTO incluye `paymentInfo`, `code`, `expiresAt` (25 min), `whatsappPhone` |
| PATCH | `/reservations/:id/status` | ✅ | `{ status }`. Client puede cancelar solo sus pending. Business cambia cualquiera |

### Favoritos
| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/favorites` | ✅ (client) | Devuelve ofertas enriquecidas (listas para mostrar) |
| POST | `/favorites/:offerId` | ✅ (client) | No duplica |
| DELETE | `/favorites/:offerId` | ✅ (client) | — |

### Notificaciones
| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/notifications` | ✅ | Lista todas las del usuario, ordenadas por fecha |
| PATCH | `/notifications/:id/read` | ✅ | Marca una como leída |
| PATCH | `/notifications/read-all` | ✅ | Marca todas como leídas |

**Notificaciones automáticas:** se generan al crear una reserva (`reservation_created`), al confirmar pago (`payment_confirmed` + `pickup_reminder`), y al detectar vencimiento (`reservation_expired`). ID estable: `${reservationId}-${type}`.

### Estadísticas
| Método | Ruta | Auth |
|---|---|---|
| GET | `/business/stats` | ✅ (business) |

### Health
| Método | Ruta | Auth |
|---|---|---|
| GET | `/health` | ❌ |

### Upload
| Método | Ruta | Auth | Notas |
|---|---|---|---|
| POST | `/upload/image` | ✅ (business) | Form-data: campo `file`. Devuelve `{ url }` público |

---

## Datos enriquecidos (DTOs)

Las ofertas y reservas siempre llegan con datos del negocio inyectados. El frontend NO necesita hacer llamadas extra.

**Ofertas** incluyen: `storeName`, `storeAddress`, `logoUrl`

**Reservas** incluyen: `customerName`, `customerPhone`, `storeName`, `address`, `offerTitle`, `pickupTime`, `date`, `month`, `code`, `expiresAt`, `paymentAlias`, `bankAlias`, `whatsappPhone`, `paymentInfo: { cvu, alias }`

**Favoritos** devuelven las mismas ofertas enriquecidas que `GET /offers`.

---

## Estructura del proyecto (backend/src/)

```
config/     → env.ts, supabase.ts
controllers/ → authController, offerPublicController, offerBusinessController,
               reservationController, statisticsController, favoriteController,
               uploadController, notificationController
middlewares/ → guards.ts (isAuth, isClient, isBusinessOwner), errorHandler.ts
routes/     → authRoutes, offerRoutes, offerBusinessRoutes,
                reservationRoutes, statisticsRoutes, favoriteRoutes,
                uploadRoutes, notificationRoutes
services/   → repository.ts, authService, authStrategy, offerService,
                reservationService, statisticsService, favoriteService,
                notificationService
sql/        → 01_schema.sql, 02_seed.sql, 03_rls.sql,
               04_auth_trigger.sql, 05_storage.sql, 06_city_column.sql
types/      → auth.ts, offer.ts, reservation.ts, statistics.ts, express.ts
utils/      → publicUser.ts
```
