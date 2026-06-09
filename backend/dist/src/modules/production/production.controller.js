import { productionService } from "./production.service";
export const productionController = {
    getProductionOrders: async (request, reply) => {
        try {
            const orders = await productionService.getProductionOrders();
            return reply.send(orders);
        }
        catch (err) {
            return reply.status(500).send({ message: err.message || "Error al obtener órdenes de producción" });
        }
    },
    createProductionOrder: async (request, reply) => {
        try {
            const body = request.body;
            const newOrder = await productionService.createProductionOrder(body);
            return reply.status(201).send(newOrder);
        }
        catch (err) {
            return reply.status(400).send({ message: err.message || "Error al crear orden de producción" });
        }
    },
    updateProductionOrder: async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const updated = await productionService.updateProductionOrder(Number(id), body);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ message: err.message || "Error al actualizar orden de producción" });
        }
    },
    deleteProductionOrder: async (request, reply) => {
        try {
            const { id } = request.params;
            const deleted = await productionService.deleteProductionOrder(Number(id));
            return reply.send({ message: "Orden de producción eliminada con éxito", deleted });
        }
        catch (err) {
            return reply.status(400).send({ message: err.message || "Error al eliminar orden de producción" });
        }
    },
};
