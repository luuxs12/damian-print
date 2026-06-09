export type ClientType   = "EMPRESA" | "PARTICULAR";
export type DocumentType = "DNI" | "RUC" | "CE" | "PASAPORTE";
export type ClientStatus = "ACTIVE" | "INACTIVE";

export interface CreateClientDTO {
  type:         ClientType;
  name:         string;
  documentType: DocumentType;
  document:     string;
  phone?:       string;
  email?:       string;
  address?:     string;
  city?:        string;
  contactName?: string;
  notes?:       string;
  status?:      ClientStatus;
}

export interface UpdateClientDTO {
  type?:         ClientType;
  name?:         string;
  documentType?: DocumentType;
  document?:     string;
  phone?:        string;
  email?:        string;
  address?:      string;
  city?:         string;
  contactName?:  string;
  notes?:        string;
  status?:       ClientStatus;
}
