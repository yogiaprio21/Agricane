# AgriCane Fullstack Audit and Implementation Plan

Tanggal audit: 2026-06-02

Scope: backend NestJS + Prisma, frontend React Vite + Tailwind, integrasi API/WebSocket, kesiapan deploy ke Vercel, Render, dan Neon.

## Ringkasan Eksekutif

Project sudah punya fondasi portfolio yang kuat: modul autentikasi, user management, field management, environmental monitoring, IoT realtime, NDVI/drone monitoring, AI recommendation, notification center, agronomy knowledge base, Swagger, Dockerfile, dan Prisma schema. Build backend dan build frontend berhasil saat dijalankan lewat Node lokal.

Namun sebelum hosting, ada beberapa perbaikan wajib:

1. P0 Security: `backend/.env.example` berisi nilai yang tampak seperti secret asli untuk database, JWT, OpenWeather, Copernicus, dan SMTP. Semua secret harus dirotasi dan file example harus diganti placeholder.
2. P0 Realtime security: backend WebSocket menerima koneksi tanpa validasi token dan CORS namespace masih `origin: '*'`, sementara frontend sudah mengirim token melalui `auth`.
3. P0 Quality gate: script lint ada, tetapi tidak ada konfigurasi ESLint sehingga lint gagal jalan. Test backend juga kosong, sehingga tidak ada regression safety.
4. P1 API contract: sebagian endpoint masih memakai object inline/string bebas tanpa DTO validasi, terutama notifications, drone flight, growth status, dan query filter.
5. P1 Frontend quality: UI sudah lengkap tetapi belum konsisten pada error state, empty state, confirmation modal, table mobile behavior, accessibility label, dan route-level performance.
6. P1 Deployment: belum ada `render.yaml`, belum ada `vercel.json`, belum ada panduan Neon pooled/direct connection, dan belum ada health endpoint yang cocok untuk Render monitoring.

## Bukti Validasi Lokal

Karena `npm` dan `npx` tidak tersedia di PATH, validasi dilakukan via Node runtime bundled Codex dan CLI lokal dalam `node_modules`.

Berhasil:

- Backend build: `node backend/node_modules/@nestjs/cli/bin/nest.js build`
- Frontend typecheck: `node frontend/node_modules/typescript/bin/tsc --noEmit`
- Frontend production build: `node frontend/node_modules/vite/bin/vite.js build`

Gagal/terblokir:

- Backend test: tidak ada file `*.spec.ts`, Jest keluar dengan `No tests found`.
- Backend lint: ESLint gagal karena tidak ada config.
- Frontend lint: ESLint gagal karena tidak ada config.
- Vite build warning: chunk utama `assets/index-*.js` sekitar 938.88 kB, lebih besar dari threshold 500 kB.

## Referensi Resmi Yang Dipakai

- NestJS ValidationPipe: whitelist, forbidNonWhitelisted, transform, dan disable detailed production errors.
  https://docs.nestjs.com/techniques/validation
- NestJS CORS: `enableCors()` menerima opsi konfigurasi CORS.
  https://docs.nestjs.com/security/cors
- Socket.IO middleware/auth: credential client dikirim lewat `auth` dan dibaca melalui `socket.handshake.auth`.
  https://socket.io/docs/v4/middlewares/
- React lazy: route/component code bisa ditunda dengan `lazy()` dan `Suspense`.
  https://react.dev/reference/react/lazy
- Tailwind responsive design: mobile-first breakpoint system dan viewport meta.
  https://tailwindcss.com/docs/responsive-design
- Vite env: `vite build` default production mode dan env client harus memakai prefix `VITE_`.
  https://vite.dev/guide/env-and-mode
- Vercel Vite deployment: Vite bisa deploy langsung ke Vercel, env build perlu prefix `VITE_`.
  https://vercel.com/docs/frameworks/frontend/vite
- Render + Prisma deployment: perlu database, app service, pre-deploy migration, dan seed strategy.
  https://render.com/docs/deploy-prisma-orm
- Neon + Prisma: gunakan pooled URL untuk runtime dan direct URL untuk migration/CLI.
  https://docs.prisma.io/docs/v6/orm/overview/databases/neon

## Audit Backend

### 1. Security and Environment

Temuan:

- `backend/.env.example` berisi nilai credential/API key yang tampak nyata pada DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, OPENWEATHER_API_KEY, COPERNICUS_CLIENT_ID, COPERNICUS_CLIENT_SECRET, dan SMTP_PASSWORD.
- `backend/src/config/configuration.ts` membaca secret dari env, tetapi belum ada validation schema untuk memastikan production tidak jalan dengan env kosong atau default berbahaya.
- `backend/src/app.module.ts` throttling sudah global, tetapi nilainya hardcoded dan belum membaca env `API_RATE_LIMIT_TTL` serta `API_RATE_LIMIT_MAX` yang sudah ada di `.env.example`.
- Swagger aktif tanpa gating environment. Untuk portfolio boleh aktif, tetapi untuk production lebih aman dibatasi atau diberi basic auth.

Rekomendasi:

- Ganti semua nilai `.env.example` menjadi placeholder.
- Rotasi semua secret yang pernah tersimpan di repo.
- Tambah config validation dengan Joi atau Zod untuk env wajib.
- Pisahkan env development, staging, production.
- Swagger hanya aktif ketika `NODE_ENV !== 'production'` atau dilindungi auth.
- Disable detailed validation error di production.

Acceptance criteria:

- Tidak ada secret nyata di `.env.example`, README, Dockerfile, atau docs.
- Aplikasi gagal start dengan pesan jelas jika env wajib kosong.
- Production tidak memakai fallback secret/default.
- Swagger production tidak terbuka publik tanpa proteksi.

### 2. Authentication and Authorization

Temuan:

- JWT access dan refresh flow sudah ada, refresh token disimpan hashed, dan user inactive ditolak.
- Global `JwtAuthGuard` + `RolesGuard` sudah diterapkan di `AppModule`.
- `@Public()` dibuat manual dengan Reflect metadata. Berfungsi, tetapi lebih baik memakai `SetMetadata` resmi agar konsisten dengan Nest.
- Register endpoint public memungkinkan user baru menentukan role. Ini riskan untuk production/portfolio jika tidak ada invite/admin approval.
- Frontend `Users` page hanya disembunyikan dari nav untuk non-admin/non-manager, tetapi route `/users` tetap bisa dikunjungi. Backend tetap melindungi data, namun UX perlu role-aware route.

Rekomendasi:

- Ubah `Public` decorator memakai `SetMetadata('isPublic', true)`.
- Untuk portfolio, tentukan mode: public demo register dimatikan atau register default `TECHNICIAN` tanpa role input.
- Tambah endpoint `/auth/me` agar frontend tidak hanya percaya `localStorage.user`.
- Tambah route guard frontend berbasis role.

Acceptance criteria:

- Non-admin tidak bisa membuat akun admin dari register.
- Refresh token rotation tetap lulus test.
- Setelah reload, frontend memvalidasi user dari backend atau token payload yang aman, bukan hanya localStorage.
- Route users menampilkan 403-friendly state untuk role yang tidak boleh akses.

### 3. API Contract and Validation

Temuan:

- Field dan IoT sudah punya DTO validasi.
- Monitoring drone flight masih memakai inline body object, belum DTO.
- Notifications masih menerima `type` dan `priority` string bebas, lalu dicast `as any`.
- Growth status update menerima `status: string` dan dicast `as any`.
- Query `growthStatus`, `type`, dan `priority` belum divalidasi enum.
- Banyak service langsung memakai Prisma, sementara README mengklaim Clean Architecture dengan Repository layer. Kondisi saat ini lebih tepat disebut modular service architecture.

Rekomendasi:

- Tambah DTO:
  - `UpdateGrowthStatusDto`
  - `CreateDroneFlightDto`
  - `UpdateDroneFlightDto`
  - `CreateNotificationDto`
  - `NotificationFilterDto`
  - `FieldFilterDto`
- Pakai enum Prisma/domain, hindari `as any`.
- Tambah pagination DTO standar untuk list endpoint.
- Jika ingin clean architecture yang tampak profesional, lakukan bertahap:
  - Phase 1: DTO + service boundary + mapper.
  - Phase 2: repository interface untuk modul yang kompleks saja: fields, monitoring, notifications.
  - Phase 3: domain use case untuk AI decision dan IoT anomaly.

Acceptance criteria:

- Invalid enum menghasilkan 400 dari ValidationPipe, bukan Prisma/runtime error.
- Semua mutation endpoint punya DTO class dan Swagger schema.
- Tidak ada cast `as any` pada enum/domain data path utama.
- List endpoint punya `page`, `limit`, `sort`, dan filter yang tervalidasi.

### 4. Database and Prisma

Temuan:

- Schema sudah punya index penting untuk time-series: weather, sensor, NDVI, drone, AI decision, notification.
- Belum ada `directUrl` untuk Neon migration flow.
- Belum ada soft delete untuk users/fields. Saat field dihapus, data terkait cascade hilang. Untuk portfolio analytics, ini bisa membuat chart/history lenyap.
- Belum ada unique constraint field name atau composite uniqueness berbasis lokasi/nama.
- Belum ada audit columns untuk siapa membuat/mengubah data.

Rekomendasi:

- Tambah `directUrl = env("DIRECT_URL")` di datasource untuk Neon migration.
- Untuk production portfolio, prefer soft delete `deletedAt` untuk Field dan User, minimal untuk User.
- Tambah `createdById`/`updatedById` bila ingin audit trail.
- Tambah seed demo yang aman dan repeatable.
- Tambah query pagination untuk time-series agar table/chart tidak mengambil data terlalu besar.

Acceptance criteria:

- Prisma migrate deploy berjalan di Render dengan `DIRECT_URL`.
- Runtime menggunakan pooled Neon `DATABASE_URL`.
- Seed bisa dijalankan berulang tanpa duplicate fatal.
- Delete field/user punya konfirmasi domain dan tidak menghancurkan demo data tanpa sengaja.

### 5. External Integrations

Temuan:

- OpenWeather integration sudah nyata, cache 10 menit, dan forecast endpoint ada.
- Sentinel Hub/Copernicus integration mencoba API nyata tetapi fallback ke simulasi random jika gagal.
- FAO/agronomy tampak lebih seperti local/rule-based knowledge, perlu label transparan agar portfolio tidak overclaim.
- Email notification hanya untuk HIGH/CRITICAL dan non-blocking, baik. Tetapi jika SMTP env kosong, perlu graceful disabled state.

Rekomendasi:

- Tambah `integrationStatus` endpoint untuk OpenWeather, Sentinel, SMTP, Neon.
- Bedakan data `source: REAL | SIMULATED | FALLBACK` pada NDVI, IoT demo, dan AI decisions.
- Tampilkan badge di UI: "Live API", "Cached", atau "Demo Simulation".
- Tambah retry/backoff dan timeout config env.

Acceptance criteria:

- UI tidak mengklaim data live jika backend memakai fallback simulation.
- External API failure tidak membuat halaman utama blank.
- Integration status terlihat di dashboard/admin.

### 6. WebSocket and Realtime

Temuan:

- Frontend mengirim token melalui `auth: { token }`.
- Backend gateway belum memvalidasi token saat connection.
- Gateway CORS masih `origin: '*'`.
- `sensor_data` event dapat mengirim data sensor tanpa role/auth check.
- NotificationContext mendengarkan `new_notification`, tetapi backend gateway khusus notification belum terlihat. `NotificationsService.create()` juga tidak broadcast websocket.
- `IotService.createSensorReading()` membuat notification saat anomaly, tetapi tidak memanggil `IotGateway.broadcastAnomaly()`.

Rekomendasi:

- Tambah WebSocket auth middleware/guard yang membaca `socket.handshake.auth.token`.
- Batasi CORS WebSocket dari env `CORS_ORIGIN`.
- Batasi event `sensor_data` untuk role yang sesuai, atau hapus dari client publik jika hanya demo.
- Integrasikan NotificationsService dengan gateway/event emitter agar `new_notification` benar-benar realtime.
- Saat anomaly, broadcast `sensor_anomaly` ke room field.

Acceptance criteria:

- Socket tanpa token valid ditolak dengan `connect_error`.
- Origin yang tidak terdaftar ditolak.
- Simulate sensor men-trigger chart update dan anomaly event jika threshold terlampaui.
- Notification bell update tanpa polling penuh ketika notification baru dibuat.

### 7. Testing and Quality Gate

Temuan:

- Build lulus, tetapi lint gagal karena config tidak ada.
- Tidak ada test backend.
- Frontend belum punya test setup.
- Script backend `lint` memakai `--fix`, kurang cocok untuk CI karena dapat mengubah file.

Rekomendasi:

- Tambah ESLint config backend dan frontend.
- Ubah script:
  - `lint`: check only.
  - `lint:fix`: auto fix.
- Tambah unit test minimal:
  - AuthService login/register/refresh/logout.
  - FieldsService cropAge + CRUD.
  - IotService anomaly detection.
  - MonitoringService NDVI classification.
  - NotificationsService unread count/mark read.
- Tambah e2e smoke test:
  - login -> get fields -> create field -> fetch dashboard.
- Tambah frontend test minimal dengan Vitest + Testing Library:
  - PrivateRoute redirect.
  - API refresh interceptor.
  - Layout nav role filtering.

Acceptance criteria:

- `npm run lint` lulus tanpa mengubah file.
- `npm test` lulus dengan minimal coverage untuk business rules.
- CI lokal punya command jelas untuk backend dan frontend.
- Build warning besar chunk diturunkan atau dibenarkan dengan code splitting.

## Audit Frontend

### 1. Architecture and Data Fetching

Temuan:

- Service layer sudah rapi per domain.
- Semua halaman diimport statis di `App.tsx`, menyebabkan bundle besar.
- Tidak ada centralized query cache/retry/dedup. Banyak halaman melakukan fetch manual dengan `useEffect`.
- Error handling tidak konsisten: sebagian pakai `toast`, sebagian hanya `console.error`, sebagian alert lokal.

Rekomendasi:

- Tambah route-level lazy loading dengan `React.lazy` dan `Suspense`.
- Pertimbangkan TanStack Query untuk cache, loading, refetch, retry, dan invalidation.
- Standarkan API error mapping di `api.service.ts`.
- Tambah ErrorBoundary per route.

Acceptance criteria:

- Chunk utama turun signifikan; Leaflet/Recharts hanya dimuat pada route yang perlu.
- Semua halaman punya loading, error, empty, dan retry state.
- Mutation create/update/delete otomatis invalidasi data terkait.

### 2. Layout, Navigation, Header, Footer

Temuan:

- Layout top navigation akan penuh pada desktop sedang karena menu banyak.
- Tidak ada footer/app meta, padahal portfolio akan lebih kuat jika ada environment/data source/status ringkas.
- Mobile menu ada, tetapi belum ada aria-label pada toggle dan logout.
- Active route hanya exact match, sehingga `/fields/:id` tidak menandai menu Fields aktif.

Rekomendasi:

- Ubah menjadi app shell: sidebar collapsible di desktop, top bar untuk user/notification, mobile drawer.
- Tambah PageHeader component standar: title, subtitle, actions, breadcrumbs.
- Tambah footer kecil atau status bar: API status, data mode, build env.
- Active nav pakai `pathname.startsWith('/fields')` untuk nested routes.

Acceptance criteria:

- Nav tidak wrap/bertumpuk pada 1024px.
- Mobile drawer punya aria-label, close on route change, dan focus behavior.
- Setiap page memakai PageHeader yang konsisten.

### 3. Components, Buttons, Cards, Forms, Tables

Temuan:

- Common components ada, tetapi belum mendukung `aria-label`, `leftIcon`, `rightIcon`, `loading`, `fullWidth`, `error`, `helperText`.
- Modal belum punya role dialog, aria-modal, focus trap, Escape close, dan labelled title.
- Delete masih memakai `window.confirm` pada Fields, Users, Notifications, Satellite.
- Icon-only action buttons banyak yang tidak punya accessible label.
- Form numeric belum punya validasi client yang kuat untuk min/max sesuai backend.
- Table sudah `overflow-x-auto`, tetapi belum ada mobile card view untuk data penting.

Rekomendasi:

- Upgrade design system internal:
  - Button, IconButton, Card, StatCard, PageHeader, EmptyState, ErrorState, ConfirmDialog, DataTable, FormField.
- Replace `window.confirm` dengan ConfirmDialog.
- Tambah field-level validation dan disabled submit ketika invalid.
- Table punya sticky action column atau card-list mobile.

Acceptance criteria:

- Tidak ada `window.confirm` di frontend.
- Semua icon button punya label accessible.
- Modal lulus keyboard basic: Tab trap, Escape close, focus kembali ke trigger.
- Form menolak latitude, longitude, pH, moisture, date, duration, dan altitude invalid sebelum request.

### 4. Page-by-Page UX Plan

#### Login

Perbaikan:

- Tambah show/hide password.
- Tambah demo role selector quick-fill, bukan hardcoded credential text panjang.
- Setelah login, redirect ke intended route bila user awalnya terkena private route.
- Kurangi gradient dominan green agar tidak terlihat template.

Acceptance criteria:

- Login error tampil jelas dan tidak menghapus input email.
- Demo credential bisa dipilih satu klik.
- User yang membuka `/fields` lalu login kembali ke `/fields`.

#### Dashboard

Perbaikan:

- Tambah skeleton dashboard, error state, dan retry.
- Tambah mini trend untuk IoT/weather/NDVI jika data tersedia.
- Pie chart saat semua value nol harus punya empty state, bukan chart kosong.
- Tambah "Needs attention" list dari health summary + notifications.

Acceptance criteria:

- Dashboard tetap informatif ketika belum ada fields/NDVI.
- KPI punya link ke halaman terkait.
- Alert count sinkron dengan unread critical/high notifications atau health stress logic.

#### Fields

Perbaikan:

- Tambah search/filter/sort by status/variety/area.
- Tambah map empty state.
- Tambah validate coordinate range dan plantingDate tidak future.
- Card/table mobile lebih nyaman, action icon berlabel.
- Tambah import sample/demo field optional untuk portfolio.

Acceptance criteria:

- User bisa mencari field dan filter growth status.
- Submit invalid coordinate/date dicegah di client dan backend.
- Delete memakai ConfirmDialog dengan nama field.

#### Field Detail

Perbaikan:

- PageHeader dengan breadcrumb.
- Tambah quick actions: fetch weather, simulate sensor, fetch NDVI, generate AI.
- Empty state per chart jika belum ada data.
- Map height responsif dan tidak terlalu besar di mobile.

Acceptance criteria:

- Field detail tidak blank walaupun weather/sensor/NDVI kosong.
- Semua auxiliary failure tampil sebagai warning per section.
- Nested nav Fields aktif.

#### Environmental

Perbaikan:

- Tambah status API: cached/live/failure.
- Tambah rainfall bar chart atau composed chart agar rainfall tidak sulit dibaca.
- Tambah empty state ketika belum fetch weather.
- Tambah date range dan "fetch latest" disabled saat field kosong.

Acceptance criteria:

- Jika OpenWeather key invalid, user melihat error actionable.
- Stats menjelaskan periode yang sama dengan filter atau jelas "last 30 days".
- Forecast card responsif dan tidak memakai emoji sebagai satu-satunya visual signal.

#### IoT Monitoring

Perbaikan:

- Realtime connection harus benar-benar auth-aware.
- Tambah anomaly panel dan event realtime.
- Kurangi toast setiap sensor update agar tidak mengganggu.
- Tambah pause live / resume live.
- Chart downsample atau batasi data untuk performa.

Acceptance criteria:

- Live indicator mengikuti socket connected/disconnected, bukan hanya setelah `connectWebSocket()` dipanggil.
- Simulate menghasilkan update tanpa reload manual.
- Anomaly muncul di panel dan notification.

#### Satellite and Drone

Perbaikan:

- Label NDVI simulation/fallback vs real Sentinel Hub.
- Tambah CRUD edit drone flight, bukan hanya create/delete.
- Drone flight DTO backend + form validation client.
- Health summary clickable ke field detail.
- Tambah NDVI empty state.

Acceptance criteria:

- User tahu apakah NDVI berasal dari real API atau simulated fallback.
- Drone flight create/update/delete punya validasi dan confirmation dialog.
- Non-authorized role tidak melihat tombol create/delete.

#### Agronomy

Perbaikan:

- Read More belum berfungsi, perlu modal/detail page.
- Calculator perlu min/max validation.
- Pisahkan FAO reference source vs local rules.
- Tambah tabs responsive dan empty state lebih informatif.

Acceptance criteria:

- Read More membuka detail content lengkap.
- Input pH di luar 0-14 ditolak.
- Result menampilkan satuan dan reasoning.

#### AI Recommendations

Perbaikan:

- Tampilkan input context yang dipakai: weather latest, sensor latest, NDVI latest, crop age.
- Tambah empty prerequisite state jika data belum cukup.
- Tambah compare history dan filter decision type.
- Jangan overclaim AI jika rule-based. Label sebagai "decision support engine" atau "rule-based recommendation".

Acceptance criteria:

- Generate disabled jika field kosong.
- Jika data kurang, sistem memberi instruksi fetch/simulate data.
- History bisa difilter dan expandable dengan keyboard.

#### Notifications

Perbaikan:

- Mark-all-read saat ini hanya update user-specific notifications, sedangkan unread count juga menghitung broadcast `userId: null`. Perlu aturan: broadcast read state per user atau notifikasi global tidak masuk unread per user.
- Delete/mark endpoint belum memastikan ownership user.
- Filter by type/priority UI belum ada meskipun service tersedia.
- Notification bell memakai `window.location.href`, harus pakai React Router navigate.

Acceptance criteria:

- User tidak bisa mark/delete notification milik user lain.
- Broadcast notification read state konsisten.
- Bell update realtime.
- Full page punya filter type/priority/search.

#### Users

Perbaikan:

- Form edit user mengabaikan `user.isActive` dan selalu set active true di state.
- Tidak ada UI untuk toggle active user walaupun backend mendukung `isActive`.
- Delete current logged-in user perlu dicegah atau konfirmasi ekstra.
- Role management perlu visual hierarchy dan RBAC route guard frontend.

Acceptance criteria:

- Admin bisa activate/deactivate user.
- Current admin tidak bisa delete/deactivate dirinya sendiri tanpa flow khusus.
- Manager read-only sesuai backend role.

## Deployment Readiness

### Vercel Frontend

Rekomendasi:

- Tambah `vercel.json` untuk SPA fallback:
  - rewrite semua route ke `/index.html`.
- Env Vercel:
  - `VITE_API_BASE_URL=https://<render-api>/api/v1`
  - `VITE_WS_URL=https://<render-api>`
- Pastikan tidak ada secret di Vite env karena semua `VITE_` masuk bundle client.
- Tambah route lazy loading sebelum deploy agar bundle lebih ringan.

Acceptance criteria:

- Refresh langsung di `/fields/:id`, `/ai`, `/notifications` tidak 404.
- Production frontend memakai URL Render, bukan localhost.
- Tidak ada secret backend di env Vercel.

### Render Backend

Rekomendasi:

- Tambah `render.yaml` atau dokumentasi Render service:
  - Build command: `npm ci && npx prisma generate && npm run build`
  - Pre-deploy command: `npx prisma migrate deploy`
  - Start command: `node dist/main`
- Jangan seed otomatis di setiap start production. Seed hanya manual atau pre-deploy khusus demo.
- Tambah `/api/v1/health` untuk health check.
- Set CORS ke domain Vercel production dan preview yang disetujui.

Acceptance criteria:

- Render deploy tidak menjalankan `prisma db seed` setiap restart.
- Health check sukses tanpa akses database berat.
- Migration deploy berjalan sebelum app start.

### Neon Database

Rekomendasi:

- Gunakan pooled `DATABASE_URL` untuk runtime.
- Gunakan direct `DIRECT_URL` untuk Prisma migration.
- Tambah `directUrl = env("DIRECT_URL")` di Prisma datasource.
- Pastikan `sslmode=require`.

Acceptance criteria:

- Render runtime tidak kehabisan koneksi saat traffic/demo meningkat.
- Prisma migration tetap memakai direct connection.
- `.env.example` menjelaskan format tanpa secret nyata.

## Batch Implementasi Rinci

### Batch 0: Secret Cleanup and Deployment Safety

Tasks:

- Replace `backend/.env.example` dengan placeholder aman.
- Tambah `.gitignore` review untuk `.env`, `.env.*.local`, `dist`, coverage.
- Rotasi semua secret yang pernah ada.
- Tambah README deploy env checklist.

Acceptance criteria:

- Search repo untuk pola API key/SMTP password tidak menemukan secret nyata.
- `.env.example` hanya placeholder.
- Dokumen mencantumkan env Vercel/Render/Neon yang diperlukan.

### Batch 1: Quality Gate

Tasks:

- Tambah ESLint config backend dan frontend.
- Split script `lint` dan `lint:fix`.
- Tambah Prettier config konsisten.
- Tambah test minimal backend.

Acceptance criteria:

- Backend: build, lint, test lulus.
- Frontend: typecheck, lint, build lulus.
- Jest tidak lagi gagal karena no tests.

### Batch 2: Backend DTO and Contract Hardening

Tasks:

- Tambah DTO untuk notifications, monitoring drone flight, growth status, filters.
- Validasi enum dan pagination.
- Hilangkan cast `as any` pada jalur utama.
- Tambah ownership check notification.

Acceptance criteria:

- Invalid payload menghasilkan 400 dengan pesan validasi.
- Swagger schema lengkap untuk semua mutation endpoint.
- Notification user isolation teruji.

### Batch 3: WebSocket and Notification Realtime

Tasks:

- Tambah auth middleware Socket.IO.
- Batasi CORS namespace `/iot`.
- Broadcast sensor anomaly dan new notification.
- Frontend live indicator berdasarkan event socket.

Acceptance criteria:

- Socket tanpa token ditolak.
- Simulate sensor memperbarui chart dan notification bell tanpa refresh.
- Toast update tidak spam.

### Batch 4: Frontend App Shell and Design System

Tasks:

- Buat AppShell sidebar/topbar responsive.
- Buat PageHeader, EmptyState, ErrorState, ConfirmDialog, IconButton, DataTable.
- Replace `window.confirm`.
- Tambah aria-label untuk icon buttons dan modal accessibility baseline.

Acceptance criteria:

- Semua halaman punya header/action layout konsisten.
- Tidak ada action icon tanpa accessible label.
- Mobile 360px, tablet 768px, desktop 1440px tidak overlap.

### Batch 5: Route Performance and Data Layer

Tasks:

- Route lazy loading dengan `React.lazy` dan `Suspense`.
- Manual chunk untuk Recharts/Leaflet jika perlu.
- Tambah TanStack Query atau minimal custom query hook.
- Tambah ErrorBoundary route.

Acceptance criteria:

- Vite build tidak lagi warning chunk utama besar, atau chunk besar sudah dipisah per vendor/route.
- Loading/error/retry konsisten.
- Data mutation invalidation konsisten.

### Batch 6: Page UX Enhancements

Tasks:

- Dashboard empty/error/trend cards.
- Fields search/filter/sort + client validation.
- FieldDetail quick actions.
- Environmental status + better rainfall visualization.
- IoT anomaly panel + pause/resume live.
- Satellite NDVI source badge + drone edit.
- Agronomy read more + calculator validation.
- AI prerequisite state + decision context.
- Notifications filters + realtime.
- Users active toggle + self-protection.

Acceptance criteria:

- Setiap halaman punya no-data experience yang informatif.
- Semua form punya client validation sesuai backend DTO.
- RBAC tombol dan route sesuai backend role.

### Batch 7: Hosting Configuration

Tasks:

- Tambah `vercel.json` SPA fallback.
- Tambah `render.yaml` atau deploy docs.
- Tambah health endpoint.
- Tambah Prisma `directUrl`.
- Tambah production CORS env.

Acceptance criteria:

- Frontend deployed bisa refresh nested route.
- Backend deployed menjalankan migration sebelum start.
- Neon pooled/direct URL terdokumentasi.
- Health check tersedia untuk Render.

### Batch 8: Final Portfolio Polish

Tasks:

- Tambah demo data mode badge.
- Tambah dashboard "System Status".
- Tambah screenshots/GIF untuk README.
- Tambah seed demo yang stabil.
- Tambah final QA checklist.

Acceptance criteria:

- Recruiter/evaluator bisa login, melihat data demo, mencoba simulate/fetch/generate tanpa setup rumit.
- README menjelaskan fitur nyata vs demo simulation secara jujur.
- Semua command lokal dan deploy tercatat.

## Definition of Done Global

- Backend build, lint, test lulus.
- Frontend typecheck, lint, build lulus.
- Tidak ada secret nyata di repo.
- Semua protected API butuh token dan role sesuai domain.
- Semua mutation endpoint punya DTO validasi.
- Frontend semua halaman punya loading, empty, error, success, dan retry state.
- Mobile 360px, tablet 768px, desktop 1440px lulus visual QA.
- Vercel frontend dan Render backend memakai env production yang benar.
- Neon memakai pooled runtime URL dan direct migration URL.
- README portfolio menjelaskan cara demo dan batasan data simulasi.
