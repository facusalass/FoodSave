export function notFoundHandler(request, response) {
    response.status(404).json({ "success": false, error: {
            message: `Ruta no encontrada: ${request.method} ${request.originalUrl}`
        } });
}
export function errorHandler(error, _request, response, _next) {
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    response.status(500).json({ "success": false, error: { message } });
}
