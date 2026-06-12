import { useState } from "react";
import { Plus }     from "lucide-react";

import { ClientsTable } from "../components/clients-table/clients-table";
import { ClientForm }   from "../components/client-form/client-form";
import type { Client }  from "../types/client.types";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";

import "./clients-page.scss";

export const ClientsPage = () => {
  const [openForm,   setOpenForm]   = useState(false);
  const [selected,   setSelected]   = useState<Client | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate  = () => { setSelected(null); setOpenForm(true); };
  const handleEdit    = (c: Client) => { setSelected(c); setOpenForm(true); };
  const handleClose   = () => { setOpenForm(false); setSelected(null); };
  
  const handleSuccess = () => { 
    setSuccessMsg(selected ? "¡Cliente actualizado con éxito!" : "¡Cliente registrado con éxito!");
    setRefreshKey((k) => k + 1); 
    handleClose(); 
  };

  return (
    <div className="clients-page">

      {/* ── Encabezado ── */}
      <div className="clients-page__header">
        <div>
          <h1>Gestión de clientes</h1>
          <p>Administra la información de clientes, empresas y contactos del sistema.</p>
        </div>

        <div className="clients-page__actions">
          <button className="clients-page__create-btn" onClick={handleCreate}>
            <Plus size={18} /> Nuevo cliente
          </button>
        </div>
      </div>

      {/* ── Tabla y KPIs ── */}
      <ClientsTable
        key={refreshKey}
        refreshKey={refreshKey}
        onEdit={handleEdit}
        onDeleteSuccess={(msg) => setSuccessMsg(msg)}
      />

      {/* ── Formulario modal ── */}
      {openForm && (
        <ClientForm
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
