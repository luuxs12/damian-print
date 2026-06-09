import { CategoryController } from "./categories.controller";
import { requirePermission } from "../../middlewares/authenticate";
const handleError = (error, reply, fallback = "Error inesperado") => {
    const message = error instanceof Error ? error.message : fallback;
    return reply.status(400).send({ message });
};
export async function categoriesRoutes(app) {
    /* GET /categories */
    app.get("/", { preHandler: requirePermission("Categorías") }, async (request, reply) => {
        try {
            await CategoryController.getAll(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al obtener categorías");
        }
    });
    /* POST /categories */
    app.post("/", { preHandler: requirePermission("Categorías") }, async (request, reply) => {
        try {
            await CategoryController.create(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al crear categoría");
        }
    });
    /* PUT /categories/:id */
    app.put("/:id", { preHandler: requirePermission("Categorías") }, async (request, reply) => {
        try {
            await CategoryController.update(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al actualizar categoría");
        }
    });
    /* PATCH /categories/:id/toggle */
    app.patch("/:id/toggle", { preHandler: requirePermission("Categorías") }, async (request, reply) => {
        try {
            await CategoryController.toggleStatus(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al cambiar estado de categoría");
        }
    });
    /* DELETE /categories/:id */
    app.delete("/:id", { preHandler: requirePermission("Categorías") }, async (request, reply) => {
        try {
            await CategoryController.delete(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al eliminar categoría");
        }
    });
}
