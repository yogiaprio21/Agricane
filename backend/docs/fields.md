# Dokumentasi Modul Fields

## Deskripsi Umum

Modul Fields mengelola data blok lahan tebu: koordinat, luas, varietas, tanggal tanam, status pertumbuhan, serta menggabungkan data terkait (sensor, cuaca, NDVI).

## Struktur File

- Controller: [fields.controller.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/fields/fields.controller.ts)
- Service: [fields.service.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/fields/fields.service.ts)
- Module: [fields.module.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/fields/fields.module.ts)
- DTO: [field.dto.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/fields/dto/field.dto.ts)

## Ringkasan Logika

- `FieldsController`:
  - `POST /fields`: buat field baru (Admin, Agronomist, Manager).
  - `GET /fields`: list field (dapat difilter `growthStatus`).
  - `GET /fields/:id`: detail field + data terkait.
  - `PATCH /fields/:id`: update field.
  - `PATCH /fields/:id/growth-status`: update khusus status pertumbuhan.
  - `DELETE /fields/:id`: hapus field (Admin).
- `FieldsService`:
  - Pada semua operasi read/write mengembalikan field dengan tambahan `cropAgeDays` (umur tanaman dalam hari).
  - `findOne` menggunakan `include` untuk join:
    - `sensorReadings` (10 terakhir),
    - `weatherData` (5 terakhir),
    - `ndviData` (5 terakhir).
  - `getFieldsForWeatherUpdate`: mengembalikan subset field (id, name, lat, lon) untuk cron cuaca.
  - `getFieldsByGrowthStatus`: filter fields berdasarkan `growthStatus`.

## Fungsi Utama

- FieldsService.create(dto: CreateFieldDto)
- FieldsService.findAll()
- FieldsService.findOne(id: string)
- FieldsService.update(id: string, dto: UpdateFieldDto)
- FieldsService.updateGrowthStatus(id: string, status: string)
- FieldsService.remove(id: string)
- FieldsService.getFieldsForWeatherUpdate()
- FieldsService.getFieldsByGrowthStatus(status: string)

## Alur Kerja

- DTO menggunakan `GrowthStatus` enum dari [role.enum.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/common/enums/role.enum.ts).
- Service memanfaatkan `differenceInDays` (date‑fns) untuk menghitung umur tanaman:

```ts
private enrichFieldWithCropAge(field: any) {
  const cropAgeDays = differenceInDays(new Date(), new Date(field.plantingDate));
  return { ...field, cropAgeDays };
}
```

- Karena `cropAgeDays` diturunkan setiap kali, DB tidak menyimpan umur tanaman secara eksplisit → menghindari inkonsistensi.

## Konfigurasi Penting

- Schema Prisma `Field` di [schema.prisma](file:///d:/PROJECT/AWAL/Agricane/backend/prisma/schema.prisma#L65-L84) menentukan field yang harus diisi saat create.

## Catatan Khusus

- Semua operasi update/delete memanggil `findOne` dulu untuk memastikan field ada; pola ini membuat pesan error konsisten tapi menambah 1 query ekstra.
