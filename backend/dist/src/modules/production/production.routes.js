import { productionController } from "./production.controller";
import { requirePermission } from "../../middlewares/authenticate";
export async function productionRoutes(app) {
    // Get all orders
    app.get("/", { preHandler: requirePermission("Producción") }, productionController.getProductionOrders);
    // Create order
    app.post("/", { preHandler: requirePermission("Producción") }, productionController.createProductionOrder);
    // Update order
    app.put("/:id", { preHandler: requirePermission("Producción") }, productionController.updateProductionOrder);
    // Delete order
    app.delete("/:id", { preHandler: requirePermission("Producción") }, productionController.deleteProductionOrder);
}
