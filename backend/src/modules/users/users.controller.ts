import type { FastifyReply, FastifyRequest } from "fastify";
import { getUsers, createUser, updateUser, deleteUser } from "./users.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";

export const UserController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const data = await getUsers();
    return reply.send(data);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
    }
    const user = await createUser(body);
    
    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Usuarios",
        action: "CREAR",
        details: { id: user.id, username: user.username, email: user.email, role: user.role }
      }).catch(err => request.log.error(err));
    }

    return reply.status(201).send(user);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);
    const reqUser = (request as any).user;

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de usuario inválido." });
    }

    const body = request.body as any;

    if (reqUser?.id === numId && body?.status === "INACTIVE") {
      return reply.status(400).send({ message: "No puedes desactivar tu propia cuenta." });
    }

    const user = await updateUser(numId, body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Usuarios",
        action: "EDITAR",
        details: { id: user.id, username: user.username, email: user.email, role: user.role }
      }).catch(err => request.log.error(err));
    }

    return reply.send(user);
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id }  = request.params as { id: string };
    const numId   = Number(id);
    const reqUser = (request as any).user;

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de usuario inválido." });
    }

    if (reqUser?.id === numId) {
      return reply.status(400).send({ message: "No puedes eliminar tu propia cuenta." });
    }

    const deleted = await deleteUser(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Usuarios",
        action: "ELIMINAR",
        details: { id: deleted.id, username: deleted.username }
      }).catch(err => request.log.error(err));
    }

    return reply.send({ success: true });
  }
};
