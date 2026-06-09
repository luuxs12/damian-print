import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { products, productPresentations } from "../../db/schema/products";
import { categories } from "../../db/schema/categories";
import { users } from "../../db/schema/users";
import { sanitize } from "../../utils/string";
import type { CreateProductDTO, UpdateProductDTO } from "./products.types";

/* Genera prefijo de código a partir del nombre de la categoría */
const getCategoryPrefix = (name: string): string => {
  const normalized = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalized === "GRAN FORMATO") return "GF";
  if (normalized.startsWith("GRABADO")) return "GRB";
  const clean = normalized.replace(/[^A-Z]/g, "");
  return clean.substring(0, 3) || "PROD";
};

/* Genera código auto-incremental único según la categoría */
const generateProductCode = async (categoryId: number): Promise<string> => {
  const [cat] = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, categoryId));
  if (!cat) throw new Error("La categoría especificada no existe.");

  const prefix = getCategoryPrefix(cat.name);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.code} LIKE ${prefix + "-%"}`);

  const nextNum = (Number(countResult?.count) || 0) + 1;
  return `${prefix}-${String(nextNum).padStart(3, "0")}`;
};

/* Listar todos los productos */
export const getProducts = async () => {
  return db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      description: products.description,
      unit: products.unit,
      categoryId: products.categoryId,
      categoryName: categories.name,
      status: products.status,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,
      manageInventory: products.manageInventory,
      countAsPrint: products.countAsPrint,
      sendToProduction: products.sendToProduction,
      branchName: products.branchName,
      pricePublic: products.pricePublic,
      priceReseller: products.priceReseller,
      priceScales: products.priceScales,
      specialPrices: products.specialPrices,
      laborCost: products.laborCost,
      overheadCost: products.overheadCost,
      materials: products.materials,
      presentationsCount: sql<number>`(
        SELECT count(*) FROM ${productPresentations}
        WHERE ${productPresentations.productId} = ${products.id}
      )`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(products.createdAt);
};

/* Obtener un producto por ID con presentaciones y creador */
export const getProductById = async (id: number) => {
  const [product] = await db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      description: products.description,
      unit: products.unit,
      categoryId: products.categoryId,
      categoryName: categories.name,
      status: products.status,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,
      createdById: products.createdById,
      createdByUsername: users.username,
      manageInventory: products.manageInventory,
      countAsPrint: products.countAsPrint,
      sendToProduction: products.sendToProduction,
      branchName: products.branchName,
      pricePublic: products.pricePublic,
      priceReseller: products.priceReseller,
      priceScales: products.priceScales,
      specialPrices: products.specialPrices,
      laborCost: products.laborCost,
      overheadCost: products.overheadCost,
      materials: products.materials,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(users, eq(products.createdById, users.id))
    .where(eq(products.id, id));

  if (!product) throw new Error("Producto no encontrado.");

  const presentations = await db
    .select({
      id: productPresentations.id,
      presentation: productPresentations.presentation,
      price: productPresentations.price,
    })
    .from(productPresentations)
    .where(eq(productPresentations.productId, id));

  return {
    ...product,
    pricePublic: Number(product.pricePublic),
    priceReseller: Number(product.priceReseller),
    laborCost: Number(product.laborCost ?? 0),
    overheadCost: Number(product.overheadCost ?? 0),
    materials: product.materials ?? [],
    presentations,
  };
};

/* Crear producto */
export const createProduct = async (data: CreateProductDTO, userId: number) => {
  const name = sanitize(data.name);
  const description = sanitize(data.description);

  if (!name) throw new Error("El nombre del producto es obligatorio.");
  if (name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");
  if (!data.categoryId) throw new Error("La categoría es obligatoria.");

  const code = await generateProductCode(data.categoryId);

  return db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        code,
        name,
        description: description || null,
        unit: data.unit || "Pieza",
        categoryId: data.categoryId,
        status: data.status || "ACTIVE",
        imageUrl: data.imageUrl || null,
        createdById: userId,
        manageInventory: data.manageInventory ?? false,
        countAsPrint: data.countAsPrint ?? false,
        sendToProduction: data.sendToProduction ?? false,
        branchName: data.branchName || null,
        pricePublic: data.pricePublic != null ? Number(data.pricePublic) : 0.0,
        priceReseller: data.priceReseller != null ? Number(data.priceReseller) : 0.0,
        priceScales: data.priceScales || null,
        specialPrices: data.specialPrices || null,
        laborCost: data.laborCost != null ? Number(data.laborCost) : 0.0,
        overheadCost: data.overheadCost != null ? Number(data.overheadCost) : 0.0,
        materials: data.materials || null,
      })
      .returning();

    if (data.presentations?.length) {
      for (const pres of data.presentations) {
        if (!pres.presentation.trim()) throw new Error("El nombre de la presentación no puede estar vacío.");
        if (pres.price < 0) throw new Error("El precio no puede ser negativo.");
        await tx.insert(productPresentations).values({
          productId: product.id,
          presentation: pres.presentation.trim(),
          price: pres.price,
        });
      }
    }

    return product;
  });
};

/* Actualizar producto */
export const updateProduct = async (id: number, data: UpdateProductDTO) => {
  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) throw new Error("Producto no encontrado.");

  const name = data.name !== undefined ? sanitize(data.name) : undefined;
  if (name !== undefined) {
    if (!name) throw new Error("El nombre no puede estar vacío.");
    if (name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");
  }

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;

  if (data.description !== undefined) {
    patch.description = sanitize(data.description) || null;
  }

  if (data.unit !== undefined) {
    patch.unit = data.unit || "Pieza";
  }

  if (data.categoryId !== undefined) {
    patch.categoryId = data.categoryId;
    if (data.categoryId !== existing.categoryId) {
      patch.code = await generateProductCode(data.categoryId);
    }
  }

  if (data.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new Error("Estado inválido. Usa ACTIVE o INACTIVE.");
    }
    patch.status = data.status;
  }

  if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;

  // Characteristics
  if (data.manageInventory !== undefined) patch.manageInventory = data.manageInventory;
  if (data.countAsPrint !== undefined) patch.countAsPrint = data.countAsPrint;
  if (data.sendToProduction !== undefined) patch.sendToProduction = data.sendToProduction;
  if (data.branchName !== undefined) patch.branchName = data.branchName || null;

  // Advanced Pricing
  if (data.pricePublic !== undefined) patch.pricePublic = data.pricePublic != null ? Number(data.pricePublic) : 0.0;
  if (data.priceReseller !== undefined) patch.priceReseller = data.priceReseller != null ? Number(data.priceReseller) : 0.0;
  if (data.priceScales !== undefined) patch.priceScales = data.priceScales || null;
  if (data.specialPrices !== undefined) patch.specialPrices = data.specialPrices || null;

  // Costs & Materials
  if (data.laborCost !== undefined) patch.laborCost = data.laborCost != null ? Number(data.laborCost) : 0.0;
  if (data.overheadCost !== undefined) patch.overheadCost = data.overheadCost != null ? Number(data.overheadCost) : 0.0;
  if (data.materials !== undefined) patch.materials = data.materials || null;

  return db.transaction(async (tx) => {
    let updated = existing;

    if (Object.keys(patch).length > 0) {
      const [res] = await tx
        .update(products)
        .set(patch)
        .where(eq(products.id, id))
        .returning();
      updated = res;
    }

    if (data.presentations !== undefined) {
      await tx.delete(productPresentations).where(eq(productPresentations.productId, id));

      for (const pres of data.presentations) {
        if (!pres.presentation.trim()) throw new Error("La presentación no puede estar vacía.");
        if (pres.price < 0) throw new Error("El precio no puede ser negativo.");
        await tx.insert(productPresentations).values({
          productId: id,
          presentation: pres.presentation.trim(),
          price: pres.price,
        });
      }
    }

    return updated;
  });
};

/* Eliminar producto */
export const deleteProduct = async (id: number) => {
  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) throw new Error("Producto no encontrado.");
  await db.delete(products).where(eq(products.id, id));
  return existing;
};

/* Calcular precio del producto por cantidad y cliente */
export const calculateProductPrice = (
  product: {
    pricePublic: number;
    priceReseller: number;
    priceScales?: { minQty: number; price: number }[] | null;
    specialPrices?: { clientId: number; clientName: string; price: number }[] | null;
  },
  qty: number,
  clientId?: number | null,
  isReseller?: boolean
): number => {
  // 1. Validar precio especial de cliente
  if (clientId && product.specialPrices) {
    const spec = product.specialPrices.find((s) => s.clientId === clientId);
    if (spec) return Number(spec.price);
  }

  // 2. Validar escala de mayoreo por cantidad
  if (product.priceScales && product.priceScales.length > 0) {
    // Ordenar de mayor a menor cantidad requerida
    const sortedScales = [...product.priceScales].sort((a, b) => b.minQty - a.minQty);
    const matched = sortedScales.find((scale) => qty >= scale.minQty);
    if (matched) return Number(matched.price);
  }

  // 3. Devolver precio base (revendedor o público)
  return isReseller ? Number(product.priceReseller) : Number(product.pricePublic);
};
