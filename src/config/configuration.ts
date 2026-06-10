export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  upload: {
    path: process.env.UPLOAD_PATH ?? './uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001').split(','),
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  },
});
