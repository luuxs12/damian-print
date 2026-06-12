import { useState } from "react";
import { Plus } from "lucide-react";

import { ProductsTable } from "../components/products-table/products-table";
import { ProductForm }   from "../components/product-form/product-form";
import type { Product }  from "../types/product.types";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";

import "./products-page.scss";

export const ProductsPage = () => {
  const [openForm,    setOpenForm]    = useState(false);
  const [selected,    setSelected]    = useState<Product | null>(null);
  const [refreshKey,  setRefreshKey]  = useState(0);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  const handleCreate  = () => { setSelected(null); setOpenForm(true); };
  const handleEdit    = (p: Product) => { setSelected(p); setOpenForm(true); };
  const handleClose   = () => { setOpenForm(false); setSelected(null); };
  
  const handleSuccess = () => { 
    setSuccessMsg(selected ? "¡Producto actualizado con éxito!" : "¡Producto registrado con éxito!");
    setRefreshKey((k) => k + 1); 
    handleClose(); 
  };

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
      <ProductsTable
        key={refreshKey}
        refreshKey={refreshKey}
        onEdit={handleEdit}
        onDeleteSuccess={(msg) => setSuccessMsg(msg)}
      />

      {/* ── Formulario modal ── */}
      {openForm && (
        <ProductForm
          mode={selected ? "edit" : "create"}
          initialData={selected ?? undefined}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {successMsg && (
        <SuccessAnimation
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}

    </div>
  );
};