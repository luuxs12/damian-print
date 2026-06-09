import React, { useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

import type { ProductionOrder } from "../../services/production-service";
import "./production-calendar.scss";

interface ProductionCalendarProps {
  orders: ProductionOrder[];
  onSelectOrder: (order: ProductionOrder) => void;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--text-secondary)",
  DESIGN: "#3b82f6",
  PRINTING: "#f59e0b",
  FINISHING: "#8b5cf6",
  READY: "#10b981",
  DELIVERED: "#94a3b8"
};

export const ProductionCalendar: React.FC<ProductionCalendarProps> = ({
  orders,
  onSelectOrder
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust so Monday is index 0
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const calendarCells: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

  // Previous month filler days
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i;
    calendarCells.push({
      day,
      isCurrentMonth: false,
      date: new Date(year, month - 1, day)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month filler days (to make a full grid of 6 rows / 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const getOrdersForDate = (date: Date) => {
    return orders.filter((order) => {
      const promised = new Date(order.promisedDate);
      return (
        promised.getDate() === date.getDate() &&
        promised.getMonth() === date.getMonth() &&
        promised.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isOrderDelayed = (order: ProductionOrder) => {
    if (order.status === "READY" || order.status === "DELIVERED") return false;
    return new Date(order.promisedDate) < new Date();
  };

  return (
    <div className="production-calendar-container">
      <div className="calendar-header">
        <h2>{MONTHS[month]} {year}</h2>
        <div className="calendar-nav-buttons">
          <button onClick={handlePrevMonth} className="nav-btn">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="today-btn">
            Hoy
          </button>
          <button onClick={handleNextMonth} className="nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}

        {calendarCells.map((cell, idx) => {
          const dateOrders = getOrdersForDate(cell.date);
          const cellIsToday = isToday(cell.date);

          return (
            <div
              key={idx}
              className={`calendar-cell ${!cell.isCurrentMonth ? "cell-inactive" : ""} ${cellIsToday ? "cell-today" : ""}`}
            >
              <div className="cell-day-num">{cell.day}</div>
              
              <div className="cell-orders-list">
                {dateOrders.map((order) => {
                  const delayed = isOrderDelayed(order);
                  return (
                    <div
                      key={order.id}
                      className={`calendar-order-tag ${delayed ? "tag-delayed" : ""}`}
                      style={{ "--status-color": STATUS_COLORS[order.status] } as React.CSSProperties}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      title={`${order.orderNumber} - ${order.productName} (${order.clientName})`}
                    >
                      <span className="order-dot"></span>
                      <span className="order-lbl">{order.orderNumber} - {order.productName}</span>
                      {delayed && <AlertTriangle size={10} className="tag-warning-icon" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
