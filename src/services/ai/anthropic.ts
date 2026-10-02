import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { AiProviderError, type AiJsonRequest, type AiJsonResult, type AiProvider } from "./provider";

// Modelos que aceptan el fallback automático del servidor ante rechazos de seguridad.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    // Timeout corto y 1 reintento: es una petición interactiva.
    this.client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });
  }

  async generateJson<T extends z.ZodType>(req: AiJsonRequest<T>): Promise<AiJsonResult<z.infer<T>>> {
    const useFallback = FALLBACK_MODELS.has(this.model);
    try {
      const response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
        // Tarea sencilla y acotada: esfuerzo bajo = menos tokens y menos coste.
        output_config: { effort: "low", format: betaZodOutputFormat(req.schema) },
        ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });

      if (response.stop_reason === "refusal") {
        throw new AiProviderError("No hemos podido generar partidas para esa descripción. Reformúlala, por favor.", false);
      }
      if (response.stop_reason === "max_tokens" || response.parsed_output == null) {
        throw new AiProviderError("La respuesta de la IA ha salido incompleta. Prueba con una descripción más corta.", true);
      }
      return {
        data: response.parsed_output as z.infer<T>,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Anthropic.RateLimitError) {
        throw new AiProviderError("El asistente está muy ocupado ahora mismo. Prueba en un minuto.", true);
      }
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
        throw new AiProviderError("El asistente de IA no está disponible ahora mismo.", false);
      }
      if (error instanceof Anthropic.APIError || error instanceof Anthropic.APIConnectionError) {
        throw new AiProviderError("No hemos podido contactar con el asistente de IA. Inténtalo de nuevo.", true);
      }
      throw error;
    }
  }
}
