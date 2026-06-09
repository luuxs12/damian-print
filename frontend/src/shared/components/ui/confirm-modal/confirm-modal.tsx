import { createPortal } from "react-dom";
import "./confirm-modal.scss";

import {
  AlertTriangle,
  Trash2,
  X,
  LogOut,
  CheckCircle2,
  Pencil,
} from "lucide-react";

interface Props {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmLabel?: string;
  icon?: "delete" | "logout" | "warning" | "create" | "update";
  showCancel?: boolean;
}

export const ConfirmModal = ({
  title,
  description,
  onConfirm,
  onClose,
  confirmLabel = "Confirmar",
  icon = "warning",
  showCancel = true,
}: Props) => {

  const portalTarget = icon === "logout"
    ? document.body
    : (document.getElementById("dashboard-content-root") || document.body);

  const renderIcon = () => {
    switch (icon) {
      case "logout":
        return <LogOut size={34} />;
      case "delete":
        return <Trash2 size={34} />;
      case "create":
        return <CheckCircle2 size={34} />;
      case "update":
        return <Pencil size={34} />;
      case "warning":
      default:
        return <AlertTriangle size={34} />;
    }
  };

  const getIconClass = () => {
    switch (icon) {
      case "logout":
        return "confirm-modal__icon--logout";
      case "delete":
        return "confirm-modal__icon--delete";
      case "create":
        return "confirm-modal__icon--create";
      case "update":
        return "confirm-modal__icon--update";
      case "warning":
      default:
        return "confirm-modal__icon--warning";
    }
  };

  const getBtnClass = () => {
    switch (icon) {
      case "logout":
        return "confirm-modal__confirm--logout";
      case "delete":
        return "confirm-modal__confirm--delete";
      case "create":
        return "confirm-modal__confirm--create";
      case "update":
        return "confirm-modal__confirm--update";
      case "warning":
      default:
        return "confirm-modal__confirm--warning";
    }
  };

  const renderBtnIcon = () => {
    switch (icon) {
      case "logout":
        return <LogOut size={17} />;
      case "delete":
        return <Trash2 size={17} />;
      case "create":
        return <CheckCircle2 size={17} />;
      case "update":
        return <Pencil size={17} />;
      case "warning":
      default:
        return <AlertTriangle size={17} />;
    }
  };

  return createPortal(
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">

        <button className="confirm-modal__close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className={`confirm-modal__icon ${getIconClass()}`}>
          {renderIcon()}
        </div>

        <h2>{title}</h2>
        <p>{description}</p>

        <div className="confirm-modal__actions">
          {showCancel && (
            <button className="confirm-modal__cancel" onClick={onClose}>
              Cancelar
            </button>
          )}

          <button
            className={`confirm-modal__confirm ${getBtnClass()}`}
            onClick={onConfirm}
          >
            {renderBtnIcon()}
            <span>{confirmLabel}</span>
          </button>

        </div>

      </div>
    </div>,
    portalTarget
  );
};