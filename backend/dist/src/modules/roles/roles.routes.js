import { RoleController } from "./roles.controller";
import { requirePermission } from "../../middlewares/authenticate";
const handleError = (error, reply, fallback = "Error inesperado") => {
    const message = error instanceof Error ? error.message : fallback;
    return reply.status(400).send({ message });
};
export async function rolesRoutes(app) {
    /* GET /roles */
    app.get("/", { preHandler: requirePermission("Roles") }, async (request, reply) => {
        try {
            await RoleController.getAll(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al obtener roles");
        }
    });
    /* POST /roles */
    app.post("/", { preHandler: requirePermission("Roles") }, async (request, reply) => {
        try {
            await RoleController.create(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al crear rol");
        }
    });
    /* PUT /roles/:id */
    app.put("/:id", { preHandler: requirePermission("Roles") }, async (request, reply) => {
        try {
            await RoleController.update(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al actualizar rol");
        }
    });
    /* DELETE /roles/:id */
    app.delete("/:id", { preHandler: requirePermission("Roles") }, async (request, reply) => {
        try {
            await RoleController.delete(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al eliminar rol");
        }
    });
}
