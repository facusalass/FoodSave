# FoodSave - Guia de estudio del flujo de login

Este documento resume lo que estuvimos viendo sobre el flujo de autenticacion del frontend hasta llegar al backend.

La idea principal:

```txt
_layout.tsx
-> AuthProvider
-> AuthContext
-> sessionStorage
-> login.tsx
-> AuthContext.login()
-> authService.login()
-> apiClient
-> backend
-> vuelve token + user
-> AuthContext guarda sesion
-> login.tsx redirige por rol
```

## 1. Donde arranca el flujo

El flujo arranca en:

```txt
frontend/app/_layout.tsx
```

Ahi se envuelve toda la app con:

```tsx
<AuthProvider>
  <Stack screenOptions={{ headerShown: false }} />
</AuthProvider>
```

Esto significa:

```txt
AuthProvider envuelve la navegacion de la app.
Gracias a eso, cualquier pantalla puede usar useAuth().
```

Frase para explicar:

> En `_layout.tsx` envolvemos toda la app con `AuthProvider` para que las pantallas puedan acceder al estado de autenticacion, como `session`, `login`, `logout` y el usuario actual.

## 2. Que es AuthProvider

`AuthProvider` es una funcion/componente de React.

Cuando vemos:

```ts
export function AuthProvider({ children }: PropsWithChildren) {
```

Significa:

```txt
export
// Permite usar AuthProvider desde otros archivos.

function
// Declara una funcion.

AuthProvider
// Nombre de la funcion/componente.

children
// Lo que queda envuelto adentro del componente.
```

Ejemplo:

```tsx
<AuthProvider>
  <Stack />
</AuthProvider>
```

Ahi:

```txt
children = <Stack />
```

Frase para explicar:

> `AuthProvider` es el componente que provee la informacion de autenticacion a toda la app. Todo lo que este adentro puede consumir el contexto con `useAuth()`.

## 3. Que es AuthContext

Archivo:

```txt
frontend/src/context/AuthContext.tsx
```

`AuthContext` es donde se maneja la sesion global del frontend.

La sesion es:

```txt
session = token + user
```

Ejemplo conceptual:

```ts
{
  token: "...",
  user: {
    id: "...",
    name: "...",
    email: "...",
    role: "client" | "business"
  }
}
```

AuthContext se encarga de:

```txt
guardar session en memoria
restaurar session al abrir la app
hacer login
hacer login con Google
registrar usuario
actualizar datos del user en session
cerrar sesion
```

Frase para explicar:

> `AuthContext` es la caja central de autenticacion del frontend. Ahi vive la sesion actual y las funciones que permiten iniciar sesion, cerrar sesion o registrar usuarios.

## 4. Que es sessionStorage

Archivo:

```txt
frontend/src/utils/sessionStorage.ts
```

Este archivo guarda, carga y borra la sesion localmente.

Usa:

```txt
SecureStore
// En mobile.

localStorage
// En web.
```

Sirve para que el usuario no tenga que loguearse cada vez que abre la app.

Funciones importantes:

```txt
loadStoredSession()
// Lee la sesion guardada.

saveStoredSession()
// Guarda token + user.

clearStoredSession()
// Borra la sesion.

isValidAuthSession()
// Valida que la sesion tenga token, user, id y role valido.
```

Frase para explicar:

> `sessionStorage` se encarga de la persistencia local. AuthContext maneja la sesion en memoria, pero sessionStorage la guarda en el dispositivo para poder restaurarla cuando se vuelve a abrir la app.

## 5. Restauracion de sesion

Cuando la app abre, `AuthContext` intenta recuperar una sesion anterior.

Flujo:

```txt
AuthProvider se monta
-> loadStoredSession()
-> si no hay sesion, termina y va a login
-> si hay token, llama getMe(token)
-> getMe llama GET /auth/me
-> backend valida token
-> si sirve, devuelve user
-> AuthContext arma session = token + user
-> guarda session
-> setSession(nextSession)
```

Importante:

```txt
El frontend no valida realmente el token solo.
El backend confirma si el token sirve.
```

Frase para explicar:

> Al abrir la app, `AuthContext` busca una sesion guardada. Si encuentra un token, llama a `/auth/me` para que el backend confirme si ese token sigue siendo valido. Si sirve, restaura la sesion; si no sirve, la borra.

## 6. Pantalla de login

Archivo:

```txt
frontend/app/(auth)/login.tsx
```

Esta pantalla maneja la interaccion del usuario.

Hace:

```txt
muestra formulario
guarda email y password en estados
valida campos
muestra errores
llama login() desde AuthContext
redirige segun el rol
```

Flujo del login normal:

```txt
usuario toca INGRESAR
-> handleLogin()
-> limpia errores
-> valida email y password
-> llama login(nextEmail, password)
-> AuthContext hace el flujo real
-> vuelve nextSession
-> router.replace(getHomeRoute(role))
```

Frase para explicar:

> `login.tsx` no guarda la sesion directamente. Solo maneja el formulario y llama a `login()` desde `AuthContext`. Cuando AuthContext devuelve la sesion, la pantalla redirige al home segun el rol del usuario.

## 7. AuthContext.login()

En `AuthContext`, el login queda asi conceptualmente:

```ts
async login(email, password) {
  return persistSession(
    requireValidSession(
      await loginWithApi({ email, password }),
      "No pudimos iniciar sesion."
    )
  );
}
```

Se lee asi:

```txt
loginWithApi()
// Pide la sesion al backend.

requireValidSession()
// Revisa que la respuesta tenga token + user.

persistSession()
// Guarda la sesion localmente y actualiza session en memoria.
```

Frase para explicar:

> `AuthContext.login()` llama al service que se comunica con el backend, valida que la respuesta sea una sesion real y despues la guarda con `persistSession`.

## 8. Helpers del refactor

### requireValidSession

```ts
function requireValidSession(
  nextSession: unknown,
  errorMessage: string
): AuthSession {
  if (!isValidAuthSession(nextSession)) {
    throw new Error(errorMessage);
  }

  return nextSession;
}
```

Sirve para:

```txt
evitar guardar respuestas incompletas
asegurar que haya token + user
centralizar la validacion de sesion
```

### persistSession

```ts
async function persistSession(nextSession: AuthSession) {
  await saveStoredSession(nextSession);
  setSession(nextSession);
  return nextSession;
}
```

Sirve para:

```txt
guardar la sesion en local
actualizar session en memoria
devolver la sesion
```

Frase para explicar el refactor:

> Refactorice AuthContext para que login, Google login y register no repitan la misma logica de validar y guardar sesion. Ahora esa responsabilidad esta centralizada en `requireValidSession` y `persistSession`.

## 9. authService

Archivo:

```txt
frontend/src/services/authService.ts
```

`authService` es el mensajero entre AuthContext y la API.

Hace:

```txt
recibe datos desde AuthContext
arma la llamada al endpoint correspondiente
llama a apiRequest()
devuelve la respuesta del backend
```

Ejemplo login:

```ts
export async function login(credentials: LoginCredentials) {
  return apiRequest<AuthSession>("/auth/login", {
    body: JSON.stringify(credentials),
    method: "POST"
  });
}
```

Explicacion:

```txt
export
// Permite usar esta funcion desde otros archivos.

async
// Permite usar await porque llama al backend.

apiRequest<AuthSession>
// Llama a la API y espera que la data sea una AuthSession.

"/auth/login"
// Endpoint del backend.

method: "POST"
// Se envian datos para iniciar sesion.

body: JSON.stringify(credentials)
// Convierte email/password a JSON.
```

Importante:

```txt
authService no guarda sesion.
authService no navega.
authService no decide si el usuario queda logueado.
authService solo comunica con la API.
```

Frase para explicar:

> `authService` centraliza los endpoints de autenticacion. Define funciones como `login`, `register`, `getMe` y `loginWithGoogle`, pero no maneja estado. Solo llama al backend y devuelve la respuesta.

## 10. apiClient

Archivo:

```txt
frontend/src/services/apiClient.ts
```

`apiClient` es la puerta unica para hablar con el backend.

Hace:

```txt
recibe path y options
arma headers
agrega Accept JSON
agrega Content-Type si manda JSON
agrega Authorization si hay token
hace fetch
lee la respuesta
maneja errores
devuelve solo data
```

Parte clave:

```ts
response = await fetch(`${API_BASE_URL}${path}`, {
  ...options,
  headers
});
```

Ese es el momento donde sale del frontend y va al backend.

Ejemplo:

```txt
API_BASE_URL = http://localhost:4000
path = /auth/login

fetch -> http://localhost:4000/auth/login
```

Si hay token:

```ts
headers.set("Authorization", `Bearer ${options.token}`);
```

Eso manda:

```txt
Authorization: Bearer <token>
```

Frase para explicar:

> `apiClient` arma la request real al backend. Tambien agrega headers, envia el token cuando corresponde y devuelve solamente la `data` util a los services.

## 11. Cuando ya pasa al backend

Despues de `apiClient`, el flujo entra al backend.

Login:

```txt
apiClient
-> fetch POST /auth/login
-> backend/src/app.ts
-> backend/src/routes/authRoutes.ts
-> backend/src/controllers/authController.ts
-> backend/src/services/authService.ts
-> Supabase/base de datos
```

Ruta protegida:

```txt
apiClient agrega Authorization: Bearer <token>
-> backend recibe request
-> middleware isAuth lee Authorization
-> validateToken(token)
-> si sirve, crea request.user
-> controller usa request.user
```

Frase para explicar:

> `apiClient` es la ultima parada del frontend. Cuando ejecuta `fetch`, la request ya entra al backend.

## 12. Login no es CRUD

CRUD significa:

```txt
C = Create
R = Read
U = Update
D = Delete
```

Login no se suele explicar como CRUD completo.

Login es un flujo de autenticacion:

```txt
POST /auth/login
// Crea una sesion, pero no es un CRUD comun de entidad.
```

Se puede pensar asi:

```txt
login
// crea sesion

getMe
// lee usuario actual desde token

logout
// borra sesion local
```

Pero la forma correcta de decirlo:

> Login pertenece al flujo de autenticacion, no a un CRUD tradicional.

## 13. Ejemplo CRUD/CRD en frontend: favoritos

Archivo:

```txt
frontend/src/services/favoriteService.ts
```

Favoritos tiene:

```txt
READ
GET /favorites
// getFavorites()

CREATE
POST /favorites/:offerId
// addFavorite()

DELETE
DELETE /favorites/:offerId
// removeFavorite()
```

No tiene UPDATE porque un favorito no se edita:

```txt
o esta en favoritos
o no esta en favoritos
```

Frase para explicar:

> En favoritos no hay update porque el recurso no tiene campos editables desde el frontend. La logica es agregar, listar o quitar favoritos. Por eso es un CRD, y sigue siendo un ejemplo valido de operaciones tipo CRUD desde el frontend.

## 14. Explicacion completa para decir en voz alta

Version ordenada:

> El flujo de login arranca en `_layout.tsx`, donde envolvemos toda la app con `AuthProvider`. Esto permite que cualquier pantalla pueda acceder al estado de autenticacion mediante `useAuth`.

> `AuthProvider` viene de `AuthContext.tsx`, que es donde se maneja la sesion global del frontend. La sesion contiene `token` y `user`, y ahi tambien estan las funciones `login`, `loginWithGoogle`, `register` y `logout`.

> Para no perder la sesion al cerrar la app, usamos `sessionStorage.ts`, que guarda la sesion localmente. En mobile usa `SecureStore` y en web usa `localStorage`.

> Cuando el usuario entra a la pantalla de login, `login.tsx` maneja el formulario, valida email y password, y si todo esta bien llama a `login()` desde `AuthContext`.

> `AuthContext.login()` llama a `authService.login()`. Ese service define el endpoint `/auth/login` y usa `apiClient` para comunicarse con el backend.

> `apiClient` arma la request, agrega headers como `Content-Type` y, si hay token, `Authorization`. En el login todavia no hay token, entonces hace un `POST /auth/login` con email y password.

> El backend responde con `token + user`. Cuando esa respuesta vuelve, `AuthContext` valida que sea una sesion correcta y la guarda con `persistSession`, que usa `saveStoredSession` y `setSession`.

> Finalmente, la pantalla de login redirige segun el rol del usuario: si es cliente va a `/(client)/home`, y si es comercio va a `/(business)/dashboard`.

## 15. Frases cortas para memorizar

```txt
AuthProvider
// Provee auth a toda la app.

AuthContext
// Maneja session, login y logout.

sessionStorage
// Guarda la sesion localmente.

login.tsx
// Maneja formulario y redireccion.

authService
// Define endpoints de auth.

apiClient
// Hace el fetch real al backend.

token
// Credencial que demuestra que el usuario inicio sesion.

Authorization: Bearer <token>
// Forma en que el frontend manda el token al backend.

Backend
// Valida el token y decide si el usuario puede entrar.
```

## 16. Errores comunes al explicar

No decir:

```txt
AuthContext esta dentro de services.
```

Mejor:

```txt
AuthContext esta en context.
Los services son otra capa para comunicarse con el backend.
```

No decir:

```txt
authService guarda la sesion.
```

Mejor:

```txt
authService llama al backend.
AuthContext guarda la sesion.
```

No decir:

```txt
El frontend valida el token solo.
```

Mejor:

```txt
El frontend guarda y envia el token.
El backend valida si ese token sirve.
```

## 17. Ruta mental final

Si te perdes, volve a esta ruta:

```txt
Pantalla
-> AuthContext
-> authService
-> apiClient
-> backend
-> vuelve respuesta
-> AuthContext guarda session
-> pantalla navega
```
