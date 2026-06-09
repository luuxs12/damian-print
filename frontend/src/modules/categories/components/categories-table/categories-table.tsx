import { useEffect, useState } from "react";
import { Pencil, Trash2, Layers, CheckCircle2, XCircle, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { generatePageNumbers } from "@/shared/utils/pagination";

import { categoriesService } from "../../services/categories-service";
import type { Category } from "../../types/category.types";

/* eslint-disable react-hooks/set-state-in-effect */
import "./categories-table.scss";

interface Props {
  onEdit:     (cat: Category) => void;
  refreshKey: number;
}

export const CategoriesTable = ({ onEdit, refreshKey }: Props) => {

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* Cargar categorías */
  useEffect(() => {
    setLoading(true);
    categoriesService.getCategories()
      .then(setCategories)
      .catch(() => toast.error("Error al cargar categorías"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  /* Filtrar por búsqueda */
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedCategories = filtered.slice(
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
      await categoriesService.deleteCategory(deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Categoría eliminada");
    } catch {
      toast.error("No se pudo eliminar la categoría");
    } finally {
      setDeleteId(null);
    }
  };


  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.status === "ACTIVE").length;
  const inactiveCategories = categories.filter(c => c.status === "INACTIVE").length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productsCount ?? 0), 0);

  return (
    <div className="categories-module">
      
      {/* ── KPIs ── */}
      <div className="categories-kpis">
        <div className="cat-kpi cat-kpi--blue">
          <div className="cat-kpi__icon"><Layers size={24} /></div>
          <div className="cat-kpi__info">
            <span>Total Categorías</span>
            <h3>{totalCategories}</h3>
          </div>
        </div>

        <div className="cat-kpi cat-kpi--green">
          <div className="cat-kpi__icon"><CheckCircle2 size={24} /></div>
          <div className="cat-kpi__info">
            <span>Activas</span>
            <h3>{activeCategories}</h3>
          </div>
        </div>

        <div className="cat-kpi cat-kpi--orange">
          <div className="cat-kpi__icon"><XCircle size={24} /></div>
          <div className="cat-kpi__info">
            <span>Inactivas</span>
            <h3>{inactiveCategories}</h3>
          </div>
        </div>

        <div className="cat-kpi cat-kpi--purple">
          <div className="cat-kpi__icon"><Package size={24} /></div>
          <div className="cat-kpi__info">
            <span>Productos</span>
            <h3>{totalProducts}</h3>
          </div>
        </div>
      </div>

      <div className="categories-card">

      {/* Barra superior */}
      <div className="categories-card__top">
        <h2>Listado de categorías</h2>
        <input
          type="text"
          placeholder="Buscar categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="categories-table-wrapper">
        <table className="categories-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Nombre de la Categoría</th>
              <th>Descripción</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="categories-table__empty">Cargando...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="categories-table__empty">
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              paginatedCategories.map((cat, i) => (
                <tr key={cat.id}>
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                  <td>
                    <span className="category-name-badge">
                      <Layers size={14} /> {cat.name}
                    </span>
                  </td>
                  <td>{cat.description || <span className="no-desc">—</span>}</td>
                  <td>
                    <span className="cat-products-count">
                      {cat.productsCount ?? 0}
                    </span>
                  </td>
                  <td>
                    <span className={`cat-status-badge cat-status-badge--${cat.status === "ACTIVE" ? "active" : "inactive"}`}>
                      {cat.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="cat-actions">

                      {/* Editar */}
                      <button
                        className="cat-btn cat-btn--edit"
                        onClick={() => onEdit(cat)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Eliminar */}
                      <button
                        className="cat-btn cat-btn--delete"
                        onClick={() => setDeleteId(cat.id)}
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

      {/* Modal de confirmación de eliminación */}
      {deleteId !== null && (
        <ConfirmModal
          title="¿Eliminar categoría?"
          description="Esta acción no se puede deshacer y eliminará la categoría permanentemente."
          onConfirm={confirmDelete}
          onClose={() => setDeleteId(null)}
          confirmLabel="Eliminar"
          icon="delete"
        />
      )}
    </div>
  );
};
