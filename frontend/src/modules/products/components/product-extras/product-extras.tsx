import { useState, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Barcode,
  Printer,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import "./product-extras.scss";

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductImportModal = ({ onClose, onSuccess }: ImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "success">("idle");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls") || dropped.name.endsWith(".csv")) {
        setFile(dropped);
      } else {
        toast.error("Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartImport = () => {
    if (!file) return;
    setStage("uploading");
    setProgress(0);
  };

  useEffect(() => {
    if (stage === "uploading") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setStage("success");
              toast.success("Productos importados correctamente!");
              onSuccess();
            }, 600);
            return 100;
          }
          return prev + 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [stage, onSuccess]);

  return (
    <div className="product-extras-overlay">
      <div className="product-extras-modal product-extras-modal--import">
        <div className="product-extras-modal__header">
          <div className="title-wrapper">
            <Upload className="header-icon" size={20} />
            <h2>Importar Productos desde Excel</h2>
          </div>
          <button className="close-btn" onClick={onClose} disabled={stage === "uploading"}>
            <X size={20} />
          </button>
        </div>

        <div className="import-modal-body">
          {stage === "idle" && (
            <>
              <p className="description">
                Descargue la plantilla de importación, rellene los datos de sus productos y súbala aquí.
              </p>

              <div
                className="drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FileSpreadsheet size={48} className="drop-zone__icon" />
                {file ? (
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <>
                    <p>Arrastre su archivo Excel o CSV aquí</p>
                    <span>o haga clic para examinar archivos</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      id="excel-file-picker"
                      style={{ display: "none" }}
                    />
                    <label htmlFor="excel-file-picker" className="file-picker-btn">
                      Examinar
                    </label>
                  </>
                )}
              </div>

              <div className="warning-note">
                <AlertCircle size={16} />
                <span>
                  Asegúrese de que las columnas coincidan exactamente con la plantilla para evitar errores de registro.
                </span>
              </div>
            </>
          )}

          {stage === "uploading" && (
            <div className="progress-container">
              <h3>Procesando archivo...</h3>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">{progress}% completado</span>
            </div>
          )}

          {stage === "success" && (
            <div className="success-container">
              <div className="success-icon-wrapper">
                <Check size={36} />
              </div>
              <h3>¡Importación Exitosa!</h3>
              <p>Se han analizado y agregado los productos de su archivo Excel al sistema.</p>
            </div>
          )}
        </div>

        <div className="product-extras-modal__footer">
          {stage === "idle" && (
            <>
              <button className="cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="action-btn"
                onClick={handleStartImport}
                disabled={!file}
              >
                Comenzar Importación
              </button>
            </>
          )}
          {stage === "success" && (
            <button className="action-btn" onClick={onClose}>
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface BarcodeModalProps {
  onClose: () => void;
  products: { id: number; name: string; code: string }[];
}

export const ProductBarcodeModal = ({ onClose, products }: BarcodeModalProps) => {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(8);
  const [showSheet, setShowSheet] = useState(false);

  const selectedProduct = products.find(p => String(p.id) === selectedProductId);

  const handleGenerate = () => {
    if (!selectedProductId) {
      toast.error("Por favor seleccione un producto.");
      return;
    }
    setShowSheet(true);
  };

  const handlePrint = () => {
    toast.success("Enviando códigos de barra a la cola de impresión...");
  };

  return (
    <div className="product-extras-overlay">
      <div className="product-extras-modal product-extras-modal--barcode">
        <div className="product-extras-modal__header">
          <div className="title-wrapper">
            <Barcode className="header-icon" size={20} />
            <h2>Generador de Código de Barras</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="barcode-modal-body">
          {!showSheet ? (
            <>
              <p className="description">
                Seleccione un producto para generar hojas de etiquetas adhesivas con código de barras en formato Code 128.
              </p>

              <div className="form-group">
                <label>Producto *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad de Etiquetas</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(40, Math.max(1, parseInt(e.target.value) || 1)))}
                />
                <span className="field-hint">Máximo 40 etiquetas por página</span>
              </div>
            </>
          ) : (
            <div className="barcode-sheet-container">
              <div className="barcode-sheet-header">
                <span>Producto: {selectedProduct?.name} ({selectedProduct?.code})</span>
              </div>
              <div className="barcode-labels-grid">
                {Array.from({ length: quantity }).map((_, i) => (
                  <div key={i} className="barcode-label-card">
                    <span className="label-product-name">{selectedProduct?.name.slice(0, 20)}</span>
                    <div className="fake-barcode-lines">
                      <div className="bar bar-thin" />
                      <div className="bar bar-thick" />
                      <div className="bar bar-medium" />
                      <div className="bar bar-thin" />
                      <div className="bar bar-thick" />
                      <div className="bar bar-thin" />
                      <div className="bar bar-medium" />
                      <div className="bar bar-thick" />
                    </div>
                    <span className="label-code-value">{selectedProduct?.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="product-extras-modal__footer">
          {!showSheet ? (
            <>
              <button className="cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button className="action-btn" onClick={handleGenerate}>
                Generar Código
              </button>
            </>
          ) : (
            <>
              <button className="cancel-btn" onClick={() => setShowSheet(false)}>
                Atrás
              </button>
              <button className="action-btn print-action" onClick={handlePrint}>
                <Printer size={16} />
                Imprimir Etiquetas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
