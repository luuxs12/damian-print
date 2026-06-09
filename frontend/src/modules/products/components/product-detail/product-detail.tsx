import { 
  X, Tag, ShoppingBag, FileText, Sparkles, 
  Pencil, Copy, Layers, DollarSign, History, Clock, HelpCircle 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { productsService } from "../../services/products-service";
import type { Product, ProductMaterial } from "../../types/product.types";

import "./product-detail.scss";

interface Props {
  product: Product;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDuplicateSuccess: () => void;
}

export const ProductDetail = ({ product, onClose, onEdit, onDuplicateSuccess }: Props) => {
  const [activeTab, setActiveTab] = useState<"general" | "materials" | "finishes" | "pricing" | "history">("materials");
  const [duplicating, setDuplicating] = useState(false);

  const apiUrl = (import.meta.env.VITE_API_URL as string ?? "http://localhost:4000").replace(/\/$/, "");
  const imageUrl = product.imageUrl
    ? `${apiUrl}${product.imageUrl.startsWith("/") ? product.imageUrl : `/${product.imageUrl}`}`
    : null;

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const payload = {
        name: `${product.name} (Copia)`,
        categoryId: product.categoryId,
        description: product.description || "",
        unit: product.unit,
        status: "ACTIVE" as const,
        imageUrl: product.imageUrl || null,
        manageInventory: product.manageInventory,
        countAsPrint: product.countAsPrint,
        sendToProduction: product.sendToProduction,
        branchName: product.branchName || null,
        pricePublic: Number(product.pricePublic),
        priceReseller: Number(product.priceReseller),
        priceScales: product.priceScales || [],
        specialPrices: product.specialPrices || [],
        presentations: product.presentations || [{ presentation: "General", price: Number(product.pricePublic) }],
        laborCost: Number(product.laborCost ?? 0),
        overheadCost: Number(product.overheadCost ?? 0),
        materials: product.materials || []
      };

      await productsService.createProduct(payload);
      toast.success("Producto duplicado.");
      onDuplicateSuccess();
    } catch {
      toast.error("Error al duplicar.");
    } finally {
      setDuplicating(false);
    }
  };

  const materials = (product.materials as ProductMaterial[]) || [];
  const isService = !product.manageInventory;

  const totalMaterialsCost = materials.reduce((acc: number, m: ProductMaterial) => acc + (Number(m.qty ?? 0) * Number(m.cost ?? 0)), 0);
  const laborCost = Number(product.laborCost ?? 0);
  const overheadCost = Number(product.overheadCost ?? 0);
  const estimatedCost = totalMaterialsCost + laborCost + overheadCost;
  const basePrice = Number(product.pricePublic);
  const estimatedProfit = Math.max(0, basePrice - estimatedCost);
  const profitMargin = basePrice > 0 ? (estimatedProfit / basePrice) * 100 : 0;

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Columna Izquierda: Ficha de Resumen */}
        <div className="product-detail-panel__left">
          <div className="product-showcase-header">
            {imageUrl ? (
              <div className="product-showcase-image-wrapper">
                <img src={imageUrl} alt={product.name} className="product-showcase-image" />
              </div>
            ) : (
              <div className="product-showcase-image-wrapper placeholder">
                <ShoppingBag size={38} />
                <span>Sin imagen</span>
              </div>
            )}
            <span className={`product-showcase-status-badge ${product.status === "ACTIVE" ? "active" : "inactive"}`}>
              {product.status === "ACTIVE" ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="product-showcase-info">
            <div className="product-title-group">
              <h3>{product.name}</h3>
              <div className="product-meta-badges">
                <span className="product-code-badge">{product.code}</span>
                <span className="product-type-badge">
                  {product.manageInventory ? "Producto" : "Servicio"}
                </span>
              </div>
            </div>

            <div className="product-description-group">
              <span className="info-label">Descripción</span>
              <p>{product.description || "Sin descripción registrada."}</p>
            </div>

            <div className="product-stats-list">
              <div className="stat-item">
                <Tag size={13} className="stat-icon" />
                <span className="stat-label">Categoría:</span>
                <span className="stat-value">{product.categoryName ?? "General"}</span>
              </div>
              <div className="stat-item">
                <Clock size={13} className="stat-icon" />
                <span className="stat-label">Entrega:</span>
                <span className="stat-value">{isService ? "1 día" : "Inmediato"}</span>
              </div>
              <div className="stat-item">
                <DollarSign size={13} className="stat-icon" />
                <span className="stat-label">Precio base:</span>
                <span className="stat-value">S/ {basePrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="product-showcase-actions">
            <button className="showcase-btn showcase-btn--edit" onClick={() => onEdit(product)}>
              <Pencil size={14} /> Editar
            </button>
            <button 
              className="showcase-btn showcase-btn--duplicate" 
              onClick={handleDuplicate}
              disabled={duplicating}
            >
              <Copy size={14} /> {duplicating ? "Duplicando..." : "Duplicar"}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Tabs y Detalle Completo */}
        <div className="product-detail-panel__right">
          {/* Cerrar Panel */}
          <button className="panel-close-btn" onClick={onClose} title="Cerrar panel de detalle">
            <X size={18} />
          </button>

          {/* Tab Headers */}
          <div className="panel-tabs">
            <button 
              className={`tab-link ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              Información General
            </button>
            <button 
              className={`tab-link ${activeTab === "materials" ? "active" : ""}`}
              onClick={() => setActiveTab("materials")}
            >
              Materiales / Insumos
            </button>
            <button 
              className={`tab-link ${activeTab === "finishes" ? "active" : ""}`}
              onClick={() => setActiveTab("finishes")}
            >
              Acabados
            </button>
            <button 
              className={`tab-link ${activeTab === "pricing" ? "active" : ""}`}
              onClick={() => setActiveTab("pricing")}
            >
              Precios Escalas
            </button>
            <button 
              className={`tab-link ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Historial
            </button>
          </div>

          {/* Tab Content */}
          <div className="panel-tab-content">
            
            {/* 1. Información General */}
            {activeTab === "general" && (
              <div className="tab-pane-general">
                <h4 className="pane-title"><FileText size={15} /> Especificaciones Técnicas</h4>
                <div className="specs-grid">
                  <div className="spec-card">
                    <span className="spec-title">Unidad de Medida</span>
                    <span className="spec-val">{product.unit || "Pieza"}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-title">Precio Público</span>
                    <span className="spec-val">S/ {Number(product.pricePublic).toFixed(2)}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-title">Precio Revendedor</span>
                    <span className="spec-val">S/ {Number(product.priceReseller).toFixed(2)}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-title">Control de Inventario</span>
                    <span className="spec-val">{product.manageInventory ? "Sí (Stock)" : "No (Servicio)"}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-title">Flujo de Trabajo</span>
                    <span className="spec-val">{product.sendToProduction ? "Enviar a Taller" : "Entrega Directa"}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-title">Contar Impresiones</span>
                    <span className="spec-val">{product.countAsPrint ? "Sí" : "No"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Materiales / Insumos */}
            {activeTab === "materials" && (
              <div className="tab-pane-materials">
                <div className="materials-layout">
                  {/* Tabla de Materiales */}
                  <div className="materials-table-section">
                    <h4 className="pane-title"><Layers size={15} /> Materiales y Rendimientos</h4>
                    <div className="table-wrapper">
                      <table className="materials-inline-table">
                        <thead>
                          <tr>
                            <th>Insumo</th>
                            <th>Unidad</th>
                            <th className="align-right">Cant.</th>
                            <th className="align-right">Costo U.</th>
                            <th className="align-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m, idx) => (
                            <tr key={idx}>
                              <td>{m.name}</td>
                              <td>{m.unit}</td>
                              <td className="align-right">{m.qty.toFixed(2)}</td>
                              <td className="align-right">S/ {m.cost.toFixed(2)}</td>
                              <td className="cost-total-col align-right">S/ {(m.qty * m.cost).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="total-materials-footer">
                      <span>Total insumos:</span>
                      <strong>S/ {totalMaterialsCost.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Resumen de Costos */}
                  <div className="cost-summary-card">
                    <h5>Análisis de Costo</h5>
                    <div className="summary-rows">
                      <div className="summary-row">
                        <span>Costo materiales</span>
                        <span>S/ {totalMaterialsCost.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Mano de obra</span>
                        <span>S/ {laborCost.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Costos indirectos</span>
                        <span>S/ {overheadCost.toFixed(2)}</span>
                      </div>
                      <div className="divider-line" />
                      <div className="summary-row highlight">
                        <span>Costo estimado</span>
                        <span>S/ {estimatedCost.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Precio base</span>
                        <span>S/ {basePrice.toFixed(2)}</span>
                      </div>
                      <div className="divider-line" />
                      <div className="summary-row highlight-green">
                        <span>Utilidad neta</span>
                        <strong>S/ {estimatedProfit.toFixed(2)}</strong>
                      </div>
                      <div className="summary-row highlight-green">
                        <span>Margen neto</span>
                        <strong>{profitMargin.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Acabados */}
            {activeTab === "finishes" && (
              <div className="tab-pane-finishes">
                <h4 className="pane-title"><Sparkles size={15} /> Acabados de Post-Prensa</h4>
                <div className="finishes-list">
                  {isService ? (
                    <>
                      <div className="finish-tag-card">
                        <span className="finish-name">Laminado Mate</span>
                        <p>Película protectora mate antirreflejos.</p>
                      </div>
                      <div className="finish-tag-card">
                        <span className="finish-name">Refilado Guillotina</span>
                        <p>Corte exacto a escuadra del pliego.</p>
                      </div>
                      <div className="finish-tag-card">
                        <span className="finish-name">Empacado Termoencogible</span>
                        <p>Sellado plástico protector contra humedad.</p>
                      </div>
                    </>
                  ) : (
                    <div className="no-items-placeholder">
                      <HelpCircle size={28} />
                      <p>No aplica para productos de inventario.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Precios por Cantidad (Escalas) */}
            {activeTab === "pricing" && (
              <div className="tab-pane-pricing">
                <h4 className="pane-title"><DollarSign size={15} /> Escalas de Precio de Venta</h4>
                {product.priceScales && product.priceScales.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="scales-inline-table">
                      <thead>
                        <tr>
                          <th>Rango de Cantidad</th>
                          <th className="align-right">Precio Unitario</th>
                          <th className="align-right">Descuento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.priceScales.map((scale, idx) => {
                          const discount = basePrice > 0 ? ((basePrice - scale.price) / basePrice * 100) : 0;
                          return (
                            <tr key={idx}>
                              <td>Desde {scale.minQty} unidades</td>
                              <td className="price-col align-right">S/ {Number(scale.price).toFixed(2)}</td>
                              <td className="discount-col align-right">{discount > 0 ? `-${discount.toFixed(1)}%` : "0%"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-items-placeholder">
                    <HelpCircle size={28} />
                    <p>Sin escalas configuradas.</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Historial */}
            {activeTab === "history" && (
              <div className="tab-pane-history">
                <h4 className="pane-title"><History size={15} /> Historial de Cambios</h4>
                <div className="history-timeline">
                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="timeline-info">
                      <span className="timeline-time">Hoy</span>
                      <p className="timeline-desc">Visualización de ficha técnica</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="timeline-info">
                      <span className="timeline-time">
                        {new Date(product.createdAt).toLocaleDateString("es-PE", {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                      <p className="timeline-desc">Registrado por {product.createdByUsername || "Admin"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
