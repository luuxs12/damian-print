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
  PackagePlus,
  Loader2,
  Printer,
  Send,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { generatePageNumbers } from "@/shared/utils/pagination";
import {
  quotationsService,
  type Quotation,
  type QuotationStats,
  type QuotationItem,
  type CreateQuotationPayload,
} from "../services/quotations-service";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";
import { clientsService } from "../../clients/services/clients-service";
import { productsService } from "../../products/services/products-service";
import { presentationsService } from "../../presentations/services/presentations-service";
import { productionService } from "../../production/services/production-service";
import type { Client } from "../../clients/types/client.types";
import "./quotations-page.scss";

export interface UIQuotationItem extends QuotationItem {
  catalogOptionId?: string;
  searchQuery?: string;
  showSuggestions?: boolean;
  productId?: number | null;
  promisedDate?: string;
  priceType?: "PUBLIC" | "RESELLER" | "SPECIAL" | "SCALE" | "MANUAL";
  selectedPresentationId?: string;
  productOverheadDays?: number;
}

export interface CatalogItemOption {
  type: "PRODUCT" | "PRESENTATION";
  id: string;
  label: string;
  description: string;
  price: number;
  priceReseller?: number;
  hasScales?: boolean;
  product?: any;
  presentation?: any;
}


/* ───────── helpers ───────── */
const STATUS_CONFIG = {
  PENDING:  { label: "Pendiente",  icon: Clock,       cls: "status-pending"  },
  APPROVED: { label: "Aprobada",   icon: CheckCircle, cls: "status-approved" },
  REJECTED: { label: "Rechazada",  icon: XCircle,     cls: "status-rejected" },
  EXPIRED:  { label: "Expirada",   icon: XCircle,     cls: "status-expired"  },
  VENDIDA:  { label: "Vendida",    icon: CheckCircle, cls: "status-vendida"  },
} as const;

const fmt = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

/* ───────── empty item ───────── */
const emptyItem = (): UIQuotationItem => ({
  description: "",
  quantity:    1,
  unitPrice:   0,
  totalPrice:  0,
  catalogOptionId: "",
  searchQuery: "",
  showSuggestions: false,
  promisedDate: "",
  priceType: "PUBLIC",
  selectedPresentationId: "",
  productOverheadDays: 0,
});

/* ───────── empty form ───────── */
const emptyForm = () => ({
  clientId:       null as number | null,
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
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stats, setStats] = useState<QuotationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [clients, setClients] = useState<Client[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogItemOption[]>([]);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  /* modals */
  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Quotation | null>(null);
  const [viewTarget, setViewTarget]     = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

  /* form state */
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLocked = editTarget?.status === "VENDIDA";

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s, cls, prods, pres, prodOrders] = await Promise.all([
        quotationsService.getAll(),
        quotationsService.getStats(),
        clientsService.getClients(),
        productsService.getProducts(),
        presentationsService.getPresentations(),
        productionService.getProductionOrders().catch(() => []),
      ]);
      setQuotations(data);
      setStats(s);
      setClients(cls.filter((c) => c.status === "ACTIVE"));
      setPresentations(pres.filter((p) => p.status === "ACTIVE"));
      setProductionOrders(prodOrders);

      const activeProds = prods.filter((p) => p.status === "ACTIVE");
      const activePres = pres.filter((p) => p.status === "ACTIVE");
      const options: CatalogItemOption[] = [];

      activeProds.forEach((p) => {
        const typeLabel = p.type === "SERVICE" ? "Servicio" : p.type === "MATERIAL" ? "Material" : "Producto";
        options.push({
          type: "PRODUCT",
          id: `prod-${p.id}`,
          label: `[${typeLabel}] ${p.code ? `${p.code} - ` : ""}${p.name}`,
          description: p.name,
          price: Number(p.pricePublic) || 0,
          priceReseller: Number(p.priceReseller) || 0,
          hasScales: Boolean(p.priceScales && p.priceScales.length > 0),
          product: p,
        });
      });

      activePres.forEach((pr) => {
        options.push({
          type: "PRESENTATION",
          id: `pres-${pr.id}`,
          label: `[Presentación] ${pr.productName || "Producto"} - ${pr.name}`,
          description: `${pr.productName || "Producto"} - ${pr.name}${pr.size ? ` (${pr.size})` : ""}${pr.material ? `, ${pr.material}` : ""}${pr.finish ? `, ${pr.finish}` : ""}`,
          price: Number(pr.price) || 0,
          presentation: pr,
        });
      });

      setCatalogOptions(options);
    } catch (err: any) {
      console.error("Error al cargar cotizaciones:", err);
      toast.error(`Error al cargar cotizaciones: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

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
      clientId:       detail.clientId,
      clientName:     detail.clientName,
      clientDocument: detail.clientDocument,
      clientPhone:    detail.clientPhone || "",
      clientEmail:    detail.clientEmail || "",
      clientAddress:  detail.clientAddress || "",
      discount:       detail.discount,
      tax:            detail.tax,
      validUntil:     detail.validUntil.substring(0, 10),
      notes:          detail.notes || "",
      items:          detail.items?.map((i) => {
        const cleanDesc = i.description.split(" (Acabado:")[0];
        const opt = catalogOptions.find((o) => o.description === cleanDesc);
        
        let presentationId = "";
        if (opt && opt.type === "PRODUCT" && opt.product && i.description.includes(" (Acabado:")) {
          const match = i.description.match(/\(Acabado:\s*(.*?)\)/);
          if (match && match[1]) {
            const presName = match[1].trim();
            const foundPres = presentations.find(
              (pr) => pr.productId === opt.product.id && pr.name.toLowerCase() === presName.toLowerCase()
            );
            if (foundPres) {
              presentationId = String(foundPres.id);
            }
          }
        }

        return {
          description: i.description,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          totalPrice:  i.totalPrice,
          catalogOptionId: opt ? opt.id : "",
          searchQuery: opt ? opt.label : i.description,
          showSuggestions: false,
          promisedDate: i.promisedDate ? i.promisedDate.substring(0, 10) : "",
          priceType: "MANUAL" as const,
          selectedPresentationId: presentationId,
          productOverheadDays: opt?.product?.overheadCost ? Number(opt.product.overheadCost) : 0,
        };
      }) || [emptyItem()],
    });
    setShowForm(true);
  };

  const openView = async (q: Quotation) => {
    const detail = await quotationsService.getById(q.id);
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
          clientId: null, // is a new client
          clientName: result.name,
          clientAddress: result.address || p.clientAddress,
        }));
        toast.success("Datos obtenidos de RENIEC/SUNAT. Se registrará automáticamente al guardar.");
      } else {
        toast.error("No se encontraron resultados en RENIEC/SUNAT.");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || "Error al realizar la consulta.";
      toast.error(msg);
    } finally {
      setIsSearchingDoc(false);
    }
  };

  const updateItemFields = (idx: number, fields: Partial<UIQuotationItem>) => {
    setForm((prev) => {
      const items = [...prev.items];
      const current = items[idx] || emptyItem();
      const updated = {
        ...current,
        ...fields,
      };
      const qty = updated.quantity;
      const price = updated.unitPrice;
      updated.totalPrice = qty * price;
      items[idx] = updated;
      return { ...prev, items };
    });
  };


  const addItem    = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const duplicateItem = (idx: number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const cloned = {
        ...items[idx],
        showSuggestions: false,
      };
      items.splice(idx + 1, 0, cloned);
      return { ...prev, items };
    });
  };

  const getOrdersCountForDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const chosen = dateStr.split("T")[0];
    return productionOrders.filter((o) => {
      if (!o.promisedDate) return false;
      const oDate = o.promisedDate.split("T")[0];
      return oDate === chosen;
    }).length;
  };

  const getMinRecommendedDate = (overheadDays: number) => {
    if (!overheadDays) return "";
    const d = new Date();
    d.setDate(d.getDate() + overheadDays);
    return d.toISOString().split("T")[0];
  };

  const getProductPrices = (item: UIQuotationItem) => {
    if (!item.catalogOptionId) return [];
    const opt = catalogOptions.find((o) => o.id === item.catalogOptionId);
    if (!opt || opt.type !== "PRODUCT" || !opt.product) return [];

    const p = opt.product;
    const pricesList = [
      { type: "PUBLIC", label: `Público: S/ ${Number(p.pricePublic).toFixed(2)}`, value: Number(p.pricePublic) },
      { type: "RESELLER", label: `Revendedor: S/ ${Number(p.priceReseller).toFixed(2)}`, value: Number(p.priceReseller) },
    ];

    if (form.clientId && p.specialPrices && p.specialPrices.length > 0) {
      const sp = p.specialPrices.find((s: any) => s.clientId === form.clientId);
      if (sp) {
        pricesList.push({
          type: "SPECIAL",
          label: `⭐ Especial: S/ ${Number(sp.price).toFixed(2)}`,
          value: Number(sp.price)
        });
      }
    }

    if (p.priceScales && p.priceScales.length > 0) {
      const applicableScale = [...p.priceScales]
        .sort((a: any, b: any) => b.minQty - a.minQty)
        .find((scale: any) => item.quantity >= scale.minQty);
      
      if (applicableScale) {
        pricesList.push({
          type: "SCALE",
          label: `📦 Escala (Min. ${applicableScale.minQty}): S/ ${Number(applicableScale.price).toFixed(2)}`,
          value: Number(applicableScale.price)
        });
      } else {
        const nextScale = [...p.priceScales].sort((a: any, b: any) => a.minQty - b.minQty)[0];
        if (nextScale) {
          pricesList.push({
            type: "SCALE",
            label: `📦 Escala (Min. ${nextScale.minQty}): S/ ${Number(nextScale.price).toFixed(2)} (Faltan ${nextScale.minQty - item.quantity} u.)`,
            value: Number(nextScale.price)
          });
        }
      }
    }

    return pricesList;
  };

  const recalculateItemPrice = (item: UIQuotationItem, qty: number, priceType: string, presId: string) => {
    let base = item.unitPrice;

    const opt = catalogOptions.find((o) => o.id === item.catalogOptionId);
    if (opt && opt.type === "PRODUCT" && opt.product) {
      const p = opt.product;
      if (priceType === "PUBLIC") {
        base = Number(p.pricePublic);
      } else if (priceType === "RESELLER") {
        base = Number(p.priceReseller);
      } else if (priceType === "SPECIAL" && form.clientId) {
        const sp = p.specialPrices?.find((s: any) => s.clientId === form.clientId);
        base = sp ? Number(sp.price) : Number(p.pricePublic);
      } else if (priceType === "SCALE") {
        const applicableScale = [...(p.priceScales || [])]
          .sort((a: any, b: any) => b.minQty - a.minQty)
          .find((scale: any) => qty >= scale.minQty);
        base = applicableScale ? Number(applicableScale.price) : Number(p.pricePublic);
      }
    } else if (opt && opt.type === "PRESENTATION") {
      base = opt.price;
    }

    if (presId) {
      const chosenPres = presentations.find((pr) => String(pr.id) === String(presId));
      if (chosenPres) {
        base += Number(chosenPres.price);
      }
    }

    return base;
  };

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
      let finalClientId = form.clientId;
      if (!finalClientId) {
        // Automatically register new client
        try {
          const doc = form.clientDocument.trim();
          const docType: "DNI" | "RUC" = doc.length === 11 ? "RUC" : "DNI";
          const clientType: "EMPRESA" | "PARTICULAR" = doc.length === 11 ? "EMPRESA" : "PARTICULAR";
          
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
        } catch (err: unknown) {
          const msg = (err as { message?: string }).message || "Error al registrar cliente automáticamente.";
          toast.error(msg);
          setSaving(false);
          return;
        }
      }

      const payload: CreateQuotationPayload = {
        clientId:       finalClientId,
        clientName:     form.clientName,
        clientDocument: form.clientDocument,
        clientPhone:    form.clientPhone || undefined,
        clientEmail:    form.clientEmail || undefined,
        clientAddress:  form.clientAddress || undefined,
        items:          form.items.map((i) => {
          const chosenPres = presentations.find((pr) => String(pr.id) === String(i.selectedPresentationId));
          const suffix = chosenPres ? ` (Acabado: ${chosenPres.name})` : "";
          return {
            description: i.description.includes(" (Acabado:") ? i.description : (i.description + suffix),
            quantity:    i.quantity,
            unitPrice:   i.unitPrice,
            totalPrice:  i.quantity * i.unitPrice,
            promisedDate: i.promisedDate || undefined,
          };
        }),
        discount:   form.discount,
        tax:        form.tax,
        validUntil: form.validUntil,
        notes:      form.notes || undefined,
      };
      if (editTarget) {
        const updated = await quotationsService.update(editTarget.id, payload);
        setQuotations((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        toast.success("Cotización actualizada con éxito.");
        setSuccessMsg("¡Cotización actualizada!");
      } else {
        const created = await quotationsService.create(payload);
        setQuotations((prev) => [created, ...prev]);
        toast.success(`Cotización ${created.quotationNumber} creada con éxito.`);
        setSuccessMsg(`¡Cotización ${created.quotationNumber} creada!`);
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
      setSuccessMsg("¡Estado de cotización actualizado!");
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
      setSuccessMsg("¡Cotización eliminada!");
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "Error al eliminar.";
      toast.error(msg);
    }
  };

  /* ── email/whatsapp/print helpers ── */
  const handleSendEmail = async (id: number) => {
    const loader = toast.loading("Enviando correo de cotización...");
    try {
      const res = await quotationsService.sendEmail(id) as any;
      if (res.sent) {
        if (res.previewUrl) {
          toast.success("Correo enviado con éxito (Modo de Prueba).", {
            id: loader,
            duration: 15000,
            action: {
              label: "Ver Correo",
              onClick: () => window.open(res.previewUrl, "_blank"),
            },
          });
        } else {
          toast.success("Correo enviado con éxito.", { id: loader });
        }
      } else {
        toast.error("No se pudo enviar. SMTP no configurado.", { id: loader });
      }
    } catch (err: any) {
      toast.error(err.message || "Error al enviar correo.", { id: loader });
    }
  };

  const handleSendWhatsApp = (q: Quotation) => {
    if (!q.clientPhone) {
      toast.error("El cliente no tiene teléfono registrado.");
      return;
    }
    const cleanPhone = q.clientPhone.replace(/\D/g, "");
    const itemsText = q.items?.map((i) => `- ${i.quantity}x ${i.description} (${fmt(i.totalPrice)})`).join("%0A") || "";
    const text = `Hola *${q.clientName}*, adjuntamos el detalle de su Cotización *${q.quotationNumber}*:%0A%0A${itemsText}%0A%0A*Total:* ${fmt(q.total)}%0A*Válido hasta:* ${new Date(q.validUntil).toLocaleDateString("es-PE")}%0A%0A_Industria Gráfica Damian_`;
    window.open(`https://api.whatsapp.com/send?phone=51${cleanPhone}&text=${text}`, "_blank");
  };

  const handlePrint = (q: Quotation) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("El navegador bloqueó la ventana emergente de impresión.");
      return;
    }

    const itemsRows = q.items?.map(i => `
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
          <title>Cotización - ${q.quotationNumber}</title>
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
              <div style="font-size: 14px; font-weight: bold; margin-top: 8px; color: #00aeef;">COTIZACIÓN</div>
              <div style="font-size: 14px; font-weight: bold;">N° ${q.quotationNumber}</div>
            </div>
            <div class="client-info">
              <strong>CLIENTE:</strong> ${q.clientName}<br/>
              <strong>DNI/RUC:</strong> ${q.clientDocument}<br/>
              ${q.clientAddress ? `<strong>DIRECCIÓN:</strong> ${q.clientAddress}<br/>` : ""}
              <strong>FECHA VALIDEZ:</strong> ${new Date(q.validUntil).toLocaleDateString("es-PE")}
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
                <td style="text-align: right;">S/ ${q.subtotal.toFixed(2)}</td>
              </tr>
              ${q.discount > 0 ? `
              <tr>
                <td>Descuento:</td>
                <td style="text-align: right; color: red;">-S/ ${q.discount.toFixed(2)}</td>
              </tr>` : ""}
              <tr>
                <td>IGV (${q.tax}%):</td>
                <td style="text-align: right;">S/ ${((q.subtotal - q.discount) * (q.tax / 100)).toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 16px; border-top: 1px solid #333;">
                <td style="padding-top: 6px;">Total:</td>
                <td style="text-align: right; padding-top: 6px;">S/ ${q.total.toFixed(2)}</td>
              </tr>
            </table>
            <div class="footer">
              <p>¡Gracias por su preferencia! Validez hasta ${new Date(q.validUntil).toLocaleDateString("es-PE")}</p>
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

  /* ── filtered list ── */
  const filtered = quotations.filter((q) => {
    const matchSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.clientDocument.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                {paginated.map((q) => {
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

        <div className="shared-pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          {generatePageNumbers(currentPage, totalPages).map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(Number(page))}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
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
              {isLocked && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  margin: "12px 24px 0 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertCircle size={16} />
                  <span>Esta cotización ya fue vendida y no se puede modificar.</span>
                </div>
              )}

              <div className="quotation-form-scroll-area">
                {/* Sección 1: Datos del cliente */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">1</span>
                    <h3>Datos del Cliente</h3>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>DNI / RUC *</label>
                      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                        <input
                          type="text"
                          placeholder="Ingrese DNI o RUC y pulse Buscar..."
                          value={form.clientDocument}
                          style={{ flex: 1 }}
                          disabled={isLocked}
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
                          required
                        />
                        <button
                          type="button"
                          className="btn-search-doc"
                          onClick={handleSearchDocument}
                          disabled={isSearchingDoc || isLocked}
                          style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? "not-allowed" : "pointer" }}
                        >
                          {isSearchingDoc ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            "Buscar"
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ej. 987654321"
                        value={form.clientPhone}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nombre completo / Razón social *</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez / Empresa ABC S.A.C."
                        value={form.clientName}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Correo electrónico</label>
                      <input
                        type="email"
                        placeholder="Ej. cliente@email.com"
                        value={form.clientEmail}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))}
                      />
                    </div>

                    <div className="form-group form-group--full">
                      <label>Dirección</label>
                      <input
                        type="text"
                        placeholder="Ej. Av. Principal 123, Lima"
                        value={form.clientAddress}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, clientAddress: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 2: Ítems */}
                <div className="form-section-card form-section-card--quotation-items">
                  <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="section-num">2</span>
                      <h3>Ítems de la Cotización</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-add-item"
                      onClick={addItem}
                      disabled={isLocked}
                      style={{ height: "30px", padding: "0 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", margin: 0, opacity: isLocked ? 0.5 : 1, cursor: isLocked ? "not-allowed" : "pointer" }}
                    >
                      <Plus size={14} /> Agregar ítem
                    </button>
                  </div>

                  <div className="q-items-list">
                    {form.items.map((item, idx) => {
                      const minDate = getMinRecommendedDate(item.productOverheadDays || 0);
                      const ordersOnDate = item.promisedDate ? getOrdersCountForDate(item.promisedDate) : 0;
                      const dateStatusColor = !item.promisedDate ? "transparent" : ordersOnDate >= 3 ? "#ef4444" : ordersOnDate >= 1 ? "#eab308" : "#10b981";
                      const pricesList = getProductPrices(item);

                      // Find available finishes for this product if applicable
                      const currentOpt = catalogOptions.find((o) => o.id === item.catalogOptionId);
                      const availableFinishes = currentOpt?.type === "PRODUCT"
                        ? presentations.filter(pr => pr.productId === currentOpt.product.id)
                        : [];

                      return (
                        <div className="quotation-form-item-row" key={idx}>
                          {/* 1. Producto / Servicio */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Producto / Servicio *</label>
                            <div className="catalog-search-container" style={{ position: "relative" }}>
                              <input
                                type="text"
                                placeholder="Buscar en catálogo (nombre o código)..."
                                value={item.searchQuery || ""}
                                disabled={isLocked}
                                onChange={(e) => {
                                  const q = e.target.value;
                                  updateItemFields(idx, {
                                    searchQuery: q,
                                    showSuggestions: q.trim().length > 0
                                  });
                                }}
                                onFocus={() => {
                                  if (item.searchQuery) {
                                    updateItemFields(idx, { showSuggestions: true });
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    updateItemFields(idx, { showSuggestions: false });
                                  }, 200);
                                }}
                              />
                              {item.showSuggestions && (
                                <div className="catalog-suggestions-dropdown">
                                  {catalogOptions
                                    .filter((o) => {
                                      const query = (item.searchQuery || "").toLowerCase().trim();
                                      if (!query) return false;
                                      return (
                                        o.label.toLowerCase().includes(query) ||
                                        (o.description && o.description.toLowerCase().includes(query)) ||
                                        (o.product?.code && o.product.code.toLowerCase().includes(query))
                                      );
                                    })
                                    .slice(0, 5)
                                    .map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="suggestion-item"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          const overhead = opt.product?.overheadCost ? Number(opt.product.overheadCost) : 0;
                                          const calculatedPrice = recalculateItemPrice({
                                            ...item,
                                            catalogOptionId: opt.id,
                                            priceType: "PUBLIC",
                                            selectedPresentationId: ""
                                          }, item.quantity, "PUBLIC", "");
                                          
                                          updateItemFields(idx, {
                                            catalogOptionId: opt.id,
                                            description: opt.description || opt.label,
                                            searchQuery: opt.label,
                                            showSuggestions: false,
                                            priceType: "PUBLIC",
                                            selectedPresentationId: "",
                                            productOverheadDays: overhead,
                                            unitPrice: calculatedPrice,
                                          });
                                        }}
                                      >
                                        <div className="suggestion-label" style={{ fontWeight: 600 }}>{opt.label}</div>
                                        <div className="suggestion-price-info" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>Precio Público:</span>
                                            <strong>{fmt(opt.price)}</strong>
                                          </div>
                                          {opt.priceReseller !== undefined && opt.priceReseller > 0 && (
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                              <span>Precio Revendedor:</span>
                                              <strong>{fmt(opt.priceReseller)}</strong>
                                            </div>
                                          )}
                                          {opt.hasScales && (
                                            <div style={{ color: "var(--primary-color)", fontStyle: "italic" }}>
                                              * Este producto tiene precios por escala / mayoreo.
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  {catalogOptions.filter((o) => {
                                    const query = (item.searchQuery || "").toLowerCase().trim();
                                    if (!query) return false;
                                    return (
                                      o.label.toLowerCase().includes(query) ||
                                      (o.description && o.description.toLowerCase().includes(query)) ||
                                      (o.product?.code && o.product.code.toLowerCase().includes(query))
                                    );
                                  }).length === 0 && (
                                    <div className="suggestion-item suggestion-item--empty">
                                      No se encontraron resultados
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. Acabado (Finishes) */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Acabado</label>
                            {availableFinishes.length > 0 ? (
                              <select
                                value={item.selectedPresentationId || ""}
                                disabled={isLocked}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const base = recalculateItemPrice(item, item.quantity, item.priceType || "PUBLIC", val);
                                  updateItemFields(idx, {
                                    selectedPresentationId: val,
                                    unitPrice: base
                                  });
                                }}
                              >
                                <option value="">Ninguno (Estándar)</option>
                                {availableFinishes.map((f) => (
                                  <option key={f.id} value={f.id}>{f.name} (+S/ {f.price})</option>
                                ))}
                              </select>
                            ) : (
                              <select disabled style={{ cursor: "not-allowed", opacity: 0.7 }}>
                                <option value="">No aplica</option>
                              </select>
                            )}
                          </div>

                          {/* 3. Descripción libre */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Descripción libre *</label>
                            <input
                              type="text"
                              placeholder="Ej. Impresión offset 4 colores..."
                              value={item.description}
                              disabled={isLocked}
                              onChange={(e) => updateItemFields(idx, { description: e.target.value })}
                              required
                            />
                          </div>

                          {/* 4. Fecha Entrega (Prod.) */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Fecha Entrega (Prod.)</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <input
                                type="date"
                                value={item.promisedDate || ""}
                                min={minDate || undefined}
                                disabled={isLocked}
                                onChange={(e) => updateItemFields(idx, { promisedDate: e.target.value })}
                              />
                              {item.promisedDate && (
                                <div style={{ fontSize: "0.65rem", display: "flex", alignItems: "center", gap: "4px", color: dateStatusColor, marginTop: "2px" }}>
                                  <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: dateStatusColor }}></span>
                                  {ordersOnDate} pedido(s)
                                </div>
                              )}
                              {minDate && (!item.promisedDate || item.promisedDate < minDate) && (
                                <div style={{ fontSize: "0.65rem", color: "#eab308", fontWeight: 600, marginTop: "2px" }}>Min: {minDate}</div>
                              )}
                            </div>
                          </div>

                          {/* 5. Cant. */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Cant.</label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              disabled={isLocked}
                              onChange={(e) => {
                                const qty = Math.max(1, Number(e.target.value));
                                const base = item.catalogOptionId
                                  ? recalculateItemPrice(item, qty, item.priceType || "PUBLIC", item.selectedPresentationId || "")
                                  : item.unitPrice;
                                updateItemFields(idx, {
                                  quantity: qty,
                                  unitPrice: base
                                });
                              }}
                            />
                          </div>

                          {/* 6. Precio U. */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Precio U.</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                min="0"
                                disabled={isLocked}
                                onChange={(e) => {
                                  updateItemFields(idx, {
                                    unitPrice: Math.max(0, Number(e.target.value)),
                                    priceType: "MANUAL"
                                  });
                                }}
                              />
                              {pricesList.length > 0 && (
                                <select
                                  style={{ fontSize: "0.7rem", padding: "4px", marginTop: "2px" }}
                                  value={item.priceType || "MANUAL"}
                                  disabled={isLocked}
                                  onChange={(e) => {
                                    const pType = e.target.value;
                                    const base = pType !== "MANUAL"
                                      ? recalculateItemPrice(item, item.quantity, pType, item.selectedPresentationId || "")
                                      : item.unitPrice;
                                    updateItemFields(idx, {
                                      priceType: pType as any,
                                      unitPrice: base
                                    });
                                  }}
                                >
                                  <option value="MANUAL">Manual</option>
                                  {pricesList.map((pl) => (
                                    <option key={pl.type} value={pl.type}>{pl.label}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* 7. Total */}
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Total</label>
                            <span className="quotation-item-total-value">
                              {fmt(item.quantity * item.unitPrice)}
                            </span>
                          </div>

                          {/* 8. Actions */}
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }} className="quotation-item-actions">
                            <button
                              type="button"
                              className="btn-clone-row"
                              style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                color: "#818cf8",
                                border: "1px solid rgba(99, 102, 241, 0.2)",
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                cursor: isLocked ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: isLocked ? 0.5 : 1
                              }}
                              onClick={() => duplicateItem(idx)}
                              title="Duplicar fila"
                              disabled={isLocked}
                            >
                              <RefreshCw size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn-delete-row"
                              onClick={() => removeItem(idx)}
                              disabled={isLocked || form.items.length === 1}
                              style={{
                                opacity: (isLocked || form.items.length === 1) ? 0.5 : 1,
                                cursor: (isLocked || form.items.length === 1) ? "not-allowed" : "pointer"
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sección 3: Condiciones */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">3</span>
                    <h3>Condiciones y Totales</h3>
                  </div>

                  <div className="form-row-three">
                    <div className="form-group">
                      <label>Descuento (S/)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.discount}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, discount: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>IGV (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.tax}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, tax: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Válido hasta *</label>
                      <input
                        type="date"
                        value={form.validUntil}
                        disabled={isLocked}
                        onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="quotation-totals-grid" style={{ marginTop: "16px" }}>
                    <div className="quotation-notes-area">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Notas / Observaciones</label>
                        <textarea
                          rows={3}
                          placeholder="Condiciones de pago, tiempo de entrega, etc."
                          value={form.notes}
                          disabled={isLocked}
                          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                          style={{ minHeight: "80px", resize: "none" }}
                        />
                      </div>
                    </div>

                    <div className="quotation-totals-card">
                      <div className="total-row">
                        <span>Subtotal:</span>
                        <strong>{fmt(subtotal)}</strong>
                      </div>
                      <div className="total-row">
                        <span>Descuento:</span>
                        <strong style={{ color: "#ef4444" }}>- {fmt(form.discount)}</strong>
                      </div>
                      <div className="total-row">
                        <span>IGV ({form.tax}%):</span>
                        <strong>{fmt((subtotal - form.discount) * (form.tax / 100))}</strong>
                      </div>
                      <div className="total-row total-row--final">
                        <span>Total Neto:</span>
                        <strong style={{ color: "var(--primary-color)", fontSize: "1.25rem" }}>{fmt(total)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="quotation-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving || isLocked}
                  style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? "not-allowed" : "pointer" }}
                >
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
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">1</span>
                    <h3>Datos del Cliente</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nombre / Razón Social</label>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{viewTarget.clientName}</span>
                    </div>
                    <div className="form-group">
                      <label>Documento</label>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{viewTarget.clientDocument}</span>
                    </div>
                    {viewTarget.clientPhone && (
                      <div className="form-group">
                        <label>Teléfono</label>
                        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{viewTarget.clientPhone}</span>
                      </div>
                    )}
                    {viewTarget.clientEmail && (
                      <div className="form-group">
                        <label>Correo electrónico</label>
                        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{viewTarget.clientEmail}</span>
                      </div>
                    )}
                    {viewTarget.clientAddress && (
                      <div className="form-group form-group--full">
                        <label>Dirección</label>
                        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{viewTarget.clientAddress}</span>
                      </div>
                    )}
                  </div>
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
                    <label>Válido hasta</label>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{fmtDate(viewTarget.validUntil)}</span>
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <div style={{ marginTop: "2px" }}>
                      <span className={`q-status-badge q-status-badge--${viewTarget.status.toLowerCase()}`}>
                        {STATUS_CONFIG[viewTarget.status].label}
                      </span>
                    </div>
                  </div>
                  {viewTarget.notes && (
                    <div className="form-group form-group--full">
                      <label>Notas / Observaciones</label>
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

                {/* Convert to Sale and Sharing suite */}
                <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                  <span>Acciones de Cotización</span>
                </div>
                <div style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  padding: "16px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--glass-border)",
                  marginTop: "4px"
                }}>
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      border: "none",
                      cursor: "pointer",
                      background: "var(--primary-gradient)",
                      color: "white"
                    }}
                    onClick={() => {
                      setViewTarget(null);
                      navigate("/sales", { state: { convertQuotation: viewTarget } });
                    }}
                  >
                    <ShoppingCart size={15} /> Pasar a Venta
                  </button>

                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      border: "none",
                      cursor: "pointer",
                      background: "#25d366",
                      color: "white"
                    }}
                    onClick={() => handleSendWhatsApp(viewTarget)}
                  >
                    <Send size={15} /> WhatsApp
                  </button>

                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      border: "none",
                      cursor: "pointer",
                      background: "#3b82f6",
                      color: "white"
                    }}
                    onClick={() => handleSendEmail(viewTarget.id)}
                    disabled={!viewTarget.clientEmail}
                    title={!viewTarget.clientEmail ? "El cliente no tiene correo registrado" : ""}
                  >
                    <Send size={15} /> Correo Electrónico
                  </button>

                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      border: "none",
                      cursor: "pointer",
                      background: "#64748b",
                      color: "white"
                    }}
                    onClick={() => handlePrint(viewTarget)}
                  >
                    <Printer size={15} /> Imprimir / PDF
                  </button>
                </div>
              </div>

              <div className="quotation-form-actions" style={{ marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setViewTarget(null)} style={{ width: "100%" }}>
                  Cerrar Detalle
                </button>
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

      {successMsg && (
        <SuccessAnimation
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}
    </div>
  );
};
