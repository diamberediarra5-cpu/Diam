import "server-only";
import { env } from "@/lib/env";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";
import type { AiProvider } from "./provider";

let override: AiProvider | null | undefined;

/** Solo tests: inyecta un proveedor falso. */
export function setAiProviderForTests(provider: AiProvider | null | undefined) {
  override = provider;
}

/** Devuelve el proveedor configurado o null si la IA está desactivada. */
export function getAiProvider(): AiProvider | null {
  if (override !== undefined) return override;
  switch (env.ai.provider) {
    case "anthropic":
      return env.ai.anthropicApiKey ? new AnthropicProvider(env.ai.anthropicApiKey, env.ai.model) : null;
    case "mock":
      return new MockProvider();
    default:
      return null;
  }
}

export function isAiEnabled() {
  return getAiProvider() !== null;
}
