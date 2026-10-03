# Library Loan REST API

REST API sederhana untuk pencatatan peminjaman buku perpustakaan.

## Teknologi

- Node.js
- Express.js
- Supabase
- Vercel

## Fitur

- Create data peminjaman
- Read seluruh data peminjaman
- Read data berdasarkan ID
- Update data peminjaman
- Delete data peminjaman
- Filter berdasarkan status
- Filter berdasarkan nama anggota
- Filter berdasarkan judul buku

## Struktur Project

```text
library-loan-api/
-database/
  -schema.sql
-src/
  -app.js
  -supabase.js
-.env.example
-.gitignore
-index.js
-package.json
-README.md
-vercel.json
```

## Schema Data

Tabel: `loans`

| Field       | Tipe        | Keterangan                          |
|---          |---          |---                                  |
| id          | bigint      | Primary key                         |
| member_name | varchar(100)| Nama anggota                        |
| book_title  | varchar(200)| Judul buku                          |
| loan_date   | date        | Tanggal peminjaman                  |
| due_date    | date        | Batas pengembalian                  |
| return_date | date/null   | Tanggal pengembalian                |
| status      | varchar(20) | Dipinjam / Dikembalikan / Terlambat |
| created_at  | timestamptz | Waktu data dibuat                   |
| updated_at  | timestamptz | Waktu data diperbarui               |

## 1. Setup Supabase

1. Buat project baru di Supabase.
2. Buka SQL Editor.
3. Buka file `database/schema.sql`.
4. Copy seluruh isi file.
5. Jalankan query tersebut di Supabase.

Setelah selesai, tabel `loans` akan tersedia.

## 2. Setup Environment Variable

Copy `.env.example` menjadi `.env`.

Windows CMD:

```bash
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Isi:

```env
SUPABASE_URL=https://PROJECT_ID.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxx
PORT=3000
```

## 3. Install Dependency

Pastikan Node.js 22 sudah terinstall.

```bash
npm install
```

## 4. Jalankan Lokal

```bash
npm run dev
```

API dapat diakses melalui:

```text
http://localhost:3000
```

Cek:

```text
http://localhost:3000/health
```

## Endpoint

| Method | Endpoint     | Fungsi                        |
|---     |---           |---                            |
| GET    | `/loans`     | Mengambil semua data          |
| GET    | `/loans/:id` | Mengambil data berdasarkan ID |
| POST   | `/loans`     | Menambah data                 |
| PUT    | `/loans/:id` | Mengubah data                 |
| PATCH  | `/loans/:id` | Mengubah sebagian data        |
| DELETE | `/loans/:id` | Menghapus data                |

## Filter

Status:

```http
GET /loans?status=Terlambat
```
contoh response:
{
    "success": true,
    "count": 1,
    "data": [
        {
            "id": 5,
            "member_name": "Danish Alfarisy",
            "book_title": "PPB",
            "loan_date": "2026-10-01",
            "due_date": "2026-10-08",
            "return_date": null,
            "status": "Terlambat",
            "created_at": "2026-10-03T14:29:43.003081+00:00",
            "updated_at": "2026-10-03T14:29:43.003081+00:00"
        }
    ]
}


Nama anggota:

```http
GET /loans?member_name=Yassar
```
contoh response: 
{
    "success": true,
    "count": 1,
    "data": [
        {
            "id": 3,
            "member_name": "Yassar Fawwas Hernando",
            "book_title": "Praktikum PPB",
            "loan_date": "2026-09-10",
            "due_date": "2026-09-17",
            "return_date": "2026-09-16",
            "status": "Dikembalikan",
            "created_at": "2026-10-03T13:43:49.069164+00:00",
            "updated_at": "2026-10-03T13:43:49.069164+00:00"
        }
    ]
}


Judul buku:

```http
GET /loans?book_title=PPB
```
contoh response:
{
    "success": true,
    "count": 1,
    "data": [
        {
            "id": 5,
            "member_name": "Danish Alfarisy",
            "book_title": "PPB",
            "loan_date": "2026-10-01",
            "due_date": "2026-10-08",
            "return_date": null,
            "status": "Terlambat",
            "created_at": "2026-10-03T14:29:43.003081+00:00",
            "updated_at": "2026-10-03T14:29:43.003081+00:00"
        }
    ]
}

Filter dapat digabung:

```http
GET /loans?status=Dipinjam&member_name=Yassar
```
contoh response:
{
    "success": true,
    "count": 1,
    "data": [
        {
            "id": 6,
            "member_name": "Yassar Fawwas Hernando",
            "book_title": "Praktikum PPB",
            "loan_date": "2026-10-01",
            "due_date": "2026-10-08",
            "return_date": null,
            "status": "Dipinjam",
            "created_at": "2026-10-03T14:33:54.653994+00:00",
            "updated_at": "2026-10-03T14:33:54.653994+00:00"
        }
    ]
}

## Contoh CREATE

Request:

```http
POST /loans
Content-Type: application/json
```

Body:

```json
{
  "member_name": "Yassar Fawwas Hernando",
  "book_title": "Praktikum PPB",
  "loan_date": "2026-10-01",
  "due_date": "2026-10-08",
  "status": "Dipinjam"
}
```

Contoh response:

```json
{
  "success": true,
  "message": "Data peminjaman berhasil ditambahkan.",
  "data": {
    "id": 4,
    "member_name": "Yassar Fawwas Hernando",
    "book_title": "Praktikum PPB",
    "loan_date": "2026-10-01",
    "due_date": "2026-10-08",
    "return_date": null,
    "status": "Dipinjam"
  }
}
```

## Contoh UPDATE

```http
PUT /loans/4
Content-Type: application/json
```

```json
{
  "return_date": "2026-10-07",
  "status": "Dikembalikan"
}
```
contoh response:
{
    "success": true,
    "message": "Data peminjaman berhasil diperbarui.",
    "data": {
        "id": 2,
        "member_name": "Danish Alfarisy",
        "book_title": "PPB",
        "loan_date": "2026-09-20",
        "due_date": "2026-09-27",
        "return_date": "2026-10-07",
        "status": "Dikembalikan",
        "created_at": "2026-10-03T13:43:49.069164+00:00",
        "updated_at": "2026-10-03T14:22:25.495+00:00"
    }
}

## Contoh DELETE

```http
DELETE /loans/4
```
contoh response:
{
    "success": true,
    "message": "Data peminjaman berhasil dihapus.",
    "data": {
        "id": 4,
        "member_name": "Yassar Fawwas Hernando",
        "book_title": "Praktikum PPB",
        "loan_date": "2026-10-01",
        "due_date": "2026-10-08",
        "return_date": null,
        "status": "Dipinjam",
        "created_at": "2026-10-03T13:53:01.297106+00:00",
        "updated_at": "2026-10-03T13:53:01.297106+00:00"
    }
}

## Link Deployment

```Link Vercel
https://responsippbmod1-eight.vercel.app/
```
