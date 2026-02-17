import { db, schema } from "@hidden-gems/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-only-secret-change-me";
const betterAuthBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:4321";

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
