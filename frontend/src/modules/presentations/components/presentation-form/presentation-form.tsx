import { X, Boxes, Loader2, ImagePlus, Trash2, DollarSign, Info } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";

import { presentationsService } from "../../services/presentations-service";
import { productsService } from "@/modules/products/services/products-service";
import type { Presentation } from "../../types/presentations.types";
import type { Product } from "@/modules/products/types/product.types";

import "./presentation-form.scss";

const schema = z.object({
  productId: z.coerce.number().min(1, "El producto es obligatorio."),
  name: z
    .string()
    .min(1, "El nombre de la presentación es obligatorio.")
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .refine((v) => v.trim().length > 0, "El nombre no puede ser solo espacios."),
  description: z
    .string()
    .max(255, "La descripción no puede superar los 255 caracteres.")
    .optional(),
  size: z.string().max(80).optional(),
  material: z.string().optional(),
  finish: z.string().optional(),
  color: z.string().optional(),
  quantity: z.string().max(50).optional(),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  wholesalePrice: z.coerce.number().min(0, "El precio por mayor no puede ser negativo."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode:         "create" | "edit";
  initialData?: Presentation;
  onClose:      () => void;
  onSuccess:    () => void;
}

export const PresentationForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"basic" | "pricing">("basic");
  
  /* Estados para imagen */
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl ?? "");
  const [imagePreview, setImagePreview] = useState<string>(
    initialData?.imageUrl
      ? `${(import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000"}${initialData.imageUrl}`
      : ""
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productId:       initialData?.productId       ?? "",
      name:            initialData?.name            ?? "",
      description:     initialData?.description     ?? "",
      size:            initialData?.size            ?? "",
      material:        initialData?.material        ?? "",
      finish:          initialData?.finish          ?? "",
      color:           initialData?.color           ?? "",
      quantity:        initialData?.quantity        ?? "",
      cost:            initialData?.cost            ?? 0,
      price:           initialData?.price           ?? 0,
      wholesalePrice:  initialData?.wholesalePrice  ?? 0,
      status:          initialData?.status          ?? "ACTIVE",
    },
  });

  const selectedProductId = watch("productId");
  const descriptionValue = watch("description") ?? "";
  const statusValue = watch("status");
  const costValue = Number(watch("cost")) || 0;
  const priceValue = Number(watch("price")) || 0;
  const wholesalePriceValue = Number(watch("wholesalePrice")) || 0;

  /* Cargar productos disponibles */
  useEffect(() => {
    productsService.getProducts()
      .then((data) => setProducts(data.filter((p) => p.status === "ACTIVE")))
      .catch(() => toast.error("Error al cargar productos."));
  }, []);

  /* Buscar categoría del producto seleccionado */
  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const categoryName = selectedProduct?.categoryName ?? (initialData?.categoryName ?? "");

  /* Subida de imagen */
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

  const handlePreSubmit = (data: FormData) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        imageUrl: imageUrl || null,
      };

      if (mode === "create") {
        await presentationsService.createPresentation(payload);
      } else if (initialData) {
        await presentationsService.updatePresentation(initialData.id, payload);
      }

      toast.success(
        mode === "create"
          ? "Presentación creada correctamente."
          : "Presentación actualizada correctamente."
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const msg: string =
        axiosErr.response?.data?.message ||
        (error instanceof Error ? error.message : "Error inesperado.");

      if (msg.toLowerCase().includes("nombre")) {
        setError("name", { message: msg });
        setActiveTab("basic");
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

  /* Cálculo de utilidades */
  const utility = priceValue - costValue;
  const wholesaleUtility = wholesalePriceValue - costValue;

  return (
    <>
    <AnimatePresence>
      <motion.div
        className="presentation-form-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className="presentation-form-modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1.00, y: 0  }}
          exit={{ opacity: 0,   scale: 0.94, y: 16 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <div className="presentation-form-header">
            <div className="presentation-form-header__icon">
              <Boxes size={20} />
            </div>

            <div>
              <h2>{mode === "create" ? "Nueva Presentación" : "Editar Presentación"}</h2>
              <p>Completa la información de la presentación</p>
            </div>

            <button className="presentation-form-close" onClick={onClose} type="button">
              <X size={18} />
            </button>
          </div>

          {/* Navegación por pestañas (Tabs) */}
          <div className="presentation-form-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "basic" ? "tab-btn--active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              Información Básica
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "pricing" ? "tab-btn--active" : ""}`}
              onClick={() => setActiveTab("pricing")}
            >
              Precios y Costos
            </button>
          </div>

          {/* Formulario */}
          <form className="presentation-form" onSubmit={handleSubmit(handlePreSubmit)} noValidate>
            
            {activeTab === "basic" && (
              <div className="tab-pane-content tab-pane-content--horizontal">
                
                {/* Columna Izquierda: Información Principal */}
                <div className="form-col-left">
                  {/* Fila Producto + Categoría */}
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="pres-product">
                        Producto <span className="form-required">*</span>
                      </label>
                      <select id="pres-product" {...register("productId")}>
                        <option value="">Selecciona</option>
                        {products.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {errors.productId && (
                        <span className="form-error" role="alert">{errors.productId.message}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="pres-category">Categoría</label>
                      <input
                        id="pres-category"
                        type="text"
                        placeholder="Automático"
                        value={categoryName}
                        readOnly
                        className="input-readonly"
                      />
                    </div>
                  </div>

                  {/* Nombre de la presentación */}
                  <div className="form-group">
                    <label htmlFor="pres-name">
                      Nombre de la presentación <span className="form-required">*</span>
                    </label>
                    <input
                      id="pres-name"
                      type="text"
                      placeholder="Ej: 100 unidades - Couché 300gr"
                      autoComplete="off"
                      {...register("name")}
                    />
                    {errors.name && (
                      <span className="form-error" role="alert">{errors.name.message}</span>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="form-group">
                    <label htmlFor="pres-desc">Descripción</label>
                    <div className="textarea-wrapper">
                      <textarea
                        id="pres-desc"
                        placeholder="Características, materiales, acabados..."
                        rows={2}
                        maxLength={255}
                        autoComplete="off"
                        {...register("description")}
                      />
                      <span className="textarea-char-count">{descriptionValue.length}/255</span>
                    </div>
                  </div>

                  {/* Fila Imagen + Estado side-by-side para ahorrar espacio */}
                  <div className="form-row-2col form-row-2col--align-center">
                    {/* Imagen de referencia */}
                    <div className="form-group">
                      <label>Imagen</label>
                      {imagePreview ? (
                        <div className="image-preview-container image-preview-container--compact">
                          <img src={imagePreview} alt="Vista previa" className="image-preview" />
                          <div className="image-preview-actions">
                            <button
                              type="button"
                              className="img-btn img-btn--remove"
                              onClick={handleRemoveImage}
                              disabled={uploading}
                            >
                              <Trash2 size={12} /> Quitar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`image-upload-zone image-upload-zone--compact ${uploading ? "image-upload-zone--loading" : ""}`}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <><ImagePlus size={14} /> <span>Subir</span></>
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

                    {/* Estado */}
                    <div className="form-group">
                      <label htmlFor="pres-status">Estado</label>
                      <div className="status-toggle-wrapper">
                        <label className="toggle-switch">
                          <input
                            id="pres-status"
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
                </div>

                {/* Columna Derecha: Especificaciones */}
                <div className="form-col-right">
                  <div className="form-section-title">Especificaciones</div>

                  {/* Fila Tamaño + Material */}
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="pres-size">Medida / Tamaño</label>
                      <input
                        id="pres-size"
                        type="text"
                        placeholder="Ej: 9 x 5 cm"
                        autoComplete="off"
                        {...register("size")}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pres-material">Material</label>
                      <select id="pres-material" {...register("material")}>
                        <option value="">Selecciona</option>
                        <option value="Couché 300g">Couché 300g</option>
                        <option value="Couché 250g">Couché 250g</option>
                        <option value="Couché 150g">Couché 150g</option>
                        <option value="Bond 75g">Bond 75g</option>
                        <option value="Bond 80g">Bond 80g</option>
                        <option value="Opalina 220g">Opalina 220g</option>
                        <option value="Hilo 220g">Hilo 220g</option>
                        <option value="Adhesivo Brillante">Adhesivo Brillante</option>
                        <option value="Adhesivo Mate">Adhesivo Mate</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Kraft 80g">Kraft 80g</option>
                      </select>
                    </div>
                  </div>

                  {/* Fila Acabado + Color */}
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="pres-finish">Acabado</label>
                      <select id="pres-finish" {...register("finish")}>
                        <option value="">Selecciona</option>
                        <option value="Sin acabado">Sin acabado</option>
                        <option value="Plastificado Mate">Plastificado Mate</option>
                        <option value="Plastificado Brillante">Plastificado Brillante</option>
                        <option value="Barniz UV Total">Barniz UV Total</option>
                        <option value="Barniz UV Sectorizado">UV Sectorizado</option>
                        <option value="Troquelado">Troquelado</option>
                        <option value="Doblado / Plegado">Plegado</option>
                        <option value="Engrapado">Engrapado</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="pres-color">Color</label>
                      <select id="pres-color" {...register("color")}>
                        <option value="">Selecciona</option>
                        <option value="4x4 (Full Color ambos lados)">4x4 (Ambos lados)</option>
                        <option value="4x0 (Full Color un lado)">4x0 (Un lado)</option>
                        <option value="1x1 (Un color ambos lados)">1x1 (Ambos lados)</option>
                        <option value="1x0 (Un color un lado)">1x0 (Un lado)</option>
                        <option value="1x0 (Escala de grises)">Escala grises</option>
                        <option value="Pantone Especial">Pantone / Especial</option>
                      </select>
                    </div>
                  </div>

                  {/* Cantidad / Unidad */}
                  <div className="form-group">
                    <label htmlFor="pres-quantity">Cantidad / Unidad</label>
                    <input
                      id="pres-quantity"
                      type="text"
                      placeholder="Ej: 100 unidades o 1 millar"
                      autoComplete="off"
                      {...register("quantity")}
                    />
                  </div>
                </div>

              </div>
            )}

            {activeTab === "pricing" && (
              <div className="tab-pane-content">
                <div className="pricing-grid">
                  {/* Costo */}
                  <div className="form-group">
                    <label htmlFor="pres-cost">
                      Costo de producción <span className="form-required">*</span>
                    </label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">S/</span>
                      <input
                        id="pres-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej: 15.00"
                        {...register("cost")}
                      />
                    </div>
                    {errors.cost && (
                      <span className="form-error" role="alert">{errors.cost.message}</span>
                    )}
                  </div>

                  {/* Precio Público */}
                  <div className="form-group">
                    <label htmlFor="pres-price">
                      Precio de venta <span className="form-required">*</span>
                    </label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">S/</span>
                      <input
                        id="pres-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej: 25.00"
                        {...register("price")}
                      />
                    </div>
                    {errors.price && (
                      <span className="form-error" role="alert">{errors.price.message}</span>
                    )}
                  </div>

                  {/* Precio Distribuidor / por Mayor */}
                  <div className="form-group">
                    <label htmlFor="pres-wholesale">Precio por mayor</label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">S/</span>
                      <input
                        id="pres-wholesale"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej: 20.00"
                        {...register("wholesalePrice")}
                      />
                    </div>
                    {errors.wholesalePrice && (
                      <span className="form-error" role="alert">{errors.wholesalePrice.message}</span>
                    )}
                  </div>
                </div>

                {/* Resumen de Utilidad */}
                <div className="utility-summary-card">
                  <h4><DollarSign size={16} /> Resumen de utilidad</h4>
                  <div className="utility-items">
                    <div className="utility-item">
                      <span>Utilidad Venta Estándar:</span>
                      <strong className={utility >= 0 ? "utility-positive" : "utility-negative"}>
                        S/ {utility.toFixed(2)}
                      </strong>
                    </div>

                    <div className="utility-item">
                      <span>Utilidad Venta Mayor:</span>
                      <strong className={wholesaleUtility >= 0 ? "utility-positive" : "utility-negative"}>
                        S/ {wholesaleUtility.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  <div className="utility-hint">
                    <Info size={12} />
                    <span>Calculado automáticamente en base al Costo de producción ingresado.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="presentation-form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>

              <button type="submit" className="btn-save" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 size={16} className="spin" /> Guardando...</>
                ) : (
                  <><Boxes size={16} /> Guardar Presentación</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>

    {showConfirm && (
      <ConfirmModal
        title={mode === "create" ? "¿Crear presentación?" : "¿Guardar cambios?"}
        description={
          mode === "create"
            ? "¿Estás seguro de que deseas registrar esta nueva presentación?"
            : "¿Estás seguro de que deseas guardar los cambios realizados en esta presentación?"
        }
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirm(false)}
        confirmLabel={mode === "create" ? "Crear" : "Guardar"}
        icon={mode === "create" ? "create" : "update"}
      />
    )}
  </>
  );
};
