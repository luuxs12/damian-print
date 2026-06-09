import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./sidebar/sidebar";
import { Navbar } from "./navbar/navbar";

import "./dashboard-layout.scss";

export const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleMobileMenu  = () => setIsMobileMenuOpen((v) => !v);
  const closeMobileMenu   = () => setIsMobileMenuOpen(false);
  const toggleCollapsed   = () => setIsCollapsed((v) => !v);

  return (
    <div
      className={`dashboard-layout${isCollapsed ? " sidebar-collapsed" : ""}`}
    >

      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu} />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? "sidebar-mobile-open" : ""}`}>
        <Sidebar
          onClose={closeMobileMenu}
          collapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      <div className="dashboard-main">

        <header className="navbar">
          <Navbar
            onMenuClick={toggleMobileMenu}
            onProfileOpenChange={setIsProfileOpen}
          />
        </header>

        <main id="dashboard-content-root" className={`dashboard-content${isProfileOpen ? " content-blurred" : ""}`}>
          {isProfileOpen && (
            <div className="dashboard-content-overlay" />
          )}
          <Outlet />
        </main>

      </div>

    </div>
  );
};