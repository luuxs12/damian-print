import bcrypt from "bcrypt";
import { db } from "./db/client";
import { users, supplies, categories, products, productionOrders } from "./db/schema";
import { roles, permissions, rolePermissions } from "./db/schema/roles";

const permissionsList = [
  "Dashboard",
  "Usuarios",
  "Perfiles",
  "Categorías",
  "Productos",
  "Presentaciones",
  "Clientes",
  "Insumos",
  "Cotizaciones",
  "Ventas",
  "Producción",
  "Configuración",
  "Auditoría",
];

const seed = async () => {
  try {
    // 1. Insert permissions
    console.log("Seeding permissions...");
    for (const code of permissionsList) {
      await db
        .insert(permissions)
        .values({
          code,
          description: `Permiso para ${code}`,
        })
        .onConflictDoNothing();
    }
    console.log("Permissions seeded.");

    // 2. Insert admin role
    console.log("Seeding admin role...");
    const [adminRole] = await db
      .insert(roles)
      .values({
        roleName: "Administrador",
        description: "Acceso total al sistema",
      })
      .returning();
      
    const allPerms = await db.select().from(permissions);
    
    // Assign all permissions to admin
    for (const p of allPerms) {
      await db
        .insert(rolePermissions)
        .values({
          roleId: adminRole.id,
          permissionId: p.id,
        })
        .onConflictDoNothing();
    }
    console.log("Admin role seeded.");

    // 3. Insert admin user
    console.log("Seeding admin user...");
    const hashedPassword = await bcrypt.hash("123456", 10);
    await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@damianprint.com",
        password: hashedPassword,
        role: "Administrador",
        status: "ACTIVE",
      })
      .onConflictDoNothing();
    console.log("Admin user seeded.");

    // 4. Insert default supplies
    console.log("Seeding default supplies...");
    const defaultSupplies = [
      { code: "INS-001", name: "Papel Couché 350g", description: "Resma de papel couché de 350g, ideal para tarjetas", stock: 10, minStock: 2, unit: "resma", cost: 45.0, status: "ACTIVE" },
      { code: "INS-002", name: "Vinil Adhesivo Brillante", description: "Rollo de vinilo autoadhesivo brillante 1.52m x 50m", stock: 3.5, minStock: 1, unit: "rollo", cost: 180.0, status: "ACTIVE" },
      { code: "INS-003", name: "Lona Banner 13oz", description: "Rollo de lona de banner de 13oz, 3.20m x 50m", stock: 2.0, minStock: 1, unit: "rollo", cost: 220.0, status: "ACTIVE" },
      { code: "INS-004", name: "Ojales de Metal 12mm", description: "Caja de 1000 unidades de ojales metálicos", stock: 15, minStock: 3, unit: "caja", cost: 15.0, status: "ACTIVE" },
      { code: "INS-005", name: "Tinta Ecosolvente Negra", description: "Botella de 1 litro de tinta ecosolvente negra para cabezal DX5", stock: 8, minStock: 2, unit: "l", cost: 95.0, status: "ACTIVE" },
    ];
    for (const supply of defaultSupplies) {
      await db
        .insert(supplies)
        .values(supply)
        .onConflictDoNothing();
    }
    console.log("Default supplies seeded.");

    // 5. Seed default category and products if none exist
    console.log("Seeding categories and products...");
    let catId = 1;
    const [existingCat] = await db.select().from(categories).limit(1);
    if (!existingCat) {
      const [newCat] = await db.insert(categories).values({
        name: "Impresión Digital",
        description: "Productos impresos en vinil, lona y papel"
      }).returning();
      catId = newCat.id;
    } else {
      catId = existingCat.id;
    }

    let prodId = 1;
    const [existingProd] = await db.select().from(products).limit(1);
    if (!existingProd) {
      const [newProd] = await db.insert(products).values({
        code: "PROD-001",
        name: "Lona Banner 13oz Templada",
        description: "Lona impresa a full color con ojales",
        unit: "Pieza",
        categoryId: catId,
        status: "ACTIVE",
        type: "FINISHED_PRODUCT",
        sendToProduction: true,
        branchName: "Taller Principal",
      }).returning();
      prodId = newProd.id;
    } else {
      prodId = existingProd.id;
    }

    // 6. Seed production orders
    console.log("Seeding production orders...");
    const prodOrders = [
      {
        orderNumber: "OP-0001",
        productId: prodId,
        productName: "Lona Banner 13oz Templada",
        clientName: "Juan Pérez",
        quantity: 2,
        branchName: "Taller Principal",
        status: "PENDING",
        promisedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
        notes: "Llevar ojales reforzados en los cuatro bordes",
      },
      {
        orderNumber: "OP-0002",
        productId: prodId,
        productName: "Lona Banner 13oz Templada",
        clientName: "Corporación Alfa",
        quantity: 5,
        branchName: "Taller Principal",
        status: "DESIGN",
        promisedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
        notes: "Enviar diseño previo al correo del cliente",
      },
      {
        orderNumber: "OP-0003",
        productId: prodId,
        productName: "Lona Banner 13oz Templada",
        clientName: "María Rojas",
        quantity: 1,
        branchName: "Taller Principal",
        status: "PRINTING",
        promisedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday (delayed)
        notes: "Urgente",
      },
      {
        orderNumber: "OP-0004",
        productId: prodId,
        productName: "Lona Banner 13oz Templada",
        clientName: "Distribuidora Lima",
        quantity: 10,
        branchName: "Taller Principal",
        status: "READY",
        promisedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
        notes: "Empaquetar por separado",
      }
    ];

    for (const po of prodOrders) {
      await db.insert(productionOrders).values(po).onConflictDoNothing();
    }
    console.log("Production orders seeded.");

    console.log("Seed completado exitosamente");
  } catch (error) {
    console.error("Error seeding DB:", error);
  }
};

seed();