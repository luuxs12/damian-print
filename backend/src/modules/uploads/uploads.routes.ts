import type { FastifyInstance } from "fastify";
import { UploadsController } from "./uploads.controller";

export async function uploadsRoutes(app: FastifyInstance) {

  /**
   * POST /uploads/products
   * Recibe un archivo multipart con campo "file"
   * Devuelve: { url: "/uploads/products/<uuid>.<ext>" }
   */
  app.post("/products", async (request, reply) => {
    try {
      await UploadsController.uploadProductImage(request, reply);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al subir archivo";
      return reply.status(400).send({ message });
    }
  });
}
