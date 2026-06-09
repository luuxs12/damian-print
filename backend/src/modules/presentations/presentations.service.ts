import { eq } from "drizzle-orm";
import { db }         from "../../db";
import { presentations } from "../../db/schema/presentations";
import { products } from "../../db/schema/products";
import { categories } from "../../db/schema/categories";
import { sanitize }   from "../../utils/string";
import type { CreatePresentationDTO, UpdatePresentationDTO } from "./presentations.types";

/* ── Listar todas ── */
export const getPresentations = async () => {
  return db
    .select({
      id:              presentations.id,
      productId:       presentations.productId,
      productName:     products.name,
      categoryId:      products.categoryId,
      categoryName:    categories.name,
      name:            presentations.name,
      description:     presentations.description,
      size:            presentations.size,
      material:        presentations.material,
      finish:          presentations.finish,
      color:           presentations.color,
      quantity:        presentations.quantity,
      imageUrl:        presentations.imageUrl,
      cost:            presentations.cost,
      price:           presentations.price,
      wholesalePrice:  presentations.wholesalePrice,
      status:          presentations.status,
      createdAt:       presentations.createdAt,
    })
    .from(presentations)
    .innerJoin(products, eq(presentations.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(presentations.createdAt);
};

/* ── Crear ── */
export const createPresentation = async (data: CreatePresentationDTO) => {
  if (!data.productId) throw new Error("El producto es obligatorio.");
  const [productExists] = await db.select().from(products).where(eq(products.id, data.productId));
  if (!productExists) throw new Error("El producto especificado no existe.");

  const name        = sanitize(data.name);
  const description = sanitize(data.description);
  const size        = sanitize(data.size);
  const material    = sanitize(data.material);
  const finish      = sanitize(data.finish);
  const color       = sanitize(data.color);
  const quantity    = sanitize(data.quantity);
  const imageUrl    = sanitize(data.imageUrl);

  if (!name) throw new Error("El nombre de la presentación es obligatorio.");
  if (name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");

  const [presentation] = await db
    .insert(presentations)
    .values({
      productId: data.productId,
      name,
      description: description || null,
      size: size || null,
      material: material || null,
      finish: finish || null,
      color: color || null,
      quantity: quantity || null,
      imageUrl: imageUrl || null,
      cost: Number(data.cost) || 0,
      price: Number(data.price) || 0,
      wholesalePrice: Number(data.wholesalePrice) || 0,
      status: "ACTIVE",
    })
    .returning();

  return presentation;
};

/* ── Actualizar ── */
export const updatePresentation = async (id: number, data: UpdatePresentationDTO) => {
  const [existing] = await db.select().from(presentations).where(eq(presentations.id, id));
  if (!existing) throw new Error("Presentación no encontrada.");

  const patch: Record<string, unknown> = {};

  if (data.productId !== undefined) {
    const [productExists] = await db.select().from(products).where(eq(products.id, data.productId));
    if (!productExists) throw new Error("El producto especificado no existe.");
    patch.productId = data.productId;
  }

  if (data.name !== undefined) {
    const name = sanitize(data.name);
    if (!name) throw new Error("El nombre no puede estar vacío.");
    if (name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");
    patch.name = name;
  }

  if (data.description !== undefined) patch.description = sanitize(data.description) || null;
  if (data.size !== undefined)        patch.size = sanitize(data.size) || null;
  if (data.material !== undefined)    patch.material = sanitize(data.material) || null;
  if (data.finish !== undefined)      patch.finish = sanitize(data.finish) || null;
  if (data.color !== undefined)        patch.color = sanitize(data.color) || null;
  if (data.quantity !== undefined)    patch.quantity = sanitize(data.quantity) || null;
  if (data.imageUrl !== undefined)    patch.imageUrl = sanitize(data.imageUrl) || null;

  if (data.cost !== undefined)           patch.cost = Number(data.cost) || 0;
  if (data.price !== undefined)          patch.price = Number(data.price) || 0;
  if (data.wholesalePrice !== undefined) patch.wholesalePrice = Number(data.wholesalePrice) || 0;

  if (data.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new Error("Estado inválido. Usa ACTIVE o INACTIVE.");
    }
    patch.status = data.status;
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("No se enviaron campos para actualizar.");
  }

  const [updated] = await db
    .update(presentations)
    .set(patch)
    .where(eq(presentations.id, id))
    .returning();

  return updated;
};

/* ── Alternar estado ACTIVE ↔ INACTIVE ── */
export const togglePresentationStatus = async (id: number) => {
  const [existing] = await db.select().from(presentations).where(eq(presentations.id, id));
  if (!existing) throw new Error("Presentación no encontrada.");

  const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const [updated] = await db
    .update(presentations)
    .set({ status: newStatus })
    .where(eq(presentations.id, id))
    .returning();

  return updated;
};

/* ── Eliminar ── */
export const deletePresentation = async (id: number) => {
  const [existing] = await db.select().from(presentations).where(eq(presentations.id, id));
  if (!existing) throw new Error("Presentación no encontrada o ya fue eliminada.");

  await db.delete(presentations).where(eq(presentations.id, id));
  return existing;
};
