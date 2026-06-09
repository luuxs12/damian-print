import type { KpiCardProps } from "./kpi-card.types";
import "./kpi-card.scss";

export function KpiCard({
  title,
  value,
  icon: Icon,
}: KpiCardProps) {
  // Asignar colores de acento sutiles según la métrica
  let accentClass = "teal";
  if (title.toLowerCase().includes("ingresos")) accentClass = "emerald";
  if (title.toLowerCase().includes("cola")) accentClass = "indigo";
  if (title.toLowerCase().includes("espera")) accentClass = "amber";

  return (
    <article className={`kpi-card kpi-card--accent-${accentClass}`}>
      <div className="kpi-card__main">
        <div className="kpi-card__icon-wrapper">
          <Icon size={20} className="kpi-card__icon" />
        </div>
        <div className="kpi-card__info">
          <span className="kpi-card__title">{title}</span>
          <div className="kpi-card__row">
            <h2 className="kpi-card__value">{value}</h2>
          </div>
        </div>
      </div>
    </article>
  );
}