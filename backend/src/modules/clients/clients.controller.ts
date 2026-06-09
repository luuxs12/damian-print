import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getClients,
  getClientById,
  searchClients,
  createClient,
  updateClient,
  toggleClientStatus,
  deleteClient,
  getClientsStats,
} from "./clients.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";

export const ClientController = {

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    const data = await getClients();
    return reply.send(data);
  },

  async getStats(_request: FastifyRequest, reply: FastifyReply) {
    const data = await getClientsStats();
    return reply.send(data);
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0)
      return reply.status(400).send({ message: "ID de cliente inválido." });

    const data = await getClientById(numId);
    return reply.send(data);
  },

  async search(request: FastifyRequest, reply: FastifyReply) {
    const { q } = request.query as { q?: string };
    if (!q || q.trim().length < 2)
      return reply.status(400).send({ message: "El término de búsqueda debe tener al menos 2 caracteres." });

    const data = await searchClients(q.trim());
    return reply.send(data);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body || typeof body !== "object")
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });

    const client = await createClient(body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId:   currentUser.id,
        username: currentUser.username,
        module:   "Clientes",
        action:   "CREAR",
        details:  { id: client.id, name: client.name, document: client.document },
      }).catch((err: unknown) => request.log.error(err));
    }

    return reply.status(201).send(client);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0)
      return reply.status(400).send({ message: "ID de cliente inválido." });

    const body = request.body as any;
    if (!body || typeof body !== "object")
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });

    const client = await updateClient(numId, body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId:   currentUser.id,
        username: currentUser.username,
        module:   "Clientes",
        action:   "EDITAR",
        details:  { id: client.id, name: client.name },
      }).catch((err: unknown) => request.log.error(err));
    }

    return reply.send(client);
  },

  async toggleStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0)
      return reply.status(400).send({ message: "ID de cliente inválido." });

    const client = await toggleClientStatus(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId:   currentUser.id,
        username: currentUser.username,
        module:   "Clientes",
        action:   client.status === "ACTIVE" ? "ACTIVAR" : "DESACTIVAR",
        details:  { id: client.id, name: client.name, status: client.status },
      }).catch((err: unknown) => request.log.error(err));
    }

    return reply.send(client);
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0)
      return reply.status(400).send({ message: "ID de cliente inválido." });

    const client = await deleteClient(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId:   currentUser.id,
        username: currentUser.username,
        module:   "Clientes",
        action:   "ELIMINAR",
        details:  { id: client.id, name: client.name },
      }).catch((err: unknown) => request.log.error(err));
    }

    return reply.send({ success: true });
  },
};
