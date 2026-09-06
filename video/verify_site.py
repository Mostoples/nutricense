# ============================================================
#  NUTRICENSE — Pemeriksaan menyeluruh situs yang tayang
#  Memeriksa landing page, aset, video, model 3D, dan login
#  keempat peran. Keluar dengan kode 1 bila ada yang gagal.
#
#  python verify_site.py [--url https://nutricense.web.app]
# ============================================================

import io
import os
import statistics
import sys
import urllib.request

from PIL import Image
from playwright.sync_api import sync_playwright

URL = 'https://nutricense.web.app'
if '--url' in sys.argv:
    URL = sys.argv[sys.argv.index('--url') + 1]

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'shots')
os.makedirs(SHOTS, exist_ok=True)

fails = []
def check(name, ok, detail=''):
    print('%-4s %-38s %s' % ('OK' if ok else 'GAGAL', name, detail))
    if not ok:
        fails.append(name)


def brightness(png):
    im = Image.open(io.BytesIO(png)).convert('L')
    data = im.get_flattened_data() if hasattr(im, 'get_flattened_data') else list(im.getdata())
    return statistics.mean(data)


# ── 1. Aset statis: status + tipe konten ─────────────────────
ASSETS = [
    ('/', 'text/html'),
    ('/app.html', 'text/html'),
    ('/assets/video/nc-box-product.mp4', 'video/mp4'),
    ('/assets/video/nutricense-showreel.mp4', 'video/mp4'),
    ('/assets/img/product/01_hero.webp', 'image/webp'),
    ('/assets/img/product/04_chamber_sm.webp', 'image/webp'),
    ('/js/nc3d.js', 'javascript'),
    ('/css/tokens.css', 'text/css'),
]
print('── Aset ──')
for path, want in ASSETS:
    try:
        r = urllib.request.urlopen(URL + path, timeout=20)
        ct = r.headers.get('content-type', '')
        size = len(r.read())
        check(path, r.status == 200 and want in ct, '%s · %.0f KB' % (ct.split(';')[0], size / 1024))
    except Exception as e:
        check(path, False, str(e)[:80])

# Folder kerja tidak boleh tersaji sebagai berkas asli
print()
print('── Folder kerja tidak ter-deploy ──')
home = urllib.request.urlopen(URL + '/', timeout=20).read()
for path in ('/blender/nc_box.blend', '/video/build_video.py'):
    body = urllib.request.urlopen(URL + path, timeout=20).read()
    check(path, body == home, 'balas index.html (rewrite SPA), bukan berkas asli')

# ── 2. Landing page di peramban ──────────────────────────────
print()
print('── Landing page ──')
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader',
                                      '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = browser.new_context(viewport={'width': 1440, 'height': 950}, locale='id-ID')
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

    page.goto(URL + '/', wait_until='networkidle')
    page.wait_for_timeout(6000)

    hero = page.query_selector('#hero-3d')
    check('hero 3D merender', bool(hero) and brightness(hero.screenshot()) > 120,
          'kecerahan %.0f' % brightness(hero.screenshot()) if hero else 'kanvas tidak ada')

    # Gambar galeri memakai loading="lazy": harus digulir ke dalam
    # viewport dulu, kalau tidak naturalWidth memang masih 0.
    page.eval_on_selector('#gallery', 'e => e.scrollIntoView({block: "center"})')
    page.wait_for_timeout(3500)
    shots = page.eval_on_selector_all(
        '.shot img', 'els => els.filter(e => e.naturalWidth > 0).length')
    total_shots = page.eval_on_selector_all('.shot', 'els => els.length')
    check('galeri render termuat', shots >= 4 and shots == total_shots,
          '%d dari %d gambar' % (shots, total_shots))

    vids = page.eval_on_selector_all('.prod-video:not(.no-video)', 'els => els.length')
    check('blok video aktif', vids == 2, '%d blok' % vids)

    note = page.query_selector('.demo-note')
    check('kartu akun demo tampil', bool(note))
    if note:
        note.scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(SHOTS, 'site_demo_note.png'))

    check('tanpa error konsol', not errors, '; '.join(errors[:2])[:100])
    ctx.close()

    # ── 3. Login keempat peran ───────────────────────────────
    print()
    print('── Login akun demo ──')
    for role in ('sekolah', 'sppg', 'pemerintah', 'murid'):
        c = browser.new_context(viewport={'width': 430, 'height': 932}, locale='id-ID')
        pg = c.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL + '/app.html#/login/' + role, wait_until='networkidle')
        pg.wait_for_selector('[data-act="isi-demo"]', timeout=15000)
        pg.click('[data-act="isi-demo"]')
        ok = True
        try:
            pg.wait_for_function("h => location.hash.startsWith('#' + h)",
                                 arg='/' + role, timeout=20000)
            pg.wait_for_timeout(1200)
        except Exception:
            ok = False
        check('masuk sebagai %s' % role, ok and not errs,
              pg.evaluate('location.hash') + ('' if not errs else ' · ' + errs[0][:60]))
        c.close()
    browser.close()

print()
print('Hasil: %d gagal.' % len(fails) if fails else 'Hasil: semua pemeriksaan lolos.')
sys.exit(1 if fails else 0)
