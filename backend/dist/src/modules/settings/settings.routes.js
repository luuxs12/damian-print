import { SettingsController } from "./settings.controller";
import { requirePermission } from "../../middlewares/authenticate";
const handleError = (error, reply, fallback = "Error inesperado") => {
    const message = error instanceof Error ? error.message : fallback;
    return reply.status(400).send({ message });
};
export async function settingsRoutes(app) {
    /* GET /settings */
    app.get("/", { preHandler: requirePermission("Configuración") }, async (request, reply) => {
        try {
            await SettingsController.get(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al obtener configuración");
        }
    });
    /* PUT /settings */
    app.put("/", { preHandler: requirePermission("Configuración") }, async (request, reply) => {
        try {
            await SettingsController.update(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al actualizar configuración");
        }
    });
    /* POST /settings/upload */
    app.post("/upload", { preHandler: requirePermission("Configuración") }, async (request, reply) => {
        try {
            await SettingsController.uploadFile(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al subir archivo");
        }
    });
    /* GET /settings/backup */
    app.get("/backup", { preHandler: requirePermission("Configuración") }, async (request, reply) => {
        try {
            await SettingsController.downloadBackup(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al descargar copia de seguridad");
        }
    });
    /* POST /settings/restore */
    app.post("/restore", { preHandler: requirePermission("Configuración") }, async (request, reply) => {
        try {
            await SettingsController.restoreBackup(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al restaurar copia de seguridad");
        }
    });
    /* POST /settings/reset */
    app.post("/reset", { preHandler: requirePermission("Configuración") }, async (request, reply) => {
        try {
            await SettingsController.reset(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al restablecer base de datos");
        }
    });
}
