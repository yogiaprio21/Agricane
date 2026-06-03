# AgriCane Current Audit and Next Batch Implementation Plan

Tanggal audit: 2026-06-03

Scope: diagnosis `npm run start`, integrasi backend NestJS/Prisma, integrasi API eksternal, AI decision support, frontend React/Vite/Tailwind, dan kesiapan Vercel/Render/Neon.

## 1. Diagnosis Error Start

Error user:

```text
Error: Cannot find module './dto/auth.dtos'
Require stack:
- backend\dist\auth\auth.controller.js
```

Status source saat audit:

- Source DTO ada di `backend/src/auth/dto/auth.dtos.ts`.
- Artefak build saat ini juga sudah berisi `backend/dist/auth/dto/auth.dtos.js`.
- `backend/nest-cli.json` sudah punya `compilerOptions.deleteOutDir: true`.

Kesimpulan:

- Error tersebut paling mungkin terjadi karena `dist` lama/stale saat `npm run start` dijalankan. File compiled `auth.controller.js` mencoba memuat `./dto/auth.dtos`, tetapi folder `dist/auth/dto` belum terbentuk pada build yang sedang dipakai.
- Setelah clean build, error DTO seharusnya hilang.
- Ada blocker berikutnya yang perlu dibereskan: `backend/src/environmental/*` dan `backend/src/monitoring/*` mengimpor `@nestjs/cache-manager`, tetapi dependency itu belum ada di `backend/package.json`, `package-lock.json`, dan `backend/node_modules`.

Perintah pemulihan lokal:

```powershell
cd D:\PROJECT\AWAL\Agricane\backend
Remove-Item -Recurse -Force .\dist
npm install @nestjs/cache-manager cache-manager
npm run build
npm run start
```

Acceptance criteria:

- `npm run build` membuat `dist/auth/dto/auth.dtos.js`.
- `npm run start` tidak lagi gagal pada `./dto/auth.dtos`.
- Runtime tidak gagal pada `Cannot find module '@nestjs/cache-manager'`.
- `/api/v1/health` merespons setelah server start.

## 2. Status Implementasi Saat Ini

Sudah selesai dari batch sebelumnya:

- Secret placeholder, `.gitignore`, deployment checklist, `render.yaml`, dan `frontend/vercel.json`.
- ESLint/Prettier baseline, beberapa unit test backend, DTO hardening untuk field/drone/notification.
- WebSocket `/iot` memakai token JWT dan room user/field.
- Notification bell sudah memakai router navigation.
- App shell responsive, `PageHeader`, `IconButton`, `EmptyState`, `ErrorState`, `ConfirmDialog`.
- Route lazy loading dan Vite manual chunks.
- Beberapa validasi form frontend untuk fields/users/satellite.
- Prisma datasource sudah memakai `directUrl = env("DIRECT_URL")`.

Belum selesai / perlu batch berikutnya:

- Dependency cache Nest belum tercatat di package manifest.
- Env validation belum ada, sehingga production masih bisa start dengan env penting kosong.
- FAO integration masih placeholder `/guidelines`, bukan kontrak FAOSTAT yang jelas.
- AI recommendation masih mencampur data nyata dan simulasi, terutama irrigation decision memanggil `simulateSensorData()` otomatis.
- External API status belum terlihat di UI dan belum ada endpoint status integrasi.
- Query pagination/filter belum standar di endpoint time-series.
- Modal belum punya focus trap dan Escape close yang lengkap.
- Data table mobile masih overflow biasa, belum card-list/sticky action.
- Banyak page masih fetch manual dan belum punya retry/error state konsisten.
- Desain masih dominan card putih + primary green; perlu system visual yang lebih matang tanpa terlihat template.

## 3. Audit Backend

### Start and Dependency Integrity

Finding:

- `@nestjs/cache-manager` dipakai tetapi tidak terdaftar sebagai dependency. Dokumentasi Nest menyatakan caching perlu instalasi `@nestjs/cache-manager` bersama `cache-manager`.

Implementation:

- Tambahkan dependency melalui `npm install @nestjs/cache-manager cache-manager`.
- Pastikan lockfile berubah dan build menggunakan dependency yang tercatat.
- Tambah smoke test module import untuk `EnvironmentalModule` dan `MonitoringModule`.

Acceptance criteria:

- `package.json` dan `package-lock.json` memuat `@nestjs/cache-manager`.
- `npm ci && npm run build` berhasil di mesin bersih.
- Start production tidak bergantung pada node_modules lama lokal.

### Configuration and Production Guardrails

Finding:

- `ConfigModule.forRoot()` belum memakai validation schema.
- Secret wajib seperti `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `OPENWEATHER_API_KEY`, `CORS_ORIGIN`, dan `DIRECT_URL` belum divalidasi.
- CORS sudah berbasis env, tetapi belum ada validasi domain production.

Implementation:

- Tambah `joi` atau Zod env validation.
- Bedakan env required untuk development dan production.
- Tambah `disableErrorMessages` pada `ValidationPipe` untuk production.
- Gating Swagger untuk production atau beri proteksi sederhana.

Acceptance criteria:

- App gagal start dengan pesan jelas jika env wajib kosong.
- Production tidak memakai fallback secret/default.
- Swagger production hanya aktif jika `ENABLE_SWAGGER=true` atau terlindungi.
- CORS production hanya menerima domain Vercel yang diizinkan.

### External API Integration

Finding:

- OpenWeather current weather dan forecast sudah mengikuti pola lat/lon + `appid` + `units=metric`.
- Sentinel Hub Statistical API digunakan untuk NDVI, tetapi payload memakai bbox kecil dari titik field, belum polygon field.
- FAO service masih memanggil endpoint placeholder `/guidelines`, lalu fallback local rules.
- Fallback simulation belum selalu ditandai jelas di API response dan UI.

Implementation:

- Tambah `IntegrationStatusService` untuk OpenWeather, Sentinel Hub, SMTP, database.
- Standarkan response metadata: `sourceType: LIVE | CACHE | FALLBACK | SIMULATED`, `provider`, `fetchedAt`, `errorCode`.
- Untuk Sentinel Hub, simpan `source` dan `metadata.apiStatus` secara eksplisit.
- Untuk FAO, ubah label menjadi local agronomy knowledge jika belum memakai endpoint FAOSTAT nyata.
- Tambah retry/backoff ringan untuk external API yang transient.

Acceptance criteria:

- External API gagal tidak membuat halaman utama blank.
- Response NDVI/weather/recommendation menyatakan sumber data nyata, cache, fallback, atau simulated.
- UI menampilkan badge source secara konsisten.
- FAO tidak overclaim sebagai data live jika masih fallback local rules.

### AI Decision Support

Finding:

- `generateIrrigationDecision()` otomatis membuat data sensor simulasi sebelum rekomendasi. Ini berguna untuk demo, tetapi buruk untuk klaim "AI rekomendasi tepat" karena data input berubah tanpa user sadari.
- Engine saat ini rule-based, bukan LLM/ML. Ini masih layak untuk portfolio jika dilabeli sebagai decision support/rule engine.

Implementation:

- Pisahkan mode `demo=true` untuk simulasi.
- Default production memakai latest real sensor/weather/NDVI, dan gagal dengan prerequisite state jika data kurang.
- Simpan snapshot input lengkap di `contextData`.
- Tambah confidence rationale: kualitas data, usia data, source data, dan jumlah data points.
- Tambah endpoint `GET /ai-decision/prerequisites/:fieldId`.

Acceptance criteria:

- Generate decision tidak membuat data simulasi kecuali request eksplisit demo.
- Jika data kurang, API mengembalikan 409/422 dengan daftar data yang perlu dilengkapi.
- Setiap decision menyimpan input snapshot dan source metadata.
- UI menampilkan "Rule-based recommendation" atau "Decision support engine", bukan klaim AI generatif berlebihan.

### API Contract and Clean Architecture

Finding:

- Struktur saat ini adalah modular service architecture, belum clean architecture penuh.
- Controller -> Service -> Prisma langsung masih valid untuk portfolio, tetapi untuk klaim clean architecture perlu boundary lebih jelas.

Implementation:

- Tambah DTO query standar untuk pagination/filter di fields, notifications, iot, monitoring, ai history.
- Tambah mapper response untuk modul utama agar frontend tidak bergantung pada shape Prisma mentah.
- Buat repository hanya untuk modul kompleks: fields, monitoring, notifications, ai-decision.
- Jangan refactor semua sekaligus; lakukan per modul dengan test.

Acceptance criteria:

- Endpoint list punya `page`, `limit`, `sort`, dan filter tervalidasi.
- Response API konsisten: `data`, `meta`, `message` untuk list yang dipaginasi.
- Tidak ada cast enum/domain `as any` pada jalur request utama.
- Refactor tidak mengubah kontrak frontend tanpa update service types.

## 4. Audit Frontend

### Design System and Layout

Finding:

- App shell sudah jauh lebih baik, tetapi komponen masih dasar: Button belum punya loading/leftIcon/rightIcon/fullWidth, Input belum punya error/helperText/min/max, Modal belum punya focus trap.
- Card terlalu dominan dan banyak section terasa "panel putih". Perlu hierarchy dashboard yang lebih jelas: toolbar, summary strip, content section, table/card hybrid.

Implementation:

- Upgrade primitives: `Button`, `Input`, `Select`, `Card`, `StatCard`, `SectionHeader`, `DataToolbar`, `DataTable`, `ResponsiveTable`, `SourceBadge`.
- Tambah focus trap dan Escape close di Modal.
- Ubah card radius ke 8px atau kurang dan kurangi shadow berat.
- Buat page layout pattern:
  - Header: title, description, primary action.
  - Toolbar: filter/search/source/status.
  - Summary: KPI compact.
  - Main content: chart/map/table.
  - Detail/empty/error states.

Acceptance criteria:

- Semua form menampilkan error per field, bukan hanya alert global.
- Semua button mutation punya loading/disabled state.
- Modal bisa ditutup dengan Escape dan focus kembali ke trigger.
- Tidak ada section yang hanya berupa card bertumpuk tanpa hierarchy jelas.

### Responsive Tables, Maps, Charts

Finding:

- Tabel masih `overflow-x-auto`; cukup aman tetapi kurang optimal di mobile.
- Map memakai fixed height 400px dan belum handle resize/invalidate saat layout berubah.
- Recharts sudah memakai `ResponsiveContainer`, tetapi label chart bisa padat di mobile.

Implementation:

- Buat responsive table: desktop table, mobile stacked card list.
- Sticky action column untuk desktop table yang banyak kolom.
- Map container memakai height responsif dan `min-h`, serta invalidate size saat container terlihat.
- Chart mobile menyederhanakan ticks/legend dan memberi empty state ketika data nol.

Acceptance criteria:

- 360px viewport tidak membutuhkan horizontal scroll untuk aksi utama.
- Map terlihat proporsional di 360px, 768px, dan 1440px.
- Chart tidak menimpa label/tick/legend di mobile.
- Empty chart state tampil saat semua series kosong.

### Page Redesign Priorities

Batch UI berikutnya:

1. Dashboard: system status, source badges, attention list, empty chart guard.
2. Fields: search/filter/sort, responsive field cards, map source and selected field panel.
3. Field Detail: quick actions, per-section status, timeline ringkas.
4. Environmental: live/cache/fallback status, forecast cards, rainfall visualization.
5. IoT: true socket status, pause/resume live, anomaly panel.
6. Satellite: NDVI source badge, drone edit flow, health trend summary.
7. AI: prerequisite panel, decision context, clear rule-based label.
8. Notifications: filter/search, read-state consistency, realtime status.
9. Users: account status, self-protection, role route guard.
10. Agronomy: tabs/detail modal, calculator validation, source transparency.

Acceptance criteria:

- Semua halaman punya loading, empty, error, success, retry state.
- Mobile 360px, tablet 768px, desktop 1440px tidak overlap dan tidak ada teks keluar container.
- Semua icon-only action punya `aria-label`.
- RBAC frontend menyembunyikan/menonaktifkan aksi sesuai backend role.

## 5. Next Implementation Batches

### Batch 8: Start Fix and Dependency Lock

Tasks:

- Install `@nestjs/cache-manager`.
- Clean build backend.
- Jalankan start smoke test.
- Tambah troubleshooting note untuk stale `dist`.

Acceptance criteria:

- `npm ci` dari fresh checkout menghasilkan dependency lengkap.
- `npm run build` dan `npm run start` tidak gagal import module.
- Health endpoint bisa diakses.

### Batch 9: Env Validation and Integration Status

Tasks:

- Tambah env validation.
- Tambah integration status endpoint.
- Tambah source metadata untuk weather/NDVI/AI.

Acceptance criteria:

- Missing env menghasilkan startup error yang jelas.
- UI/API bisa membedakan live/cache/fallback/simulated.
- External API failure ter-handle sebagai status, bukan blank page.

### Batch 10: AI Decision Prerequisite and Demo Mode

Tasks:

- Pisahkan simulation dari generate decision.
- Tambah prerequisite endpoint.
- Tambah decision context snapshot.
- Update frontend AI page.

Acceptance criteria:

- Production decision tidak membuat sensor reading acak.
- User mendapat arahan data yang kurang.
- History decision menjelaskan input dan kualitas data.

### Batch 11: API Pagination and Response Contract

Tasks:

- Tambah pagination DTO.
- Terapkan ke notifications, fields, iot history, ndvi history, ai history.
- Update frontend service types.

Acceptance criteria:

- Endpoint list besar tidak mengambil semua data tanpa limit.
- Response list punya metadata pagination.
- Frontend tetap kompatibel dan build typecheck lulus.

### Batch 12: Frontend Design System Upgrade

Tasks:

- Upgrade Button/Input/Select/Modal/Card.
- Tambah DataToolbar, ResponsiveTable, StatCard, SourceBadge.
- Terapkan ke Fields, Users, Notifications.

Acceptance criteria:

- Form punya field-level validation.
- Mobile table berubah menjadi card list.
- Modal keyboard baseline terpenuhi.

### Batch 13: Dashboard, Fields, Environmental Redesign

Tasks:

- Redesign dashboard summary/status/attention.
- Redesign fields map/table/filter.
- Redesign environmental weather/forecast/stats.

Acceptance criteria:

- Tiap page tetap berguna saat data kosong.
- Source badge tampil untuk data eksternal.
- Visual QA desktop/tablet/mobile lulus.

### Batch 14: IoT, Satellite, AI Redesign

Tasks:

- IoT live state dan anomaly panel.
- Satellite source transparency dan drone edit.
- AI prerequisite/context/history filter.

Acceptance criteria:

- Socket status merefleksikan connect/disconnect aktual.
- NDVI fallback tidak disamarkan sebagai live API.
- Generate AI mengikuti prerequisite.

### Batch 15: Final Deploy QA

Tasks:

- Jalankan backend build/lint/test/start smoke.
- Jalankan frontend typecheck/lint/build/preview smoke.
- QA responsive 360/768/1440.
- Review env Vercel/Render/Neon.

Acceptance criteria:

- Semua command validasi lulus.
- Refresh nested route Vercel tidak 404.
- Render menjalankan migration deploy sebelum start.
- README menjelaskan demo credentials, env, dan data source.

## 6. Referensi Resmi

- NestJS ValidationPipe: https://docs.nestjs.com/techniques/validation
- NestJS Configuration validation: https://docs.nestjs.com/techniques/configuration
- NestJS Caching: https://docs.nestjs.com/techniques/caching
- NestJS WebSocket gateways/guards: https://docs.nestjs.com/websockets/gateways
- Socket.IO middleware/auth: https://socket.io/docs/v4/middlewares/
- OpenWeather current weather: https://openweathermap.org/api/current
- Sentinel Hub Statistical API: https://docs.sentinel-hub.com/api/latest/api/statistical/
- Prisma Neon guide: https://docs.prisma.io/docs/v6/orm/overview/databases/neon
- Render Prisma deployment: https://render.com/docs/deploy-prisma-orm/
- React lazy: https://react.dev/reference/react/lazy
- Tailwind responsive design: https://tailwindcss.com/docs/breakpoints
- Vite env variables: https://vite.dev/guide/env-and-mode.html
- Vercel Vite deployment: https://vercel.com/docs/frameworks/vite
