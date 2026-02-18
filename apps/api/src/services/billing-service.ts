import { db, schema } from "@hidden-gems/db";
import type { Plan } from "@hidden-gems/shared";
import { and, desc, eq } from "drizzle-orm";
import { listHasPremiumAccess } from "../utils/auth";
import { computeWebhookSignature } from "../utils/billing";

type AppPlan = Plan & { features: Record<string, unknown> };

const DEFAULT_FREE_PLAN = "plan-free";

/**
 * Called from Polar webhook handlers to update local entitlement tables.
 * Bridges the Polar event system with our internal plans/entitlements.
 */
export async function updateEntitlementFromPolar(
  userId: string,
  planSlug: string,
  active: boolean,
  externalEventId?: string,
) {
  if (externalEventId) {
    const [existing] = await db
      .select()
      .from(schema.billingEvents)
      .where(eq(schema.billingEvents.externalId, externalEventId))
      .limit(1);
    if (existing) return;
  }

  const [plan] = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.slug, planSlug))
    .limit(1);
  const selectedPlan =
    plan ??
    (
      await db.select().from(schema.plans).where(eq(schema.plans.slug, DEFAULT_FREE_PLAN)).limit(1)
    )[0];

  if (!selectedPlan) return;

  await db.transaction(async (tx) => {
    if (externalEventId) {
      await tx.insert(schema.billingEvents).values({
        userId,
        eventType: active ? "subscription_created" : "subscription_cancelled",
        amountCents: selectedPlan.priceMonthly,
        currency: "usd",
        externalId: externalEventId,
        metadata: { source: "polar", planSlug, active },
      });
    }

    if (active) {
      await tx
        .insert(schema.userEntitlements)
        .values({
          userId,
          planId: selectedPlan.id,
          startsAt: new Date(),
          active: true,
        })
        .onConflictDoNothing();
    } else {
      await tx
        .update(schema.userEntitlements)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(schema.userEntitlements.userId, userId));
    }
  });
}

export async function listPlans() {
  const plans = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.active, true))
    .orderBy(schema.plans.priceMonthly);
  const typedPlans: AppPlan[] = plans.map((plan) => ({
    ...(plan as Plan),
    features: {
      maxListings: plan.maxListings,
      unlimitedDiscovery: plan.slug !== "free",
      boostedDiscovery: plan.slug === "pro",
    },
  }));
  return { plans: typedPlans };
}

export async function createCheckout(userId: string, planSlug: string, clientOrigin: string) {
  const [plan] = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.slug, planSlug))
    .limit(1);
  if (!plan || !plan.active) {
    return { error: "Invalid plan.", status: 404 as const };
  }
  const checkoutUrl = `${clientOrigin}/billing/complete?plan=${encodeURIComponent(plan.slug)}&user=${encodeURIComponent(userId)}`;
  return { checkoutUrl };
}

export async function processWebhook(signature: string, payloadText: string, secret: string) {
  if (secret) {
    const expected = computeWebhookSignature(payloadText, secret);
    if (signature !== expected) {
      return { error: "Invalid webhook signature.", status: 401 as const };
    }
  }

  const payload = JSON.parse(payloadText) as {
    id?: string;
    type?: string;
    userId?: string;
    planSlug?: string;
    amountCents?: number;
    currency?: string;
    active?: boolean;
  };
  if (!payload.id || !payload.type || !payload.userId) {
    return { error: "Malformed webhook payload.", status: 400 as const };
  }
  const webhookUserId = payload.userId;
  const existingEvent = await db
    .select()
    .from(schema.billingEvents)
    .where(eq(schema.billingEvents.externalId, payload.id))
    .limit(1);
  if (existingEvent.length > 0) {
    return { received: true, duplicate: true };
  }
  const [plan] = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.slug, payload.planSlug ?? DEFAULT_FREE_PLAN))
    .limit(1);
  const selectedPlan =
    plan ??
    (
      await db.select().from(schema.plans).where(eq(schema.plans.slug, DEFAULT_FREE_PLAN)).limit(1)
    )[0];

  await db.transaction(async (tx) => {
    await tx.insert(schema.billingEvents).values({
      userId: webhookUserId,
      eventType:
        payload.type === "subscription_cancelled"
          ? "subscription_cancelled"
          : "subscription_created",
      amountCents: payload.amountCents ?? selectedPlan.priceMonthly,
      currency: payload.currency ?? "usd",
      externalId: payload.id,
      metadata: payload,
    });
    if (payload.active === false) {
      await tx
        .update(schema.userEntitlements)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(schema.userEntitlements.userId, webhookUserId));
    } else {
      await tx
        .insert(schema.userEntitlements)
        .values({
          userId: webhookUserId,
          planId: selectedPlan.id,
          startsAt: new Date(),
          active: true,
        })
        .onConflictDoNothing();
    }
  });

  return { received: true };
}

export async function getBillingStatus(userId: string) {
  const entitlementRows = await db
    .select({
      entitlement: schema.userEntitlements,
      plan: schema.plans,
    })
    .from(schema.userEntitlements)
    .innerJoin(schema.plans, eq(schema.plans.id, schema.userEntitlements.planId))
    .where(
      and(eq(schema.userEntitlements.userId, userId), eq(schema.userEntitlements.active, true)),
    )
    .orderBy(desc(schema.userEntitlements.startsAt))
    .limit(1);
  const active = entitlementRows[0];
  return {
    plan: active?.plan ?? null,
    premium: listHasPremiumAccess(active?.plan.slug),
  };
}

export async function checkPremiumFeature(userId: string) {
  const active = await db
    .select({
      planSlug: schema.plans.slug,
    })
    .from(schema.userEntitlements)
    .innerJoin(schema.plans, eq(schema.plans.id, schema.userEntitlements.planId))
    .where(
      and(eq(schema.userEntitlements.userId, userId), eq(schema.userEntitlements.active, true)),
    )
    .orderBy(desc(schema.userEntitlements.startsAt))
    .limit(1);
  const planSlug = active[0]?.planSlug ?? "free";
  const allowed = listHasPremiumAccess(planSlug);
  return { allowed, planSlug };
}
