/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  X,
  User,
  Percent,
  PackagePlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  quotationsService,
  type Quotation,
  type QuotationStats,
  type QuotationItem,
  type CreateQuotationPayload,
} from "../services/quotations-service";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import "./quotations-page.scss";

/* ───────── helpers ───────── */
const STATUS_CONFIG = {
  PENDING:  { label: "Pendiente",  icon: Clock,       cls: "status-pending"  },
  APPROVED: { label: "Aprobada",   icon: CheckCircle, cls: "status-approved" },
  REJECTED: { label: "Rechazada",  icon: XCircle,     cls: "status-rejected" },
  EXPIRED:  { label: "Expirada",   icon: XCircle,     cls: "status-expired"  },
} as const;

const fmt = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

/* ───────── empty item ───────── */
const emptyItem = (): QuotationItem => ({
  description: "",
  quantity:    1,
  unitPrice:   0,
  totalPrice:  0,
});

/* ───────── empty form ───────── */
const emptyForm = () => ({
  clientName:     "",
  clientDocument: "",
  clientPhone:    "",
  clientEmail:    "",
  clientAddress:  "",
  discount:       0,
  tax:            18,
  validUntil:     "",
  notes:          "",
  items:          [emptyItem()],
});

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stats, setStats] = useState<QuotationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  /* modals */
  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Quotation | null>(null);
  const [viewTarget, setViewTarget]     = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

  /* form state */
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        quotationsService.getAll(),
        quotationsService.getStats(),
      ]);
      setQuotations(data);
      setStats(s);
    } catch {
      toast.error("Error al cargar cotizaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── open form ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = async (q: Quotation) => {
    const detail = await quotationsService.getById(q.id);
    setEditTarget(detail);
    setForm({
      clientName:     detail.clientName,
      clientDocument: detail.clientDocument,
      clientPhone:    detail.clientPhone || "",
      clientEmail:    detail.clientEmail || "",
      clientAddress:  detail.clientAddress || "",
      discount:       detail.discount,
      tax:            detail.tax,
      validUntil:     detail.validUntil.substring(0, 10),
      notes:          detail.notes || "",
      items:          detail.items?.map((i) => ({ ...i })) || [emptyItem()],
    });
    setShowForm(true);
  };

  const openView = async (q: Quotation) => {
    const detail = await quotationsService.getById(q.id);
    setViewTarget(detail);
  };

  /* ── item handlers ── */
  const updateItem = (idx: number, field: keyof QuotationItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        [field]: value,
        totalPrice: field === "quantity"
          ? Number(value) * items[idx].unitPrice
          : field === "unitPrice"
          ? items[idx].quantity * Number(value)
          : items[idx].totalPrice,
      };
      return { ...prev, items };
    });
  };

  const addItem    = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  /* ── computed totals ── */
  const subtotal = form.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const total    = (subtotal - form.discount) * (1 + form.tax / 100);

  /* ── save ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.clientDocument.trim() || !form.validUntil) {
      toast.error("Complete los datos del cliente y la fecha de validez.");
      return;
    }
    if (form.items.some((i) => !i.description.trim() || i.unitPrice <= 0)) {
      toast.error("Todos los ítems deben tener descripción y precio válido.");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateQuotationPayload = {
        clientName:     form.clientName,
        clientDocument: form.clientDocument,
        clientPhone:    form.clientPhone || undefined,
        clientEmail:    form.clientEmail || undefined,
        clientAddress:  form.clientAddress || undefined,
        items:          form.items.map((i) => ({
          description: i.description,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          totalPrice:  i.quantity * i.unitPrice,
        })),
        discount:   form.discount,
        tax:        form.tax,
        validUntil: form.validUntil,
        notes:      form.notes || undefined,
      };
      if (editTarget) {
        const updated = await quotationsService.update(editTarget.id, payload);
        setQuotations((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        toast.success("Cotización actualizada con éxito.");
      } else {
        const created = await quotationsService.create(payload);
        setQuotations((prev) => [created, ...prev]);
        toast.success(`Cotización ${created.quotationNumber} creada con éxito.`);
      }
      setShowForm(false);
      fetchAll(); // refresh stats
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "Error al guardar cotización.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── status change ── */
  const handleStatusChange = async (id: number, status: string) => {
    try {
      const updated = await quotationsService.updateStatus(id, status);
      setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status: updated.status } : q)));
      if (viewTarget?.id === id) setViewTarget((v) => v ? { ...v, status: updated.status } : v);
      toast.success("Estado actualizado.");
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "Error al cambiar estado.";
      toast.error(msg);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await quotationsService.delete(deleteTarget.id);
      setQuotations((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Cotización eliminada.");
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "Error al eliminar.";
      toast.error(msg);
    }
  };

  /* ── filtered list ── */
  const filtered = quotations.filter((q) => {
    const matchSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.clientDocument.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* ══════════ RENDER ══════════ */
  return (
    <div className="quotations-page">

      {/* ── Encabezado ── */}
      <div className="quotations-page__header">
        <div>
          <h1>Cotizaciones</h1>
          <p>Gestión de presupuestos y propuestas comerciales a clientes del sistema.</p>
        </div>
        <div className="quotations-page__actions">
          <button className="quotations-page__reload-btn" onClick={fetchAll} title="Recargar">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
          <button className="quotations-page__create-btn" onClick={openCreate}>
            <Plus size={18} /> Nueva Cotización
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      {stats && (
        <div className="quotations-kpis">
          <div className="q-kpi q-kpi--indigo">
            <div className="q-kpi__icon"><FileText size={22} /></div>
            <div className="q-kpi__info">
              <span>Total Cotizaciones</span>
              <h3>{stats.total}</h3>
            </div>
          </div>
          <div className="q-kpi q-kpi--orange">
            <div className="q-kpi__icon"><Clock size={22} /></div>
            <div className="q-kpi__info">
              <span>Pendientes</span>
              <h3>{stats.pending}</h3>
            </div>
          </div>
          <div className="q-kpi q-kpi--green">
            <div className="q-kpi__icon"><CheckCircle size={22} /></div>
            <div className="q-kpi__info">
              <span>Aprobadas</span>
              <h3>{stats.approved}</h3>
            </div>
          </div>
          <div className="q-kpi q-kpi--red">
            <div className="q-kpi__icon"><XCircle size={22} /></div>
            <div className="q-kpi__info">
              <span>Rechazadas</span>
              <h3>{stats.rejected}</h3>
            </div>
          </div>
          <div className="q-kpi q-kpi--teal">
            <div className="q-kpi__icon"><DollarSign size={22} /></div>
            <div className="q-kpi__info">
              <span>Ingresos Aprobados</span>
              <h3>{fmt(stats.revenue)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* ── Tarjeta de tabla ── */}
      <div className="quotations-card">
        <div className="quotations-card__top">
          <h2>Listado de cotizaciones</h2>
          <div className="quotations-card__top-actions">
            <input
              type="text"
              placeholder="Buscar por número, cliente o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
              <option value="EXPIRED">Expiradas</option>
            </select>
          </div>
        </div>

        <div className="quotations-table-wrapper">
          {loading && quotations.length === 0 ? (
            <div className="quotations-table__empty">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="quotations-table__empty">No se encontraron cotizaciones.</div>
          ) : (
            <table className="quotations-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Total</th>
                  <th>Válido hasta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => {
                  const cfg = STATUS_CONFIG[q.status];
                  return (
                    <tr key={q.id}>
                      <td className="cell-number">{q.quotationNumber}</td>
                      <td className="cell-client">{q.clientName}</td>
                      <td>
                        <span className="q-doc">{q.clientDocument}</span>
                      </td>
                      <td className="cell-total">{fmt(q.total)}</td>
                      <td className="cell-date">{fmtDate(q.validUntil)}</td>
                      <td>
                        <span className={`q-status-badge q-status-badge--${q.status.toLowerCase()}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div className="q-actions">
                          <button className="q-btn q-btn--view" title="Ver detalle" onClick={() => openView(q)}>
                            <Eye size={16} />
                          </button>
                          <button className="q-btn q-btn--edit" title="Editar" onClick={() => openEdit(q)}>
                            <Pencil size={16} />
                          </button>
                          <button className="q-btn q-btn--delete" title="Eliminar" onClick={() => setDeleteTarget(q)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* ══════════ FORM MODAL ══════════ */}
      {showForm && (
        <div className="quotation-form-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="quotation-form-modal quotation-form-modal--wide" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="quotation-form-header">
              <div className="quotation-form-header__icon">
                <FileText size={20} />
              </div>
              <div>
                <h2>{editTarget ? "Editar Cotización" : "Nueva Cotización"}</h2>
                <p>{editTarget ? `Modificar ${editTarget.quotationNumber}` : "Crear una nueva propuesta comercial"}</p>
              </div>
              <button className="quotation-form-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="quotation-form" onSubmit={handleSave} noValidate>
              <div className="quotation-form-scroll-area">
                {/* Sección 1: Datos del cliente */}
                <div className="quotation-form-section-title">
                  <User size={15} />
                  <span>Datos del Cliente</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre completo / Razón social *</label>
                    <input type="text" placeholder="Ej. Empresa ABC S.A.C." value={form.clientName}
                      onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>DNI / RUC *</label>
                    <input type="text" placeholder="Ej. 20123456789" value={form.clientDocument}
                      onChange={(e) => setForm((p) => ({ ...p, clientDocument: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" placeholder="Ej. 987654321" value={form.clientPhone}
                      onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Correo electrónico</label>
                    <input type="email" placeholder="Ej. cliente@email.com" value={form.clientEmail}
                      onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} />
                  </div>
                  <div className="form-group form-group--full">
                    <label>Dirección</label>
                    <input type="text" placeholder="Ej. Av. Principal 123, Lima" value={form.clientAddress}
                      onChange={(e) => setForm((p) => ({ ...p, clientAddress: e.target.value }))} />
                  </div>
                </div>

                {/* Sección 2: Ítems */}
                <div className="quotation-form-section-title">
                  <PackagePlus size={15} />
                  <span>Ítems de la Cotización</span>
                </div>

                <div className="builder-inputs-row" style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <button type="button" className="btn-add-item" onClick={addItem} style={{ height: "46px" }}>
                    <Plus size={16} /> Agregar ítem
                  </button>
                </div>

                <div className="q-items-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="quotation-form-item-row">
                      <div className="form-group">
                        <label className={idx === 0 ? "" : "mobile-only-label"}>Descripción</label>
                        <input type="text" placeholder="Descripción del producto o servicio"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className={idx === 0 ? "" : "mobile-only-label"}>Cant.</label>
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className={idx === 0 ? "" : "mobile-only-label"}>P. Unit.</label>
                        <input type="number" min={0} step={0.01} value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))} />
                      </div>
                      <div className="form-group">
                        <label className={idx === 0 ? "" : "mobile-only-label"}>Total</label>
                        <span className="quotation-item-total-value">
                          {fmt(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                      <button type="button" className="btn-delete-row"
                        onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sección 3: Condiciones */}
                <div className="quotation-form-section-title">
                  <Percent size={15} />
                  <span>Condiciones y Totales</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Descuento (S/)</label>
                    <input type="number" min={0} step={0.01} value={form.discount}
                      onChange={(e) => setForm((p) => ({ ...p, discount: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label>IGV (%)</label>
                    <input type="number" min={0} max={100} value={form.tax}
                      onChange={(e) => setForm((p) => ({ ...p, tax: Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label>Válido hasta *</label>
                    <input type="date" value={form.validUntil}
                      onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} required />
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="materials-total-cost-strip" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span>Subtotal:</span>
                    <strong>{fmt(subtotal)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span>Descuento:</span>
                    <strong style={{ color: "#ef4444" }}>- {fmt(form.discount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span>IGV ({form.tax}%):</span>
                    <strong>{fmt((subtotal - form.discount) * (form.tax / 100))}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", borderTop: "1px solid var(--glass-border)", paddingTop: "8px", marginTop: "4px" }}>
                    <span>Total Neto:</span>
                    <strong style={{ color: "var(--primary-color)" }}>{fmt(total)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notas / Observaciones</label>
                  <textarea rows={2} placeholder="Condiciones de pago, tiempo de entrega, etc."
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              {/* Form actions */}
              <div className="quotation-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                  {saving ? "Guardando..." : editTarget ? "Guardar cambios" : "Crear cotización"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ VIEW DETAIL MODAL ══════════ */}
      {viewTarget && (
        <div className="quotation-form-overlay" onClick={() => setViewTarget(null)}>
          <div className="quotation-form-modal quotation-form-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="quotation-form-header">
              <div className="quotation-form-header__icon" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Eye size={20} />
              </div>
              <div>
                <h2>{viewTarget.quotationNumber}</h2>
                <p>Detalle de la cotización del cliente</p>
              </div>
              <button className="quotation-form-close" onClick={() => setViewTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="quotation-form">
              <div className="quotation-form-scroll-area">
                {/* Cliente */}
                <div className="quotation-form-section-title">
                  <User size={15} />
                  <span>Datos del Cliente</span>
                </div>
                <div className="form-grid">
                  <div className="form-group"><span>Nombre / Razón Social</span><strong>{viewTarget.clientName}</strong></div>
                  <div className="form-group"><span>Documento</span><strong>{viewTarget.clientDocument}</strong></div>
                  {viewTarget.clientPhone && <div className="form-group"><span>Teléfono</span><strong>{viewTarget.clientPhone}</strong></div>}
                  {viewTarget.clientEmail && <div className="form-group"><span>Correo electrónico</span><strong>{viewTarget.clientEmail}</strong></div>}
                  {viewTarget.clientAddress && <div className="form-group form-group--full"><span>Dirección</span><strong>{viewTarget.clientAddress}</strong></div>}
                </div>

                {/* Items */}
                <div className="quotation-form-section-title">
                  <PackagePlus size={15} />
                  <span>Ítems</span>
                </div>
                <div className="builder-table-wrapper" style={{ border: "1px solid var(--glass-border)", borderRadius: "14px", overflow: "hidden" }}>
                  <table className="builder-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Descripción</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Cant.</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>P. Unit.</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewTarget.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "10px", fontSize: "0.88rem", color: "var(--text-primary)" }}>{item.description}</td>
                          <td style={{ padding: "10px", fontSize: "0.88rem", color: "var(--text-primary)", textAlign: "right" }}>{item.quantity}</td>
                          <td style={{ padding: "10px", fontSize: "0.88rem", color: "var(--text-primary)", textAlign: "right" }}>{fmt(item.unitPrice)}</td>
                          <td style={{ padding: "10px", fontSize: "0.88rem", fontWeight: 700, color: "var(--primary-color)", textAlign: "right" }}>{fmt(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="materials-total-cost-strip" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span>Subtotal:</span>
                    <strong>{fmt(viewTarget.subtotal)}</strong>
                  </div>
                  {viewTarget.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                      <span>Descuento:</span>
                      <strong style={{ color: "#ef4444" }}>- {fmt(viewTarget.discount)}</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span>IGV ({viewTarget.tax}%):</span>
                    <strong>{fmt((viewTarget.subtotal - viewTarget.discount) * (viewTarget.tax / 100))}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", borderTop: "1px solid var(--glass-border)", paddingTop: "8px", marginTop: "4px" }}>
                    <span>Total:</span>
                    <strong style={{ color: "var(--primary-color)" }}>{fmt(viewTarget.total)}</strong>
                  </div>
                </div>

                {/* Meta */}
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <span>Válido hasta</span>
                    <strong>{fmtDate(viewTarget.validUntil)}</strong>
                  </div>
                  <div className="form-group">
                    <span>Estado</span>
                    <span className={`q-status-badge q-status-badge--${viewTarget.status.toLowerCase()}`}>
                      {STATUS_CONFIG[viewTarget.status].label}
                    </span>
                  </div>
                  {viewTarget.notes && (
                    <div className="form-group form-group--full">
                      <span>Notas / Observaciones</span>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>{viewTarget.notes}</p>
                    </div>
                  )}
                </div>

                {/* Quick status change */}
                <div className="quotation-form-section-title">
                  <span>Cambiar Estado</span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                  {(["PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const).map((s) => (
                    <button
                      key={s}
                      className={`q-status-action-btn q-status-action-btn--${s.toLowerCase()} ${viewTarget.status === s ? "active" : ""}`}
                      onClick={() => handleStatusChange(viewTarget.id, s)}
                      disabled={viewTarget.status === s}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="quotation-form-actions" style={{ marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setViewTarget(null)} style={{ width: "100%" }}>
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ DELETE CONFIRM ══════════ */}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar cotización"
          description={`¿Estás seguro de que deseas eliminar la cotización ${deleteTarget.quotationNumber} de ${deleteTarget.clientName}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          icon="delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
