import { PresentationController } from "./presentations.controller";
import { requirePermission } from "../../middlewares/authenticate";
const handleError = (error, reply, fallback = "Error inesperado") => {
    const message = error instanceof Error ? error.message : fallback;
    return reply.status(400).send({ message });
};
export async function presentationsRoutes(app) {
    /* GET /presentations */
    app.get("/", { preHandler: requirePermission("Presentaciones") }, async (request, reply) => {
        try {
            await PresentationController.getAll(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al obtener presentaciones");
        }
    });
    /* POST /presentations */
    app.post("/", { preHandler: requirePermission("Presentaciones") }, async (request, reply) => {
        try {
            await PresentationController.create(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al crear presentación");
        }
    });
    /* PUT /presentations/:id */
    app.put("/:id", { preHandler: requirePermission("Presentaciones") }, async (request, reply) => {
        try {
            await PresentationController.update(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al actualizar presentación");
        }
    });
    /* PATCH /presentations/:id/toggle */
    app.patch("/:id/toggle", { preHandler: requirePermission("Presentaciones") }, async (request, reply) => {
        try {
            await PresentationController.toggleStatus(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al cambiar estado de presentación");
        }
    });
    /* DELETE /presentations/:id */
    app.delete("/:id", { preHandler: requirePermission("Presentaciones") }, async (request, reply) => {
        try {
            await PresentationController.delete(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al eliminar presentación");
        }
    });
}
