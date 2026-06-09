import { getCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus, } from "./categories.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";
export const CategoryController = {
    async getAll(request, reply) {
        const data = await getCategories();
        return reply.send(data);
    },
    async create(request, reply) {
        const body = request.body;
        if (!body || typeof body !== "object") {
            return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
        }
        const category = await createCategory(body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Categorías",
                action: "CREAR",
                details: { id: category.id, name: category.name, status: category.status }
            }).catch(err => request.log.error(err));
        }
        return reply.status(201).send(category);
    },
    async update(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de categoría inválido." });
        }
        const body = request.body;
        if (!body || typeof body !== "object") {
            return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
        }
        const category = await updateCategory(numId, body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Categorías",
                action: "EDITAR",
                details: { id: category.id, name: category.name, status: category.status }
            }).catch(err => request.log.error(err));
        }
        return reply.send(category);
    },
    async toggleStatus(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de categoría inválido." });
        }
        const category = await toggleCategoryStatus(numId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Categorías",
                action: "EDITAR",
                details: { id: category.id, name: category.name, status: category.status, notes: "Toggle de estado" }
            }).catch(err => request.log.error(err));
        }
        return reply.send(category);
    },
    async delete(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de categoría inválido." });
        }
        const category = await deleteCategory(numId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Categorías",
                action: "ELIMINAR",
                details: { id: category.id, name: category.name }
            }).catch(err => request.log.error(err));
        }
        return reply.send({ success: true });
    }
};
