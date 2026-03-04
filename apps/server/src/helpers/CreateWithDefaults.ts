import { defaults } from "@/data/defaults/ModelDefaults";
import { BaseEntity, DeepPartial } from "typeorm";
import { v4 as uuidv4 } from "uuid";

export function createWithDefaults<T extends BaseEntity>(
  model: { new (): T } & typeof BaseEntity,
  data: DeepPartial<T>
): T {
  const modelName = model.name as keyof typeof defaults;
  const modelDefaults = defaults[modelName] || {};

  const instance = model.create(data) as T;

  // Apply default values
  for (const key in modelDefaults) {
    const k = key as keyof T;
    if (instance[k] === undefined) {
      const value = modelDefaults[k as keyof typeof modelDefaults];
      instance[k] =
        typeof value === "function" ? (value as Function)() : (value as any);
    }
  }

  // Generate id if it doesn't exist
  if ((instance as any).id === undefined) {
    (instance as any).id = uuidv4().split("-")[0];
  }

  return instance;
}
