import type { FastifyInstance } from "fastify";
import { quotationsController } from "./quotations.controller";
import { requirePermission } from "../../middlewares/authenticate";

const handleError = (error: unknown, reply: any, fallback = "Error inesperado") => {
  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({ message });
};

export async function quotationsRoutes(app: FastifyInstance) {

  /* GET /quotations/stats */
  app.get(
    "/stats",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.getStats(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* GET /quotations */
  app.get(
    "/",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.getAll(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* GET /quotations/:id */
  app.get(
    "/:id",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.getById(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* POST /quotations */
  app.post(
    "/",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.create(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* PUT /quotations/:id */
  app.put(
    "/:id",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.update(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* PATCH /quotations/:id/status */
  app.patch(
    "/:id/status",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.updateStatus(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* DELETE /quotations/:id */
  app.delete(
    "/:id",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.delete(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );

  /* POST /quotations/:id/send-email */
  app.post(
    "/:id/send-email",
    { preHandler: requirePermission("Cotizaciones") },
    async (request, reply) => {
      try { await quotationsController.sendEmail(request, reply); }
      catch (error) { return handleError(error, reply); }
    }
  );
}
