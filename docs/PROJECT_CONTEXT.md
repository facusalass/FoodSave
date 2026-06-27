# FoodSave / SaveFood - Contexto del Proyecto

FoodSave es una app móvil para reducir el desperdicio de comida en Resistencia, Chaco. Conecta comercios gastronómicos locales con usuarios que quieren comprar excedentes, productos próximos a vencer o Mystery Boxes a menor precio.

## Fuentes revisadas

- Notion: ETAPA 1, ETAPA 2, ETAPA 3, SaveFood App y Funcionalidades del proyecto.
- Figma cliente: `https://anchor-jolt-58850699.figma.site/`.
- Figma panel admin: `https://mocha-pie-77715251.figma.site/login`.
- El enlace original de ETAPA 4 no fue accesible; se toma "Funcionalidades del proyecto" como referencia funcional equivalente.

## Alcance de esta fase

- Monorepo con `frontend`, `backend` y `docs`.
- Frontend mobile con Expo SDK 54, React Native, TypeScript y Expo Router.
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
- `POST /reservations`
- `GET /reservations`
- `PATCH /reservations/:id/status`

## Contrato de API

- Todas las respuestas exitosas siguen el formato `{ success: true, data: ... }`.
- Todas las respuestas de error siguen el formato `{ success: false, error: { message: "..." } }`.
- El frontend centraliza la lectura de este contrato en `frontend/src/services/apiClient.ts`; los services reciben directamente `data`.
- Las rutas protegidas envian el token desde la sesion con `Authorization: Bearer <token>`.
- Si el backend no responde, el frontend muestra un mensaje amigable en espanol y no expone errores tecnicos como `Failed to fetch`.

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

1. En Windows, ejecutar `ipconfig`.
2. Buscar la direccion IPv4 de la red WiFi, por ejemplo `192.168.1.25`.
3. Crear o editar `frontend/.env`:

```bash
EXPO_PUBLIC_API_URL=http://IP_DE_LA_PC:4000
```

Ejemplo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.25:4000
```

Antes de abrir Expo Go, probar desde el navegador del celular:

```bash
http://IP_DE_LA_PC:4000/health
```

Debe responder el health check de la API. Si no responde, revisar que backend este encendido, que celular y PC esten en la misma red WiFi, y que el firewall de Windows permita conexiones al puerto `4000`.

La URL esta centralizada en `frontend/src/config/api.ts` y tambien puede declararse en `frontend/.env`.

5. Levantar el frontend:

```bash
cd frontend
npm install
npx expo start -c
```

6. Escanear el QR que muestra Expo con Expo Go.

## Flujo inicial mobile

- Al abrir la app se muestra una pantalla inicial de carga con la marca FoodSave mientras `AuthContext` restaura la sesion guardada desde SecureStore.
- Cuando termina la restauracion, la app envia a login si no hay sesion, al home cliente si el rol es `client`, o al dashboard comercio si el rol es `business`.

## Fase login

- El login mobile consume el backend mediante `POST /auth/login`; no valida credenciales hardcodeadas en el frontend.
- La URL de API se centraliza en `frontend/src/config/api.ts` y puede configurarse con `EXPO_PUBLIC_API_URL`.
- Antes de llamar al backend, el frontend valida correo vacio, formato de correo y contrasena vacia.
- Las credenciales mock vigentes son `cliente@foodsave.com` / `123456` para rol `client` y `comercio@foodsave.com` / `123456` para rol `business`.
- Si el backend rechaza credenciales con formato valido, la app muestra `Correo o contrasena incorrectos.`
- La sesion se guarda localmente y se restaura al abrir la app; si no hay sesion valida o falla `/auth/me`, se limpia la sesion local y se vuelve al login.
- Hay logout visible en home cliente y dashboard comercio para limpiar la sesion y volver al login.

## Fase 2 Cliente MVP

- El flujo cliente usa Expo Router Tabs en `frontend/app/(client)/_layout.tsx`.
- Tabs visibles: `Explorar` (`home.tsx`), `Mis reservas` (`reservations.tsx`) y `Perfil` (`profile.tsx`).
- El detalle de oferta vive en `frontend/app/(client)/offer/[id].tsx` y queda oculto en la barra inferior.
- `Explorar` consume `GET /offers` mediante `frontend/src/services/offerService.ts`; las ofertas mock principales viven en el backend.
- `Mis reservas` consume `GET /reservations` mediante `frontend/src/services/reservationService.ts` usando el token de sesion.
- El detalle de oferta permite crear una reserva mock con `POST /reservations`; la reserva queda en estado `pending`, descuenta un cupo de la oferta y luego aparece en `Mis reservas`.
- El menu lateral cliente esta en `ClientSideMenu` y deja disponible `Cerrar sesion`; Favoritos y Ayuda quedan como placeholders visuales por ahora.
- `Perfil` es MVP visual/local: muestra datos de sesion y campos de contacto, sin persistencia real ni endpoint de perfil todavia.

## Compatibilidad Expo

- El frontend queda fijado en Expo SDK 54 para compatibilidad con Expo Go disponible en Android.

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
