import { useState } from "react";
import { X, Boxes, Loader2 } from "lucide-react";
import { useForm }          from "react-hook-form";
import { z }                from "zod";
import { zodResolver }      from "@hookform/resolvers/zod";
import { toast }            from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal }     from "@/shared/components/ui/confirm-modal";

import { suppliesService } from "../../services/supplies-service";
import type { Supply }     from "../../types/supply.types";

import "./supply-form.scss";

/* ── Validación con mensajes claros ── */
const schema = z.object({
  code: z
    .string()
    .min(1, "El código es obligatorio.")
    .max(20, "El código no puede superar los 20 caracteres.")
    .refine((v) => v.trim().length > 0, "El código no puede ser vacío.")
    .refine((v) => /^[A-Za-z0-9-]+$/.test(v.trim()), "El código solo debe contener letras, números y guiones."),
  
  name: z
    .string()
    .min(1, "El nombre es obligatorio.")
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .refine((v) => v.trim().length > 0, "El nombre no puede ser vacío."),

  description: z
    .string()
    .max(300, "La descripción no puede superar los 300 caracteres.")
    .optional(),

  stock: z.coerce.number().min(0, "El stock no puede ser negativo."),

  minStock: z.coerce.number().min(0, "El stock mínimo no puede ser negativo."),

  unit: z
    .string()
    .min(1, "La unidad de medida es obligatoria.")
    .max(15, "La unidad de medida no puede superar los 15 caracteres."),

  cost: z.coerce.number().min(0, "El costo no puede ser negativo."),

  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode:         "create" | "edit";
  initialData?: Supply;
  onClose:      () => void;
  onSuccess:    () => void;
}

export const SupplyForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
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
      code:        initialData?.code        ?? "",
      name:        initialData?.name        ?? "",
      description: initialData?.description ?? "",
      stock:       initialData?.stock       ?? 0,
      minStock:    initialData?.minStock    ?? 0,
      unit:        initialData?.unit        ?? "und",
      cost:        initialData?.cost        ?? 0,
      status:      initialData?.status      ?? "ACTIVE",
    },
  });

  const statusValue = watch("status");

  const handlePreSubmit = (data: FormData) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await suppliesService.createSupply(data);
      } else if (initialData) {
        await suppliesService.updateSupply(initialData.id, data);
      }

      toast.success(
        mode === "create"
          ? "Insumo creado correctamente"
          : "Insumo actualizado correctamente"
      );

      onSuccess();
      onClose();

    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const msg: string =
        axiosErr.response?.data?.message ||
        (error instanceof Error ? error.message : "Ocurrió un error inesperado.");

      if (msg.toLowerCase().includes("código") || msg.toLowerCase().includes("code")) {
        setError("code", { message: msg });
      } else if (msg.toLowerCase().includes("nombre")) {
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

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="supply-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="supply-form-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1.00, y: 0  }}
            exit={{ opacity: 0,   scale: 0.94, y: 16 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Cabecera */}
            <div className="supply-form-header">
              <div className="supply-form-header__icon">
                <Boxes size={20} />
              </div>

              <div>
                <h2>{mode === "create" ? "Nuevo insumo" : "Editar insumo"}</h2>
                <p>
                  {mode === "create"
                    ? "Registra un nuevo insumo o materia prima para el inventario."
                    : "Modifica los datos del insumo seleccionado."}
                </p>
              </div>

              <button className="supply-form-close" onClick={onClose} type="button">
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form className="supply-form" onSubmit={handleSubmit(handlePreSubmit)} noValidate>

              <div className="supply-form-scroll-area">
                <div className="form-row-two">
                  {/* Código */}
                  <div className="form-group">
                    <label htmlFor="sup-code">
                      Código <span className="form-required">*</span>
                    </label>
                    <input
                      id="sup-code"
                      type="text"
                      placeholder="Ej: INS-101"
                      disabled={mode === "edit"}
                      autoFocus={mode === "create"}
                      autoComplete="off"
                      {...register("code")}
                    />
                    {errors.code && (
                      <span className="form-error" role="alert">{errors.code.message}</span>
                    )}
                  </div>

                  {/* Unidad de medida */}
                  <div className="form-group">
                    <label htmlFor="sup-unit">
                      Unidad de Medida <span className="form-required">*</span>
                    </label>
                    <select id="sup-unit" {...register("unit")}>
                      <option value="und">Unidad (und)</option>
                      <option value="m²">Metro cuadrado (m²)</option>
                      <option value="m">Metro lineal (m)</option>
                      <option value="rollo">Rollo</option>
                      <option value="resma">Resma</option>
                      <option value="l">Litro (l)</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                    </select>
                    {errors.unit && (
                      <span className="form-error" role="alert">{errors.unit.message}</span>
                    )}
                  </div>
                </div>

                {/* Nombre */}
                <div className="form-group">
                  <label htmlFor="sup-name">
                    Nombre del Insumo <span className="form-required">*</span>
                  </label>
                  <input
                    id="sup-name"
                    type="text"
                    placeholder="Ej: Vinil Autoadhesivo Brillante"
                    autoComplete="off"
                    autoFocus={mode === "edit"}
                    {...register("name")}
                  />
                  {errors.name && (
                    <span className="form-error" role="alert">{errors.name.message}</span>
                  )}
                </div>

                {/* Descripción */}
                <div className="form-group">
                  <label htmlFor="sup-desc">Descripción</label>
                  <textarea
                    id="sup-desc"
                    placeholder="Especificaciones o notas sobre el insumo (opcional)..."
                    rows={2}
                    autoComplete="off"
                    {...register("description")}
                  />
                  {errors.description && (
                    <span className="form-error" role="alert">{errors.description.message}</span>
                  )}
                </div>

                {/* Costo Unitario */}
                <div className="form-group">
                  <label htmlFor="sup-cost">
                    Costo Unitario (S/.) <span className="form-required">*</span>
                  </label>
                  <input
                    id="sup-cost"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...register("cost")}
                  />
                  {errors.cost && (
                    <span className="form-error" role="alert">{errors.cost.message}</span>
                  )}
                </div>

                {/* Estado (solo visible en modo edición) */}
                {mode === "edit" && (
                  <div className="form-group">
                    <label htmlFor="sup-status">Estado</label>
                    <div className="status-toggle-wrapper">
                      <label className="toggle-switch">
                        <input
                          id="sup-status"
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
                    {errors.status && (
                      <span className="form-error" role="alert">{errors.status.message}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="supply-form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><Loader2 size={16} className="spin" /> Guardando...</>
                    : <><Boxes size={16} /> {mode === "create" ? "Crear insumo" : "Guardar cambios"}</>
                  }
                </button>
              </div>

            </form>

          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showConfirm && (
        <ConfirmModal
          title={mode === "create" ? "¿Crear insumo?" : "¿Guardar cambios?"}
          description={
            mode === "create"
              ? "¿Estás seguro de que deseas registrar este nuevo insumo en el inventario?"
              : "¿Estás seguro de que deseas guardar los cambios realizados en este insumo?"
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
