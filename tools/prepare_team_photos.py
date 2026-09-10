# ============================================================
#  NUTRICENSE — Siapkan foto tim untuk web
#
#  Mengubah potret studio seluruh badan (langsung dari kamera)
#  menjadi berkas yang dipakai situs: assets/img/team-1.jpg …
#
#  Tiga hal yang dikerjakan, dan alasannya:
#
#  1. EXIF orientation diterapkan. Sebagian berkas menyimpan
#     rotasi di metadata, bukan pada pikselnya.
#  2. Dipotong ke KEPALA + BADAN, bukan seluruh tinggi badan.
#     Kartu tim hanya selebar ~168 px; potret seluruh badan
#     membuat wajah tinggal beberapa piksel. Subjek dicari
#     otomatis dengan membandingkan piksel terhadap warna
#     latar studio yang disampel dari sudut gambar.
#  3. Diperkecil ke 800x1066 (3:4, sesuai rasio kartu) dan
#     disimpan ulang sebagai JPEG — berkas 26 MP 3,5 MB tidak
#     ada gunanya untuk kartu sekecil itu.
#
#  python tools/prepare_team_photos.py [--sheet]
# ============================================================

import glob
import os
import sys

from PIL import Image, ImageOps, ImageChops, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG = os.path.join(ROOT, 'assets', 'img')

OUT_W, OUT_H = 800, 1066          # 3:4, sama dengan rasio kartu tim
QUALITY = 82

# Berapa bagian tinggi badan yang masuk bingkai, dan berapa ruang
# di atas kepala. Angka ini hasil coba-coba pada set foto ini.
# Rentang gelap yang terdeteksi membentang dari BAHU sampai KAKI
# (~47% tinggi frame pada set ini) — kepala tidak ikut karena wajah
# dan kerudung putih berada di atas ambang gelap. Kedua angka di
# bawah dinyatakan sebagai kelipatan rentang itu:
#   kepala manusia ≈ 0,16 x (bahu→kaki), pinggang ≈ 0,42 di bawah bahu.
HEAD_ABOVE = 0.24                 # naik dari garis bahu, cukup untuk kepala
CROP_TALL = 0.70                  # tinggi potongan: kepala sampai sekitar pinggul


def find_person(im):
    """Temukan jas subjek: (atas, bawah, titik tengah x).

    Subjek dikenali dari KEGELAPAN, bukan dari selisih terhadap
    warna sudut. Alasannya terukur: pada set foto ini dinding dan
    lantai berada di sekitar luminansi 196–207, sementara jas,
    rambut, dan sepatu di sekitar 45–65. Sampel sudut sempat
    dipakai dan gagal — sebagian foto punya sudut gelap (lampu
    studio), sehingga ambangnya melenceng dan hampir seluruh
    bingkai terbaca sebagai subjek (bahu terukur 69% lebar).

    Yang ditemukan membentang dari bahu sampai kaki: wajah dan
    kerudung putih lebih terang daripada ambang, jadi kepala tidak
    ikut. Posisi kepala diperkirakan dari proporsi tubuh manusia
    saat memotong.
    """
    k = 8
    g = im.convert('L').resize((im.width // k, im.height // k))
    w, h = g.size
    px = g.load()

    vals = sorted(g.get_flattened_data() if hasattr(g, 'get_flattened_data')
                  else list(g.getdata()))
    median = vals[len(vals) // 2]
    thr = median - 55                      # jas & rambut jatuh jauh di bawah ini

    # Hanya 40% bagian TENGAH yang dipindai. Beberapa foto punya
    # peralatan studio gelap di sudut atas; dengan jendela lebar,
    # benda itu terbaca sebagai 'kepala' di baris 0.
    x_lo, x_hi = int(w * 0.30), int(w * 0.70)
    min_run = max(3, int((x_hi - x_lo) * 0.12))

    dark_rows = []
    for y in range(h):
        n = sum(1 for x in range(x_lo, x_hi) if px[x, y] < thr)
        if n >= min_run:
            dark_rows.append(y)

    if len(dark_rows) < h * 0.10:
        return None

    # Ambil rentang bersambung TERPANJANG, bukan baris gelap pertama
    # sampai terakhir. Sebagian foto punya palang gelap di tepi atas
    # bingkai (tepi backdrop); tanpa langkah ini palang itu terbaca
    # sebagai kepala pada baris 0 dan potongannya jadi seluruh frame.
    runs, cur = [], [dark_rows[0], dark_rows[0]]
    for y in dark_rows[1:]:
        if y - cur[1] <= 2:            # celah 1–2 baris masih dianggap satu
            cur[1] = y
        else:
            runs.append(tuple(cur)); cur = [y, y]
    runs.append(tuple(cur))
    shoulder_y, feet_y = max(runs, key=lambda r: r[1] - r[0])

    if feet_y - shoulder_y < h * 0.15:
        return None

    # Titik tengah horizontal diambil dari pusat gambar, bukan dari
    # lebar bahu terukur: pengukuran itu terbukti rapuh (sempat
    # menghasilkan 8% pada satu foto dan 69% pada yang lain),
    # sementara subjek pada seluruh set ini selalu di tengah.
    return (shoulder_y * k, feet_y * k, im.width // 2)


def crop_head_and_torso(im):
    """Potong 3:4 berisi kepala dan badan atas subjek."""
    found = find_person(im)
    if not found:
        cw = min(im.width, int(im.height * 3 / 4))
        cx = im.width // 2
        return im.crop((cx - cw // 2, 0, cx + cw // 2, min(im.height, int(cw * 4 / 3))))

    shoulder_y, feet_y, cx = found
    span = feet_y - shoulder_y

    ch = int(span * CROP_TALL)
    cw = int(ch * OUT_W / OUT_H)

    if cw > im.width:
        cw, ch = im.width, int(im.width * OUT_H / OUT_W)
    if ch > im.height:
        ch, cw = im.height, int(im.height * OUT_W / OUT_H)

    top = int(shoulder_y - span * HEAD_ABOVE)
    left = min(max(cx - cw // 2, 0), im.width - cw)
    top = min(max(top, 0), im.height - ch)
    return im.crop((left, top, left + cw, top + ch))


def main():
    sources = sorted(glob.glob(os.path.join(IMG, 'IMG_*')))
    if not sources:
        raise SystemExit('Tidak ada berkas IMG_* di ' + IMG)

    made = []
    for i, src in enumerate(sources, start=1):
        im = ImageOps.exif_transpose(Image.open(src))
        crop = crop_head_and_torso(im)
        out_im = ImageOps.contain(crop, (OUT_W * 2, OUT_H * 2))
        out_im = out_im.resize((OUT_W, OUT_H), Image.LANCZOS).convert('RGB')

        dst = os.path.join(IMG, 'team-%d.jpg' % i)
        out_im.save(dst, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        made.append(dst)
        print('%-30s -> %-14s %5.0f KB -> %4.0f KB' % (
            os.path.basename(src), os.path.basename(dst),
            os.path.getsize(src) / 1024, os.path.getsize(dst) / 1024))

    if '--sheet' in sys.argv:
        sheet = Image.new('RGB', (OUT_W // 2 * 3, OUT_H // 2 * 2), (240, 244, 241))
        for i, f in enumerate(made):
            t = Image.open(f).resize((OUT_W // 2, OUT_H // 2), Image.LANCZOS)
            sheet.paste(t, ((i % 3) * (OUT_W // 2), (i // 3) * (OUT_H // 2)))
        p = os.path.join(ROOT, 'video', 'shots', '_team_result.png')
        os.makedirs(os.path.dirname(p), exist_ok=True)
        sheet.save(p)
        print('\npratinjau ->', p)

    print('\n%d foto siap. Urutannya mengikuti urutan nama berkas sumber;' % len(made))
    print('sunting array TEAM di js/site.js untuk mencocokkan nama dan peran.')


if __name__ == '__main__':
    main()
