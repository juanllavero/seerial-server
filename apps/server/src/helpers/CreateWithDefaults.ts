import type { BaseEntity, DeepPartial } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { defaults } from '@/data/defaults/ModelDefaults';

export function createWithDefaults<T extends BaseEntity>(
  model: { new (): T } & typeof BaseEntity,
  data: DeepPartial<T>,
): T {
  type DefaultValue = unknown | (() => unknown);

  const modelName = model.name as keyof typeof defaults;
  const modelDefaults = (defaults[modelName] || {}) as Record<string, DefaultValue>;

  const instance = model.create(data) as T;
  const instanceRecord = instance as Record<string, unknown> & { id?: string };

  // Apply default values
  for (const key in modelDefaults) {
    if (instanceRecord[key] === undefined) {
      const value = modelDefaults[key];
      instanceRecord[key] = typeof value === 'function' ? value() : value;
    }
  }

  // Generate id if it doesn't exist
  if (instanceRecord.id === undefined) {
    instanceRecord.id = uuidv4().split('-')[0];
  }

  return instance;
}
