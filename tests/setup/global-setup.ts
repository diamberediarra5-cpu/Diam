import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-env";

/** Aplica las migraciones a la BD de test una vez antes de toda la suite. */
export default function setup() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}
