# Akun demo Nutricense

Empat akun Firebase sungguhan, satu per peran. Sengaja dibuka agar siapa pun
dapat mencoba aplikasi tanpa perlu dibuatkan akun.

Kata sandi sama untuk semuanya: **`nutricense2026`**

| Peran           | Pengenal di formulir | Email                       |
|-----------------|----------------------|-----------------------------|
| Guru / Sekolah  | NPSN `20312345`      | `guru.demo@nutricense.id`   |
| SPPG            | ID SPPG `SPPG0101`   | `sppg.demo@nutricense.id`   |
| Pemerintah      | `admin`              | `dinas.demo@nutricense.id`  |
| Murid           | NISN `0071234567`    | `siswa.demo@nutricense.id`  |

Formulir login menerima **pengenal maupun email**. Setiap layar login juga
menampilkan kartu kredensial dengan tombol **Isi & masuk** satu ketuk.

Coba langsung: <https://nutricense.web.app/app.html#/pilih-mode>

## Cara kerjanya di kode

`js/views/auth.js` berisi tabel `DEMO`. Setiap peran memetakan pengenal
alternatif (NPSN / ID SPPG / NISN) ke akun demo peran itu, lalu masuk lewat
Firebase `signInWithEmailAndPassword`. Pengguna non-demo tetap dapat masuk
dengan email + kata sandi mereka sendiri.

Provider yang aktif pada project `nutricense`: **Email/Password saja**.
Anonymous **tidak** aktif — jangan menambahkan jalur `signInAnonymous()`
karena akan selalu gagal dengan `ADMIN_ONLY_OPERATION`.

## Mengelola akun

Dibuat lewat REST API Identity Toolkit memakai Web API key publik:

```bash
KEY="AIzaSyBRSQubdIu1puvdt7LlbXBlQGKIem7zZwQ"
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"...","returnSecureToken":true}'
```

Menghapus: ambil `idToken` dari `accounts:signInWithPassword`, lalu POST ke
`accounts:delete`. Mengganti kata sandi juga dapat dilakukan dari Firebase
Console → Authentication → Users.

Bila kata sandi diubah, perbarui juga tabel `DEMO` di `js/views/auth.js` —
tombol "Isi & masuk" memakai nilai dari sana.

## Risiko yang perlu diketahui

`firestore.rules` saat ini mengizinkan **setiap pengguna terautentikasi**
menulis ke koleksi `scans`, `sensorLogs`, `alerts`, dan `schools`:

```
allow create, write: if isAuth();
```

Karena kata sandi demo bersifat publik, siapa pun yang menemukannya dapat
menulis ke koleksi tersebut. Untuk demo dengan data contoh hal ini masih wajar,
tetapi **sebelum ada data program yang sebenarnya, aturan ini harus
diperketat** — misalnya membatasi tulis berdasarkan klaim peran pada custom
claims, atau memisahkan project demo dari project produksi.

Aturan ini belum diubah karena menyangkut keputusan keamanan yang sebaiknya
Anda ambil sendiri.
