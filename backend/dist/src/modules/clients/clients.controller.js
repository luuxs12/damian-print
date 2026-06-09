import { getClients, getClientById, searchClients, createClient, updateClient, toggleClientStatus, deleteClient, getClientsStats, } from "./clients.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";
export const ClientController = {
    async getAll(_request, reply) {
        const data = await getClients();
        return reply.send(data);
    },
    async getStats(_request, reply) {
        const data = await getClientsStats();
        return reply.send(data);
    },
    async getById(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0)
            return reply.status(400).send({ message: "ID de cliente inválido." });
        const data = await getClientById(numId);
        return reply.send(data);
    },
    async search(request, reply) {
        const { q } = request.query;
        if (!q || q.trim().length < 2)
            return reply.status(400).send({ message: "El término de búsqueda debe tener al menos 2 caracteres." });
        const data = await searchClients(q.trim());
        return reply.send(data);
    },
    async create(request, reply) {
        const body = request.body;
        if (!body || typeof body !== "object")
            return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
        const client = await createClient(body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Clientes",
                action: "CREAR",
                details: { id: client.id, name: client.name, document: client.document },
            }).catch((err) => request.log.error(err));
        }
        return reply.status(201).send(client);
    },
    async update(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0)
            return reply.status(400).send({ message: "ID de cliente inválido." });
        const body = request.body;
        if (!body || typeof body !== "object")
            return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
        const client = await updateClient(numId, body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Clientes",
                action: "EDITAR",
                details: { id: client.id, name: client.name },
            }).catch((err) => request.log.error(err));
        }
        return reply.send(client);
    },
    async toggleStatus(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0)
            return reply.status(400).send({ message: "ID de cliente inválido." });
        const client = await toggleClientStatus(numId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Clientes",
                action: client.status === "ACTIVE" ? "ACTIVAR" : "DESACTIVAR",
                details: { id: client.id, name: client.name, status: client.status },
            }).catch((err) => request.log.error(err));
        }
        return reply.send(client);
    },
    async delete(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0)
            return reply.status(400).send({ message: "ID de cliente inválido." });
        const client = await deleteClient(numId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Clientes",
                action: "ELIMINAR",
                details: { id: client.id, name: client.name },
            }).catch((err) => request.log.error(err));
        }
        return reply.send({ success: true });
    },
};
