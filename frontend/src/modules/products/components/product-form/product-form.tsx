import { X, ShoppingBag, Loader2, ImagePlus, Trash2, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";

import { productsService } from "../../services/products-service";
import { categoriesService } from "../../../categories/services/categories-service";
import { clientsService } from "../../../clients/services/clients-service";
import { suppliesService } from "../../../supplies/services/supplies-service";
import type { Product, PriceScale, SpecialPrice, ProductMaterial } from "../../types/product.types";
import type { Category } from "../../../categories/types/category.types";
import type { Client } from "../../../clients/types/client.types";
import type { Supply } from "../../../supplies/types/supply.types";

import "./product-form.scss";

/* ── Validación ── */
const schema = z.object({
  name: z
    .string()
    .min(1, "El nombre del producto es obligatorio.")
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .refine((v) => v.trim().length > 0, "El nombre no puede ser solo espacios."),

  categoryId: z
    .string()
    .min(1, "Selecciona una categoría."),

  description: z
    .string()
    .max(500, "La descripción no puede superar los 500 caracteres.")
    .optional(),

  unit: z
    .string()
    .min(1, "La unidad de medida es obligatoria."),

  status: z.enum(["ACTIVE", "INACTIVE"]),

  // Characteristics
  manageInventory: z.boolean(),
  sendToProduction: z.boolean(),
  branchName: z.string().optional().nullable(),

  // Advanced Pricing
  pricePublic: z
    .string()
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "El precio público debe ser un número válido mayor o igual a 0."
    ),

  priceReseller: z
    .string()
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "El precio para revendedores debe ser un número válido mayor o igual a 0."
    ),

  // Costs
  laborCost: z
    .string()
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "El costo de mano de obra debe ser un número válido mayor o igual a 0."
    ),

  overheadCost: z
    .string()
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "El costo indirecto debe ser un número válido mayor o igual a 0."
    ),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  initialData?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl ?? "");
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl
    ? `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}${initialData.imageUrl}`
    : "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic type selection: "Producto" (manageInventory = true) vs "Servicio" (manageInventory = false)
  const [productType, setProductType] = useState<"PRODUCTO" | "SERVICIO">(
    initialData?.manageInventory ? "PRODUCTO" : "SERVICIO"
  );

  // Dynamic builder states
  const [priceScales, setPriceScales] = useState<PriceScale[]>(initialData?.priceScales ?? []);
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>(initialData?.specialPrices ?? []);
  const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>(initialData?.materials ?? []);

  // Builder row temporary inputs
  const [scaleMinQty, setScaleMinQty] = useState("");
  const [scalePrice, setScalePrice] = useState("");
  const [specialClientId, setSpecialClientId] = useState("");
  const [specialPriceVal, setSpecialPriceVal] = useState("");
  const [selectedSupplyId, setSelectedSupplyId] = useState("");
  const [materialQty, setMaterialQty] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      categoryId: initialData?.categoryId ? String(initialData.categoryId) : "",
      description: initialData?.description ?? "",
      unit: initialData?.unit ?? "Unidad",
      status: initialData?.status ?? "ACTIVE",
      manageInventory: initialData?.manageInventory ?? false,
      sendToProduction: initialData?.sendToProduction ?? false,
      branchName: initialData?.branchName ?? "Taller Principal",
      pricePublic: initialData?.pricePublic != null ? String(initialData.pricePublic) : "0",
      priceReseller: initialData?.priceReseller != null ? String(initialData.priceReseller) : "0",
      laborCost: initialData?.laborCost != null ? String(initialData.laborCost) : "0",
      overheadCost: initialData?.overheadCost != null ? String(initialData.overheadCost) : "0",
    },
  });

  /* Sync productType selection with manageInventory field value */
  useEffect(() => {
    setValue("manageInventory", productType === "PRODUCTO");
  }, [productType, setValue]);

  /* Load active categories, clients, and supplies */
  useEffect(() => {
    categoriesService.getCategories()
      .then((data) => setCategories(data.filter((c) => c.status === "ACTIVE")))
      .catch(() => toast.error("Error al cargar las categorías."));

    clientsService.getClients()
      .then((data) => setClients(data.filter((c) => c.status === "ACTIVE")))
      .catch(() => toast.error("Error al cargar la lista de clientes."));

    suppliesService.getSupplies()
      .then((data) => setSupplies(data.filter((s) => s.status === "ACTIVE")))
      .catch(() => toast.error("Error al cargar los insumos."));
  }, []);

  const descriptionValue = useWatch({ control, name: "description" }) ?? "";
  const statusValue = useWatch({ control, name: "status" });

  // Watch fields for real-time cost analysis
  const watchedPricePublic = useWatch({ control, name: "pricePublic" }) || "0";
  const watchedLaborCost = useWatch({ control, name: "laborCost" }) || "0";
  const watchedOverheadCost = useWatch({ control, name: "overheadCost" }) || "0";

  const totalMaterialsCost = productMaterials.reduce((acc, m) => acc + (Number(m.qty ?? 0) * Number(m.cost ?? 0)), 0);
  const laborCostVal = Number(watchedLaborCost) || 0;
  const overheadCostVal = Number(watchedOverheadCost) || 0;
  const estimatedCost = totalMaterialsCost + laborCostVal + overheadCostVal;
  const basePrice = Number(watchedPricePublic) || 0;
  const estimatedProfit = Math.max(0, basePrice - estimatedCost);
  const profitMargin = basePrice > 0 ? (estimatedProfit / basePrice) * 100 : 0;

  /* Image Upload Handlers */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);

    try {
      const url = await productsService.uploadImage(file);
      setImageUrl(url);
      toast.success("Imagen cargada correctamente.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Error al subir la imagen.");
      URL.revokeObjectURL(localPreview);
      setImagePreview("");
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* Materials Builder Handlers */
  const handleAddMaterial = () => {
    const sid = parseInt(selectedSupplyId, 10);
    const qty = parseFloat(materialQty);

    if (isNaN(sid)) {
      toast.error("Selecciona un insumo válido.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toast.error("La cantidad debe ser mayor que 0.");
      return;
    }
    if (productMaterials.some((m) => m.supplyId === sid)) {
      toast.error("Este insumo ya ha sido agregado.");
      return;
    }

    const supplyObj = supplies.find((s) => s.id === sid);
    if (!supplyObj) return;

    setProductMaterials([
      ...productMaterials,
      {
        supplyId: sid,
        name: supplyObj.name,
        unit: supplyObj.unit,
        qty: qty,
        cost: Number(supplyObj.cost)
      }
    ]);
    setSelectedSupplyId("");
    setMaterialQty("");
    toast.success("Insumo agregado.");
  };

  const handleRemoveMaterial = (sid: number) => {
    setProductMaterials(productMaterials.filter((m) => m.supplyId !== sid));
    toast.success("Insumo removido.");
  };

  /* Wholesale Tiers Builder Handlers */
  const handleAddScale = () => {
    const qty = parseInt(scaleMinQty, 10);
    const prc = parseFloat(scalePrice);

    if (isNaN(qty) || qty <= 0) {
      toast.error("La cantidad mínima debe ser un número entero mayor que 0.");
      return;
    }
    if (isNaN(prc) || prc < 0) {
      toast.error("El precio unitario debe ser un número mayor o igual a 0.");
      return;
    }
    if (priceScales.some((s) => s.minQty === qty)) {
      toast.error("Ya existe una escala para esa cantidad mínima.");
      return;
    }

    setPriceScales([...priceScales, { minQty: qty, price: prc }].sort((a, b) => a.minQty - b.minQty));
    setScaleMinQty("");
    setScalePrice("");
    toast.success("Escala de mayoreo agregada.");
  };

  const handleRemoveScale = (qty: number) => {
    setPriceScales(priceScales.filter((s) => s.minQty !== qty));
    toast.success("Escala eliminada.");
  };

  /* Special Prices Builder Handlers */
  const handleAddSpecialPrice = () => {
    const cid = parseInt(specialClientId, 10);
    const prc = parseFloat(specialPriceVal);

    if (isNaN(cid)) {
      toast.error("Selecciona un cliente válido.");
      return;
    }
    if (isNaN(prc) || prc < 0) {
      toast.error("El precio especial debe ser un número mayor o igual a 0.");
      return;
    }
    if (specialPrices.some((s) => s.clientId === cid)) {
      toast.error("Este cliente ya tiene un precio especial asignado.");
      return;
    }

    const clientObj = clients.find((c) => c.id === cid);
    if (!clientObj) return;

    setSpecialPrices([
      ...specialPrices,
      { clientId: cid, clientName: clientObj.name, price: prc }
    ]);
    setSpecialClientId("");
    setSpecialPriceVal("");
    toast.success("Precio especial asignado.");
  };

  const handleRemoveSpecialPrice = (cid: number) => {
    setSpecialPrices(specialPrices.filter((s) => s.clientId !== cid));
    toast.success("Precio especial eliminado.");
  };

  /* Form Pre-submit and Submit */
  const handlePreSubmit = (data: FormData) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const parsedPublic = Number(data.pricePublic);
      const parsedReseller = Number(data.priceReseller);
      const parsedLabor = Number(data.laborCost);
      const parsedOverhead = Number(data.overheadCost);

      const payload = {
        name: data.name,
        categoryId: Number(data.categoryId),
        description: data.description ?? "",
        unit: data.unit,
        status: data.status,
        imageUrl: imageUrl || null,
        manageInventory: data.manageInventory,
        countAsPrint: false, // Explicitly false as user does not want print/machine tracking
        sendToProduction: data.sendToProduction,
        branchName: data.sendToProduction ? data.branchName : null,
        pricePublic: parsedPublic,
        priceReseller: parsedReseller,
        priceScales: priceScales,
        specialPrices: specialPrices,
        presentations: [{ presentation: "General", price: parsedPublic }],
        laborCost: parsedLabor,
        overheadCost: parsedOverhead,
        materials: productMaterials
      };

      if (mode === "create") {
        await productsService.createProduct(payload);
      } else if (initialData) {
        await productsService.updateProduct(initialData.id, payload);
      }

      toast.success(
        mode === "create"
          ? "Producto/Servicio creado correctamente."
          : "Producto/Servicio actualizado correctamente."
      );

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const msg: string =
        axiosErr.response?.data?.message ||
        (error instanceof Error ? error.message : "Ocurrió un error inesperado.");

      if (msg.toLowerCase().includes("nombre")) {
        setError("name", { message: msg });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pendingData) return;
    setShowConfirm(false);
    await onSubmit(pendingData);
  };

  return createPortal(
    <>
      <AnimatePresence>
        <motion.div
          className="product-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="product-form-modal product-form-modal--wide"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1.00, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="product-form-header">
              <div className="product-form-header__icon">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2>{mode === "create" ? "Nuevo Producto / Servicio" : "Editar Producto / Servicio"}</h2>
                <p>Registra un nuevo producto o servicio que ofrece tu imprenta gráfica.</p>
              </div>
              <button className="product-form-close" onClick={onClose} type="button">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form className="product-form" onSubmit={handleSubmit(handlePreSubmit)} noValidate>
              <div className="product-form-scroll-area">
              
              {/* ── SECCIÓN 1: INFORMACIÓN GENERAL ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num">1</span>
                  <h3>Información General</h3>
                </div>

                <div className="form-grid-two-columns">
                  
                  {/* Columna Izquierda */}
                  <div className="form-column">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="prod-type">Tipo <span className="form-required">*</span></label>
                        <select
                          id="prod-type"
                          value={productType}
                          onChange={(e) => setProductType(e.target.value as "PRODUCTO" | "SERVICIO")}
                        >
                          <option value="SERVICIO">Servicio</option>
                          <option value="PRODUCTO">Producto (Control de Inventario)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-code">Código</label>
                        <input
                          id="prod-code"
                          type="text"
                          value={mode === "edit" ? (initialData?.code ?? "") : ""}
                          placeholder="Autogenerado al guardar"
                          readOnly
                          className="input-readonly"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="prod-name">Nombre <span className="form-required">*</span></label>
                        <input
                          id="prod-name"
                          type="text"
                          placeholder="Ej: Tarjetas de Presentación"
                          autoComplete="off"
                          {...register("name")}
                        />
                        {errors.name && (
                          <span className="form-error" role="alert">{errors.name.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-category">Categoría <span className="form-required">*</span></label>
                        <select id="prod-category" {...register("categoryId")}>
                          <option value="">Selecciona categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                          ))}
                        </select>
                        {errors.categoryId && (
                          <span className="form-error" role="alert">{errors.categoryId.message}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-desc">Descripción</label>
                      <textarea
                        id="prod-desc"
                        placeholder="Descripción de acabados, tiempos de entrega o notas generales..."
                        rows={3}
                        autoComplete="off"
                        {...register("description")}
                      />
                      <span className="form-char-count">{descriptionValue.length}/500</span>
                      {errors.description && (
                        <span className="form-error" role="alert">{errors.description.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Imagen del producto/servicio</label>
                      {imagePreview ? (
                        <div className="image-preview-container">
                          <img src={imagePreview} alt="Preview" className="image-preview" />
                          <div className="image-preview-actions">
                            <span className="image-preview-name">Imagen seleccionada</span>
                            <button
                              type="button"
                              className="img-btn img-btn--change"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                            >
                              <ImagePlus size={14} />
                              Cambiar
                            </button>
                            <button
                              type="button"
                              className="img-btn img-btn--remove"
                              onClick={handleRemoveImage}
                              disabled={uploading}
                            >
                              <Trash2 size={14} /> Quitar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`image-upload-zone ${uploading ? "image-upload-zone--loading" : ""}`}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <><Loader2 size={22} className="spin" /><span>Subiendo...</span></>
                          ) : (
                            <>
                              <ImagePlus size={20} />
                              <span>Subir Imagen</span>
                              <small>PNG, JPG (Máx. 2MB)</small>
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                        className="input-file-hidden"
                      />
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="form-column">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="prod-unit">Unidad de medida <span className="form-required">*</span></label>
                        <select id="prod-unit" {...register("unit")}>
                          <option value="Unidad">Unidad</option>
                          <option value="Millar">Millar</option>
                          <option value="Ciento">Ciento</option>
                          <option value="Metro lineal">Metro lineal</option>
                          <option value="Metro Cuadrado">Metro Cuadrado (m²)</option>
                          <option value="Servicio">Servicio</option>
                        </select>
                        {errors.unit && (
                          <span className="form-error" role="alert">{errors.unit.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-status">Estado</label>
                        <div className="status-toggle-wrapper" style={{ marginTop: "8px" }}>
                          <label className="toggle-switch">
                            <input
                              id="prod-status"
                              type="checkbox"
                              checked={statusValue === "ACTIVE"}
                              onChange={(e) =>
                                setValue("status", e.target.checked ? "ACTIVE" : "INACTIVE")
                              }
                            />
                            <span className="toggle-slider" />
                          </label>
                          <span className={`status-label ${statusValue === "ACTIVE" ? "status-label--active" : "status-label--inactive"}`}>
                            {statusValue === "ACTIVE" ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="prod-price-pub">Precio base público <span className="form-required">*</span></label>
                        <input
                          id="prod-price-pub"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...register("pricePublic")}
                        />
                        {errors.pricePublic && (
                          <span className="form-error" role="alert">{errors.pricePublic.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-price-res">Precio Revendedor <span className="form-required">*</span></label>
                        <input
                          id="prod-price-res"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...register("priceReseller")}
                        />
                        {errors.priceReseller && (
                          <span className="form-error" role="alert">{errors.priceReseller.message}</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── SECCIÓN 2: MATERIALES / INSUMOS UTILIZADOS ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num">2</span>
                  <h3>Materiales / Insumos utilizados</h3>
                </div>
                <p className="section-subtitle">Agrega los insumos que se consumen para realizar este producto/servicio.</p>

                <div className="builder-inputs-row" style={{ marginTop: "14px" }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label style={{ fontSize: "0.76rem" }}>Insumo</label>
                    <select
                      value={selectedSupplyId}
                      onChange={(e) => setSelectedSupplyId(e.target.value)}
                    >
                      <option value="">Selecciona insumo</option>
                      {supplies.map((sup) => (
                        <option key={sup.id} value={String(sup.id)}>
                          {sup.name} ({sup.unit}) - Costo: S/ {Number(sup.cost).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.76rem" }}>Cantidad</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 0.10"
                      value={materialQty}
                      onChange={(e) => setMaterialQty(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-add-item"
                    onClick={handleAddMaterial}
                    style={{ height: "38px" }}
                  >
                    <Plus size={16} /> Agregar Insumo
                  </button>
                </div>

                {productMaterials.length > 0 ? (
                  <div className="builder-table-wrapper" style={{ marginTop: "16px" }}>
                    <table className="builder-table">
                      <thead>
                        <tr>
                          <th>Insumo</th>
                          <th>Unidad</th>
                          <th className="align-right">Cantidad</th>
                          <th className="align-right">Costo Unit.</th>
                          <th className="align-right">Costo Total</th>
                          <th style={{ width: "60px", textAlign: "center" }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productMaterials.map((m, idx) => (
                          <tr key={idx}>
                            <td>{m.name}</td>
                            <td>{m.unit}</td>
                            <td className="align-right">{Number(m.qty).toFixed(2)}</td>
                            <td className="align-right">S/ {Number(m.cost).toFixed(2)}</td>
                            <td className="align-right" style={{ fontWeight: 700 }}>
                              S/ {(Number(m.qty) * Number(m.cost)).toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn-delete-row"
                                onClick={() => handleRemoveMaterial(m.supplyId)}
                                style={{ margin: "0 auto" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-builder-msg" style={{ padding: "20px", textAlign: "center", fontStyle: "italic", border: "1px dashed var(--glass-border)", borderRadius: "14px", marginTop: "14px" }}>
                    No hay materiales vinculados a este producto/servicio.
                  </div>
                )}

                <div className="materials-total-cost-strip">
                  Costo total de materiales: <strong>S/ {totalMaterialsCost.toFixed(2)}</strong>
                </div>
              </div>

              {/* ── SECCIÓN 3: PRECIOS Y ESCALAS ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num">3</span>
                  <h3>Escalas y Precios Especiales</h3>
                </div>
                <p className="section-subtitle">Opciones avanzadas de precios por volumen de mayoreo y asignación de precios por cliente.</p>

                <div className="form-grid-two-columns" style={{ marginTop: "14px" }}>
                  
                  {/* Columna Izquierda: Escalas de precios */}
                  <div className="form-column">
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Escalas por Volumen (Mayoreo)</label>
                    <div className="builder-inputs-row" style={{ padding: "8px", marginTop: "6px" }}>
                      <div className="form-group">
                        <label style={{ fontSize: "0.74rem" }}>Cant. Mínima</label>
                        <input
                          type="number"
                          placeholder="Ej: 50"
                          value={scaleMinQty}
                          onChange={(e) => setScaleMinQty(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: "0.74rem" }}>Precio Unit. (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 45.00"
                          value={scalePrice}
                          onChange={(e) => setScalePrice(e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn-add-item" onClick={handleAddScale} style={{ height: "34px" }}>
                        +
                      </button>
                    </div>

                    {priceScales.length > 0 ? (
                      <div className="builder-table-wrapper" style={{ marginTop: "10px" }}>
                        <table className="builder-table">
                          <thead>
                            <tr>
                              <th>Cantidad</th>
                              <th>Precio Unit.</th>
                              <th style={{ width: "40px" }} />
                            </tr>
                          </thead>
                          <tbody>
                            {priceScales.map((scale, idx) => (
                              <tr key={idx}>
                                <td>{scale.minQty} o más</td>
                                <td>S/ {Number(scale.price).toFixed(2)}</td>
                                <td>
                                  <button type="button" className="btn-delete-row" onClick={() => handleRemoveScale(scale.minQty)}>
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <small style={{ fontStyle: "italic", display: "block", marginTop: "8px", color: "var(--text-secondary)" }}>Sin escalas de volumen.</small>
                    )}
                  </div>

                  {/* Columna Derecha: Precios especiales */}
                  <div className="form-column">
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Precios por Cliente (Fijos)</label>
                    <div className="builder-inputs-row" style={{ padding: "8px", marginTop: "6px" }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label style={{ fontSize: "0.74rem" }}>Cliente</label>
                        <select value={specialClientId} onChange={(e) => setSpecialClientId(e.target.value)}>
                          <option value="">Selecciona</option>
                          {clients.map((cli) => (
                            <option key={cli.id} value={String(cli.id)}>{cli.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: "0.74rem" }}>Precio (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={specialPriceVal}
                          onChange={(e) => setSpecialPriceVal(e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn-add-item" onClick={handleAddSpecialPrice} style={{ height: "34px" }}>
                        +
                      </button>
                    </div>

                    {specialPrices.length > 0 ? (
                      <div className="builder-table-wrapper" style={{ marginTop: "10px" }}>
                        <table className="builder-table">
                          <thead>
                            <tr>
                              <th>Cliente</th>
                              <th>Precio Especial</th>
                              <th style={{ width: "40px" }} />
                            </tr>
                          </thead>
                          <tbody>
                            {specialPrices.map((sp, idx) => (
                              <tr key={idx}>
                                <td>{sp.clientName}</td>
                                <td>S/ {Number(sp.price).toFixed(2)}</td>
                                <td>
                                  <button type="button" className="btn-delete-row" onClick={() => handleRemoveSpecialPrice(sp.clientId)}>
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <small style={{ fontStyle: "italic", display: "block", marginTop: "8px", color: "var(--text-secondary)" }}>Sin precios especiales asignados.</small>
                    )}
                  </div>

                </div>
              </div>

              {/* ── SECCIÓN 4: INFORMACIÓN ADICIONAL Y RESUMEN ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num">4</span>
                  <h3>Información adicional</h3>
                </div>

                <div className="form-grid-two-columns" style={{ marginTop: "14px" }}>
                  
                  {/* Left: Costs Inputs, Observations, and Production Flow */}
                  <div className="form-column">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="prod-labor-cost">Mano de obra estimada (S/)</label>
                        <input
                          id="prod-labor-cost"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("laborCost")}
                        />
                        {errors.laborCost && (
                          <span className="form-error" role="alert">{errors.laborCost.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-overhead-cost">Gastos generales / Indirectos (S/)</label>
                        <input
                          id="prod-overhead-cost"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register("overheadCost")}
                        />
                        {errors.overheadCost && (
                          <span className="form-error" role="alert">{errors.overheadCost.message}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Orden de Producción</label>
                      <div className="status-toggle-wrapper" style={{ marginTop: "4px" }}>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            {...register("sendToProduction")}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span className="form-hint-inline" style={{ fontWeight: 600 }}>Habilitar Orden de Trabajo en Taller</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Real-time Analysis Card */}
                  <div className="form-column">
                    <div className="cost-summary-card" style={{ marginTop: 0 }}>
                      <h5 style={{ fontSize: "0.9rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "6px" }}>Resumen de Costos</h5>
                      <div className="summary-rows" style={{ marginTop: "8px" }}>
                        <div className="summary-row">
                          <span>Costo de materiales</span>
                          <span>S/ {totalMaterialsCost.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Mano de obra estimada</span>
                          <span>S/ {laborCostVal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Gastos generales</span>
                          <span>S/ {overheadCostVal.toFixed(2)}</span>
                        </div>
                        <div className="divider-line" />
                        <div className="summary-row highlight">
                          <span>Costo total estimado</span>
                          <span>S/ {estimatedCost.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Precio base (Público)</span>
                          <span>S/ {basePrice.toFixed(2)}</span>
                        </div>
                        <div className="divider-line" />
                        <div className="summary-row highlight-green">
                          <span>Utilidad estimada</span>
                          <strong>S/ {estimatedProfit.toFixed(2)}</strong>
                        </div>
                        <div className="summary-row highlight-green">
                          <span>Margen estimado</span>
                          <strong>{profitMargin.toFixed(1)}%</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              </div>

              {/* Form Action Buttons */}
              <div className="product-form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={isSubmitting || uploading}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-save"
                  disabled={isSubmitting || uploading}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="spin" /> Guardando...</>
                  ) : (
                    <><ShoppingBag size={16} /> Guardar Producto/Servicio</>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showConfirm && (
        <ConfirmModal
          title={mode === "create" ? "¿Crear Producto / Servicio?" : "¿Guardar cambios?"}
          description={
            mode === "create"
              ? "¿Estás seguro de que deseas registrar este nuevo producto o servicio con sus materiales y costos?"
              : "¿Estás seguro de que deseas guardar las modificaciones realizadas en este producto o servicio?"
          }
          onConfirm={handleConfirmSubmit}
          onClose={() => setShowConfirm(false)}
          confirmLabel={mode === "create" ? "Crear" : "Guardar"}
          icon={mode === "create" ? "create" : "update"}
        />
      )}
    </>,
    document.getElementById("dashboard-content-root") || document.body
  );
};
