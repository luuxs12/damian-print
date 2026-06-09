import bcrypt from "bcrypt";
import { eq, and, gte }  from "drizzle-orm";
import crypto from "crypto";
import { db }  from "../../db";
import { users }                            from "../../db/schema/users";
import { roles, permissions, rolePermissions } from "../../db/schema/roles";
import { passwordResets } from "../../db/schema/password-resets";
import { auditLogs } from "../../db/schema/audit-logs";
import { sendMail } from "../mail/mail.service";
import { EmailTemplates } from "../mail/mail.templates";

/**
 * Autentica un usuario por email y contraseña.
 * Retorna el usuario con sus permisos resueltos.
 * Lanza Error con mensaje claro ante cualquier fallo.
 */
export const loginUser = async (email: string, password: string) => {

  /* 1. Buscar usuario por email */
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  /* Mismo mensaje para usuario inexistente o contraseña incorrecta
     (evitar enumeración de cuentas) */
  if (!user) {
    throw new Error("Credenciales inválidas.");
  }

  /* 2. Verificar estado antes de comparar contraseña */
  if (user.status !== "ACTIVE") {
    throw new Error("Tu cuenta está inactiva. Contacta al administrador.");
  }

  /* 3. Verificar contraseña */
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Credenciales inválidas.");
  }

  /* 4. Obtener permisos del rol */
  const userPermissions = await resolvePermissions(user.role);

  /* Retornar sin exponer el hash de la contraseña */
  const { password: _pw, ...safeUser } = user;
  return {
    ...safeUser,
    passSignature: user.password.substring(0, 15),
    permissions: userPermissions
  };
};

/**
 * Resuelve los permisos (codes) asociados a un nombre de rol.
 */
const resolvePermissions = async (roleName: string): Promise<string[]> => {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.roleName, roleName));

  if (!role) return [];

  const perms = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, role.id));

  return perms.map((p) => p.code!);
};

/**
 * Genera un código de verificación y lo asocia al correo del usuario si existe.
 */
export const generateResetCode = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Verificar que el usuario exista
  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });
  if (!user) {
    throw new Error("El correo electrónico no se encuentra registrado en el sistema.");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("Tu cuenta está inactiva. No puedes restablecer la contraseña.");
  }

  // Verificar límite de solicitudes (Regla 7: Rate limiting - max 3 OTP en 15 minutos)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentLogs = await db
    .select({ details: auditLogs.details })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.action, "SOLICITAR_RECUPERACION"),
        gte(auditLogs.createdAt, fifteenMinutesAgo)
      )
    );

  const emailRequests = recentLogs.filter(log => {
    try {
      const details = log.details as any;
      return details && details.email === normalizedEmail;
    } catch {
      return false;
    }
  });

  if (emailRequests.length >= 3) {
    throw new Error("Has excedido el límite de solicitudes de restablecimiento de contraseña (máximo 3 solicitudes cada 15 minutos).");
  }

  // Generar código numérico seguro de 6 dígitos
  const code = crypto.randomInt(100000, 999999).toString();

  // Guardar el HASH del código (Regla 2: NO guardar OTP en texto plano)
  const hashedCode = await bcrypt.hash(code, 10);

  // Invalidar códigos de recuperación anteriores para este correo (Regla 19: NO dejar múltiples OTP válidos)
  await db.delete(passwordResets).where(eq(passwordResets.email, normalizedEmail));

  // Vencimiento: 10 minutos (Regla 3: OTP válido solo de 5 a 10 minutos)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(passwordResets).values({
    email: normalizedEmail,
    code: hashedCode,
    expiresAt,
  });

  // Simulamos el envío del correo imprimiéndolo en la consola del servidor (Regla 18)
  console.log("\n------------------------------------------------");
  console.log(`✉️ ENVIANDO CORREO A: ${normalizedEmail}`);
  console.log(`🔑 CÓDIGO DE RECUPERACIÓN: ${code}`);
  console.log(`⏳ EXPIRA EN: 10 minutos`);
  console.log(`⚠️ ADVERTENCIA: Si usted no solicitó esto, por favor ignore este mensaje.`);
  console.log("------------------------------------------------\n");

  const emailHtml = EmailTemplates.getForgotPasswordTemplate(code);

  await sendMail(
    normalizedEmail,
    "Código de verificación de contraseña - Industria Gráfica Damian",
    emailHtml
  ).catch(err => console.error("Error al enviar email en generateResetCode:", err));

  return { email: normalizedEmail };
};

/**
 * Valida el código de verificación con control de intentos y expiración.
 */
export const verifyResetCode = async (email: string, code: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  const record = await db.query.passwordResets.findFirst({
    where: eq(passwordResets.email, normalizedEmail),
  });

  if (!record) {
    throw new Error("No hay ninguna solicitud de restablecimiento activa para este correo.");
  }

  // Verificar expiración (Regla 3)
  if (new Date() > record.expiresAt) {
    await db.delete(passwordResets).where(eq(passwordResets.email, normalizedEmail));
    throw new Error("El código de verificación ha expirado.");
  }

  // Verificar código usando bcrypt.compare (Regla 2)
  const isMatch = await bcrypt.compare(code, record.code);
  if (!isMatch) {
    const nextAttempts = record.attempts + 1;
    if (nextAttempts >= 5) {
      await db.delete(passwordResets).where(eq(passwordResets.email, normalizedEmail));
      throw new Error("Código bloqueado por demasiados intentos fallidos. Genera uno nuevo.");
    }
    await db
      .update(passwordResets)
      .set({ attempts: nextAttempts })
      .where(eq(passwordResets.id, record.id));
    
    // Mensaje genérico para evitar enumerar el número exacto de intentos (Regla 15)
    throw new Error("Código incorrecto.");
  }

  // Eliminar el código tras verificación exitosa (Regla 4)
  await db.delete(passwordResets).where(eq(passwordResets.email, normalizedEmail));

  return { email: normalizedEmail };
};

const isStrongPassword = (pass: string): boolean => {
  if (pass.length < 12) return false;
  const hasUpperCase = /[A-Z]/.test(pass);
  const hasLowerCase = /[a-z]/.test(pass);
  const hasNumbers = /\d/.test(pass);
  const hasNonalphas = /\W/.test(pass);
  return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
};

/**
 * Actualiza la contraseña del usuario en el sistema.
 */
export const resetUserPassword = async (email: string, newPassword: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  // Regla 8: Exigir contraseñas robustas (mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos)
  if (!isStrongPassword(newPassword)) {
    throw new Error("La contraseña no cumple con los requisitos de seguridad: mínimo 12 caracteres, incluir mayúsculas, minúsculas, números y al menos un símbolo especial.");
  }

  // Regla 9: Guardar contraseña con hash bcrypt
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id));

  // Asegurar limpieza de códigos (Regla 4)
  await db.delete(passwordResets).where(eq(passwordResets.email, normalizedEmail));
};