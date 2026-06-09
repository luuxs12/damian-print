/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { X, Trash2, User, Package, Hash, Building2 } from "lucide-react";

import type { ProductionOrder } from "../../services/production-service";
import "./production-order-detail.scss";

interface ProductionOrderDetailProps {
  order: ProductionOrder | null;
  onClose: () => void;
  onUpdate: (id: number, data: { status: string; branchName: string; promisedDate: string; notes: string }) => void;
  onDelete: (id: number) => void;
}

export const ProductionOrderDetail: React.FC<ProductionOrderDetailProps> = ({
  order,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [status, setStatus] = useState("PENDING");
  const [branchName, setBranchName] = useState("Local Principal");
  const [promisedDate, setPromisedDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setBranchName(order.branchName);
      
      // Format promisedDate to YYYY-MM-DDTHH:MM for datetime-local input
      const date = new Date(order.promisedDate);
      const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      setPromisedDate(localISOTime);
      
      setNotes(order.notes || "");
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(order.id, {
      status,
      branchName,
      promisedDate: new Date(promisedDate).toISOString(),
      notes
    });
  };

  const handleDeleteClick = () => {
    if (window.confirm("¿Está seguro de que desea eliminar esta orden de producción?")) {
      onDelete(order.id);
    }
  };

  return (
    <div className="production-form-overlay" onClick={onClose}>
      <div className="production-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="production-form-header">
          <div className="production-form-header__icon">
            <Building2 size={20} />
          </div>
          <div>
            <h2>Detalle de Orden</h2>
            <p>Orden de producción {order.orderNumber}</p>
          </div>
          <button className="production-form-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="production-form">
          <div className="order-info-section">
            <div className="info-row">
              <div className="info-item">
                <div className="info-label">
                  <User size={13} />
                  <span>Cliente</span>
                </div>
                <div className="info-value">{order.clientName}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <Package size={13} />
                  <span>Producto</span>
                </div>
                <div className="info-value">{order.productName}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Hash size={13} />
                  <span>Cantidad</span>
                </div>
                <div className="info-value font-bold">{order.quantity} pzas</div>
              </div>
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label>Estado de Producción</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="PENDING">Pendiente</option>
                <option value="DESIGN">Diseño</option>
                <option value="PRINTING">Impresión</option>
                <option value="FINISHING">Acabado</option>
                <option value="READY">Listo para entrega</option>
                <option value="DELIVERED">Entregado</option>
              </select>
            </div>

          </div>

          <div className="form-group">
            <label>Fecha y Hora Prometida</label>
            <input
              type="datetime-local"
              value={promisedDate}
              onChange={(e) => setPromisedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Notas / Instrucciones Especiales</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle instrucciones de acabado, colores especiales, etc."
              rows={3}
            />
          </div>

          <div className="production-form-actions">
            <button
              type="button"
              className="btn-delete"
              onClick={handleDeleteClick}
              title="Eliminar Orden"
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
