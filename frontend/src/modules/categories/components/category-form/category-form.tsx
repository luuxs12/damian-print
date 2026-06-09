import { useState } from "react";
import { X, Tag, Loader2 } from "lucide-react";
import { useForm }          from "react-hook-form";
import { z }                from "zod";
import { zodResolver }      from "@hookform/resolvers/zod";
import { toast }            from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal }     from "@/shared/components/ui/confirm-modal";

import { categoriesService } from "../../services/categories-service";
import type { Category }     from "../../types/category.types";

import "./category-form.scss";

const schema = z.object({
  name: z
    .string()
    .min(1,  "El nombre es obligatorio.")
    .min(2,  "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .refine((v) => v.trim().length > 0, "El nombre no puede ser solo espacios."),

  description: z
    .string()
    .max(300, "La descripción no puede superar los 300 caracteres.")
    .optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode:         "create" | "edit";
  initialData?: Category;
  onClose:      () => void;
  onSuccess:    () => void;
}

export const CategoryForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        initialData?.name        ?? "",
      description: initialData?.description ?? "",
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
        await categoriesService.createCategory(data);
      } else if (initialData) {
        await categoriesService.updateCategory(initialData.id, data);
      }
      toast.success(
        mode === "create" ? "Categoría creada correctamente" : "Categoría actualizada correctamente"
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

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="category-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="category-form-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1.00, y: 0  }}
            exit={{ opacity: 0,   scale: 0.94, y: 16 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="category-form-header">
              <div className="category-form-header__icon">
                <Tag size={20} />
              </div>
              <div>
                <h2>{mode === "create" ? "Nueva categoría" : "Editar categoría"}</h2>
                <p>
                  {mode === "create"
                    ? "Ingresa los datos para registrar la categoría."
                    : "Modifica los datos de la categoría."}
                </p>
              </div>
              <button className="category-form-close" onClick={onClose} type="button">
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form className="category-form" onSubmit={handleSubmit(handlePreSubmit)} noValidate>
              <div className="category-form-scroll-area">

                {/* Sección 1: Datos de la Categoría */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">1</span>
                    <h3>Datos de la Categoría</h3>
                  </div>

                  {/* Nombre */}
                  <div className="form-group">
                    <label htmlFor="cat-name">
                      Nombre <span className="form-required">*</span>
                    </label>
                    <input
                      id="cat-name"
                      type="text"
                      placeholder="Ej: Sellos de Goma"
                      autoFocus
                      autoComplete="off"
                      {...register("name")}
                    />
                    {errors.name && (
                      <span className="form-error" role="alert">{errors.name.message}</span>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="form-group">
                    <label htmlFor="cat-desc">
                      Descripción
                    </label>
                    <textarea
                      id="cat-desc"
                      placeholder="Descripción opcional (máx. 300 caracteres)..."
                      rows={3}
                      autoComplete="off"
                      {...register("description")}
                    />
                    {errors.description && (
                      <span className="form-error" role="alert">{errors.description.message}</span>
                    )}
                  </div>

                  {/* Estado (solo visible en modo edición) */}
                  {mode === "edit" && (
                    <div className="form-group">
                      <label htmlFor="cat-status">Estado</label>
                      <div className="status-toggle-wrapper">
                        <label className="toggle-switch">
                          <input
                            id="cat-status"
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

              </div>

              {/* Acciones */}
              <div className="category-form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><Loader2 size={16} className="spin" /> Guardando...</>
                    : <><Tag size={16} /> {mode === "create" ? "Crear categoría" : "Guardar cambios"}</>
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showConfirm && (
        <ConfirmModal
          title={mode === "create" ? "¿Crear categoría?" : "¿Guardar cambios?"}
          description={
            mode === "create"
              ? "¿Estás seguro de que deseas registrar esta nueva categoría?"
              : "¿Estás seguro de que deseas guardar los cambios realizados en esta categoría?"
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
