import { findUserById, updateClientProfileById } from "./repository.js";
import { toPublicUser } from "../utils/publicUser.js";
export async function getClientProfile(userId) {
    const user = await findUserById(userId);
    if (!user || user.role !== "client") {
        return null;
    }
    return toClientProfile(toPublicUser(user));
}
export async function updateClientProfile(userId, input) {
    const updated = await updateClientProfileById(userId, input);
    if (!updated) {
        return null;
    }
    return toClientProfile(toPublicUser(updated));
}
function toClientProfile(user) {
    return {
        address: user.address ?? "",
        city: user.city ?? "",
        email: user.email,
        id: user.id,
        name: user.name,
        phone: user.phone ?? ""
    };
}
