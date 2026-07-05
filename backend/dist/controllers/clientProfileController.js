import { getClientProfile, updateClientProfile } from "../services/clientProfileService.js";
const SENSITIVE_FIELDS = ["id", "email", "role", "password", "businessId"];
export async function getClientProfileController(request, response) {
    const user = await getClientProfile(request.user.id);
    if (!user) {
        fail(response, 404, "Perfil de cliente no encontrado.");
        return;
    }
    response.json({ success: true, data: { user } });
}
export async function updateClientProfileController(request, response) {
    const body = request.body;
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
    const payload = {
        address,
        city,
        name,
        phone
    };
    const user = await updateClientProfile(request.user.id, payload);
    if (!user) {
        fail(response, 404, "Perfil de cliente no encontrado.");
        return;
    }
    response.json({ success: true, data: { user } });
}
function normalizeOptionalString(value) {
    return typeof value === "string" ? value.trim() : "";
}
function isReasonablePhone(value) {
    return /^[+()\d\s-]{6,30}$/.test(value);
}
function fail(response, status, message) {
    response.status(status).json({ success: false, error: { message } });
}
