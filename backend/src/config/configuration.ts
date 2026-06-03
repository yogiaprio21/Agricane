export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  environment: process.env.NODE_ENV || 'development',
  swagger: {
    enabled:
      process.env.ENABLE_SWAGGER === undefined
        ? process.env.NODE_ENV !== 'production'
        : process.env.ENABLE_SWAGGER === 'true',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  auth: {
    allowPublicRegister:
      process.env.ALLOW_PUBLIC_REGISTER === undefined
        ? process.env.NODE_ENV !== 'production'
        : process.env.ALLOW_PUBLIC_REGISTER === 'true',
  },
  
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    baseUrl: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
  },
  
  fao: {
    baseUrl: process.env.FAO_API_BASE_URL || 'https://www.fao.org/faostat/api/v1',
    domainCode: process.env.FAO_DOMAIN_CODE || 'QCL',
  },
  
  copernicus: {
    clientId: process.env.COPERNICUS_CLIENT_ID,
    clientSecret: process.env.COPERNICUS_CLIENT_SECRET,
    baseUrl: process.env.COPERNICUS_BASE_URL || 'https://services.sentinel-hub.com',
  },
  
  cron: {
    weatherUpdate: process.env.WEATHER_UPDATE_CRON || '0 */6 * * *',
    iotAnomalyCheck: process.env.IOT_ANOMALY_CHECK_CRON || '*/5 * * * *',
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS, 10) || 1000,
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  },
  
  websocket: {
    port: parseInt(process.env.WS_PORT, 10) || 3001,
  },
  
  notification: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
    from: process.env.NOTIFICATION_FROM || 'noreply@agricane.com',
  },
});
