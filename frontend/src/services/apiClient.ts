import { API_BASE_URL } from "../config/api";

type RequestOptions = RequestInit & {
  token?: string;
};

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
  const body = parseJson(rawBody);

  if (!response.ok) {
    const message = getErrorMessage(body, response.status);

    throw new Error(message);
  }

  return body as T;
}

function parseJson(rawBody: string) {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { message: rawBody };
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
  if (typeof body !== "object" || body === null) {
    return null;
  }

  if (
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  if (
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }

  return null;
}
