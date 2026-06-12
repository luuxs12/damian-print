/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import {
  Users, Building2, User, TrendingUp,
  Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast }               from "sonner";
import { AnimatePresence } from "framer-motion";
import { ConfirmModal }        from "@/shared/components/ui/confirm-modal";
import { generatePageNumbers } from "@/shared/utils/pagination";

import { clientsService }  from "../../services/clients-service";
import { ClientDetail }    from "../client-detail/client-detail";
import type { Client, ClientStats } from "../../types/client.types";

import "./clients-table.scss";

const ITEMS_PER_PAGE = 5;

interface Props {
  refreshKey: number;
  onEdit: (c: Client) => void;
  onDeleteSuccess?: (msg: string) => void;
}

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const getAvatarColor = (name: string): string => {
  const colors = ["#3b82f6", "#8b5cf6", "#14b8a6", "#f59e0b", "#ef4444", "#10b981", "#ec4899"];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

export const ClientsTable = ({ refreshKey, onEdit, onDeleteSuccess }: Props) => {
  const [clients,     setClients]     = useState<Client[]>([]);
  const [stats,       setStats]       = useState<ClientStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [viewClient,  setViewClient]  = useState<Client | null>(null);

  /* ── Carga de datos ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        clientsService.getClients(),
        clientsService.getStats(),
      ]);
      setClients(data);
      setStats(statsData);
    } catch {
      toast.error("Error al cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  /* ── Filtros ── */
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.document.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false);
    const matchType = filterType === "" || c.type === filterType;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterType]);

  /* ── Acciones ── */

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await clientsService.deleteClient(deleteId);
      setClients((prev) => prev.filter((c) => c.id !== deleteId));
      if (viewClient?.id === deleteId) setViewClient(null);
      toast.success("Cliente eliminado.");
      if (onDeleteSuccess) {
        onDeleteSuccess("¡Cliente eliminado con éxito!");
      }
    } catch {
      toast.error("No se pudo eliminar el cliente.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="clients-module">

      {/* ── KPIs ── */}
      <div className="clients-kpis">
        <div className="cli-kpi cli-kpi--teal">
          <div className="cli-kpi__icon"><Users size={22} /></div>
          <div className="cli-kpi__info">
            <span>Total Clientes</span>
            <h3>{stats?.total ?? "—"}</h3>
          </div>
        </div>
        <div className="cli-kpi cli-kpi--green">
          <div className="cli-kpi__icon"><TrendingUp size={22} /></div>
          <div className="cli-kpi__info">
            <span>Activos</span>
            <h3>{stats?.active ?? "—"}</h3>
          </div>
        </div>
        <div className="cli-kpi cli-kpi--blue">
          <div className="cli-kpi__icon"><Building2 size={22} /></div>
          <div className="cli-kpi__info">
            <span>Empresas</span>
            <h3>{stats?.empresa ?? "—"}</h3>
          </div>
        </div>
        <div className="cli-kpi cli-kpi--purple">
          <div className="cli-kpi__icon"><User size={22} /></div>
          <div className="cli-kpi__info">
            <span>Particulares</span>
            <h3>{stats?.particular ?? "—"}</h3>
          </div>
        </div>
      </div>

      {/* ── Tarjeta de tabla ── */}
      <div className="clients-card">
        <div className="clients-card__top">
          <h2>Listado de clientes</h2>
          <div className="clients-card__top-actions">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="EMPRESA">Empresa</option>
              <option value="PARTICULAR">Particular</option>
            </select>
          </div>
        </div>

        <div className="clients-table-wrapper">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Ciudad</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="clients-table__empty">Cargando...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="clients-table__empty">No hay clientes registrados.</td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cli-name-cell">
                        <div className="cli-avatar" style={{ background: getAvatarColor(c.name) }}>
                          {getInitials(c.name)}
                        </div>
                        <div className="cli-name-info">
                          <span className="cli-name">{c.name}</span>
                          {c.contactName && (
                            <span className="cli-sub">{c.contactName}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`cli-type-badge cli-type-badge--${c.type.toLowerCase()}`}>
                        {c.type === "EMPRESA" ? "Empresa" : "Particular"}
                      </span>
                    </td>
                    <td>
                      <span className="cli-doc">
                        <span className="cli-doc__type">{c.documentType}</span> {c.document}
                      </span>
                    </td>
                    <td className="cli-text">{c.phone ?? "—"}</td>
                    <td className="cli-text">{c.email ?? "—"}</td>
                    <td className="cli-text">{c.city ?? "—"}</td>
                    <td>
                      <span className={`cli-status-badge ${c.status === "ACTIVE" ? "cli-status-badge--active" : "cli-status-badge--inactive"}`}>
                        {c.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="cli-date">{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="cli-actions">
                        <button
                          className="cli-btn cli-btn--view"
                          title="Ver detalle"
                          onClick={() => setViewClient(c)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="cli-btn cli-btn--edit"
                          title="Editar"
                          onClick={() => onEdit(c)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="cli-btn cli-btn--delete"
                          title="Eliminar"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="shared-pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span key={`el-${idx}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(Number(page))}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Modal detalle ── */}
      <AnimatePresence>
        {viewClient && (
          <ClientDetail
            client={viewClient}
            onClose={() => setViewClient(null)}
            onEdit={() => { onEdit(viewClient); setViewClient(null); }}
            onDelete={() => { setDeleteId(viewClient.id); setViewClient(null); }}
            getInitials={getInitials}
            getAvatarColor={getAvatarColor}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>

      {/* ── Modal eliminación ── */}
      {deleteId !== null && (
        <ConfirmModal
          title="¿Eliminar cliente?"
          description="Esta acción eliminará el cliente permanentemente. No se puede deshacer."
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
          confirmLabel="Eliminar"
          icon="delete"
        />
      )}
    </div>
  );
};
