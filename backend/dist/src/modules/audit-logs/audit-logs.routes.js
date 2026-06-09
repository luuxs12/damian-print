import { AuditLogsController } from "./audit-logs.controller";
import { requirePermission } from "../../middlewares/authenticate";
export const auditLogsRoutes = async (app) => {
    app.get("/", { preHandler: requirePermission("Configuración") }, AuditLogsController.getLogs);
    app.get("/:id/details", { preHandler: requirePermission("Configuración") }, AuditLogsController.getDetails);
};
