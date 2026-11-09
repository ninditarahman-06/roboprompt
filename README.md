# RoboPrompt: Media Pembelajaran Interaktif KKA Fase F

[![Netlify Status](https://api.netlify.com/api/v1/badges/deploy-status)](https://app.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Media Pembelajaran Interaktif **Koding dan Kecerdasan Artifisial (KKA)** untuk jenjang SMK Fase F berbasis formula standar industri **R-T-C-F** (*Role, Task, Context, Format*). Aplikasi ini mengadopsi standar antarmuka kanvas 16:9 resmi **Ruang Murid Kemendikdasmen**, dipandu oleh mentor **3D Robot Virtual ("Robo-Prompt")** berbasis WebGL/Three.js, dan terhubung langsung ke **Google Gemini AI**.

---

## 🌟 Fitur Utama

1. **Mentor 3D Robot Virtual ("Robo-Prompt")**:
   - Dibuat secara prosedural dengan **Three.js** meniru robot referensi (bodi keramik putih, visor kaca gelap, mata digital LED cyan, monitor hati di dada, dan tangan steker 2 pin logam).
   - Animasi interaktif: `IDLE`, `EXPLAIN` (dengan sintesis suara TTS), `CHEER` (loncat gembira + selebrasi), dan `CONFUSE` (bingung/miringkan kepala saat salah).

2. **Sub-Unit 1: Teori R-T-C-F**:
   - Eksplorasi 4 pilar formula (*Role, Task, Context, Format*), popup detail, dan komparasi prompt asal-asalan vs formula terstruktur.

3. **Sub-Unit 2: Klinik Mini Game "Prompt Doctor"**:
   - 5 studi kasus nyata bidang vokasi (K3 Bengkel, Python Login, Switch Cisco, Jingle TeFa, Laporan PKL).
   - Mekanisme **Drag & Drop** native dan susun urutan 4 pilar R-T-C-F, dilengkapi kepingan pengecoh (*distractor*).
   - Sistem skor 100 poin (20 poin/kasus) dan penerbitan resep prompt sembuh.

4. **Sub-Unit 3: RoboPrompt Studio (Powered by Google Gemini AI)**:
   - **Formula Builder Murni**: Pengguna memasukkan kata atau kalimat sendiri ke dalam slot Role, Task, Context, Format (R-T-C-F) berstandar industri vokasi PPLG.
   - **Optimasi Cerdas Google Gemini AI**:
     - *⚡ Optimalkan dengan Gemini AI*: Gemini menyatukan dan menyempurnakan keempat pilar R-T-C-F siswa menjadi satu teks prompt final yang terstruktur, kohesif, dan siap pakai secara langsung pada model AI.
     - *📋 Salin Prompt*: Satu klik untuk menyalin prompt final hasil generasi AI ke clipboard untuk langsung digunakan di platform AI nyata (ChatGPT, Gemini, Claude, dsb).

5. **Sub-Unit 4: Evaluasi & Kuis Cerdas (25 Soal & Ambang Batas Skor 80)**:
   - 25 butir soal studi kasus CBT (Computer Based Test) berbobot 4 poin per soal (maksimal 100).
   - **Gerbang Kelulusan (KKTP $\ge 80$)**: Jika nilai $< 80$, siswa berstatus belum lulus dan sertifikat terkunci. Siswa harus mengulang evaluasi hingga mencapai skor minimal 80.
   - **Sertifikat Digital Canvas**: Jika seluruh sub-unit tuntas 100% dan nilai $\ge 80$, sertifikat resmi otomatis terbit di bawah menu Sub-4 dan siap diunduh (PNG) atau dicetak. Diterbitkan oleh Jurusan PPLG SMKN 1 Bawang, dilengkapi Logo SMKN 1 Bawang (kiri atas), Logo PPLG (kanan atas), serta tanda tangan elektronik (TTE) tersertifikasi BSSN dari Guru Mapel KKA Nindita Rahman, S. Kom.

---

## 🔑 Langkah 1: Mendapatkan Google Gemini API Key Gratis

1. Kunjungi **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Masuk menggunakan akun Google Anda.
3. Klik tombol **"Get API key"** di menu navigasi kiri.
4. Klik **"Create API key"** (pilih project baru atau project yang sudah ada).
5. Salin string API key yang muncul (dimulai dengan `AIzaSy...`).
6. *Simpan API Key ini dengan aman untuk digunakan pada langkah Netlify.*

---

## 🐙 Langkah 2: Impor & Unggah Proyek ke GitHub

### 1. Inisialisasi Git di Komputer Anda
Buka Terminal / PowerShell di folder proyek ini (`d:\Aplikasi Buatan\RoboPrompt`):

```bash
# Inisialisasi repository git lokal
git init

# Pastikan file .gitignore sudah terpasang agar API key tidak bocor
git status

# Tambahkan semua file ke git
git add .

# Buat commit perdana
git commit -m "feat: initial commit RoboPrompt KKA with Gemini AI and Three.js"
```

### 2. Buat Repository Baru di GitHub
1. Buka [https://github.com/new](https://github.com/new).
2. Beri nama repository, misalnya: `roboprompt-kka`.
3. Pilih visibilitas **Public** atau **Private**.
4. Biarkan opsi "Initialize with README", ".gitignore", atau "license" **kosong (unchecked)** karena kita sudah membuatnya secara lokal.
5. Klik **Create repository**.

### 3. Hubungkan dan Push ke GitHub
Salin URL repository dari GitHub Anda, lalu jalankan di terminal:

```bash
# Ubah branch utama menjadi main
git branch -M main

# Hubungkan remote origin ke GitHub (ganti USERNAME dan REPO sesuai akun Anda)
git remote add origin https://github.com/USERNAME/roboprompt-kka.git

# Push kode ke GitHub
git push -u origin main
```

---

## 🚀 Langkah 3A: Deploy ke Vercel (https://vercel.com/) [Disarankan]

Aplikasi ini sudah dilengkapi **Vercel Serverless Function** (`api/gemini.js` dan `vercel.json`), sehingga siap di-deploy langsung dari GitHub ke Vercel dalam 1 klik tanpa konfigurasi rumit.

### 1. Masuk & Hubungkan Repository ke Vercel
1. Buka dan login ke [https://vercel.com/](https://vercel.com/) menggunakan akun GitHub Anda.
2. Pada Dashboard Vercel, klik tombol **"Add New..."** $\rightarrow$ pilih **"Project"** (atau buka [https://vercel.com/new](https://vercel.com/new)).
3. Pada daftar repository GitHub, cari **`roboprompt`**, lalu klik tombol **"Import"**.

### 2. Konfigurasi Pengaturan Project
1. **Framework Preset**: Biarkan **"Other"** (default).
2. **Root Directory**: `./` (default).
3. **Build & Output Settings**: Biarkan default (tidak perlu build command).

### 3. Tambahkan Environment Variable `GEMINI_API_KEY` (Paling Penting!)
1. Buka bagian **"Environment Variables"**.
2. Masukkan:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `<Tempel API Key Gemini Anda yang berawalan AIzaSy...>`
3. Klik tombol **"Add"**.

### 4. Klik "Deploy"
1. Klik tombol biru **"Deploy"**.
2. Tunggu proses deploy sekitar 15–30 detik.
3. Vercel akan menerbitkan URL domain resmi Anda, misalnya: `https://roboprompt.vercel.app`.
4. Setiap kali Anda melakukan `git push` ke branch `main`, Vercel akan otomatis meng-update aplikasi Anda!

---

## 🚀 Langkah 3B: Deploy ke Netlify (https://app.netlify.com/)

Aplikasi ini sudah dilengkapi arsitektur **Netlify Serverless Function** (`netlify/functions/gemini.js` dan `netlify.toml`), sehingga API Key Anda **100% aman dan tidak akan pernah bocor ke publik atau browser pengguna**.

### 1. Masuk & Hubungkan Repository ke Netlify
1. Buka dan login ke [https://app.netlify.com/](https://app.netlify.com/).
2. Pada dashboard Netlify, klik tombol **"Add new site"** $\rightarrow$ pilih **"Import an existing project"**.
3. Pilih penyedia Git: **GitHub**.
4. Berikan izin akses Netlify ke akun GitHub Anda, lalu pilih repository `roboprompt-kka`.

### 2. Konfigurasi Pengaturan Build
Netlify akan secara otomatis membaca file `netlify.toml` yang sudah disediakan:
- **Base directory:** Biarkan kosong (`/`)
- **Build command:** `echo 'Build OK'` (atau biarkan kosong)
- **Publish directory:** `.` (root directory)
- **Functions directory:** `netlify/functions`

### 3. Pasang Environment Variable `GEMINI_API_KEY` (Paling Penting!)
Sebelum mengklik deploy, masukkan API Key agar fungsi serverless dapat berjalan:
1. Klik menu dropdown **"Environment variables"** di halaman konfigurasi deploy (atau buka *Site configuration* $\rightarrow$ *Environment variables*).
2. Klik **"Add a variable"**.
3. Masukkan:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `<Tempel API Key Gemini Anda yang berawalan AIzaSy...>`
4. Klik **"Deploy roboprompt-kka"**.

### 4. Selesai & Uji Coba Situs!
1. Tunggu proses deploy sekitar 15–30 detik hingga statusnya menjadi **Published**.
2. Netlify akan memberikan URL live resmi, misalnya: `https://roboprompt-smk.netlify.app`.
3. Buka URL tersebut di browser.
4. Masuk ke **Sub-3 (RoboPrompt Studio)**, masukkan formula R-T-C-F buatan Anda sendiri, dan klik **"⚡ Optimalkan dengan Gemini AI"**. Gemini AI akan langsung merespons secara otomatis tanpa siswa perlu memasukkan API key lagi!

---

## 💡 Menjalankan Secara Offline / Lokal

Jika dijalankan secara lokal tanpa server Netlify (membuka file `index.html` langsung):
1. Anda dapat mengklik tombol **"🔑 Setel Gemini API"** di bagian atas Sub-3.
2. Tempelkan Google Gemini API Key Anda. Key tersebut akan tersimpan aman di `localStorage` peramban Anda.
3. Aplikasi juga memiliki *simulator fallback edukatif* sehingga tetap dapat digunakan jika tidak terdapat koneksi internet.

---

## 📜 Lisensi & Hak Cipta
Dikembangkan untuk mendukung pembelajaran vokasi SMK Koding dan Kecerdasan Artifisial (KKA) Fase F oleh **Jurusan Pengembangan Perangkat Lunak dan Gim (PPLG) SMKN 1 Bawang Banjarnegara**.
