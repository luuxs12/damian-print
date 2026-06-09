import type { FastifyInstance } from "fastify";
import { salesController } from "./sales.controller";
import { requirePermission } from "../../middlewares/authenticate";

const handleError = (error: unknown, reply: any, fallback = "Error inesperado") => {
  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({ message });
};

export async function salesRoutes(app: FastifyInstance) {

  /* GET /sales/stats */
  app.get(
    "/stats",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.getStats(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* GET /sales */
  app.get(
    "/",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.getAll(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* GET /sales/:id */
  app.get(
    "/:id",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.getById(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* POST /sales */
  app.post(
    "/",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.create(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* PUT /sales/:id */
  app.put(
    "/:id",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.update(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* DELETE /sales/:id */
  app.delete(
    "/:id",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.delete(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* POST /sales/:id/send-email */
  app.post(
    "/:id/send-email",
    { preHandler: requirePermission("Ventas") },
    async (request, reply) => {
      try { await salesController.sendEmail(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );
}
