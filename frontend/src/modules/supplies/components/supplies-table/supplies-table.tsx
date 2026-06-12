/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import {
  Boxes, TrendingUp, DollarSign,
  Pencil, Trash2,
  ChevronLeft, ChevronRight, XCircle,
} from "lucide-react";
import { toast }         from "sonner";
import { ConfirmModal }  from "@/shared/components/ui/confirm-modal";
import { generatePageNumbers } from "@/shared/utils/pagination";

import { suppliesService } from "../../services/supplies-service";
import type { Supply }     from "../../types/supply.types";

import "./supplies-table.scss";

const ITEMS_PER_PAGE = 5;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

interface Props {
  refreshKey: number;
  onEdit: (s: Supply) => void;
  onDeleteSuccess?: (msg: string) => void;
}

export const SuppliesTable = ({ refreshKey, onEdit, onDeleteSuccess }: Props) => {
  const [supplies,    setSupplies]    = useState<Supply[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterUnit,  setFilterUnit]  = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);

  /* ── Carga de datos ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await suppliesService.getSupplies();
      setSupplies(data);
    } catch {
      toast.error("Error al cargar los insumos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  /* ── Filtros ── */
  const filtered = supplies.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.description?.toLowerCase().includes(q) ?? false);
    const matchUnit = filterUnit === "" || s.unit === filterUnit;
    return matchSearch && matchUnit;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterUnit]);


  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await suppliesService.deleteSupply(deleteId);
      setSupplies((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("Insumo eliminado.");
      if (onDeleteSuccess) {
        onDeleteSuccess("¡Insumo eliminado con éxito!");
      }
    } catch {
      toast.error("No se pudo eliminar el insumo.");
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Cálculos de KPIs ── */
  const totalInsumos = supplies.length;
  const activos      = supplies.filter(s => s.status === "ACTIVE").length;
  const inactivos    = totalInsumos - activos;
  const costoPromedio = totalInsumos > 0 ? supplies.reduce((acc, s) => acc + s.cost, 0) / totalInsumos : 0;

  // Obtener unidades únicas para el filtro
  const uniqueUnits = Array.from(new Set(supplies.map(s => s.unit))).filter(Boolean);

  return (
    <div className="supplies-module">

      {/* ── KPIs ── */}
      <div className="supplies-kpis">
        <div className="sup-kpi sup-kpi--teal">
          <div className="sup-kpi__icon"><Boxes size={22} /></div>
          <div className="sup-kpi__info">
            <span>Total Insumos</span>
            <h3>{totalInsumos}</h3>
          </div>
        </div>
        <div className="sup-kpi sup-kpi--green">
          <div className="sup-kpi__icon"><TrendingUp size={22} /></div>
          <div className="sup-kpi__info">
            <span>Activos</span>
            <h3>{activos}</h3>
          </div>
        </div>
        <div className="sup-kpi sup-kpi--orange">
          <div className="sup-kpi__icon"><XCircle size={22} /></div>
          <div className="sup-kpi__info">
            <span>Inactivos</span>
            <h3>{inactivos}</h3>
          </div>
        </div>
        <div className="sup-kpi sup-kpi--blue">
          <div className="sup-kpi__icon"><DollarSign size={22} /></div>
          <div className="sup-kpi__info">
            <span>Costo Promedio</span>
            <h3>S/. {costoPromedio.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* ── Tarjeta de tabla ── */}
      <div className="supplies-card">
        <div className="supplies-card__top">
          <h2>Listado de insumos</h2>
          <div className="supplies-card__top-actions">
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
              <option value="">Todas las unidades</option>
              {uniqueUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="supplies-table-wrapper">
          <table className="supplies-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Insumo / Descripción</th>
                <th>Unidad</th>
                <th>Costo Unit.</th>
                <th>Estado</th>
                <th>Fecha Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="supplies-table__empty">Cargando...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="supplies-table__empty">No hay insumos registrados.</td>
                </tr>
              ) : (
                paginated.map((s) => {
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="sup-code">{s.code}</span>
                      </td>
                      <td>
                        <div className="sup-name-cell">
                          <span className="sup-name">{s.name}</span>
                          {s.description && (
                            <span className="sup-sub">{s.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="sup-unit">{s.unit}</span>
                      </td>
                      <td>
                        <span className="sup-cost">S/. {s.cost.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${s.status === "ACTIVE" ? "active" : "inactive"}`}>
                          {s.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <span className="sup-date">{formatDate(s.createdAt)}</span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="edit-btn"
                            onClick={() => onEdit(s)}
                            title="Editar insumo"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => setDeleteId(s.id)}
                            title="Eliminar insumo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ── */}
        {!loading && totalPages > 1 && (
          <div className="supplies-pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="pag-btn"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="pag-numbers">
              {generatePageNumbers(currentPage, totalPages).map((pageNum, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof pageNum === "number" && setCurrentPage(pageNum)}
                  className={`pag-num-btn${currentPage === pageNum ? " active" : ""}${
                    pageNum === "..." ? " disabled" : ""
                  }`}
                  disabled={pageNum === "..."}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pag-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {deleteId !== null && (
        <ConfirmModal
          title="Eliminar Insumo"
          description="¿Está seguro de que desea eliminar este insumo? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
          confirmLabel="Eliminar"
          icon="delete"
        />
      )}

    </div>
  );
};
