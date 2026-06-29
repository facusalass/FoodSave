import { API_BASE_URL } from "../config/api";

type RequestOptions = RequestInit & {
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
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error(
      "No pudimos conectar con el servidor. Verificá que el backend esté encendido y que tu celular esté en la misma WiFi que la PC."
    );
  }

  const rawBody = await response.text();
  const body = parseJson<ApiResponse<T>>(rawBody);

  if (!response.ok) {
    const message = getErrorMessage(body, response.status);

    throw new Error(message);
  }

  if (isApiFailure(body)) {
    throw new Error(readApiErrorMessage(body));
  }

  if (isApiSuccess(body)) {
    return body.data;
  }

  throw new Error("No pudimos interpretar la respuesta del servidor.");
}

function parseJson<T>(rawBody: string): T | null {
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
  if (!isApiFailure(body)) {
    return null;
  }

  return readApiErrorMessage(body);
}

function isApiSuccess<T>(body: unknown): body is ApiSuccess<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    body.success === true &&
    "data" in body
  );
}

function isApiFailure(body: unknown): body is ApiFailure {
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
