export interface FormField {
  name: string
  type: 'text' | 'textarea' | 'array'
  label: string
  hasLock: boolean
  placeholder?: string
}

export interface FormGroup {
  direction: 'row' | 'column'
  fields: string[]
}

export interface FormConfig {
  fields: FormField[]
  groups: FormGroup[]
}

// Helper functions to optimize dialog components

// Generate default values from multiple configs
export function generateDefaultValues(...configs: FormConfig[]) {
  const defaults: Record<string, any> = {}

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      if (field.type === 'array') {
        defaults[field.name] = []
      } else {
        defaults[field.name] = ''
      }

      if (field.hasLock) {
        defaults[`${field.name}Lock`] = false
      }
    })
  })

  return defaults
}

// Generate reset values from entity using configs
export function generateResetValues(entity: any, ...configs: FormConfig[]) {
  const values: Record<string, any> = {}

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      const entityValue = entity[field.name]
      values[field.name] =
        entityValue !== undefined ? entityValue : field.type === 'array' ? [] : ''

      if (field.hasLock) {
        const lockValue = entity[`${field.name}Lock`]
        values[`${field.name}Lock`] = lockValue !== undefined ? lockValue : false
      }
    })
  })

  return values
}

// Generate submit data mapping
export function generateSubmitData(
  data: Record<string, any>,
  baseEntity: any,
  ...configs: FormConfig[]
) {
  const entityData: Record<string, any> = { ...baseEntity }

  configs.forEach((config) => {
    config.fields.forEach((field) => {
      entityData[field.name] = data[field.name]

      if (field.hasLock) {
        entityData[`${field.name}Lock`] = data[`${field.name}Lock`]
      }
    })
  })

  return entityData
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
}

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
}

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
}

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
}

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
}

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
}
