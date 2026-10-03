import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { track } from "@/services/analytics";
import { resetPasswordEmail, sendEmail } from "@/services/email";
import { PASSWORD_MIN } from "@/validation/auth";

export const auth = betterAuth({
  appName: "Presupuéstalo",
  baseURL: env.appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.appUrl],
  database: prismaAdapter(db, { provider: "postgresql" }),
  telemetry: { enabled: false },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...resetPasswordEmail(user.name, url) });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días
    updateAge: 60 * 60 * 24, // renueva una vez al día
  },
  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT !== "off",
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: env.appUrl.startsWith("https://"),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.subscription.create({ data: { userId: user.id } });
          await track("signup", user.id);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await track("login", session.userId);
        },
      },
    },
  },
  plugins: [nextCookies()], // debe ir el último
});

export type AuthSession = typeof auth.$Infer.Session;
