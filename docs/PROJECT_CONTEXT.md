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
- `POST /auth/register`
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

## Backend conectado a Supabase

- El backend actualizado usa Supabase para datos/autenticacion en produccion.
- Los usuarios nuevos reciben JWT real desde el backend; el frontend no interpreta el formato del token, solo lo guarda y lo envia como `Authorization: Bearer <token>`.
- Los usuarios demo `cliente@foodsave.com` y `comercio@foodsave.com` siguen funcionando.
- No cambiaron endpoints ni contrato de API; las pantallas mobile no necesitan cambios por JWT/Supabase.
- Variables locales del backend: `PORT`, `NODE_ENV`, `FRONTEND_ORIGIN`, `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Variables locales del frontend: `EXPO_PUBLIC_API_URL` y, si hace falta, `EXPO_PUBLIC_LANDING_URL`.
- No subir archivos `.env` ni credenciales reales al repo. Usar `.env.example` solo con placeholders.

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
- El login con Google usa `expo-auth-session` en mobile, envia `{ idToken }` a `POST /auth/google`, el backend valida el token con Google y crea/inicia usuario `client` por defecto si el email no existe.
- La sesion se guarda localmente y se restaura al abrir la app; si no hay sesion valida o falla `/auth/me`, se limpia la sesion local y se vuelve al login.
- Hay logout visible en home cliente y dashboard comercio para limpiar la sesion y volver al login.

## Registro de usuarios cliente

- La ruta mobile de registro es `frontend/app/(auth)/register.tsx`.
- El registro usa `POST /auth/register` con `name`, `phone`, `email` y `password`.
- Si el backend devuelve token/user, el frontend guarda sesion y hace autologin al Home cliente.
- Si el backend devuelve `emailConfirmationRequired: true`, el frontend no guarda sesion y navega a `frontend/app/(auth)/check-email.tsx`.
- Google desde mobile queda conectado al backend; no se usa Supabase client en frontend.
- No hay registro mobile de comercios en esta fase.

## Recuperacion de contrasena

- El login mobile tiene el enlace `Olvide mi contrasena`.
- La ruta mobile es `frontend/app/(auth)/forgot-password.tsx`.
- La pantalla valida email vacio/formato invalido y llama `POST /auth/reset-password` mediante `frontend/src/services/authService.ts`.
- El backend valida que exista una cuenta registrada antes de enviar el link de recuperacion.
- Si el backend responde bien, muestra instrucciones para revisar el correo.
- No se implementa todavia la pantalla de nueva contrasena ni validacion de email/codigo porque falta contrato final de Supabase/backend.

## Fase 2 Cliente MVP

- El flujo cliente usa Expo Router Tabs en `frontend/app/(client)/_layout.tsx`.
- Tabs visibles: `Explorar` (`home.tsx`), `Mis reservas` (`reservations.tsx`) y `Perfil` (`profile.tsx`).
- El detalle de oferta vive en `frontend/app/(client)/offer/[id].tsx` y queda oculto en la barra inferior.
- `Explorar` consume `GET /offers` mediante `frontend/src/services/offerService.ts`.
- Las cards y el detalle de oferta muestran `logoUrl` del comercio cuando el backend lo incluye en las ofertas enriquecidas.
- `Mis reservas` consume `GET /reservations` mediante `frontend/src/services/reservationService.ts` usando el token de sesion.
- El detalle de oferta permite crear una reserva real con `POST /reservations`; la reserva queda en estado `pending`, descuenta un cupo de la oferta y luego aparece en `Mis reservas`.
- El menu lateral cliente esta en `ClientSideMenu` y deja disponible `Cerrar sesion`, `Favoritos` y `Ayuda`.
- `Perfil` es MVP visual/local: muestra datos de sesion y campos de contacto, sin persistencia real ni endpoint de perfil todavia.

## Flujo de reserva y confirmacion de pago

- El cliente crea reservas desde el detalle de oferta usando `POST /reservations`.
- La reserva se crea con estado inicial `pending`; en la UI cliente se muestra como `Pendiente de pago`.
- El backend devuelve la reserva completa con `code`, `confirmationCode`, `expiresAt`, `paymentAlias`/`bankAlias` y `whatsappPhone` si existe.
- Despues de reservar, el frontend navega a `frontend/app/(client)/reservation-confirmed.tsx`, una pantalla oculta en tabs.
- La pantalla de reserva creada muestra codigo, comercio, oferta, horario de retiro, alias bancario y un temporizador visual de 15 minutos basado en `expiresAt`.
- El boton `Avisar pago por WhatsApp` abre WhatsApp con un mensaje prearmado para el comercio; no envia comprobantes ni confirma pagos automaticamente.
- En `Mis reservas`, las reservas `pending` con `expiresAt` vigente muestran alias, tiempo restante, accion para avisar pago por WhatsApp y accion para cancelar.
- La cancelacion cliente usa el endpoint existente `PATCH /reservations/:id/status` solo para reservas propias en estado `pending`, cambiandolas a `cancelled`.
- Si `expiresAt` ya paso, el frontend muestra la reserva como expirada de forma visual. No hay job real de backend ni base de datos que cancele reservas todavia.
- El comercio debe validar manualmente el pago y cambiar el estado a `confirmed_paid`; no hay Mercado Pago ni pagos reales integrados.

## Favoritos cliente

- El frontend cliente queda preparado para Favoritos en `frontend/app/(client)/favorites.tsx`.
- La seccion se abre desde el menu hamburguesa; `favorites` queda oculto en tabs y no aparece en la barra inferior.
- Home y detalle de oferta muestran un corazon para agregar o quitar favoritos.
- El frontend consume los endpoints esperados `GET /favorites`, `POST /favorites/:offerId` y `DELETE /favorites/:offerId` mediante `frontend/src/services/favoriteService.ts`.
- Favoritos ya usa endpoints reales protegidos para rol `client` con `Authorization: Bearer <token>` y contrato estandar `{ success, data/error }`.
- El backend persiste favoritos por `userId + offerId`, evita duplicados, valida oferta inexistente y devuelve en `GET /favorites` ofertas enriquecidas con el mismo formato que `GET /offers`.
- Si falla una accion puntual de favoritos, el frontend muestra un mensaje simple y mantiene la navegacion estable.

## Ayuda cliente

- La ruta mobile de ayuda es `frontend/app/(client)/help.tsx`.
- La seccion se abre desde el menu hamburguesa; `help` queda oculto en tabs y no aparece en la barra inferior.
- Incluye explicacion breve de FoodSave, pasos de uso, link a la landing publica para sumar comercios, preguntas frecuentes y correo de soporte.
- La URL de landing se centraliza en `frontend/src/config/links.ts` como `LANDING_URL`, con soporte para `EXPO_PUBLIC_LANDING_URL`.
- No usa backend, endpoints ni chat real por ahora.

## Notificaciones internas

- La campanita del `ClientTopBar` abre `frontend/app/(client)/notifications.tsx`.
- `notifications` queda oculto en tabs y no aparece en la barra inferior.
- Por ahora no hay push notifications reales, permisos del sistema ni Expo Notifications.
- Las notificaciones cliente vienen del backend con `GET /notifications`.
- El estado leida/no leida lo maneja backend con `PATCH /notifications/:id/read` y `PATCH /notifications/read-all`.
- Ya no se derivan notificaciones desde reservas ni se guarda read/unread en SecureStore.
- Como evolucion futura se pueden agregar Expo Push Notifications.

## Filtro por ciudad cliente

- El backend expone `GET /cities` para listar ciudades con comercios registrados.
- `GET /offers` acepta `?city=...` para filtrar ofertas por ciudad del comercio.
- El Home cliente usa `expo-location` para pedir ubicacion, convertir lat/lng a ciudad con reverse geocode y matchearla contra las ciudades del backend.
- Si no hay permiso o no hay match, usa fallback a `Resistencia, Chaco` si existe o la primera ciudad disponible.
- El usuario puede cambiar la ciudad manualmente desde el boton de ciudad junto al buscador.
- Si una ciudad no tiene ofertas, el Home muestra un estado vacio especifico.
- No se usa Mapbox ni se muestra mapa en esta fase.

## Panel comercio/admin mobile

- El dashboard comercio vive en `frontend/app/(business)/dashboard.tsx` y usa una interfaz mobile alineada al sistema visual FoodSave: header claro, cards blancas, acentos naranja/verde, saludo del local, cierre del dia, metricas, boton de publicar excedente y accesos rapidos.
- La navegacion business usa tabs inferiores con `Inicio`, `Publicar` y `Pedidos`.
- El menu hamburguesa del comercio usa `BusinessSideMenu` y permite navegar a Inicio, Publicar excedente, Pedidos, Historial, Estadisticas y Mi local; Cerrar sesion usa `AuthContext.logout`.
- Las metricas del dashboard usan datos reales existentes: `GET /business/offers` para ofertas del comercio y `GET /reservations` para reservas del comercio.
- El cierre del dia sale de `GET /business/profile` y se guarda desde Mi local como `closingTime` en formato `HH:mm`.
- `Publicar` permite crear ofertas reales del comercio usando `POST /business/offers`; el limite de retiro usa el horario de cierre real del perfil y la imagen se puede seleccionar/subir con `expo-image-picker` + `POST /upload/image`.
- `Historial` usa `GET /reservations` con token business, filtra localmente reservas cobradas/retiradas/canceladas por ultimos 7 dias, ultimo mes, rango de dias o todo el historial cargado, y calcula total cobrado excluyendo canceladas.
- `Mi local` carga y guarda datos del comercio con `GET /business/profile` y `PUT /business/profile`, incluyendo `paymentInfo` y `logoUrl`; el logo se selecciona con `expo-image-picker`, se sube con `POST /upload/image` y se guarda como `logoUrl`.
- `Mi local > Publicaciones` lista ofertas del comercio con `GET /business/offers` y oculta/muestra usando `PATCH /business/offers/:id/visibility`; editar publicaciones queda como placeholder hasta tener pantalla de edicion.
- `Estadisticas` calcula el mes actual con datos reales de `GET /reservations` y `GET /business/offers`: ingresos, cajas vendidas, cancelados, ventas por semana y top publicaciones; comida salvada queda en `-- KG` si las ofertas no tienen `estimatedWeightInKg`.
- La campanita del comercio abre un modal conectado a `GET /notifications`. La pantalla completa y marcar leidas del comercio quedan pendientes hasta definir endpoints business-specific.
- La pantalla `frontend/app/(business)/orders.tsx` muestra una lista basica de pedidos usando reservas existentes.
- No se toca backend para esta fase.

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
