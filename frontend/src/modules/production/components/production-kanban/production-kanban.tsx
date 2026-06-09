import React from "react";
import { 
  Clock, 
  Paintbrush, 
  Printer, 
  Wrench, 
  CheckCircle2, 
  Truck,
  Building2,
  AlertTriangle,
  FileText
} from "lucide-react";
import type { ProductionOrder } from "../../services/production-service";
import "./production-kanban.scss";

interface ProductionKanbanProps {
  orders: ProductionOrder[];
  onUpdateStatus: (id: number, status: string) => void;
  onSelectOrder: (order: ProductionOrder) => void;
}

const COLUMNS = [
  { key: "PENDING", label: "Pendiente", color: "var(--text-secondary)", icon: Clock, className: "col-pending" },
  { key: "DESIGN", label: "Diseño", color: "#3b82f6", icon: Paintbrush, className: "col-design" },
  { key: "PRINTING", label: "Impresión", color: "#f59e0b", icon: Printer, className: "col-printing" },
  { key: "FINISHING", label: "Acabado", color: "#8b5cf6", icon: Wrench, className: "col-finishing" },
  { key: "READY", label: "Listo", color: "#10b981", icon: CheckCircle2, className: "col-ready" },
  { key: "DELIVERED", label: "Entregado", color: "#94a3b8", icon: Truck, className: "col-delivered" }
] as const;

export const ProductionKanban: React.FC<ProductionKanbanProps> = ({
  orders,
  onUpdateStatus,
  onSelectOrder
}) => {
  const isDelayed = (dateStr: string, status: string) => {
    if (status === "READY" || status === "DELIVERED") return false;
    return new Date(dateStr) < new Date();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="production-kanban-board">
      {COLUMNS.map((col) => {
        const colOrders = orders.filter((o) => o.status === col.key);
        const IconComponent = col.icon;

        return (
          <div key={col.key} className={`kanban-column ${col.className}`}>
            <div className="column-header">
              <div className="column-title-wrap">
                <IconComponent size={18} style={{ color: col.color }} />
                <h3>{col.label}</h3>
              </div>
              <span className="column-count">{colOrders.length}</span>
            </div>

            <div className="column-cards-container">
              {colOrders.length === 0 ? (
                <div className="column-empty-state">Sin órdenes</div>
              ) : (
                colOrders.map((order) => {
                  const delayed = isDelayed(order.promisedDate, order.status);

                  return (
                    <div 
                      key={order.id} 
                      className={`kanban-card ${delayed ? "card-delayed" : ""}`}
                      onClick={() => onSelectOrder(order)}
                    >
                      <div className="card-header">
                        <span className="order-number">{order.orderNumber}</span>
                        {delayed && (
                          <span className="delay-badge">
                            <AlertTriangle size={12} />
                            Retrasado
                          </span>
                        )}
                      </div>

                      <h4 className="product-name">{order.productName}</h4>
                      
                      <div className="client-name-wrap">
                        <span className="client-label">Cliente:</span>
                        <span className="client-val">{order.clientName}</span>
                      </div>

                      <div className="quantity-wrap">
                        <span>Cant: <strong>{order.quantity}</strong></span>
                      </div>

                      <div className="card-footer">
                        <div className="branch-info">
                          <Building2 size={12} />
                          <span>{order.branchName}</span>
                        </div>
                        <div className="date-info">
                          <span>Entrega: {formatDate(order.promisedDate)}</span>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="card-notes-preview">
                          <FileText size={12} />
                          <p>{order.notes}</p>
                        </div>
                      )}

                      <div className="status-selector-wrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="DESIGN">Diseño</option>
                          <option value="PRINTING">Impresión</option>
                          <option value="FINISHING">Acabado</option>
                          <option value="READY">Listo</option>
                          <option value="DELIVERED">Entregado</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
