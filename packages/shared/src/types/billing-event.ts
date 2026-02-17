export type BillingEventType =
  | "charge_succeeded"
  | "charge_failed"
  | "subscription_created"
  | "subscription_cancelled"
  | "refund";

export interface BillingEvent {
  id: string;
  userId: string;
  eventType: BillingEventType;
  amountCents: number;
  currency: string;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
