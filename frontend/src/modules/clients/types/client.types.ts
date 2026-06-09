export type ClientType   = "EMPRESA" | "PARTICULAR";
export type DocumentType = "DNI" | "RUC" | "CE" | "PASAPORTE";
export type ClientStatus = "ACTIVE" | "INACTIVE";

export interface Client {
  id:           number;
  type:         ClientType;
  name:         string;
  documentType: DocumentType;
  document:     string;
  phone:        string | null;
  email:        string | null;
  address:      string | null;
  city:         string | null;
  contactName:  string | null;
  notes:        string | null;
  status:       ClientStatus;
  createdAt:    string;
  updatedAt:    string;
}

export interface ClientStats {
  total:      number;
  active:     number;
  empresa:    number;
  particular: number;
}
