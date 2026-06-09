import { auditLogsService } from "./audit-logs.service";
export const AuditLogsController = {
    async getLogs(request, reply) {
        try {
            const logs = await auditLogsService.getLogs();
            return reply.send(logs);
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Error al obtener la auditoría del sistema." });
        }
    },
    async getDetails(request, reply) {
        try {
            const { id } = request.params;
            const numId = Number(id);
            if (!Number.isInteger(numId) || numId <= 0) {
                return reply.status(400).send({ message: "ID de auditoría inválido." });
            }
            const details = await auditLogsService.getLogDetails(numId);
            return reply.send(details);
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Error al obtener el detalle de auditoría." });
        }
    }
};
