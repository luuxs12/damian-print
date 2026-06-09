/**
 * Genera el arreglo de páginas a mostrar en la paginación con elipsis ("...")
 * si la cantidad total supera el límite visible.
 * Evita la duplicación de código en las tablas del sistema (DRY / SOLID).
 */
export const generatePageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  const pages: (number | string)[] = [];
  const totalPagesToShow = Math.max(totalPages, 1);

  if (totalPagesToShow <= 5) {
    for (let i = 1; i <= totalPagesToShow; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPagesToShow);
    } else if (currentPage >= totalPagesToShow - 2) {
      pages.push(1, "...", totalPagesToShow - 3, totalPagesToShow - 2, totalPagesToShow - 1, totalPagesToShow);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPagesToShow);
    }
  }
  return pages;
};
