export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'array';
  label: string;
  hasLock: boolean;
  placeholder?: string;
}

export interface FormGroup {
  direction: 'row' | 'column';
  fields: string[];
}

export interface FormConfig {
  fields: FormField[];
  groups: FormGroup[];
}

type FormValue = string | string[] | boolean;

// Helper functions to optimize dialog components

// Generate default values from multiple configs
export function generateDefaultValues(...configs: FormConfig[]) {
  const defaults: Record<string, FormValue> = {};

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      if (field.type === 'array') {
        defaults[field.name] = [];
      } else {
        defaults[field.name] = '';
      }

      if (field.hasLock) {
        defaults[`${field.name}Lock`] = false;
      }
    });
  });

  return defaults;
}

// Generate reset values from entity using configs
export function generateResetValues(entity: object, ...configs: FormConfig[]) {
  const values: Record<string, FormValue> = {};
  const entityRecord = entity as Record<string, unknown>;

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      const entityValue = entityRecord[field.name];
      if (Array.isArray(entityValue)) {
        values[field.name] = entityValue.filter(
          (value): value is string => typeof value === 'string',
        );
      } else if (typeof entityValue === 'string') {
        values[field.name] = entityValue;
      } else {
        values[field.name] = field.type === 'array' ? [] : '';
      }

      if (field.hasLock) {
        const lockValue = entityRecord[`${field.name}Lock`];
        values[`${field.name}Lock`] = typeof lockValue === 'boolean' ? lockValue : false;
      }
    });
  });

  return values;
}

// Generate submit data mapping
export function generateSubmitData(
  data: Record<string, unknown>,
  baseEntity: object,
  ...configs: FormConfig[]
) {
  const entityData: Record<string, unknown> = { ...(baseEntity as Record<string, unknown>) };

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      entityData[field.name] = data[field.name];

      if (field.hasLock) {
        entityData[`${field.name}Lock`] = data[`${field.name}Lock`];
      }
    });
  });

  return entityData;
}

export const seriesInfoConfig: FormConfig = {
  fields: [
    { name: 'name', type: 'text', label: 'name', hasLock: true },
    { name: 'year', type: 'text', label: 'year', hasLock: true },
    { name: 'tagline', type: 'text', label: 'tagline', hasLock: true },
    { name: 'overview', type: 'textarea', label: 'overview', hasLock: true },
  ],
  groups: [
    {
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      direction: 'column',
      fields: ['tagline', 'overview'],
    },
  ],
};

export const seriesTagsConfig: FormConfig = {
  fields: [
    { name: 'genres', type: 'array', label: 'genres', hasLock: true },
    { name: 'creator', type: 'array', label: 'createdBy', hasLock: true },
    {
      name: 'productionStudios',
      type: 'array',
      label: 'studios',
      hasLock: true,
    },
    { name: 'musicComposer', type: 'array', label: 'musicBy', hasLock: true },
  ],
  groups: [
    {
      direction: 'column',
      fields: ['genres', 'creator', 'productionStudios', 'musicComposer'],
    },
  ],
};

export const seasonInfoConfig: FormConfig = {
  fields: [
    { name: 'name', type: 'text', label: 'name', hasLock: true },
    { name: 'year', type: 'text', label: 'year', hasLock: true },
    { name: 'overview', type: 'textarea', label: 'overview', hasLock: true },
  ],
  groups: [
    {
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      direction: 'column',
      fields: ['overview'],
    },
  ],
};

export const episodeInfoConfig: FormConfig = {
  fields: [
    { name: 'name', type: 'text', label: 'name', hasLock: true },
    { name: 'year', type: 'text', label: 'year', hasLock: true },
    { name: 'overview', type: 'textarea', label: 'overview', hasLock: true },
    { name: 'directedBy', type: 'array', label: 'directedBy', hasLock: false },
    { name: 'writtenBy', type: 'array', label: 'writtenBy', hasLock: false },
  ],
  groups: [
    {
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      direction: 'column',
      fields: ['overview'],
    },
    {
      direction: 'row',
      fields: ['directedBy', 'writtenBy'],
    },
  ],
};

export const movieInfoConfig: FormConfig = {
  fields: [
    { name: 'name', type: 'text', label: 'name', hasLock: true },
    { name: 'year', type: 'text', label: 'year', hasLock: true },
    {
      name: 'productionStudios',
      type: 'array',
      label: 'studios',
      hasLock: true,
    },
    { name: 'tagline', type: 'text', label: 'tagline', hasLock: true },
    { name: 'overview', type: 'textarea', label: 'overview', hasLock: true },
  ],
  groups: [
    {
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      direction: 'column',
      fields: ['productionStudios', 'tagline', 'overview'],
    },
  ],
};

export const movieTagsConfig: FormConfig = {
  fields: [
    { name: 'genres', type: 'array', label: 'genres', hasLock: true },
    { name: 'creator', type: 'array', label: 'createdBy', hasLock: true },
    { name: 'directedBy', type: 'array', label: 'directedBy', hasLock: true },
    { name: 'writtenBy', type: 'array', label: 'writtenBy', hasLock: true },
    { name: 'musicComposer', type: 'array', label: 'musicBy', hasLock: true },
  ],
  groups: [
    {
      direction: 'column',
      fields: ['genres', 'creator', 'directedBy', 'writtenBy', 'musicComposer'],
    },
  ],
};
