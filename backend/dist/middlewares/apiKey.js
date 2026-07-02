import { env } from "../config/env.js";
export function requireApiKey(request, response, next) {
    const key = request.header("X-API-Key");
    if (!key || key !== env.apiKey) {
        response.status(401).json({
            success: false,
            error: { message: "No estas autorizado." }
        });
        return;
    }
    next();
}
