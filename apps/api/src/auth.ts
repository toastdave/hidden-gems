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
const polarServer = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

function getPolarMode() {
  if (!polarAccessToken) return "disabled" as const;
  if (!polarWebhookSecret) return "disabled-missing-webhook-secret" as const;
  if (!polarProProductId) return "webhooks-only" as const;
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

  if (!polarProProductId) {
    console.warn(
      "POLAR_PRO_PRODUCT_ID is not set. Polar checkout is disabled; webhook and portal framework remain enabled.",
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
              await updateEntitlementFromPolar(userId, "pro", true, payload.data?.id);
            }
          },
          onSubscriptionActive: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(userId, "pro", true, payload.data?.id);
            }
          },
          onSubscriptionCanceled: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(userId, "pro", false, payload.data?.id);
            }
          },
          onSubscriptionRevoked: async (payload) => {
            const userId = payload.data?.customer?.externalId;
            if (userId) {
              await updateEntitlementFromPolar(userId, "pro", false, payload.data?.id);
            }
          },
        }),
        ...(polarProProductId
          ? [
              checkout({
                products: [
                  {
                    productId: polarProProductId,
                    slug: "pro",
                  },
                ],
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
