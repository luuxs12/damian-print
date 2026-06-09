/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useMemo } from "react";
import { 
   RefreshCw, 
   Eye, 
   FileText, 
   X,
   ChevronLeft,
   ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { auditService, AuditLog } from "../../services/audit-service";
import { generatePageNumbers } from "@/shared/utils/pagination";
import "./audit-logs-table.scss";

// Local fallback formatting in case backend has not restarted or has old logs in memory
const formatDocumentDetail = (log: AuditLog): string => {
  const action = log.action.toUpperCase();
  const mod = log.module.toLowerCase();
  
  if (!log.details) {
    return `Acción ${log.action} realizada en el módulo ${log.module}`;
  }

  const name = log.details.name || "";
  const username = log.details.username || "";
  const statusStr = log.details.status === "ACTIVE" ? "Activo" : log.details.status === "INACTIVE" ? "Inactivo" : "";

  if (action === "CREAR") {
    if (mod.includes("categor")) return `Se creó la categoría "${name}"`;
    if (mod.includes("product")) return `Se creó el producto "${name}"`;
    if (mod.includes("presenta")) {
      const priceVal = log.details.price != null ? ` con precio de venta S/ ${Number(log.details.price).toFixed(2)}` : "";
      return `Se creó la presentación "${name}"${priceVal}`;
    }
    if (mod.includes("usuario")) return `Se creó el usuario "${username}"`;
    if (mod.includes("rol")) return `Se creó el perfil de rol "${name}"`;
    return `Se creó un registro en el módulo ${log.module}`;
  }

  if (action === "EDITAR" || action === "ACTUALIZAR") {
    const isToggle = log.details.notes === "Toggle de estado" || (log.details.status !== undefined && Object.keys(log.details).length <= 3);
    if (isToggle) {
      const entityName = name || username || "";
      const entityStr = entityName ? ` "${entityName}"` : "";
      return `Se cambió el estado de ${entityStr} a ${statusStr}`;
    }

    if (mod.includes("categor")) return `Se modificaron los datos de la categoría "${name}"`;
    if (mod.includes("product")) return `Se modificaron los datos del producto "${name}"`;
    if (mod.includes("presenta")) return `Se modificaron los datos de la presentación "${name}"`;
    if (mod.includes("usuario")) return `Se modificaron los datos del usuario "${username}"`;
    if (mod.includes("rol")) return `Se modificaron los datos del perfil de rol "${name}"`;
    return `Se actualizaron los datos en el módulo ${log.module}`;
  }

  if (action === "ELIMINAR") {
    if (mod.includes("categor")) return `Se eliminó la categoría "${name || 'N/A'}"`;
    if (mod.includes("product")) return `Se eliminó el producto "${name || 'N/A'}"`;
    if (mod.includes("presenta")) return `Se eliminó la presentación "${name || 'N/A'}"`;
    if (mod.includes("usuario")) return `Se eliminó el usuario "${username || 'N/A'}"`;
    if (mod.includes("rol")) return `Se eliminó el perfil de rol "${name || 'N/A'}"`;
    return `Se eliminó un registro del módulo ${log.module}`;
  }

  return `Acción ${log.action} realizada en el módulo ${log.module}`;
};

const renderFriendlyDetails = (details: Record<string, unknown>) => {
  if (!details) return <p className="details-empty">Sin información adicional</p>;

  const labelMap: Record<string, string> = {
    name: "Nombre",
    username: "Nombre de Usuario",
    email: "Correo Electrónico",
    role: "Perfil / Rol",
    price: "Precio de Venta",
    status: "Estado del Registro",
    description: "Descripción",
    notes: "Notas adicionales",
  };

  const formatValue = (key: string, val: unknown) => {
    if (val === null || val === undefined) return "No especificado";
    if (key === "status") {
      return val === "ACTIVE" ? "Activo" : val === "INACTIVE" ? "Inactivo" : val;
    }
    if (key === "price") {
      return `S/ ${Number(val).toFixed(2)}`;
    }
    return String(val);
  };

  const keys = Object.keys(details).filter(
    (k) => k !== "id" && k !== "userId" && k !== "categoryId" && k !== "productId"
  );

  if (keys.length === 0) {
    return <p className="details-empty">Acción sin campos adicionales.</p>;
  }

  return (
    <div className="friendly-details-grid">
      {keys.map((key) => {
        const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
        const displayVal = formatValue(key, details[key]);
        return (
          <div key={key} className="detail-item">
            <span className="detail-item__label">{label}</span>
            <span className="detail-item__value">{String(displayVal)}</span>
          </div>
        );
      })}
    </div>
  );
};

export const AuditLogsTable = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetails, setActiveDetails] = useState<Record<string, unknown> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs();
      setLogs(data);
      setCurrentPage(1);
    } catch {
      toast.error("Error al cargar la auditoría del sistema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleOpenDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    
    // Fallback: If details are already present locally (old API format), use them directly
    if (log.details) {
      setActiveDetails(log.details);
      setDetailsLoading(false);
      return;
    }

    setDetailsLoading(true);
    setActiveDetails(null);
    try {
      const data = await auditService.getLogDetails(log.id);
      setActiveDetails(data);
    } catch {
      toast.error("Error al cargar los detalles del registro.");
      setSelectedLog(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Get unique modules list for filters
  const uniqueModules = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.module)));
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const descText = log.description || formatDocumentDetail(log);
      const matchesSearch = 
        log.username.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        descText.toLowerCase().includes(search.toLowerCase());
        
      const matchesAction = selectedAction === "ALL" || log.action === selectedAction;
      const matchesModule = selectedModule === "ALL" || log.module === selectedModule;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [logs, search, selectedAction, selectedModule]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const getActionBadgeClass = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREAR":
        return "audit-badge audit-badge--create";
      case "EDITAR":
        return "audit-badge audit-badge--edit";
      case "ELIMINAR":
        return "audit-badge audit-badge--delete";
      default:
        return "audit-badge audit-badge--default";
    }
  };

  return (
    <div className="audit-module">
      
      {/* Tarjeta de Contenedor de la Tabla */}
      <div className="audit-card">
        
        {/* Barra superior con filtros */}
        <div className="audit-card__top">
          <h2>Listado de auditoría</h2>
          <div className="audit-card__top-actions">
            <input 
              type="text" 
              placeholder="Buscar por usuario o detalle..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />

            <select 
              value={selectedModule} 
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Todos los módulos</option>
              {uniqueModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>

            <select 
              value={selectedAction} 
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Todas las acciones</option>
              <option value="CREAR">CREAR</option>
              <option value="EDITAR">EDITAR</option>
              <option value="ELIMINAR">ELIMINAR</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Detalle del documento</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="audit-table__empty">
                    <RefreshCw className="spin" size={18} style={{ marginRight: 8 }} />
                    Cargando auditorías...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="audit-table__empty">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const descText = log.description || formatDocumentDetail(log);
                  const hasDetails = log.hasDetails !== undefined ? log.hasDetails : (!!log.details && Object.keys(log.details).length > 0);
                  
                  return (
                    <tr key={log.id}>
                      
                      {/* Fecha y Hora */}
                      <td className="date-cell">
                        {new Date(log.createdAt).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </td>

                      {/* Usuario */}
                      <td>
                        <span className="user-text">{log.username}</span>
                      </td>

                      {/* Módulo */}
                      <td>
                        <span className="module-badge">{log.module}</span>
                      </td>

                      {/* Acción */}
                      <td>
                        <span className={getActionBadgeClass(log.action)}>
                          {log.action}
                        </span>
                      </td>

                      {/* Detalle del documento */}
                      <td>
                        <div className="doc-detail-wrapper">
                          <span className="details-preview" title={descText}>
                            {descText}
                          </span>
                          
                          {hasDetails && (
                            <button 
                              onClick={() => handleOpenDetails(log)}
                              className="view-btn"
                              title="Ver Detalle"
                            >
                              <Eye size={14} />
                              <span>Ver Detalle</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="shared-pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          {generatePageNumbers(currentPage, totalPages).map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }
            return (
              <button
                key={page}
                disabled={loading}
                onClick={() => setCurrentPage(Number(page))}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            title="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

      </div>

      {/* Modal Detalle de Registro */}
      {selectedLog && (
        <div className="audit-modal-overlay">
          <div className="audit-modal-content">
            <div className="audit-modal-header">
              <div className="audit-modal-title">
                <FileText size={18} />
                <h3>Detalle del Registro</h3>
              </div>
              <button 
                onClick={() => { setSelectedLog(null); setActiveDetails(null); }} 
                className="audit-modal-close"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="audit-modal-body">
              <div className="audit-modal-info-grid">
                <div>
                  <strong>Módulo:</strong> <span>{selectedLog.module}</span>
                </div>
                <div>
                  <strong>Acción:</strong> <span className={getActionBadgeClass(selectedLog.action)}>{selectedLog.action}</span>
                </div>
                <div>
                  <strong>Ejecutado por:</strong> <span>{selectedLog.username}</span>
                </div>
                <div>
                  <strong>Fecha y Hora:</strong> <span>{new Date(selectedLog.createdAt).toLocaleString("es-PE")}</span>
                </div>
              </div>

              {detailsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0", gap: 12 }}>
                  <RefreshCw className="spin" size={24} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Cargando metadatos...</span>
                </div>
              ) : activeDetails ? (
                renderFriendlyDetails(activeDetails)
              ) : (
                <p className="details-empty">Sin metadatos para este registro.</p>
              )}
            </div>

            <div className="audit-modal-footer">
              <button 
                onClick={() => { setSelectedLog(null); setActiveDetails(null); }} 
                className="audit-btn-close-modal"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
