import { useState } from "react";
import { AuditLogsTable } from "../components/audit-logs-table";
import "./audit-logs-page.scss";

export const AuditLogsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="audit-logs-page">
      
      {/* ── Encabezado ── */}
      <div className="audit-logs-page__header">
        <div>
          <h1>Gestión de Auditoría</h1>
          <p>Monitorea y visualiza las actividades, cambios e historial del sistema.</p>
        </div>

        <button className="audit-logs-page__create-btn" onClick={handleRefresh}>
          Actualizar registros
        </button>
      </div>

      {/* ── Tabla ── */}
      <div>
        <AuditLogsTable key={refreshKey} />
      </div>

    </div>
  );
};
