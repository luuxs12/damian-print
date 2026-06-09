import type { FastifyInstance } from "fastify";
import { dashboardController } from "./dashboard.controller";

const handleError = (error: unknown, reply: any, fallback = "Error inesperado") => {
  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({ message });
};

export async function dashboardRoutes(app: FastifyInstance) {
  /* GET /dashboard/stats */
  app.get(
    "/stats",
    async (request, reply) => {
      try {
        await dashboardController.getStats(request, reply);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
