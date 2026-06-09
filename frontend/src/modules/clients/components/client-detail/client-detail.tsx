import {
  X, Phone, Mail, MapPin, Contact2, FileText,
  Building2, User, Shield, Pencil, Trash2, CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Client } from "../../types/client.types";
import "./client-detail.scss";

interface Props {
  client:         Client;
  onClose:        () => void;
  onEdit:         () => void;
  onDelete:       () => void;
  getInitials:    (name: string) => string;
  getAvatarColor: (name: string) => string;
  formatDate:     (d: string) => string;
}

const TYPE_LABELS: Record<string, string> = {
  EMPRESA:    "Empresa",
  PARTICULAR: "Particular",
};

const DOC_LABELS: Record<string, string> = {
  DNI:       "DNI",
  RUC:       "RUC",
  CE:        "C.E.",
  PASAPORTE: "Pasaporte",
};

export const ClientDetail = ({
  client,
  onClose,
  onEdit,
  onDelete,
  getInitials,
  getAvatarColor,
  formatDate,
}: Props) => {
  return (
    <AnimatePresence>
      <motion.div
        className="client-detail-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className="client-detail-modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1.00, y: 0  }}
          exit={{ opacity: 0,   scale: 0.94, y: 16 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Cabecera ── */}
          <div className="client-detail-header">
            <div className="client-detail-header__main">
              <span className="client-detail-type">
                {client.type === "EMPRESA" ? <Building2 size={12} /> : <User size={12} />}
                {TYPE_LABELS[client.type]}
              </span>
              <h2>{client.name}</h2>
              <div className="client-detail-meta">
                <code className="client-doc-code">
                  {DOC_LABELS[client.documentType]} · {client.document}
                </code>
                <span className={`client-status-pill client-status-pill--${client.status === "ACTIVE" ? "active" : "inactive"}`}>
                  <Shield size={11} />
                  {client.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <button className="client-detail-close" onClick={onClose} type="button">
              <X size={18} />
            </button>
          </div>

          {/* ── Cuerpo ── */}
          <div className="client-detail-body">

            {/* Avatar + info de contacto */}
            <div className="client-detail-top">
              <div
                className="client-detail-avatar"
                style={{ background: getAvatarColor(client.name) }}
              >
                {getInitials(client.name)}
              </div>
              <div className="client-detail-contact-grid">
                {client.phone && (
                  <div className="client-info-row">
                    <Phone size={13} />
                    <span className="client-info-label">Teléfono</span>
                    <span className="client-info-value">{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="client-info-row">
                    <Mail size={13} />
                    <span className="client-info-label">Email</span>
                    <span className="client-info-value client-info-value--email">{client.email}</span>
                  </div>
                )}
                {(client.address || client.city) && (
                  <div className="client-info-row">
                    <MapPin size={13} />
                    <span className="client-info-label">Dirección</span>
                    <span className="client-info-value">
                      {[client.address, client.city].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {client.contactName && (
                  <div className="client-info-row">
                    <Contact2 size={13} />
                    <span className="client-info-label">Contacto</span>
                    <span className="client-info-value">{client.contactName}</span>
                  </div>
                )}
                <div className="client-info-row">
                  <CalendarDays size={13} />
                  <span className="client-info-label">Registro</span>
                  <span className="client-info-value">{formatDate(client.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            {client.notes && (
              <div className="client-detail-notes">
                <span className="client-detail-notes__label">
                  <FileText size={13} /> Observaciones
                </span>
                <p>{client.notes}</p>
              </div>
            )}

            {/* Estadísticas (preparadas para futuro) */}
            <div className="client-detail-stats">
              <div className="client-stat">
                <span className="client-stat__value">—</span>
                <span className="client-stat__label">Pedidos</span>
              </div>
              <div className="client-stat">
                <span className="client-stat__value">S/ —</span>
                <span className="client-stat__label">Total comprado</span>
              </div>
              <div className="client-stat">
                <span className="client-stat__value">—</span>
                <span className="client-stat__label">Último pedido</span>
              </div>
            </div>
          </div>

          {/* ── Acciones ── */}
          <div className="client-detail-actions">
            <button className="client-detail-action-btn client-detail-action-btn--edit" onClick={onEdit}>
              <Pencil size={15} /> Editar
            </button>
            <button className="client-detail-action-btn client-detail-action-btn--delete" onClick={onDelete}>
              <Trash2 size={15} /> Eliminar
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
