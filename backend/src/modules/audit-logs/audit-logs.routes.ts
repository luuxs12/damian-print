import type { FastifyInstance } from "fastify";
import { AuditLogsController } from "./audit-logs.controller";
import { requirePermission } from "../../middlewares/authenticate";

export const auditLogsRoutes = async (app: FastifyInstance) => {
  app.get(
    "/", 
    { preHandler: requirePermission("Configuración") }, 
    AuditLogsController.getLogs
  );
  
  app.get(
    "/:id/details", 
    { preHandler: requirePermission("Configuración") }, 
    AuditLogsController.getDetails
  );
};
