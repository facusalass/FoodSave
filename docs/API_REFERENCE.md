# API FoodSave — Referencia para Frontend

**Base URL:** `http://localhost:4000`

---

## Formato de Respuesta

Toda respuesta sigue este contrato exacto (éxito o error):

```typescript
// Éxito (status HTTP 2xx)
{ "success": true, "data": { ... } }

// Error (status HTTP 4xx / 5xx)
{ "success": false, "error": { "message": "Descripción del error" } }
```

**Uso desde el frontend:**

```typescript
const res = await fetch("http://localhost:4000/offers");
const json = await res.json();

if (!json.success) {
  mostrarError(json.error.message);
  return;
}

mostrar(json.data.offers);
```

---

## Autenticación

**Usuarios de prueba:**

| Email | Password | Rol |
|---|---|---|
| `comercio@foodsave.com` | `123456` | business |
| `cliente@foodsave.com` | `123456` | client |

**Token:** Enviar en todas las rutas protegidas como header:
```
Authorization: Bearer <token>
```

### `POST /auth/register`
- **Auth:** ❌
- **Body:** `{ "email", "password", "name", "phone" }`
- **Respuesta (201):** `data: { token, user }`
- **Nota:** Solo crea usuarios `client`. El token es JWT real emitido por Supabase Auth.

### `POST /auth/login`
- **Auth:** ❌
- **Body:** `{ "email", "password" }`
- **Respuesta (200):** `data: { token, user }`
- **Nota:** Para usuarios de prueba devuelve token mock. Para usuarios nuevos devuelve JWT real de Supabase.

### `POST /auth/google`
- **Auth:** ❌
- **Body:** `{ "email", "name", "role" }` + si `role: "business"` agregar `"businessName", "businessAddress", "businessCategory", "businessCity"`
- **Respuesta (200):** `data: { token, user }`
- **Comportamiento:** Si el email no existe, registra automáticamente. Si existe, loguea.

### `POST /auth/reset-password`
- **Auth:** ❌
- **Body:** `{ "email" }`
- **Respuesta (200):** `data: { message: "Te enviamos un email con instrucciones para recuperar tu contraseña." }`
- **Error:** 404 si no existe una cuenta registrada con ese correo.

### `GET /auth/me`
- **Auth:** ✅
- **Respuesta (200):** `data: { user }` — perfil del usuario autenticado.

---

## Catálogo público

### `GET /offers`
- **Auth:** ❌
- **Query params opcionales:** `?category=Panadería` (parcial), `?type=mystery_box` (exacto), `?city=Resistencia, Chaco` (exacto), `?page=1&limit=10`
- **Paginación:** devuelve `data.offers.items[]` + `.total`, `.page`, `.limit`, `.totalPages`. Default: `page=1, limit=20`, máximo 100.
- **Respuesta (200):** `data: { offers: { items: [...], total, page, limit, totalPages } }`
- **DTO enriquecido:** Cada oferta incluye `storeName`, `storeAddress`, `logoUrl`, `isVisible` del negocio.

### `GET /offers/:id`
- **Auth:** ❌
- **Respuesta (200):** `data: { offer }` con la misma estructura enriquecida.
- **Error:** 404 si no existe.

### `GET /cities`
- **Auth:** ❌
- **Respuesta (200):** `data: { cities: ["Corrientes, Corrientes", "Resistencia, Chaco"] }` — ciudades donde hay negocios registrados.

---

## Panel Admin (Comercio)

### `GET /business/stats`
- **Auth:** ✅ (business)
- **Respuesta (200):** `data: { stats: { totalRevenue, totalSavedKg, totalBoxesSold, totalCancelled, salesByWeek, topPublications } }`
- **Error:** 403 si no es business.

### `PUT /business/profile`
- **Auth:** ✅ (business)
- **Body:** `{ "name?", "category?", "description?", "city?", "address?", "closingTime?", "logoUrl?" }`
- **Respuesta (200):** `data: { business }`

### `POST /business/offers`
- **Auth:** ✅ (business)
- **Body:** `{ "title", "description", "category", "type", "oldPrice", "newPrice", "stock" }` + opcionales: `pickupWindow, pickupLimit, allergens, imageUrl, estimatedWeightInKg`
- **Respuesta (201):** `data: { offer }`

### `PUT /business/offers/:id`
- **Auth:** ✅ (business)
- **Body:** `{ "title?", "description?", "category?", "type?", "oldPrice?", "newPrice?", "stock?", "pickupWindow?", "pickupLimit?", "allergens?", "imageUrl?", "estimatedWeightInKg?" }`
- **Respuesta (200):** `data: { offer }`
- **Error:** 404 si no existe o no pertenece al comercio.

### `DELETE /business/offers/:id`
- **Auth:** ✅ (business)
- **Respuesta (200):** `data: { message: "Oferta eliminada." }`
- **Error:** 404 si no existe o no pertenece.

---

## Reservas

### `GET /reservations`
- **Auth:** ✅
- **Filtrado automático por rol:** client → sus reservas, business → las de su comercio.
- **Respuesta (200):** `data: { reservations: [...] }`
- **DTO enriquecido:** Cada reserva incluye:

| Campo | Fuente |
|---|---|
| `code` | Código de retiro (ej: `FS-A4B`) |
| `confirmationCode` | Código con # (ej: `#FS-A4B`) |
| `customerName`, `customerPhone` | Del usuario que reservó |
| `storeName`, `address` | Del comercio |
| `offerTitle`, `pickupTime` | De la oferta |
| `date`, `month` | Fecha formateada en español |
| `expiresAt` | `createdAt` + 15 minutos (ISO) |
| `paymentAlias`, `bankAlias` | Alias de transferencia |
| `whatsappPhone` | Teléfono del dueño del comercio |
| `paymentInfo: { cvu, alias }` | Datos bancarios del comercio |

### `POST /reservations`
- **Auth:** ✅
- **Body:** `{ "offerId": "offer-1", "quantity": 1 }`
- **Respuesta (201):** `data: { reservation }` con DTO enriquecido.
- **Errores:** 400 — oferta no encontrada, stock insuficiente.

### `PATCH /reservations/:id/status`
- **Auth:** ✅
- **Body:** `{ "status": "confirmed_paid" }`
- **Estados:** `pending → confirmed_paid → picked_up` | `cancelled`
- **Permisos:** client puede cancelar solo sus reservas `pending`. business puede cambiar cualquier estado de sus reservas.
- **Error:** 404 si no encuentra o no tiene permisos.

---

## Favoritos

### `GET /favorites`
- **Auth:** ✅ (client)
- **Respuesta (200):** `data: { favorites: [...] }` — ofertas enriquecidas, misma estructura que `GET /offers`.
- **Error:** 403 si no es client.

### `POST /favorites/:offerId`
- **Auth:** ✅ (client)
- **Respuesta (201):** `data: { favorite }` — oferta enriquecida. Si ya existe, no duplica.
- **Error:** 404 si la oferta no existe.

### `DELETE /favorites/:offerId`
- **Auth:** ✅ (client)
- **Respuesta (200):** `data: { message: "Favorito eliminado." }`
- **Error:** 404 si no existía.

---

## Upload

### `POST /upload/image`
- **Auth:** ✅ (business)
- **Content-Type:** `multipart/form-data`
- **Body:** campo `file` con la imagen.
- **Respuesta (201):** `data: { url: "https://..." }` — URL pública en Supabase Storage.
- **Error:** 403 si no es business.

---

## Resumen de Endpoints

| Método | Ruta | Auth | Rol |
|---|---|---|---|
| GET | `/` | ❌ | — |
| GET | `/health` | ❌ | — |
| POST | `/auth/register` | ❌ | — |
| POST | `/auth/login` | ❌ | — |
| POST | `/auth/google` | ❌ | — |
| POST | `/auth/reset-password` | ❌ | — |
| POST | `/auth/register-business` | `X-API-Key` | — |
| GET | `/auth/me` | ✅ | cualquiera |
| GET | `/cities` | ❌ | — |
| GET | `/offers` | ❌ | — |
| GET | `/offers/:id` | ❌ | — |
| GET | `/business/stats` | ✅ | business |
| GET | `/business/profile` | ✅ | business |
| PUT | `/business/profile` | ✅ | business |
| GET | `/business/offers` | ✅ | business |
| POST | `/business/offers` | ✅ | business |
| PUT | `/business/offers/:id` | ✅ | business |
| PATCH | `/business/offers/:id/visibility` | ✅ | business |
| DELETE | `/business/offers/:id` | ✅ | business |
| GET | `/reservations` | ✅ | cualquiera |
| POST | `/reservations` | ✅ | cualquiera |
| PATCH | `/reservations/:id/status` | ✅ | cualquiera |
| GET | `/favorites` | ✅ | client |
| POST | `/favorites/:offerId` | ✅ | client |
| DELETE | `/favorites/:offerId` | ✅ | client |
| GET | `/notifications` | ✅ | cualquiera |
| PATCH | `/notifications/:id/read` | ✅ | cualquiera |
| PATCH | `/notifications/read-all` | ✅ | cualquiera |
| POST | `/upload/image` | ✅ | business |
