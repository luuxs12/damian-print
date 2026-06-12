import bcrypt from "bcrypt";
import { db } from "./db/client";
import {
  users,
  supplies,
  categories,
  products,
  productionOrders,
  clients,
  presentations,
  sales,
  saleItems
} from "./db/schema";
import { roles, permissions, rolePermissions } from "./db/schema/roles";
import { eq } from "drizzle-orm";

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
  "Registrar Venta",
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
    let adminRole;
    const [existingRole] = await db.select().from(roles).limit(1);
    if (!existingRole) {
      const [newRole] = await db
        .insert(roles)
        .values({
          roleName: "Administrador",
          description: "Acceso total al sistema",
        })
        .returning();
      adminRole = newRole;
    } else {
      adminRole = existingRole;
    }
      
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
    ];
    for (const supply of defaultSupplies) {
      await db
        .insert(supplies)
        .values(supply)
        .onConflictDoNothing();
    }
    console.log("Default supplies seeded.");

    // 5. Seed default category and products
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

    const prod1Val = {
      code: "PROD-001",
      name: "Lona Banner 13oz Templada",
      description: "Lona impresa a full color con ojales",
      unit: "Pieza",
      categoryId: catId,
      status: "ACTIVE",
      type: "FINISHED_PRODUCT",
      sendToProduction: true,
      branchName: "Taller Principal",
      pricePublic: 25.0,
      priceReseller: 20.0,
      overheadCost: 2.0,
    };
    
    let prodId1 = 1;
    const [existingProd1] = await db.select().from(products).where(eq(products.code, "PROD-001"));
    if (!existingProd1) {
      const [insertedProd1] = await db.insert(products).values(prod1Val).returning();
      prodId1 = insertedProd1.id;
    } else {
      prodId1 = existingProd1.id;
    }
 
    const prod2Val = {
      code: "PROD-002",
      name: "Tarjetas de Presentación",
      description: "Tarjetas de presentación impresas en offset mate o brillante",
      unit: "Ciento",
      categoryId: catId,
      status: "ACTIVE",
      type: "FINISHED_PRODUCT",
      sendToProduction: true,
      branchName: "Taller Principal",
      pricePublic: 45.0,
      priceReseller: 35.0,
      overheadCost: 3.0,
      priceScales: JSON.stringify([
        { minQty: 5, price: 40.0 },
        { minQty: 10, price: 35.0 },
        { minQty: 50, price: 30.0 }
      ]),
    };
    
    let prodId2 = 2;
    const [existingProd2] = await db.select().from(products).where(eq(products.code, "PROD-002"));
    if (!existingProd2) {
      const [insertedProd2] = await db.insert(products).values(prod2Val as any).returning();
      prodId2 = insertedProd2.id;
    } else {
      prodId2 = existingProd2.id;
    }
 
    const serv1Val = {
      code: "SERV-001",
      name: "Diseño Gráfico Personalizado",
      description: "Servicio de diseño y diagramación publicitaria por hora",
      unit: "Servicio",
      categoryId: catId,
      status: "ACTIVE",
      type: "SERVICE",
      sendToProduction: false,
      pricePublic: 50.0,
      priceReseller: 40.0,
      overheadCost: 0,
    };
    const [existingServ1] = await db.select().from(products).where(eq(products.code, "SERV-001"));
    if (!existingServ1) {
      await db.insert(products).values(serv1Val);
    }
 
    const serv2Val = {
      code: "SERV-002",
      name: "Instalación de Gigantografías",
      description: "Servicio de instalación de banners en altura con estructuras metálicas",
      unit: "Servicio",
      categoryId: catId,
      status: "ACTIVE",
      type: "SERVICE",
      sendToProduction: true,
      branchName: "Taller Principal",
      pricePublic: 80.0,
      priceReseller: 70.0,
      overheadCost: 1,
    };
    const [existingServ2] = await db.select().from(products).where(eq(products.code, "SERV-002"));
    if (!existingServ2) {
      await db.insert(products).values(serv2Val);
    }
 
    console.log("Categories and products seeded.");

    // 6. Seed Presentations (Finishes)
    console.log("Seeding presentations...");
    const defaultPresentations = [
      { productId: prodId1, name: "Ojales Reforzados", description: "Ojales metálicos con doble refuerzo", price: 5.0, wholesalePrice: 4.0, status: "ACTIVE" },
      { productId: prodId1, name: "Sin Ojales", description: "Lona limpia lista para montaje directo", price: 0.0, wholesalePrice: 0.0, status: "ACTIVE" },
      { productId: prodId2, name: "Acabado Mate", description: "Laminado mate soft touch", price: 10.0, wholesalePrice: 8.0, status: "ACTIVE" },
      { productId: prodId2, name: "Acabado Brillante UV", description: "Brillo sectorizado UV brillante", price: 15.0, wholesalePrice: 12.0, status: "ACTIVE" },
    ];
    for (const pr of defaultPresentations) {
      await db.insert(presentations).values(pr).onConflictDoNothing();
    }
    console.log("Presentations seeded.");

    // 7. Seed Clients
    console.log("Seeding clients...");
    const defaultClients = [
      { name: "Juan Pérez", type: "PARTICULAR", documentType: "DNI", document: "11111111", phone: "987654321", email: "juan.perez@gmail.com", address: "Av. Larco 123", status: "ACTIVE" },
      { name: "María Rojas", type: "PARTICULAR", documentType: "DNI", document: "22222222", phone: "912345678", email: "maria.rojas@outlook.com", address: "Calle Lima 456", status: "ACTIVE" },
      { name: "Corporación Alfa S.A.C.", type: "EMPRESA", documentType: "RUC", document: "20123456789", phone: "014455667", email: "ventas@corp-alfa.pe", address: "Av. Javier Prado 1000", status: "ACTIVE", contactName: "Carlos Alfa" },
    ];
    
    let clientList: any[] = [];
    for (const cl of defaultClients) {
      const [insertedCl] = await db.insert(clients).values(cl).onConflictDoNothing().returning();
      if (insertedCl) clientList.push(insertedCl);
    }
    // Fallback if already exists
    if (clientList.length === 0) {
      clientList = await db.select().from(clients).limit(3);
    }
    console.log("Clients seeded.");

    // 8. Seed Production Orders
    console.log("Seeding production orders...");
    const today = new Date();
    const promisedDate1 = new Date(today);
    promisedDate1.setDate(today.getDate() + 2); // 2 days from now

    const promisedDate2 = new Date(today);
    promisedDate2.setDate(today.getDate() + 3); // 3 days from now

    const prodOrders = [
      { orderNumber: "OP-0001", productId: prodId1, productName: "Lona Banner 13oz Templada", clientName: "Juan Pérez", quantity: 2, branchName: "Taller Principal", status: "PENDING", promisedDate: promisedDate1, notes: "Ojales reforzados" },
      { orderNumber: "OP-0002", productId: prodId2, productName: "Tarjetas de Presentación", clientName: "Corporación Alfa S.A.C.", quantity: 10, branchName: "Taller Principal", status: "DESIGN", promisedDate: promisedDate2, notes: "Acabado Mate" }
    ];
    for (const po of prodOrders) {
      await db.insert(productionOrders).values(po).onConflictDoNothing();
    }
    console.log("Production orders seeded.");

    // 9. Seed Sales
    console.log("Seeding sales...");
    const client1 = clientList[0] || { id: 1, name: "Juan Pérez", document: "11111111", phone: "987654321", email: "juan.perez@gmail.com" };
    const client2 = clientList[1] || { id: 2, name: "María Rojas", document: "22222222", phone: "912345678", email: "maria.rojas@outlook.com" };
    const client3 = clientList[2] || { id: 3, name: "Corporación Alfa S.A.C.", document: "20123456789", phone: "014455667", email: "ventas@corp-alfa.pe" };

    // Sale 1: PENDIENTE, NOTA_DE_VENTA, EFECTIVO
    const [s1] = await db.insert(sales).values({
      saleNumber: "VEN-0001",
      clientId: client1.id,
      clientName: client1.name,
      clientDocument: client1.document,
      clientPhone: client1.phone,
      clientEmail: client1.email,
      subtotal: 100.0,
      discount: 0.0,
      tax: 0.0,
      total: 100.0,
      status: "PENDIENTE",
      paymentMethod: "EFECTIVO",
      billingType: "NOTA_DE_VENTA",
    }).onConflictDoNothing().returning();

    if (s1) {
      await db.insert(saleItems).values({
        saleId: s1.id,
        description: "Tarjetas de Presentación - Sin acabados",
        quantity: 2,
        unitPrice: 50.0,
        totalPrice: 100.0,
        promisedDate: promisedDate2,
      });
    }

    // Sale 2: PAGADA, NOTA_DE_VENTA, YAPE
    const [s2] = await db.insert(sales).values({
      saleNumber: "VEN-0002",
      clientId: client2.id,
      clientName: client2.name,
      clientDocument: client2.document,
      clientPhone: client2.phone,
      clientEmail: client2.email,
      subtotal: 45.0,
      discount: 0.0,
      tax: 0.0,
      total: 45.0,
      status: "PAGADA",
      paymentMethod: "YAPE",
      billingType: "NOTA_DE_VENTA",
    }).onConflictDoNothing().returning();

    if (s2) {
      await db.insert(saleItems).values({
        saleId: s2.id,
        description: "Lona Banner 13oz Templada",
        quantity: 1,
        unitPrice: 45.0,
        totalPrice: 45.0,
        promisedDate: promisedDate1,
      });
    }

    // Sale 3: A_CUENTA, NOTA_DE_VENTA, MULTIPLE
    const [s3] = await db.insert(sales).values({
      saleNumber: "VEN-0003",
      clientId: client3.id,
      clientName: client3.name,
      clientDocument: client3.document,
      clientPhone: client3.phone,
      clientEmail: client3.email,
      subtotal: 200.0,
      discount: 20.0,
      tax: 0.0,
      total: 180.0,
      status: "A_CUENTA",
      paymentMethod: "MULTIPLE",
      advancePayment: 90.0,
      paymentDetails: JSON.stringify({
        splitEfectivo: 40.0,
        splitYape: 50.0,
        splitPlin: 0.0,
        yapeEvidence: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }),
      billingType: "NOTA_DE_VENTA",
    }).onConflictDoNothing().returning();

    if (s3) {
      await db.insert(saleItems).values({
        saleId: s3.id,
        description: "Impresión de Tarjetas con Acabado Mate",
        quantity: 4,
        unitPrice: 50.0,
        totalPrice: 200.0,
        promisedDate: promisedDate2,
      });
    }

    // Sale 4: PAGADA, BOLETA, EFECTIVO
    const [s4] = await db.insert(sales).values({
      saleNumber: "VEN-0004",
      clientId: client1.id,
      clientName: client1.name,
      clientDocument: client1.document,
      clientPhone: client1.phone,
      clientEmail: client1.email,
      subtotal: 50.0,
      discount: 0.0,
      tax: 0.0,
      total: 50.0,
      status: "PAGADA",
      paymentMethod: "EFECTIVO",
      billingType: "BOLETA",
      billingNumber: "B001-0000001",
    }).onConflictDoNothing().returning();

    if (s4) {
      await db.insert(saleItems).values({
        saleId: s4.id,
        description: "Tarjetas de Presentación",
        quantity: 1,
        unitPrice: 50.0,
        totalPrice: 50.0,
        promisedDate: promisedDate2,
      });
    }

    // Sale 5: ANULADA, NOTA_DE_VENTA, YAPE
    const [s5] = await db.insert(sales).values({
      saleNumber: "VEN-0005",
      clientId: client2.id,
      clientName: client2.name,
      clientDocument: client2.document,
      clientPhone: client2.phone,
      clientEmail: client2.email,
      subtotal: 75.0,
      discount: 0.0,
      tax: 0.0,
      total: 75.0,
      status: "ANULADA",
      paymentMethod: "YAPE",
      billingType: "NOTA_DE_VENTA",
    }).onConflictDoNothing().returning();

    if (s5) {
      await db.insert(saleItems).values({
        saleId: s5.id,
        description: "Lona Banner 13oz Templada - Reforzada",
        quantity: 3,
        unitPrice: 25.0,
        totalPrice: 75.0,
        promisedDate: promisedDate1,
      });
    }

    console.log("Sales seeded.");
    console.log("Seed completado exitosamente");
  } catch (error) {
    console.error("Error seeding DB:", error);
  }
};

seed();