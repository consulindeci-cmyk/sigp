import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),

  // Database
  DATABASE_URL: Joi.string().default('postgresql://postgres.alwueihbddrupomwiwmv:SigpProd_2026_SecurePwd!@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_TTL_CACHE: Joi.number().default(300),
  REDIS_TTL_DASHBOARD: Joi.number().default(300),

  // JWT RS256
  JWT_PRIVATE_KEY_PATH: Joi.string().default('./keys/private.pem'),
  JWT_PUBLIC_KEY_PATH: Joi.string().default('./keys/public.pem'),
  JWT_ACCESS_TOKEN_TTL: Joi.number().default(900),
  JWT_REFRESH_TOKEN_TTL: Joi.number().default(604800),
  JWT_REFRESH_TOKEN_GRACE: Joi.number().default(30),
  JWT_SECRET: Joi.string().min(32).default('sigp-dev-secret-min-32-chars-xxxx'),

  // MinIO
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ROOT_USER: Joi.string().default('minioadmin'),
  MINIO_ROOT_PASSWORD: Joi.string().default('minioadmin123'),
  MINIO_BUCKET_DOCUMENTS: Joi.string().default('sigp-documents'),
  MINIO_BUCKET_REPORTS: Joi.string().default('sigp-reports'),
  MINIO_BUCKET_AVATARS: Joi.string().default('sigp-avatars'),

  // Email
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(1025),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().default('SIGP No-Reply <noreply@sigp.local>'),

  // ClamAV
  CLAMAV_HOST: Joi.string().default('localhost'),
  CLAMAV_PORT: Joi.number().default(3310),
  ANTIVIRUS_ENABLED: Joi.boolean().default(false),

  // Upload
  UPLOAD_MAX_SIZE_MB: Joi.number().default(20),
  UPLOAD_ALLOWED_MIME_TYPES: Joi.string().default('application/pdf,image/jpeg,image/png'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  THROTTLE_AUTH_LIMIT: Joi.number().default(5),

  // Monitoring
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PATH: Joi.string().default('/metrics'),

  // Seed
  SEED_ADMIN_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .default('admin@sigp.local'),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).default('Admin@2024!'),

  // Logs
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('debug'),
  LOG_PRETTY: Joi.boolean().default(true),
});
