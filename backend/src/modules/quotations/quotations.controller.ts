import type { FastifyRequest, FastifyReply } from "fastify";
import { quotationsService } from "./quotations.service";
import type { CreateQuotationDTO, UpdateQuotationDTO } from "./quotations.types";
import { auditLogsService } from "../audit-logs/audit-logs.service";

export const quotationsController = {

  getAll: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await quotationsService.getAll();
      return reply.send(data);
    } catch (err: any) {
      return reply.status(500).send({ message: err.message || "Error al obtener cotizaciones." });
    }
  },

  getStats: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await quotationsService.getStats();
      return reply.send(stats);
    } catch (err: any) {
      return reply.status(500).send({ message: err.message || "Error al obtener estadísticas." });
    }
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const data = await quotationsService.getById(Number(id));
      return reply.send(data);
    } catch (err: any) {
      return reply.status(404).send({ message: err.message || "Cotización no encontrada." });
    }
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as CreateQuotationDTO;
      const created = await quotationsService.create(body);

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Cotizaciones",
          action:   "CREAR",
          details:  { notes: `Cotización ${created.quotationNumber} creada para ${created.clientName}` },
        }).catch(console.error);
      }

      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al crear cotización." });
    }
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateQuotationDTO;
      const updated = await quotationsService.update(Number(id), body);

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Cotizaciones",
          action:   "EDITAR",
          details:  { notes: `Cotización ${updated.quotationNumber} actualizada` },
        }).catch(console.error);
      }

      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al actualizar cotización." });
    }
  },

  updateStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };
      const updated = await quotationsService.updateStatus(Number(id), status);

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Cotizaciones",
          action:   "EDITAR",
          details:  { notes: `Estado de cotización ${updated.quotationNumber} cambiado a ${status}` },
        }).catch(console.error);
      }

      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al cambiar estado." });
    }
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const deleted = await quotationsService.delete(Number(id));

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Cotizaciones",
          action:   "ELIMINAR",
          details:  { notes: `Cotización ${deleted.quotationNumber} eliminada` },
        }).catch(console.error);
      }

      return reply.send({ message: "Cotización eliminada con éxito.", deleted });
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al eliminar cotización." });
    }
  },
};
