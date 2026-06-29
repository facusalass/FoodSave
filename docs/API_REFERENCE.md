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

// Siempre preguntar success primero
if (!json.success) {
  mostrarError(json.error.message);
  return;
}

// json.data contiene los datos específicos del endpoint
mostrar(json.data.offers);
```

---

## Autenticación

### `POST /auth/login`
- **Auth:** No requiere
- **Body:**
  ```json
  { "email": "comercio@foodsave.com", "password": "123456" }
  ```
- **Respuesta exitosa (200):**
  ```json
  {
    "success": true,
    "data": {
      "token": "mock-token-user-business-1",
      "user": {
        "id": "user-business-1",
        "name": "Carlos (Dueño)",
        "email": "comercio@foodsave.com",
        "role": "business",
        "businessId": "business-espiga",
        "phone": "+54 9 362 4567890",
        "createdAt": "2026-06-01T10:00:00.000Z"
      }
    }
  }
  ```
- **Uso del token:** Enviar en todas las rutas protegidas como header:
  ```
  Authorization: Bearer mock-token-user-business-1
  ```

**Usuarios mock disponibles:**

| Email | Password | Rol |
|---|---|---|
| `comercio@foodsave.com` | `123456` | business |
| `cliente@foodsave.com` | `123456` | client |

### `GET /auth/me`
- **Auth:** Requiere Bearer token
- **Respuesta (200):**
  ```json
  {
    "success": true,
    "data": { "user": { ... } }
  }
  ```

---

## Ofertas

### `GET /offers`
- **Auth:** No requiere
- **Respuesta:**
  ```json
  {
    "success": true,
    "data": {
      "offers": [
        {
          "id": "offer-1",
          "businessId": "business-espiga",
          "title": "Mystery Box Panadería",
          "description": "Mystery Box de productos de panadería",
          "category": "Panadería",
          "type": "mystery_box",
          "oldPrice": 3000,
          "newPrice": 1500,
          "stock": 5,
          "pickupWindow": "18:00 - 22:00",
          "pickupLimit": "22:00 hs",
          "allergens": ["TACC", "Lácteos"],
          "imageUrl": "https://...",
          "createdAt": "2026-06-15T10:00:00.000Z",
          "estimatedWeightInKg": 1.5,
          "storeName": "Panadería La Espiga",
          "storeAddress": "Av. San Martín 123",
          "logoUrl": null
        }
      ]
    }
  }
  ```

### `GET /offers/:id`
- **Auth:** No requiere
- **Respuesta:** `data.offer` con la misma estructura de arriba
- **Errores:** 404 si no existe

---

## Reservas

Todas las rutas de reservas requieren autenticación.

### `GET /reservations`
- **Auth:** Requiere Bearer token
- **Comportamiento:** Filtra automáticamente según el rol:
  - `client` → solo sus reservas (`userId`)
  - `business` → solo reservas de su comercio (`businessId`)
- **Respuesta:**
  ```json
  {
    "success": true,
    "data": {
      "reservations": [
        {
          "id": "reservation-1",
          "offerId": "offer-1",
          "businessId": "business-espiga",
          "userId": "user-client-1",
          "quantity": 1,
          "totalPrice": 1500,
          "confirmationCode": "#FS-A4B",
          "status": "pending",
          "createdAt": "2026-05-03T18:00:00.000Z",
          "customerName": "Mateo Cliente",
          "customerPhone": "+54 9 362 1234567",
          "storeName": "Panadería La Espiga",
          "address": "Av. San Martín 123",
          "offerTitle": "Mystery Box Panadería",
          "pickupTime": "22:00 hs",
          "date": "3 de mayo de 2026",
          "month": "mayo de 2026"
        }
      ]
    }
  }
  ```

### `POST /reservations`
- **Auth:** Requiere Bearer token
- **Body:**
  ```json
  { "offerId": "offer-1", "quantity": 1 }
  ```
- **Respuesta exitosa (201):**
  ```json
  {
    "success": true,
    "data": { "reservation": { ... } }
  }
  ```
- **Errores:**
  - `400` — `offerId` o `quantity` inválidos
  - `400` — Oferta no encontrada
  - `400` — Stock insuficiente

### `PATCH /reservations/:id/status`
- **Auth:** Requiere Bearer token (solo rol `business`)
- **Body:**
  ```json
  { "status": "confirmed_paid" }
  ```
- **Estados válidos:** `pending` → `confirmed_paid` → `picked_up` | `cancelled`
- **Respuesta exitosa (200):** `data.reservation` con el estado actualizado
- **Errores:** 404 si no encuentra la reserva o el cambio no está permitido

---

## Estadísticas del Comercio

### `GET /business/stats`
- **Auth:** Requiere Bearer token (solo rol `business`)
- **Respuesta:**
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalRevenue": 0,
        "totalSavedKg": 0,
        "totalBoxesSold": 0,
        "totalCancelled": 1,
        "salesByWeek": [0, 0, 0, 0],
        "topPublications": []
      }
    }
  }
  ```
- **Nota:** Los datos están aislados por `businessId` (multi-tenant). Cada comercio ve solo sus propias estadísticas.
- **Error:** 403 si el usuario no es `business`

---

## Health Check

### `GET /health`
- **Auth:** No requiere
- **Respuesta:**
  ```json
  {
    "success": true,
    "data": { "status": "ok", "service": "foodsave-api" }
  }
  ```

---

## Resumen de Endpoints

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| GET | `/health` | ❌ | — | Health check |
| POST | `/auth/login` | ❌ | — | Iniciar sesión |
| GET | `/auth/me` | ✅ | cualquiera | Datos del usuario logueado |
| GET | `/offers` | ❌ | — | Listar ofertas |
| GET | `/offers/:id` | ❌ | — | Detalle de oferta |
| GET | `/reservations` | ✅ | cualquiera | Listar reservas (filtradas por rol) |
| POST | `/reservations` | ✅ | cualquiera | Crear reserva |
| PATCH | `/reservations/:id/status` | ✅ | business | Cambiar estado de reserva |
| GET | `/business/stats` | ✅ | business | Dashboard de estadísticas |
