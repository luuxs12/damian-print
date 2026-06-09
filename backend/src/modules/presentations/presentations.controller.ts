import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getPresentations,
  createPresentation,
  updatePresentation,
  deletePresentation,
  togglePresentationStatus,
} from "./presentations.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";

export const PresentationController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const data = await getPresentations();
    return reply.send(data);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
    }
    const presentation = await createPresentation(body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Presentaciones",
        action: "CREAR",
        details: { id: presentation.id, name: presentation.name, price: presentation.price }
      }).catch(err => request.log.error(err));
    }

    return reply.status(201).send(presentation);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de presentación inválido." });
    }

    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
    }

    const presentation = await updatePresentation(numId, body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Presentaciones",
        action: "EDITAR",
        details: { id: presentation.id, name: presentation.name, price: presentation.price }
      }).catch(err => request.log.error(err));
    }

    return reply.send(presentation);
  },

  async toggleStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de presentación inválido." });
    }

    const presentation = await togglePresentationStatus(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Presentaciones",
        action: "EDITAR",
        details: { id: presentation.id, name: presentation.name, status: presentation.status, notes: "Toggle de estado" }
      }).catch(err => request.log.error(err));
    }

    return reply.send(presentation);
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de presentación inválido." });
    }

    const presentation = await deletePresentation(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Presentaciones",
        action: "ELIMINAR",
        details: { id: presentation.id, name: presentation.name }
      }).catch(err => request.log.error(err));
    }

    return reply.send({ success: true });
  }
};
