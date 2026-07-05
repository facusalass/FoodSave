import type { Request, Response } from "express";
import {
  getClientProfile,
  updateClientProfile,
  type ClientProfileInput
} from "../services/clientProfileService.js";

const SENSITIVE_FIELDS = ["id", "email", "role", "password", "businessId"];

export async function getClientProfileController(
  request: Request,
  response: Response
) {
  const user = await getClientProfile(request.user!.id);

  if (!user) {
    fail(response, 404, "Perfil de cliente no encontrado.");
    return;
  }

  response.json({ success: true, data: { user } });
}

export async function updateClientProfileController(
  request: Request,
  response: Response
) {
  const body = request.body as Record<string, unknown>;
  const blockedField = SENSITIVE_FIELDS.find((field) => field in body);

  if (blockedField) {
    fail(response, 400, `No se puede actualizar el campo ${blockedField}.`);
    return;
  }

  const name = normalizeOptionalString(body.name);
  const phone = normalizeOptionalString(body.phone);
  const city = normalizeOptionalString(body.city);
  const address = normalizeOptionalString(body.address);

  if (!name) {
    fail(response, 400, "El nombre y apellido son requeridos.");
    return;
  }

  if (phone && !isReasonablePhone(phone)) {
    fail(response, 400, "Ingresa un telefono valido.");
    return;
  }

  const payload: ClientProfileInput = {
    address,
    city,
    name,
    phone
  };
  const user = await updateClientProfile(request.user!.id, payload);

  if (!user) {
    fail(response, 404, "Perfil de cliente no encontrado.");
    return;
  }

  response.json({ success: true, data: { user } });
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isReasonablePhone(value: string) {
  return /^[+()\d\s-]{6,30}$/.test(value);
}

function fail(response: Response, status: number, message: string) {
  response.status(status).json({ success: false, error: { message } });
}
