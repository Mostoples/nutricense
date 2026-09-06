# ============================================================
#  NUTRICENSE — Showreel penggunaan aplikasi
#
#  Merangkai rekaman layar (video/app_clips/*.mp4) menjadi satu
#  showreel: tiap peran ditampilkan di dalam bingkai telepon,
#  dengan judul di sisi kanan. Bagian menggulir sengaja dipilih
#  sebagai isi utama tiap segmen.
#
#  python build_showreel.py [--fast]
# ============================================================

import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_video as B                                    # noqa: E402
from make_cards import (BOLD, REG, text_w, blob_layer,     # noqa: E402
                        logo_mark, G500, G600, G700, INK, INK2, INK3, WHITE)

CLIPS = os.path.join(HERE, 'app_clips')
SEG = os.path.join(HERE, 'reel_segments')
CARDS = os.path.join(HERE, 'cards')
os.makedirs(SEG, exist_ok=True)

FFMPEG = B.FFMPEG
Wd, Ht, FPS = 1920, 1080, 24
XF = 0.5
OUT = os.path.join(HERE, 'nutricense-showreel.mp4')

# ── Geometri bingkai telepon ─────────────────────────────────
SCR_W, SCR_H = 540, 1170            # ukuran rekaman asli
SCALE = 0.79
VW, VH = int(SCR_W * SCALE) // 2 * 2, int(SCR_H * SCALE) // 2 * 2   # genap untuk yuv420
BEZEL = 15
FW, FH = VW + BEZEL * 2, VH + BEZEL * 2
PHONE_X, PHONE_Y = 210, (Ht - FH) // 2      # posisi bingkai pada kanvas
VID_X, VID_Y = PHONE_X + BEZEL, PHONE_Y + BEZEL

# ── Segmen: (nama, klip, mulai, durasi, judul, subjudul) ─────
REEL = [
    ('r1_sekolah',    'app_sekolah.mp4',     4.0,  6.0,
     'Guru / Sekolah', 'Menu MBG hari ini, ringkasan, dan riwayat pemeriksaan'),
    ('r2_scan',       'app_sekolah.mp4',    18.5,  6.5,
     'Scan MBG', 'Pindai porsi, lalu cocokkan dengan data SPPG'),
    ('r3_sppg',       'app_sppg.mp4',        4.5,  7.0,
     'SPPG', 'Menu, bahan, nutrisi, dan pemeriksaan harian'),
    ('r4_pemerintah', 'app_pemerintah.mp4',  5.0,  7.0,
     'Pemerintah', 'Sebaran SPPG, tren Food Safety Index, laporan nasional'),
    ('r5_murid',      'app_murid.mp4',       6.0,  5.5,
     'Murid', 'Menu harian, informasi gizi, dan edukasi'),
]


# ════════════════════════════════════════════════════════════
#  Aset
# ════════════════════════════════════════════════════════════

def phone_frame():
    """Bingkai telepon: badan gelap membulat dengan lubang layar transparan."""
    path = os.path.join(CARDS, 'phone_frame.png')
    pad = 40
    img = Image.new('RGBA', (FW + pad * 2, FH + pad * 2), (0, 0, 0, 0))

    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (pad, pad + 12, pad + FW, pad + FH + 12), radius=58, fill=(12, 30, 22, 120))
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(26)))

    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad, pad + FW, pad + FH), radius=54, fill=(22, 26, 24, 255))
    d.rounded_rectangle((pad + 2, pad + 2, pad + FW - 2, pad + FH - 2),
                        radius=52, outline=(70, 78, 74, 255), width=2)
    # Lubang layar — dibuat benar-benar transparan
    hole = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(hole).rounded_rectangle(
        (pad + BEZEL, pad + BEZEL, pad + BEZEL + VW, pad + BEZEL + VH),
        radius=42, fill=(0, 0, 0, 255))
    img.paste((0, 0, 0, 0), (0, 0), hole)
    # Pil kamera depan
    d = ImageDraw.Draw(img)
    cx = pad + FW // 2
    d.rounded_rectangle((cx - 42, pad + BEZEL + 12, cx + 42, pad + BEZEL + 34),
                        radius=11, fill=(14, 16, 15, 255))
    img.save(path)
    return path, pad


def bg_card(name, title, sub, index, total):
    """Latar satu segmen: gumpalan hijau + judul di sisi kanan."""
    path = os.path.join(CARDS, name)
    img = Image.new('RGB', (Wd, Ht), WHITE)
    img.paste(blob_layer((Wd, Ht), seed=index * 3), (0, 0))
    d = ImageDraw.Draw(img)

    x = PHONE_X + FW + 130
    logo_mark(img, x + 26, 300, 26)
    d = ImageDraw.Draw(img)

    f0 = BOLD(24)
    d.text((x + 62, 288), 'NUTRICENSE', font=f0, fill=G600)

    f1 = BOLD(76)
    d.text((x, 370), title, font=f1, fill=INK)

    f2 = REG(32)
    words, line, y = sub.split(), '', 480
    maxw = Wd - x - 90
    for w in words:
        t = (line + ' ' + w).strip()
        if text_w(d, t, f2) <= maxw or not line:
            line = t
        else:
            d.text((x, y), line, font=f2, fill=INK2)
            y += 44
            line = w
    if line:
        d.text((x, y), line, font=f2, fill=INK2)

    # Penanda urutan segmen
    for i in range(total):
        on = i == index
        cx0 = x + i * 26
        d.rounded_rectangle((cx0, 700, cx0 + (18 if on else 12), 706),
                            radius=3, fill=G500 if on else (204, 219, 209))
    img.save(path)
    return path


def reel_title():
    path = os.path.join(CARDS, 'reel_title.png')
    img = Image.new('RGB', (Wd, Ht), WHITE)
    img.paste(blob_layer((Wd, Ht), seed=1), (0, 0))
    logo_mark(img, Wd // 2, 330, 58)
    d = ImageDraw.Draw(img)
    f1 = BOLD(104)
    t = 'Satu data, empat sudut pandang'
    d.text(((Wd - text_w(d, t, f1)) / 2, 430), t, font=f1, fill=G700)
    f2 = REG(36)
    s = 'Aplikasi Nutricense untuk Sekolah, SPPG, Pemerintah, dan Murid'
    d.text(((Wd - text_w(d, s, f2)) / 2, 570), s, font=f2, fill=INK2)
    img.save(path)
    return path


# ════════════════════════════════════════════════════════════
#  Segmen
# ════════════════════════════════════════════════════════════

def build_reel_segment(name, clip, start, dur, bg, frame, pad):
    out = os.path.join(SEG, name + '.mp4')
    fx = (
        "[0:v]scale=%d:%d:flags=lanczos,setsar=1[bg];"
        "[1:v]scale=%d:%d:flags=lanczos,setsar=1[scr];"
        "[bg][scr]overlay=%d:%d[a];"
        "[2:v]format=rgba[fr];"
        "[a][fr]overlay=%d:%d,format=yuv420p[v]"
        % (Wd, Ht, VW, VH, VID_X, VID_Y, PHONE_X - pad, PHONE_Y - pad)
    )
    cmd = [FFMPEG, '-y',
           '-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', bg,
           '-ss', str(start), '-t', str(dur), '-i', os.path.join(CLIPS, clip),
           '-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', frame,
           '-filter_complex', fx, '-map', '[v]'] + B.VCODEC + [out]
    B.run(cmd, name)
    return out


def main():
    missing = [c for _, c, *_ in REEL if not os.path.isfile(os.path.join(CLIPS, c))]
    if missing:
        raise SystemExit('Klip aplikasi belum ada: ' + ', '.join(sorted(set(missing))))

    frame, pad = phone_frame()
    title = reel_title()
    end = os.path.join(CARDS, 'end.png')

    segs = [(B.seg_from_card('r0_title', os.path.basename(title), 3.0), 3.0)]
    for i, (name, clip, start, dur, t, s) in enumerate(REEL):
        bg = bg_card('bg_%s.png' % name, t, s, i, len(REEL))
        segs.append((build_reel_segment(name, clip, start, dur, bg, frame, pad), dur))
    segs.append((B.seg_from_card('r9_end', os.path.basename(end), 3.0), 3.0))

    old_out = B.OUT
    B.OUT = OUT
    try:
        total = B.concat_xfade(segs)
    finally:
        B.OUT = old_out

    print('[reel] selesai: %s' % OUT)
    print('[reel] durasi %.2f s · %.1f MB' % (total, os.path.getsize(OUT) / 1048576))


if __name__ == '__main__':
    main()
