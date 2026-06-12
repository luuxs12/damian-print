import { useState } from "react";

import { CategoriesTable } from "../components/categories-table";
import { CategoryForm }    from "../components/category-form";
import type { Category }   from "../types/category.types";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";

import "./categories-page.scss";

export const CategoriesPage = () => {

  const [openForm,     setOpenForm]     = useState(false);
  const [selected,     setSelected]     = useState<Category | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);

  const handleCreate = () => { setSelected(null); setOpenForm(true); };
  const handleEdit   = (cat: Category) => { setSelected(cat); setOpenForm(true); };
  const handleClose  = () => { setOpenForm(false); setSelected(null); };
  const handleSuccess = () => { 
    setSuccessMsg(selected ? "¡Categoría actualizada con éxito!" : "¡Categoría registrada con éxito!");
    setRefreshKey((k) => k + 1); 
    handleClose(); 
  };

  return (
    <div className="categories-page">

      {/* ── Encabezado ── */}
      <div className="categories-page__header">
        <div>
          <h1>Gestión de categorías</h1>
          <p>Administra las categorías de productos del sistema.</p>
        </div>

        <button className="categories-page__create-btn" onClick={handleCreate}>
          + Nueva categoría
        </button>
      </div>

      {/* ── Tabla ── */}
      <CategoriesTable
        key={refreshKey}
        refreshKey={refreshKey}
        onEdit={handleEdit}
        onDeleteSuccess={(msg) => setSuccessMsg(msg)}
      />

      {/* ── Formulario modal ── */}
      {openForm && (
        <CategoryForm
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
