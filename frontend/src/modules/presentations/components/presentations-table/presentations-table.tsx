/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Pencil, Trash2, Boxes, CheckCircle2, XCircle, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { presentationsService } from "../../services/presentations-service";
import type { Presentation } from "../../types/presentations.types";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { generatePageNumbers } from "@/shared/utils/pagination";

import "./presentations-table.scss";

interface Props {
  onEdit:     (pres: Presentation) => void;
  refreshKey: number;
}

export const PresentationsTable = ({ onEdit, refreshKey }: Props) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [currentPage,   setCurrentPage]   = useState(1);

  /* Cargar presentaciones */
  useEffect(() => {
    setLoading(true);
    presentationsService.getPresentations()
      .then(setPresentations)
      .catch(() => toast.error("Error al cargar presentaciones"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  /* Filtrar por búsqueda (nombre, descripción, producto o categoría) */
  const filtered = presentations.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.categoryName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedPresentations = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* Confirmar eliminación */
  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await presentationsService.deletePresentation(deleteId);
      setPresentations((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success("Presentación eliminada");
    } catch {
      toast.error("No se pudo eliminar la presentación");
    } finally {
      setDeleteId(null);
    }
  };

  const totalPresentations = presentations.length;
  const activePresentations = presentations.filter(p => p.status === "ACTIVE").length;
  const inactivePresentations = presentations.filter(p => p.status === "INACTIVE").length;

  return (
    <div className="presentations-module">
      
      {/* ── KPIs ── */}
      <div className="presentations-kpis">
        <div className="pres-kpi pres-kpi--blue">
          <div className="pres-kpi__icon"><Boxes size={24} /></div>
          <div className="pres-kpi__info">
            <span>Total Presentaciones</span>
            <h3>{totalPresentations}</h3>
          </div>
        </div>

        <div className="pres-kpi pres-kpi--green">
          <div className="pres-kpi__icon"><CheckCircle2 size={24} /></div>
          <div className="pres-kpi__info">
            <span>Activas</span>
            <h3>{activePresentations}</h3>
          </div>
        </div>

        <div className="pres-kpi pres-kpi--orange">
          <div className="pres-kpi__icon"><XCircle size={24} /></div>
          <div className="pres-kpi__info">
            <span>Inactivas</span>
            <h3>{inactivePresentations}</h3>
          </div>
        </div>
      </div>

      <div className="presentations-card">

        {/* Barra superior */}
        <div className="presentations-card__top">
          <h2>Listado de presentaciones</h2>
          <input
            type="text"
            placeholder="Buscar presentación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabla */}
        <div className="presentations-table-wrapper">
          <table className="presentations-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Presentación</th>
                <th>Producto / Categoría</th>
                <th>Especificaciones</th>
                <th>Precios y Costos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="presentations-table__empty">Cargando...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="presentations-table__empty">
                    No hay presentaciones registradas
                  </td>
                </tr>
              ) : (
                paginatedPresentations.map((pres, i) => (
                  <tr key={pres.id}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td>
                      <span className="presentation-name-badge">
                        <Boxes size={14} /> {pres.name}
                      </span>
                    </td>
                    <td>
                      <div className="product-category-cell">
                        <strong className="product-name">{pres.productName ?? "S/P"}</strong>
                        <span className="category-badge">
                          <Tag size={10} /> {pres.categoryName ?? "General"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="specs-cell">
                        {pres.size && <span><strong>Tam:</strong> {pres.size}</span>}
                        {pres.material && <span><strong>Mat:</strong> {pres.material}</span>}
                        {pres.finish && <span><strong>Acab:</strong> {pres.finish}</span>}
                        {pres.color && <span><strong>Color:</strong> {pres.color}</span>}
                        {!pres.size && !pres.material && !pres.finish && !pres.color && (
                          <span className="no-specs">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="pricing-cell">
                        <span><strong>Costo:</strong> S/ {Number(pres.cost).toFixed(2)}</span>
                        <span className="text-primary-color"><strong>P. Venta:</strong> S/ {Number(pres.price).toFixed(2)}</span>
                        {pres.wholesalePrice > 0 && (
                          <span className="text-secondary-color"><strong>P. Mayor:</strong> S/ {Number(pres.wholesalePrice).toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`pres-status-badge pres-status-badge--${pres.status === "ACTIVE" ? "active" : "inactive"}`}>
                        {pres.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="pres-actions">
                        {/* Editar */}
                        <button
                          className="pres-btn pres-btn--edit"
                          onClick={() => onEdit(pres)}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>

                        {/* Eliminar */}
                        <button
                          className="pres-btn pres-btn--delete"
                          onClick={() => setDeleteId(pres.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="shared-pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
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
                onClick={() => setCurrentPage(Number(page))}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

      </div>

      {deleteId !== null && (
        <ConfirmModal
          title="¿Eliminar presentación?"
          description="Esta acción eliminará la presentación permanentemente de la base de datos."
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};
