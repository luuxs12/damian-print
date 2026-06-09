/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
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
  PackagePlus,
  Loader2,
  Send,
  Printer,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  salesService,
  type Sale,
  type SaleStats,
  type SaleItem,
  type CreateSalePayload,
} from "../services/sales-service";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { clientsService } from "../../clients/services/clients-service";
import { productsService } from "../../products/services/products-service";
import { presentationsService } from "../../presentations/services/presentations-service";
import type { Client } from "../../clients/types/client.types";
import "./sales-page.scss";

export interface UISaleItem extends Omit<SaleItem, "id"> {
  catalogOptionId?: string;
  searchQuery?: string;
  showSuggestions?: boolean;
}

export interface CatalogItemOption {
  type: "PRODUCT" | "PRESENTATION";
  id: string;
  label: string;
  description: string;
  price: number;
}

const STATUS_CONFIG = {
  PENDIENTE: { label: "Pendiente", icon: Clock, cls: "status-pending" },
  PAGADA:    { label: "Pagada",    icon: CheckCircle, cls: "status-approved" },
  ANULADA:   { label: "Anulada",   icon: XCircle, cls: "status-rejected" },
} as const;

const BILLING_CONFIG = {
  NOTA_DE_VENTA: { label: "Nota de Venta", cls: "s-billing-badge--nota" },
  BOLETA:        { label: "Boleta",        cls: "s-billing-badge--boleta" },
  FACTURA:       { label: "Factura",       cls: "s-billing-badge--factura" },
} as const;

const fmt = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const emptyItem = (): UISaleItem => ({
  description: "",
  quantity:    1,
  unitPrice:   0,
  totalPrice:  0,
  catalogOptionId: "",
  searchQuery: "",
  showSuggestions: false,
});

const emptyForm = () => ({
  quotationId:    null as number | null,
  clientId:       null as number | null,
  clientName:     "",
  clientDocument: "",
  clientPhone:    "",
  clientEmail:    "",
  clientAddress:  "",
  discount:       0,
  tax:            18,
  status:         "PENDIENTE" as "PENDIENTE" | "PAGADA" | "ANULADA",
  paymentMethod:  "EFECTIVO" as "EFECTIVO" | "TRANSFERENCIA" | "YAPE" | "PLIN" | "TARJETA",
  billingType:    "NOTA_DE_VENTA" as "NOTA_DE_VENTA" | "BOLETA" | "FACTURA",
  items:          [emptyItem()],
});

export const SalesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterBilling, setFilterBilling] = useState("ALL");

  const [clients, setClients] = useState<Client[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogItemOption[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Sale | null>(null);
  const [viewTarget, setViewTarget] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);

  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  // Load state
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s, cls, prods, pres] = await Promise.all([
        salesService.getAll(),
        salesService.getStats(),
        clientsService.getClients(),
        productsService.getProducts(),
        presentationsService.getPresentations(),
      ]);
      setSales(data);
      setStats(s);
      setClients(cls.filter((c) => c.status === "ACTIVE"));

      const activeProds = prods.filter((p) => p.status === "ACTIVE");
      const activePres = pres.filter((p) => p.status === "ACTIVE");

      const options: CatalogItemOption[] = [];
      activeProds.forEach((p) => {
        options.push({
          type: "PRODUCT",
          id: `prod-${p.id}`,
          label: `[Producto] ${p.name}`,
          description: p.name,
          price: Number(p.pricePublic) || 0,
        });
      });
      activePres.forEach((pr) => {
        options.push({
          type: "PRESENTATION",
          id: `pres-${pr.id}`,
          label: `[Presentación] ${pr.productName || "Producto"} - ${pr.name}`,
          description: `${pr.productName || "Producto"} - ${pr.name}${pr.size ? ` (${pr.size})` : ""}${pr.material ? `, ${pr.material}` : ""}${pr.finish ? `, ${pr.finish}` : ""}`,
          price: Number(pr.price) || 0,
        });
      });
      setCatalogOptions(options);
    } catch {
      toast.error("Error al cargar ventas y comprobantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Check if routed with a quotation conversion payload in state
  useEffect(() => {
    if (location.state?.convertQuotation && catalogOptions.length > 0) {
      const q = location.state.convertQuotation;
      // Prepopulate form
      setEditTarget(null);
      setForm({
        quotationId:    q.id,
        clientId:       q.clientId,
        clientName:     q.clientName,
        clientDocument: q.clientDocument,
        clientPhone:    q.clientPhone || "",
        clientEmail:    q.clientEmail || "",
        clientAddress:  q.clientAddress || "",
        discount:       q.discount,
        tax:            q.tax,
        status:         "PENDIENTE",
        paymentMethod:  "EFECTIVO",
        billingType:    "NOTA_DE_VENTA",
        items:          q.items?.map((i: any) => {
          const opt = catalogOptions.find((o) => o.description === i.description);
          return {
            description: i.description,
            quantity:    i.quantity,
            unitPrice:   i.unitPrice,
            totalPrice:  i.totalPrice,
            catalogOptionId: opt ? opt.id : "",
            searchQuery: opt ? opt.label : i.description,
            showSuggestions: false,
          };
        }) || [emptyItem()],
      });
      setShowForm(true);
      // Clean location state so it doesn't open again on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, catalogOptions, navigate]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = async (s: Sale) => {
    const detail = await salesService.getById(s.id);
    setEditTarget(detail);
    setForm({
      quotationId:    detail.quotationId,
      clientId:       detail.clientId,
      clientName:     detail.clientName,
      clientDocument: detail.clientDocument,
      clientPhone:    detail.clientPhone || "",
      clientEmail:    detail.clientEmail || "",
      clientAddress:  detail.clientAddress || "",
      discount:       detail.discount,
      tax:            detail.tax,
      status:         detail.status,
      paymentMethod:  detail.paymentMethod,
      billingType:    detail.billingType,
      items:          detail.items?.map((i) => {
        const opt = catalogOptions.find((o) => o.description === i.description);
        return {
          description: i.description,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          totalPrice:  i.totalPrice,
          catalogOptionId: opt ? opt.id : "",
          searchQuery: opt ? opt.label : i.description,
          showSuggestions: false,
        };
      }) || [emptyItem()],
    });
    setShowForm(true);
  };

  const openView = async (s: Sale) => {
    const detail = await salesService.getById(s.id);
    setViewTarget(detail);
  };

  const handleSearchDocument = async () => {
    const doc = form.clientDocument.trim();
    if (!doc || (doc.length !== 8 && doc.length !== 11)) {
      toast.error("Por favor, ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido.");
      return;
    }

    setIsSearchingDoc(true);
    try {
      // 1. Search in the backend database first
      const dbClients = await clientsService.searchClients(doc);
      const found = dbClients.find((c) => c.document === doc);
      if (found) {
        setForm((p) => ({
          ...p,
          clientId: found.id,
          clientName: found.name,
          clientDocument: doc,
          clientPhone: found.phone || "",
          clientEmail: found.email || "",
          clientAddress: found.address || "",
        }));
        toast.success(`Cliente registrado "${found.name}" encontrado en la base de datos.`);
        setIsSearchingDoc(false);
        return;
      }

      // 2. RENIEC/SUNAT API lookup
      const docType = doc.length === 11 ? "RUC" : "DNI";
      const result = await clientsService.lookupDocument(docType, doc);
      if (result && result.name) {
        setForm((p) => ({
          ...p,
          clientId: null,
          clientName: result.name,
          clientAddress: result.address || p.clientAddress,
        }));
        toast.success("Datos obtenidos de RENIEC/SUNAT. Se registrará automáticamente al guardar.");
      } else {
        toast.error("No se encontraron resultados en RENIEC/SUNAT.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al realizar la consulta.");
    } finally {
      setIsSearchingDoc(false);
    }
  };

  const updateItem = (idx: number, field: keyof UISaleItem, value: any) => {
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

  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const total = (subtotal - form.discount) * (1 + form.tax / 100);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.clientDocument.trim()) {
      toast.error("Complete los datos del cliente.");
      return;
    }
    if (form.items.some((i) => !i.description.trim() || i.unitPrice <= 0)) {
      toast.error("Todos los ítems deben tener descripción y precio válido.");
      return;
    }
    setSaving(true);
    try {
      let finalClientId = form.clientId;
      if (!finalClientId) {
        try {
          const doc = form.clientDocument.trim();
          const docType = doc.length === 11 ? "RUC" : "DNI";
          const clientType = doc.length === 11 ? "EMPRESA" : "PARTICULAR";
          
          const newClient = await clientsService.createClient({
            type: clientType,
            name: form.clientName.trim(),
            documentType: docType,
            document: doc,
            phone: form.clientPhone?.trim() || undefined,
            email: form.clientEmail?.trim() || undefined,
            address: form.clientAddress?.trim() || undefined,
            status: "ACTIVE"
          });
          finalClientId = newClient.id;
          toast.success(`Cliente "${newClient.name}" registrado automáticamente.`);
        } catch (err: any) {
          toast.error(err.message || "Error al registrar cliente automáticamente.");
          setSaving(false);
          return;
        }
      }

      const payload: CreateSalePayload = {
        quotationId:    form.quotationId,
        clientId:       finalClientId,
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
        discount:       form.discount,
        tax:            form.tax,
        status:         form.status,
        paymentMethod:  form.paymentMethod,
        billingType:    form.billingType,
      };

      if (editTarget) {
        const updated = await salesService.update(editTarget.id, payload);
        setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Venta/Comprobante actualizado con éxito.");
      } else {
        const created = await salesService.create(payload);
        setSales((prev) => [created, ...prev]);
        toast.success(`Venta ${created.saleNumber} creada con éxito.`);
      }
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: "PENDIENTE" | "PAGADA" | "ANULADA") => {
    try {
      const updated = await salesService.update(id, { status: newStatus });
      setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: updated.status } : s)));
      if (viewTarget?.id === id) setViewTarget((v) => v ? { ...v, status: updated.status } : v);
      toast.success(`Estado de pago cambiado a ${newStatus}.`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado.");
    }
  };

  const handleUpdatePaymentMethod = async (id: number, method: string) => {
    try {
      const updated = await salesService.update(id, { paymentMethod: method });
      setSales((prev) => prev.map((s) => (s.id === id ? { ...s, paymentMethod: updated.paymentMethod } : s)));
      if (viewTarget?.id === id) setViewTarget((v) => v ? { ...v, paymentMethod: updated.paymentMethod } : v);
      toast.success(`Método de pago cambiado a ${method}.`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar método de pago.");
    }
  };

  const handleConvertToInvoice = async (id: number, type: "BOLETA" | "FACTURA") => {
    try {
      const updated = await salesService.update(id, { billingType: type });
      setSales((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (viewTarget?.id === id) setViewTarget(updated);
      toast.success(`Comprobante ${type} emitido con éxito: ${updated.billingNumber}`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al emitir comprobante.");
    }
  };

  const handleDeleteSale = async () => {
    if (!deleteTarget) return;
    try {
      await salesService.delete(deleteTarget.id);
      setSales((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Comprobante eliminado con éxito.");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar venta.");
    }
  };

  const handleSendEmail = async (id: number) => {
    const loader = toast.loading("Enviando correo al cliente...");
    try {
      const res = await salesService.sendEmail(id);
      if (res.sent) {
        toast.success("Correo enviado exitosamente.", { id: loader });
      } else {
        toast.error("No se pudo enviar. SMTP no configurado.", { id: loader });
      }
    } catch (err: any) {
      toast.error(err.message || "Error al enviar correo.", { id: loader });
    }
  };

  const handleSendWhatsApp = (sale: Sale) => {
    if (!sale.clientPhone) {
      toast.error("El cliente no tiene teléfono registrado.");
      return;
    }
    const cleanPhone = sale.clientPhone.replace(/\D/g, "");
    const docName = sale.billingType === "BOLETA" ? "Boleta de Venta" : sale.billingType === "FACTURA" ? "Factura" : "Nota de Venta";
    const docCode = sale.billingNumber || sale.saleNumber;
    const itemsText = sale.items?.map((i) => `- ${i.quantity}x ${i.description} (${fmt(i.totalPrice)})`).join("%0A") || "";
    
    const text = `Hola *${sale.clientName}*, adjuntamos el detalle de su *${docName}* N° *${docCode}*:%0A%0A${itemsText}%0A%0A*Total:* ${fmt(sale.total)}%0A*Estado:* ${sale.status}%0A%0A¡Muchas gracias por su preferencia!%0A_Industria Gráfica Damian_`;
    
    window.open(`https://api.whatsapp.com/send?phone=51${cleanPhone}&text=${text}`, "_blank");
  };

  const handlePrint = (sale: Sale) => {
    const docName = sale.billingType === "BOLETA" ? "BOLETA DE VENTA" : sale.billingType === "FACTURA" ? "FACTURA" : "NOTA DE VENTA";
    const docCode = sale.billingNumber || sale.saleNumber;
    const subtotalPrint = sale.subtotal;
    const discountPrint = sale.discount;
    const taxPrint = sale.tax;
    const totalPrint = sale.total;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("El navegador bloqueó la ventana emergente de impresión.");
      return;
    }

    const itemsRows = sale.items?.map(i => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${i.description}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: center;">${i.quantity}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${i.unitPrice.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">S/ ${i.totalPrice.toFixed(2)}</td>
      </tr>
    `).join("") || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>${docName} - ${docCode}</title>
          <style>
            body { font-family: 'Arial', sans-serif; color: #333; margin: 20px; }
            .ticket { max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .company-name { font-size: 20px; font-weight: bold; }
            .doc-info { margin-top: 15px; font-size: 14px; }
            .client-info { background: #f5f5f5; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #eee; padding: 8px; font-size: 12px; }
            .totals-table { width: 220px; margin-left: auto; margin-top: 15px; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="company-name">INDUSTRIA GRÁFICA DAMIAN</div>
              <div style="font-size: 12px; color: #666;">Servicios Gráficos y Publicitarios</div>
              <div style="font-size: 14px; font-weight: bold; margin-top: 8px; color: #00aeef;">${docName}</div>
              <div style="font-size: 14px; font-weight: bold;">N° ${docCode}</div>
            </div>
            <div class="client-info">
              <strong>CLIENTE:</strong> ${sale.clientName}<br/>
              <strong>DNI/RUC:</strong> ${sale.clientDocument}<br/>
              ${sale.clientAddress ? `<strong>DIRECCIÓN:</strong> ${sale.clientAddress}<br/>` : ""}
              <strong>FECHA:</strong> ${new Date(sale.createdAt).toLocaleDateString("es-PE")}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">DESCRIPCIÓN</th>
                  <th>CANT</th>
                  <th style="text-align: right;">P. UNIT</th>
                  <th style="text-align: right;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">S/ ${subtotalPrint.toFixed(2)}</td>
              </tr>
              ${discountPrint > 0 ? `
              <tr>
                <td>Descuento:</td>
                <td style="text-align: right; color: red;">-S/ ${discountPrint.toFixed(2)}</td>
              </tr>` : ""}
              <tr>
                <td>IGV (${taxPrint}%):</td>
                <td style="text-align: right;">S/ ${((subtotalPrint - discountPrint) * (taxPrint / 100)).toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 16px; border-top: 1px solid #333;">
                <td style="padding-top: 6px;">Total:</td>
                <td style="text-align: right; padding-top: 6px;">S/ ${totalPrint.toFixed(2)}</td>
              </tr>
            </table>
            <div class="footer">
              <p>MÉTODO DE PAGO: ${sale.paymentMethod} | ESTADO: ${sale.status}</p>
              <p>¡Gracias por su preferencia!</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = sales.filter((s) => {
    const matchSearch =
      s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.billingNumber && s.billingNumber.toLowerCase().includes(search.toLowerCase())) ||
      s.clientName.toLowerCase().includes(search.toLowerCase()) ||
      s.clientDocument.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
    const matchBilling = filterBilling === "ALL" || s.billingType === filterBilling;
    return matchSearch && matchStatus && matchBilling;
  });

  return (
    <div className="sales-page">
      {/* Header */}
      <div className="sales-page__header">
        <div>
          <h1>Ventas y Comprobantes</h1>
          <p>Control de Notas de Venta, Boletas y Facturas. Facturación interna integrada.</p>
        </div>
        <div className="sales-page__actions">
          <button className="sales-page__reload-btn" onClick={fetchAll} title="Recargar">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
          <button className="sales-page__create-btn" onClick={openCreate}>
            <Plus size={18} /> Registrar Venta Directa
          </button>
        </div>
      </div>

      {/* Stats / KPIs */}
      {stats && (
        <div className="sales-kpis">
          <div className="s-kpi s-kpi--indigo">
            <div className="s-kpi__icon"><ShoppingCart size={22} /></div>
            <div className="s-kpi__info">
              <span>Total Ventas</span>
              <h3>{stats.total}</h3>
            </div>
          </div>
          <div className="s-kpi s-kpi--orange">
            <div className="s-kpi__icon"><Clock size={22} /></div>
            <div className="s-kpi__info">
              <span>Pendientes</span>
              <h3>{stats.pending}</h3>
            </div>
          </div>
          <div className="s-kpi s-kpi--green">
            <div className="s-kpi__icon"><CheckCircle size={22} /></div>
            <div className="s-kpi__info">
              <span>Pagadas</span>
              <h3>{stats.paid}</h3>
            </div>
          </div>
          <div className="s-kpi s-kpi--red">
            <div className="s-kpi__icon"><XCircle size={22} /></div>
            <div className="s-kpi__info">
              <span>Anuladas</span>
              <h3>{stats.cancelled}</h3>
            </div>
          </div>
          <div className="s-kpi s-kpi--teal">
            <div className="s-kpi__icon"><DollarSign size={22} /></div>
            <div className="s-kpi__info">
              <span>Ingresos Cobrados</span>
              <h3>{fmt(stats.revenue)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="sales-card">
        <div className="sales-card__top">
          <h2>Listado de Documentos</h2>
          <div className="sales-card__filters">
            <div className="sales-card__search-wrapper">
              <ShoppingCart size={16} />
              <input
                type="text"
                placeholder="Buscar por N° Venta, Comprobante o Cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="sales-card__select-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Cualquier Pago</option>
              <option value="PENDIENTE">Pago: Pendiente</option>
              <option value="PAGADA">Pago: Pagada</option>
              <option value="ANULADA">Pago: Anulada</option>
            </select>
            <select
              className="sales-card__select-filter"
              value={filterBilling}
              onChange={(e) => setFilterBilling(e.target.value)}
            >
              <option value="ALL">Cualquier Comprobante</option>
              <option value="NOTA_DE_VENTA">Notas de Venta</option>
              <option value="BOLETA">Boletas</option>
              <option value="FACTURA">Facturas</option>
            </select>
          </div>
        </div>

        <div className="sales-card__table-wrapper">
          {loading && sales.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              Cargando comprobantes...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              No se encontraron comprobantes de venta.
            </div>
          ) : (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Comprobante</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Emisión</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{s.saleNumber}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className={`s-billing-badge ${BILLING_CONFIG[s.billingType].cls}`}>
                          {BILLING_CONFIG[s.billingType].label}
                        </span>
                        {s.billingNumber && (
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                            {s.billingNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.clientName}</td>
                    <td style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>{s.clientDocument}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{fmtDate(s.createdAt)}</td>
                    <td style={{ fontWeight: 800, color: "var(--primary-color)" }}>{fmt(s.total)}</td>
                    <td>
                      <span className={`s-status-badge ${STATUS_CONFIG[s.status].cls}`}>
                        {STATUS_CONFIG[s.status].label}
                      </span>
                    </td>
                    <td>
                      <div className="sales-actions-cell">
                        <button
                          className="s-action-btn s-action-btn--view"
                          onClick={() => openView(s)}
                          title="Ver detalle de venta"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="s-action-btn s-action-btn--edit"
                          onClick={() => openEdit(s)}
                          title="Editar venta"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="s-action-btn s-action-btn--delete"
                          onClick={() => setDeleteTarget(s)}
                          title="Eliminar venta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="quotation-form-overlay" onClick={() => setShowForm(false)}>
          <div className="quotation-form-modal quotation-form-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="quotation-form-header">
              <div className="quotation-form-header__icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                <ShoppingCart size={20} />
              </div>
              <div>
                <h2>{editTarget ? `Editar Venta ${editTarget.saleNumber}` : "Registrar Venta Directa"}</h2>
                <p>Ingrese los detalles del comprobante y los productos vendidos</p>
              </div>
              <button className="quotation-form-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="quotation-form" onSubmit={handleSave}>
              <div className="quotation-form-scroll-area">
                {/* Client info */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">1</span>
                    <h3>Datos del Cliente</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group form-group--btn">
                      <label htmlFor="clientDocument">DNI / RUC *</label>
                      <div className="form-group-with-btn">
                        <input
                          id="clientDocument"
                          type="text"
                          placeholder="Ingrese 8 u 11 dígitos"
                          value={form.clientDocument}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setForm((p) => ({ ...p, clientDocument: val }));
                            if (val.length === 8 || val.length === 11) {
                              const found = clients.find((c) => c.document === val);
                              if (found) {
                                setForm((p) => ({
                                  ...p,
                                  clientId: found.id,
                                  clientName: found.name,
                                  clientPhone: found.phone || "",
                                  clientEmail: found.email || "",
                                  clientAddress: found.address || "",
                                }));
                                toast.success(`Cliente registrado "${found.name}" autocompletado.`);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-form-search"
                          onClick={handleSearchDocument}
                          disabled={isSearchingDoc}
                        >
                          {isSearchingDoc ? <Loader2 className="spin" size={14} /> : "Buscar"}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="clientName">Nombre / Razón Social *</label>
                      <input
                        id="clientName"
                        type="text"
                        placeholder="Ej. Juan Pérez / Inversiones S.A.C."
                        value={form.clientName}
                        onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="clientPhone">Teléfono</label>
                      <input
                        id="clientPhone"
                        type="text"
                        placeholder="Ej. 987654321"
                        value={form.clientPhone}
                        onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="clientEmail">Correo electrónico</label>
                      <input
                        id="clientEmail"
                        type="email"
                        placeholder="Ej. cliente@correo.com"
                        value={form.clientEmail}
                        onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))}
                      />
                    </div>

                    <div className="form-group form-group--full">
                      <label htmlFor="clientAddress">Dirección</label>
                      <input
                        id="clientAddress"
                        type="text"
                        placeholder="Ej. Av. Larco 123, Miraflores"
                        value={form.clientAddress}
                        onChange={(e) => setForm((p) => ({ ...p, clientAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Billing and Payment info */}
                <div className="form-section-card" style={{ marginTop: "16px" }}>
                  <div className="section-title-row">
                    <span className="section-num">2</span>
                    <h3>Tipo de Venta y Pago</h3>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div className="form-group">
                      <label htmlFor="billingType">Comprobante a Emitir</label>
                      <select
                        id="billingType"
                        value={form.billingType}
                        onChange={(e) => setForm((p) => ({ ...p, billingType: e.target.value as any }))}
                        disabled={editTarget !== null && editTarget.billingType !== "NOTA_DE_VENTA"}
                      >
                        <option value="NOTA_DE_VENTA">Nota de Venta (Interna)</option>
                        <option value="BOLETA">Boleta de Venta</option>
                        <option value="FACTURA">Factura</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="paymentMethod">Método de Pago</label>
                      <select
                        id="paymentMethod"
                        value={form.paymentMethod}
                        onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as any }))}
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="YAPE">Yape</option>
                        <option value="PLIN">Plin</option>
                        <option value="TARJETA">Tarjeta de Crédito/Débito</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="status">Estado de Pago</label>
                      <select
                        id="status"
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                      >
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PAGADA">Pagada</option>
                        <option value="ANULADA">Anulada</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items builder */}
                <div className="quotation-form-section-title" style={{ marginTop: "20px" }}>
                  <PackagePlus size={15} />
                  <span>Ítems Vendidos</span>
                </div>

                <div className="builder-table-wrapper" style={{ marginTop: "8px" }}>
                  <table className="builder-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45%" }}>Descripción / Buscar Producto</th>
                        <th style={{ width: "15%", textAlign: "right" }}>Cantidad</th>
                        <th style={{ width: "18%", textAlign: "right" }}>Precio Unitario</th>
                        <th style={{ width: "15%", textAlign: "right" }}>Total</th>
                        <th style={{ width: "7%", textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ position: "relative" }}>
                              <input
                                type="text"
                                placeholder="Escriba descripción o busque en catálogo..."
                                value={item.searchQuery || item.description}
                                onChange={(e) => {
                                  const q = e.target.value;
                                  updateItem(idx, "searchQuery", q);
                                  updateItem(idx, "description", q);
                                  updateItem(idx, "showSuggestions", q.trim().length > 0);
                                }}
                                onFocus={() => {
                                  if (item.searchQuery) {
                                    updateItem(idx, "showSuggestions", true);
                                  }
                                }}
                              />
                              {item.showSuggestions && (
                                <div className="suggestion-dropdown">
                                  {catalogOptions
                                    .filter((o) =>
                                      o.label.toLowerCase().includes((item.searchQuery || "").toLowerCase())
                                    )
                                    .slice(0, 5)
                                    .map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="suggestion-item"
                                        onMouseDown={() => {
                                          updateItem(idx, "catalogOptionId", opt.id);
                                          updateItem(idx, "description", opt.description);
                                          updateItem(idx, "searchQuery", opt.label);
                                          updateItem(idx, "unitPrice", opt.price);
                                          updateItem(idx, "showSuggestions", false);
                                        }}
                                      >
                                        <div style={{ fontWeight: 600 }}>{opt.label}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                                          <span>Detalle del catálogo</span>
                                          <strong>{fmt(opt.price)}</strong>
                                        </div>
                                      </div>
                                    ))}
                                  <div
                                    className="suggestion-item suggestion-item--custom"
                                    onMouseDown={() => updateItem(idx, "showSuggestions", false)}
                                  >
                                    + Usar descripción personalizada escrita
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              style={{ textAlign: "right" }}
                              value={item.quantity}
                              min="1"
                              onChange={(e) => updateItem(idx, "quantity", Math.max(1, Number(e.target.value)))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              style={{ textAlign: "right" }}
                              value={item.unitPrice}
                              min="0"
                              onChange={(e) => updateItem(idx, "unitPrice", Math.max(0, Number(e.target.value)))}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-primary)", paddingRight: "10px" }}>
                            {fmt(item.quantity * item.unitPrice)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {form.items.length > 1 && (
                              <button
                                type="button"
                                className="btn-remove-row"
                                onClick={() => removeItem(idx)}
                                title="Eliminar fila"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" className="btn-add-row" onClick={addItem}>
                  <Plus size={14} /> Agregar Fila
                </button>

                {/* Financial Summary */}
                <div className="quotation-totals-grid" style={{ marginTop: "16px" }}>
                  <div className="quotation-notes-area">
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Aviso de facturación:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      Las Boletas (B001) y Facturas (F001) generan numeraciones oficiales y quedan bloqueadas una vez creadas. Las Notas de Venta pueden ser modificadas o promovidas posteriormente.
                    </p>
                  </div>

                  <div className="quotation-totals-card">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <strong>{fmt(subtotal)}</strong>
                    </div>

                    <div className="total-row total-row--input">
                      <span>Descuento (S/):</span>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        step="0.01"
                        value={form.discount}
                        onChange={(e) => setForm((p) => ({ ...p, discount: Math.max(0, Number(e.target.value)) }))}
                      />
                    </div>

                    <div className="total-row total-row--input">
                      <span>IGV (%):</span>
                      <input
                        type="number"
                        min="0"
                        value={form.tax}
                        onChange={(e) => setForm((p) => ({ ...p, tax: Math.max(0, Number(e.target.value)) }))}
                      />
                    </div>

                    <div className="total-row total-row--final" style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "8px", marginTop: "8px" }}>
                      <span>Total final:</span>
                      <strong style={{ color: "var(--primary-color)", fontSize: "1.2rem" }}>{fmt(total)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="quotation-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" style={{ background: "var(--primary-gradient)" }} disabled={saving}>
                  {saving ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
                  {saving ? "Guardando..." : editTarget ? "Guardar cambios" : "Registrar venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewTarget && (
        <div className="quotation-form-overlay" onClick={() => setViewTarget(null)}>
          <div className="quotation-form-modal quotation-form-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="quotation-form-header">
              <div className="quotation-form-header__icon" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <ShoppingCart size={20} />
              </div>
              <div>
                <h2>{viewTarget.saleNumber}</h2>
                <p>Detalle de la venta y comprobante</p>
              </div>
              <button className="quotation-form-close" onClick={() => setViewTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="quotation-form">
              <div className="quotation-form-scroll-area">
                {/* Cliente */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">1</span>
                    <h3>Datos del Cliente</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group"><span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Nombre / Razón Social</span><strong>{viewTarget.clientName}</strong></div>
                    <div className="form-group"><span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Documento</span><strong>{viewTarget.clientDocument}</strong></div>
                    {viewTarget.clientPhone && <div className="form-group"><span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Teléfono</span><strong>{viewTarget.clientPhone}</strong></div>}
                    {viewTarget.clientEmail && <div className="form-group"><span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Correo electrónico</span><strong>{viewTarget.clientEmail}</strong></div>}
                    {viewTarget.clientAddress && <div className="form-group form-group--full"><span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Dirección</span><strong>{viewTarget.clientAddress}</strong></div>}
                  </div>
                </div>

                {/* Items */}
                <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                  <PackagePlus size={15} />
                  <span>Detalle de ítems</span>
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
                <div className="materials-total-cost-strip" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", marginTop: "14px" }}>
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
                    <span>Total de la venta:</span>
                    <strong style={{ color: "var(--primary-color)" }}>{fmt(viewTarget.total)}</strong>
                  </div>
                </div>

                {/* Meta info */}
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <div className="form-group">
                    <span>Método de Pago</span>
                    <strong>{viewTarget.paymentMethod}</strong>
                  </div>
                  <div className="form-group">
                    <span>Estado del Pago</span>
                    <span className={`s-status-badge ${STATUS_CONFIG[viewTarget.status].cls}`}>
                      {STATUS_CONFIG[viewTarget.status].label}
                    </span>
                  </div>
                  <div className="form-group">
                    <span>Comprobante emitido</span>
                    <strong style={{ color: "var(--primary-color)" }}>
                      {BILLING_CONFIG[viewTarget.billingType].label} {viewTarget.billingNumber ? `(${viewTarget.billingNumber})` : ""}
                    </strong>
                  </div>
                </div>

                {/* Quick actions for state change */}
                <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                  <span>Cambiar Estado de Pago</span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                  {(["PENDIENTE", "PAGADA", "ANULADA"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`q-status-action-btn q-status-action-btn--${s.toLowerCase()} ${viewTarget.status === s ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(viewTarget.id, s)}
                      disabled={viewTarget.status === s}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>

                {/* Quick actions for payment method change */}
                <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                  <span>Cambiar Método de Pago</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {["EFECTIVO", "TRANSFERENCIA", "YAPE", "PLIN", "TARJETA"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--glass-border)",
                        background: viewTarget.paymentMethod === m ? "var(--primary-color)" : "var(--glass-surface)",
                        color: viewTarget.paymentMethod === m ? "white" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.8rem",
                        transition: "all 0.2s",
                      }}
                      onClick={() => handleUpdatePaymentMethod(viewTarget.id, m)}
                      disabled={viewTarget.paymentMethod === m}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Convert block */}
                {viewTarget.billingType === "NOTA_DE_VENTA" && (
                  <div className="convert-invoice-section">
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      💡 Emitir Factura oficial o Boleta de Venta
                    </span>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      Esta Nota de Venta es un registro interno. Puede convertirla en un comprobante oficial de pago SUNAT (Boleta o Factura). Esta acción generará una numeración oficial correlativa y no se puede deshacer.
                    </p>
                    <div className="convert-buttons">
                      <button
                        type="button"
                        className="btn-convert btn-convert--boleta"
                        onClick={() => handleConvertToInvoice(viewTarget.id, "BOLETA")}
                      >
                        Emitir Boleta de Venta
                      </button>
                      <button
                        type="button"
                        className="btn-convert btn-convert--factura"
                        onClick={() => handleConvertToInvoice(viewTarget.id, "FACTURA")}
                      >
                        Emitir Factura (RUC)
                      </button>
                    </div>
                  </div>
                )}

                {/* Sharing Suite */}
                <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                  <span>Enviar y Compartir Comprobante</span>
                </div>
                <div className="share-action-group">
                  <button
                    type="button"
                    className="btn-share btn-share--whatsapp"
                    onClick={() => handleSendWhatsApp(viewTarget)}
                  >
                    <Send size={15} /> WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn-share btn-share--email"
                    onClick={() => handleSendEmail(viewTarget.id)}
                    disabled={!viewTarget.clientEmail}
                    title={!viewTarget.clientEmail ? "El cliente no tiene correo registrado" : ""}
                  >
                    <Send size={15} /> Correo Electrónico
                  </button>
                  <button
                    type="button"
                    className="btn-share btn-share--print"
                    onClick={() => handlePrint(viewTarget)}
                  >
                    <Printer size={15} /> Imprimir / PDF
                  </button>
                </div>
              </div>

              <div className="quotation-form-actions" style={{ marginTop: "16px" }}>
                <button type="button" className="btn-cancel" onClick={() => setViewTarget(null)} style={{ width: "100%" }}>
                  Cerrar Detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar registro de venta"
          description={`¿Está seguro de que desea eliminar la venta ${deleteTarget.saleNumber} de ${deleteTarget.clientName}? Se perderán los registros correspondientes.`}
          confirmLabel="Eliminar"
          icon="delete"
          onConfirm={handleDeleteSale}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
