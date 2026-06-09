export interface CreateAuditLogDTO {
  userId?: number | null;
  username: string;
  module: string;
  action: string;
  details?: any;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  module: string;
  action: string;
  details: any;
  createdAt: Date;
}
