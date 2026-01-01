
# 🛡️ Crypto Guard v3.3
> **Ultimate Anti-Poisoning & Clipboard Hijacking Defense Toolkit**

Crypto Guard adalah instrumen keamanan proaktif yang dirancang khusus untuk melindungi pengguna aset kripto dari serangan **Address Poisoning** dan **Clipboard Hijacking**. Aplikasi ini mengubah deretan karakter hexadecimal yang membingungkan menjadi identitas visual yang unik, memaksa otak manusia untuk melakukan verifikasi aktif sebelum melakukan transaksi.

---

## 🚀 Fitur Unggulan (The Defense Layers)

### 1. 🧩 Visual Fingerprinting (8x8 Grid)
Setiap alamat wallet menghasilkan pola warna dan bentuk yang unik berdasarkan algoritma SHA-256. 
* **Cara Kerja:** Alamat di-hash secara lokal, dan setiap byte menentukan warna dan skala blok pada grid. Jika satu karakter saja berubah, seluruh pola visual akan berubah total secara drastis.

### 2. 🎭 Emoji Identity Hash
Selain grid warna, aplikasi menghasilkan 4 kombinasi Emoji unik.
* **Mengapa Emoji?** Manusia jauh lebih cepat mengenali urutan "🚀 🛡️ 💎 🔥" daripada mengingat 4 karakter random seperti "0x7a...". Ini memberikan lapisan verifikasi instan.

### 3. 🧠 Human-In-The-Loop (HITL) Verification
Ini adalah fitur pertahanan terkuat kami melawan malware otomatis.
* **Mekanisme:** Tombol "Copy" terkunci secara default. Pengguna **wajib mengetik 3 karakter terakhir** alamat secara manual untuk membukanya.
* **Filosofi:** Malware bisa meniru klik, tapi malware tidak bisa meniru kesadaran manusia saat membaca dan mengetik ulang. Proses ini memaksa mata Anda melihat alamat asli tepat sebelum disalin.

### 4. 🔍 Mode Bandingkan (Side-by-Side Comparison)
Fitur deteksi *Address Poisoning* tingkat lanjut.
* Bandingkan alamat sumber (dari riwayat asli) dengan alamat tujuan (hasil copy atau scan).
* Jika terdeteksi perbedaan sekecil apapun, sistem akan memberikan peringatan visual merah yang berkedip (High-Alert).

### 5. 🛡️ Tamper Detection (Integrity Check)
Aplikasi memantau integritas lingkungannya sendiri.
* Jika ada skrip jahat atau ekstensi browser yang mencoba membajak fungsi dasar (`crypto.subtle` atau `navigator.clipboard`), aplikasi akan langsung memblokir akses dan memberikan peringatan **System Breach**.

---

## 🛠️ Cara Kerja Teknis

1.  **Zero-Knowledge Environment:** Tidak ada data yang dikirim ke server. Semua proses hashing dan analisis dilakukan 100% di browser Anda (Client-Side).
2.  **Heuristic Analysis:** Sistem menganalisis struktur alamat (EVM, Bitcoin, atau Solana) dan memisahkan bagian *prefix* dan *suffix* yang sering dipalsukan oleh penyerang.
3.  **Sanitized Clipboard Access:** Menggunakan kebijakan *Manual Pasting* (Ctrl+V) untuk menghindari manipulasi API clipboard oleh malware tingkat rendah di sandbox browser.

---

## 📖 Panduan Penggunaan

1.  **Paste Alamat:** Masukkan alamat wallet yang ingin Anda kirimkan dana.
2.  **Verifikasi Visual:** Lihat pola grid warna dan 4 emoji yang muncul. Hafalkan sejenak.
3.  **Buka Kunci (HITL):** Ketik 3 huruf terakhir dari alamat tersebut di kolom verifikasi.
4.  **Secure Copy:** Klik tombol "Secure Copy" untuk menyalin.
5.  **Final Check:** Saat Anda *Paste* di wallet tujuan (seperti MetaMask/TrustWallet), pastikan EMOJI dan grid-nya (jika Anda membukanya di dua tab) tetap identik.

---

## 💻 Tech Stack

*   **Framework:** React 19
*   **Styling:** Tailwind CSS (Modern Dark UI)
*   **Cryptography:** Web Crypto API (SubtleCrypto)
*   **Icons:** FontAwesome 6

---

## ⚠️ Disclaimer
Aplikasi ini adalah alat bantu verifikasi. Selalu lakukan pengecekan ganda pada perangkat keras (Hardware Wallet) Anda jika memungkinkan. Keamanan dana Anda adalah tanggung jawab Anda sepenuhnya.

---
**Build with ❤️ for the Decentralized World.**
