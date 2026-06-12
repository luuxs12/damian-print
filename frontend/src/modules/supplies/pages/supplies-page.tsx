import { useState } from "react";
import { Plus }     from "lucide-react";

import { SuppliesTable } from "../components/supplies-table/supplies-table";
import { SupplyForm }    from "../components/supply-form/supply-form";
import type { Supply }   from "../types/supply.types";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";

import "./supplies-page.scss";

export const SuppliesPage = () => {
  const [openForm,   setOpenForm]   = useState(false);
  const [selected,   setSelected]   = useState<Supply | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate  = () => { setSelected(null); setOpenForm(true); };
  const handleEdit    = (s: Supply) => { setSelected(s); setOpenForm(true); };
  const handleClose   = () => { setOpenForm(false); setSelected(null); };
  const handleSuccess = () => { 
    setSuccessMsg(selected ? "¡Insumo actualizado con éxito!" : "¡Insumo registrado con éxito!");
    setRefreshKey((k) => k + 1); 
    handleClose(); 
  };

  return (
    <div className="supplies-page">

      {/* ── Encabezado ── */}
      <div className="supplies-page__header">
        <div>
          <h1>Gestión de insumos</h1>
          <p>Administra las materias primas y costos unitarios de los materiales de producción.</p>
        </div>

        <button className="supplies-page__create-btn" onClick={handleCreate}>
          <Plus size={18} /> Nuevo insumo
        </button>
      </div>

      {/* ── Tabla y KPIs ── */}
      <SuppliesTable
        key={refreshKey}
        refreshKey={refreshKey}
        onEdit={handleEdit}
        onDeleteSuccess={(msg) => setSuccessMsg(msg)}
      />

      {/* ── Formulario modal ── */}
      {openForm && (
        <SupplyForm
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
