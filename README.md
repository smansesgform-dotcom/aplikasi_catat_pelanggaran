# Aplikasi Pencatat Pelanggaran Siswa

Aplikasi web modern untuk mencatat dan mengelola data pelanggaran siswa di lingkungan sekolah. Dibangun dengan antarmuka yang responsif dan intuitif, aplikasi ini memudahkan guru dan staf administrasi untuk memantau perilaku siswa secara efisien. Aplikasi ini siap di-deploy ke Vercel dan dihubungkan dengan Supabase sebagai backend.

## Fitur Utama

- **Sistem Otentikasi**:
  - **Login Guru (via Google)**: Guru dapat masuk menggunakan akun Google mereka. Akses diberikan jika email mereka terdaftar di database guru.
  - **Login Admin Khusus**: Akun admin super dapat login menggunakan kata sandi khusus yang disimpan di _environment variable_, memberikan akses penuh ke panel admin.
- **Rute Terlindungi**: Halaman pencatatan, laporan, dan administrasi hanya dapat diakses setelah login.
- **Pencatatan Pelanggaran**:
  - Memungkinkan pencatatan pelanggaran untuk satu atau beberapa siswa sekaligus.
  - Dapat memilih lebih dari satu jenis pelanggaran dalam satu entri.
  - **Bukti Foto**: Pengguna dapat mengunggah foto dari galeri atau mengambil foto langsung dari kamera perangkat. Gambar secara otomatis dioptimalkan (<100KB) sebelum diunggah.
- **Laporan Komprehensif**:
    - Halaman laporan dengan filter berdasarkan rentang tanggal, kelas, siswa, jenis pelanggaran, dan guru pelapor.
    - Menampilkan **Laporan Rinci** (log kronologis) dan **Ringkasan Siswa** (agregat poin).
    - Laporan dapat diunduh dalam format **Excel** (dengan dua sheet) dan **PDF** (siap cetak).
- **Panel Admin**:
  - Halaman khusus admin untuk mengelola data master.
  - Admin dapat mengunggah data siswa, guru, dan jenis pelanggaran secara massal menggunakan file Excel.
  - Template Excel disediakan untuk meminimalisir kesalahan input.
  - **Manajemen Data**: Fitur untuk backup, restore, dan hapus massal data dengan konfirmasi kata sandi untuk keamanan.

## Teknologi yang Digunakan

- **Frontend**: React, TypeScript
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Excel Handling**: `xlsx` (SheetJS)
- **PDF Generation**: `jspdf` & `jspdf-autotable`

---

## 🚀 Supabase Setup (Penting!)

Untuk menjalankan aplikasi ini dengan backend sungguhan, Anda perlu menyiapkan proyek di [Supabase](https://supabase.com/). Ikuti langkah-langkah berikut:

### 1. Buat Proyek Supabase
- Daftar atau masuk ke akun Supabase Anda.
- Buat proyek baru. Simpan **Project URL** dan **anon public key** Anda.

### 2. Buat Tabel Database
- Buka **SQL Editor** di dashboard Supabase Anda.
- Jalankan skrip SQL berikut untuk membuat semua tabel yang diperlukan:

```sql
-- Tabel untuk menyimpan data siswa
CREATE TABLE students (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nipd TEXT NOT NULL UNIQUE,
  nisn TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
  class TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk menyimpan data guru
CREATE TABLE teachers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  nip TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk menyimpan jenis-jenis pelanggaran dan poinnya
CREATE TABLE violations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  points INT NOT NULL CHECK (points > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel utama untuk mencatat setiap insiden pelanggaran
CREATE TABLE violation_records (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  teacher_id BIGINT NOT NULL REFERENCES teachers(id),
  student_ids INT[] NOT NULL, -- Array of student IDs
  violation_ids INT[] NOT NULL, -- Array of violation IDs
  photo_urls TEXT[], -- Array of photo URLs
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) untuk semua tabel
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_records ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS: Izinkan pengguna terotentikasi untuk membaca semua data
CREATE POLICY "Allow authenticated read access" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON violations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON violation_records FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan RLS: Izinkan pengguna terotentikasi untuk menambah data baru
CREATE POLICY "Allow authenticated insert" ON violation_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON teachers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON violations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Kebijakan RLS: Izinkan pengguna terotentikasi untuk menghapus data (diperlukan untuk fitur restore/delete di panel admin)
CREATE POLICY "Allow authenticated delete" ON students FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON teachers FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON violations FOR DELETE USING (auth.role() = 'authenticated');
```

### 3. Konfigurasi Otentikasi
- Buka **Authentication -> Providers** di dashboard Supabase.
- Aktifkan provider **Google**.
- Ikuti instruksi untuk mendapatkan **Client ID** dan **Client Secret** dari Google Cloud Console.
- **PENTING**: Masuk ke **Authentication -> URL Configuration** dan tambahkan URL Vercel Anda (misalnya `https://nama-proyek-anda.vercel.app`) ke **Redirect URLs**.

### 4. Konfigurasi Storage
- Buka **Storage** di dashboard Supabase.
- Buat **Bucket** baru dengan nama `evidence`.
- **PENTING**: Biarkan bucket ini **PRIVATE** (hapus centang pada "Public bucket"). Kita akan membuat kebijakan agar file tetap aman.
- Buka **Policies** untuk bucket `evidence` dan buat kebijakan berikut:

  - **Policy untuk Melihat (SELECT):** Memberikan akses baca publik. URL yang dihasilkan Supabase sudah cukup acak untuk keamanan dasar.
    - **Policy Name**: `Allow public read access`
    - **Allowed operations**: `SELECT`
    - **Policy definition**: `true` (atau biarkan kosong)

  - **Policy untuk Mengunggah (INSERT):** Hanya izinkan pengguna yang sudah login untuk mengunggah.
    - **Policy Name**: `Allow authenticated uploads`
    - **Allowed operations**: `INSERT`
    - **Policy definition**: `auth.role() = 'authenticated'`

---

## Deployment ke Vercel

1.  **Push ke GitHub**: Pastikan kode terbaru Anda sudah ada di repositori GitHub.
2.  **Buat Proyek di Vercel**: Impor repositori GitHub Anda di Vercel.
3.  **Konfigurasi Proyek**:
    - **Framework Preset**: `Other`
    - **Build Command**: Biarkan kosong.
    - **Output Directory**: Biarkan kosong.
    - **Install Command**: Biarkan kosong.
4.  **Tambahkan Environment Variables**:
    - Di pengaturan proyek Vercel, buka tab "Settings -> Environment Variables".
    - Salin konten dari file `env.txt` Anda dan tempel. Vercel akan secara otomatis mengimpor semua variabel.
    - **WAJIB**: Isi nilai untuk `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan kredensial dari proyek Supabase Anda.
    - Atur `VITE_ADMIN_PASSWORD` dengan kata sandi yang kuat dan unik.
5.  **Deploy**: Klik tombol "Deploy". Vercel akan mempublikasikan aplikasi Anda.