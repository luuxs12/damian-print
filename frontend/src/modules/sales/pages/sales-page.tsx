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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { generatePageNumbers } from "@/shared/utils/pagination";
import {
  salesService,
  type Sale,
  type SaleStats,
  type SaleItem,
  type CreateSalePayload,
} from "../services/sales-service";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";
import { clientsService } from "../../clients/services/clients-service";
import { productsService } from "../../products/services/products-service";
import { presentationsService } from "../../presentations/services/presentations-service";
import { productionService } from "../../production/services/production-service";
import { quotationsService } from "../../quotations/services/quotations-service";
import type { Client } from "../../clients/types/client.types";
import "./sales-page.scss";

export interface UISaleItem extends Omit<SaleItem, "id"> {
  catalogOptionId?: string;
  searchQuery?: string;
  showSuggestions?: boolean;
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

const STATUS_CONFIG = {
  PENDIENTE: { label: "Pendiente", icon: Clock, cls: "s-status-badge--pendiente" },
  A_CUENTA:  { label: "A Cuenta",  icon: Clock, cls: "s-status-badge--pendiente" },
  PAGADA:    { label: "Pagada",    icon: CheckCircle, cls: "s-status-badge--pagada" },
  ANULADA:   { label: "Anulada",   icon: XCircle, cls: "s-status-badge--anulada" },
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
  promisedDate: "",
  priceType: "MANUAL",
  selectedPresentationId: "",
  productOverheadDays: 0,
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
  status:         "PENDIENTE" as "PENDIENTE" | "A_CUENTA" | "PAGADA" | "ANULADA",
  paymentMethod:  "EFECTIVO" as "EFECTIVO" | "TRANSFERENCIA" | "YAPE" | "PLIN" | "TARJETA" | "MULTIPLE",
  billingType:    "NOTA_DE_VENTA" as "NOTA_DE_VENTA" | "BOLETA" | "FACTURA",
  advancePayment: 0,
  splitEfectivo:  0,
  splitYape:      0,
  splitPlin:      0,
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [clients, setClients] = useState<Client[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogItemOption[]>([]);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [sendEmailOnSave, setSendEmailOnSave] = useState(false);
  const [yapeEvidence, setYapeEvidence] = useState("");
  const [plinEvidence, setPlinEvidence] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Sale | null>(null);
  const [viewTarget, setViewTarget] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);

  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load state
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s, cls, prods, pres, prodOrders] = await Promise.all([
        salesService.getAll(),
        salesService.getStats(),
        clientsService.getClients(),
        productsService.getProducts(),
        presentationsService.getPresentations(),
        productionService.getProductionOrders().catch(() => []),
      ]);
      setSales(data);
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
      console.error("Error al cargar ventas y comprobantes:", err);
      toast.error(`Error al cargar ventas y comprobantes: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterBilling]);

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
        status:         "PENDIENTE" as const,
        paymentMethod:  "EFECTIVO" as const,
        billingType:    "NOTA_DE_VENTA" as const,
        advancePayment: 0,
        splitEfectivo:  0,
        splitYape:      0,
        splitPlin:      0,
        items:          (q.items && q.items.length > 0)
          ? q.items.map((i: any) => {
              const opt = catalogOptions.find((o) => o.description === i.description);
              return {
                description: i.description,
                quantity:    i.quantity,
                unitPrice:   i.unitPrice,
                totalPrice:  i.totalPrice,
                catalogOptionId: opt ? opt.id : "",
                searchQuery: opt ? opt.label : i.description,
                showSuggestions: false,
                promisedDate: i.promisedDate || "",
                priceType: "MANUAL" as const,
                selectedPresentationId: "",
                productOverheadDays: opt?.product?.overheadCost ? Number(opt.product.overheadCost) : 0,
              };
            })
          : [emptyItem()],
      });
      setCashReceived("");
      setShowForm(true);
      // Clean location state so it doesn't open again on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, catalogOptions, navigate]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setCashReceived("");
    setSendEmailOnSave(false);
    setYapeEvidence("");
    setPlinEvidence("");
    setShowForm(true);
  };

  const openEdit = async (s: Sale) => {
    if (s.status === "PAGADA") {
      toast.error("No se puede modificar una venta ya cobrada/pagada.");
      return;
    }
    const detail = await salesService.getById(s.id);
    setEditTarget(detail);

    let splitEfectivo = 0;
    let splitYape = 0;
    let splitPlin = 0;
    let yapeEv = "";
    let plinEv = "";

    if (detail.paymentMethod === "MULTIPLE" && (detail as any).paymentDetails) {
      const pd = (detail as any).paymentDetails;
      if (pd.startsWith("{")) {
        try {
          const parsed = JSON.parse(pd);
          splitEfectivo = parsed.splitEfectivo || 0;
          splitYape = parsed.splitYape || 0;
          splitPlin = parsed.splitPlin || 0;
          yapeEv = parsed.yapeEvidence || "";
          plinEv = parsed.plinEvidence || "";
        } catch (e) {
          console.error("Error parsing paymentDetails JSON in openEdit", e);
        }
      } else {
        splitEfectivo = Number(pd.match(/EFECTIVO:([\.0-9]+)/)?.[1]) || 0;
        splitYape = Number(pd.match(/YAPE:([\.0-9]+)/)?.[1]) || 0;
        splitPlin = Number(pd.match(/PLIN:([\.0-9]+)/)?.[1]) || 0;
      }
    } else if ((detail.paymentMethod === "YAPE" || detail.paymentMethod === "PLIN") && (detail as any).paymentDetails) {
      const pd = (detail as any).paymentDetails;
      if (pd.startsWith("{")) {
        try {
          const parsed = JSON.parse(pd);
          yapeEv = parsed.yapeEvidence || "";
          plinEv = parsed.plinEvidence || "";
        } catch (e) {}
      } else if (pd.startsWith("data:image")) {
        if (detail.paymentMethod === "YAPE") yapeEv = pd;
        if (detail.paymentMethod === "PLIN") plinEv = pd;
      }
    }

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
      status:         detail.status as any,
      paymentMethod:  detail.paymentMethod as any,
      billingType:    detail.billingType as any,
      advancePayment: (detail as any).advancePayment || 0,
      splitEfectivo,
      splitYape,
      splitPlin,
      items:          (detail.items && detail.items.length > 0)
        ? detail.items.map((i) => {
            const opt = catalogOptions.find((o) => o.description === i.description);
            return {
              description: i.description,
              quantity:    i.quantity,
              unitPrice:   i.unitPrice,
              totalPrice:  i.totalPrice,
              catalogOptionId: opt ? opt.id : "",
              searchQuery: opt ? opt.label : i.description,
              showSuggestions: false,
              promisedDate: i.promisedDate || "",
              priceType: "MANUAL" as const,
              selectedPresentationId: "",
              productOverheadDays: opt?.product?.overheadCost ? Number(opt.product.overheadCost) : 0,
            };
          })
        : [emptyItem()],
    });

    setYapeEvidence(yapeEv);
    setPlinEvidence(plinEv);
    setSendEmailOnSave(detail.clientEmail ? true : false);
    setCashReceived("");
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
          clientAddress: result.address || "",
          clientPhone: "",
          clientEmail: "",
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

  const updateItemFields = (idx: number, fields: Partial<UISaleItem>) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        ...fields,
      };
      items[idx].totalPrice = items[idx].quantity * items[idx].unitPrice;
      return { ...prev, items };
    });
  };



  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
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

    if (form.status === "PENDIENTE") {
      toast.error("Para registrar la venta se requiere un adelanto de al menos la mitad (50%). Cambie el estado a 'A Cuenta' o 'Pagada'.");
      return;
    }

    if (form.status === "A_CUENTA") {
      const minAdvance = total / 2;
      if (form.advancePayment < minAdvance - 0.01) {
        toast.error(`El adelanto mínimo es el 50% (S/ ${minAdvance.toFixed(2)}).`);
        return;
      }
    }

    if (form.paymentMethod === "MULTIPLE") {
      const targetAmount = form.status === "PAGADA" ? total : form.advancePayment;
      const sum = Number(form.splitEfectivo) + Number(form.splitYape) + Number(form.splitPlin);
      if (Math.abs(sum - targetAmount) > 0.05) {
        toast.error(`La suma de los montos de pago mixto (S/ ${sum.toFixed(2)}) debe ser igual al total a cobrar (S/ ${targetAmount.toFixed(2)}).`);
        return;
      }
    }

    // Construct paymentDetails JSON
    let paymentDetailsStr: string | undefined = undefined;
    if (form.paymentMethod === "MULTIPLE") {
      paymentDetailsStr = JSON.stringify({
        splitEfectivo: Number(form.splitEfectivo) || 0,
        splitYape: Number(form.splitYape) || 0,
        splitPlin: Number(form.splitPlin) || 0,
        yapeEvidence,
        plinEvidence
      });
    } else if (form.paymentMethod === "YAPE") {
      paymentDetailsStr = JSON.stringify({ yapeEvidence });
    } else if (form.paymentMethod === "PLIN") {
      paymentDetailsStr = JSON.stringify({ plinEvidence });
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
        discount:       form.discount,
        tax:            form.tax,
        status:         form.status,
        paymentMethod:  form.paymentMethod,
        paymentDetails: paymentDetailsStr,
        advancePayment: form.status === "A_CUENTA" ? Number(form.advancePayment.toFixed(2)) : undefined,
        billingType:    form.billingType,
      };

      let targetId: number | null = null;
      if (editTarget) {
        const updated = await salesService.update(editTarget.id, payload);
        setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Venta/Comprobante actualizado con éxito.");
        setSuccessMsg("¡Venta actualizada con éxito!");
        targetId = updated.id;
      } else {
        const created = await salesService.create(payload);
        setSales((prev) => [created, ...prev]);
        toast.success(`Venta ${created.saleNumber} creada con éxito.`);
        setSuccessMsg(`¡Venta ${created.saleNumber} registrada!`);
        targetId = created.id;
        if (form.quotationId) {
          try {
            await quotationsService.updateStatus(form.quotationId, "VENDIDA");
            toast.success("La cotización asociada ha sido convertida a venta (bloqueada).");
          } catch (qErr) {
            console.error("Error al cambiar el estado de la cotización asociada:", qErr);
          }
        }
      }

      if (sendEmailOnSave && targetId) {
        salesService.sendEmail(targetId).then((res: any) => {
          if (res.sent) {
            if (res.previewUrl) {
              toast.success("Correo enviado automáticamente (Modo de Prueba).", {
                duration: 15000,
                action: {
                  label: "Ver Correo",
                  onClick: () => window.open(res.previewUrl, "_blank"),
                },
              });
            } else {
              toast.success("Correo enviado automáticamente al cliente.");
            }
          }
        }).catch(() => {});
      }

      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: "PENDIENTE" | "A_CUENTA" | "PAGADA" | "ANULADA") => {
    const currentSale = sales.find((s) => s.id === id);
    if (currentSale?.status === "PAGADA") {
      toast.error("No se puede modificar una venta ya cobrada/pagada.");
      return;
    }
    try {
      const updated = await salesService.update(id, { status: newStatus });
      setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: updated.status } : s)));
      if (viewTarget?.id === id) setViewTarget((v) => v ? { ...v, status: updated.status } : v);
      toast.success(`Estado de pago cambiado a ${newStatus}.`);
      setSuccessMsg("¡Estado de cobro actualizado!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado.");
    }
  };

  const handleUpdatePaymentMethod = async (id: number, method: string) => {
    const currentSale = sales.find((s) => s.id === id);
    if (currentSale?.status === "PAGADA") {
      toast.error("No se puede modificar una venta ya cobrada/pagada.");
      return;
    }
    try {
      const updated = await salesService.update(id, { paymentMethod: method });
      setSales((prev) => prev.map((s) => (s.id === id ? { ...s, paymentMethod: updated.paymentMethod } : s)));
      if (viewTarget?.id === id) setViewTarget((v) => v ? { ...v, paymentMethod: updated.paymentMethod } : v);
      toast.success(`Método de pago cambiado a ${method}.`);
      setSuccessMsg("¡Forma de pago actualizada!");
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
      setSuccessMsg("¡Comprobante emitido!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al emitir comprobante.");
    }
  };

  const handleDeleteSale = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.status === "PAGADA") {
      toast.error("No se puede eliminar una venta ya cobrada/pagada.");
      return;
    }
    try {
      await salesService.delete(deleteTarget.id);
      setSales((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Comprobante eliminado con éxito.");
      setSuccessMsg("¡Venta eliminada con éxito!");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar venta.");
    }
  };

  const handleSendEmail = async (id: number) => {
    const loader = toast.loading("Enviando correo al cliente...");
    try {
      const res = await salesService.sendEmail(id) as any;
      if (res.sent) {
        if (res.previewUrl) {
          toast.success("Correo enviado exitosamente (Modo de Prueba).", {
            id: loader,
            duration: 15000,
            action: {
              label: "Ver Correo",
              onClick: () => window.open(res.previewUrl, "_blank"),
            },
          });
        } else {
          toast.success("Correo enviado exitosamente.", { id: loader });
        }
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

  const getProductPrices = (item: UISaleItem) => {
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

  const recalculateItemPrice = (item: UISaleItem, qty: number, priceType: string, presId: string) => {
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{s.saleNumber}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center", justifyContent: "center" }}>
                        <span className={`s-billing-badge ${(BILLING_CONFIG as any)[s.billingType]?.cls ?? "s-billing-badge--nota"}`}>
                          {(BILLING_CONFIG as any)[s.billingType]?.label ?? s.billingType}
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "center", justifyContent: "center" }}>
                        <span className={`s-status-badge ${
                          (STATUS_CONFIG as any)[s.status]?.cls ?? "s-status-badge--pendiente"
                        }`}>
                          {(STATUS_CONFIG as any)[s.status]?.label ?? s.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="sales-actions-cell" style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                        <button
                          className="s-action-btn s-action-btn--view"
                          onClick={() => openView(s)}
                          title="Ver detalle de venta"
                        >
                          <Eye size={15} />
                        </button>

                        {(s.status === "PENDIENTE" || s.status === "A_CUENTA") && (
                          <>
                            <button
                              className="s-action-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "34px",
                                height: "34px",
                                borderRadius: "10px",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "#10b981",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              onClick={() => handleUpdateStatus(s.id, "PAGADA")}
                              title="Cobrar / Aceptar Venta"
                            >
                              <CheckCircle size={15} />
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
                          </>
                        )}

                        {s.status === "PAGADA" && s.billingType === "NOTA_DE_VENTA" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              className="s-action-btn"
                              style={{
                                fontSize: "0.72rem",
                                padding: "0 8px",
                                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontWeight: 700,
                                width: "auto",
                                height: "34px"
                              }}
                              onClick={() => handleConvertToInvoice(s.id, "BOLETA")}
                              title="Emitir Boleta"
                            >
                              Bol
                            </button>
                            <button
                              className="s-action-btn"
                              style={{
                                fontSize: "0.72rem",
                                padding: "0 8px",
                                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontWeight: 700,
                                width: "auto",
                                height: "34px"
                              }}
                              onClick={() => handleConvertToInvoice(s.id, "FACTURA")}
                              title="Emitir Factura"
                            >
                              Fac
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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
                    <div className="form-group">
                      <label htmlFor="clientDocument">DNI / RUC *</label>
                      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                        <input
                          id="clientDocument"
                          type="text"
                          placeholder="Ingrese 8 u 11 dígitos"
                          value={form.clientDocument}
                          style={{ flex: 1 }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setForm((p) => ({ 
                              ...p, 
                              clientDocument: val,
                              clientId: null // Reset clientId so we don't associate with previous client
                            }));
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
                          className="btn-search-doc"
                          onClick={handleSearchDocument}
                          disabled={isSearchingDoc}
                        >
                          {isSearchingDoc ? <Loader2 className="spin" size={14} /> : "Buscar"}
                        </button>
                      </div>
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
                    <h3>Comprobante y Método de Pago</h3>
                  </div>

                  {/* Billing Type */}
                  <div className="form-grid" style={{ marginBottom: "16px" }}>
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
                      <label htmlFor="status">Estado de Cobro</label>
                      <select
                        id="status"
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                      >
                        <option value="PENDIENTE">Pendiente de pago</option>
                        <option value="A_CUENTA">A Cuenta (pago parcial)</option>
                        <option value="PAGADA">Pagada completa</option>
                        <option value="ANULADA">Anulada</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Forma de Pago</label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, paymentMethod: "EFECTIVO" }));
                          setCashReceived("");
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: `2px solid ${form.paymentMethod === "EFECTIVO" ? "rgba(16, 185, 129, 0.4)" : "var(--glass-border)"}`,
                          background: form.paymentMethod === "EFECTIVO" 
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.2))" 
                            : "rgba(255, 255, 255, 0.02)",
                          color: form.paymentMethod === "EFECTIVO" ? "#10b981" : "var(--text-secondary)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>💵</span>
                        <span>Efectivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, paymentMethod: "YAPE" }));
                          setCashReceived("");
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: `2px solid ${form.paymentMethod === "YAPE" ? "rgba(145, 23, 160, 0.5)" : "var(--glass-border)"}`,
                          background: form.paymentMethod === "YAPE" 
                            ? "linear-gradient(135deg, rgba(145, 23, 160, 0.15), rgba(116, 14, 116, 0.2))" 
                            : "rgba(255, 255, 255, 0.02)",
                          color: form.paymentMethod === "YAPE" ? "#f472b6" : "var(--text-secondary)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <img src="/yape-logo.svg" alt="Yape" style={{ height: "16px", borderRadius: "3px", objectFit: "contain" }} />
                        <span>Yape</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, paymentMethod: "MULTIPLE" }));
                          setCashReceived("");
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: `2px solid ${form.paymentMethod === "MULTIPLE" ? "rgba(99, 102, 241, 0.4)" : "var(--glass-border)"}`,
                          background: form.paymentMethod === "MULTIPLE" 
                            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.2))" 
                            : "rgba(255, 255, 255, 0.02)",
                          color: form.paymentMethod === "MULTIPLE" ? "#818cf8" : "var(--text-secondary)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>🔀</span>
                        <span>Pago Mixto</span>
                      </button>
                    </div>
                  </div>

                  {/* Multiple Payment Split Distribution */}
                  {form.paymentMethod === "MULTIPLE" && (
                    <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "12px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 10px 0", fontWeight: 600 }}>🔀 Distribución de Pago Mixto / Múltiple</p>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div className="form-group" style={{ maxWidth: "150px" }}>
                          <label>Efectivo (S/)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.splitEfectivo}
                            onChange={(e) => setForm((p) => ({ ...p, splitEfectivo: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="form-group" style={{ maxWidth: "150px" }}>
                          <label>Yape (S/)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.splitYape}
                            onChange={(e) => setForm((p) => ({ ...p, splitYape: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="form-group" style={{ maxWidth: "150px" }}>
                          <label>Plin (S/)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.splitPlin}
                            onChange={(e) => setForm((p) => ({ ...p, splitPlin: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: "0.78rem", marginTop: "8px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Total distribuido: <span style={{ color: "var(--primary-color)" }}>S/ {(Number(form.splitEfectivo) + Number(form.splitYape) + Number(form.splitPlin)).toFixed(2)}</span>
                        {(() => {
                          const target = form.status === "PAGADA" ? total : form.advancePayment;
                          const diff = (Number(form.splitEfectivo) + Number(form.splitYape) + Number(form.splitPlin)) - target;
                          if (Math.abs(diff) > 0.05) {
                            return <span style={{ color: "#ef4444", marginLeft: "8px" }}>(Falta/Excede: S/ {diff.toFixed(2)} - Debe ser igual a S/ {target.toFixed(2)})</span>;
                          }
                          return <span style={{ color: "#10b981", marginLeft: "8px" }}>✓ Correcto</span>;
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Evidence Uploader section */}
                  {((form.paymentMethod === "YAPE" || form.paymentMethod === "PLIN" || form.paymentMethod === "MULTIPLE") && (form.status === "PAGADA" || form.status === "A_CUENTA")) && (
                    <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 10px 0", fontWeight: 600 }}>📸 Evidencia de Transferencia Bancaria</p>
                      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                        {/* Yape Upload */}
                        {(form.paymentMethod === "YAPE" || (form.paymentMethod === "MULTIPLE" && form.splitYape > 0)) && (
                          <div className="form-group" style={{ minWidth: "200px" }}>
                            <label>Captura Yape *</label>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ fontSize: "0.8rem" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setYapeEvidence(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {yapeEvidence && (
                              <div style={{ marginTop: "6px", position: "relative", display: "inline-block" }}>
                                <img src={yapeEvidence} alt="Evidencia Yape" style={{ maxWidth: "100px", maxHeight: "80px", borderRadius: "4px" }} />
                                <button type="button" onClick={() => setYapeEvidence("")} style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>X</button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Plin Upload */}
                        {(form.paymentMethod === "PLIN" || (form.paymentMethod === "MULTIPLE" && form.splitPlin > 0)) && (
                          <div className="form-group" style={{ minWidth: "200px" }}>
                            <label>Captura Plin *</label>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ fontSize: "0.8rem" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setPlinEvidence(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {plinEvidence && (
                              <div style={{ marginTop: "6px", position: "relative", display: "inline-block" }}>
                                <img src={plinEvidence} alt="Evidencia Plin" style={{ maxWidth: "100px", maxHeight: "80px", borderRadius: "4px" }} />
                                <button type="button" onClick={() => setPlinEvidence("")} style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>X</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* A Cuenta advance */}
                  {form.status === "A_CUENTA" && (
                    <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                      <p style={{ fontSize: "0.8rem", color: "#d97706", margin: "0 0 10px 0", fontWeight: 600 }}>
                        ⚠️ Pago parcial: Se requiere un adelanto de al menos el 50% (S/ {(total / 2).toFixed(2)}). Puede registrar un monto mayor.
                      </p>
                      <div className="form-group" style={{ maxWidth: "240px" }}>
                        <label>Monto Adelantado (S/)*</label>
                        <input
                          type="number"
                          min={total / 2}
                          step="0.01"
                          value={form.advancePayment || ""}
                          onChange={(e) => setForm((p) => ({ ...p, advancePayment: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Cash Received and Change Calculator */}
                  {(form.paymentMethod === "EFECTIVO" || (form.paymentMethod === "MULTIPLE" && form.splitEfectivo > 0)) && (form.status === "PAGADA" || form.status === "A_CUENTA") && (
                    <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "12px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 10px 0", fontWeight: 600 }}>💵 Calculadora de Vuelto (Efectivo)</p>
                      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                        <div className="form-group" style={{ maxWidth: "180px" }}>
                          <label>Monto Recibido (S/)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="0.00"
                          />
                        </div>
                        {cashReceived !== "" && cashReceived > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Resultado</span>
                            {(() => {
                              const target = form.paymentMethod === "MULTIPLE" ? form.splitEfectivo : (form.status === "A_CUENTA" ? form.advancePayment : total);
                              const change = cashReceived - target;
                              if (change >= 0) {
                                return (
                                  <span style={{ fontSize: "1.1rem", fontWeight: 850, color: "#10b981" }}>
                                    Vuelto: {fmt(change)}
                                  </span>
                                );
                              } else {
                                return (
                                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ef4444" }}>
                                    Falta cobrar: {fmt(Math.abs(change))}
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección 2: Ítems */}
                <div className="form-section-card form-section-card--sales-items" style={{ marginTop: "20px" }}>
                  <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="section-num">2</span>
                      <h3>Ítems Vendidos</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-add-item"
                      onClick={addItem}
                      style={{ height: "30px", padding: "0 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", margin: 0 }}
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
                        <div className="sales-form-item-row" key={idx}>
                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Producto / Servicio *</label>
                            <div className="catalog-search-container" style={{ position: "relative" }}>
                              <input
                                type="text"
                                placeholder="Buscar en catálogo..."
                                value={item.searchQuery || ""}
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
                                <div className="suggestion-dropdown">
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
                                          e.preventDefault(); // Prevent input blur
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
                                    <div className="suggestion-item suggestion-item--empty" style={{ fontStyle: "italic", color: "var(--text-secondary)", textAlign: "center" }}>
                                      No se encontraron resultados
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Acabado</label>
                            {availableFinishes.length > 0 ? (
                              <select
                                value={item.selectedPresentationId || ""}
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

                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Descripción libre *</label>
                            <input
                              type="text"
                              placeholder="Ej. Impresión de banner..."
                              value={item.description || ""}
                              onChange={(e) => updateItemFields(idx, { description: e.target.value })}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Fecha Entrega (Prod.)</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <input
                                type="date"
                                value={item.promisedDate || ""}
                                min={minDate || undefined}
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

                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Cant.</label>
                            <input
                              type="number"
                              value={item.quantity}
                              min="1"
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

                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Precio U.</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                min="0"
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

                          <div className="form-group">
                            <label className={idx === 0 ? "" : "mobile-only-label"}>Total</label>
                            <span className="sales-item-total-value">
                              {fmt(item.quantity * item.unitPrice)}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "6px", alignItems: "center", alignSelf: "end", height: "40px" }} className="sales-item-actions">
                            <button
                              type="button"
                              className="btn-clone-row"
                              style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                color: "#818cf8",
                                border: "1px solid rgba(99, 102, 241, 0.2)",
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onClick={() => duplicateItem(idx)}
                              title="Duplicar fila"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-delete-row"
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#ef4444",
                                border: "1px solid rgba(239, 68, 68, 0.15)",
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onClick={() => removeItem(idx)}
                              disabled={form.items.length === 1}
                              title="Eliminar fila"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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

                    <div className="total-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Aplicar IGV (18%):</span>
                      <label className="switch" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.tax === 18}
                          onChange={(e) => setForm((p) => ({ ...p, tax: e.target.checked ? 18 : 0 }))}
                          style={{ display: "none" }}
                        />
                        <div style={{
                          width: "44px",
                          height: "22px",
                          borderRadius: "11px",
                          background: form.tax === 18 ? "var(--primary-color)" : "rgba(255,255,255,0.1)",
                          position: "relative",
                          transition: "all 0.2s ease"
                        }}>
                          <div style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            position: "absolute",
                            top: "3px",
                            left: form.tax === 18 ? "25px" : "3px",
                            transition: "all 0.2s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                          }} />
                        </div>
                      </label>
                    </div>

                    <div className="total-row total-row--final">
                      <span>Total final:</span>
                      <strong style={{ color: "var(--primary-color)", fontSize: "1.2rem" }}>{fmt(total)}</strong>
                    </div>

                    {form.status === "A_CUENTA" && (
                      <>
                        <div className="total-row" style={{ borderTop: "1px dashed var(--glass-border)", paddingTop: "8px", marginTop: "4px" }}>
                          <span>Monto Adelanto:</span>
                          <strong style={{ color: "var(--text-primary)" }}>{fmt(form.advancePayment)}</strong>
                        </div>
                        <div className="total-row" style={{ color: "#f59e0b" }}>
                          <span>Saldo Pendiente:</span>
                          <strong style={{ color: "#f59e0b", fontWeight: 800 }}>{fmt(total - form.advancePayment)}</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Send Toggle */}
              <div style={{ padding: "0 24px 16px 24px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: form.clientEmail ? "pointer" : "not-allowed", opacity: form.clientEmail ? 1 : 0.6 }}>
                  <input
                    type="checkbox"
                    checked={sendEmailOnSave}
                    disabled={!form.clientEmail}
                    onChange={(e) => setSendEmailOnSave(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--primary-color)" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Enviar comprobante automáticamente por correo al guardar
                    {!form.clientEmail && " (Requiere correo del cliente)"}
                  </span>
                </label>
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
                <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                  <PackagePlus size={15} />
                  <span>Detalle de ítems</span>
                </div>
                <div className="builder-table-wrapper" style={{ border: "1px solid var(--glass-border)", borderRadius: "14px", overflow: "hidden" }}>
                  <table className="builder-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Descripción</th>
                        <th style={{ padding: "10px", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Fecha Entrega</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Cant.</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>P. Unit.</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewTarget.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "10px", fontSize: "0.88rem", color: "var(--text-primary)", whiteSpace: "normal" }}>{item.description}</td>
                          <td style={{ padding: "10px", fontSize: "0.88rem", color: "var(--text-primary)", textAlign: "center" }}>{item.promisedDate ? fmtDate(item.promisedDate) : "-"}</td>
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
                    <label>Método de Pago</label>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {(viewTarget as any).paymentMethod === "MULTIPLE" ? "🔀 Pago Mixto" :
                       (viewTarget as any).paymentMethod === "YAPE" ? (
                         <>
                           <img src="/yape-logo.svg" alt="Yape" style={{ height: "14px", borderRadius: "3px" }} />
                           <span>Yape</span>
                         </>
                       ) :
                       (viewTarget as any).paymentMethod === "PLIN" ? "💜 Plin" :
                       (viewTarget as any).paymentMethod === "EFECTIVO" ? "💵 Efectivo" :
                       (viewTarget as any).paymentMethod === "TRANSFERENCIA" ? "🏦 Transferencia" :
                       (viewTarget as any).paymentMethod}
                    </span>
                  </div>
                  <div className="form-group">
                    <label>Estado del Pago</label>
                    <div style={{ marginTop: "2px" }}>
                      <span className={`s-status-badge ${
                        (STATUS_CONFIG as any)[(viewTarget as any).status]?.cls ?? "s-status-badge--pendiente"
                      }`}>
                        {(STATUS_CONFIG as any)[(viewTarget as any).status]?.label ?? (viewTarget as any).status}
                      </span>
                      {(viewTarget as any).status === "A_CUENTA" && (viewTarget as any).advancePayment > 0 && (
                        <div style={{ fontSize: "0.78rem", color: "#d97706", marginTop: "4px", fontWeight: 600 }}>
                          Adelanto: {fmt((viewTarget as any).advancePayment)} &mdash; Saldo: {fmt(viewTarget.total - (viewTarget as any).advancePayment)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comprobante emitido</label>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--primary-color)", marginTop: "2px" }}>
                      {(BILLING_CONFIG as any)[viewTarget.billingType]?.label ?? viewTarget.billingType} {viewTarget.billingNumber ? `(${viewTarget.billingNumber})` : ""}
                    </span>
                  </div>
                </div>

                {(viewTarget as any).status !== "PAGADA" && (viewTarget as any).status !== "ANULADA" && (
                  <>
                    <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                      <span>Cambiar Estado de Pago</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                      {(["PENDIENTE", "A_CUENTA", "PAGADA", "ANULADA"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`q-status-action-btn q-status-action-btn--${s.toLowerCase()} ${(viewTarget as any).status === s ? "active" : ""}`}
                          onClick={() => handleUpdateStatus(viewTarget.id, s)}
                          disabled={(viewTarget as any).status === s}
                        >
                          {(STATUS_CONFIG as any)[s]?.label ?? s}
                        </button>
                      ))}
                    </div>

                    <div className="quotation-form-section-title" style={{ marginTop: "16px" }}>
                      <span>Cambiar Método de Pago</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      {["EFECTIVO", "YAPE", "PLIN", "MULTIPLE"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            border: "1px solid var(--glass-border)",
                            background: (viewTarget as any).paymentMethod === m ? "var(--primary-color)" : "var(--glass-surface)",
                            color: (viewTarget as any).paymentMethod === m ? "white" : "var(--text-secondary)",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.8rem",
                            transition: "all 0.2s",
                          }}
                          onClick={() => handleUpdatePaymentMethod(viewTarget.id, m)}
                          disabled={(viewTarget as any).paymentMethod === m}
                        >
                          {m === "EFECTIVO" ? "💵 Efectivo" :
                           m === "YAPE" ? (
                             <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                               <img src="/yape-logo.svg" alt="Yape" style={{ height: "12px", borderRadius: "2px" }} />
                               <span>Yape</span>
                             </span>
                           ) :
                           m === "PLIN" ? "💜 Plin" :
                           "🔀 Mixto"}
                        </button>
                      ))}
                    </div>
                  </>
                )}

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

      {successMsg && (
        <SuccessAnimation
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}
    </div>
  );
};
