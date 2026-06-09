import type { FastifyInstance } from "fastify";
import { SupplyController } from "./supplies.controller";
import { requirePermission } from "../../middlewares/authenticate";

const handleError = (error: unknown, reply: any, fallback = "Error inesperado") => {
  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({ message });
};

export async function suppliesRoutes(app: FastifyInstance) {

  /* GET /supplies */
  app.get(
    "/",
    { preHandler: requirePermission("Insumos") },
    async (request, reply) => {
      try {
        await SupplyController.getAll(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al obtener insumos");
      }
    }
  );

  /* POST /supplies */
  app.post(
    "/",
    { preHandler: requirePermission("Insumos") },
    async (request, reply) => {
      try {
        await SupplyController.create(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al crear insumo");
      }
    }
  );

  /* PUT /supplies/:id */
  app.put(
    "/:id",
    { preHandler: requirePermission("Insumos") },
    async (request, reply) => {
      try {
        await SupplyController.update(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al actualizar insumo");
      }
    }
  );

  /* PATCH /supplies/:id/toggle */
  app.patch(
    "/:id/toggle",
    { preHandler: requirePermission("Insumos") },
    async (request, reply) => {
      try {
        await SupplyController.toggleStatus(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al cambiar estado del insumo");
      }
    }
  );

  /* DELETE /supplies/:id */
  app.delete(
    "/:id",
    { preHandler: requirePermission("Insumos") },
    async (request, reply) => {
      try {
        await SupplyController.delete(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al eliminar insumo");
      }
    }
  );
}
