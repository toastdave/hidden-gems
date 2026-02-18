import { db, schema } from "@hidden-gems/db";
import { checkout, polar, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { updateEntitlementFromPolar } from "./services/billing-service";

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-only-secret-change-me";
const betterAuthBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:4321";

const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
const polarWebhookSecret = process.env.POLAR_WEBHOOK_SECRET;
const polarProProductId = process.env.POLAR_PRO_PRODUCT_ID;
const polarViewerPlusProductId = process.env.POLAR_VIEWER_PLUS_PRODUCT_ID;
const polarCreatorProProductId = process.env.POLAR_CREATOR_PRO_PRODUCT_ID;
const polarServer = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

type PolarPlanSlug = "pro" | "viewer-plus" | "creator-pro";

const checkoutProducts = [
  polarViewerPlusProductId
    ? {
        productId: polarViewerPlusProductId,
        slug: "viewer-plus" as const,
      }
    : null,
  polarCreatorProProductId
    ? {
        productId: polarCreatorProProductId,
        slug: "creator-pro" as const,
      }
    : null,
  polarProProductId
    ? {
        productId: polarProProductId,
        slug: "pro" as const,
      }
    : null,
].filter((entry): entry is { productId: string; slug: PolarPlanSlug } => entry !== null);

function resolvePlanSlugFromPayload(payload: any): PolarPlanSlug {
  const productId =
    payload?.data?.product?.id ??
    payload?.data?.productId ??
    payload?.data?.subscription?.productId ??
    payload?.data?.subscription?.product?.id;

  if (productId && polarViewerPlusProductId && productId === polarViewerPlusProductId) {
    return "viewer-plus";
  }
  if (productId && polarCreatorProProductId && productId === polarCreatorProProductId) {
    return "creator-pro";
  }

  return "pro";
}

function getPolarMode() {
  if (!polarAccessToken) return "disabled" as const;
  if (!polarWebhookSecret) return "disabled-missing-webhook-secret" as const;
  if (checkoutProducts.length === 0) return "webhooks-only" as const;
  return "full-checkout" as const;
}

const polarMode = getPolarMode();
console.info(`[auth] polar mode=${polarMode} server=${polarServer}`);

function buildPolarPlugin() {
  if (!polarAccessToken) {
    return [];
  }

  if (!polarWebhookSecret) {
    console.warn(
      "POLAR_ACCESS_TOKEN is set but POLAR_WEBHOOK_SECRET is missing. Polar plugin is disabled until webhook secret is provided.",
    );
    return [];
  }

  const polarClient = new Polar({
    accessToken: polarAccessToken,
    server: polarServer,
  });

  if (checkoutProducts.length === 0) {
    console.warn(
      "No Polar product IDs configured for checkout. Checkout is disabled; webhook and portal framework remain enabled.",
    );
  }

  return [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        portal(),
        usage(),
        webhooks({
          secret: polarWebhookSecret,
          onOrderPaid: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(
                userId,
                resolvePlanSlugFromPayload(payload),
                true,
                payload.data?.id,
              );
            }
          },
          onSubscriptionActive: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(
                userId,
                resolvePlanSlugFromPayload(payload),
                true,
                payload.data?.id,
              );
            }
          },
          onSubscriptionCanceled: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(
                userId,
                resolvePlanSlugFromPayload(payload),
                false,
                payload.data?.id,
              );
            }
          },
          onSubscriptionRevoked: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(
                userId,
                resolvePlanSlugFromPayload(payload),
                false,
                payload.data?.id,
              );
            }
          },
        }),
        ...(checkoutProducts.length > 0
          ? [
              checkout({
                products: checkoutProducts,
                successUrl: `${clientOrigin}/billing?checkout_id={CHECKOUT_ID}`,
                authenticatedUsersOnly: true,
              }),
            ]
          : []),
      ] as any,
    }),
  ];
}

export const auth = betterAuth({
  secret: betterAuthSecret,
  baseURL: betterAuthBaseUrl,
  trustedOrigins: [clientOrigin, betterAuthBaseUrl],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  plugins: buildPolarPlugin(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
    usePlural: false,
  }),
});
