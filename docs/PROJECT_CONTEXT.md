# FoodSave / SaveFood - Contexto del Proyecto

FoodSave es una app móvil para reducir el desperdicio de comida en Resistencia, Chaco. Conecta comercios gastronómicos locales con usuarios que quieren comprar excedentes, productos próximos a vencer o Mystery Boxes a menor precio.

## Fuentes revisadas

- Notion: ETAPA 1, ETAPA 2, ETAPA 3, SaveFood App y Funcionalidades del proyecto.
- Figma cliente: `https://anchor-jolt-58850699.figma.site/`.
- Figma panel admin: `https://mocha-pie-77715251.figma.site/login`.
- El enlace original de ETAPA 4 no fue accesible; se toma "Funcionalidades del proyecto" como referencia funcional equivalente.

## Alcance de esta fase

- Monorepo con `frontend`, `backend` y `docs`.
- Frontend mobile con Expo, React Native, TypeScript y Expo Router.
- Backend REST con Node.js, Express y TypeScript.
- Login funcional simple con usuarios mockeados.
- Sesión persistente localmente en el frontend.
- Navegación por rol: cliente y comercio/admin.
- Datos mockeados en backend para ofertas y reservas.

Prioridad de implementación actual: login funcional e inicio por rol. Las pantallas completas de reservas, perfil y publicación avanzada quedan para iteraciones siguientes.

No se implementan pagos integrados, base de datos, autenticación JWT compleja, geolocalización real, almacenamiento externo de imágenes ni lógica compleja de stock.

## Usuarios mock

- Cliente: `cliente@foodsave.com` / `123456` / `client`.
- Comercio/Admin: `comercio@foodsave.com` / `123456` / `business`.

## Estados de reserva

- `pending`: reserva creada, pendiente de comprobante o validación.
- `confirmed_paid`: comercio validó el pago.
- `picked_up`: pedido entregado; cuenta como venta completada.
- `cancelled`: reserva no concretada.

## Endpoints iniciales

- `POST /auth/login`
- `GET /auth/me`
- `GET /offers`
- `GET /offers/:id`
- `GET /reservations`
- `PATCH /reservations/:id/status`

## Como probar con Expo Go

1. Instalar Expo Go en el celular desde App Store o Google Play.
2. Conectar la PC y el celular a la misma red WiFi.
3. Levantar el backend:

```bash
cd backend
npm install
npm run dev
```

4. Configurar la URL de la API para el frontend. Para web puede usarse:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4000
```

Para Expo Go en el celular, `localhost` apunta al celular, no a la PC. Usar la IP local de la PC:

```bash
EXPO_PUBLIC_API_URL=http://IP_DE_MI_PC:4000
```

La URL esta centralizada en `frontend/src/config/api.ts` y tambien puede declararse en `frontend/.env`.

5. Levantar el frontend:

```bash
cd frontend
npm install
npm start
```

6. Escanear el QR que muestra Expo con Expo Go.

## Flujo inicial mobile

- Al abrir la app se muestra una pantalla inicial de carga con la marca FoodSave mientras `AuthContext` restaura la sesion guardada desde SecureStore.
- Cuando termina la restauracion, la app envia a login si no hay sesion, al home cliente si el rol es `client`, o al dashboard comercio si el rol es `business`.

## Decisiones visuales

- Paleta basada en Figma:
  - Primario: `#FF6B35`
  - Secundario: `#14B8A6`
  - Fondo: `#F9FAFB`
  - Texto principal: `#1F2937`
  - Texto secundario: `#6B7280`
- Tipografía sans serif moderna usando la fuente del sistema.
- Márgenes consistentes en múltiplos de 8 y 16 px.
- Textos visibles en español.

## Decisiones arquitectónicas

- El frontend no contiene datos principales mockeados de negocio; consume la API.
- El backend no contiene elementos visuales.
- La capa backend se separa en rutas, controladores, servicios, datos y tipos.
- La sesión mock usa tokens simples del tipo `mock-token-{userId}` solo para esta fase.
