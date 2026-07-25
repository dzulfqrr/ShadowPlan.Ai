# Product Requirements Document (PRD)
## ShadowPlan AI
**By:** Blackone.Ai Group
**Version:** 1.0.0
**Date:** July 2026
**Target Environment:** Google Antigravity / Google Apps Script (Backend) & Google AI Studio (AI Engine)

---

## 1. Ringkasan Eksekutif (Executive Summary)
**ShadowPlan AI** adalah ruang kerja kecerdasan buatan (AI Workspace) kustom yang dirancang secara eksklusif untuk mengotomatisasi dan menyederhanakan alur kerja desain produk. Aplikasi ini bertindak sebagai jembatan cerdas antara ide kasar dari klien dan eksekusi antarmuka (UI/UX) di Google Stitch. Dengan memanfaatkan model **Google Gemini (3.5 Flash & 3.1 Pro)**, ShadowPlan AI mempercepat proses pembuatan dokumen standar industri seperti PRD, panduan desain (`design.md`), hingga meracik *prompt* siap pakai.

## 2. Tujuan Produk (Product Goals)
1. **Efisiensi Waktu:** Mengurangi waktu yang dihabiskan untuk menulis PRD dan spesifikasi desain secara manual.
2. **Standardisasi:** Menghasilkan dokumen `design.md` yang berorientasi pada komponen (*component-driven*) untuk menjaga konsistensi visual.
3. **Optimasi Output AI:** Memastikan *prompt* yang dikirimkan ke Google Stitch memiliki tingkat akurasi dan keselarasan 100% dengan kebutuhan proyek (dari PRD) dan pedoman visual (dari `design.md`).

---

## 3. Arsitektur Teknis & Tech Stack
*   **Frontend:** HTML5, Tailwind CSS (via CDN untuk styling), Vanilla JavaScript.
*   **Backend:** Google Antigravity / Google Apps Script (menangani logika *routing*, otentikasi, dan *API fetch*).
*   **Database:** Google Sheets (sebagai *database* ringan untuk menyimpan riwayat sesi pengguna dan kredensial login dasar).
*   **AI Engine:** Google AI Studio API (menggunakan model `gemini-3.5-flash` untuk kecepatan dan `gemini-3.1-pro` untuk *reasoning* kompleks).

---

## 4. Fitur Utama & Kebutuhan Fungsional (Functional Requirements)

### 4.1. Modul Otentikasi (Authentication)
*   **Deskripsi:** Sistem gerbang masuk bagi pengguna.
*   **Fitur:**
    *   **Sign Up / Daftar:** Kolom *First Name*, *Last Name*, *Email*, *Password*. (Mendukung integrasi Google Account / OAuth).
    *   **Login / Masuk:** Menggunakan *Email/Username* dan *Password*.
    *   **Logika Database:** Jika pengguna baru, data disimpan ke *spreadsheet* database. Jika sudah terdaftar, langsung diarahkan ke Halaman Dashboard.

### 4.2. Halaman Dashboard (AI Workspace)
*   **Layout:** Menggunakan formasi *Floating Window* dengan *sidebar* di kiri (gaya Zyricon).
*   **Navigasi Sidebar:** Berisi logo "ShadowPlan Ai by Blackone.Ai Group", tombol *New Chat*, riwayat obrolan, dan kotak penawaran Premium (berisi tombol *Upgrade* dan *Log out*).
*   **Model Selector:** *Dropdown* interaktif di kanan atas untuk memilih *engine* AI (Gemini 3.5 Flash atau Gemini 3.1 Pro).

### 4.3. Modul "Make PRD.md"
*   **Input:** Pengguna mengunggah gambar referensi (JPG/PNG/WEBP) atau dokumen kerangka kasar (PDF/DOC/MD), ditambah instruksi teks.
*   **Proses:** AI membedah input dan mengekstraksi informasi menjadi struktur PRD.
*   **Output:** Menghasilkan file teks berformat `PRD-[NamaProject].md` yang rapi dan terstruktur.

### 4.4. Modul "Make Design.md"
*   **Input:** Pengguna memberikan gambar referensi UI/UX (JPG/PNG/WEBP).
*   **Proses:** Fitur *Vision* pada Gemini menganalisis hierarki visual, palet warna, tipografi, dan komponen *state*.
*   **Output:** Menghasilkan file `design.md` yang berorientasi pada komponen (*component-driven*), siap digunakan sebagai aturan mutlak pembuatan UI.

### 4.5. Modul "Make Prompt to Stitch"
*   **Input:** Pengguna memasukkan data/file dari hasil tahap sebelumnya: `PRD.md` dan `design.md`.
*   **Proses:** AI melakukan *cross-reference* antara fitur yang dibutuhkan (PRD) dan batasan visual (design.md).
*   **Output:** AI meracik *prompt* instruksional yang sangat spesifik (padat dan terstruktur) untuk disalin dan ditempel (copy-paste) ke platform *generative UI* Google Stitch.

---

## 5. Panduan UI/UX (UI/UX Guidelines)
*   **Tema Utama:** *Dark Mode* (Mode Gelap) dengan sentuhan kaca (*Glassmorphism*).
*   **Aksen Warna:** 
    *   Background Login: Transisi hijau zamrud (*Emerald / Dark Forest*) dipadukan dengan hitam murni.
    *   Background Dashboard: *Deep Purple / Lilac* (sebagai latar belakang luar aplikasi) dan kaca gelap (*dark glass*) untuk antarmuka dalam.
*   **Tipografi:** *Sans-serif* bersih, modern, dengan ketebalan (weight) yang kontras antara judul dan teks tubuh.
*   **Layout Login:** *Split-screen* (kiri: proposi nilai & langkah, kanan: form input).

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)
*   **Keamanan API:** API Key Google AI Studio tidak boleh diekspos di ranah klien (Frontend). Panggilan API harus diproses di lapisan peladen/backend (Google Antigravity/GAS) menggunakan metode HTTP `POST` yang aman (seperti `UrlFetchApp` di ekosistem Google).
*   **Performa:** Batas waktu tunggu (timeout) untuk *generate* dokumen maksimal 15-20 detik. Sistem harus menampilkan animasi *loading* (pijar Orb) saat AI sedang bekerja.
*   **Responsivitas:** UI harus *fluid* dan dapat beradaptasi dengan baik pada berbagai ukuran layar desktop.

---
*Dokumen ini dibuat secara otomatis dan berfungsi sebagai panduan cetak biru pengembangan arsitektur di platform backend tujuan.*
