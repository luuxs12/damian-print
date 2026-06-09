import { UserController } from "./users.controller";
import { requirePermission } from "../../middlewares/authenticate";
const handleError = (error, reply, fallback = "Error inesperado") => {
    const message = error instanceof Error ? error.message : fallback;
    return reply.status(400).send({ message });
};
export async function usersRoutes(app) {
    /* GET /users */
    app.get("/", { preHandler: requirePermission("Usuarios") }, async (request, reply) => {
        try {
            await UserController.getAll(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al obtener usuarios");
        }
    });
    /* POST /users */
    app.post("/", { preHandler: requirePermission("Usuarios") }, async (request, reply) => {
        try {
            await UserController.create(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al crear usuario");
        }
    });
    /* PUT /users/:id */
    app.put("/:id", { preHandler: requirePermission("Usuarios") }, async (request, reply) => {
        try {
            await UserController.update(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al actualizar usuario");
        }
    });
    /* DELETE /users/:id */
    app.delete("/:id", { preHandler: requirePermission("Usuarios") }, async (request, reply) => {
        try {
            await UserController.delete(request, reply);
        }
        catch (error) {
            return handleError(error, reply, "Error al eliminar usuario");
        }
    });
}
