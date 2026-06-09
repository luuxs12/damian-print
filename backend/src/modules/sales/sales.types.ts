export interface SaleItemDTO {
  description: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice?: number;
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
  status?:         string; // PENDIENTE | PAGADA | ANULADA
  paymentMethod?:  string; // EFECTIVO | TRANSFERENCIA | YAPE | PLIN | TARJETA
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
  billingType?:    string;
  billingNumber?:  string;
}
