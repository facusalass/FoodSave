import { API_BASE_URL } from "../config/api";

type RequestOptions = RequestInit & {
  // Token opcional para rutas protegidas.
  token?: string;
};

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error: {
    message: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function apiRequest<T>(
  path: string, //recibe la ruta de la API a la que se quiere hacer la request
  options: RequestOptions = {} // recibe datos extras como el token
): Promise<T> {
  // Creamos headers nuevos y conservamos los que hayan llegado por options.
  const headers = new Headers(options.headers);

  // Todas las respuestas de nuestra API se esperan en formato JSON.
  headers.set("Accept", "application/json");

  // Si mandamos body JSON, Express necesita este Content-Type para leerlo.
  // No lo seteamos para FormData porque fetch agrega el boundary automaticamente.
  if (options.body && !headers.has("Content-Type") && !isFormData(options.body)) {
    headers.set("Content-Type", "application/json");
  }

  // Si viene token, lo enviamos como Bearer para que el backend lo valide.
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    // Aca sale la request real al backend.
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error(
      "No pudimos conectar con el servidor. Verificá que el backend esté encendido y que tu celular esté en la misma WiFi que la PC."
    );
  }

  // Leemos como texto para poder manejar respuestas vacias o JSON invalido.
  const rawBody = await response.text();
  const body = parseJson<ApiResponse<T>>(rawBody);

  // Errores HTTP: 400, 401, 403, 500, etc.
  if (!response.ok) {
    const message = getErrorMessage(body, response.status);

    throw new Error(message);
  }

  // Errores con contrato de API: { success: false, error: { message } }.
  if (isApiFailure(body)) {
    throw new Error(readApiErrorMessage(body));
  }

  // Respuesta exitosa: devolvemos solo data para simplificar los services.
  if (isApiSuccess(body)) {
    return body.data;
  }

  throw new Error("No pudimos interpretar la respuesta del servidor.");
}

function isFormData(body: BodyInit) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function parseJson<T>(rawBody: string): T | null {
  // Si el backend no mando body, no intentamos parsear.
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}

function getErrorMessage(body: unknown, status: number) {
  const message = readErrorMessage(body);

  if (status === 401 && message?.toLowerCase().includes("credenciales")) {
    return "Correo o contraseña incorrectos.";
  }

  return message ?? "No pudimos completar la solicitud.";
}

function readErrorMessage(body: unknown) {
  // Solo podemos leer mensajes si el body tiene forma de error de nuestra API.
  if (!isApiFailure(body)) {
    return null;
  }

  return readApiErrorMessage(body);
}

function isApiSuccess<T>(body: unknown): body is ApiSuccess<T> {
  // Type guard: confirma que el body tiene forma de respuesta exitosa.
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    body.success === true &&
    "data" in body
  );
}

function isApiFailure(body: unknown): body is ApiFailure {
  // Type guard: confirma que el body tiene forma de error de API.
  if (
    typeof body !== "object" ||
    body === null ||
    !("success" in body) ||
    body.success !== false ||
    !("error" in body) ||
    typeof body.error !== "object" ||
    body.error === null ||
    !("message" in body.error)
  ) {
    return false;
  }

  return typeof body.error.message === "string";
}

function readApiErrorMessage(body: ApiFailure) {
  const message = body.error.message.trim();

  // Evita mostrar mensajes vacios o poco utiles al usuario.
  if (
    !message ||
    message === "{}" ||
    message === "[]" ||
    message === "[object Object]"
  ) {
    return "No pudimos completar la solicitud. Revisá los datos e intentá nuevamente.";
  }

  return message;
}
