import { useState } from "react";

import { PresentationsTable } from "../components/presentations-table/presentations-table";
import { PresentationForm }    from "../components/presentation-form/presentation-form";
import type { Presentation }   from "../types/presentations.types";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";

import "./presentations-page.scss";

export const PresentationsPage = () => {
  const [openForm,     setOpenForm]     = useState(false);
  const [selected,     setSelected]     = useState<Presentation | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);

  const handleCreate = () => { setSelected(null); setOpenForm(true); };
  const handleEdit   = (pres: Presentation) => { setSelected(pres); setOpenForm(true); };
  const handleClose  = () => { setOpenForm(false); setSelected(null); };
  const handleSuccess = () => { 
    setSuccessMsg(selected ? "¡Presentación actualizada con éxito!" : "¡Presentación registrada con éxito!");
    setRefreshKey((k) => k + 1); 
    handleClose(); 
  };

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
      <PresentationsTable
        key={refreshKey}
        refreshKey={refreshKey}
        onEdit={handleEdit}
        onDeleteSuccess={(msg) => setSuccessMsg(msg)}
      />

      {/* ── Formulario modal ── */}
      {openForm && (
        <PresentationForm
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
