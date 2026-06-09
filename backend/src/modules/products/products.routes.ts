import type { FastifyInstance } from "fastify";
import { ProductController } from "./products.controller";
import { requirePermission } from "../../middlewares/authenticate";

const handleError = (error: unknown, reply: any, fallback = "Error inesperado") => {
  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({ message });
};

export async function productsRoutes(app: FastifyInstance) {

  /* GET /products */
  app.get(
    "/",
    { preHandler: requirePermission("Productos") },
    async (request, reply) => {
      try {
        await ProductController.getAll(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al obtener productos");
      }
    }
  );

  /* GET /products/:id */
  app.get(
    "/:id",
    { preHandler: requirePermission("Productos") },
    async (request, reply) => {
      try {
        await ProductController.getById(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al obtener el producto");
      }
    }
  );

  /* POST /products */
  app.post(
    "/",
    { preHandler: requirePermission("Productos") },
    async (request, reply) => {
      try {
        await ProductController.create(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al crear el producto");
      }
    }
  );

  /* PUT /products/:id */
  app.put(
    "/:id",
    { preHandler: requirePermission("Productos") },
    async (request, reply) => {
      try {
        await ProductController.update(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al actualizar el producto");
      }
    }
  );

  /* DELETE /products/:id */
  app.delete(
    "/:id",
    { preHandler: requirePermission("Productos") },
    async (request, reply) => {
      try {
        await ProductController.delete(request, reply);
      } catch (error) {
        return handleError(error, reply, "Error al eliminar el producto");
      }
    }
  );
}
