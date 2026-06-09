/**
 * PageTransition — Entrada ultra rápida al cambiar de módulo.
 * opacity + leve desplazamiento hacia arriba, 120ms total.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
    style={{ height: "100%", display: "flex", flexDirection: "column" }}
  >
    {children}
  </motion.div>
);
