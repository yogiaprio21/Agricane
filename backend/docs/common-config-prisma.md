# Common, Config, & Prisma

## Common

- Enums & Filter Global:
  - Enums: [role.enum.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/common/enums/role.enum.ts)
    - Role, GrowthStatus, HealthStatus, NotificationType, NotificationPriority
  - Filter: [http-exception.filter.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/common/filters/http-exception.filter.ts)
    - Menangkap semua exception, membangun response JSON konsisten, logging detail, status.

### Ringkasan Fungsi

- AllExceptionsFilter.catch(exception, host): membangun respons error standar dan log stack trace bila tersedia.

## Config

- Sumber: [configuration.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/config/configuration.ts)
  - `port`, `apiPrefix`, `environment`
  - `database.url`
  - `jwt.secret`, `jwt.expiresIn`, `jwt.refreshSecret`, `jwt.refreshExpiresIn`
  - `openWeather.apiKey`, `openWeather.baseUrl`
  - `fao.baseUrl`, `fao.domainCode`
  - `copernicus.clientId`, `copernicus.clientSecret`, `copernicus.baseUrl`
  - `cron.weatherUpdate`, `cron.iotAnomalyCheck`
  - `cache.ttl`, `cache.maxItems`
  - `cors.origin`
  - `websocket.port`
  - `notification.smtp` dan `notification.from`

### Alur Bootstrap

- [main.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/main.ts):
  - Mengambil `port` dan `apiPrefix`.
  - Set global prefix, CORS origin dari `cors.origin`.
  - Pasang `ValidationPipe` global (whitelist, forbid, transform + implicit).
  - Setup Swagger dengan tags per modul, Bearer auth, dan sorting.

## Prisma

- Service & Module:
  - [prisma.service.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/prisma/prisma.service.ts): extend `PrismaClient` dengan logging dan lifecycle connect/disconnect.
  - [prisma.module.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/prisma/prisma.module.ts): `@Global()` mengekspor `PrismaService` ke semua modul.
- Schema:
  - [schema.prisma](file:///d:/PROJECT/AWAL/Agricane/backend/prisma/schema.prisma): definisi model, enum, relasi, dan mapping tabel.
  - Model utama: `User`, `Field`, `WeatherData`, `FAOReference`, `SensorReading`, `NDVIData`, `DroneFlight`, `AIDecision`, `Notification`, `SystemCache`.
- Seed:
  - [seed.ts](file:///d:/PROJECT/AWAL/Agricane/backend/prisma/seed.ts): membuat user, fields, data sensor, FAO references, contoh flight drone.

### Contoh Kode

```ts
// PrismaService
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## App Module

- [app.module.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/app.module.ts):
  - Import `ConfigModule.forRoot({ isGlobal: true, load: [configuration] })`.
  - Import semua modul domain (Auth, Users, Fields, Environmental, Agronomy, IoT, Monitoring, AI Decision, Notifications).
  - Provider global:
    - `APP_GUARD` → `JwtAuthGuard`, `RolesGuard`
    - `APP_FILTER` → `AllExceptionsFilter`

## Catatan Khusus

- `PrismaService.cleanDatabase()` melindungi dari eksekusi di production; fungsi ini berguna untuk testing/e2e.
- `cors.origin` dapat berisi daftar koma; default mengizinkan `http://localhost:3001`.  
