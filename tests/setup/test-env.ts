export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://app:app@localhost:5432/presupuestalo_test";

export const TEST_ENV: Record<string, string> = {
  DATABASE_URL: TEST_DATABASE_URL,
  BETTER_AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_test_dummy",
  STRIPE_PRICE_PRO_MONTHLY: "price_pro_test",
  AI_PROVIDER: "",
  AUTH_RATE_LIMIT: "off",
};
