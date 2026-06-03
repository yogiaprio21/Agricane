# Dokumentasi Modul Users

## Deskripsi Umum

Modul Users menyediakan CRUD user aplikasi (Admin, Agronomist, Drone Operator, Technician, Manager). Akses endpoint dilindungi JWT dan RBAC.

## Struktur File

- Controller: [users.controller.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/users/users.controller.ts)
- Service: [users.service.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/users/users.service.ts)
- Module: [users.module.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/users/users.module.ts)
- DTO: [users.dto.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/users/dto/users.dto.ts)

## Ringkasan Logika

- `UsersController`:
  - `POST /users` (Admin): buat user baru.
  - `GET /users` (Admin, Manager): list user.
  - `GET /users/:id` (Admin, Manager): detail user.
  - `PATCH /users/:id` (Admin): update user.
  - `DELETE /users/:id` (Admin): hapus user.
- `UsersService`:
  - `create`:
    - Cek email unik.
    - Hash password dengan bcrypt.
    - Set `role` default TECHNICIAN jika tidak diisi, `isActive` default true.
  - `findAll`: mengembalikan subset field (tanpa password).
  - `findOne`: by ID, lempar `NotFoundException` jika tidak ada.
  - `update`:
    - Validasi email tidak bentrok user lain.
    - Jika password baru ada, di‑hash.
  - `remove`: delete user setelah memastikan user ada.

## Fungsi Utama

- UsersService.create(dto: CreateUserDto)
- UsersService.findAll()
- UsersService.findOne(id: string)
- UsersService.update(id: string, dto: UpdateUserDto)
- UsersService.remove(id: string)
- UsersService.findByEmail(email: string)

## Alur Kerja & Dependency

- Menggunakan `PrismaService.user` untuk operasi `findMany`, `findUnique`, `create`, `update`, `delete`.
- Berjalan di atas guard global JwtAuthGuard & RolesGuard (di AppModule).
- Role di DTO menggunakan enum `Role` dari [role.enum.ts](file:///d:/PROJECT/AWAL/Agricane/backend/src/common/enums/role.enum.ts).

## Konfigurasi Penting

- Tidak ada env khusus; semua konfigurasi berasal dari schema Prisma:
  - Tabel `users` dengan field `role`, `isActive`, `createdAt`, `updatedAt`.

## Contoh Kode

```ts
// Membuat user baru (service)
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
const user = await this.prisma.user.create({
  data: {
    ...createUserDto,
    password: hashedPassword,
    role: createUserDto.role || 'TECHNICIAN',
    isActive: createUserDto.isActive ?? true,
  },
});
```

## Catatan Khusus

- Password hanya di‑hash saat create/update; tidak ada fitur reset password di modul ini.
- Validasi email unik dilakukan manual sebelum create/update; perubahan schema atau concurrent request perlu dipertimbangkan jika beban tinggi.  
