import type { FastifyInstance } from "fastify";
import { ClientController }    from "./clients.controller";
import { requirePermission }   from "../../middlewares/authenticate";

const handleError = (error: unknown, reply: any, fallback = "Error inesperado") => {
  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({ message });
};

export async function clientsRoutes(app: FastifyInstance) {

  /* GET /clients/stats */
  app.get(
    "/stats",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.getStats(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al obtener estadísticas de clientes.");
      }
    }
  );

  /* GET /clients/search?q= */
  app.get(
    "/search",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.search(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error en la búsqueda de clientes.");
      }
    }
  );

  /* GET /clients */
  app.get(
    "/",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.getAll(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al obtener los clientes.");
      }
    }
  );

  /* GET /clients/:id */
  app.get(
    "/:id",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.getById(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al obtener el cliente.");
      }
    }
  );

  /* POST /clients */
  app.post(
    "/",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.create(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al crear el cliente.");
      }
    }
  );

  /* PUT /clients/:id */
  app.put(
    "/:id",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.update(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al actualizar el cliente.");
      }
    }
  );

  /* PATCH /clients/:id/toggle-status */
  app.patch(
    "/:id/toggle-status",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.toggleStatus(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al cambiar el estado del cliente.");
      }
    }
  );

  /* DELETE /clients/:id */
  app.delete(
    "/:id",
    { preHandler: requirePermission("Clientes") },
    async (request, reply) => {
      try {
        await ClientController.delete(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al eliminar el cliente.");
      }
    }
  );
}
