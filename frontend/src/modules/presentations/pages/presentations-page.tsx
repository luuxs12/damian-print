import { useState } from "react";

import { PresentationsTable } from "../components/presentations-table/presentations-table";
import { PresentationForm }    from "../components/presentation-form/presentation-form";
import type { Presentation }   from "../types/presentations.types";

import "./presentations-page.scss";

export const PresentationsPage = () => {
  const [openForm,     setOpenForm]     = useState(false);
  const [selected,     setSelected]     = useState<Presentation | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const handleCreate = () => { setSelected(null); setOpenForm(true); };
  const handleEdit   = (pres: Presentation) => { setSelected(pres); setOpenForm(true); };
  const handleClose  = () => { setOpenForm(false); setSelected(null); };
  const handleSuccess = () => { setRefreshKey((k) => k + 1); handleClose(); };

  return (
    <div className="presentations-page">

      {/* ── Encabezado ── */}
      <div className="presentations-page__header">
        <div>
          <h1>Gestión de presentaciones</h1>
          <p>Administra los tipos de presentación o unidades de medida para tus productos.</p>
        </div>

        <button className="presentations-page__create-btn" onClick={handleCreate}>
          + Nueva presentación
        </button>
      </div>

      {/* ── Tabla ── */}
      <div>
        <PresentationsTable
          key={refreshKey}
          refreshKey={refreshKey}
          onEdit={handleEdit}
        />
      </div>

      {/* ── Formulario modal ── */}
      {openForm && (
        <PresentationForm
          mode={selected ? "edit" : "create"}
          initialData={selected ?? undefined}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

    </div>
  );
};
