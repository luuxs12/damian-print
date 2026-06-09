import { useState, useRef, useEffect, useCallback } from "react";
import {
  Moon,
  Sun,
  Menu,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "@/app/providers/theme-provider";
import { authStore, useAuthStore } from "@/modules/auth/store/auth-store";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";

import "./navbar.scss";

interface NavbarProps {
  onMenuClick?: () => void;
  onProfileOpenChange?: (open: boolean) => void;
}

export const Navbar = ({ onMenuClick, onProfileOpenChange }: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const session = useAuthStore((state) => state.session);
  const user = session?.user;
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setProfileOpen = useCallback((open: boolean) => {
    setIsProfileOpen(open);
    onProfileOpenChange?.(open);
  }, [onProfileOpenChange]);

  const handleLogout = () => {
    authStore.clearSession();
    navigate("/login");
  };

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setProfileOpen]);

  return (
    <>
      <div className="navbar-container">

        <div className="navbar-left">
          <button
            className="navbar-icon-button mobile-menu-btn"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </button>

          <div className="navbar-titles">
            <h1 className="navbar-title">Panel de control</h1>
            <p className="navbar-subtitle">
              Bienvenido nuevamente{user ? `, ${user.username}` : ''}
            </p>
          </div>
        </div>

        <div className="navbar-right">

          <button className="navbar-icon-button" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="navbar-profile-wrapper" ref={dropdownRef}>
            <div
              className={`navbar-profile ${isProfileOpen ? "active" : ""}`}
              onClick={() => setProfileOpen(!isProfileOpen)}
            >
              <div className="navbar-avatar">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'DP'}
              </div>

              <div className="navbar-user-info">
                <span className="navbar-user-name">{user?.username || 'Invitado'}</span>
                <span className="navbar-user-role">{user?.role || 'User'}</span>
              </div>

              <ChevronDown
                size={16}
                className={`navbar-profile-chevron ${isProfileOpen ? 'open' : ''}`}
              />
            </div>

            {/* Dropdown — only logout */}
            {isProfileOpen && (
              <div className="navbar-dropdown">
                <button
                  className="navbar-dropdown-item text-danger"
                  onClick={handleLogoutClick}
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {showLogoutConfirm && (
        <ConfirmModal
          title="Cerrar sesión"
          description="¿Estás seguro que deseas cerrar tu sesión?"
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          confirmLabel="Cerrar sesión"
          icon="logout"
        />
      )}
    </>
  );
};