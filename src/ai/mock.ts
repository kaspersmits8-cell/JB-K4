import type { LLMProvider } from "./provider.ts";
import { template } from "./templates.ts";
import type { DraftInput } from "./templates.ts";
export class MockProvider implements LLMProvider {
  name = "mock";
  async generateJSON<T>(req: Parameters<LLMProvider["generateJSON"]>[0] & { schema: import("zod").z.ZodType<T> }): Promise<T> {
    return req.schema.parse(template(req.task, JSON.parse(req.input) as DraftInput)) as T;
  }
}
