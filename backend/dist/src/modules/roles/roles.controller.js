import { getRoles, createRole, updateRole, deleteRole } from "./roles.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";
export const RoleController = {
    async getAll(request, reply) {
        const data = await getRoles();
        return reply.send(data);
    },
    async create(request, reply) {
        const body = request.body;
        if (!body?.name?.trim()) {
            return reply.status(400).send({ message: "El nombre del rol es obligatorio." });
        }
        const role = await createRole(body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Roles",
                action: "CREAR",
                details: { id: role.id, name: role.name, description: role.description, permissions: role.permissions }
            }).catch(err => request.log.error(err));
        }
        return reply.status(201).send(role);
    },
    async update(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de rol inválido." });
        }
        const body = request.body;
        const role = await updateRole(numId, body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Roles",
                action: "EDITAR",
                details: { id: role.id, name: role.name, description: role.description, permissions: role.permissions }
            }).catch(err => request.log.error(err));
        }
        return reply.send(role);
    },
    async delete(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de rol inválido." });
        }
        const role = await deleteRole(numId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Roles",
                action: "ELIMINAR",
                details: { id: role.id, name: role.roleName }
            }).catch(err => request.log.error(err));
        }
        return reply.send({ success: true });
    }
};
