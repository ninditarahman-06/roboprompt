# RoboPrompt: Media Pembelajaran Interaktif KKA Fase F

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Media Pembelajaran Interaktif **Koding dan Kecerdasan Artifisial (KKA)** untuk jenjang SMK Fase F berbasis formula standar industri **R-T-C-F** (*Role, Task, Context, Format*). Aplikasi ini mengadopsi standar antarmuka kanvas 16:9 resmi **Ruang Murid Kemendikdasmen**, dipandu oleh mentor **3D Robot Virtual ("Robo-Prompt")** berbasis WebGL/Three.js, dan terhubung langsung ke **Groq AI (Llama 3.3 70B)**.

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

4. **Sub-Unit 3: RoboPrompt Studio (Powered by Groq AI)**:
   - **Formula Builder Murni**: Pengguna memasukkan kata atau kalimat sendiri ke dalam slot Role, Task, Context, Format (R-T-C-F) berstandar industri vokasi PPLG.
   - **Optimasi Cerdas AI**:
     - *⚡ Optimalkan dengan AI*: Groq AI menyatukan dan menyempurnakan keempat pilar R-T-C-F siswa menjadi satu teks prompt final yang terstruktur, kohesif, dan siap pakai secara langsung pada model AI.
     - *📋 Salin Prompt*: Satu klik untuk menyalin prompt final hasil generasi AI ke clipboard untuk langsung digunakan di platform AI nyata (ChatGPT, Groq, Claude, dsb).

5. **Sub-Unit 4: Evaluasi & Kuis Cerdas (25 Soal & Ambang Batas Skor 80)**:
   - 25 butir soal studi kasus CBT (Computer Based Test) berbobot 4 poin per soal (maksimal 100).
   - **Gerbang Kelulusan (KKTP $\ge 80$)**: Jika nilai $< 80$, siswa berstatus belum lulus dan sertifikat terkunci. Siswa harus mengulang evaluasi hingga mencapai skor minimal 80.
   - **Sertifikat Digital Canvas**: Jika seluruh sub-unit tuntas 100% dan nilai $\ge 80$, sertifikat resmi otomatis terbit di bawah menu Sub-4 dan siap diunduh (PNG) atau dicetak. Diterbitkan oleh Jurusan PPLG SMKN 1 Bawang, dilengkapi Logo SMKN 1 Bawang (kiri atas), Logo PPLG (kanan atas), serta tanda tangan elektronik (TTE) tersertifikasi BSSN dari Guru Mapel KKA Nindita Rahman, S. Kom.

---

## 🔑 Langkah 1: Mendapatkan Groq API Key Gratis (100% Free)

1. Kunjungi **Groq Cloud Console**: [https://console.groq.com/keys](https://console.groq.com/keys)
2. Masuk menggunakan akun **Google** atau **GitHub** Anda.
3. Klik tombol **"Create API key"**.
4. Beri nama bebas (misalnya `roboprompt`), lalu salin key yang berawalan `gsk_...`.
5. *API Key ini 100% gratis, bebas kartu kredit, dan menyediakan 14.400 request per hari.*

---

## 🐙 Langkah 2: Impor & Unggah Proyek ke GitHub

```bash
# Tambahkan semua file ke git
git add .

# Buat commit
git commit -m "feat: integrate Groq AI and clean UI"

# Push kode ke GitHub branch main
git push -u origin main
```

---

## 🚀 Langkah 3: Deploy ke Vercel (https://vercel.com/) [Disarankan]

Aplikasi ini sudah dilengkapi **Vercel Serverless Function** (`api/gemini.js`, `api/ai.js`, dan `vercel.json`), sehingga siap di-deploy langsung dari GitHub ke Vercel dalam 1 klik tanpa konfigurasi rumit.

### 1. Masuk & Hubungkan Repository ke Vercel
1. Buka dan login ke [https://vercel.com/](https://vercel.com/) menggunakan akun GitHub Anda.
2. Pada Dashboard Vercel, klik tombol **"Add New..."** $\rightarrow$ pilih **"Project"** (atau buka [https://vercel.com/new](https://vercel.com/new)).
3. Pada daftar repository GitHub, cari **`roboprompt`**, lalu klik tombol **"Import"**.

### 2. Konfigurasi Pengaturan Project
1. **Framework Preset**: Biarkan **"Other"** (default).
2. **Root Directory**: `./` (default).
3. **Build & Output Settings**: Biarkan default (file `vercel.json` sudah mengatur output ke root).

### 3. Tambahkan Environment Variable `GROQ_API_KEY` (Paling Penting!)
1. Buka bagian **"Environment Variables"**.
2. Masukkan:
   - **Key:** `GROQ_API_KEY`
   - **Value:** `<Tempel API Key Groq Anda yang berawalan gsk_...>`
3. Klik tombol **"Add"**.

### 4. Klik "Deploy"
1. Klik tombol biru **"Deploy"**.
2. Tunggu proses deploy sekitar 15–30 detik.
3. Vercel akan menerbitkan URL domain resmi Anda, misalnya: `https://roboprompt.vercel.app`.
4. Siswa dapat langsung menggunakan aplikasi dan tombol **"⚡ Optimalkan dengan AI"** tanpa perlu menyetel API Key di browser!
5. Setiap kali Anda melakukan `git push` ke branch `main`, Vercel akan otomatis meng-update aplikasi Anda!

---

## 💡 Mode Offline & Simulasi Cerdas

Jika dijalankan secara lokal tanpa koneksi internet atau tanpa server Vercel:
- RoboPrompt memiliki **Simulator Edukatif R-T-C-F cerdas bawaan** yang akan merangkai prompt siswa secara otomatis tanpa error, sehingga proses belajar mengajar tetap berlangsung lancar.

---

## 📜 Lisensi & Hak Cipta
Dikembangkan untuk mendukung pembelajaran vokasi SMK Koding dan Kecerdasan Artifisial (KKA) Fase F oleh **Jurusan Pengembangan Perangkat Lunak dan Gim (PPLG) SMKN 1 Bawang Banjarnegara**.
