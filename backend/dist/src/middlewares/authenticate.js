import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { roles, permissions, rolePermissions } from "../db/schema/roles";
/**
 * Resolves permission codes for a role name.
 */
const resolvePermissions = async (roleName) => {
    const [role] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.roleName, roleName));
    if (!role)
        return [];
    const perms = await db
        .select({ code: permissions.code })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, role.id));
    return perms.map((p) => p.code).filter(Boolean);
};
/**
 * Middleware de autenticación JWT.
 * Verifica el token y confirma que el usuario existe y está activo en BD.
 * Usado en el hook onRequest del servidor principal.
 */
export const authenticate = async (request, reply) => {
    try {
        await request.jwtVerify();
        const user = await db.query.users.findFirst({
            where: eq(users.id, request.user.id),
        });
        if (!user || user.status !== "ACTIVE" || request.user.passSignature !== user.password.substring(0, 15)) {
            return reply.code(401).send({ message: "Acceso denegado: token inválido, expirado o sesión cerrada." });
        }
        request.currentUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };
    }
    catch {
        return reply.code(401).send({ message: "Token inválido o expirado." });
    }
};
/**
 * Middleware para validar permisos específicos por rol.
 */
export const requirePermission = (requiredPermission) => {
    return async (request, reply) => {
        const currentUser = request.currentUser;
        if (!currentUser) {
            return reply.code(401).send({ message: "No autorizado." });
        }
        // Administrador has all permissions by default
        if (currentUser.role === "Administrador") {
            return;
        }
        const userPerms = await resolvePermissions(currentUser.role);
        if (!userPerms.includes(requiredPermission)) {
            return reply.code(403).send({
                message: `Acceso denegado: se requiere el permiso "${requiredPermission}".`
            });
        }
    };
};
