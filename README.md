# Aplikasi Pencatat Pelanggaran Siswa

Selamat datang di Aplikasi Pencatat Pelanggaran Siswa! Ini adalah aplikasi web modern yang dirancang untuk membantu sekolah mencatat dan mengelola data pelanggaran siswa dengan mudah dan efisien.

Aplikasi ini seperti buku catatan digital yang canggih. Guru bisa login menggunakan akun Google, mencatat pelanggaran, menambahkan bukti foto, dan membuat laporan. Ada juga panel admin khusus dengan kata sandi rahasia untuk mengelola data master sekolah.

Panduan ini akan menuntun Anda, langkah demi langkah, untuk memasang dan menjalankan aplikasi ini secara online, bahkan jika Anda belum pernah menggunakan platform seperti GitHub, Supabase, atau Vercel sebelumnya.

---

## 🚀 Panduan Lengkap: Dari Nol Hingga Aplikasi Online

Mari kita mulai perjalanan ini! Ikuti langkah-langkah di bawah ini secara berurutan.

### Persiapan Awal: Akun yang Anda Butuhkan

Sebelum kita mulai, pastikan Anda memiliki dua hal ini. Keduanya gratis.

1.  **Akun GitHub**: Anggap saja GitHub adalah garasi online untuk menyimpan kode aplikasi kita. [Buat akun GitHub di sini](https://github.com/join).
2.  **Akun Google**: Anda pasti sudah punya. Ini akan kita gunakan untuk login guru dan untuk mengakses layanan Google.

---

### Langkah 1: Salin Kode Aplikasi ke "Garasi" Anda (GitHub)

Pertama, kita perlu membuat salinan pribadi dari kode aplikasi ini di akun GitHub Anda. Proses ini disebut "Fork".

1.  Login ke akun GitHub Anda.
2.  Buka halaman repositori kode aplikasi ini.
3.  Di pojok kanan atas halaman, Anda akan melihat tombol **"Fork"**. Klik tombol itu.
4.  GitHub akan menanyakan beberapa hal. Anda bisa langsung klik tombol **"Create fork"**.

Selamat! Sekarang Anda memiliki salinan kode aplikasi ini di "garasi" (akun GitHub) Anda sendiri.

---

### Langkah 2: Siapkan "Otak" Aplikasi (Supabase)

Setiap aplikasi butuh tempat untuk menyimpan data (seperti daftar siswa, guru, dan catatan pelanggaran). Kita akan menggunakan Supabase sebagai "otak" dan "lemari arsip" digital untuk aplikasi kita.

1.  **Buat Akun Supabase**: Buka [supabase.com](https://supabase.com/) dan daftar menggunakan akun GitHub Anda. Ini akan mempermudah proses nantinya.
2.  **Buat Proyek Baru**:
    - Setelah login, Anda akan masuk ke *dashboard*. Klik **"New Project"**.
    - Beri nama proyek Anda (misalnya, `aplikasi-pelanggaran-sekolah`).
    - Buat kata sandi database yang kuat dan simpan di tempat aman.
    - Pilih lokasi server yang paling dekat dengan Anda (misalnya, Singapura).
    - Klik **"Create new project"**. Butuh beberapa menit hingga proyek siap.
3.  **Siapkan "Lemari Arsip" (Database)**:
    - Setelah proyek siap, cari ikon **SQL Editor** di menu sebelah kiri (terlihat seperti lembaran kertas dengan tulisan SQL).
    - Klik **"+ New query"**.
    - **Salin (copy) seluruh kode di bawah ini** dan **tempel (paste)** ke dalam kotak editor SQL.
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
      teacher_id BIGINT NOT NULL REFERENCES teachers(id) ON DELETE SET NULL,
      student_ids INT[] NOT NULL, -- Array of student IDs
      violation_ids INT[] NOT NULL, -- Array of violation IDs
      photo_urls TEXT[], -- Array of photo URLs
      "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Aktifkan sistem keamanan (Row Level Security)
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE violation_records ENABLE ROW LEVEL SECURITY;

    -- Aturan #1: Izinkan pengguna yang sudah login untuk MEMBACA semua data
    CREATE POLICY "Allow authenticated read access" ON students FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated read access" ON teachers FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated read access" ON violations FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated read access" ON violation_records FOR SELECT USING (auth.role() = 'authenticated');

    -- Aturan #2: Izinkan pengguna yang sudah login untuk MENAMBAH data baru
    CREATE POLICY "Allow authenticated insert" ON violation_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated insert" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated insert" ON teachers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated insert" ON violations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    -- Aturan #3: Izinkan pengguna yang sudah login untuk MENGHAPUS data (penting untuk admin)
    CREATE POLICY "Allow authenticated delete" ON students FOR DELETE USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated delete" ON teachers FOR DELETE USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated delete" ON violations FOR DELETE USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated delete" ON violation_records FOR DELETE USING (auth.role() = 'authenticated');

    -- ---
    -- FUNGSI DATABASE (RPC) UNTUK MANAJEMEN DATA
    -- ---
    -- Catatan: Fungsi di bawah ini menggunakan `SECURITY DEFINER`. Ini berarti fungsi berjalan
    -- dengan hak akses dari pemilik fungsi (biasanya admin database), yang memungkinkannya
    -- untuk melakukan operasi hapus massal dengan aman dan cepat. Izin untuk MENJALANKAN 
    -- fungsi ini tetap dibatasi hanya untuk pengguna yang sudah login (`authenticated`).

    -- Fungsi untuk menghapus semua data dari tabel yang diizinkan dan mereset ID sequence
    CREATE OR REPLACE FUNCTION truncate_tables(table_names TEXT[])
    RETURNS VOID AS $$
    DECLARE
        table_name TEXT;
    BEGIN
        -- Loop melalui setiap nama tabel yang diberikan
        FOREACH table_name IN ARRAY table_names
        LOOP
            -- Validasi untuk memastikan hanya tabel yang aman yang bisa diubah
            IF table_name IN ('students', 'teachers', 'violations', 'violation_records') THEN
                -- TRUNCATE menghapus semua data dengan cepat dan RESTART IDENTITY mereset auto-increment ID
                EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', table_name);
            ELSE
                -- Jika nama tabel tidak valid, lemparkan error
                RAISE EXCEPTION 'Operasi TRUNCATE tidak diizinkan untuk tabel: %', table_name;
            END IF;
        END LOOP;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Memberikan izin kepada pengguna yang sudah login untuk menjalankan fungsi ini
    GRANT EXECUTE ON FUNCTION truncate_tables(TEXT[]) TO authenticated;
    ```
    - Klik tombol hijau **"RUN"**. Jika berhasil, Anda akan melihat pesan "Success. No rows returned".
4.  **Siapkan "Gudang Foto" (Storage)**:
    - Cari ikon **Storage** di menu sebelah kiri.
    - Klik **"Create a new bucket"**.
    - Isi **Bucket name** dengan `evidence` (ini wajib, harus sama persis).
    - **PENTING**: Pastikan kotak **Public bucket** **TIDAK DICENTANG**.
    - Klik **"Create bucket"**.
    - Setelah bucket dibuat, klik ikon tiga titik di sebelah kanan nama bucket `evidence`, lalu pilih **"Policies"**.
    - Di bawah bagian **"Bucket policies"**, klik **"+ New Policy"**.
    - Pilih **"Create a new policy from scratch"**.
    - Buat aturan pertama untuk **mengizinkan upload**:
        - **Policy name**: `Allow authenticated uploads`
        - **Allowed operations**: Centang `INSERT` saja.
        - **Policy definition**: Tulis `auth.role() = 'authenticated'`
        - Klik **"Review"**, lalu **"Save policy"**.
    - Buat aturan kedua untuk **mengizinkan lihat foto**:
        - Klik **"+ New Policy"** lagi.
        - **Policy name**: `Allow public read access`
        - **Allowed operations**: Centang `SELECT` saja.
        - **Policy definition**: Biarkan kosong atau tulis `true`
        - Klik **"Review"**, lalu **"Save policy"**.
5.  **Buat Akun Khusus Admin (WAJIB)**:
    - Di *dashboard* Supabase, pergi ke **Authentication** (ikon pengguna) di menu sebelah kiri.
    - Di bawah tab **"Users"**, klik tombol **"+ Add user"**.
    - **Metode**: Pilih **Email**.
    - **Email**: Masukkan alamat email yang akan Anda gunakan untuk admin (misalnya, `admin-sekolah@youremail.com` - *email ini tidak harus benar-benar ada*). **Salin (copy) email ini**, kita akan membutuhkannya untuk variabel `VITE_ADMIN_EMAIL`.
    - **Password**: Masukkan kata sandi yang kuat. **PENTING**: Gunakan kata sandi yang sama persis dengan yang akan Anda atur di variabel `VITE_ADMIN_PASSWORD`.
    - Biarkan **"Auto Confirm User"** dalam keadaan **ON**.
    - Klik **"Create user"**.

"Otak" dan "lemari arsip" aplikasi Anda sekarang sudah siap!

---

### Langkah 3: Minta Izin ke Google (Google Cloud Console)

Agar guru bisa login dengan akun Google, kita harus mendaftarkan aplikasi kita ke Google. Ini seperti meminta "surat izin" resmi. Bagian ini mungkin terlihat rumit, tapi ikuti saja pelan-pelan.

1.  **Buka Google Cloud Console**: Klik [di sini](https://console.cloud.google.com/) dan login dengan akun Google Anda.
2.  **Buat Proyek Baru**:
    - Di bagian atas, klik menu dropdown proyek (mungkin tulisannya "Select a project").
    - Klik **"NEW PROJECT"**.
    - Beri nama proyek (misalnya, `Aplikasi Pelanggaran Sekolah`) dan klik **"CREATE"**.
3.  **Siapkan Layar Izin (Consent Screen)**: Ini adalah halaman yang dilihat pengguna saat login Google.
    - Di menu pencarian atas, ketik `OAuth consent screen` dan pilih hasilnya.
    - Pilih **"External"** dan klik **"CREATE"**.
    - Isi formulir:
        - **App name**: Nama aplikasi Anda (misalnya, `Aplikasi Pelanggaran SMA Impian Bangsa`).
        - **User support email**: Pilih alamat email Anda.
        - **Developer contact information**: Isi lagi alamat email Anda.
    - Klik **"SAVE AND CONTINUE"** di semua langkah berikutnya (Scopes, Test users) hingga selesai. Klik **"BACK TO DASHBOARD"**.
4.  **Dapatkan Kunci Rahasia (Credentials)**:
    - Di menu sebelah kiri, klik **"Credentials"**.
    - Klik **"+ CREATE CREDENTIALS"** di bagian atas, lalu pilih **"OAuth client ID"**.
    - **Application type**: Pilih **"Web application"**.
    - **Name**: Biarkan default atau beri nama `Web Client 1`.
    - **PENTING - Authorized redirect URIs**:
        - Buka tab browser baru dan kembali ke *dashboard* Supabase Anda.
        - Di Supabase, pergi ke **Authentication -> Providers -> Google**.
        - Anda akan melihat tulisan **"Redirect URL (Callback URL)"**. **Salin (copy) URL tersebut**.
        - Kembali ke Google Cloud Console. Di bawah **"Authorized redirect URIs"**, klik **"+ ADD URI"** dan **tempel (paste) URL dari Supabase tadi**.
    - Klik **"CREATE"**.
5.  **Simpan Kunci Rahasia Anda**:
    - Sebuah jendela akan muncul menampilkan **"Your Client ID"** dan **"Your Client Secret"**.
    - **Salin (copy) kedua nilai ini** dan simpan di tempat aman (misalnya di Notepad). Kita akan segera membutuhkannya.
6.  **Berikan Kunci ke Supabase**:
    - Kembali ke *dashboard* Supabase (di halaman Google Provider).
    - **Tempel (paste) Client ID** yang Anda salin dari Google ke kolom **"Client ID"**.
    - **Tempel (paste) Client Secret** yang Anda salin dari Google ke kolom **"Client Secret"**.
    - Klik **"Save"**.

Luar biasa! Anda berhasil menghubungkan Supabase dengan Google.

---

### Langkah 4: Publikasikan Aplikasi ke Internet (Vercel)

Sekarang saatnya "menerbitkan" aplikasi Anda agar bisa diakses oleh siapa saja melalui internet. Kita akan menggunakan Vercel.

1.  **Buat Akun Vercel**: Buka [vercel.com](https://vercel.com/) dan daftar menggunakan akun **GitHub** Anda.
2.  **Impor Proyek Anda**:
    - Setelah login, Anda akan masuk ke *dashboard*. Klik **"Add New... -> Project"**.
    - Vercel akan menampilkan daftar repositori dari akun GitHub Anda. Temukan repositori aplikasi yang sudah Anda *fork* tadi dan klik **"Import"**.
3.  **Konfigurasi Proyek**:
    - **Project Name**: Biarkan default atau ubah sesuai keinginan.
    - **PENTING! Framework Preset**: Klik dropdown dan pilih **`Vite`**. Ini adalah langkah kunci agar Vercel tahu cara membangun aplikasi Anda dengan benar.
    - Buka bagian **Environment Variables**. Di sinilah kita akan memasukkan semua "kunci rahasia" dan pengaturan.
4.  **Isi Environment Variables**:
    - Di file kode aplikasi, ada file bernama `env.txt`. Kita akan mengisi nilai-nilai ini di Vercel.
    - **`VITE_SUPABASE_URL`**:
        - Kembali ke *dashboard* Supabase Anda.
        - Pergi ke **Project Settings** (ikon gerigi) -> **API**.
        - Di bawah **Project URL**, salin URL-nya dan tempel di kolom *value* di Vercel.
    - **`VITE_SUPABASE_ANON_KEY`**:
        - Di halaman yang sama di Supabase, di bawah **Project API Keys**, salin kunci yang berlabel `anon` `public`.
        - Tempel di kolom *value* di Vercel.
    - **`VITE_SCHOOL_NAME`**: Isi dengan nama lengkap sekolah Anda (misal: `Sekolah Menengah Atas Impian Bangsa`).
    - **`VITE_SCHOOL_SHORT_NAME`**: Isi dengan nama singkat sekolah (misal: `SMA Impian Bangsa`).
    - **`VITE_ADMIN_EMAIL`**: Isi dengan email yang Anda buat untuk akun admin di Supabase Auth pada Langkah 2.5.
    - **`VITE_ADMIN_PASSWORD`**: **Buat kata sandi yang kuat dan unik**. Kata sandi ini HARUS SAMA dengan yang Anda atur untuk user admin di Supabase Auth.
    - Pastikan Anda menambahkan semua variabel di atas.
5.  **Deploy**: Klik tombol **"Deploy"**. Vercel akan mulai membangun dan mempublikasikan aplikasi Anda. Proses ini mungkin memakan waktu beberapa menit.

---

### Langkah 5: Selesai!

Setelah Vercel selesai, aplikasi Anda sudah online! Vercel akan memberikan Anda sebuah URL (misalnya, `nama-proyek-anda.vercel.app`).

- **Untuk login sebagai guru**: Gunakan tombol "Masuk dengan Google". Pastikan email Google Anda sudah ditambahkan ke tabel `teachers` di Supabase.
- **Untuk login sebagai admin**: Gunakan form login admin dan masukkan kata sandi yang Anda atur di Vercel (`VITE_ADMIN_PASSWORD`).

## Catatan Tambahan: Batasan Unggah Data

Supabase memiliki batasan teknis di mana aplikasi klien (seperti aplikasi web ini) hanya dapat mengirim sekitar 1000 baris data dalam satu kali permintaan. Aplikasi ini menangani batasan tersebut sebagai berikut:
- **Unggah Data Excel**: Untuk menjaga integritas data dan memberikan umpan balik yang baik, aplikasi memproses data dalam potongan-potongan kecil. Ini memungkinkan unggahan file besar namun mungkin memakan waktu lebih lama.
- **Backup & Restore**: Fitur backup dan restore dapat menangani data lebih dari 1000 baris dengan memprosesnya secara cerdas dalam potongan-potongan yang lebih kecil.
- **Rekomendasi**: Jika Anda memiliki file Excel dengan lebih dari 1000 baris, disarankan untuk membaginya menjadi beberapa file yang lebih kecil untuk proses unggah yang lebih lancar.