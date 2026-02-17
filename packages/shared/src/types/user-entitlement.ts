export interface UserEntitlement {
  id: string;
  userId: string;
  planId: string;
  startsAt: Date;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
