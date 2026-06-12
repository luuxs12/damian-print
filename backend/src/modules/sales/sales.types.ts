export interface SaleItemDTO {
  description: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice?: number;
  promisedDate?: string;
}

export interface CreateSaleDTO {
  quotationId?:    number | null;
  clientId?:       number | null;
  clientName:      string;
  clientDocument:  string;
  clientPhone?:    string;
  clientEmail?:    string;
  clientAddress?:  string;
  items:           SaleItemDTO[];
  discount?:       number;
  tax?:            number;
  status?:         string; // PENDIENTE | A_CUENTA | PAGADA | ANULADA
  paymentMethod?:  string; // EFECTIVO | TRANSFERENCIA | YAPE | PLIN | TARJETA | MULTIPLE
  paymentDetails?: string;
  advancePayment?: number;
  billingType?:    string; // NOTA_DE_VENTA | BOLETA | FACTURA
  billingNumber?:  string;
}

export interface UpdateSaleDTO {
  clientId?:       number | null;
  clientName?:     string;
  clientDocument?: string;
  clientPhone?:    string;
  clientEmail?:    string;
  clientAddress?:  string;
  items?:          SaleItemDTO[];
  discount?:       number;
  tax?:            number;
  status?:         string;
  paymentMethod?:  string;
  paymentDetails?: string;
  advancePayment?: number;
  billingType?:    string;
  billingNumber?:  string;
}
