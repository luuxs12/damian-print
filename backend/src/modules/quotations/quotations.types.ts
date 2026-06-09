export interface QuotationItemDTO {
  description: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice?: number;
}

export interface CreateQuotationDTO {
  clientId?:      number | null;
  clientName:     string;
  clientDocument: string;
  clientPhone?:   string;
  clientEmail?:   string;
  clientAddress?: string;
  items:          QuotationItemDTO[];
  discount?:      number;
  tax?:           number;
  validUntil:     string; // ISO date string
  notes?:         string;
}

export interface UpdateQuotationDTO {
  clientName?:     string;
  clientDocument?: string;
  clientPhone?:    string;
  clientEmail?:    string;
  clientAddress?:  string;
  items?:          QuotationItemDTO[];
  discount?:       number;
  tax?:            number;
  status?:         string;
  validUntil?:     string;
  notes?:          string;
}
