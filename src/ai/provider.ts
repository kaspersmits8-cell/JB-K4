import type { z } from "zod";
export interface LLMProvider {
  name: string;
  generateJSON<T>(req: { task: string; promptVersion: string; system: string; input: string; schema: z.ZodType<T> }): Promise<T>;
  embed?(texts: string[]): Promise<number[][]>;
}
