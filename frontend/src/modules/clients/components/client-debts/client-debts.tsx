import { useState, useMemo } from "react";
import {
  X,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Coins,
  Users as UsersIcon,
  AlertTriangle,
  Calendar,
  Check,
  CreditCard,
  Printer,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import "./client-debts.scss";

interface Installment {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  status: "PENDIENTE" | "PAGADO" | "VENCIDO";
}

interface Invoice {
  code: string;
  date: string;
  originalAmount: number;
  totalWithInterest: number;
  installments: Installment[];
}

interface ClientDebt {
  id: number;
  name: string;
  document: string;
  totalDebt: number;
  pendingInstallmentsCount: number;
  nextDueDate: string;
  status: "PENDIENTE" | "VENCIDO" | "AL_DIA";
  invoices: Invoice[];
}

const INITIAL_DEBTS: ClientDebt[] = [
  {
    id: 1,
    name: "Cristiano Ronaldo",
    document: "41043114",
    totalDebt: 105.08,
    pendingInstallmentsCount: 3,
    nextDueDate: "24/11/2025",
    status: "PENDIENTE",
    invoices: [
      {
        code: "F001-0000085",
        date: "24/10/2025",
        originalAmount: 500.0,
        totalWithInterest: 500.0,
        installments: [
          { id: "c1-1", label: "Cuota 1 de 3", dueDate: "24/11/2025", amount: 35.02, status: "PENDIENTE" },
          { id: "c1-2", label: "Cuota 2 de 3", dueDate: "24/12/2025", amount: 35.03, status: "PENDIENTE" },
          { id: "c1-3", label: "Cuota 3 de 3", dueDate: "24/01/2026", amount: 35.03, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Maria Paredes",
    document: "41254125",
    totalDebt: 48.4,
    pendingInstallmentsCount: 2,
    nextDueDate: "28/11/2025",
    status: "PENDIENTE",
    invoices: [
      {
        code: "B001-0000102",
        date: "28/10/2025",
        originalAmount: 150.0,
        totalWithInterest: 150.0,
        installments: [
          { id: "c2-1", label: "Cuota 1 de 2", dueDate: "28/11/2025", amount: 24.2, status: "PENDIENTE" },
          { id: "c2-2", label: "Cuota 2 de 2", dueDate: "28/12/2025", amount: 24.2, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Comercial San José SAC",
    document: "20123456789",
    totalDebt: 350.0,
    pendingInstallmentsCount: 4,
    nextDueDate: "05/12/2025",
    status: "PENDIENTE",
    invoices: [
      {
        code: "F001-0000078",
        date: "05/11/2025",
        originalAmount: 1420.5,
        totalWithInterest: 1420.5,
        installments: [
          { id: "c3-1", label: "Cuota 1 de 4", dueDate: "05/12/2025", amount: 87.5, status: "PENDIENTE" },
          { id: "c3-2", label: "Cuota 2 de 4", dueDate: "05/01/2026", amount: 87.5, status: "PENDIENTE" },
          { id: "c3-3", label: "Cuota 3 de 4", dueDate: "05/02/2026", amount: 87.5, status: "PENDIENTE" },
          { id: "c3-4", label: "Cuota 4 de 4", dueDate: "05/03/2026", amount: 87.5, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Market Norte SAC",
    document: "20555111222",
    totalDebt: 420.3,
    pendingInstallmentsCount: 3,
    nextDueDate: "18/12/2025",
    status: "PENDIENTE",
    invoices: [
      {
        code: "F001-0000091",
        date: "18/10/2025",
        originalAmount: 840.6,
        totalWithInterest: 840.6,
        installments: [
          { id: "c4-1", label: "Cuota 1 de 3", dueDate: "18/12/2025", amount: 140.1, status: "PENDIENTE" },
          { id: "c4-2", label: "Cuota 2 de 3", dueDate: "18/01/2026", amount: 140.1, status: "PENDIENTE" },
          { id: "c4-3", label: "Cuota 3 de 3", dueDate: "18/02/2026", amount: 140.1, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Corporación Andes SRL",
    document: "20611223344",
    totalDebt: 615.9,
    pendingInstallmentsCount: 4,
    nextDueDate: "20/12/2025",
    status: "PENDIENTE",
    invoices: [
      {
        code: "F001-0000062",
        date: "20/09/2025",
        originalAmount: 1231.8,
        totalWithInterest: 1231.8,
        installments: [
          { id: "c5-1", label: "Cuota 1 de 4", dueDate: "20/12/2025", amount: 153.97, status: "PENDIENTE" },
          { id: "c5-2", label: "Cuota 2 de 4", dueDate: "20/01/2026", amount: 153.97, status: "PENDIENTE" },
          { id: "c5-3", label: "Cuota 3 de 4", dueDate: "20/02/2026", amount: 153.98, status: "PENDIENTE" },
          { id: "c5-4", label: "Cuota 4 de 4", dueDate: "20/03/2026", amount: 153.98, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Inversiones Los Olivos SAC",
    document: "20633445566",
    totalDebt: 890.0,
    pendingInstallmentsCount: 6,
    nextDueDate: "28/12/2025",
    status: "PENDIENTE",
    invoices: [
      {
        code: "F001-0000054",
        date: "28/08/2025",
        originalAmount: 1800.0,
        totalWithInterest: 1800.0,
        installments: [
          { id: "c6-1", label: "Cuota 1 de 6", dueDate: "28/12/2025", amount: 148.33, status: "PENDIENTE" },
          { id: "c6-2", label: "Cuota 2 de 6", dueDate: "28/01/2026", amount: 148.33, status: "PENDIENTE" },
          { id: "c6-3", label: "Cuota 3 de 6", dueDate: "28/02/2026", amount: 148.33, status: "PENDIENTE" },
          { id: "c6-4", label: "Cuota 4 de 6", dueDate: "28/03/2026", amount: 148.33, status: "PENDIENTE" },
          { id: "c6-5", label: "Cuota 5 de 6", dueDate: "28/04/2026", amount: 148.34, status: "PENDIENTE" },
          { id: "c6-6", label: "Cuota 6 de 6", dueDate: "28/05/2026", amount: 148.34, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 7,
    name: "Servicios Generales Pacífico SAC",
    document: "20199887766",
    totalDebt: 198.75,
    pendingInstallmentsCount: 2,
    nextDueDate: "03/01/2026",
    status: "PENDIENTE",
    invoices: [
      {
        code: "F001-0000099",
        date: "03/11/2025",
        originalAmount: 397.5,
        totalWithInterest: 397.5,
        installments: [
          { id: "c7-1", label: "Cuota 1 de 2", dueDate: "03/01/2026", amount: 99.37, status: "PENDIENTE" },
          { id: "c7-2", label: "Cuota 2 de 2", dueDate: "03/02/2026", amount: 99.38, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 8,
    name: "Juan Pérez",
    document: "10234567",
    totalDebt: 150.0,
    pendingInstallmentsCount: 1,
    nextDueDate: "15/11/2025",
    status: "VENCIDO",
    invoices: [
      {
        code: "B001-0000067",
        date: "15/10/2025",
        originalAmount: 150.0,
        totalWithInterest: 150.0,
        installments: [
          { id: "c8-1", label: "Cuota 1 de 1", dueDate: "15/11/2025", amount: 150.0, status: "VENCIDO" },
        ],
      },
    ],
  },
  {
    id: 9,
    name: "Inversiones Beta EIRL",
    document: "20987654321",
    totalDebt: 712.3,
    pendingInstallmentsCount: 3,
    nextDueDate: "10/11/2025",
    status: "VENCIDO",
    invoices: [
      {
        code: "F001-0000045",
        date: "10/08/2025",
        originalAmount: 1000.0,
        totalWithInterest: 1000.0,
        installments: [
          { id: "c9-1", label: "Cuota 1 de 3", dueDate: "10/11/2025", amount: 237.43, status: "VENCIDO" },
          { id: "c9-2", label: "Cuota 2 de 3", dueDate: "10/12/2025", amount: 237.43, status: "PENDIENTE" },
          { id: "c9-3", label: "Cuota 3 de 3", dueDate: "10/01/2026", amount: 237.44, status: "PENDIENTE" },
        ],
      },
    ],
  },
  {
    id: 10,
    name: "Distribuidora Lima",
    document: "20765432109",
    totalDebt: 351.0,
    pendingInstallmentsCount: 2,
    nextDueDate: "12/11/2025",
    status: "VENCIDO",
    invoices: [
      {
        code: "F001-0000051",
        date: "12/09/2025",
        originalAmount: 702.0,
        totalWithInterest: 702.0,
        installments: [
          { id: "c10-1", label: "Cuota 1 de 2", dueDate: "12/11/2025", amount: 175.5, status: "VENCIDO" },
          { id: "c10-2", label: "Cuota 2 de 2", dueDate: "12/12/2025", amount: 175.5, status: "PENDIENTE" },
        ],
      },
    ],
  },
];

interface Props {
  onClose: () => void;
}

export const ClientDebts = ({ onClose }: Props) => {
  const [debts, setDebts] = useState<ClientDebt[]>(INITIAL_DEBTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | "PENDIENTES" | "VENCIDAS">("TODAS");

  // Selection states for sub-modals
  const [selectedClient, setSelectedClient] = useState<ClientDebt | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  // Form states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Receipt Preview
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    id: string;
    clientName: string;
    clientDoc: string;
    invoiceCode: string;
    installmentLabel: string;
    amountPaid: number;
    paymentMethod: string;
    date: string;
  } | null>(null);

  // Calculations
  const stats = useMemo(() => {
    let totalDebtAmount = 0;
    let clientsWithDebtCount = 0;
    let overdueInstallmentsCount = 0;

    debts.forEach((c) => {
      if (c.totalDebt > 0) {
        totalDebtAmount += c.totalDebt;
        clientsWithDebtCount++;
      }
      c.invoices.forEach((inv) => {
        inv.installments.forEach((inst) => {
          if (inst.status === "VENCIDO") {
            overdueInstallmentsCount++;
          }
        });
      });
    });

    return {
      totalDebt: totalDebtAmount,
      clientsWithDebt: clientsWithDebtCount,
      overdueInstallments: overdueInstallmentsCount,
    };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) || d.document.includes(search);

      const hasOverdue = d.invoices.some((inv) =>
        inv.installments.some((inst) => inst.status === "VENCIDO")
      );

      if (statusFilter === "VENCIDAS") return matchSearch && hasOverdue && d.totalDebt > 0;
      if (statusFilter === "PENDIENTES") return matchSearch && d.totalDebt > 0 && !hasOverdue;

      return matchSearch && d.totalDebt > 0;
    });
  }, [debts, search, statusFilter]);

  const handleOpenClientDebts = (client: ClientDebt) => {
    setSelectedClient(client);
    // Auto select first invoice
    if (client.invoices.length > 0) {
      setSelectedInvoice(client.invoices[0]);
    }
  };

  const handleOpenPayModal = (inst: Installment) => {
    setSelectedInstallment(inst);
    setPaymentAmount(String(inst.amount));
    setPaymentRemarks("");
    setPaymentMethod("Efectivo");
  };

  const handleConfirmPayment = () => {
    if (!selectedClient || !selectedInvoice || !selectedInstallment) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > selectedInstallment.amount) {
      toast.error("Por favor ingrese un monto válido de pago.");
      return;
    }

    // Update in-memory database
    const updatedDebts = debts.map((c) => {
      if (c.id !== selectedClient.id) return c;

      const updatedInvoices = c.invoices.map((inv) => {
        if (inv.code !== selectedInvoice.code) return inv;

        const updatedInstallments = inv.installments.map((inst) => {
          if (inst.id !== selectedInstallment.id) return inst;

          // If fully paid
          if (amountNum === inst.amount) {
            return { ...inst, status: "PAGADO" as const };
          } else {
            // Partial payment
            return { ...inst, amount: inst.amount - amountNum };
          }
        });

        return { ...inv, installments: updatedInstallments };
      });

      // Recalculate total debt
      let clientTotalDebt = 0;
      let pendingCount = 0;
      let hasOverdue = false;

      updatedInvoices.forEach((inv) => {
        inv.installments.forEach((inst) => {
          if (inst.status !== "PAGADO") {
            clientTotalDebt += inst.amount;
            pendingCount++;
            if (inst.status === "VENCIDO") hasOverdue = true;
          }
        });
      });

      return {
        ...c,
        totalDebt: parseFloat(clientTotalDebt.toFixed(2)),
        pendingInstallmentsCount: pendingCount,
        status: clientTotalDebt === 0 ? ("AL_DIA" as const) : hasOverdue ? ("VENCIDO" as const) : ("PENDIENTE" as const),
        invoices: updatedInvoices,
      };
    });

    setDebts(updatedDebts);

    // Setup receipt data
    const now = new Date();
    const receiptCode = `PAGO-${selectedInvoice.code}-${Math.floor(Math.random() * 1000000)}`;
    setReceiptData({
      id: receiptCode,
      clientName: selectedClient.name,
      clientDoc: selectedClient.document,
      invoiceCode: selectedInvoice.code,
      installmentLabel: selectedInstallment.label,
      amountPaid: amountNum,
      paymentMethod,
      date: `${now.toLocaleDateString("es-PE")} ${now.toLocaleTimeString("es-PE")}`,
    });

    toast.success("Pago registrado con éxito!");
    // Close payment modal
    setSelectedInstallment(null);
    setShowReceipt(true);
  };

  return (
    <div className="client-debts-overlay">
      <div className="client-debts-modal">
        {/* Header */}
        <div className="client-debts-modal__header">
          <div className="title-wrapper">
            <Coins className="header-icon" size={24} />
            <h2>Cuentas por Cobrar - Gestión de Deudas</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="client-debts-stats">
          <div className="stat-card stat-card--pink">
            <div className="stat-card__icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-card__info">
              <span>Total Deuda</span>
              <h3>S/ {stats.totalDebt.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="stat-card stat-card--yellow">
            <div className="stat-card__icon">
              <UsersIcon size={24} />
            </div>
            <div className="stat-card__info">
              <span>Clientes con Deuda</span>
              <h3>{stats.clientsWithDebt}</h3>
            </div>
          </div>

          <div className="stat-card stat-card--blue">
            <div className="stat-card__icon">
              <Calendar size={24} />
            </div>
            <div className="stat-card__info">
              <span>Cuotas Vencidas</span>
              <h3>{stats.overdueInstallments}</h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="client-debts-filters">
          <div className="search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-select-wrapper">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "TODAS" | "PENDIENTES" | "VENCIDAS")}
            >
              <option value="TODAS">Todos los estados</option>
              <option value="PENDIENTES">Al día / Pendientes</option>
              <option value="VENCIDAS">Vencidas</option>
            </select>
          </div>

          <button className="refresh-btn" onClick={() => { setSearch(""); setStatusFilter("TODAS"); }}>
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Table */}
        <div className="client-debts-table-wrapper">
          <table className="client-debts-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Total Deuda</th>
                <th>Cuotas Pendientes</th>
                <th>Próximo Vencimiento</th>
                <th>Estado</th>
                <th style={{ width: "130px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No se encontraron clientes con deudas pendientes.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((d) => {
                  const isOverdue = d.invoices.some((inv) =>
                    inv.installments.some((inst) => inst.status === "VENCIDO")
                  );
                  return (
                    <tr key={d.id}>
                      <td className="client-name-cell">{d.name}</td>
                      <td>{d.document}</td>
                      <td className="debt-amount">S/ {d.totalDebt.toFixed(2)}</td>
                      <td>
                        <span className="installments-pill">
                          {d.pendingInstallmentsCount} cuotas
                        </span>
                      </td>
                      <td>{d.nextDueDate}</td>
                      <td>
                        <span
                          className={`status-badge status-badge--${
                            isOverdue ? "vencido" : "pendiente"
                          }`}
                        >
                          {isOverdue ? "Vencido" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="view-debts-btn"
                          onClick={() => handleOpenClientDebts(d)}
                        >
                          <Eye size={14} />
                          <span>Ver Deudas</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="client-debts-modal__footer">
          <button className="close-action-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {/* ── Level 2: Client Debt Details Modal ── */}
      {selectedClient && (
        <div className="client-debts-overlay client-debts-overlay--lvl2">
          <div className="client-debts-modal client-debts-modal--detail">
            <div className="client-debts-modal__header">
              <div className="title-wrapper">
                <FileText className="header-icon" size={20} />
                <h2>Deudas de {selectedClient.name}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedClient(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="client-detail-header-panel">
              <p><strong>Cliente:</strong> {selectedClient.name} ({selectedClient.document})</p>
              <p><strong>Total Deuda:</strong> <span className="debt-amount">S/ {selectedClient.totalDebt.toFixed(2)}</span></p>
            </div>

            {selectedInvoice && (
              <div className="invoice-selector-box">
                <div className="invoice-info-header">
                  <div>
                    <h4>Comprobante: {selectedInvoice.code}</h4>
                    <span className="invoice-date">Fecha: {selectedInvoice.date}</span>
                  </div>
                  <div className="invoice-right-info">
                    <span className="total-val">S/ {selectedInvoice.originalAmount.toFixed(2)}</span>
                    <span className="pending-pill">{selectedInvoice.installments.filter(i => i.status !== "PAGADO").length} cuotas pendientes</span>
                  </div>
                </div>

                <div className="invoice-additional-details">
                  <p>Monto Original: S/ {selectedInvoice.originalAmount.toFixed(2)}</p>
                  <p>Total con Interés: S/ {selectedInvoice.totalWithInterest.toFixed(2)}</p>
                </div>

                <div className="installments-section-title">Cuotas Pendientes:</div>
                <div className="installments-table-wrapper">
                  <table className="installments-table">
                    <thead>
                      <tr>
                        <th>Cuota</th>
                        <th>Vencimiento</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th style={{ width: "100px" }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.installments
                        .filter((inst) => inst.status !== "PAGADO")
                        .map((inst) => (
                          <tr key={inst.id}>
                            <td>{inst.label}</td>
                            <td>{inst.dueDate}</td>
                            <td className="installment-amount">S/ {inst.amount.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge status-badge--${inst.status.toLowerCase()}`}>
                                {inst.status === "VENCIDO" ? "Vencido" : "Pendiente"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="pay-installment-btn"
                                onClick={() => handleOpenPayModal(inst)}
                              >
                                <CreditCard size={14} />
                                <span>Pagar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      {selectedInvoice.installments.filter((inst) => inst.status !== "PAGADO").length === 0 && (
                        <tr>
                          <td colSpan={5} className="empty-row">No hay cuotas pendientes para esta factura.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="client-debts-modal__footer">
              <button className="close-action-btn" onClick={() => setSelectedClient(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Level 3: Pay Installment Form Modal ── */}
      {selectedInstallment && selectedClient && selectedInvoice && (
        <div className="client-debts-overlay client-debts-overlay--lvl3">
          <div className="client-debts-modal client-debts-modal--pay-form">
            <div className="client-debts-modal__header">
              <div className="title-wrapper">
                <CreditCard className="header-icon" size={20} />
                <h2>Registrar Pago de Cuota</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedInstallment(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="payment-info-box">
              <div className="info-row">
                <span><strong>Cliente:</strong> {selectedClient.name}</span>
                <span><strong>Monto Cuota:</strong> S/ {selectedInstallment.amount.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <span><strong>Comprobante:</strong> {selectedInvoice.code}</span>
                <span><strong>Fecha Vencimiento:</strong> {selectedInstallment.dueDate}</span>
              </div>
              <div className="info-row">
                <span><strong>Cuota:</strong> {selectedInstallment.label}</span>
                <span><strong>Estado:</strong> <span className={`status-badge status-badge--${selectedInstallment.status.toLowerCase()}`}>{selectedInstallment.status}</span></span>
              </div>
            </div>

            <div className="payment-form-body">
              <div className="form-group">
                <label>Monto a Pagar *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <span className="field-hint">Puede realizar pagos parciales</span>
              </div>

              <div className="form-group">
                <label>Método de Pago *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  rows={3}
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="Detalles del pago..."
                />
              </div>

              <div className="warning-note">
                <AlertTriangle size={16} />
                <span>Nota: El pago se aplicará a la cuota seleccionada. Si el monto es menor al total de la cuota, se registrará como pago parcial.</span>
              </div>
            </div>

            <div className="payment-modal-actions">
              <button
                className="cancel-action-btn"
                onClick={() => setSelectedInstallment(null)}
              >
                Cancelar
              </button>
              <button
                className="confirm-pay-btn"
                onClick={handleConfirmPayment}
              >
                <Check size={16} />
                <span>Confirmar Pago</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Level 4: Receipt Preview Modal ── */}
      {showReceipt && receiptData && (
        <div className="client-debts-overlay client-debts-overlay--lvl4">
          <div className="client-debts-modal client-debts-modal--receipt">
            <div className="client-debts-modal__header">
              <div className="title-wrapper">
                <Printer className="header-icon" size={20} />
                <h2>Comprobante de Pago</h2>
              </div>
              <button className="close-btn" onClick={() => setShowReceipt(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="receipt-subtitle">Visualiza el comprobante antes de imprimirlo o descargarlo.</p>

            <div className="receipt-ticket-wrapper">
              <div className="ticket-body">
                <div className="ticket-center-text">
                  <h3>Vista previa del comprobante</h3>
                  <h2>Comprobante de Pago</h2>
                  <h4>Imprenta Damian Print</h4>
                  <p>RUC: 20762610641</p>
                  <p>Av. Universitaria 1234, Lima</p>
                  <p>Teléfono: +51 987 654 321</p>
                  <p>contacto@damianprint.pe</p>
                </div>

                <div className="ticket-divider" />

                <div className="ticket-meta-info">
                  <p><strong>Comprobante:</strong> {receiptData.id}</p>
                  <p><strong>Fecha:</strong> {receiptData.date}</p>
                  <p><strong>Cliente:</strong> {receiptData.clientName}</p>
                  <p><strong>Documento/NIT:</strong> {receiptData.clientDoc}</p>
                  <p><strong>Deuda:</strong> {receiptData.invoiceCode} | Cuota: {receiptData.installmentLabel}</p>
                </div>

                <div className="ticket-divider" />

                <div className="ticket-meta-info">
                  <p><strong>Cajero:</strong> Admin</p>
                  <p><strong>Método de Pago:</strong> {receiptData.paymentMethod}</p>
                </div>

                <div className="ticket-divider" />

                <div className="ticket-table-header">
                  <span>Concepto</span>
                  <span>Monto</span>
                </div>
                <div className="ticket-table-row">
                  <span>Pago de {receiptData.installmentLabel} ({receiptData.invoiceCode})</span>
                  <span>S/ {receiptData.amountPaid.toFixed(2)}</span>
                </div>

                <div className="ticket-divider" />

                <div className="ticket-total-row">
                  <span>Total Pagado:</span>
                  <span>S/ {receiptData.amountPaid.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="receipt-actions-footer">
              <button className="print-btn print-btn--outline" onClick={() => toast.success("Imprimiendo en formato A4...")}>
                <FileText size={16} />
                <span>A4</span>
              </button>
              <button className="print-btn print-btn--outline" onClick={() => toast.success("Imprimiendo en formato 80mm...")}>
                <Printer size={16} />
                <span>80mm</span>
              </button>
              <button className="print-btn print-btn--solid" onClick={() => toast.success("PDF descargado correctamente.")}>
                <Download size={16} />
                <span>Descarga PDF</span>
              </button>
              <button className="cancel-action-btn" onClick={() => setShowReceipt(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
