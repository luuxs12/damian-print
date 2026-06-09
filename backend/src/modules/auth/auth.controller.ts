import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { loginUser, generateResetCode, verifyResetCode, resetUserPassword } from "./auth.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";

export const AuthController = {
  async login(request: FastifyRequest, reply: FastifyReply, app: FastifyInstance) {
    const body = request.body as { email?: string; password?: string };

    if (!body?.email?.trim() || !body?.password) {
      return reply.status(400).send({ message: "Correo y contraseña son obligatorios." });
    }

    const user  = await loginUser(body.email.trim(), body.password);
    const token = app.jwt.sign({
      id: user.id,
      role: user.role,
      passSignature: user.passSignature
    });

    return reply.send({
      token,
      user: {
        id:          user.id,
        username:    user.username,
        email:       user.email,
        role:        user.role,
        permissions: (user as any).permissions ?? [],
      },
    });
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { email?: string };
    const ip = request.ip;
    const userAgent = request.headers["user-agent"] || "Desconocido";

    if (!body?.email?.trim()) {
      return reply.status(400).send({ message: "El correo electrónico es obligatorio." });
    }
    
    const emailStr = body.email.toLowerCase().trim();
    try {
      await generateResetCode(body.email);
      
      auditLogsService.createLog({
        userId: null,
        username: "Sistema (No Autenticado)",
        module: "Seguridad",
        action: "SOLICITAR_RECUPERACION",
        details: { email: emailStr, ip, userAgent, result: "EXITO" }
      }).catch(err => request.log.error(err));

    } catch (error) {
      auditLogsService.createLog({
        userId: null,
        username: "Sistema (No Autenticado)",
        module: "Seguridad",
        action: "SOLICITAR_RECUPERACION",
        details: { email: emailStr, ip, userAgent, result: "FALLO", error: error instanceof Error ? error.message : "Error desconocido" }
      }).catch(err => request.log.error(err));
    }

    // Regla 1: SIEMPRE responder con mensaje genérico de éxito para evitar enumeración de cuentas
    return reply.send({ message: "Si el correo está registrado, recibirás un código de verificación para restablecer tu contraseña." });
  },

  async verifyResetCode(request: FastifyRequest, reply: FastifyReply, app: FastifyInstance) {
    const body = request.body as { email?: string; code?: string };
    const ip = request.ip;
    const userAgent = request.headers["user-agent"] || "Desconocido";

    if (!body?.email?.trim() || !body?.code?.trim()) {
      return reply.status(400).send({ message: "El correo electrónico y el código son obligatorios." });
    }
    
    const emailStr = body.email.toLowerCase().trim();
    try {
      const result = await verifyResetCode(body.email, body.code.trim());
      const resetToken = app.jwt.sign(
        { email: result.email, purpose: "reset_password" },
        { expiresIn: "10m" }
      );

      auditLogsService.createLog({
        userId: null,
        username: "Sistema (No Autenticado)",
        module: "Seguridad",
        action: "VERIFICAR_CODIGO",
        details: { email: emailStr, ip, userAgent, result: "EXITO" }
      }).catch(err => request.log.error(err));

      return reply.send({ resetToken });
    } catch (error) {
      auditLogsService.createLog({
        userId: null,
        username: "Sistema (No Autenticado)",
        module: "Seguridad",
        action: "VERIFICAR_CODIGO",
        details: { email: emailStr, ip, userAgent, result: "FALLO", error: error instanceof Error ? error.message : "Error desconocido" }
      }).catch(err => request.log.error(err));

      // Regla 15 & 25: Devolver mensajes limpios controlados al usuario, detalles internos solo en logs
      const userMessage = error instanceof Error && !error.message.includes("database") && !error.message.includes("relation")
        ? error.message
        : "Código de verificación incorrecto o expirado.";
      return reply.status(400).send({ message: userMessage });
    }
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply, app: FastifyInstance) {
    const body = request.body as { resetToken?: string; newPassword?: string };
    const ip = request.ip;
    const userAgent = request.headers["user-agent"] || "Desconocido";

    if (!body?.resetToken || !body?.newPassword) {
      return reply.status(400).send({ message: "Token de restablecimiento y nueva contraseña son obligatorios." });
    }
    
    let decodedEmail = "Desconocido";
    try {
      const decoded = app.jwt.verify(body.resetToken) as { email?: string; purpose?: string };
      if (!decoded || decoded.purpose !== "reset_password" || !decoded.email) {
        return reply.status(400).send({ message: "Token inválido, expirado o con permisos insuficientes." });
      }

      decodedEmail = decoded.email.toLowerCase().trim();
      await resetUserPassword(decoded.email, body.newPassword);

      auditLogsService.createLog({
        userId: null,
        username: "Sistema (No Autenticado)",
        module: "Seguridad",
        action: "RESTABLECER_CONTRASENA",
        details: { email: decodedEmail, ip, userAgent, result: "EXITO" }
      }).catch(err => request.log.error(err));

      return reply.send({ message: "Tu contraseña ha sido restablecida con éxito." });
    } catch (error) {
      auditLogsService.createLog({
        userId: null,
        username: "Sistema (No Autenticado)",
        module: "Seguridad",
        action: "RESTABLECER_CONTRASENA",
        details: { email: decodedEmail, ip, userAgent, result: "FALLO", error: error instanceof Error ? error.message : "Error desconocido" }
      }).catch(err => request.log.error(err));

      const userMessage = error instanceof Error && !error.message.includes("database") && !error.message.includes("relation")
        ? error.message
        : "Error al restablecer la contraseña.";
      return reply.status(400).send({ message: userMessage });
    }
  }
};
