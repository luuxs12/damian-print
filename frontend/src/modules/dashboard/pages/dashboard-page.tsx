import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Coins,
  ClipboardList,
  CheckSquare,
  Clock,
  Package,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { KpiCard } from "../components/kpi-cards/kpi-card";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import { dashboardService, type DashboardStats } from "../services/dashboard-service";
import "./dashboard-page.scss";

/* ────────────────────────────────────────────────────────────
   Tipos
──────────────────────────────────────────────────────────── */

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface ChartPoint {
  label: string;
  ingresos: number;
  pedidos: number;
}

/* ────────────────────────────────────────────────────────────
   Constantes
──────────────────────────────────────────────────────────── */

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS_HEADER = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

const BASE_WEEK: Record<string, { ingresos: number; pedidos: number }> = {
  "Lun": { ingresos: 1200, pedidos: 8 },
  "Mar": { ingresos: 2100, pedidos: 14 },
  "Mié": { ingresos: 1800, pedidos: 11 },
  "Jue": { ingresos: 2800, pedidos: 19 },
  "Vie": { ingresos: 3200, pedidos: 22 },
  "Sáb": { ingresos: 4100, pedidos: 28 },
  "Dom": { ingresos: 3600, pedidos: 24 },
};



/* ────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatShort(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}



/* ────────────────────────────────────────────────────────────
   Tooltip personalizado
──────────────────────────────────────────────────────────── */

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip__row" style={{ color: p.color }}>
          {p.name === "ingresos" ? "Ingresos" : "Pedidos"}:{" "}
          <strong>{p.name === "ingresos" ? `S/ ${p.value.toLocaleString()}` : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Mini calendario inline
──────────────────────────────────────────────────────────── */

interface InlineCalendarProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

function InlineCalendar({ dateRange, onChange }: InlineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const prevMonth = useCallback(() => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, []);

  const handleDayClick = useCallback((dayNum: number) => {
    const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
    clicked.setHours(0, 0, 0, 0);

    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      onChange({ startDate: clicked, endDate: null });
    } else {
      if (clicked < dateRange.startDate) {
        onChange({ startDate: clicked, endDate: dateRange.startDate });
      } else {
        onChange({ startDate: dateRange.startDate, endDate: clicked });
      }
    }
  }, [currentMonth, dateRange, onChange]);

  const handleMouseEnter = useCallback((dayNum: number) => {
    if (dateRange.startDate && !dateRange.endDate) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
      d.setHours(0, 0, 0, 0);
      setHoverDate(d);
    }
  }, [currentMonth, dateRange]);

  const handleClear = useCallback(() => {
    onChange({ startDate: null, endDate: null });
  }, [onChange]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} className="ic-day ic-day--empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const t = date.getTime();
    const startT = dateRange.startDate?.getTime() ?? 0;
    const endT = dateRange.endDate?.getTime() ?? 0;
    const hoverT = hoverDate?.getTime() ?? 0;

    const isStart = startT === t;
    const isEnd = endT === t;

    let isBetween = false;
    if (startT && endT) {
      isBetween = t > startT && t < endT;
    } else if (startT && !endT && hoverT) {
      isBetween = hoverT > startT
        ? t > startT && t <= hoverT
        : t >= hoverT && t < startT;
    }

    const isToday = t === today.getTime() && !isStart && !isEnd;

    const cls = [
      "ic-day",
      (isStart || isEnd) ? "ic-day--selected" : "",
      isStart ? "ic-day--start" : "",
      isEnd ? "ic-day--end" : "",
      isBetween ? "ic-day--between" : "",
      isToday ? "ic-day--today" : "",
    ].filter(Boolean).join(" ");

    cells.push(
      <button
        key={d}
        className={cls}
        onClick={() => handleDayClick(d)}
        onMouseEnter={() => handleMouseEnter(d)}
      >
        {d}
      </button>
    );
  }

  const hasRange = dateRange.startDate && dateRange.endDate;
  const hasSingle = dateRange.startDate && !dateRange.endDate;

  return (
    <div className="inline-calendar" onMouseLeave={() => setHoverDate(null)}>
      <div className="ic-header">
        <button className="ic-nav" onClick={prevMonth} aria-label="Mes anterior">
          ‹
        </button>
        <span className="ic-month-label">{MONTHS[month]} {year}</span>
        <button className="ic-nav" onClick={nextMonth} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="ic-weekdays">
        {DAYS_HEADER.map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="ic-grid">{cells}</div>

      <div className="ic-footer">
        {hasRange ? (
          <>
            <span className="ic-range-label">
              {formatShort(dateRange.startDate!)} → {formatShort(dateRange.endDate!)}
            </span>
            <button className="ic-clear" onClick={handleClear}>Limpiar</button>
          </>
        ) : hasSingle ? (
          <span className="ic-range-label ic-range-label--hint">
            Selecciona la fecha final
          </span>
        ) : (
          <span className="ic-range-label ic-range-label--hint">
            Selecciona un rango de fechas
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Componente principal
──────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const session = useAuthStore(state => state.session);
  const role = session?.user?.role?.toLowerCase() ?? "";
  const permissions = session?.user?.permissions ?? [];
  const hasAccess =
    role === "administrador" ||
    role === "admin" ||
    permissions.includes("Dashboard");

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  const [activeTab, setActiveTab] = useState<"metrics" | "calendar">("metrics");
  const [selectedPreset, setSelectedPreset] = useState<"week" | "15" | "30">("week");
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const startStr = dateRange.startDate ? dateRange.startDate.toISOString() : undefined;
      const endStr = dateRange.endDate ? dateRange.endDate.toISOString() : undefined;
      const stats = await dashboardService.getStats(startStr, endStr);
      setData(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (hasAccess) {
      fetchStats();
    }
  }, [fetchStats, hasAccess]);

  const setRangePreset = (days: number, preset: "15" | "30") => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({ startDate: start, endDate: end });
    setSelectedPreset(preset);
  };

  const setWeekPreset = () => {
    setDateRange({ startDate: null, endDate: null });
    setSelectedPreset("week");
  };

  const { kpis, chartData, breakdown } = useMemo(() => {
    if (data) {
      return data;
    }

    const demo: ChartPoint[] = Object.entries(BASE_WEEK).map(([label, v]) => ({
      label,
      ingresos: v.ingresos,
      pedidos: v.pedidos,
    }));
    const totalIngresos = demo.reduce((s, d) => s + d.ingresos, 0);
    const totalPedidos  = demo.reduce((s, d) => s + d.pedidos, 0);
    return {
      kpis: {
        ingresos:   totalIngresos,
        pedidos:    totalPedidos,
        entregas:   Math.round(totalPedidos * 0.75),
        enEspera:   Math.round(totalPedidos * 0.18),
      },
      chartData: demo,
      breakdown: {
        completados: Math.round(totalPedidos * 0.75),
        cancelados:  Math.round(totalPedidos * 0.05),
        clientes:    24,
        productos:   Math.round(totalPedidos * 1.4),
      },
    };
  }, [data]);

  if (!hasAccess) {
    return (
      <section className="dashboard-page dashboard-page--centered">
        <div className="dashboard-welcome">
          <h2>Bienvenido a Damian Print</h2>
          <p>Selecciona un módulo del menú lateral para comenzar a trabajar.</p>
        </div>
      </section>
    );
  }

  const periodLabel = dateRange.startDate && dateRange.endDate
    ? `${formatShort(dateRange.startDate)} – ${formatShort(dateRange.endDate)}`
    : "Esta semana";

  return (
    <section className="dashboard-page">

      {/* ── KPIs ── */}
      <div className="dashboard-kpis">
        <KpiCard
          title="Ingresos del periodo"
          value={`S/ ${kpis.ingresos.toLocaleString()}`}
          icon={Coins}
        />
        <KpiCard
          title="Trabajos en cola"
          value={kpis.pedidos.toString()}
          icon={ClipboardList}
        />
        <KpiCard
          title="Entregas realizadas"
          value={kpis.entregas.toString()}
          icon={CheckSquare}
        />
        <KpiCard
          title="En espera"
          value={kpis.enEspera.toString()}
          icon={Clock}
        />
      </div>

      {/* ── Grid principal ── */}
      <div className="dashboard-grid">

        {/* ── Gráfica ── */}
        <div className="dashboard-chart">
          <div className="chart-glow" />

          <div className="card-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3>Ingresos y Pedidos</h3>
                {loading && <Loader2 className="spin" size={14} style={{ color: "var(--primary-color)" }} />}
              </div>
              <p className="chart-subtitle">{periodLabel}</p>
            </div>
            
            {/* Quick Filter Presets */}
            <div className="dashboard-chart-actions">
              <div className="preset-selector">
                <button 
                  className={`preset-btn ${selectedPreset === "week" ? "active" : ""}`}
                  onClick={setWeekPreset}
                >
                  7 días
                </button>
                <button 
                  className={`preset-btn ${selectedPreset === "15" ? "active" : ""}`}
                  onClick={() => setRangePreset(15, "15")}
                >
                  15 días
                </button>
                <button 
                  className={`preset-btn ${selectedPreset === "30" ? "active" : ""}`}
                  onClick={() => setRangePreset(30, "30")}
                >
                  30 días
                </button>
              </div>

              <div className="chart-totals">
                <span className="chart-total-pill chart-total-pill--green">
                  S/ {kpis.ingresos.toLocaleString()}
                </span>
                <span className="chart-total-pill chart-total-pill--teal">
                  {kpis.pedidos} pedidos
                </span>
              </div>
            </div>
          </div>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.00} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.30)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  yAxisId="ingresos"
                  orientation="left"
                  stroke="rgba(255,255,255,0.20)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => `S/${Math.round(v / 1000)}k`}
                />

                <YAxis
                  yAxisId="pedidos"
                  orientation="right"
                  stroke="rgba(255,255,255,0.20)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  formatter={(v) => v === "ingresos" ? "Ingresos (S/)" : "Pedidos"}
                />

                <Area
                  yAxisId="ingresos"
                  type="monotone"
                  dataKey="ingresos"
                  fill="url(#areaGradient)"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  name="ingresos"
                />

                <Line
                  yAxisId="pedidos"
                  dataKey="pedidos"
                  type="monotone"
                  stroke="#f0abfc"
                  strokeWidth={2.5}
                  dot={{ fill: "#f0abfc", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Panel derecho (con selectores de Pestaña) ── */}
        <div className="dashboard-side">
          
          {/* Tab Switcher Headers */}
          <div className="dashboard-side-tabs">
            <button 
              className={`side-tab-btn ${activeTab === "metrics" ? "active" : ""}`}
              onClick={() => setActiveTab("metrics")}
            >
              <TrendingUp size={15} />
              Métricas
            </button>
            <button 
              className={`side-tab-btn ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar size={15} />
              Calendario
            </button>
          </div>

          {activeTab === "calendar" ? (
            /* Calendario inline */
            <div className="dashboard-calendar-card">
              <h3 className="side-card-title">Filtrar Rango de Fechas</h3>
              <InlineCalendar dateRange={dateRange} onChange={setDateRange} />
            </div>
          ) : (
            <>
              {/* Desglose rápido */}
              <div className="dashboard-breakdown">
                <h3 className="side-card-title">Resumen de Producción</h3>

                <div className="breakdown-grid">
                  <div className="breakdown-item">
                    <div className="breakdown-icon breakdown-icon--green">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="breakdown-info">
                      <span>Entregados</span>
                      <strong>{breakdown.completados}</strong>
                    </div>
                  </div>

                  <div className="breakdown-item">
                    <div className="breakdown-icon breakdown-icon--red">
                      <XCircle size={18} />
                    </div>
                    <div className="breakdown-info">
                      <span>Rechazados</span>
                      <strong>{breakdown.cancelados}</strong>
                    </div>
                  </div>

                  <div className="breakdown-item">
                    <div className="breakdown-icon breakdown-icon--teal">
                      <Users size={18} />
                    </div>
                    <div className="breakdown-info">
                      <span>Diseños Aprob.</span>
                      <strong>{breakdown.clientes}</strong>
                    </div>
                  </div>

                  <div className="breakdown-item">
                    <div className="breakdown-icon breakdown-icon--purple">
                      <Package size={18} />
                    </div>
                    <div className="breakdown-info">
                      <span>Órdenes Impresas</span>
                      <strong>{breakdown.productos}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos populares / más vendidos */}
              <div className="dashboard-popular-products">
                <h3 className="side-card-title">Productos Más Demandados</h3>
                
                <div className="popular-products-list">
                  <div className="product-progress-item">
                    <div className="product-progress-header">
                      <span>Tarjetas Personales</span>
                      <strong>42%</strong>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill progress-bar-fill--green" style={{ width: "42%" }} />
                    </div>
                  </div>
                  <div className="product-progress-item">
                    <div className="product-progress-header">
                      <span>Volantes Couché 150g</span>
                      <strong>28%</strong>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill progress-bar-fill--teal" style={{ width: "28%" }} />
                    </div>
                  </div>
                  <div className="product-progress-item">
                    <div className="product-progress-header">
                      <span>Banners Publicitarios</span>
                      <strong>18%</strong>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill progress-bar-fill--blue" style={{ width: "18%" }} />
                    </div>
                  </div>
                  <div className="product-progress-item">
                    <div className="product-progress-header">
                      <span>Talonarios de Facturas</span>
                      <strong>12%</strong>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill progress-bar-fill--purple" style={{ width: "12%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>

    </section>
  );
}