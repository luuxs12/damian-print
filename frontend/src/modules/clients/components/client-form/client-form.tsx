import { X, UserRound, Loader2 } from "lucide-react";
import { useForm, useWatch }        from "react-hook-form";
import { z }                        from "zod";
import { zodResolver }              from "@hookform/resolvers/zod";
import { toast }                    from "sonner";
import { motion, AnimatePresence }  from "framer-motion";
import { useState }                 from "react";
import { ConfirmModal }             from "@/shared/components/ui/confirm-modal";

import { clientsService, type CreateClientPayload }  from "../../services/clients-service";
import type { Client }     from "../../types/client.types";

import "./client-form.scss";

const schema = z.object({
  type: z.enum(["EMPRESA", "PARTICULAR"] as const, { message: "Selecciona un tipo." }),

  name: z
    .string()
    .min(1, "El nombre es obligatorio.")
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(150, "El nombre no puede superar los 150 caracteres.")
    .refine((v) => v.trim().length > 0, "El nombre no puede ser solo espacios."),

  documentType: z.enum(["DNI", "RUC"] as const, { message: "Selecciona un tipo de documento." }),

  document: z
    .string()
    .min(1, "El número de documento es obligatorio.")
    .max(20, "El documento es demasiado largo."),

  phone:       z.string().max(20, "El teléfono es demasiado largo.").optional(),
  email:       z.string().email("Ingresa un email válido.").optional().or(z.literal("")),
  address:     z.string().max(200, "La dirección es demasiado larga.").optional(),
  city:        z.string().max(80, "La ciudad es demasiado larga.").optional(),
  contactName: z.string().max(100, "El nombre del contacto es demasiado largo.").optional(),
  notes:       z.string().max(500, "Las notas no pueden superar 500 caracteres.").optional(),
  status:      z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode:         "create" | "edit";
  initialData?: Client;
  onClose:      () => void;
  onSuccess:    () => void;
}

export const ClientForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type:         initialData?.type         ?? "PARTICULAR",
      name:         initialData?.name         ?? "",
      documentType: (initialData?.documentType === "RUC" ? "RUC" : "DNI") as "DNI" | "RUC",
      document:     initialData?.document     ?? "",
      phone:        initialData?.phone        ?? "",
      email:        initialData?.email        ?? "",
      address:      initialData?.address      ?? "",
      city:         initialData?.city         ?? "",
      contactName:  initialData?.contactName  ?? "",
      notes:        initialData?.notes        ?? "",
      status:       initialData?.status       ?? "ACTIVE",
    },
  });

  const selectedType    = useWatch({ control, name: "type" });
  const selectedDocType = watch("documentType");
  const statusValue     = watch("status");
  const notesValue      = watch("notes") ?? "";

  const handlePreSubmit = (data: FormData) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload: CreateClientPayload = {
        type:         data.type,
        name:         data.name,
        documentType: data.documentType,
        document:     data.document,
        phone:        data.phone || undefined,
        email:        data.email || undefined,
        address:      data.address || undefined,
        city:         data.city || undefined,
        contactName:  data.contactName || undefined,
        notes:        data.notes || undefined,
        status:       data.status,
      };
      if (mode === "create") {
        await clientsService.createClient(payload);
      } else if (initialData) {
        await clientsService.updateClient(initialData.id, payload);
      }
      onSuccess();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        (error instanceof Error ? error.message : "Ocurrió un error inesperado.");
      toast.error(msg);
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
          className="client-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="client-form-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1.00, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="client-form-header">
              <div className="client-form-header__icon"><UserRound size={20} /></div>
              <div>
                <h2>{mode === "create" ? "Nuevo Cliente" : "Editar Cliente"}</h2>
                <p>
                  {mode === "create"
                    ? "Ingresa los datos para registrar el cliente."
                    : "Modifica los datos del cliente."}
                </p>
              </div>
              <button className="client-form-close" onClick={onClose} type="button">
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form className="client-form" onSubmit={handleSubmit(handlePreSubmit)} noValidate>
              <div className="client-form-scroll-area">

                {/* ── Sección 1: Identificación ── */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">1</span>
                    <h3>Identificación</h3>
                  </div>

                  {/* Tipo de cliente */}
                  <div className="form-group">
                    <label>Tipo de cliente <span className="form-required">*</span></label>
                    <div className="type-toggle">
                      {(["PARTICULAR", "EMPRESA"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`type-toggle__btn ${selectedType === t ? "type-toggle__btn--active" : ""}`}
                          onClick={() => setValue("type", t)}
                        >
                          {t === "PARTICULAR" ? "👤 Particular" : "🏢 Empresa"}
                        </button>
                      ))}
                    </div>
                    {errors.type && <span className="form-error">{errors.type.message}</span>}
                  </div>

                  {/* Nombre */}
                  <div className="form-group">
                    <label htmlFor="cli-name">
                      {selectedType === "EMPRESA" ? "Razón Social" : "Nombre completo"}
                      <span className="form-required"> *</span>
                    </label>
                    <input
                      id="cli-name"
                      type="text"
                      placeholder={selectedType === "EMPRESA" ? "Ej: Gráfica Creativa EIRL" : "Ej: Juan Pérez Gómez"}
                      autoFocus
                      autoComplete="off"
                      {...register("name")}
                    />
                    {errors.name && <span className="form-error">{errors.name.message}</span>}
                  </div>

                  {/* Tipo documento + Número */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="cli-doctype">Tipo documento <span className="form-required">*</span></label>
                      <select id="cli-doctype" {...register("documentType")}>
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                      </select>
                      {errors.documentType && <span className="form-error">{errors.documentType.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cli-doc">Número de documento <span className="form-required">*</span></label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          id="cli-doc"
                          type="text"
                          placeholder={selectedDocType === "DNI" ? "Ej: 12345678 (8 dígitos)" : "Ej: 20123456789 (11 dígitos)"}
                          autoComplete="off"
                          style={{ flex: 1, maxWidth: "none" }}
                          {...register("document")}
                        />
                        {(selectedDocType === "DNI" || selectedDocType === "RUC") && (
                          <button
                            type="button"
                            className="btn-search-doc"
                            onClick={async () => {
                              const doc = watch("document");
                              if (!doc || doc.trim().length < 8) {
                                toast.error("Por favor, ingrese un número de documento válido.");
                                return;
                              }
                              setIsSearchingDoc(true);
                              try {
                                const result = await clientsService.lookupDocument(selectedDocType, doc);
                                if (result && result.name) {
                                  setValue("name", result.name);
                                  if (result.address) setValue("address", result.address);
                                  if (result.city)    setValue("city", result.city);
                                  toast.success("Datos obtenidos desde RENIEC/SUNAT correctamente.");
                                } else {
                                  toast.error("No se encontraron resultados para el documento.");
                                }
                              } catch (error: unknown) {
                                const err = error as { response?: { data?: { message?: string } }; message?: string };
                                toast.error(err.response?.data?.message || err.message || "Error al realizar la consulta.");
                              } finally {
                                setIsSearchingDoc(false);
                              }
                            }}
                            disabled={isSearchingDoc}
                          >
                            {isSearchingDoc ? <Loader2 size={16} className="spin" /> : "Buscar"}
                          </button>
                        )}
                      </div>
                      {errors.document && <span className="form-error">{errors.document.message}</span>}
                    </div>
                  </div>
                </div>

                {/* ── Sección 2: Contacto y Ubicación ── */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">2</span>
                    <h3>Contacto y Ubicación</h3>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="cli-phone">Teléfono</label>
                      <input id="cli-phone" type="tel" placeholder="Ej: 987 654 321" autoComplete="off" {...register("phone")} />
                      {errors.phone && <span className="form-error">{errors.phone.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cli-email">Email</label>
                      <input id="cli-email" type="email" placeholder="Ej: contacto@empresa.pe" autoComplete="off" {...register("email")} />
                      {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cli-address">Dirección</label>
                      <input id="cli-address" type="text" placeholder="Ej: Av. Arequipa 1234" autoComplete="off" {...register("address")} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cli-city">Ciudad</label>
                      <input id="cli-city" type="text" placeholder="Ej: Lima" autoComplete="off" {...register("city")} />
                    </div>

                    {selectedType === "EMPRESA" && (
                      <div className="form-group form-group--full">
                        <label htmlFor="cli-contact">Persona de contacto</label>
                        <input id="cli-contact" type="text" placeholder="Ej: Área de Compras" autoComplete="off" {...register("contactName")} />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Sección 3: Otros Datos ── */}
                <div className="form-section-card">
                  <div className="section-title-row">
                    <span className="section-num">3</span>
                    <h3>Otros Datos</h3>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cli-notes">Observaciones</label>
                    <textarea
                      id="cli-notes"
                      rows={2}
                      placeholder="Notas adicionales sobre el cliente..."
                      autoComplete="off"
                      {...register("notes")}
                    />
                    <span className="form-char-count">{notesValue.length}/500</span>
                  </div>

                  {mode === "edit" && (
                    <div className="form-group">
                      <label>Estado del cliente</label>
                      <div className="status-toggle-wrapper">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={statusValue === "ACTIVE"}
                            onChange={(e) => setValue("status", e.target.checked ? "ACTIVE" : "INACTIVE")}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span className={`status-label ${statusValue === "ACTIVE" ? "status-label--active" : "status-label--inactive"}`}>
                          {statusValue === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Acciones */}
              <div className="client-form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><Loader2 size={16} className="spin" /> Guardando...</>
                    : <><UserRound size={16} /> {mode === "create" ? "Registrar cliente" : "Guardar cambios"}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showConfirm && (
        <ConfirmModal
          title={mode === "create" ? "¿Registrar cliente?" : "¿Guardar cambios?"}
          description={
            mode === "create"
              ? "¿Estás seguro de que deseas registrar este nuevo cliente?"
              : "¿Estás seguro de que deseas guardar los cambios del cliente?"
          }
          onConfirm={handleConfirmSubmit}
          onClose={() => setShowConfirm(false)}
          confirmLabel={mode === "create" ? "Registrar" : "Guardar"}
          icon={mode === "create" ? "create" : "update"}
        />
      )}
    </>
  );
};
