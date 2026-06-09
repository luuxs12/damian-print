import type { FastifyReply, FastifyRequest } from "fastify";
import { auditLogsService } from "./audit-logs.service";

export const AuditLogsController = {
  async getLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const logs = await auditLogsService.getLogs();
      return reply.send(logs);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Error al obtener la auditoría del sistema." });
    }
  },

  async getDetails(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const numId = Number(id);
      if (!Number.isInteger(numId) || numId <= 0) {
        return reply.status(400).send({ message: "ID de auditoría inválido." });
      }

      const details = await auditLogsService.getLogDetails(numId);
      return reply.send(details);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Error al obtener el detalle de auditoría." });
    }
  }
};
