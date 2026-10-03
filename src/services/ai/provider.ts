import type { z } from "zod";

export type AiJsonRequest<T extends z.ZodType> = {
  system: string;
  prompt: string;
  schema: T;
  maxTokens: number;
};

export type AiJsonResult<T> = {
  data: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

/** Capa independiente del proveedor: para cambiar de IA solo hay que implementar esta interfaz. */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  generateJson<T extends z.ZodType>(req: AiJsonRequest<T>): Promise<AiJsonResult<z.infer<T>>>;
}

/** Error del proveedor con mensaje apto para el usuario (sin detalles técnicos). */
export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
