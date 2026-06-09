import { desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { auditLogs } from "../../db/schema/audit-logs";
/**
 * Formats metadata details into a human-readable spanish description on the backend.
 */
export const formatLogDescription = (log) => {
    const action = log.action.toUpperCase();
    const mod = log.module.toLowerCase();
    if (!log.details) {
        return `Acción ${log.action} realizada en el módulo ${log.module}`;
    }
    const name = log.details.name || "";
    const username = log.details.username || "";
    const statusStr = log.details.status === "ACTIVE" ? "Activo" : log.details.status === "INACTIVE" ? "Inactivo" : "";
    if (action === "CREAR") {
        if (mod.includes("categor"))
            return `Se creó la categoría "${name}"`;
        if (mod.includes("product"))
            return `Se creó el producto "${name}"`;
        if (mod.includes("presenta")) {
            const priceVal = log.details.price != null ? ` con precio de venta S/ ${Number(log.details.price).toFixed(2)}` : "";
            return `Se creó la presentación "${name}"${priceVal}`;
        }
        if (mod.includes("usuario"))
            return `Se creó el usuario "${username}"`;
        if (mod.includes("rol"))
            return `Se creó el perfil de rol "${name}"`;
        return `Se creó un registro en el módulo ${log.module}`;
    }
    if (action === "EDITAR" || action === "ACTUALIZAR") {
        const isToggle = log.details.notes === "Toggle de estado" || (log.details.status !== undefined && Object.keys(log.details).length <= 3);
        if (isToggle) {
            const entityName = name || username || "";
            const entityStr = entityName ? ` "${entityName}"` : "";
            return `Se cambió el estado de ${entityStr} a ${statusStr}`;
        }
        if (mod.includes("categor"))
            return `Se modificaron los datos de la categoría "${name}"`;
        if (mod.includes("product"))
            return `Se modificaron los datos del producto "${name}"`;
        if (mod.includes("presenta"))
            return `Se modificaron los datos de la presentación "${name}"`;
        if (mod.includes("usuario"))
            return `Se modificaron los datos del usuario "${username}"`;
        if (mod.includes("rol"))
            return `Se modificaron los datos del perfil de rol "${name}"`;
        return `Se actualizaron los datos en el módulo ${log.module}`;
    }
    if (action === "ELIMINAR") {
        if (mod.includes("categor"))
            return `Se eliminó la categoría "${name || 'N/A'}"`;
        if (mod.includes("product"))
            return `Se eliminó el producto "${name || 'N/A'}"`;
        if (mod.includes("presenta"))
            return `Se eliminó la presentación "${name || 'N/A'}"`;
        if (mod.includes("usuario"))
            return `Se eliminó el usuario "${username || 'N/A'}"`;
        if (mod.includes("rol"))
            return `Se eliminó el perfil de rol "${name || 'N/A'}"`;
        return `Se eliminó un registro del módulo ${log.module}`;
    }
    if (action === "SOLICITAR_RECUPERACION") {
        const res = log.details?.result === "EXITO" ? "exitosamente" : "fallidamente";
        return `Se solicitó un código de recuperación ${res} para el correo "${log.details?.email || 'N/A'}"`;
    }
    if (action === "VERIFICAR_CODIGO") {
        const res = log.details?.result === "EXITO" ? "correctamente" : "incorrectamente";
        return `Se intentó verificar el código de recuperación ${res} para el correo "${log.details?.email || 'N/A'}"`;
    }
    if (action === "RESTABLECER_CONTRASENA") {
        const res = log.details?.result === "EXITO" ? "con éxito" : "sin éxito";
        return `Se restableció ${res} la contraseña para el correo "${log.details?.email || 'N/A'}"`;
    }
    return `Acción ${log.action} realizada en el módulo ${log.module}`;
};
export const auditLogsService = {
    async createLog(data) {
        const [inserted] = await db
            .insert(auditLogs)
            .values({
            userId: data.userId ?? null,
            username: data.username,
            module: data.module,
            action: data.action,
            details: data.details ?? null,
        })
            .returning();
        return inserted;
    },
    async getLogs() {
        const logs = await db
            .select({
            id: auditLogs.id,
            userId: auditLogs.userId,
            username: auditLogs.username,
            module: auditLogs.module,
            action: auditLogs.action,
            details: auditLogs.details, // loaded to generate description
            createdAt: auditLogs.createdAt,
        })
            .from(auditLogs)
            .orderBy(desc(auditLogs.createdAt));
        return logs.map(log => {
            const { details, ...rest } = log;
            return {
                ...rest,
                description: formatLogDescription(log)
            };
        });
    },
    async getLogDetails(id) {
        const [log] = await db
            .select({
            details: auditLogs.details
        })
            .from(auditLogs)
            .where(eq(auditLogs.id, id));
        return log?.details || null;
    }
};
