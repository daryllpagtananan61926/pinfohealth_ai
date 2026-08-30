import Ajv from 'ajv';

const ajv = new Ajv({ strict: true, allErrors: true });

const UI_SCHEMAS = {
  'breathing-exercise': {
    type: 'object',
    properties: {
      cycles: { type: 'integer', minimum: 1, maximum: 20 },
      inhale: { type: 'integer', minimum: 2, maximum: 10 },
      hold: { type: 'integer', minimum: 0, maximum: 10 },
      exhale: { type: 'integer', minimum: 2, maximum: 10 },
    },
    required: ['cycles', 'inhale', 'hold', 'exhale'],
    additionalProperties: false,
  },
  'micro-habit-card': {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 500 },
      duration: { type: 'string', maxLength: 50 },
    },
    required: ['title'],
    additionalProperties: false,
  },
  'mood-button': {
    type: 'object',
    properties: {
      options: {
        type: 'array',
        items: { type: 'string', minLength: 1, maxLength: 10 },
        minItems: 2,
        maxItems: 10,
        uniqueItems: true,
      },
    },
    additionalProperties: false,
  },
  'quick-poll': {
    type: 'object',
    properties: {
      question: { type: 'string', minLength: 1, maxLength: 300 },
      options: {
        type: 'array',
        items: { type: 'string', minLength: 1, maxLength: 100 },
        minItems: 2,
        maxItems: 4,
        uniqueItems: true,
      },
    },
    required: ['question', 'options'],
    additionalProperties: false,
  },
  'grounding-54321': {
    type: 'object',
    properties: {
      autoStart: { type: 'boolean' },
    },
    additionalProperties: false,
  },
};

const compiledValidators = {};
for (const [component, schema] of Object.entries(UI_SCHEMAS)) {
  compiledValidators[component] = ajv.compile(schema);
}

export const ALLOWED_UI_COMPONENTS = new Set(Object.keys(UI_SCHEMAS));

export function validateUIComponent(component, props) {
  const validator = compiledValidators[component];
  if (!validator) {
    return { valid: false, error: `Unknown UI component: ${component}` };
  }
  const valid = validator(props);
  if (!valid) {
    const errors = validator.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ') || 'Invalid props';
    return { valid: false, error: `Schema validation failed for ${component}: ${errors}` };
  }
  return { valid: true, error: null };
}

export function getAllowedComponents() {
  return [...ALLOWED_UI_COMPONENTS];
}