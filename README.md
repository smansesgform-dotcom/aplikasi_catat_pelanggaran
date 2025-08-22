# Aplikasi Pencatat Pelanggaran Siswa

Aplikasi web modern untuk mencatat dan mengelola data pelanggaran siswa di lingkungan sekolah. Dibangun dengan antarmuka yang responsif dan intuitif, aplikasi ini memudahkan guru dan staf administrasi untuk memantau perilaku siswa secara efisien.

## Fitur Utama

- **Sistem Otentikasi**:
  - **Login Guru**: Guru dapat masuk menggunakan akun Google mereka (email harus terdaftar di data guru).
  - **Login Admin Khusus**: Terdapat akun admin super yang dapat login menggunakan kata sandi khusus yang disimpan di _environment variable_, memberikan akses penuh ke panel admin.
- **Rute Terlindungi**: Halaman pencatatan dan administrasi hanya dapat diakses setelah login, meningkatkan keamanan data.
- **Pencatatan Pelanggaran**: Memungkinkan pencatatan pelanggaran untuk satu atau beberapa siswa sekaligus dalam satu entri.
- **Seleksi Ganda**: Pengguna dapat memilih lebih dari satu jenis pelanggaran yang dilakukan siswa pada saat yang bersamaan.
- **Pencarian Cerdas**: Kotak pencarian siswa yang dinamis, memungkinkan pencarian berdasarkan Nama, NIPD, atau NISN dengan cepat.
- **Panel Admin**: Halaman khusus admin untuk mengelola data master.
- **Unggah Data Massal**: Admin dapat mengunggah data siswa, guru, dan jenis pelanggaran secara massal menggunakan file Excel (.xlsx).
- **Template Excel**: Disediakan tombol untuk mengunduh template Excel yang sudah diformat untuk setiap jenis data, meminimalisir kesalahan input.
- **Desain Responsif**: Tampilan yang optimal di berbagai perangkat, mulai dari desktop hingga ponsel.
- **Umpan Balik Instan**: Notifikasi _real-time_ untuk setiap aksi yang berhasil atau gagal, memberikan pengalaman pengguna yang lebih baik.

## Teknologi yang Digunakan

- **Frontend**: React, TypeScript
- **Manajemen State**: React Context API
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Excel Handling**: `xlsx` (SheetJS)
- **Backend (Simulasi)**: Layanan mock yang meniru API Supabase. Siap untuk diintegrasikan dengan Supabase sungguhan.

## Struktur Proyek

```
.
├── components/         # Komponen React yang dapat digunakan kembali
├── context/            # Konteks React untuk manajemen state (AuthContext)
├── pages/              # Komponen utama untuk setiap halaman/rute
├── services/           # Logika untuk berinteraksi dengan backend
├── types.ts            # Definisi tipe dan interface TypeScript
├── App.tsx             # Komponen root aplikasi dan pengaturan routing
├── index.html          # File HTML utama
├── index.tsx           # Titik masuk aplikasi React
├── env.txt             # Template untuk variabel lingkungan
└── README.md           # Dokumentasi proyek
```

## Instalasi dan Menjalankan Secara Lokal

Aplikasi ini dirancang untuk kemudahan tanpa memerlukan proses _build_ yang kompleks.

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/username/nama-repo.git
    cd nama-repo
    ```

2.  **Variabel Lingkungan**
    Ganti nama file `env.txt` menjadi `.env` (atau cukup gunakan `env.txt` sebagai referensi). Isi nilai-nilai variabel di dalamnya, terutama `VITE_ADMIN_PASSWORD`.
    ```bash
    cp env.txt .env
    ```

3.  **Menjalankan Aplikasi**
    Tidak perlu `npm install`. Cukup buka file `index.html` menggunakan _live server_ (misalnya, ekstensi "Live Server" di Visual Studio Code).

## Panduan Penggunaan

### Login
1.  Buka aplikasi, Anda akan diarahkan ke halaman Login.
2.  **Untuk Guru**: Klik "Masuk dengan Google". Aplikasi ini (saat ini dalam mode simulasi) akan memverifikasi apakah email Anda terdaftar dalam data guru.
3.  **Untuk Admin**: Masukkan kata sandi admin pada kolom yang tersedia dan klik "Masuk sebagai Admin".

### Mencatat Pelanggaran (Setelah Login)
1.  Buka halaman **Catat Pelanggaran**.
2.  Di kotak "Cari Siswa", ketik nama, NIPD, atau NISN siswa. Pilih siswa dari daftar.
3.  Di kotak "Jenis Pelanggaran", ketik nama pelanggaran. Pilih pelanggaran dari daftar.
4.  Pilih "Guru Pelapor" dari menu dropdown.
5.  Klik tombol **Simpan Catatan**.

### Mengelola Data di Panel Admin (Hanya Admin)
1.  Buka halaman **Admin**.
2.  Pilih jenis data yang ingin diunggah (Siswa, Guru, atau Pelanggaran).
3.  Klik **Unduh Template** untuk mendapatkan file Excel dengan format yang benar.
4.  Isi data ke dalam template.
5.  Kembali ke aplikasi, pilih file yang sudah Anda isi, lalu klik **Unggah File**.

## Deployment ke Vercel

1.  **Push ke GitHub**: Pastikan kode terbaru Anda sudah ada di repositori GitHub.
2.  **Buat Proyek di Vercel**: Impor repositori GitHub Anda di Vercel.
3.  **Konfigurasi Proyek**:
    - **Framework Preset**: `Other`
    - **Build Command**: Biarkan kosong.
    - **Output Directory**: Biarkan kosong.
4.  **Tambahkan Environment Variables**:
    - Di pengaturan proyek Vercel, buka tab "Settings -> Environment Variables".
    - Salin dan tempel konten dari file `env.txt` Anda. Vercel akan secara otomatis mengimpor semua variabel. Pastikan Anda menggunakan nilai produksi yang aman, terutama untuk `VITE_ADMIN_PASSWORD`.
5.  **Deploy**: Klik tombol "Deploy". Vercel akan mempublikasikan aplikasi Anda.
