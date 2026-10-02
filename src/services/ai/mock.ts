import type { z } from "zod";
import type { AiJsonRequest, AiJsonResult, AiProvider } from "./provider";

/**
 * Proveedor de pruebas (AI_PROVIDER=mock): respuestas deterministas, coste 0.
 * Solo para desarrollo/tests E2E. No usar en producción.
 */
export class MockProvider implements AiProvider {
  readonly name = "mock";
  readonly model = "mock";

  async generateJson<T extends z.ZodType>(req: AiJsonRequest<T>): Promise<AiJsonResult<z.infer<T>>> {
    const raw = {
      title: "Reforma según descripción",
      items: [
        { description: "Desmontaje y retirada de elementos existentes", quantity: 1, unit: "servicio", unitPrice: 180 },
        { description: "Material según especificaciones", quantity: 1, unit: "ud", unitPrice: 0 },
        { description: "Mano de obra de instalación", quantity: 8, unit: "h", unitPrice: 35 },
        { description: "Limpieza final y retirada de escombros", quantity: 1, unit: "servicio", unitPrice: 60 },
      ],
    };
    return { data: req.schema.parse(raw), model: this.model, inputTokens: 0, outputTokens: 0 };
  }
}
