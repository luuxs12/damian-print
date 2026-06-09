import {
  Printer,
  PenTool,
  Layers,
  Droplets,
  Crop,
  DraftingCompass,
  BookOpenText,
  Scissors,
  ScanLine,
  PaintBucket,
  Frame,
  Moon,
  Sun,
} from "lucide-react";

import {
  Outlet,
} from "react-router-dom";

import defaultLogo from "@/assets/images/branding/tulogoaqui.png";

import {
  useTheme,
} from "@/app/providers/theme-provider";

import "./auth-layout.scss";

export const AuthLayout = () => {
  const {
    theme,
    toggleTheme,
  } = useTheme();

  return (
    <div className="auth-layout">

      <div className="auth-layout__background">

        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />

        <div className="print-grid" />

        <div className="paint-blob cyan-blob" />
        <div className="paint-blob magenta-blob" />
        <div className="paint-blob yellow-blob" />

        {/* =========================================
           FLOATING PRINT OBJECTS
        ========================================= */}

        <div className="floating-object card-1">
          <div className="object-glow" />
          <Printer size={50} />
          <span>Offset</span>
        </div>

        <div className="floating-object card-2">
          <div className="object-glow" />
          <PenTool size={46} />
          <span>Vectores</span>
        </div>

        <div className="floating-object card-3">
          <div className="object-glow" />
          <Layers size={44} />
          <span>Sustratos</span>
        </div>

        <div className="floating-object card-4">
          <div className="object-glow" />
          <Droplets size={44} />
          <span>CMYK</span>
        </div>

        <div className="floating-object card-5">
          <div className="object-glow" />
          <Crop size={40} />
          <span>Guillotina</span>
        </div>

        <div className="floating-object card-6">
          <div className="object-glow" />
          <DraftingCompass size={40} />
          <span>Pre-prensa</span>
        </div>

        <div className="floating-object card-7">
          <div className="object-glow" />
          <BookOpenText size={42} />
          <span>Encuadernación</span>
        </div>

        <div className="floating-object card-8">
          <div className="object-glow" />
          <Scissors size={42} />
          <span>Troquelado</span>
        </div>

        <div className="floating-object card-9">
          <div className="object-glow" />
          <ScanLine size={40} />
          <span>Plotter</span>
        </div>

        <div className="floating-object card-10">
          <div className="object-glow" />
          <PaintBucket size={40} />
          <span>Tintas</span>
        </div>

        <div className="floating-object card-11">
          <div className="object-glow" />
          <Frame size={40} />
          <span>Bastidores</span>
        </div>

        {/* =========================================
           PAPERS
        ========================================= */}

        <div className="paper paper-1" />
        <div className="paper paper-2" />
        <div className="paper paper-3" />

        {/* =========================================
           INK DROPS
        ========================================= */}

        <div className="ink-drop drop-1" />
        <div className="ink-drop drop-2" />
        <div className="ink-drop drop-3" />
        <div className="ink-drop drop-4" />

      </div>

      <button
        className="auth-theme-toggle"
        onClick={toggleTheme}
      >

        {theme === "dark" ? (
          <Sun size={20} />
        ) : (
          <Moon size={20} />
        )}

      </button>

      <div className="auth-layout__content">

        <div className="auth-brand">

          <div className="brand-glow" />

          <img
            src={defaultLogo}
            alt="Damian Print"
          />

        </div>

        <Outlet />

      </div>

    </div>
  );
};