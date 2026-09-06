# ============================================================
#  NUTRICENSE — Kartu judul & overlay untuk video promo
#  Dibuat dengan Pillow supaya tipografi dan warna merek
#  terkendali penuh (drawtext ffmpeg sulit di-escape di Windows
#  dan tidak bisa mengatur tracking / posisi presisi).
#
#  Keluaran: video/cards/*.png (1920x1080, RGBA untuk overlay)
#  python make_cards.py
# ============================================================

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cards')
os.makedirs(OUT, exist_ok=True)

W, H = 1920, 1080

# ── Palet merek (sama dengan css/tokens.css) ─────────────────
G500 = (47, 158, 95)
G600 = (33, 128, 73)
G700 = (27, 103, 60)
G100 = (220, 241, 225)
G050 = (240, 249, 242)
LIME = (140, 198, 63)
INK = (16, 34, 26)
INK2 = (67, 84, 73)
INK3 = (119, 137, 126)
WHITE = (255, 255, 255)

FONTS = 'C:/Windows/Fonts/'


def font(name, size):
    for f in (name, 'segoeuib.ttf', 'arialbd.ttf'):
        p = os.path.join(FONTS, f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


BOLD = lambda s: font('segoeuib.ttf', s)
REG = lambda s: font('segoeui.ttf', s)


def text_w(d, s, f):
    return d.textbbox((0, 0), s, font=f)[2]


def wrap(d, s, f, max_w):
    """Bungkus teks pada lebar maksimum, kembalikan daftar baris."""
    words, lines, cur = s.split(), [], ''
    for w_ in words:
        trial = (cur + ' ' + w_).strip()
        if text_w(d, trial, f) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ── Dekorasi ─────────────────────────────────────────────────

def blob_layer(size, seed=0, base=WHITE):
    """Gumpalan hijau lembut — versi raster dari dekorasi blobField().

    Digambar sebagai RGB di atas dasar putih, BUKAN RGBA: memblur RGBA
    yang piksel transparannya hitam membuat hitam merembes ke tepi dan
    meninggalkan kabut abu-abu (masalah alpha pramultiplikasi).
    """
    layer = Image.new('RGB', size, base)
    d = ImageDraw.Draw(layer)
    specs = [((-120, -180, 900, 720), G100),
             ((1180, -260, 2200, 640), (223, 240, 205)),
             ((980, 620, 2100, 1500), G050)]
    for i, (bbox, col) in enumerate(specs):
        x0, y0, x1, y1 = bbox
        off = (i + seed) * 18
        d.ellipse((x0 + off, y0 - off, x1 + off, y1 - off), fill=col)
    return layer.filter(ImageFilter.GaussianBlur(70))


def hexagon(d, cx, cy, r, color, width=0):
    pts = [(cx + r * math.cos(math.radians(60 * i - 90)),
            cy + r * math.sin(math.radians(60 * i - 90))) for i in range(6)]
    if width:
        d.polygon(pts, outline=color, width=width)
    else:
        d.polygon(pts, fill=color)


def logo_mark(img, cx, cy, r, ring=G600, dot=LIME):
    """Heksagon cincin + titik — konsisten dengan logo pada perangkat."""
    d = ImageDraw.Draw(img)
    hexagon(d, cx, cy, r, ring, width=max(3, int(r * 0.16)))
    hexagon(d, cx, cy, r * 0.34, dot)
    # Tiga percikan miring, mengambil dari monogram nc
    for i, (dx, ang) in enumerate(((-1.55, -22), (-1.15, 0), (-0.78, 22))):
        x = cx + r * dx
        y0 = cy - r * 0.95
        d.line([(x, y0), (x + r * 0.16 * math.sin(math.radians(ang)), y0 - r * 0.55)],
               fill=ring, width=max(3, int(r * 0.13)))


# ── Kartu ────────────────────────────────────────────────────

def card_title():
    img = Image.new('RGB', (W, H), WHITE)
    img.paste(blob_layer((W, H)), (0, 0))
    d = ImageDraw.Draw(img)

    logo_mark(img, W // 2, 300, 62)
    d = ImageDraw.Draw(img)

    f1 = BOLD(132)
    t = 'NUTRICENSE'
    d.text(((W - text_w(d, t, f1)) / 2, 400), t, font=f1, fill=G600)

    f2 = BOLD(40)
    sub = 'Smart Food Safety & Nutritional Assessment Box'
    d.text(((W - text_w(d, sub, f2)) / 2, 560), sub, font=f2, fill=INK)

    f3 = REG(32)
    for i, line in enumerate([
            'Verifikasi keamanan dan gizi setiap porsi',
            'program Makan Bergizi Gratis — sebelum sampai ke siswa.']):
        d.text(((W - text_w(d, line, f3)) / 2, 640 + i * 46), line, font=f3, fill=INK2)

    d.rounded_rectangle((W // 2 - 130, 780, W // 2 + 130, 838), radius=29, fill=G500)
    f4 = BOLD(26)
    tag = 'NC-BOX-09X'
    d.text(((W - text_w(d, tag, f4)) / 2, 795), tag, font=f4, fill=WHITE)

    img.save(os.path.join(OUT, 'title.png'))
    return 'title.png'


def card_end():
    img = Image.new('RGB', (W, H), (10, 18, 13))
    grad = Image.new('RGB', (W, H))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / H
        gd.line([(0, y), (W, y)],
                fill=(int(12 + 18 * (1 - t)), int(30 + 40 * (1 - t)), int(22 + 26 * (1 - t))))
    img = grad
    d = ImageDraw.Draw(img)

    logo_mark(img, W // 2, 330, 66, ring=(126, 217, 160), dot=(163, 209, 82))
    d = ImageDraw.Draw(img)

    f1 = BOLD(104)
    t = 'Setiap porsi, terverifikasi.'
    d.text(((W - text_w(d, t, f1)) / 2, 440), t, font=f1, fill=(238, 247, 240))

    f2 = REG(34)
    s = 'Kamera AI · 4 sensor presisi · Food Safety Index dalam < 60 detik'
    d.text(((W - text_w(d, s, f2)) / 2, 580), s, font=f2, fill=(168, 196, 178))

    d.rounded_rectangle((W // 2 - 210, 690, W // 2 + 210, 762), radius=36, fill=(47, 158, 95))
    f3 = BOLD(32)
    u = 'nutricense.web.app'
    d.text(((W - text_w(d, u, f3)) / 2, 710), u, font=f3, fill=WHITE)

    img.save(os.path.join(OUT, 'end.png'))
    return 'end.png'


def lower_third(name, title, sub):
    """Overlay transparan: pita kaca di kiri bawah."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    x, y = 120, H - 300
    f1, f2 = BOLD(56), REG(30)
    tw = max(text_w(d, title, f1), text_w(d, sub, f2)) + 130

    d.rounded_rectangle((x, y, x + tw, y + 150), radius=26, fill=(255, 255, 255, 232))
    d.rounded_rectangle((x, y, x + 10, y + 150), radius=5, fill=G500 + (255,))
    d.text((x + 42, y + 26), title, font=f1, fill=INK + (255,))
    d.text((x + 44, y + 96), sub, font=f2, fill=INK3 + (255,))

    img.save(os.path.join(OUT, name))
    return name


def spec_card(name, big, small):
    """Kartu angka besar untuk sisipan antar-shot."""
    img = Image.new('RGB', (W, H), WHITE)
    img.paste(blob_layer((W, H), seed=2), (0, 0))
    d = ImageDraw.Draw(img)

    f1 = BOLD(200)
    d.text(((W - text_w(d, big, f1)) / 2, 380), big, font=f1, fill=G600)
    f2 = BOLD(44)
    d.text(((W - text_w(d, small, f2)) / 2, 630), small, font=f2, fill=INK2)

    img.save(os.path.join(OUT, name))
    return name


if __name__ == '__main__':
    made = [card_title(), card_end()]
    made.append(lower_third('lt_reveal.png', 'NC-BOX-09X',
                            'Smart Nutrition Verification System'))
    made.append(lower_third('lt_screen.png', 'Hasil dalam hitungan detik',
                            'Food Safety Index · kalori · protein · suhu · NH3'))
    made.append(lower_third('lt_sensor.png', 'Kamera AI + 4 sensor presisi',
                            'ESP32-CAM · MLX90614 · MQ-135 · Load Cell HX711'))
    made.append(lower_third('lt_tray.png', 'Nampan MBG 4 sekat',
                            'Porsi ditimbang, dikenali, lalu dinilai otomatis'))
    made.append(spec_card('spec_60.png', '< 60', 'detik per pemindaian'))
    made.append(spec_card('spec_4.png', '4', 'sensor presisi dalam satu kotak'))
    for m in made:
        print('[cards]', m)
    print('[cards] ->', OUT)
