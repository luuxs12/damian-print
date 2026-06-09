import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  toggleSupplyStatus,
} from "./supplies.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";

export const SupplyController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const data = await getSupplies();
    return reply.send(data);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
    }
    const supply = await createSupply(body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Insumos",
        action: "CREAR",
        details: { id: supply.id, code: supply.code, name: supply.name, status: supply.status }
      }).catch(err => request.log.error(err));
    }

    return reply.status(201).send(supply);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de insumo inválido." });
    }

    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
    }

    const supply = await updateSupply(numId, body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Insumos",
        action: "EDITAR",
        details: { id: supply.id, code: supply.code, name: supply.name, status: supply.status }
      }).catch(err => request.log.error(err));
    }

    return reply.send(supply);
  },

  async toggleStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de insumo inválido." });
    }

    const supply = await toggleSupplyStatus(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Insumos",
        action: "EDITAR",
        details: { id: supply.id, code: supply.code, name: supply.name, status: supply.status, notes: "Toggle de estado" }
      }).catch(err => request.log.error(err));
    }

    return reply.send(supply);
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const numId  = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) {
      return reply.status(400).send({ message: "ID de insumo inválido." });
    }

    const supply = await deleteSupply(numId);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Insumos",
        action: "ELIMINAR",
        details: { id: supply.id, code: supply.code, name: supply.name }
      }).catch(err => request.log.error(err));
    }

    return reply.send({ success: true });
  }
};
