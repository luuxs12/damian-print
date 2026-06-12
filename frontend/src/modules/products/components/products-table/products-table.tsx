/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Pencil, Trash2, Eye, ShoppingBag,
  CheckCircle2, XCircle, Package, Layers,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { generatePageNumbers } from "@/shared/utils/pagination";

import { productsService } from "../../services/products-service";
import { categoriesService } from "../../../categories/services/categories-service";
import type { Product } from "../../types/product.types";
import type { Category } from "../../../categories/types/category.types";
import { ProductDetail } from "../product-detail/product-detail";

import "./products-table.scss";

interface Props {
  onEdit: (product: Product) => void;
  refreshKey: number;
  onDeleteSuccess?: (msg: string) => void;
}

export const ProductsTable = ({ onEdit, refreshKey, onDeleteSuccess }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewProduct, setViewProductState] = useState<Product | null>(null);
  const viewProductRef = useRef<Product | null>(null);
  const setViewProduct = (p: Product | null) => {
    viewProductRef.current = p;
    setViewProductState(p);
  };
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  /* Cargar datos */
  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      productsService.getProducts(),
      categoriesService.getCategories(),
    ])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
        // Sync selected view product
        const currentViewed = viewProductRef.current;
        if (currentViewed) {
          const updated = prods.find((p) => p.id === currentViewed.id);
          if (updated) {
            setViewProduct(updated);
          }
        }
      })
      .catch(() => toast.error("Error al cargar los productos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  /* Filtrar */
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    const matchCat = filterCategoryId === "" || p.categoryId === Number(filterCategoryId);
    const matchStatus = filterStatus === "" || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterCategoryId, filterStatus]);

  /* Confirmar eliminación */
  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await productsService.deleteProduct(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success("Producto eliminado.");
      if (onDeleteSuccess) {
        onDeleteSuccess("¡Producto eliminado con éxito!");
      }
    } catch {
      toast.error("No se pudo eliminar el producto.");
    } finally {
      setDeleteId(null);
    }
  };

  /* Abrir ficha detalle */
  const handleViewDetail = async (id: number) => {
    try {
      const full = await productsService.getProductById(id);
      setViewProduct(full);
    } catch {
      toast.error("Error al cargar la ficha del producto.");
    }
  };

  /* Stats */
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "ACTIVE").length;
  const inactiveProducts = products.filter((p) => p.status === "INACTIVE").length;
  const withPresentations = products.filter((p) => (p.presentationsCount ?? 0) > 0).length;

  return (
    <div className="products-module">

      {/* ── KPIs ── */}
      <div className="products-kpis">
        <div className="prod-kpi prod-kpi--blue">
          <div className="prod-kpi__icon"><ShoppingBag size={24} /></div>
          <div className="prod-kpi__info">
            <span>Total Productos</span>
            <h3>{totalProducts}</h3>
          </div>
        </div>

        <div className="prod-kpi prod-kpi--green">
          <div className="prod-kpi__icon"><CheckCircle2 size={24} /></div>
          <div className="prod-kpi__info">
            <span>Activos</span>
            <h3>{activeProducts}</h3>
          </div>
        </div>

        <div className="prod-kpi prod-kpi--orange">
          <div className="prod-kpi__icon"><XCircle size={24} /></div>
          <div className="prod-kpi__info">
            <span>Inactivos</span>
            <h3>{inactiveProducts}</h3>
          </div>
        </div>

        <div className="prod-kpi prod-kpi--purple">
          <div className="prod-kpi__icon"><Package size={24} /></div>
          <div className="prod-kpi__info">
            <span>Con Presentaciones</span>
            <h3>{withPresentations}</h3>
          </div>
        </div>
      </div>

      <div className="products-card">

        {/* ── Barra superior ── */}
        <div className="products-card__top">
          <h2>Listado de productos</h2>
          <div className="products-card__top-actions">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
        </div>

        {/* ── Tabla ── */}
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Imagen</th>
                <th>Descripción</th>
                <th>U. Medida</th>
                <th>Precio Base</th>
                <th>Categoría</th>
                <th>Inventariable</th>
                <th>Estado</th>
                <th style={{ width: "120px" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="products-table__empty">Cargando...</td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="products-table__empty">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="prod-image-cell">
                          {p.imageUrl ? (
                            <img
                              src={`${(import.meta.env.VITE_API_URL as string ?? "http://localhost:4000").replace(/\/$/, "")}${p.imageUrl.startsWith("/") ? p.imageUrl : `/${p.imageUrl}`}`}
                              alt={p.name}
                              className="prod-thumbnail"
                            />
                          ) : (
                            <div className="prod-thumbnail-placeholder">
                              <ShoppingBag size={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="prod-name-cell">
                          <span className="prod-title">{p.name}</span>
                          <span className="prod-code-sub">{p.code}</span>
                        </div>
                      </td>
                      <td>
                        <span className="prod-unit-text">{p.unit ?? "Pieza"}</span>
                      </td>
                      <td>
                        <span className="prod-price-text">S/ {Number(p.pricePublic ?? 0).toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="prod-category-badge">
                          <Layers size={12} />{p.categoryName ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`prod-inventory-badge prod-inventory-badge--${p.manageInventory ? "yes" : "no"}`}>
                          {p.manageInventory ? "Físico" : "Servicio"}
                        </span>
                      </td>
                      <td>
                        <span className={`prod-status-badge prod-status-badge--${p.status === "ACTIVE" ? "active" : "inactive"}`}>
                          {p.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="prod-actions">
                          <button
                            className="prod-btn prod-btn--view"
                            onClick={() => handleViewDetail(p.id)}
                            title="Ver ficha"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            className="prod-btn prod-btn--edit"
                            onClick={() => onEdit(p)}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            className="prod-btn prod-btn--delete"
                            onClick={() => setDeleteId(p.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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

      {/* Ficha detalle inline a pie de página */}
      {viewProduct && (
        <ProductDetail
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onEdit={(p) => onEdit(p)}
          onDuplicateSuccess={loadData}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteId !== null && (
        <ConfirmModal
          title="¿Eliminar producto?"
          description="Esta acción eliminará el producto y todas sus presentaciones permanentemente. No se puede deshacer."
          onConfirm={confirmDelete}
          onClose={() => setDeleteId(null)}
          confirmLabel="Eliminar"
          icon="delete"
        />
      )}

    </div>
  );
};
