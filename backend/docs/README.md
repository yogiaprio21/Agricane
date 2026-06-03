# Backend AgriCane — Gambaran Umum

Dokumentasi teknis komprehensif untuk memahami arsitektur, logika, dan implementasi backend AgriCane sehingga Anda dapat menulis ulang kode dengan akurasi tinggi.

## Ringkasan Teknis

- Stack: NestJS 10, TypeScript, Prisma ORM (PostgreSQL), Axios, Socket.IO, Swagger.
- Pola: Modular (Controller → Service → Prisma), guard JWT global, RBAC via decorator, filter global untuk error, cron untuk pekerjaan terjadwal, cache in‑memory untuk API eksternal.

## Struktur Direktori

```
backend/
├── src/
│   ├── auth/            # Autentikasi JWT & RBAC
│   ├── users/           # CRUD user
│   ├── fields/          # CRUD lahan + umur tanaman
│   ├── environmental/   # OpenWeather integrasi + cron
│   ├── agronomy/        # Referensi FAO & guideline
│   ├── iot/             # Sensor tanah REST + WebSocket
│   ├── monitoring/      # NDVI & drone
│   ├── ai-decision/     # Keputusan AI
│   ├── notifications/   # Notifikasi sistem/user
│   ├── common/          # Filter & enums
│   ├── config/          # Konfigurasi environment
│   ├── prisma/          # Modul Prisma service
│   ├── app.module.ts    # Registrasi modul & guard/filter
│   └── main.ts          # Bootstrap Nest, Swagger, CORS
├── prisma/
│   ├── schema.prisma    # Definisi model DB
│   └── seed.ts          # Seed data awal
└── docs/                # Dokumentasi teknis
    ├── architecture.md  # Diagram & relasi antar modul
    ├── auth.md
    ├── users.md
    ├── fields.md
    ├── environmental.md
    ├── agronomy.md
    ├── iot.md
    ├── monitoring.md
    ├── ai-decision.md
    ├── notifications.md
    └── common-config-prisma.md
```

## Cara Menggunakan Dokumentasi

- Baca `architecture.md` untuk melihat keseluruhan arsitektur dan relasi modul.
- Buka masing‑masing dokumen modul untuk:
  - Deskripsi umum & tanggung jawab,
  - Struktur file & peran,
  - Ringkasan logika, fungsi utama (parameter & return),
  - Alur kerja (import/export, dependency),
  - Variabel environment & konfigurasi penting,
  - Contoh kode terpilih,
  - Catatan khusus (potensi bug/asumsi/optimasi),
  - Diagram Mermaid untuk logika kompleks bila diperlukan.

## Versi Dependensi Relevan

- NestJS ^10.3.0
- Prisma ^5.8.0, @prisma/client ^5.8.0
- @nestjs/config ^3.1.1
- @nestjs/jwt ^10.2.0, passport‑jwt ^4.0.1
- socket.io ^4.6.1
- axios ^1.6.5
- date‑fns ^3.2.0
- class‑validator ^0.14.1, class‑transformer ^0.5.1

## Highlight Kode yang Berpotensi Generated AI

- Simulasi NDVI (`MonitoringService.fetchNDVIForField`) dan simulasi sensor (`IotService.simulateSensorData`).
- Heuristik threshold & explanatory text di `AiDecisionService` untuk keputusan irigasi, panen, dan risiko.

