/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import {
  Building2,
  FileBadge,
  Mail,
  Phone,
  MapPin,
  Upload,
  Image as ImageIcon,
  QrCode,
  Download,
  Database,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { settingsService, Settings } from "../services/settings-service";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal/confirm-modal";
import { useTheme } from "@/app/providers/theme-provider";
import darkLogo from "@/assets/images/branding/logo-dark.png";
import lightLogo from "@/assets/images/branding/logo-light.png";
import "./settings-page.scss";


type TabId = "empresa" | "logos_pagos" | "sistema";

export const SettingsPage = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("empresa");
  const [settings, setSettings] = useState<Settings | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyRuc, setCompanyRuc] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingYape, setUploadingYape] = useState(false);
  const [uploadingPlin, setUploadingPlin] = useState(false);

  const [activeModal, setActiveModal] = useState<"restore" | "reset" | null>(null);
  const [restoreData, setRestoreData] = useState<Record<string, unknown> | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";


  // Load Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
      setCompanyName(data.companyName);
      setCompanyRuc(data.companyRuc);
      setCompanyEmail(data.companyEmail);
      setCompanyPhone(data.companyPhone);
      setCompanyAddress(data.companyAddress);
    } catch (error) {
      toast.error("Error al cargar la configuración del sistema.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save General Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("El nombre de la empresa es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings({
        companyName,
        companyRuc,
        companyEmail,
        companyPhone,
        companyAddress,
      });
      setSettings(updated);
      toast.success("Información de la empresa guardada correctamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar configuración.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Upload File handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "yape" | "plin") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "logo") setUploadingLogo(true);
    else if (type === "yape") setUploadingYape(true);
    else if (type === "plin") setUploadingPlin(true);

    try {
      const url = await settingsService.uploadSettingFile(file);
      
      const payload: Partial<Settings> = {};
      if (type === "logo") payload.systemLogo = url;
      else if (type === "yape") payload.yapeQr = url;
      else if (type === "plin") payload.plinQr = url;

      const updated = await settingsService.updateSettings(payload);
      setSettings(updated);
      toast.success("Imagen subida y actualizada con éxito.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al subir la imagen.";
      toast.error(message);
    } finally {
      setUploadingLogo(false);
      setUploadingYape(false);
      setUploadingPlin(false);
      e.target.value = ""; // Clear input
    }
  };

  // Backup download handler
  const handleDownloadBackup = async () => {
    toast.loading("Generando copia de seguridad...", { id: "backup-dl" });
    try {
      await settingsService.downloadBackup();
      toast.success("Copia de seguridad descargada con éxito.", { id: "backup-dl" });
    } catch {
      toast.error("Error al descargar el backup de base de datos.", { id: "backup-dl" });
    }
  };

  // Restore file selection handler
  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.tables || !parsed.version) {
          toast.error("El archivo no tiene el formato de backup oficial del sistema.");
          return;
        }
        setRestoreData(parsed);
        setActiveModal("restore");
      } catch {
        toast.error("El archivo no es un JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Clear file input
  };

  // Restore execute handler
  const handleConfirmRestore = async () => {
    if (!restoreData) return;
    setLoading(true);
    try {
      await settingsService.restoreBackup(restoreData);
      toast.success("Base de datos restaurada correctamente. Recargando...");
      setActiveModal(null);
      setRestoreData(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al restaurar backup.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Reset database execute handler
  const handleConfirmReset = async () => {
    setLoading(true);
    try {
      await settingsService.resetDatabase();
      toast.success("Base de datos restablecida. Se eliminaron datos operativos.");
      setActiveModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al restablecer base de datos.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="settings-page-loading">
        <RefreshCw className="settings-page-loading__spinner" size={36} />
        <p>Cargando configuración del sistema...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* ── Encabezado ── */}
      <div className="settings-page__header">
        <div>
          <h1>Configuración del Sistema</h1>
          <p>Parámetros de la empresa, identidad visual, métodos de pago y mantenimiento de base de datos.</p>
        </div>
      </div>

      {/* ── Menú de Pestañas (Tabs) ── */}
      <div className="settings-tabs">
        <button
          className={`settings-tab-btn ${activeTab === "empresa" ? "active" : ""}`}
          onClick={() => setActiveTab("empresa")}
        >
          <Building2 size={18} />
          Datos de la Empresa
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "logos_pagos" ? "active" : ""}`}
          onClick={() => setActiveTab("logos_pagos")}
        >
          <ImageIcon size={18} />
          Logo y QR de Pagos
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "sistema" ? "active" : ""}`}
          onClick={() => setActiveTab("sistema")}
        >
          <Database size={18} />
          Seguridad y Sistema
        </button>
      </div>

      {/* ── Panel de Contenido ── */}
      <div className="settings-panel">
        {activeTab === "empresa" && (
          <form className="settings-form" onSubmit={handleSaveInfo}>
            <h2 className="settings-panel-title">Datos Comerciales y Fiscales</h2>
            
            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label>Nombre de la Empresa</label>
                <div className="settings-input-wrapper">
                  <Building2 size={16} />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Damian Print S.A.C."
                    required
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label>RUC</label>
                <div className="settings-input-wrapper">
                  <FileBadge size={16} />
                  <input
                    type="text"
                    value={companyRuc}
                    onChange={(e) => setCompanyRuc(e.target.value)}
                    placeholder="Ej. 20123456789"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label>Correo Electrónico</label>
                <div className="settings-input-wrapper">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="Ej. contacto@damianprint.com"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label>Teléfono de Contacto</label>
                <div className="settings-input-wrapper">
                  <Phone size={16} />
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="Ej. 987654321"
                  />
                </div>
              </div>

              <div className="settings-form-group settings-form-group--full">
                <label>Dirección Comercial / Fiscal</label>
                <div className="settings-input-wrapper">
                  <MapPin size={16} />
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Ej. Av. Larco 123, Miraflores, Lima"
                  />
                </div>
              </div>
            </div>

            <div className="settings-form-actions">
              <button
                type="submit"
                className="settings-action-btn settings-action-btn--primary"
                disabled={saving}
              >
                {saving ? (
                  <span className="settings-spinner" />
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === "logos_pagos" && (
          <div className="settings-assets-manager">
            <h2 className="settings-panel-title">Elementos Visuales y Pagos QR</h2>
            
            <div className="settings-assets-grid">
              {/* Logo Card */}
              <div className="settings-asset-card">
                <h3>Logo del Sistema</h3>
                <p>Imagen oficial que se mostrará en el menú lateral y las facturas.</p>
                
                <div className="settings-asset-preview settings-asset-preview--logo">
                  {settings?.systemLogo ? (
                    <img src={`${API_URL}${settings.systemLogo}`} alt="System Logo" />
                  ) : (
                    <div className="settings-asset-placeholder" style={{ gap: "4px" }}>
                      <img src={theme === "dark" ? darkLogo : lightLogo} alt="System Logo Default" style={{ maxHeight: "42px", width: "auto" }} />
                      <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>Logo por defecto (Modo {theme === "dark" ? "Oscuro" : "Claro"})</span>
                    </div>
                  )}
                </div>

                <label className="settings-upload-btn">
                  <Upload size={16} />
                  {uploadingLogo ? "Subiendo..." : "Subir nuevo logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "logo")}
                    disabled={uploadingLogo}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Yape Card */}
              <div className="settings-asset-card">
                <h3>QR Yape</h3>
                <p>Código QR oficial para que tus clientes paguen a través de Yape.</p>
                
                <div className="settings-asset-preview">
                  {settings?.yapeQr ? (
                    <img src={`${API_URL}${settings.yapeQr}`} alt="Yape QR" />
                  ) : (
                    <div className="settings-asset-placeholder">
                      <QrCode size={48} />
                      <span>Sin QR de Yape</span>
                    </div>
                  )}
                </div>

                <label className="settings-upload-btn">
                  <Upload size={16} />
                  {uploadingYape ? "Subiendo..." : "Subir QR de Yape"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "yape")}
                    disabled={uploadingYape}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Plin Card */}
              <div className="settings-asset-card">
                <h3>QR Plin</h3>
                <p>Código QR oficial para que tus clientes paguen a través de Plin.</p>
                
                <div className="settings-asset-preview">
                  {settings?.plinQr ? (
                    <img src={`${API_URL}${settings.plinQr}`} alt="Plin QR" />
                  ) : (
                    <div className="settings-asset-placeholder">
                      <QrCode size={48} />
                      <span>Sin QR de Plin</span>
                    </div>
                  )}
                </div>

                <label className="settings-upload-btn">
                  <Upload size={16} />
                  {uploadingPlin ? "Subiendo..." : "Subir QR de Plin"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "plin")}
                    disabled={uploadingPlin}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sistema" && (
          <div className="settings-system-panel">
            <h2 className="settings-panel-title">Mantenimiento y Copias de Seguridad</h2>
            
            <div className="settings-system-grid">
              {/* Backup Descargar */}
              <div className="settings-system-card">
                <div className="settings-system-card__icon settings-system-card__icon--backup">
                  <Download size={28} />
                </div>
                <div className="settings-system-card__content">
                  <h3>Descargar Copia de Seguridad</h3>
                  <p>Obtén un archivo descargable en formato JSON con la base de datos completa de tu negocio.</p>
                  <button
                    className="settings-action-btn settings-action-btn--primary"
                    onClick={handleDownloadBackup}
                  >
                    <Download size={16} />
                    Exportar JSON
                  </button>
                </div>
              </div>

              {/* Backup Restaurar */}
              <div className="settings-system-card">
                <div className="settings-system-card__icon settings-system-card__icon--restore">
                  <Upload size={28} />
                </div>
                <div className="settings-system-card__content">
                  <h3>Restaurar Copia de Seguridad</h3>
                  <p>Sube un archivo de respaldo JSON previamente generado para recuperar toda la información.</p>
                  <label className="settings-action-btn settings-action-btn--success" style={{ cursor: "pointer" }}>
                    <Upload size={16} />
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFileSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              {/* Resetear Base de Datos */}
              <div className="settings-system-card settings-system-card--danger">
                <div className="settings-system-card__icon settings-system-card__icon--danger">
                  <Trash2 size={28} />
                </div>
                <div className="settings-system-card__content">
                  <h3>Restablecer Datos Operativos</h3>
                  <p>Elimina toda la información de producción, productos, insumos, clientes y categorías. Se conservarán los usuarios y roles de acceso.</p>
                  <button
                    className="settings-action-btn settings-action-btn--danger"
                    onClick={() => setActiveModal("reset")}
                  >
                    <Trash2 size={16} />
                    Limpiar Base de Datos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Confirmar Restauración ── */}
      {activeModal === "restore" && (
        <ConfirmModal
          title="Confirmar restauración"
          description="Se borrarán los datos actuales y se restaurarán los del archivo de respaldo. Esta acción no se puede deshacer. ¿Desea continuar?"
          confirmLabel="Restaurar"
          icon="warning"
          onConfirm={handleConfirmRestore}
          onClose={() => {
            setActiveModal(null);
            setRestoreData(null);
          }}
        />
      )}

      {/* ── Modal Confirmar Reset de Datos ── */}
      {activeModal === "reset" && (
        <ConfirmModal
          title="¿Estás completamente seguro?"
          description="Se eliminarán permanentemente todas las órdenes de producción, cotizaciones, productos, presentaciones, clientes, insumos y logs de auditoría. Se conservarán los usuarios del sistema."
          confirmLabel="Confirmar Limpieza"
          icon="delete"
          onConfirm={handleConfirmReset}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
