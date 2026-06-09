import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, } from "./products.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";
export const ProductController = {
    async getAll(request, reply) {
        const data = await getProducts();
        return reply.send(data);
    },
    async getById(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de producto inválido." });
        }
        const data = await getProductById(numId);
        return reply.send(data);
    },
    async create(request, reply) {
        const body = request.body;
        if (!body || typeof body !== "object") {
            return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
        }
        const userId = request.user.id;
        const product = await createProduct(body, userId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Productos",
                action: "CREAR",
                details: { id: product.id, name: product.name, code: product.code }
            }).catch(err => request.log.error(err));
        }
        return reply.status(201).send(product);
    },
    async update(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de producto inválido." });
        }
        const body = request.body;
        if (!body || typeof body !== "object") {
            return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
        }
        const product = await updateProduct(numId, body);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Productos",
                action: "EDITAR",
                details: { id: product.id, name: product.name, code: product.code }
            }).catch(err => request.log.error(err));
        }
        return reply.send(product);
    },
    async delete(request, reply) {
        const { id } = request.params;
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId <= 0) {
            return reply.status(400).send({ message: "ID de producto inválido." });
        }
        const product = await deleteProduct(numId);
        const currentUser = request.currentUser;
        if (currentUser) {
            auditLogsService.createLog({
                userId: currentUser.id,
                username: currentUser.username,
                module: "Productos",
                action: "ELIMINAR",
                details: { id: product.id, name: product.name }
            }).catch(err => request.log.error(err));
        }
        return reply.send({ success: true });
    }
};
