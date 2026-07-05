# FoodSave

FoodSave es una app mobile para reducir el desperdicio de comida conectando comercios gastronomicos con clientes que compran excedentes, productos del dia o Mystery Boxes con descuento.

El proyecto esta organizado como monorepo con frontend mobile en Expo/React Native y backend REST en Node.js/Express conectado a Supabase.

## Stack Tecnico

**Frontend**

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- SecureStore para persistencia de sesion y tema
- `expo-auth-session` para Google Login
- `expo-image-picker` para subir imagenes de ofertas/logos
- `expo-location` para detectar ciudad

**Backend**

- Node.js
- Express 5
- TypeScript
- Supabase JS
- Supabase Auth + tablas propias
- Multer para upload de imagenes
- Google Auth Library para validar Google Login

**Base de datos**

- Supabase Postgres
- Supabase Storage bucket `offers`
- Tablas principales: `users`, `businesses`, `offers`, `reservations`, `favorites`, `notifications`

## Estructura

```text
FoodSave/
  frontend/                 App mobile Expo
    app/                    Rutas Expo Router
    src/components/         Componentes reutilizables
    src/context/            AuthContext y ThemeContext
    src/services/           Clientes API por dominio
    src/types/              Tipos TypeScript frontend
    src/utils/              Helpers de UI, reservas, favoritos, tema

  backend/                  API REST
    src/app.ts              Registro de middlewares y rutas
    src/controllers/        Controllers HTTP
    src/routes/             Definicion de endpoints
    src/services/           Reglas de negocio y repositorio Supabase
    src/middlewares/        Auth, roles, API key y errores
    src/types/              Tipos backend
    sql/                    Schema, seed y scripts de Supabase

  docs/                     Documentacion interna del proyecto
```

## Requisitos

- Node.js compatible con Expo SDK 54
- npm
- Expo Go para probar en Android/iOS
- Cuenta/proyecto Supabase configurado para backend local o deploy

## Instalacion

Desde la raiz:

```bash
npm install
```

El repo usa npm workspaces:

```json
["frontend", "backend"]
```

## Variables de Entorno

No subir archivos `.env` con valores reales.

### Frontend

Crear `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_LANDING_URL=...
```

Notas:

- Para web puede usarse `http://localhost:4000`.
- Para Expo Go en celular, usar la IP LAN de la PC, por ejemplo `http://192.168.1.25:4000`.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` es importante si se prueba Google Login en Android con development build/configuracion nativa.

### Backend

Crear `backend/.env`:

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:8081
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
API_KEY=...
```

`GOOGLE_CLIENT_ID` puede aceptar varios IDs separados por coma.

## Comandos

Desde la raiz:

```bash
npm run dev:backend
npm run dev:frontend
npm run typecheck
npm run build
```

Frontend:

```bash
npm run start --workspace frontend
npm run android --workspace frontend
npm run ios --workspace frontend
npm run web --workspace frontend
npm run typecheck --workspace frontend
```

Backend:

```bash
npm run dev --workspace backend
npm run build --workspace backend
npm run start --workspace backend
npm run typecheck --workspace backend
```

## Ejecucion Local

1. Levantar backend:

```bash
npm run dev:backend
```

2. Verificar health check:

```bash
curl http://localhost:4000/health
```

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "foodsave-api"
  }
}
```

3. Configurar `frontend/.env` con `EXPO_PUBLIC_API_URL`.

4. Levantar frontend:

```bash
npm run dev:frontend
```

5. Abrir en Expo Go o web.

Para Expo Go en celular, `localhost` apunta al celular. Usar la IP local de la PC y probar desde el navegador del celular:

```text
http://IP_DE_LA_PC:4000/health
```

## Usuarios Demo

```text
Cliente:
email: cliente@foodsave.com
password: 123456

Comercio:
email: comercio@foodsave.com
password: 123456
```

Los usuarios demo pueden devolver tokens mock para mantener compatibilidad con datos seed. Los usuarios registrados por Supabase usan JWT real.

## Flujos Principales

### Cliente

- Login normal y Google Login
- Registro de cliente
- Recuperacion de contrasena
- Home con ofertas por ciudad
- Busqueda y filtros por categoria
- Favoritos
- Detalle de oferta
- Crear reserva
- Pantalla de reserva pendiente de pago
- Mis reservas
- Perfil
- Notificaciones
- Dark mode

### Comercio

- Login comercio
- Dashboard con metricas
- Banner si el comercio esta suspendido (`isActive = false`)
- Publicar excedente con imagen obligatoria
- Pedidos
- Confirmar pago/cancelar pedido
- Historial
- Estadisticas
- Mi Local
- Cargar logo
- Editar datos bancarios
- Editar publicaciones
- Ocultar/mostrar publicaciones
- Dark mode desde Mi Local
- Notificaciones

## Contrato API

Todas las respuestas exitosas siguen:

```json
{
  "success": true,
  "data": {}
}
```

Todas las respuestas de error siguen:

```json
{
  "success": false,
  "error": {
    "message": "Mensaje legible"
  }
}
```

El frontend centraliza el manejo en:

```text
frontend/src/services/apiClient.ts
```

Las rutas protegidas envian:

```http
Authorization: Bearer <token>
```

## Endpoints Principales

### Auth

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/google`
- `POST /auth/reset-password`
- `POST /auth/register-business`
- `GET /auth/me`

### Ofertas Publicas

- `GET /offers`
- `GET /offers/:id`
- `GET /cities`

`GET /offers` soporta filtros:

```text
?category=
?type=
?city=
?page=
?limit=
```

### Comercio

- `GET /business/profile`
- `PUT /business/profile`
- `GET /business/offers`
- `POST /business/offers`
- `PUT /business/offers/:id`
- `PATCH /business/offers/:id/visibility`
- `DELETE /business/offers/:id`
- `GET /business/stats`

### Reservas

- `GET /reservations`
- `POST /reservations`
- `PATCH /reservations/:id/status`

### Favoritos

- `GET /favorites`
- `POST /favorites/:offerId`
- `DELETE /favorites/:offerId`

### Notificaciones

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

### Upload

- `POST /upload/image`

Usa `multipart/form-data` con campo `file` y devuelve una URL publica.

## Base de Datos y SQL

Los scripts viven en:

```text
backend/sql/
```

Orden recomendado para una base nueva:

1. `01_schema.sql`
2. `02_seed.sql`
3. `03_rls.sql`
4. `04_auth_trigger.sql`
5. `05_storage.sql`
6. `06_city_column.sql`
7. `07_offer_visibility.sql`
8. `07_suspend_business.sql`
9. `08_demo_media_fallbacks.sql` solo si se necesita completar medios demo faltantes

`08_demo_media_fallbacks.sql` es opcional y esta pensado para demo/dev. Solo completa imagenes/logos faltantes en registros seed conocidos; no cambia precios, stock, estados ni `isActive`.

## Modelo de Datos

### `users`

- Usuario cliente o comercio
- Rol: `client` o `business`
- Puede vincularse a un negocio mediante `businessId`

### `businesses`

- Datos del comercio
- Ciudad, direccion, categoria, descripcion
- Horario de cierre
- `logoUrl`
- `isActive`
- `paymentInfo`

### `offers`

- Publicaciones del comercio
- Tipo: `mystery_box` o `standard`
- Precio original y rebajado
- Stock
- Horario/limite de retiro
- Alergenos
- `imageUrl`
- `isVisible`
- Peso estimado opcional

### `reservations`

- Reserva de una oferta por cliente
- Estados: `pending`, `confirmed_paid`, `picked_up`, `cancelled`

### `favorites`

- Relacion `userId + offerId`

### `notifications`

- Notificaciones internas del usuario
- Estado leida/no leida

## Arquitectura Frontend

El frontend usa Expo Router con grupos de rutas:

```text
frontend/app/(auth)
frontend/app/(client)
frontend/app/(business)
```

La sesion se maneja en:

```text
frontend/src/context/AuthContext.tsx
```

El tema claro/oscuro se maneja en:

```text
frontend/src/context/ThemeContext.tsx
frontend/src/constants/theme.ts
```

Los servicios por dominio estan en:

```text
frontend/src/services/
```

La navegacion inicial redirige por rol:

```text
client -> /(client)/home
business -> /(business)/dashboard
```

## Arquitectura Backend

La API se registra en:

```text
backend/src/app.ts
```

Capas principales:

- `routes`: define rutas Express
- `controllers`: valida request y arma response
- `services`: reglas de negocio
- `repository`: acceso centralizado a Supabase
- `middlewares`: auth, roles, API key y errores

Middlewares principales:

- `isAuth`
- `isClient`
- `isBusinessOwner`
- `requireApiKey`

## Google Login

Frontend:

```text
frontend/src/config/googleAuth.ts
```

Backend:

```text
backend/src/services/authService.ts
backend/src/controllers/authController.ts
```

El frontend obtiene un `idToken` y lo envia a:

```text
POST /auth/google
```

El backend valida el token con Google y crea/inicia el usuario en Supabase.

## Upload de Imagenes

El comercio puede subir imagenes desde:

- Publicar excedente
- Editar publicacion
- Mi Local para logo

El frontend usa `expo-image-picker` y luego llama:

```text
POST /upload/image
```

El backend sube el archivo al bucket publico `offers` de Supabase Storage y devuelve `{ url }`.

## Reglas de Seguridad del Proyecto

- No subir `.env` reales.
- No exponer secretos en documentacion, commits o logs.
- No tocar produccion directamente salvo que sea intencional.
- Para actualizar datos demo, preferir API/backend o SQL especifico y acotado.
- No cambiar contratos de API sin actualizar frontend y documentacion.

## Checklist de Demo

1. Login cliente.
2. Ver Home y ofertas.
3. Filtrar por ciudad/categoria.
4. Abrir detalle de oferta.
5. Agregar/quitar favorito.
6. Crear reserva.
7. Ver reserva pendiente de pago.
8. Entrar a Mis reservas.
9. Login comercio.
10. Ver Dashboard.
11. Publicar excedente con imagen.
12. Ver Pedidos.
13. Confirmar/cancelar pedido.
14. Ver Mi Local y Publicaciones.
15. Probar dark mode.

## Calidad

Antes de cerrar cambios:

```bash
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
```

Para validar ambos workspaces:

```bash
npm run typecheck
```

## Documentacion Complementaria

- `docs/PROJECT_CONTEXT.md`: contexto funcional y decisiones del proyecto
- `docs/CODEX_RULES.md`: reglas internas de desarrollo
- `docs/BACKEND_CHANGES.md`: cambios y contratos del backend
