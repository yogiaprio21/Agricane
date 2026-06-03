type Environment = Record<string, string | undefined>;

const REQUIRED_BASE = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const REQUIRED_PRODUCTION = ['DIRECT_URL', 'CORS_ORIGIN'];

function requireNonEmpty(config: Environment, keys: string[]) {
  const missing = keys.filter((key) => !config[key] || config[key]?.trim() === '');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function validateUrl(config: Environment, key: string) {
  const value = config[key];
  if (!value) return;

  try {
    new URL(value);
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL`);
  }
}

function validateCorsOrigins(config: Environment) {
  const value = config.CORS_ORIGIN;
  if (!value) return;

  for (const origin of value.split(',')) {
    validateUrl({ ORIGIN: origin.trim() }, 'ORIGIN');
  }
}

function validateNumericEnv(config: Environment, key: string, min: number) {
  const value = config[key];
  if (!value) return;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(`Environment variable ${key} must be a number greater than or equal to ${min}`);
  }
}

function validateBooleanEnv(config: Environment, key: string) {
  const value = config[key];
  if (!value) return;

  if (!['true', 'false'].includes(value)) {
    throw new Error(`Environment variable ${key} must be either true or false`);
  }
}

export function validateEnv(config: Environment) {
  const nodeEnv = config.NODE_ENV || 'development';

  requireNonEmpty(config, REQUIRED_BASE);

  if (nodeEnv === 'production') {
    requireNonEmpty(config, REQUIRED_PRODUCTION);
  }

  validateUrl(config, 'OPENWEATHER_BASE_URL');
  validateUrl(config, 'FAO_API_BASE_URL');
  validateUrl(config, 'COPERNICUS_BASE_URL');
  validateCorsOrigins(config);
  validateNumericEnv(config, 'PORT', 1);
  validateNumericEnv(config, 'SMTP_PORT', 1);
  validateBooleanEnv(config, 'SMTP_SECURE');
  validateNumericEnv(config, 'CACHE_TTL', 1);
  validateNumericEnv(config, 'CACHE_MAX_ITEMS', 1);
  validateNumericEnv(config, 'API_RATE_LIMIT_TTL', 1);
  validateNumericEnv(config, 'API_RATE_LIMIT_MAX', 1);
  validateBooleanEnv(config, 'ALLOW_PUBLIC_REGISTER');

  return config;
}
