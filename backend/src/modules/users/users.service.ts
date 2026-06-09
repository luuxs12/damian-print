import bcrypt from "bcrypt";
import { eq, ilike, and, ne } from "drizzle-orm";
import { db }    from "../../db";
import { users } from "../../db/schema/users";
import { sanitize } from "../../utils/string";
import type { CreateUserDTO, UpdateUserDTO } from "./users.types";

const SALT_ROUNDS = 10;

const emailExists = async (email: string, excludeId?: number): Promise<boolean> => {
  const conditions = excludeId
    ? and(ilike(users.email, email), ne(users.id, excludeId))
    : ilike(users.email, email);

  const [found] = await db.select({ id: users.id }).from(users).where(conditions);
  return !!found;
};

export const isLastActiveAdmin = async (userId: number): Promise<boolean> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || user.role !== "Administrador" || user.status !== "ACTIVE") {
    return false;
  }

  // Count active administrators
  const activeAdmins = await db
    .select()
    .from(users)
    .where(and(eq(users.role, "Administrador"), eq(users.status, "ACTIVE")));

  return activeAdmins.length === 1 && activeAdmins[0].id === userId;
};

/* ── Listar todos (sin contraseña) ── */
export const getUsers = async () => {
  return db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
};

/* ── Crear usuario ── */
export const createUser = async (data: CreateUserDTO) => {
  const username = sanitize(data.username);
  const email    = sanitize(data.email).toLowerCase();

  if (!username || username.length < 3) throw new Error("El usuario debe tener al menos 3 caracteres.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("El correo electrónico no es válido.");
  }
  if (!data.password || data.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  if (!data.role) throw new Error("El rol es obligatorio.");

  if (await emailExists(email)) {
    throw new Error(`El correo "${email}" ya está registrado.`);
  }

  // Prevent creating more than one Administrador
  const normalizedRole = sanitize(data.role);
  if (normalizedRole.toLowerCase() === "administrador") {
    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "Administrador"));
    if (existingAdmin) {
      throw new Error("Solo puede existir un perfil de Administrador en el sistema. Asigne otro rol.");
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const [inserted] = await db
    .insert(users)
    .values({
      username,
      email,
      password: hashedPassword,
      role:     normalizedRole,
      status:   data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      phone:    sanitize(data.phone) || null,
    })
    .returning();

  const { password: _pw, ...safeUser } = inserted;
  return safeUser;
};

/* ── Actualizar usuario ── */
export const updateUser = async (id: number, data: UpdateUserDTO) => {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new Error("Usuario no encontrado.");

  const patch: Record<string, unknown> = {};

  if (data.username !== undefined) {
    const username = sanitize(data.username);
    if (!username || username.length < 3) throw new Error("El usuario debe tener al menos 3 caracteres.");
    patch.username = username;
  }

  if (data.email !== undefined) {
    const email = sanitize(data.email).toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("El correo electrónico no es válido.");
    }
    if (await emailExists(email, id)) {
      throw new Error(`El correo "${email}" ya está en uso por otro usuario.`);
    }
    patch.email = email;
  }

  if (data.phone    !== undefined) patch.phone  = sanitize(data.phone) || null;
  if (data.role     !== undefined) patch.role   = sanitize(data.role);
  if (data.status   !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) throw new Error("Estado inválido.");
    patch.status = data.status;
  }

  if (data.password?.trim()) {
    if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
    patch.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  if (Object.keys(patch).length === 0) throw new Error("No se enviaron campos para actualizar.");

  const isDeactivating = data.status === "INACTIVE";
  const isChangingAdminRole = data.role !== undefined && data.role !== "Administrador";
  if (isDeactivating || isChangingAdminRole) {
    if (await isLastActiveAdmin(id)) {
      throw new Error("No se puede desactivar o cambiar el rol del único Administrador activo del sistema.");
    }
  }

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning();

  const { password: _pw, ...safeUser } = updated;
  return safeUser;
};

/* ── Eliminar usuario ── */
export const deleteUser = async (id: number) => {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new Error("Usuario no encontrado o ya fue eliminado.");

  if (await isLastActiveAdmin(id)) {
    throw new Error("No se puede eliminar el único Administrador activo del sistema.");
  }

  await db.delete(users).where(eq(users.id, id));
  return existing;
};