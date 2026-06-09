import { useState } from "react";
import { Plus } from "lucide-react";

import { ProductsTable } from "../components/products-table/products-table";
import { ProductForm }   from "../components/product-form/product-form";
import type { Product }  from "../types/product.types";

import "./products-page.scss";

export const ProductsPage = () => {
  const [openForm,    setOpenForm]    = useState(false);
  const [selected,    setSelected]    = useState<Product | null>(null);
  const [refreshKey,  setRefreshKey]  = useState(0);

  const handleCreate  = () => { setSelected(null); setOpenForm(true); };
  const handleEdit    = (p: Product) => { setSelected(p); setOpenForm(true); };
  const handleClose   = () => { setOpenForm(false); setSelected(null); };
  const handleSuccess = () => { setRefreshKey((k) => k + 1); handleClose(); };

  return (
    <div className="products-page">

      {/* ── Encabezado ── */}
      <div className="products-page__header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>Administra los productos, categorías, presentaciones y precios del sistema.</p>
        </div>

        <div className="products-page__actions">
          <button className="products-page__create-btn" onClick={handleCreate}>
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* ── Tabla y KPIs ── */}
      <div>
        <ProductsTable
          key={refreshKey}
          refreshKey={refreshKey}
          onEdit={handleEdit}
        />
      </div>

      {/* ── Formulario modal ── */}
      {openForm && (
        <ProductForm
          mode={selected ? "edit" : "create"}
          initialData={selected ?? undefined}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

    </div>
  );
};