export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'array';
  label: string;
  hasLock: boolean;
  placeholder?: string;
}

export interface FormGroup {
  id: string;
  direction: 'row' | 'column';
  fields: string[];
}

export interface FormConfig {
  fields: FormField[];
  groups: FormGroup[];
}

type FormValue = string | string[] | boolean;

function getDefaultFieldValue(field: FormField): FormValue {
  return field.type === 'array' ? [] : '';
}

function getResetFieldValue(field: FormField, entityValue: unknown): FormValue {
  if (Array.isArray(entityValue)) {
    return entityValue.filter((value): value is string => typeof value === 'string');
  }

  if (typeof entityValue === 'string') {
    return entityValue;
  }

  return getDefaultFieldValue(field);
}

function getResetLockValue(entityRecord: Record<string, unknown>, fieldName: string): boolean {
  const lockValue = entityRecord[`${fieldName}Lock`];
  return typeof lockValue === 'boolean' ? lockValue : false;
}

// Helper functions to optimize dialog components

// Generate default values from multiple configs
export function generateDefaultValues(...configs: FormConfig[]) {
  const defaults: Record<string, FormValue> = {};

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      defaults[field.name] = getDefaultFieldValue(field);

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
      values[field.name] = getResetFieldValue(field, entityRecord[field.name]);

      if (field.hasLock) {
        values[`${field.name}Lock`] = getResetLockValue(entityRecord, field.name);
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
      id: 'basicInfo',
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      id: 'additionalInfo',
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
      id: 'tags',
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
      id: 'basicInfo',
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      id: 'additionalInfo',
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
      id: 'basicInfo',
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      id: 'additionalInfo',
      direction: 'column',
      fields: ['overview'],
    },
    {
      id: 'credits',
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
      id: 'basicInfo',
      direction: 'row',
      fields: ['name', 'year'],
    },
    {
      id: 'additionalInfo',
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
      id: 'tags',
      direction: 'column',
      fields: ['genres', 'creator', 'directedBy', 'writtenBy', 'musicComposer'],
    },
  ],
};
