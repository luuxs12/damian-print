import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./success-animation.scss";

interface Props {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const SuccessAnimation = ({ message, onClose, duration = 1500 }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const portalTarget = document.getElementById("dashboard-content-root") || document.body;

  return createPortal(
    <div className="success-animation-overlay">
      <div className="success-animation-card">
        {/* Animated Checkmark SVG */}
        <div className="success-animation-svg-wrapper">
          <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h3 className="success-animation-message">{message}</h3>
      </div>
    </div>,
    portalTarget
  );
};
