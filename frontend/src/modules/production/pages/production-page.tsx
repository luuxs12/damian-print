/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import { 
  Calendar as CalendarIcon, 
  LayoutGrid, 

  Search, 
  Plus,
  RefreshCw,
  X
} from "lucide-react";
import { toast } from "sonner";
import { productionService, type ProductionOrder } from "../services/production-service";
import { ProductionKanban } from "../components/production-kanban/production-kanban";
import { ProductionCalendar } from "../components/production-calendar/production-calendar";
import { ProductionOrderDetail } from "../components/production-order-detail/production-order-detail";
import "./production-page.scss";

export const ProductionPage: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  
  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newBranch, setNewBranch] = useState("Local Principal");
  const [newPromisedDate, setNewPromisedDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productionService.getProductionOrders();
      setOrders(data);
    } catch {
      toast.error("Error al obtener órdenes de producción");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await productionService.updateProductionOrder(id, { status });
      // Update local state
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status: status as ProductionOrder["status"] } : order))
      );
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, status: status as ProductionOrder["status"] } : null);
      }
    } catch {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleUpdateDetails = async (id: number, data: { status: string; branchName: string; promisedDate: string; notes: string }) => {
    try {
      const updated = await productionService.updateProductionOrder(id, data);
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );
      setSelectedOrder(null);
    } catch {
      toast.error("Error al actualizar la orden");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    try {
      await productionService.deleteProductionOrder(id);
      setOrders((prev) => prev.filter((order) => order.id !== id));
      setSelectedOrder(null);
      toast.success("Orden eliminada correctamente");
    } catch {
      toast.error("Error al eliminar la orden");
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient || !newProduct || !newPromisedDate) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    try {
      const newOrder = await productionService.createProductionOrder({
        clientName: newClient,
        productName: newProduct,
        quantity: newQuantity,
        branchName: newBranch,
        status: "PENDING",
        promisedDate: new Date(newPromisedDate).toISOString(),
        notes: newNotes
      });

      setOrders((prev) => [newOrder, ...prev]);
      setShowCreateModal(false);
      toast.success("Orden creada correctamente");
      
      // Reset form
      setNewClient("");
      setNewProduct("");
      setNewQuantity(1);
      setNewBranch("Local Principal");
      setNewPromisedDate("");
      setNewNotes("");
    } catch {
      toast.error("Error al crear la orden de producción");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    return (
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.clientName.toLowerCase().includes(search.toLowerCase()) ||
      order.productName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="production-page-wrap">
      {/* Page Header */}
      <div className="production-page-header">
        <div className="header-title">
          <div>
            <h1>Producción y Órdenes</h1>
            <p>Monitoreo de órdenes de producción y calendario de entregas.</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchOrders} title="Recargar">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
          
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* Filters & View switcher */}
      <div className="production-controls">
        <div className="search-and-filters">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por orden, cliente o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>


        </div>

        <div className="view-switcher-tabs">
          <button
            className={`tab-btn ${viewMode === "kanban" ? "active" : ""}`}
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid size={16} />

            <span>Tablero Kanban</span>
          </button>
          
          <button
            className={`tab-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon size={16} />
            <span>Calendario</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading && orders.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando órdenes de producción...</p>
        </div>
      ) : (
        <div className="production-content-body">
          {viewMode === "kanban" ? (
            <ProductionKanban
              orders={filteredOrders}
              onUpdateStatus={handleUpdateStatus}
              onSelectOrder={setSelectedOrder}
            />
          ) : (
            <ProductionCalendar
              orders={filteredOrders}
              onSelectOrder={setSelectedOrder}
            />
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <ProductionOrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleUpdateDetails}
          onDelete={handleDeleteOrder}
        />
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="production-form-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="production-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="production-form-header">
              <div className="production-form-header__icon">
                <Plus size={20} />
              </div>
              <div>
                <h2>Nueva Orden</h2>
                <p>Crear nueva orden de producción manual</p>
              </div>
              <button className="production-form-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="production-form">
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>

              <div className="form-group">
                <label>Producto a Producir</label>
                <input
                  type="text"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="Ej. Banner Publicitario 2x1m"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cantidad</label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Math.max(1, Number(e.target.value)))}
                  min={1}
                  required
                />
              </div>

              <div className="form-group">
                <label>Fecha y Hora Prometida de Entrega</label>
                <input
                  type="datetime-local"
                  value={newPromisedDate}
                  onChange={(e) => setNewPromisedDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notas / Instrucciones</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre terminaciones, ojales, laminado, etc."
                  rows={3}
                />
              </div>

              <div className="production-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
