/**
 * Utilidades para manejo y limpieza de strings.
 * Cumple con el principio de Responsabilidad Única (SRP) y DRY.
 */

/**
 * Limpia y sanitiza una cadena de texto, eliminando espacios en blanco innecesarios
 * y normalizando espacios múltiples en uno solo.
 */
export const sanitize = (str?: string): string => {
  return str?.trim().replace(/\s+/g, " ") ?? "";
};
