import type { FastifyRequest, FastifyReply } from "fastify";
import { productionService } from "./production.service";
import type { CreateProductionOrderDTO, UpdateProductionOrderDTO } from "./production.types";

export const productionController = {
  getProductionOrders: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orders = await productionService.getProductionOrders();
      return reply.send(orders);
    } catch (err: any) {
      return reply.status(500).send({ message: err.message || "Error al obtener órdenes de producción" });
    }
  },

  createProductionOrder: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as CreateProductionOrderDTO;
      const newOrder = await productionService.createProductionOrder(body);
      return reply.status(201).send(newOrder);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al crear orden de producción" });
    }
  },

  updateProductionOrder: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateProductionOrderDTO;
      const updated = await productionService.updateProductionOrder(Number(id), body);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al actualizar orden de producción" });
    }
  },

  deleteProductionOrder: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const deleted = await productionService.deleteProductionOrder(Number(id));
      return reply.send({ message: "Orden de producción eliminada con éxito", deleted });
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al eliminar orden de producción" });
    }
  },
};
