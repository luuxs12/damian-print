import { AuthController } from "./auth.controller";
export async function authRoutes(app) {
    /* POST /auth/login */
    app.post("/login", async (request, reply) => {
        try {
            await AuthController.login(request, reply, app);
        }
        catch (error) {
            return reply.status(401).send({
                message: error instanceof Error ? error.message : "Credenciales inválidas.",
            });
        }
    });
    /* POST /auth/forgot-password */
    app.post("/forgot-password", async (request, reply) => {
        await AuthController.forgotPassword(request, reply);
    });
    /* POST /auth/verify-reset-code */
    app.post("/verify-reset-code", async (request, reply) => {
        await AuthController.verifyResetCode(request, reply, app);
    });
    /* POST /auth/reset-password */
    app.post("/reset-password", async (request, reply) => {
        await AuthController.resetPassword(request, reply, app);
    });
}
